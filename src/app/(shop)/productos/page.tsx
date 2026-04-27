import Link from 'next/link'
import { getProducts, type ProductFilters } from '@/lib/queries/products'
import { getCategories } from '@/lib/queries/categories'
import { getUserWishlistIds } from '@/lib/queries/user'
import ProductGrid from '@/components/products/ProductGrid'
import CatalogFilters from '@/components/products/CatalogFilters'
import SortSelect from '@/components/products/SortSelect'
import { Badge } from '@/components/ui/badge'

export const revalidate = 30

type SearchParams = Promise<{
  q?: string
  category?: string
  sort?: string
  minPrice?: string
  maxPrice?: string
  inStock?: string
  onSale?: string
  page?: string
}>

export default async function CatalogPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? '1'))
  const pageSize = 24
  const sort = (params.sort as ProductFilters['sort']) || 'newest'

  const filters: ProductFilters = {
    q: params.q,
    category: params.category,
    sort,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    inStock: params.inStock === '1',
    limit: pageSize,
    offset: (page - 1) * pageSize,
  }

  const [{ products, total }, categories, wishlistIds] = await Promise.all([
    getProducts(filters),
    getCategories(),
    getUserWishlistIds(),
  ])

  // Filtrado opcional client-side cuando el usuario quiere ver sólo ofertas
  const visible = params.onSale === '1'
    ? products.filter((p) => p.discount_price != null)
    : products

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <p className="text-rd-red font-bold uppercase tracking-[0.3em] text-xs">Catálogo</p>
          <h1 className="font-display text-4xl md:text-5xl tracking-tight">
            {params.q ? `Buscaste: "${params.q}"` : 'Toda la mercancía'}
          </h1>
          <p className="text-zinc-500 mt-1">{total} productos</p>
        </div>

        <SortSelect value={sort ?? 'newest'} />
      </div>

      {(params.category || params.minPrice || params.maxPrice || params.onSale || params.inStock) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {params.category && (
            <Badge variant="secondary" className="bg-zinc-100 text-zinc-700">
              Categoría: {categories.find((c) => c.slug === params.category)?.name ?? params.category}
            </Badge>
          )}
          {params.minPrice && <Badge variant="secondary">Mín RD${params.minPrice}</Badge>}
          {params.maxPrice && <Badge variant="secondary">Máx RD${params.maxPrice}</Badge>}
          {params.onSale === '1' && <Badge className="bg-rd-yellow text-rd-charcoal">Solo ofertas</Badge>}
          {params.inStock === '1' && <Badge variant="secondary">En stock</Badge>}
          <Link href="/productos" className="text-sm text-rd-red font-bold hover:underline self-center ml-1">Limpiar filtros</Link>
        </div>
      )}

      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        <CatalogFilters categories={categories} initial={params} />
        <div>
          <ProductGrid products={visible} wishlistIds={wishlistIds} />

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1
                const sp = new URLSearchParams(params as Record<string, string>)
                sp.set('page', String(p))
                return (
                  <Link
                    key={p}
                    href={`/productos?${sp.toString()}`}
                    className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                      p === page ? 'bg-rd-red text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    {p}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
