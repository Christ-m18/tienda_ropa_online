'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const STATUSES = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'processing', label: 'En proceso' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' },
]

const PAYMENT_STATUSES = [
  { value: 'all', label: 'Todos los pagos' },
  { value: 'pending', label: 'Pago pendiente' },
  { value: 'paid', label: 'Pagado' },
  { value: 'failed', label: 'Fallido' },
]

const PAYMENT_METHODS = [
  { value: 'all', label: 'Todos los metodos' },
  { value: 'cod', label: 'Contra entrega' },
  { value: 'bank_transfer', label: 'Transferencia' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'paypal', label: 'PayPal' },
]

export default function OrderFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/admin/ordenes?${params.toString()}`)
  }, [router, searchParams])

  const clear = useCallback(() => {
    router.push('/admin/ordenes')
  }, [router])

  const hasFilters = searchParams.toString().length > 0

  return (
    <div className="space-y-2">
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Buscar por ID o cliente..."
          defaultValue={searchParams.get('search') ?? ''}
          className="pl-8 h-9 text-sm"
          onChange={(e) => {
            e.target.dataset.pending = e.target.value
          }}
          onBlur={(e) => update('search', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') update('search', (e.target as HTMLInputElement).value)
          }}
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-2">
        <SelectFilter
          value={searchParams.get('status') ?? 'all'}
          options={STATUSES}
          onChange={(v) => update('status', v)}
        />
        <SelectFilter
          value={searchParams.get('payment_status') ?? 'all'}
          options={PAYMENT_STATUSES}
          onChange={(v) => update('payment_status', v)}
        />
        <SelectFilter
          value={searchParams.get('payment_method') ?? 'all'}
          options={PAYMENT_METHODS}
          onChange={(v) => update('payment_method', v)}
        />
        <Input
          type="date"
          className="h-9 text-sm"
          defaultValue={searchParams.get('date_from') ?? ''}
          onChange={(e) => update('date_from', e.target.value)}
        />
        <Input
          type="date"
          className="h-9 text-sm"
          defaultValue={searchParams.get('date_to') ?? ''}
          onChange={(e) => update('date_to', e.target.value)}
        />
        {hasFilters && (
          <Button variant="outline" size="sm" onClick={clear} className="h-9 text-xs gap-1">
            <X className="h-3.5 w-3.5" /> Limpiar
          </Button>
        )}
      </div>
    </div>
  )
}

function SelectFilter({
  value,
  options,
  onChange,
}: {
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (v: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full lg:w-auto rounded-md border border-zinc-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-rd-red"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
