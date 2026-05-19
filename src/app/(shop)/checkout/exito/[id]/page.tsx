import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getOrderById } from '@/lib/queries/user'
import { formatRD, formatDate } from '@/lib/format'
import BankTransferInstructions from '@/components/checkout/BankTransferInstructions'

type RouteParams = Promise<{ id: string }>

export default async function CheckoutSuccessPage({ params }: { params: RouteParams }) {
  const { id } = await params
  const order = await getOrderById(id)
  if (!order) notFound()

  const isBankTransfer = order.payment_method === 'bank_transfer'

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="bg-white rounded-3xl border border-zinc-200 p-10 text-center">
        <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight">
          {isBankTransfer ? '¡Pedido creado!' : '¡Pedido confirmado!'}
        </h1>
        <p className="text-zinc-500 mt-2">Pedido #{order.id.slice(0, 8).toUpperCase()} &middot; {formatDate(order.created_at)}</p>

        <div className="mt-8 p-6 bg-rd-bone rounded-2xl text-left space-y-2">
          <p className="text-sm text-zinc-500 uppercase tracking-wider">Total</p>
          <p className="font-display text-4xl text-rd-red">{formatRD(order.total)}</p>
          <p className="text-sm text-zinc-600">
            Estado: <span className="font-bold text-rd-charcoal capitalize">{order.status}</span>
          </p>
        </div>

        {isBankTransfer && (
          <div className="mt-8 text-left">
            <BankTransferInstructions orderId={order.id} />
          </div>
        )}

        {!isBankTransfer && (
          <p className="text-sm text-zinc-600 mt-6">
            Te llegara un correo con los detalles. Puedes seguir tu pedido en{' '}
            <Link href={`/perfil/pedidos/${order.id}`} className="text-rd-red font-bold hover:underline">Mis pedidos</Link>.
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link href={`/perfil/pedidos/${order.id}`}>
            <Button className="bg-rd-charcoal hover:bg-rd-red text-white"><Package className="mr-2 h-4 w-4" />Ver pedido</Button>
          </Link>
          <Link href="/productos">
            <Button variant="outline">Seguir comprando</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
