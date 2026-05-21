import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2, Package, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getOrderById, getActiveBankAccounts } from '@/lib/queries/user'
import { formatRD, formatDate } from '@/lib/format'
import BankTransferInstructions from '@/components/checkout/BankTransferInstructions'

type RouteParams = Promise<{ id: string }>

export default async function CheckoutSuccessPage({ params }: { params: RouteParams }) {
  const { id } = await params
  const [order, bankAccounts] = await Promise.all([
    getOrderById(id),
    getActiveBankAccounts(),
  ])
  if (!order) notFound()

  const isBankTransfer = order.payment_method === 'bank_transfer'

  return (
    <div className="container mx-auto px-4 py-8 sm:py-16 max-w-2xl">
      <div className="bg-white rounded-3xl border border-zinc-200 p-5 sm:p-10 text-center">
        <div
          className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isBankTransfer ? 'bg-amber-100' : 'bg-emerald-100'
          }`}
        >
          {isBankTransfer
            ? <Clock className="h-8 w-8 text-amber-600" />
            : <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          }
        </div>

        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-tight">
          {isBankTransfer ? '¡Pedido creado!' : '¡Pedido confirmado!'}
        </h1>
        <p className="text-zinc-500 mt-2 text-sm sm:text-base">
          Pedido #{order.id.slice(0, 8).toUpperCase()} &middot; {formatDate(order.created_at)}
        </p>

        {isBankTransfer && (
          <div className="mt-3 inline-block bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-200">
            Pendiente de comprobante · Pago por revisar
          </div>
        )}

        <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-rd-bone rounded-2xl text-left space-y-2">
          <p className="text-sm text-zinc-500 uppercase tracking-wider">Total</p>
          <p className="font-display text-3xl sm:text-4xl text-rd-red">{formatRD(order.total)}</p>
          {!isBankTransfer && (
            <p className="text-sm text-zinc-600">
              Estado: <span className="font-bold text-rd-charcoal capitalize">{order.status}</span>
            </p>
          )}
        </div>

        {isBankTransfer && (
          <div className="mt-6 sm:mt-8 text-left">
            <BankTransferInstructions
              orderId={order.id}
              orderTotal={order.total}
              bankAccounts={bankAccounts}
            />
          </div>
        )}

        {!isBankTransfer && (
          <p className="text-sm text-zinc-600 mt-6">
            Te llegará un correo con los detalles. Puedes seguir tu pedido en{' '}
            <Link href={`/perfil/pedidos/${order.id}`} className="text-rd-red font-bold hover:underline">
              Mis pedidos
            </Link>.
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6 sm:mt-8">
          <Link href={`/perfil/pedidos/${order.id}`}>
            <Button className="w-full sm:w-auto bg-rd-charcoal hover:bg-rd-red text-white">
              <Package className="mr-2 h-4 w-4" />Ver pedido
            </Button>
          </Link>
          <Link href="/productos">
            <Button variant="outline" className="w-full sm:w-auto">Seguir comprando</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
