import Link from 'next/link'
import { Package, Heart, MapPin, Bell } from 'lucide-react'
import { getCurrentProfile, getUserOrders, getUserWishlist, getUserAddresses, getUserNotifications } from '@/lib/queries/user'
import { formatRD, formatDate } from '@/lib/format'

export default async function ProfileHomePage() {
  const [profile, orders, wishlist, addresses, notifications] = await Promise.all([
    getCurrentProfile(),
    getUserOrders(),
    getUserWishlist(),
    getUserAddresses(),
    getUserNotifications(5),
  ])

  if (!profile) return null
  const unread = notifications.filter((n) => !n.read).length

  const cards = [
    { href: '/perfil/pedidos', icon: Package, label: 'Pedidos', count: orders.length },
    { href: '/perfil/favoritos', icon: Heart, label: 'Favoritos', count: wishlist.length },
    { href: '/perfil/direcciones', icon: MapPin, label: 'Direcciones', count: addresses.length },
    { href: '/perfil/notificaciones', icon: Bell, label: 'Notificaciones', count: unread, badge: unread > 0 },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">Hola, {profile.full_name?.split(' ')[0] ?? 'bienvenido'} 👋</h1>
        <p className="text-zinc-500">Aquí está el resumen de tu cuenta.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="bg-white rounded-2xl border border-zinc-200 p-5 hover:border-rd-red transition group">
            <div className="flex items-center justify-between">
              <c.icon className="h-5 w-5 text-rd-red" />
              {c.badge && <span className="h-2 w-2 bg-rd-red rounded-full" />}
            </div>
            <p className="text-3xl font-display mt-3">{c.count}</p>
            <p className="text-sm text-zinc-500">{c.label}</p>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="font-display text-2xl tracking-wider mb-4">Últimos pedidos</h2>
        {orders.length === 0 ? (
          <p className="text-zinc-500">Aún no has comprado. <Link href="/productos" className="text-rd-red font-bold hover:underline">Ver productos</Link></p>
        ) : (
          <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
            {orders.slice(0, 5).map((o) => (
              <Link key={o.id} href={`/perfil/pedidos/${o.id}`} className="flex items-center justify-between p-4 hover:bg-zinc-50">
                <div>
                  <p className="font-bold">#{o.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-zinc-500">{formatDate(o.created_at)} · {o.items?.length ?? 0} productos</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl">{formatRD(o.total)}</p>
                  <p className="text-xs text-zinc-500 capitalize">{o.status}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
