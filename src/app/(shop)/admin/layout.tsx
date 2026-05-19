import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingBag, Tag, Users } from 'lucide-react'
import { requireAdminProfile } from '@/lib/queries/admin'
import RealtimeProvider from '@/components/admin/RealtimeProvider'
import LiveIndicator from '@/components/admin/LiveIndicator'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/productos', label: 'Productos', icon: Package },
  { href: '/admin/ordenes', label: 'Ordenes', icon: ShoppingBag },
  { href: '/admin/cupones', label: 'Cupones', icon: Tag },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdminProfile()
  if (!profile) redirect('/')

  return (
    <RealtimeProvider>
      <div className="container mx-auto px-4 py-4 lg:py-10">
        {/* Mobile header */}
        <div className="lg:hidden mb-4">
          <div className="bg-rd-charcoal text-white rounded-2xl p-3 flex items-center justify-between">
            <div>
              <p className="font-display text-sm tracking-wider">PANEL ADMIN</p>
              <p className="text-[11px] text-zinc-400">{profile.full_name ?? 'Admin'}</p>
            </div>
            <LiveIndicator />
          </div>
          <nav className="flex gap-1 overflow-x-auto mt-3 pb-2 -mx-4 px-4 scrollbar-hide">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 text-xs font-bold whitespace-nowrap shrink-0"
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" /> {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="grid lg:grid-cols-[240px_1fr] gap-6 lg:gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block space-y-1">
            <div className="bg-rd-charcoal text-white rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-1">
                <p className="font-display text-base tracking-wider">PANEL ADMIN</p>
                <LiveIndicator />
              </div>
              <p className="text-xs text-zinc-400">{profile.full_name ?? 'Admin'}</p>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-zinc-100 text-sm font-medium whitespace-nowrap"
                >
                  <item.icon className="h-4 w-4 shrink-0" /> {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </RealtimeProvider>
  )
}
