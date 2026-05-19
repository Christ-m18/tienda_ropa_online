'use client'

import type { AdminMetrics } from '@/types/admin'
import { formatRD } from '@/lib/format'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  processing: 'En proceso',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#a1a1aa',
  processing: '#3b82f6',
  shipped: '#f59e0b',
  delivered: '#10b981',
  cancelled: '#ef4444',
}

const METHOD_LABELS: Record<string, string> = {
  cod: 'Contra entrega',
  bank_transfer: 'Transferencia',
  stripe: 'Stripe',
  paypal: 'PayPal',
}

const METHOD_COLORS: Record<string, string> = {
  cod: '#1a1a1a',
  bank_transfer: '#002d62',
  stripe: '#635bff',
  paypal: '#0070ba',
}

export default function DashboardCharts({ metrics }: { metrics: AdminMetrics }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <RevenueChart data={metrics.revenueByDay} />
      <HorizontalBars
        title="Ordenes por estado"
        data={Object.entries(metrics.ordersByStatus).map(([key, val]) => ({
          label: STATUS_LABELS[key] ?? key,
          value: val,
          color: STATUS_COLORS[key] ?? '#a1a1aa',
        }))}
      />
      <HorizontalBars
        title="Metodo de pago"
        data={Object.entries(metrics.ordersByPaymentMethod).map(([key, val]) => ({
          label: METHOD_LABELS[key] ?? key,
          value: val,
          color: METHOD_COLORS[key] ?? '#a1a1aa',
        }))}
      />
      <HorizontalBars
        title="Productos mas vendidos"
        data={metrics.topProducts.map((p) => ({
          label: p.name,
          value: p.sales,
          color: '#d62828',
          suffix: ` (${formatRD(p.revenue)})`,
        }))}
      />
    </div>
  )
}

function RevenueChart({ data }: { data: AdminMetrics['revenueByDay'] }) {
  const maxVal = Math.max(...data.map((d) => d.revenue), 1)
  const chartH = 120
  const barW = 100 / data.length

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4">
      <p className="text-xs uppercase tracking-wider text-zinc-500 mb-3">Ingresos diarios (14 dias)</p>
      <svg viewBox={`0 0 100 ${chartH}`} className="w-full h-32" preserveAspectRatio="none">
        {data.map((d, i) => {
          const h = (d.revenue / maxVal) * (chartH - 10)
          return (
            <g key={d.date}>
              <title>{d.date}: {formatRD(d.revenue)}</title>
              <rect
                x={i * barW + barW * 0.15}
                y={chartH - h}
                width={barW * 0.7}
                height={Math.max(h, 0.5)}
                rx={1}
                fill={d.revenue > 0 ? '#d62828' : '#e4e4e7'}
                opacity={0.85}
              />
            </g>
          )
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
        <span>{data[0]?.date.slice(5)}</span>
        <span>{data[data.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  )
}

function HorizontalBars({
  title,
  data,
}: {
  title: string
  data: Array<{ label: string; value: number; color: string; suffix?: string }>
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4">
      <p className="text-xs uppercase tracking-wider text-zinc-500 mb-3">{title}</p>
      <div className="space-y-2">
        {data.length === 0 && <p className="text-xs text-zinc-400">Sin datos</p>}
        {data.map((d) => (
          <div key={d.label}>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-zinc-700 truncate mr-2">{d.label}</span>
              <span className="font-bold text-zinc-900 shrink-0">
                {d.value}{d.suffix ?? ''}
              </span>
            </div>
            <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(d.value / maxVal) * 100}%`,
                  backgroundColor: d.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
