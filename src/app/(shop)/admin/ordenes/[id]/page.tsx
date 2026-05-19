import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { formatRD, formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import OrderStatusForm from './status-form'
import VoucherReview from '@/components/admin/VoucherReview'
import OrderTimeline from '@/components/admin/OrderTimeline'
import type { PaymentProof } from '@/types'
import type { ActivityEvent } from '@/types/admin'

type RouteParams = Promise<{ id: string }>

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

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  failed: 'Fallido',
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
}

const METHOD_LABELS: Record<string, string> = {
  cod: 'Contra entrega',
  bank_transfer: 'Transferencia bancaria',
  stripe: 'Stripe',
  paypal: 'PayPal',
}

export default async function AdminOrderDetailPage({ params }: { params: RouteParams }) {
  const { id } = await params
  const supabase = await createClient()

  const [orderResult, proofsResult, auditResult] = await Promise.all([
    supabase
      .from('orders')
      .select('*, items:order_items(*, product:products(name,images)), address:addresses(*)')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('payment_proofs')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('audit_logs')
      .select('id, action, entity_type, entity_id, metadata, created_at, user_id')
      .eq('entity_type', 'order')
      .eq('entity_id', id)
      .order('created_at', { ascending: true }),
  ])

  const orderData = orderResult.data
  if (!orderData) notFound()

  // Fetch profile separately since orders FK goes to auth.users, not profiles
  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, email, phone')
    .eq('id', orderData.user_id)
    .maybeSingle()

  const order = { ...orderData, profiles: profileData }


  const proofs = (proofsResult.data ?? []) as PaymentProof[]
  const auditEvents = (auditResult.data ?? []) as ActivityEvent[]

  // Also get payment proof audit events
  const proofIds = proofs.map((p) => p.id)
  let proofAuditEvents: ActivityEvent[] = []
  if (proofIds.length > 0) {
    const { data } = await supabase
      .from('audit_logs')
      .select('id, action, entity_type, entity_id, metadata, created_at, user_id')
      .eq('entity_type', 'payment_proof')
      .in('entity_id', proofIds)
      .order('created_at', { ascending: true })
    proofAuditEvents = (data ?? []) as ActivityEvent[]
  }

  const allEvents = [...auditEvents, ...proofAuditEvents].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  // Generate signed URLs for voucher files
  const signedUrls: Record<string, string> = {}
  for (const proof of proofs) {
    const { data } = await supabase.storage
      .from('payment-vouchers')
      .createSignedUrl(proof.file_path, 3600)
    if (data?.signedUrl) signedUrls[proof.id] = data.signedUrl
  }

  const subtotal = order.subtotal != null ? Number(order.subtotal) : null
  const shipping = Number(order.shipping ?? 0)
  const discount = Number(order.discount ?? 0)
  const total = Number(order.total)

  return (
    <div className="space-y-4">
      <Link href="/admin/ordenes" className="text-sm text-rd-red hover:underline font-medium">
        &larr; Ordenes
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h1 className="font-display text-2xl tracking-tight">
              Pedido #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-sm text-zinc-500">{formatDate(order.created_at)}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl text-rd-red">{formatRD(total)}</p>
            <div className="flex gap-1.5 mt-1 justify-end">
              <Badge className={`${STATUS_COLORS[order.status]} text-[10px] font-bold uppercase`}>
                {STATUS_LABELS[order.status] ?? order.status}
              </Badge>
              <Badge className={`${PAYMENT_STATUS_COLORS[order.payment_status]} text-[10px] font-bold uppercase`}>
                {PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status}
              </Badge>
            </div>
          </div>
        </div>

        <OrderStatusForm
          id={order.id}
          status={order.status}
          tracking={order.tracking_number ?? ''}
        />
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4">
          {/* Voucher section for bank transfers */}
          {order.payment_method === 'bank_transfer' && (
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-2">
                Comprobante de transferencia
              </p>
              <VoucherReview proofs={proofs} signedUrls={signedUrls} />
            </div>
          )}

          {/* Client & Shipping info */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-zinc-200 p-4">
              <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2 font-bold">Cliente</p>
              <p className="font-bold text-sm">{order.profiles?.full_name ?? '--'}</p>
              <p className="text-xs text-zinc-600">{order.profiles?.email}</p>
              <p className="text-xs text-zinc-600">{order.profiles?.phone}</p>
            </div>
            {order.address && (
              <div className="bg-white rounded-xl border border-zinc-200 p-4">
                <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2 font-bold">Envio</p>
                <p className="text-sm">{order.address.address_line1}</p>
                {order.address.address_line2 && <p className="text-xs text-zinc-600">{order.address.address_line2}</p>}
                <p className="text-xs text-zinc-600">{order.address.city}, {order.address.province}</p>
                <p className="text-xs text-zinc-600">Tel: {order.address.phone}</p>
              </div>
            )}
            <div className="bg-white rounded-xl border border-zinc-200 p-4">
              <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2 font-bold">Pago</p>
              <p className="text-sm font-medium">{METHOD_LABELS[order.payment_method] ?? order.payment_method}</p>
              {order.tracking_number && (
                <p className="text-xs text-zinc-600 mt-1 font-mono">Tracking: {order.tracking_number}</p>
              )}
            </div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <p className="text-xs uppercase tracking-wider text-zinc-500 mb-3 font-bold">Productos</p>
            <div className="space-y-3">
              {order.items?.map((it: { id: string; quantity: number; unit_price: number; product?: { name?: string; images?: string[] } | null }) => (
                <div key={it.id} className="flex gap-3 items-center">
                  <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-zinc-100 shrink-0">
                    {it.product?.images?.[0] && (
                      <Image src={it.product.images[0]} alt={it.product.name ?? ''} fill sizes="48px" className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{it.product?.name}</p>
                    <p className="text-xs text-zinc-500">x{it.quantity} &middot; {formatRD(it.unit_price)}</p>
                  </div>
                  <p className="font-bold text-sm shrink-0">{formatRD(it.unit_price * it.quantity)}</p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-zinc-100 mt-4 pt-3 space-y-1 text-sm">
              {subtotal != null && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Subtotal</span>
                  <span>{formatRD(subtotal)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-500">{shipping === 0 ? 'Envio (gratis)' : 'Envio'}</span>
                <span>{formatRD(shipping)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Descuento</span>
                  <span>-{formatRD(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-1 border-t border-zinc-100">
                <span>Total</span>
                <span className="font-display text-xl text-rd-red">{formatRD(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Timeline */}
        <div>
          <OrderTimeline createdAt={order.created_at} events={allEvents} />
        </div>
      </div>
    </div>
  )
}
