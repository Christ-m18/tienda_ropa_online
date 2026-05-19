import Link from 'next/link'
import { Activity, ShoppingBag, CreditCard, UserX, UserCheck, Package, Shield } from 'lucide-react'
import type { ActivityEvent } from '@/types/admin'

const ACTION_CONFIG: Record<string, {
  icon: React.ComponentType<{ className?: string }>
  color: string
  label: (m?: Record<string, unknown> | null) => string
}> = {
  'order.status_change': {
    icon: ShoppingBag,
    color: 'text-blue-600 bg-blue-50',
    label: (m) => `Pedido cambio a ${statusLabel(m?.status as string)}`,
  },
  'payment_proof.approved': {
    icon: CreditCard,
    color: 'text-emerald-600 bg-emerald-50',
    label: () => 'Pago aprobado',
  },
  'payment_proof.rejected': {
    icon: CreditCard,
    color: 'text-red-600 bg-red-50',
    label: () => 'Pago rechazado',
  },
  'profile.blocked': {
    icon: UserX,
    color: 'text-red-600 bg-red-50',
    label: () => 'Usuario bloqueado',
  },
  'profile.unblocked': {
    icon: UserCheck,
    color: 'text-emerald-600 bg-emerald-50',
    label: () => 'Usuario desbloqueado',
  },
  'profile.admin_toggle': {
    icon: Shield,
    color: 'text-amber-600 bg-amber-50',
    label: (m) => m?.is_admin ? 'Promovido a admin' : 'Admin revocado',
  },
  'product.create': {
    icon: Package,
    color: 'text-indigo-600 bg-indigo-50',
    label: (m) => `Producto creado: ${m?.name ?? ''}`,
  },
  'product.update': {
    icon: Package,
    color: 'text-indigo-600 bg-indigo-50',
    label: (m) => `Producto actualizado: ${m?.name ?? ''}`,
  },
  'product.delete': {
    icon: Package,
    color: 'text-red-600 bg-red-50',
    label: () => 'Producto eliminado',
  },
}

function statusLabel(s?: string) {
  const map: Record<string, string> = {
    pending: 'Pendiente',
    processing: 'En proceso',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  }
  return map[s ?? ''] ?? s ?? ''
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `hace ${days}d`
}

export default function RecentActivity({ events }: { events: ActivityEvent[] }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200">
      <div className="px-4 py-3 border-b border-zinc-100">
        <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5" /> Actividad reciente
        </p>
      </div>
      <div className="divide-y divide-zinc-50 max-h-80 overflow-y-auto">
        {events.length === 0 && (
          <p className="p-4 text-sm text-zinc-400">Sin actividad reciente</p>
        )}
        {events.map((ev) => {
          const config = ACTION_CONFIG[ev.action]
          const Icon = config?.icon ?? Activity
          const colorClass = config?.color ?? 'text-zinc-500 bg-zinc-50'
          const label = config?.label(ev.metadata) ?? ev.action

          const entityLink = ev.entity_type === 'order' && ev.entity_id
            ? `/admin/ordenes/${ev.entity_id}`
            : ev.entity_type === 'profile' && ev.entity_id
              ? '/admin/usuarios'
              : ev.entity_type === 'product' && ev.entity_id
                ? '/admin/productos'
                : ev.entity_type === 'payment_proof' && ev.metadata?.order_id
                  ? `/admin/ordenes/${ev.metadata.order_id}`
                  : null

          return (
            <div key={ev.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                {entityLink ? (
                  <Link href={entityLink} className="text-sm hover:text-rd-red truncate block">
                    {label}
                  </Link>
                ) : (
                  <p className="text-sm truncate">{label}</p>
                )}
                {ev.entity_id && (
                  <p className="text-[10px] text-zinc-400 font-mono">
                    #{ev.entity_id.slice(0, 8)}
                  </p>
                )}
              </div>
              <span className="text-[10px] text-zinc-400 shrink-0">{relativeTime(ev.created_at)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
