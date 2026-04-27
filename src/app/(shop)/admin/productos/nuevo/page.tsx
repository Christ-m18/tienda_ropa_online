import { getCategories } from '@/lib/queries/categories'
import ProductForm from '../product-form'

export default async function NewProductPage() {
  const categories = await getCategories()
  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl tracking-tight mb-6">Nuevo producto</h1>
      <ProductForm categories={categories} />
    </div>
  )
}
