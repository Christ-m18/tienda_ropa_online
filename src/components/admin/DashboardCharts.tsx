'use client'

import { useQuery } from '@tanstack/react-query'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { AdminMetrics } from '@/types/admin'
import { formatRD } from '@/lib/format'
import { getChartDataAction } from '@/lib/actions/chart-data'

// ── Paletas ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending: '#a1a1aa',
  processing: '#3b82f6',
  shipped: '#f59e0b',
  delivered: '#10b981',
  cancelled: '#ef4444',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  processing: 'En proceso',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const METHOD_COLORS: Record<string, string> = {
  cod: '#1a1a1a',
  bank_transfer: '#1d4ed8',
  stripe: '#635bff',
  paypal: '#0070ba',
}

const METHOD_LABELS: Record<string, string> = {
  cod: 'Contra entrega',
  bank_transfer: 'Transferencia',
  stripe: 'Stripe',
  paypal: 'PayPal',
}

const CATEGORY_COLORS = ['#d62828', '#f9c80e', '#1a1a1a', '#6b7280', '#10b981']

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtShort(v: number): string {
  if (v >= 1_000_000) return `RD$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `RD$${(v / 1_000).toFixed(0)}K`
  return `RD$${Math.round(v)}`
}

function fmtDateShort(s: string): string {
  const parts = s.split('-')
  return `${parts[2]}/${parts[1]}`
}

// ── Custom Tooltips (module-level, no closure issues) ─────────────────────────

type ChartTooltipProps = {
  active?: boolean
  payload?: Array<{ value?: number; payload?: Record<string, unknown> }>
  label?: string
}

function RevenueTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-zinc-200 rounded-lg px-3 py-2 shadow-md text-xs">
      {label && <p className="text-zinc-400 mb-1">{fmtDateShort(label)}</p>}
      <p className="font-bold text-zinc-800">{formatRD(payload[0].value ?? 0)}</p>
    </div>
  )
}

function BarTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload as { name: string; sales: number; revenue: number } | undefined
  if (!row) return null
  return (
    <div className="bg-white border border-zinc-200 rounded-lg px-3 py-2 shadow-md text-xs max-w-[200px]">
      <p className="font-semibold text-zinc-800 mb-1 leading-tight">{row.name}</p>
      <p className="text-zinc-600">{row.sales} unidades</p>
      <p className="text-zinc-400">{formatRD(row.revenue)} en ingresos</p>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

const INITIAL_DATA_TS = Date.now()

export default function DashboardCharts({ metrics: initialMetrics }: { metrics: AdminMetrics }) {
  const { data: metrics, dataUpdatedAt } = useQuery({
    queryKey: ['admin-chart-data'],
    queryFn: getChartDataAction,
    initialData: initialMetrics,
    initialDataUpdatedAt: INITIAL_DATA_TS,
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  })

  const revenueData = metrics.revenueByDay30 ?? []

  const topProducts =
    (metrics.topProductsFromOrders?.length ?? 0) > 0
      ? metrics.topProductsFromOrders
      : metrics.topProducts

  const statusData = Object.entries(metrics.ordersByStatus)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: STATUS_LABELS[k] ?? k, value: v, color: STATUS_COLORS[k] ?? '#a1a1aa' }))

  const methodData = Object.entries(metrics.ordersByPaymentMethod)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: METHOD_LABELS[k] ?? k, value: v, color: METHOD_COLORS[k] ?? '#a1a1aa' }))

  const categoryData = (metrics.revenueByCategory ?? []).map((d, i) => ({
    name: d.category,
    value: Math.round(d.revenue),
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }))

  const updatedAt = new Date(dataUpdatedAt)
  const updatedStr = `${String(updatedAt.getHours()).padStart(2, '0')}:${String(updatedAt.getMinutes()).padStart(2, '0')}`

  const isFromOrders = (metrics.topProductsFromOrders?.length ?? 0) > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Analíticas en tiempo real</h2>
        <span className="text-[10px] text-zinc-400 bg-zinc-50 border border-zinc-100 px-2.5 py-1 rounded-full">
          Actualizado: {updatedStr} · refresca cada 60s
        </span>
      </div>

      {/* Tendencia de ingresos — full width */}
      <RevenueAreaChart data={revenueData} />

      {/* 3 donuts */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <DonutCard title="Estado de pedidos" data={statusData} />
        <DonutCard title="Métodos de pago" data={methodData} />
        <DonutCard
          title="Ingresos por categoría"
          data={categoryData}
          valueFormatter={fmtShort}
        />
      </div>

      {/* Top productos */}
      {topProducts.length > 0 && (
        <TopProductsChart data={topProducts} fromOrders={isFromOrders} />
      )}
    </div>
  )
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function RevenueAreaChart({
  data,
}: {
  data: Array<{ date: string; revenue: number; orders?: number }>
}) {
  const hasData = data.some((d) => d.revenue > 0)
  const tickInterval = Math.max(Math.floor(data.length / 6) - 1, 0)

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
            Tendencia de ingresos
          </p>
          <p className="text-sm font-bold text-zinc-800 mt-0.5">Últimos 30 días</p>
        </div>
        {!hasData && (
          <span className="text-xs text-zinc-400 bg-zinc-50 border border-zinc-100 px-3 py-1 rounded-full shrink-0">
            Sin ventas aún
          </span>
        )}
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="rdRevGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d62828" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#d62828" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={fmtDateShort}
              tick={{ fontSize: 10, fill: '#a1a1aa' }}
              axisLine={false}
              tickLine={false}
              interval={tickInterval > 0 ? tickInterval : 'preserveStartEnd'}
            />
            <YAxis
              tickFormatter={fmtShort}
              tick={{ fontSize: 10, fill: '#a1a1aa' }}
              axisLine={false}
              tickLine={false}
              width={72}
            />
            <Tooltip content={<RevenueTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#d62828"
              strokeWidth={2}
              fill="url(#rdRevGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#d62828', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function DonutCard({
  title,
  data,
  valueFormatter,
}: {
  title: string
  data: Array<{ name: string; value: number; color: string }>
  valueFormatter?: (v: number) => string
}) {
  const total = data.reduce((a, d) => a + d.value, 0)

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4">
      <p className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-1">{title}</p>
      {data.length === 0 || total === 0 ? (
        <div className="h-44 flex items-center justify-center">
          <p className="text-xs text-zinc-400">Sin datos</p>
        </div>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={data}
                cx="50%"
                cy="40%"
                innerRadius="50%"
                outerRadius="70%"
                dataKey="value"
                paddingAngle={3}
                startAngle={90}
                endAngle={-270}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e4e4e7',
                  fontSize: 11,
                  boxShadow: '0 2px 8px rgba(0,0,0,.08)',
                }}
                formatter={(value, name) => {
                  const numVal = typeof value === 'number' ? value : Number(value)
                  const pct = total > 0 ? Math.round((numVal / total) * 100) : 0
                  const formatted = valueFormatter ? valueFormatter(numVal) : String(numVal)
                  return [`${formatted} (${pct}%)`, name as string]
                }}
              />
              <Legend
                iconType="circle"
                iconSize={7}
                formatter={(v: string) => (
                  <span style={{ fontSize: 10, color: '#52525b' }}>{v}</span>
                )}
                wrapperStyle={{ paddingTop: '6px', lineHeight: '20px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function TopProductsChart({
  data,
  fromOrders,
}: {
  data: Array<{ name: string; sales: number; revenue: number }>
  fromOrders: boolean
}) {
  const chartHeight = Math.max(data.length * 56 + 40, 160)

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
            Productos más vendidos
          </p>
          <p className="text-sm font-bold text-zinc-800 mt-0.5">
            {fromOrders ? 'Por unidades en órdenes reales' : 'Por ventas históricas'}
          </p>
        </div>
        {fromOrders && (
          <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">
            Datos reales
          </span>
        )}
      </div>
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 90, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: '#a1a1aa' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: '#3f3f46' }}
              axisLine={false}
              tickLine={false}
              width={148}
            />
            <Tooltip content={<BarTooltip />} cursor={{ fill: '#fafafa' }} />
            <Bar dataKey="sales" radius={[0, 4, 4, 0]} maxBarSize={30}>
              {data.map((_, i) => {
                const shades = ['#d62828', '#dc3c3c', '#e05050', '#e46464', '#e87878']
                return <Cell key={i} fill={shades[i] ?? '#e87878'} />
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
