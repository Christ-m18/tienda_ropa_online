import Link from 'next/link'
import { Coins, ShoppingBag, Package, Users, AlertTriangle } from 'lucide-react'
import { getAdminMetrics } from '@/lib/queries/admin'
import { formatRD, formatDate } from '@/lib/format'

export default async function AdminDashboardPage() {
  const m = await getAdminMetrics()

  const stats = [
    { label: 'Ingresos', value: formatRD(m.totalRevenue), icon: Coins, color: 'bg-rd-red text-white' },
    { label: 'Órdenes', value: m.totalOrders, icon: ShoppingBag, color: 'bg-rd-yellow text-rd-charcoal' },
    { label: 'Productos', value: m.totalProducts, icon: Package, color: 'bg-rd-charcoal text-white' },
    { label: 'Usuarios', value: m.totalUsers, icon: Users, color: 'bg-rd-blue text-white' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">Dashboard</h1>
        <p className="text-zinc-500">Resumen del negocio</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-zinc-200 p-5">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <p className="text-3xl font-display">{s.value}</p>
            <p className="text-sm text-zinc-500">{s.label}</p>
          </div>
        ))}
      </div>

      {(m.pendingOrders > 0 || m.lowStock > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {m.pendingOrders > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold">{m.pendingOrders} órdenes pendientes</p>
                <Link href="/admin/ordenes" className="text-sm text-rd-red font-bold hover:underline">Procesar →</Link>
              </div>
            </div>
          )}
          {m.lowStock > 0 && (
            <div className="bg-rd-red/5 border border-rd-red/30 rounded-2xl p-5 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rd-red mt-0.5" />
              <div>
                <p className="font-bold">{m.lowStock} productos con bajo stock</p>
                <Link href="/admin/productos" className="text-sm text-rd-red font-bold hover:underline">Reabastecer →</Link>
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <h2 className="font-display text-2xl tracking-wider mb-4">Últimas órdenes</h2>
        <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
          {m.recentOrders.length === 0 ? (
            <p className="p-6 text-zinc-500">Aún no hay órdenes.</p>
          ) : (
            m.recentOrders.map((o) => (
              <Link key={o.id} href={`/admin/ordenes/${o.id}`} className="flex items-center justify-between p-4 hover:bg-zinc-50">
                <div>
                  <p className="font-bold">#{o.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-zinc-500">{formatDate(o.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl">{formatRD(o.total)}</p>
                  <p className="text-xs text-zinc-500 capitalize">{o.status}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
