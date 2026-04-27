import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingBag, Tag, Shield, Users } from 'lucide-react'
import { requireAdminProfile } from '@/lib/queries/admin'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/productos', label: 'Productos', icon: Package },
  { href: '/admin/ordenes', label: 'Órdenes', icon: ShoppingBag },
  { href: '/admin/cupones', label: 'Cupones', icon: Tag },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdminProfile()
  if (!profile) redirect('/')

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        <aside className="space-y-1">
          <div className="bg-rd-charcoal text-white rounded-2xl p-5 mb-4 flex items-center gap-3">
            <Shield className="h-5 w-5 text-rd-yellow" />
            <div>
              <p className="font-display text-lg tracking-wider">PANEL ADMIN</p>
              <p className="text-xs text-zinc-400">{profile.full_name ?? 'Admin'}</p>
            </div>
          </div>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-100 text-sm font-medium">
              <item.icon className="h-4 w-4" /> {item.label}
            </Link>
          ))}
        </aside>
        <div>{children}</div>
      </div>
    </div>
  )
}
