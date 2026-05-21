import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Download } from 'lucide-react'
import { getOrderById, getOrderPaymentProofs } from '@/lib/queries/user'
import { formatRD, formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type RouteParams = Promise<{ id: string }>

const STATUS_FLOW = ['pending', 'processing', 'shipped', 'delivered'] as const

const PROOF_STATUS_LABELS: Record<string, string> = {
  pending: 'En revisión',
  approved: 'Aprobado',
  rejected: 'Rechazado',
}
const PROOF_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
}

export default async function OrderDetailPage({ params }: { params: RouteParams }) {
  const { id } = await params
  const [order, proofs] = await Promise.all([
    getOrderById(id),
    getOrderPaymentProofs(id),
  ])
  if (!order) notFound()

  const isBankTransfer = order.payment_method === 'bank_transfer'
  const isPaid = order.payment_status === 'paid'
  const statusIndex = STATUS_FLOW.indexOf(order.status as typeof STATUS_FLOW[number])
  const latestProof = proofs[0]

  const showTrackingBar = order.status !== 'cancelled' && (!isBankTransfer || isPaid)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/perfil/pedidos" className="text-sm text-rd-red hover:underline">← Volver</Link>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-200 p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <h1 className="font-display text-3xl md:text-4xl tracking-tight">
              Pedido #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-zinc-500">{formatDate(order.created_at)}</p>
          </div>
          <Badge className="bg-rd-yellow text-rd-charcoal font-bold uppercase tracking-wider">
            {order.status}
          </Badge>
        </div>

        {showTrackingBar && (
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
              <p className="text-xs text-zinc-500 mt-2">
                Seguimiento: <span className="font-mono">{order.tracking_number}</span>
              </p>
            )}
          </div>
        )}

        {isBankTransfer && (
          <div className="mb-6 rounded-xl border border-zinc-200 p-4 space-y-2">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Estado de transferencia
            </p>
            {!latestProof && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm font-medium text-amber-800">Comprobante pendiente</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Aún no hemos recibido tu comprobante de pago.
                </p>
                <Link
                  href={`/checkout/exito/${order.id}`}
                  className="inline-block mt-2 text-xs font-bold text-rd-red hover:underline"
                >
                  Subir comprobante →
                </Link>
              </div>
            )}
            {latestProof && (
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-zinc-500 text-xs">Estado del comprobante:</span>
                  <Badge className={`${PROOF_STATUS_COLORS[latestProof.status]} text-[10px] font-bold uppercase`}>
                    {PROOF_STATUS_LABELS[latestProof.status] ?? latestProof.status}
                  </Badge>
                </div>
                {latestProof.bank_name && (
                  <p className="text-xs text-zinc-500">
                    Banco: <span className="font-medium text-zinc-700">{latestProof.bank_name}</span>
                  </p>
                )}
                {latestProof.reference_number && (
                  <p className="text-xs text-zinc-500">
                    Referencia: <span className="font-mono font-medium text-zinc-700">{latestProof.reference_number}</span>
                  </p>
                )}
                {latestProof.status === 'rejected' && latestProof.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                    <p className="text-xs font-bold text-red-700">Motivo de rechazo:</p>
                    <p className="text-xs text-red-600 mt-0.5">{latestProof.rejection_reason}</p>
                    <Link
                      href={`/checkout/exito/${order.id}`}
                      className="inline-block mt-2 text-xs font-bold text-rd-red hover:underline"
                    >
                      Subir nuevo comprobante →
                    </Link>
                  </div>
                )}
              </div>
            )}
            {isPaid && (
              <a href={`/api/orders/${order.id}/invoice`} target="_blank" rel="noreferrer">
                <Button
                  variant="outline"
                  className="mt-2 gap-2 text-sm border-zinc-300"
                >
                  <Download className="h-4 w-4" />
                  Descargar factura
                </Button>
              </a>
            )}
          </div>
        )}

        <div className="space-y-3">
          {order.items?.map((it) => (
            <div key={it.id} className="flex gap-4 items-center">
              <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-zinc-100 flex-shrink-0">
                {it.product?.images?.[0] && (
                  <Image
                    src={it.product.images[0]}
                    alt={it.product.name ?? ''}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold line-clamp-1">{it.product?.name ?? 'Producto'}</p>
                <p className="text-xs text-zinc-500">x{it.quantity} · {formatRD(it.unit_price)}</p>
              </div>
              <p className="font-bold shrink-0">{formatRD(it.unit_price * it.quantity)}</p>
            </div>
          ))}
        </div>

        {order.address && (
          <div className="mt-8 pt-6 border-t border-zinc-200">
            <p className="text-sm text-zinc-500 uppercase tracking-wider mb-1">Dirección de envío</p>
            <p className="text-sm">
              {order.address.address_line1}
              {order.address.address_line2 ? `, ${order.address.address_line2}` : ''}
            </p>
            <p className="text-sm">{order.address.city}, {order.address.province}</p>
            <p className="text-sm text-zinc-500">📞 {order.address.phone}</p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-zinc-200 space-y-1.5 text-sm">
          {order.subtotal != null && <Row label="Subtotal" value={formatRD(order.subtotal)} />}
          <Row label="Envío" value={formatRD(order.shipping)} />
          {order.discount > 0 && (
            <Row label="Descuento" value={`-${formatRD(order.discount)}`} accent />
          )}
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
