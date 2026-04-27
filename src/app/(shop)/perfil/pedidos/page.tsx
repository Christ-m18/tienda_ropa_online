import Link from 'next/link'
import { getUserOrders } from '@/lib/queries/user'
import { formatRD, formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-zinc-200 text-zinc-700' },
  processing: { label: 'En proceso', color: 'bg-blue-100 text-blue-700' },
  shipped: { label: 'Enviado', color: 'bg-amber-100 text-amber-700' },
  delivered: { label: 'Entregado', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
}

export default async function MyOrdersPage() {
  const orders = await getUserOrders()

  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl tracking-tight mb-6">Mis pedidos</h1>
      {orders.length === 0 ? (
        <p className="text-zinc-500">No tienes pedidos aún.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const status = STATUS_LABELS[o.status]
            return (
              <Link key={o.id} href={`/perfil/pedidos/${o.id}`} className="block bg-white rounded-2xl border border-zinc-200 p-5 hover:border-rd-red transition">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-bold">#{o.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-zinc-500">{formatDate(o.created_at)} · {o.items?.length ?? 0} productos</p>
                  </div>
                  <Badge className={`${status.color} font-bold uppercase tracking-wider`}>{status.label}</Badge>
                  <p className="font-display text-2xl">{formatRD(o.total)}</p>
                </div>
                {o.tracking_number && (
                  <p className="text-xs text-zinc-500 mt-3">Seguimiento: <span className="font-mono">{o.tracking_number}</span></p>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
