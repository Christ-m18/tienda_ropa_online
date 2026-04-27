'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Filter } from 'lucide-react'
import type { Category } from '@/types'

export default function CatalogFilters({
  categories,
  initial,
}: {
  categories: Category[]
  initial: Record<string, string | undefined>
}) {
  const router = useRouter()
  const sp = useSearchParams()
  const [pending, startTransition] = useTransition()

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(sp.toString())
    if (value == null || value === '') next.delete(key)
    else next.set(key, value)
    next.delete('page')
    startTransition(() => router.push(`/productos?${next.toString()}`))
  }

  function onPriceSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const next = new URLSearchParams(sp.toString())
    const min = fd.get('minPrice')?.toString() || ''
    const max = fd.get('maxPrice')?.toString() || ''
    if (min) next.set('minPrice', min); else next.delete('minPrice')
    if (max) next.set('maxPrice', max); else next.delete('maxPrice')
    next.delete('page')
    startTransition(() => router.push(`/productos?${next.toString()}`))
  }

  return (
    <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
      <div className="flex items-center gap-2 lg:hidden">
        <Filter className="h-4 w-4" />
        <h3 className="font-display text-xl tracking-wider">Filtros</h3>
      </div>

      <section>
        <h4 className="font-display text-sm tracking-[0.2em] uppercase text-zinc-500 mb-3">Categoría</h4>
        <div className="space-y-1">
          <button
            onClick={() => setParam('category', null)}
            className={`block text-left w-full px-3 py-2 rounded-lg text-sm font-medium hover:bg-zinc-100 ${
              !initial.category ? 'bg-rd-red text-white hover:bg-rd-red' : ''
            }`}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setParam('category', cat.slug)}
              className={`block text-left w-full px-3 py-2 rounded-lg text-sm font-medium hover:bg-zinc-100 ${
                initial.category === cat.slug ? 'bg-rd-red text-white hover:bg-rd-red' : ''
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h4 className="font-display text-sm tracking-[0.2em] uppercase text-zinc-500 mb-3">Precio</h4>
        <form onSubmit={onPriceSubmit} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input name="minPrice" type="number" min={0} placeholder="Mín" defaultValue={initial.minPrice ?? ''} />
            <Input name="maxPrice" type="number" min={0} placeholder="Máx" defaultValue={initial.maxPrice ?? ''} />
          </div>
          <Button type="submit" disabled={pending} size="sm" className="w-full bg-rd-charcoal hover:bg-rd-red">
            Aplicar
          </Button>
        </form>
      </section>

      <section>
        <h4 className="font-display text-sm tracking-[0.2em] uppercase text-zinc-500 mb-3">Disponibilidad</h4>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={initial.inStock === '1'}
            onChange={(e) => setParam('inStock', e.target.checked ? '1' : null)}
            className="h-4 w-4 accent-rd-red"
          />
          En stock
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer mt-2">
          <input
            type="checkbox"
            checked={initial.onSale === '1'}
            onChange={(e) => setParam('onSale', e.target.checked ? '1' : null)}
            className="h-4 w-4 accent-rd-red"
          />
          Solo en oferta
        </label>
      </section>
    </aside>
  )
}
