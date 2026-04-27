import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Flame, Truck, ShieldCheck, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ProductGrid from '@/components/products/ProductGrid'
import { getFeaturedProducts, getBestSellers, getDealsProducts } from '@/lib/queries/products'
import { getCategories } from '@/lib/queries/categories'
import { getUserWishlistIds } from '@/lib/queries/user'

export const revalidate = 60

export default async function HomePage() {
  const [featured, bestSellers, deals, categories, wishlistIds] = await Promise.all([
    getFeaturedProducts(8),
    getBestSellers(4),
    getDealsProducts(4),
    getCategories(),
    getUserWishlistIds(),
  ])

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-rd-charcoal text-white">
        <div className="absolute inset-0 -z-10 opacity-50">
          <Image
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070"
            alt="Streetwear dominicano"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-rd-charcoal via-rd-charcoal/80 to-transparent" />
        </div>
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-2xl space-y-6">
            <Badge className="bg-rd-yellow text-rd-charcoal font-bold uppercase tracking-widest">Hecho en RD 🇩🇴</Badge>
            <h1 className="font-display text-6xl md:text-8xl leading-none tracking-tight">
              EL FLOW <span className="text-rd-red">DEL</span><br />
              CARIBE EN TU<br />
              <span className="text-rd-yellow">CLOSET</span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 max-w-lg">
              Streetwear, accesorios y vibes urbanos para los que viven la calle dominicana. Envíos rápidos a toda RD, pago contra entrega disponible.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/productos">
                <Button size="lg" className="h-14 px-8 bg-rd-red hover:bg-rd-red-dark text-white font-display tracking-wider text-lg">
                  Comprar ahora <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/productos?onSale=1">
                <Button size="lg" variant="outline" className="h-14 px-8 bg-transparent border-white/30 hover:border-rd-yellow hover:text-rd-yellow text-white font-display tracking-wider text-lg">
                  Ver ofertas
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-6 pt-6 text-sm text-zinc-400">
              <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-rd-yellow" /> Envío 24-72h</span>
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-rd-yellow" /> Pago seguro</span>
              <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-rd-yellow" /> Pago contra entrega</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-rd-red font-bold uppercase tracking-[0.3em] text-xs">Explora</p>
            <h2 className="font-display text-4xl md:text-5xl tracking-tight">Tu estilo, tu calle</h2>
          </div>
          <Link href="/productos" className="text-sm font-bold uppercase tracking-wider hover:text-rd-red flex items-center gap-1">
            Ver todo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {categories.map((cat, i) => (
            <Link key={cat.id} href={`/categorias/${cat.slug}`} className="group relative aspect-[4/5] md:aspect-[3/4] rounded-3xl overflow-hidden">
              {cat.image_url && (
                <Image
                  src={cat.image_url}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
                <span className="text-xs uppercase tracking-[0.3em] text-rd-yellow mb-2">0{i + 1}</span>
                <h3 className="font-display text-4xl md:text-5xl text-white tracking-tight">{cat.name}</h3>
                <span className="mt-3 inline-flex items-center text-sm text-white/90 font-bold uppercase tracking-wider group-hover:text-rd-yellow">
                  Comprar <ArrowRight className="ml-1 h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="bg-rd-bone py-16 urban-stripes">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-rd-red font-bold uppercase tracking-[0.3em] text-xs flex items-center gap-1">
                <Flame className="h-3.5 w-3.5" /> Lo más caliente
              </p>
              <h2 className="font-display text-4xl md:text-5xl tracking-tight">Productos destacados</h2>
            </div>
            <Link href="/productos" className="hidden md:flex text-sm font-bold uppercase tracking-wider hover:text-rd-red items-center gap-1">
              Ver todo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ProductGrid products={featured} wishlistIds={wishlistIds} priorityFirst={4} />
        </div>
      </section>

      {/* Deals + Best sellers */}
      <section className="container mx-auto px-4 py-16 grid lg:grid-cols-2 gap-12">
        <div>
          <p className="text-rd-red font-bold uppercase tracking-[0.3em] text-xs mb-2">Combos durísimos</p>
          <h2 className="font-display text-3xl md:text-4xl tracking-tight mb-6">Ofertas pa'l bolsillo</h2>
          <div className="grid grid-cols-2 gap-4">
            {deals.map((p) => (
              <Link key={p.id} href={`/productos/${p.slug ?? p.id}`} className="group block relative aspect-[4/5] rounded-2xl overflow-hidden">
                <Image src={p.images[0]} alt={p.name} fill sizes="50vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute inset-x-3 bottom-3">
                  <p className="text-white font-bold text-sm line-clamp-1">{p.name}</p>
                  <p className="text-rd-yellow font-display text-xl">RD${p.discount_price ?? p.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="text-rd-red font-bold uppercase tracking-[0.3em] text-xs mb-2">Top ventas</p>
          <h2 className="font-display text-3xl md:text-4xl tracking-tight mb-6">Lo que el barrio compra</h2>
          <div className="space-y-3">
            {bestSellers.map((p, i) => (
              <Link key={p.id} href={`/productos/${p.slug ?? p.id}`} className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-zinc-100 transition">
                <span className="font-display text-3xl text-rd-red w-8">0{i + 1}</span>
                <div className="relative h-16 w-16 rounded-xl overflow-hidden flex-shrink-0">
                  <Image src={p.images[0]} alt={p.name} fill sizes="64px" className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold line-clamp-1 group-hover:text-rd-red">{p.name}</p>
                  <p className="text-sm text-zinc-500">{p.sales_count}+ vendidos · ⭐ {p.rating.toFixed(1)}</p>
                </div>
                <p className="font-display text-xl">RD${p.discount_price ?? p.price}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="relative bg-rd-red text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 urban-stripes" />
        <div className="container mx-auto px-4 py-16 relative grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="font-display text-4xl md:text-5xl tracking-tight">¿Primera compra?</h3>
            <p className="mt-3 text-white/90 text-lg">Activa tu cupón <b className="text-rd-yellow">BIENVENIDA20</b> y llévate 20% de descuento en tu primera orden. Pa' que arranques con flow.</p>
          </div>
          <div className="flex md:justify-end">
            <Link href="/registro">
              <Button size="lg" className="h-14 px-10 bg-rd-yellow hover:bg-rd-yellow-dark text-rd-charcoal font-display tracking-wider text-lg">
                Crear mi cuenta <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
