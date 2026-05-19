import {
  Coins, CalendarDays, ShoppingBag, Clock, CreditCard,
  CheckCircle2, XCircle, TrendingUp, AlertTriangle,
  Users, UserPlus
} from 'lucide-react'
import { formatRD } from '@/lib/format'
import type { AdminMetrics } from '@/types/admin'

interface KPICard {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: string
}

export default function DashboardKPIs({ metrics }: { metrics: AdminMetrics }) {
  const cards: KPICard[] = [
    { label: 'Ingresos totales', value: formatRD(metrics.totalRevenue), icon: Coins, color: 'bg-rd-red text-white' },
    { label: 'Hoy', value: formatRD(metrics.revenueToday), icon: CalendarDays, color: 'bg-rd-red/80 text-white' },
    { label: 'Ultimos 7 dias', value: formatRD(metrics.revenueLast7Days), icon: TrendingUp, color: 'bg-rd-red/60 text-white' },
    { label: 'Ultimos 30 dias', value: formatRD(metrics.revenueLast30Days), icon: TrendingUp, color: 'bg-rd-yellow text-rd-charcoal' },
    { label: 'Ordenes totales', value: metrics.totalOrders, icon: ShoppingBag, color: 'bg-rd-charcoal text-white' },
    { label: 'Pendientes', value: metrics.pendingOrders, icon: Clock, color: 'bg-amber-500 text-white' },
    { label: 'Transferencias por revisar', value: metrics.awaitingTransferReview, icon: CreditCard, color: 'bg-orange-500 text-white' },
    { label: 'Pagos aprobados', value: metrics.paidOrders, icon: CheckCircle2, color: 'bg-emerald-600 text-white' },
    { label: 'Pagos fallidos', value: metrics.failedOrders, icon: XCircle, color: 'bg-red-600 text-white' },
    { label: 'Ticket promedio', value: formatRD(metrics.averageTicket), icon: TrendingUp, color: 'bg-rd-blue text-white' },
    { label: 'Bajo stock', value: metrics.lowStockProducts, icon: AlertTriangle, color: metrics.lowStockProducts > 0 ? 'bg-red-500 text-white' : 'bg-zinc-400 text-white' },
    { label: 'Usuarios', value: metrics.totalUsers, icon: Users, color: 'bg-rd-blue text-white' },
    { label: 'Nuevos (7d)', value: metrics.newUsersLast7Days, icon: UserPlus, color: 'bg-indigo-500 text-white' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-white rounded-xl border border-zinc-200 p-3.5">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center mb-2 ${c.color}`}>
            <c.icon className="h-4 w-4" />
          </div>
          <p className="font-display text-xl lg:text-2xl leading-tight">{c.value}</p>
          <p className="text-[11px] text-zinc-500 uppercase tracking-wider mt-0.5">{c.label}</p>
        </div>
      ))}
    </div>
  )
}
