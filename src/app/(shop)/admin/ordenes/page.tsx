import Link from 'next/link'
import { Suspense } from 'react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getAdminOrdersFiltered } from '@/lib/queries/admin'
import { formatRD, formatDate } from '@/lib/format'
import OrderFilters from '@/components/admin/OrderFilters'
import ExportOrdersButton from './export-button'
import type { OrderFilters as Filters } from '@/types/admin'

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
  pending: 'bg-zinc-200 text-zinc-700',
  paid: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
}

const METHOD_LABELS: Record<string, string> = {
  cod: 'Contra entrega',
  bank_transfer: 'Transferencia',
  stripe: 'Stripe',
  paypal: 'PayPal',
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const filters: Filters = {
    status: typeof params.status === 'string' ? params.status : undefined,
    payment_status: typeof params.payment_status === 'string' ? params.payment_status : undefined,
    payment_method: typeof params.payment_method === 'string' ? params.payment_method : undefined,
    search: typeof params.search === 'string' ? params.search : undefined,
    date_from: typeof params.date_from === 'string' ? params.date_from : undefined,
    date_to: typeof params.date_to === 'string' ? params.date_to : undefined,
  }

  const orders = await getAdminOrdersFiltered(filters)

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl tracking-tight">Ordenes</h1>
          <p className="text-sm text-zinc-500">{orders.length} resultado{orders.length !== 1 ? 's' : ''}</p>
        </div>
        <ExportOrdersButton />
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <OrderFilters />
      </Suspense>

      {/* Mobile: Card layout */}
      <div className="md:hidden space-y-3">
        {orders.length === 0 && (
          <div className="bg-white rounded-xl border border-zinc-200 px-4 py-8 text-center text-zinc-400">
            No se encontraron ordenes con estos filtros
          </div>
        )}
        {orders.map((o) => {
          const isTransferPending = o.payment_method === 'bank_transfer' && o.payment_status === 'pending'
          return (
            <Link
              key={o.id}
              href={`/admin/ordenes/${o.id}`}
              className={`block bg-white rounded-xl border border-zinc-200 p-4 hover:bg-zinc-50/60 transition-colors ${isTransferPending ? 'border-amber-300 bg-amber-50/30' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-rd-red">#{o.id.slice(0, 8).toUpperCase()}</span>
                <span className="font-display text-lg">{formatRD(o.total)}</span>
              </div>
              <p className="text-sm text-zinc-700 mb-1">{o.profiles?.full_name ?? o.profiles?.email ?? '--'}</p>
              <p className="text-xs text-zinc-500 mb-2">{formatDate(o.created_at)}</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge className={`${STATUS_COLORS[o.status]} text-[10px] font-bold uppercase tracking-wider`}>
                  {STATUS_LABELS[o.status] ?? o.status}
                </Badge>
                <Badge className={`${PAYMENT_STATUS_COLORS[o.payment_status]} text-[10px] font-bold uppercase tracking-wider`}>
                  {PAYMENT_STATUS_LABELS[o.payment_status] ?? o.payment_status}
                </Badge>
                <Badge className="bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase tracking-wider">
                  {METHOD_LABELS[o.payment_method] ?? o.payment_method}
                </Badge>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden md:block bg-white rounded-xl border border-zinc-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="text-left px-3 py-2.5">#</th>
              <th className="text-left px-3 py-2.5">Cliente</th>
              <th className="text-left px-3 py-2.5 hidden lg:table-cell">Fecha</th>
              <th className="text-left px-3 py-2.5">Estado</th>
              <th className="text-left px-3 py-2.5">Pago</th>
              <th className="text-left px-3 py-2.5">Metodo</th>
              <th className="text-right px-3 py-2.5">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">
                  No se encontraron ordenes con estos filtros
                </td>
              </tr>
            )}
            {orders.map((o) => {
              const isTransferPending = o.payment_method === 'bank_transfer' && o.payment_status === 'pending'
              return (
                <tr key={o.id} className={`hover:bg-zinc-50/60 ${isTransferPending ? 'bg-amber-50/40' : ''}`}>
                  <td className="px-3 py-2.5 font-mono text-xs">
                    <Link href={`/admin/ordenes/${o.id}`} className="text-rd-red hover:underline font-bold">
                      {o.id.slice(0, 8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-zinc-700">
                    {o.profiles?.full_name ?? o.profiles?.email ?? '--'}
                  </td>
                  <td className="px-3 py-2.5 hidden lg:table-cell text-zinc-500 text-xs">
                    {formatDate(o.created_at)}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge className={`${STATUS_COLORS[o.status]} text-[10px] font-bold uppercase tracking-wider`}>
                      {STATUS_LABELS[o.status] ?? o.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge className={`${PAYMENT_STATUS_COLORS[o.payment_status]} text-[10px] font-bold uppercase tracking-wider`}>
                      {PAYMENT_STATUS_LABELS[o.payment_status] ?? o.payment_status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-zinc-600">
                    {METHOD_LABELS[o.payment_method] ?? o.payment_method}
                  </td>
                  <td className="px-3 py-2.5 text-right font-display text-base">
                    {formatRD(o.total)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
