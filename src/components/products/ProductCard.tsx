'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Heart, Star } from 'lucide-react'
import { useTransition, useState, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/store/useCartStore'
import { toggleWishlist } from '@/lib/actions/wishlist'
import { useIsMounted } from '@/lib/hooks/useIsMounted'
import { toast } from 'sonner'
import { formatRD, discountPercent } from '@/lib/format'
import type { Product } from '@/types'

function ProductCard({
  product,
  inWishlist = false,
  priority = false,
}: {
  product: Product
  inWishlist?: boolean
  priority?: boolean
}) {
  const addItem = useCartStore((s) => s.addItem)
  const [pending, startTransition] = useTransition()
  const [liked, setLiked] = useState(inWishlist)
  const isMounted = useIsMounted()

  const slugOrId = product.slug || product.id
  const off = discountPercent(product.price, product.discount_price)
  const finalPrice = product.discount_price ?? product.price
  const cover = product.images?.[0] ?? '/placeholder.png'

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    addItem({
      id: product.id,
      name: product.name,
      price: finalPrice,
      image: cover,
      quantity: 1,
      stock: product.stock,
    })
    toast.success(`${product.name} al carrito`)
  }

  function handleToggleWishlist(e: React.MouseEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await toggleWishlist(product.id)
      if (!isMounted.current) return
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      setLiked(result.inWishlist)
      toast.success(result.inWishlist ? 'Añadido a favoritos' : 'Quitado de favoritos')
    })
  }

  return (
    <div className="group relative">
      <Link href={`/productos/${slugOrId}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-zinc-100">
          <Image
            src={cover}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {off > 0 && (
              <Badge className="bg-rd-red text-white font-bold uppercase tracking-wider">-{off}%</Badge>
            )}
            {product.is_featured && (
              <Badge className="bg-rd-yellow text-rd-charcoal font-bold uppercase tracking-wider">Tá fuego</Badge>
            )}
            {product.stock === 0 && (
              <Badge variant="secondary" className="bg-zinc-900 text-white">Agotado</Badge>
            )}
          </div>

          <button
            onClick={handleToggleWishlist}
            disabled={pending}
            aria-label="Añadir a favoritos"
            className={`absolute top-3 right-3 h-9 w-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
              liked ? 'bg-rd-red text-white' : 'bg-white/80 text-zinc-700 hover:bg-white opacity-0 group-hover:opacity-100'
            }`}
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
          </button>

          <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <Button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full h-10 bg-rd-charcoal hover:bg-rd-red text-white font-bold uppercase tracking-wider"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {product.stock === 0 ? 'Agotado' : 'Al carrito'}
            </Button>
          </div>
        </div>

        <div className="pt-3 px-1 space-y-1">
          {product.category && (
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">{product.category.name}</p>
          )}
          <h3 className="font-bold text-sm md:text-base line-clamp-1 group-hover:text-rd-red transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-xl text-rd-charcoal">{formatRD(finalPrice)}</span>
              {off > 0 && <span className="text-sm text-zinc-400 line-through">{formatRD(product.price)}</span>}
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Star className="h-3.5 w-3.5 fill-rd-yellow text-rd-yellow" />
              <span className="text-zinc-600">{product.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default memo(ProductCard, (prev, next) =>
  prev.product.id === next.product.id &&
  prev.product.stock === next.product.stock &&
  prev.product.discount_price === next.product.discount_price &&
  prev.inWishlist === next.inWishlist &&
  prev.priority === next.priority
)
