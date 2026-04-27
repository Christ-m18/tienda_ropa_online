'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Heart, ShoppingCart, User } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'

const ITEMS = [
  { href: '/', label: 'Inicio', icon: Home, match: (p: string) => p === '/' },
  { href: '/productos', label: 'Buscar', icon: Search, match: (p: string) => p.startsWith('/productos') },
  { href: '/perfil/favoritos', label: 'Favoritos', icon: Heart, match: (p: string) => p.startsWith('/perfil/favoritos') },
  { href: '/checkout', label: 'Carrito', icon: ShoppingCart, match: (p: string) => p.startsWith('/checkout') },
  { href: '/perfil', label: 'Cuenta', icon: User, match: (p: string) => p.startsWith('/perfil') && !p.startsWith('/perfil/favoritos') },
]

export default function MobileNav() {
  const pathname = usePathname()
  const totalItems = useCartStore((s) => s.totalItems())

  if (pathname.startsWith('/admin') || pathname.startsWith('/login') || pathname.startsWith('/registro')) {
    return null
  }

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-zinc-200">
      <ul className="grid grid-cols-5">
        {ITEMS.map((it) => {
          const active = it.match(pathname)
          const Icon = it.icon
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold uppercase tracking-wider relative ${
                  active ? 'text-rd-red' : 'text-zinc-500'
                }`}
              >
                <Icon className="h-5 w-5" />
                {it.label}
                {it.href === '/checkout' && totalItems > 0 && (
                  <span className="absolute top-1.5 right-[28%] h-4 min-w-4 px-1 rounded-full bg-rd-red text-white text-[9px] font-bold flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
