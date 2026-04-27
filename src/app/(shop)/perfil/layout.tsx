import Link from 'next/link'
import { redirect } from 'next/navigation'
import { User, Package, Heart, MapPin, Bell } from 'lucide-react'
import { getCurrentProfile } from '@/lib/queries/user'

const NAV = [
  { href: '/perfil', label: 'Resumen', icon: User },
  { href: '/perfil/pedidos', label: 'Mis pedidos', icon: Package },
  { href: '/perfil/favoritos', label: 'Favoritos', icon: Heart },
  { href: '/perfil/direcciones', label: 'Direcciones', icon: MapPin },
  { href: '/perfil/notificaciones', label: 'Notificaciones', icon: Bell },
]

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login?redirect=/perfil')

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        <aside className="space-y-1">
          <div className="bg-rd-charcoal text-white rounded-2xl p-5 mb-4">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Cuenta</p>
            <p className="font-display text-xl mt-1 truncate">{profile.full_name ?? 'Cliente RD'}</p>
            <p className="text-xs text-zinc-400 truncate">{profile.email}</p>
          </div>
          {NAV.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-100 text-sm font-medium"
              >
                <Icon className="h-4 w-4" />{item.label}
              </Link>
            )
          })}
        </aside>
        <div>{children}</div>
      </div>
    </div>
  )
}
