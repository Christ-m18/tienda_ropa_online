import Link from 'next/link'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getAdminProducts } from '@/lib/queries/admin'
import { formatRD } from '@/lib/format'
import DeleteProductButton from './delete-button'

export default async function AdminProductsPage() {
  const products = await getAdminProducts()
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl tracking-tight">Productos</h1>
          <p className="text-zinc-500">{products.length} productos</p>
        </div>
        <Link href="/admin/productos/nuevo">
          <Button className="bg-rd-red hover:bg-rd-red-dark text-white"><Plus className="h-4 w-4 mr-1" /> Nuevo producto</Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="text-left px-4 py-3">Producto</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Categoría</th>
              <th className="text-right px-4 py-3">Precio</th>
              <th className="text-right px-4 py-3 hidden sm:table-cell">Stock</th>
              <th className="text-right px-4 py-3 hidden lg:table-cell">Vendidos</th>
              <th className="text-right px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-50/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-zinc-100 flex-shrink-0">
                      {p.images?.[0] && <Image src={p.images[0]} alt={p.name} fill sizes="48px" className="object-cover" />}
                    </div>
                    <div>
                      <p className="font-bold line-clamp-1">{p.name}</p>
                      {p.is_featured && <Badge className="bg-rd-yellow text-rd-charcoal text-[10px] mt-0.5">Destacado</Badge>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-zinc-500">{p.category?.name ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <p className="font-bold">{formatRD(p.discount_price ?? p.price)}</p>
                  {p.discount_price && <p className="text-xs text-zinc-400 line-through">{formatRD(p.price)}</p>}
                </td>
                <td className="px-4 py-3 text-right hidden sm:table-cell">
                  <span className={p.stock <= 5 ? 'text-rd-red font-bold' : ''}>{p.stock}</span>
                </td>
                <td className="px-4 py-3 text-right hidden lg:table-cell text-zinc-500">{p.sales_count}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/productos/${p.id}`} className="text-sm text-rd-red font-bold hover:underline">Editar</Link>
                    <DeleteProductButton id={p.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
