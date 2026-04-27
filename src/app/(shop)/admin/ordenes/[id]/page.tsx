import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { formatRD, formatDate } from '@/lib/format'
import OrderStatusForm from './status-form'

type RouteParams = Promise<{ id: string }>

export default async function AdminOrderDetailPage({ params }: { params: RouteParams }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: order } = await supabase
    .from('orders')
    .select('*, items:order_items(*, product:products(name,images)), address:addresses(*), profiles:profiles!orders_user_id_fkey(full_name,email,phone)')
    .eq('id', id)
    .maybeSingle()

  if (!order) notFound()

  return (
    <div className="space-y-6">
      <Link href="/admin/ordenes" className="text-sm text-rd-red hover:underline">← Órdenes</Link>

      <div className="bg-white rounded-3xl border border-zinc-200 p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <h1 className="font-display text-3xl tracking-tight">Pedido #{order.id.slice(0, 8).toUpperCase()}</h1>
            <p className="text-zinc-500">{formatDate(order.created_at)}</p>
          </div>
          <p className="font-display text-3xl text-rd-red">{formatRD(order.total)}</p>
        </div>

        <OrderStatusForm
          id={order.id}
          status={order.status}
          tracking={order.tracking_number ?? ''}
        />

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Cliente</p>
            <p className="font-bold">{order.profiles?.full_name ?? '—'}</p>
            <p className="text-sm text-zinc-600">{order.profiles?.email}</p>
            <p className="text-sm text-zinc-600">{order.profiles?.phone}</p>
          </div>
          {order.address && (
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Envío</p>
              <p className="text-sm">{order.address.address_line1}</p>
              {order.address.address_line2 && <p className="text-sm">{order.address.address_line2}</p>}
              <p className="text-sm">{order.address.city}, {order.address.province}</p>
              <p className="text-sm">📞 {order.address.phone}</p>
            </div>
          )}
        </div>

        <div className="mt-8 space-y-3">
          {order.items?.map((it: { id: string; quantity: number; unit_price: number; product?: { name?: string; images?: string[] } | null }) => (
            <div key={it.id} className="flex gap-4 items-center">
              <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-zinc-100 flex-shrink-0">
                {it.product?.images?.[0] && <Image src={it.product.images[0]} alt={it.product.name ?? ''} fill sizes="56px" className="object-cover" />}
              </div>
              <div className="flex-1">
                <p className="font-bold">{it.product?.name}</p>
                <p className="text-xs text-zinc-500">x{it.quantity} · {formatRD(it.unit_price)}</p>
              </div>
              <p className="font-bold">{formatRD(it.unit_price * it.quantity)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
