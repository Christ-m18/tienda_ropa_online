'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const ROLES = [
  { value: 'all', label: 'Todos los roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'client', label: 'Cliente' },
]

const BLOCKED = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'blocked', label: 'Bloqueados' },
]

export default function UserFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/admin/usuarios?${params.toString()}`)
  }, [router, searchParams])

  const clear = useCallback(() => {
    router.push('/admin/usuarios')
  }, [router])

  const hasFilters = searchParams.toString().length > 0

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Buscar por nombre o email..."
          defaultValue={searchParams.get('search') ?? ''}
          className="pl-8 h-9 text-sm"
          onBlur={(e) => update('search', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') update('search', (e.target as HTMLInputElement).value)
          }}
        />
      </div>
      <select
        value={searchParams.get('role') ?? 'all'}
        onChange={(e) => update('role', e.target.value)}
        className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-rd-red"
      >
        {ROLES.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <select
        value={searchParams.get('blocked') ?? 'all'}
        onChange={(e) => update('blocked', e.target.value)}
        className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-rd-red"
      >
        {BLOCKED.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={clear} className="h-9 text-xs gap-1">
          <X className="h-3.5 w-3.5" /> Limpiar
        </Button>
      )}
    </div>
  )
}
