'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

const SORTS = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'best_selling', label: 'Más vendidos' },
  { value: 'top_rated', label: 'Mejor valorados' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
]

export default function SortSelect({ value }: { value: string }) {
  const router = useRouter()
  const sp = useSearchParams()
  const [pending, startTransition] = useTransition()

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(sp.toString())
    next.set('sort', e.target.value)
    next.delete('page')
    startTransition(() => router.push(`/productos?${next.toString()}`))
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-zinc-500">Ordenar:</label>
      <select
        value={value}
        onChange={onChange}
        disabled={pending}
        className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rd-red"
      >
        {SORTS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
