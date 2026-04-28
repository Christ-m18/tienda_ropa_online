'use client'

import Link from 'next/link'
import { Search, ShoppingCart, User, Menu, Bell, LogOut, Heart, Package, Shield } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCartCount } from '@/store/useCartStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import CartSheet from '@/components/cart/CartSheet'
import { logoutAction } from '@/lib/actions/auth'
import type { Profile } from '@/types'

export default function Navbar({ profile }: { profile: Profile | null }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const totalItems = useCartCount()
  const desktopSearchRef = useRef<HTMLInputElement>(null)

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!search.trim()) return
    router.push(`/productos?q=${encodeURIComponent(search.trim())}`)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return
      if (e.key === '/') {
        e.preventDefault()
        if (window.matchMedia('(min-width: 768px)').matches) {
          desktopSearchRef.current?.focus()
        } else {
          setIsSearchOpen(true)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/70 bg-white/85 backdrop-blur-xl supports-backdrop-filter:bg-white/70">
      <div className="container mx-auto px-4">
        <div className="flex h-16 md:h-20 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-display text-3xl md:text-4xl tracking-wider text-rd-charcoal group-hover:text-rd-red transition-colors">
              TIENDA<span className="text-rd-red">RD</span>
            </span>
            <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full bg-rd-yellow text-rd-charcoal font-bold tracking-widest">URBANO</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-bold uppercase tracking-wider">
            <Link href="/productos" className="hover:text-rd-red transition-colors">Productos</Link>
            <Link href="/productos?sort=best_selling" className="hover:text-rd-red transition-colors">Top ventas</Link>
            <Link href="/productos?onSale=1" className="hover:text-rd-red transition-colors">Ofertas</Link>
            <Link href="/categorias/hombre" className="hover:text-rd-red transition-colors">Hombre</Link>
            <Link href="/categorias/mujer" className="hover:text-rd-red transition-colors">Mujer</Link>
          </nav>

          {/* Search */}
          <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-md relative">
            <Input
              ref={desktopSearchRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Busca lo que tá fuego…   /   pa enfocar"
              className="w-full pl-10 pr-10 bg-zinc-100/70 border-zinc-200 focus-visible:ring-rd-red focus-visible:bg-white"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <kbd className="hidden lg:inline-flex absolute right-2 top-1/2 -translate-y-1/2 h-6 px-1.5 items-center rounded border border-zinc-300 bg-white text-[10px] font-mono text-zinc-500 pointer-events-none">/</kbd>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-1 md:gap-2">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSearchOpen((v) => !v)}>
              <Search className="h-5 w-5" />
            </Button>

            {profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <User className="h-5 w-5" />
                    {profile.is_admin && (
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-rd-yellow rounded-full" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{profile.full_name ?? 'Tu cuenta'}</span>
                      <span className="text-xs text-muted-foreground">{profile.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/perfil"><User className="mr-2 h-4 w-4" />Mi cuenta</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/perfil/pedidos"><Package className="mr-2 h-4 w-4" />Mis pedidos</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/perfil/favoritos"><Heart className="mr-2 h-4 w-4" />Favoritos</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/perfil/notificaciones"><Bell className="mr-2 h-4 w-4" />Notificaciones</Link>
                  </DropdownMenuItem>
                  {profile.is_admin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin"><Shield className="mr-2 h-4 w-4" />Panel admin</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <form action={logoutAction} className="w-full">
                      <button type="submit" className="flex items-center w-full text-left">
                        <LogOut className="mr-2 h-4 w-4" />Salir
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}

            <CartSheet>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center bg-rd-red text-white">
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </CartSheet>

            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <SheetHeader>
                  <SheetTitle className="font-display tracking-wider">Menu</SheetTitle>
                  <SheetDescription className="sr-only">Navegacion del sitio</SheetDescription>
                </SheetHeader>
                <nav className="flex flex-col space-y-3 mt-4 px-4 font-display text-2xl">
                  <Link href="/productos">Productos</Link>
                  <Link href="/productos?sort=best_selling">Top ventas</Link>
                  <Link href="/productos?onSale=1">Ofertas</Link>
                  <Link href="/categorias/hombre">Hombre</Link>
                  <Link href="/categorias/mujer">Mujer</Link>
                  <Link href="/categorias/accesorios">Accesorios</Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {isSearchOpen && (
          <form onSubmit={submitSearch} className="md:hidden pb-4">
            <div className="relative">
              <Input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Busca productos…"
                className="w-full pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            </div>
          </form>
        )}
      </div>
    </header>
  )
}
