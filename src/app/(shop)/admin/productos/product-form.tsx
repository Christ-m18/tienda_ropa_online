'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { upsertProduct } from '@/lib/actions/admin'
import { toast } from 'sonner'
import type { Category, Product } from '@/types'

export default function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const r = await upsertProduct(fd)
      if (!r.ok) {
        toast.error(r.message)
        return
      }
      toast.success('Guardado')
      router.push('/admin/productos')
    })
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-3xl border border-zinc-200 p-6 md:p-8 space-y-5 max-w-3xl">
      {product?.id && <input type="hidden" name="id" value={product.id} />}

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Nombre">
          <Input name="name" required defaultValue={product?.name} />
        </Field>
        <Field label="Slug">
          <Input name="slug" required defaultValue={product?.slug ?? ''} />
        </Field>
      </div>

      <Field label="Descripción">
        <textarea
          name="description"
          rows={4}
          defaultValue={product?.description ?? ''}
          className="w-full rounded-md border border-zinc-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rd-red"
        />
      </Field>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Precio">
          <Input name="price" type="number" step="0.01" min="0" required defaultValue={product?.price ?? ''} />
        </Field>
        <Field label="Precio oferta (opcional)">
          <Input name="discount_price" type="number" step="0.01" min="0" defaultValue={product?.discount_price ?? ''} />
        </Field>
        <Field label="Stock">
          <Input name="stock" type="number" min="0" required defaultValue={product?.stock ?? 0} />
        </Field>
      </div>

      <Field label="Categoría">
        <select name="category_id" defaultValue={product?.category_id ?? ''} className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm">
          <option value="">— sin categoría —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Materiales (opcional)">
          <Input name="materials" placeholder="Algodón macramé, madera de pino" defaultValue={product?.materials ?? ''} />
        </Field>
        <Field label="Dimensiones (opcional)">
          <Input name="dimensions" placeholder="60 x 90 cm" defaultValue={product?.dimensions ?? ''} />
        </Field>
      </div>

      <Field label="Cuidado de la pieza (opcional)">
        <textarea
          name="care_instructions"
          rows={3}
          defaultValue={product?.care_instructions ?? ''}
          placeholder="Limpiar con paño seco, evitar humedad y luz solar directa"
          className="w-full rounded-md border border-zinc-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rd-red"
        />
      </Field>

      <Field label="Imágenes (una URL por línea)">
        <textarea
          name="images"
          rows={4}
          required
          defaultValue={product?.images?.join('\n') ?? ''}
          className="w-full rounded-md border border-zinc-200 bg-white p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rd-red"
        />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_featured" defaultChecked={product?.is_featured} className="h-4 w-4 accent-rd-red" />
        Destacar en home
      </label>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" disabled={pending} className="bg-rd-red hover:bg-rd-red-dark text-white">
          {pending ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-zinc-600 mb-1 block">{label}</span>
      {children}
    </label>
  )
}
