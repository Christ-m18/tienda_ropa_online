'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Heart, Plus, Minus, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/useCartStore'
import { toggleWishlist } from '@/lib/actions/wishlist'
import { useIsMounted } from '@/lib/hooks/useIsMounted'
import { toast } from 'sonner'

type Product = {
  id: string
  name: string
  price: number
  stock: number
  image: string
}

export default function ProductDetailActions({
  product,
  inWishlist,
}: {
  product: Product
  inWishlist: boolean
}) {
  const router = useRouter()
  const addItem = useCartStore((s) => s.addItem)
  const [qty, setQty] = useState(1)
  const [liked, setLiked] = useState(inWishlist)
  const [pending, startTransition] = useTransition()
  const isMounted = useIsMounted()

  function handleAddToCart() {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: qty,
      stock: product.stock,
    })
    toast.success(`${product.name} al carrito`)
  }

  function handleBuyNow() {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: qty,
      stock: product.stock,
    })
    router.push('/checkout')
  }

  function handleWishlist() {
    startTransition(async () => {
      const result = await toggleWishlist(product.id)
      if (!isMounted.current) return
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      setLiked(result.inWishlist)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-500">Cantidad:</span>
        <div className="flex items-center border border-zinc-200 rounded-full">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-10 text-center font-bold">{qty}</span>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={() => setQty((q) => Math.min(product.stock, q + 1))} disabled={qty >= product.stock}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          size="lg"
          onClick={handleBuyNow}
          disabled={product.stock === 0}
          className="flex-1 h-14 bg-rd-red hover:bg-rd-red-dark text-white font-display tracking-wider text-lg"
        >
          <Zap className="mr-2 h-5 w-5" /> Comprar ahora
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="flex-1 h-14 border-rd-charcoal hover:bg-rd-charcoal hover:text-white font-display tracking-wider text-lg"
        >
          <ShoppingCart className="mr-2 h-5 w-5" /> Al carrito
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={handleWishlist}
          disabled={pending}
          aria-label="Favoritos"
          className={`h-14 w-14 ${liked ? 'bg-rd-red text-white border-rd-red hover:bg-rd-red-dark' : ''}`}
        >
          <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
        </Button>
      </div>
    </div>
  )
}
