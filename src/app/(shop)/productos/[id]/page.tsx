import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Truck, RefreshCw, ShieldCheck, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  getProductByIdOrSlug,
  getRelatedProducts,
  getProductReviews,
} from '@/lib/queries/products'
import { getUserWishlistIds } from '@/lib/queries/user'
import ProductGrid from '@/components/products/ProductGrid'
import ProductDetailActions from '@/components/products/ProductDetailActions'
import ReviewsSection from '@/components/products/ReviewsSection'
import ProductGallery from '@/components/products/ProductGallery'
import SizeGuideButton from '@/components/products/SizeGuideButton'
import { formatRD, discountPercent } from '@/lib/format'

type RouteParams = Promise<{ id: string }>

export const revalidate = 30

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const product = await getProductByIdOrSlug(id)

  if (!product) {
    return {
      title: 'Producto no encontrado | TIENDA RD',
      description: 'El producto que buscas no existe o ya no esta disponible.',
    }
  }

  const image = product.images?.[0]

  return {
    title: `${product.name} | TIENDA RD`,
    description: product.description,
    openGraph: {
      title: `${product.name} | TIENDA RD`,
      description: product.description,
      type: 'website',
      images: image ? [image] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | TIENDA RD`,
      description: product.description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function ProductDetailPage({ params }: { params: RouteParams }) {
  const { id } = await params
  const product = await getProductByIdOrSlug(id)
  if (!product) notFound()

  const [related, reviews, wishlistIds] = await Promise.all([
    getRelatedProducts(product.id, product.category_id ?? undefined),
    getProductReviews(product.id),
    getUserWishlistIds(),
  ])

  const off = discountPercent(product.price, product.discount_price)
  const finalPrice = product.discount_price ?? product.price
  const inWishlist = wishlistIds.has(product.id)

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <nav className="text-xs text-zinc-500 mb-6 flex gap-2 items-center">
          <Link href="/" className="hover:text-rd-red">Inicio</Link>
          <span>/</span>
          <Link href="/productos" className="hover:text-rd-red">Productos</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link href={`/categorias/${product.category.slug}`} className="hover:text-rd-red">{product.category.name}</Link>
            </>
          )}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <ProductGallery
            images={product.images}
            alt={product.name}
            discountLabel={off > 0 ? `-${off}%` : undefined}
          />

          {/* Info */}
          <div className="space-y-6">
            <div className="space-y-2">
              {product.category && (
                <Badge className="bg-rd-yellow text-rd-charcoal font-bold uppercase tracking-widest">{product.category.name}</Badge>
              )}
              <h1 className="font-display text-3xl md:text-5xl tracking-tight">{product.name}</h1>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-rd-yellow text-rd-yellow' : 'text-zinc-300'}`} />
                  ))}
                  <span className="ml-1 text-zinc-600">{product.rating.toFixed(1)} ({reviews.length} reseñas)</span>
                </div>
                <span className="text-zinc-300">·</span>
                <span className={product.stock > 0 ? 'text-emerald-600 font-bold' : 'text-rd-red font-bold'}>
                  {product.stock > 0 ? `En stock (${product.stock})` : 'Agotado'}
                </span>
                <span className="text-zinc-300">·</span>
                <span className="text-zinc-500">{product.sales_count}+ vendidos</span>
              </div>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="font-display text-5xl text-rd-charcoal">{formatRD(finalPrice)}</span>
              {off > 0 && (
                <>
                  <span className="text-2xl text-zinc-400 line-through">{formatRD(product.price)}</span>
                  <Badge className="bg-rd-red/10 text-rd-red font-bold">Ahorras {formatRD(product.price - finalPrice)}</Badge>
                </>
              )}
            </div>

            <p className="text-zinc-600 leading-relaxed text-base">{product.description}</p>

            <SizeGuideButton />

            <ProductDetailActions
              product={{
                id: product.id,
                name: product.name,
                price: finalPrice,
                stock: product.stock,
                image: product.images[0],
              }}
              inWishlist={inWishlist}
            />

            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-zinc-200">
              <div className="text-center p-3 bg-zinc-50 rounded-xl">
                <Truck className="h-5 w-5 mx-auto text-rd-red mb-1.5" />
                <p className="text-xs font-bold uppercase tracking-wider">Envío</p>
                <p className="text-[10px] text-zinc-500">Gratis +RD$3,000</p>
              </div>
              <div className="text-center p-3 bg-zinc-50 rounded-xl">
                <RefreshCw className="h-5 w-5 mx-auto text-rd-red mb-1.5" />
                <p className="text-xs font-bold uppercase tracking-wider">Cambios</p>
                <p className="text-[10px] text-zinc-500">30 días</p>
              </div>
              <div className="text-center p-3 bg-zinc-50 rounded-xl">
                <ShieldCheck className="h-5 w-5 mx-auto text-rd-red mb-1.5" />
                <p className="text-xs font-bold uppercase tracking-wider">Pago</p>
                <p className="text-[10px] text-zinc-500">Contra entrega</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-16">
          <h2 className="font-display text-3xl tracking-tight mb-6">Reseñas de la comunidad</h2>
          <ReviewsSection productId={product.id} reviews={reviews} />
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-20">
            <p className="text-rd-red font-bold uppercase tracking-[0.3em] text-xs mb-2">Pa' que combines</p>
            <h2 className="font-display text-3xl md:text-4xl tracking-tight mb-6">Te puede gustar también</h2>
            <ProductGrid products={related} wishlistIds={wishlistIds} />
          </section>
        )}
      </div>
    </>
  )
}
