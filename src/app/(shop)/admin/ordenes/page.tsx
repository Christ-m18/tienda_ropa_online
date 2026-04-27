import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { getAdminOrders } from '@/lib/queries/admin'
import { formatRD, formatDate } from '@/lib/format'
import ExportOrdersButton from './export-button'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-zinc-200 text-zinc-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-amber-100 text-amber-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders()
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl tracking-tight">Órdenes</h1>
          <p className="text-zinc-500">{orders.length} órdenes recientes</p>
        </div>
        <ExportOrdersButton />
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="text-left px-4 py-3">#</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Cliente</th>
              <th className="text-left px-4 py-3 hidden lg:table-cell">Fecha</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">Pago</th>
              <th className="text-right px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-zinc-50/60">
                <td className="px-4 py-3 font-mono text-xs">
                  <Link href={`/admin/ordenes/${o.id}`} className="text-rd-red hover:underline font-bold">
                    {o.id.slice(0, 8).toUpperCase()}
                  </Link>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">{o.profiles?.full_name ?? o.profiles?.email ?? '—'}</td>
                <td className="px-4 py-3 hidden lg:table-cell text-zinc-500">{formatDate(o.created_at)}</td>
                <td className="px-4 py-3">
                  <Badge className={`${STATUS_COLORS[o.status]} font-bold uppercase tracking-wider`}>{o.status}</Badge>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-zinc-600 capitalize">{o.payment_method.replace('_', ' ')}</td>
                <td className="px-4 py-3 text-right font-display text-lg">{formatRD(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
