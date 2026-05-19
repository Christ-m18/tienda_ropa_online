import Link from 'next/link'
import { AlertTriangle, CreditCard, ArrowRight } from 'lucide-react'
import { getAdminDashboardMetrics, getRecentActivity } from '@/lib/queries/admin-dashboard'
import { formatRD, formatDate } from '@/lib/format'
import DashboardKPIs from '@/components/admin/DashboardKPIs'
import DashboardCharts from '@/components/admin/DashboardCharts'
import RecentActivity from '@/components/admin/RecentActivity'
import { Badge } from '@/components/ui/badge'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  processing: 'En proceso',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-zinc-200 text-zinc-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-amber-100 text-amber-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-zinc-200 text-zinc-700',
  paid: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  failed: 'Fallido',
}

export default async function AdminDashboardPage() {
  const [metrics, activity] = await Promise.all([
    getAdminDashboardMetrics(),
    getRecentActivity(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-500">Resumen operativo del negocio</p>
      </div>

      <DashboardKPIs metrics={metrics} />

      {/* Alerts */}
      {(metrics.pendingOrders > 0 || metrics.lowStockProducts > 0 || metrics.awaitingTransferReview > 0) && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {metrics.awaitingTransferReview > 0 && (
            <Link href="/admin/ordenes?payment_status=pending&payment_method=bank_transfer" className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3 hover:bg-orange-100 transition-colors">
              <CreditCard className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-sm">{metrics.awaitingTransferReview} transferencias por revisar</p>
                <span className="text-xs text-orange-700 font-bold flex items-center gap-1">Revisar <ArrowRight className="h-3 w-3" /></span>
              </div>
            </Link>
          )}
          {metrics.pendingOrders > 0 && (
            <Link href="/admin/ordenes?status=pending" className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 hover:bg-amber-100 transition-colors">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-sm">{metrics.pendingOrders} ordenes pendientes</p>
                <span className="text-xs text-amber-700 font-bold flex items-center gap-1">Procesar <ArrowRight className="h-3 w-3" /></span>
              </div>
            </Link>
          )}
          {metrics.lowStockProducts > 0 && (
            <Link href="/admin/productos" className="bg-rd-red/5 border border-rd-red/20 rounded-xl p-4 flex items-start gap-3 hover:bg-rd-red/10 transition-colors">
              <AlertTriangle className="h-5 w-5 text-rd-red mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-sm">{metrics.lowStockProducts} productos con bajo stock</p>
                <span className="text-xs text-rd-red font-bold flex items-center gap-1">Reabastecer <ArrowRight className="h-3 w-3" /></span>
              </div>
            </Link>
          )}
        </div>
      )}

      <DashboardCharts metrics={metrics} />

      <div className="grid lg:grid-cols-[1fr_360px] gap-4">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-zinc-200">
          <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Ultimas ordenes</p>
            <Link href="/admin/ordenes" className="text-xs text-rd-red font-bold hover:underline">Ver todas</Link>
          </div>
          <div className="divide-y divide-zinc-50">
            {metrics.recentOrders.length === 0 ? (
              <p className="p-4 text-sm text-zinc-400">Sin ordenes aun</p>
            ) : (
              metrics.recentOrders.map((o) => (
                <Link key={o.id} href={`/admin/ordenes/${o.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs font-bold">#{o.id.slice(0, 8).toUpperCase()}</span>
                      <Badge className={`${STATUS_COLORS[o.status]} text-[10px] font-bold uppercase`}>
                        {STATUS_LABELS[o.status] ?? o.status}
                      </Badge>
                      <Badge className={`${PAYMENT_STATUS_COLORS[o.payment_status]} text-[10px] font-bold uppercase`}>
                        {PAYMENT_STATUS_LABELS[o.payment_status] ?? o.payment_status}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {o.profiles?.full_name ?? 'Sin nombre'} · {formatDate(o.created_at)}
                    </p>
                  </div>
                  <p className="font-display text-lg shrink-0">{formatRD(o.total)}</p>
                </Link>
              ))
            )}
          </div>
        </div>

        <RecentActivity events={activity} />
      </div>
    </div>
  )
}
