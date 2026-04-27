import Link from 'next/link'
import { getUserWishlist } from '@/lib/queries/user'
import ProductCard from '@/components/products/ProductCard'

export default async function WishlistPage() {
  const wishlist = await getUserWishlist()

  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl tracking-tight mb-6">Mis favoritos</h1>
      {wishlist.length === 0 ? (
        <p className="text-zinc-500">
          Aún no tienes favoritos. <Link href="/productos" className="text-rd-red font-bold hover:underline">Explora productos</Link> y dale al ❤️.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {wishlist.map((w) => w.product && (
            <ProductCard key={w.id} product={w.product} inWishlist />
          ))}
        </div>
      )}
    </div>
  )
}
