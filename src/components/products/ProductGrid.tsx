import ProductCard from './ProductCard'
import type { Product } from '@/types'

export default function ProductGrid({
  products,
  wishlistIds,
  priorityFirst = 0,
}: {
  products: Product[]
  wishlistIds?: Set<string>
  priorityFirst?: number
}) {
  if (products.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
        <div className="h-20 w-20 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
          <span className="font-display text-4xl text-zinc-400">0</span>
        </div>
        <p className="font-display text-2xl text-zinc-700">Nada por aquí</p>
        <p className="text-zinc-500 mt-2">Cambia los filtros o busca otra cosa.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((product, i) => (
        <ProductCard
          key={product.id}
          product={product}
          inWishlist={wishlistIds?.has(product.id) ?? false}
          priority={i < priorityFirst}
        />
      ))}
    </div>
  )
}
