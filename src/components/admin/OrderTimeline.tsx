import { ShoppingBag, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/format'
import type { ActivityEvent } from '@/types/admin'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  processing: 'En proceso',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const ICON_MAP: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  'order.status_change': { icon: ShoppingBag, color: 'bg-blue-100 text-blue-600' },
  'payment_proof.approved': { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-600' },
  'payment_proof.rejected': { icon: XCircle, color: 'bg-red-100 text-red-600' },
}

function describeEvent(ev: ActivityEvent): string {
  const meta = ev.metadata ?? {}
  if (ev.action === 'order.status_change') {
    return `Estado cambiado a ${STATUS_LABELS[meta.status as string] ?? meta.status}`
  }
  if (ev.action === 'payment_proof.approved') return 'Pago aprobado'
  if (ev.action === 'payment_proof.rejected') return `Pago rechazado: ${meta.rejection_reason ?? ''}`
  return ev.action
}

export default function OrderTimeline({
  createdAt,
  events,
}: {
  createdAt: string
  events: ActivityEvent[]
}) {
  const items = [
    { date: createdAt, label: 'Pedido creado', icon: Clock, color: 'bg-zinc-100 text-zinc-600' },
    ...events.map((ev) => {
      const cfg = ICON_MAP[ev.action] ?? { icon: ShoppingBag, color: 'bg-zinc-100 text-zinc-500' }
      return {
        date: ev.created_at,
        label: describeEvent(ev),
        icon: cfg.icon,
        color: cfg.color,
      }
    }),
  ]

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4">
      <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-3">Historial</p>
      <div className="relative">
        <div className="absolute left-3.5 top-4 bottom-4 w-px bg-zinc-200" />
        <div className="space-y-3">
          {items.map((item, i) => {
            const Icon = item.icon
            return (
              <div key={i} className="flex items-start gap-3 relative">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 z-10 ${item.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="pt-0.5">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-[10px] text-zinc-400">{formatDate(item.date)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
