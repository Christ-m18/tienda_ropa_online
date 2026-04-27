import { notFound } from 'next/navigation'
import { getProductByIdOrSlug } from '@/lib/queries/products'
import { getCategories } from '@/lib/queries/categories'
import ProductForm from '../product-form'

type RouteParams = Promise<{ id: string }>

export default async function EditProductPage({ params }: { params: RouteParams }) {
  const { id } = await params
  const [product, categories] = await Promise.all([getProductByIdOrSlug(id), getCategories()])
  if (!product) notFound()
  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl tracking-tight mb-6">Editar: {product.name}</h1>
      <ProductForm product={product} categories={categories} />
    </div>
  )
}
