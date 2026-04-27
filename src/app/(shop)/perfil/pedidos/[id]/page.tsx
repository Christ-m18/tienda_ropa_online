import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getOrderById } from '@/lib/queries/user'
import { formatRD, formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'

type RouteParams = Promise<{ id: string }>

const STATUS_FLOW = ['pending', 'processing', 'shipped', 'delivered'] as const

export default async function OrderDetailPage({ params }: { params: RouteParams }) {
  const { id } = await params
  const order = await getOrderById(id)
  if (!order) notFound()

  const statusIndex = STATUS_FLOW.indexOf(order.status as typeof STATUS_FLOW[number])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/perfil/pedidos" className="text-sm text-rd-red hover:underline">← Volver</Link>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-200 p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <h1 className="font-display text-3xl md:text-4xl tracking-tight">Pedido #{order.id.slice(0, 8).toUpperCase()}</h1>
            <p className="text-zinc-500">{formatDate(order.created_at)}</p>
          </div>
          <Badge className="bg-rd-yellow text-rd-charcoal font-bold uppercase tracking-wider">{order.status}</Badge>
        </div>

        {/* Tracking flow */}
        {order.status !== 'cancelled' && (
          <div className="mb-8">
            <div className="flex justify-between text-xs uppercase tracking-wider text-zinc-500 mb-2">
              {STATUS_FLOW.map((s) => <span key={s}>{s}</span>)}
            </div>
            <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-rd-red transition-all"
                style={{ width: `${((statusIndex + 1) / STATUS_FLOW.length) * 100}%` }}
              />
            </div>
            {order.tracking_number && (
              <p className="text-xs text-zinc-500 mt-2">Seguimiento: <span className="font-mono">{order.tracking_number}</span></p>
            )}
          </div>
        )}

        {/* Items */}
        <div className="space-y-3">
          {order.items?.map((it) => (
            <div key={it.id} className="flex gap-4 items-center">
              <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-zinc-100 flex-shrink-0">
                {it.product?.images?.[0] && <Image src={it.product.images[0]} alt={it.product.name ?? ''} fill sizes="64px" className="object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold line-clamp-1">{it.product?.name ?? 'Producto'}</p>
                <p className="text-xs text-zinc-500">x{it.quantity} · {formatRD(it.unit_price)}</p>
              </div>
              <p className="font-bold">{formatRD(it.unit_price * it.quantity)}</p>
            </div>
          ))}
        </div>

        {/* Address */}
        {order.address && (
          <div className="mt-8 pt-6 border-t border-zinc-200">
            <p className="text-sm text-zinc-500 uppercase tracking-wider mb-1">Dirección de envío</p>
            <p className="text-sm">
              {order.address.address_line1}{order.address.address_line2 ? `, ${order.address.address_line2}` : ''}
            </p>
            <p className="text-sm">{order.address.city}, {order.address.province}</p>
            <p className="text-sm text-zinc-500">📞 {order.address.phone}</p>
          </div>
        )}

        {/* Totals */}
        <div className="mt-8 pt-6 border-t border-zinc-200 space-y-1.5 text-sm">
          {order.subtotal != null && <Row label="Subtotal" value={formatRD(order.subtotal)} />}
          <Row label="Envío" value={formatRD(order.shipping)} />
          {order.discount > 0 && <Row label="Descuento" value={`-${formatRD(order.discount)}`} accent />}
          <div className="flex justify-between pt-2 border-t border-zinc-200">
            <span className="font-bold">Total</span>
            <span className="font-display text-2xl text-rd-red">{formatRD(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-600">{label}</span>
      <span className={accent ? 'text-emerald-600 font-bold' : ''}>{value}</span>
    </div>
  )
}
