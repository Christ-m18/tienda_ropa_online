'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateOrderStatus } from '@/lib/actions/admin'
import { toast } from 'sonner'

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const

export default function OrderStatusForm({ id, status, tracking }: { id: string; status: string; tracking: string }) {
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const r = await updateOrderStatus(fd)
      if (!r.ok) toast.error(r.message)
      else toast.success('Estado actualizado')
    })
  }

  return (
    <form onSubmit={onSubmit} className="bg-zinc-50 rounded-2xl p-4 grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
      <input type="hidden" name="id" value={id} />
      <label className="block">
        <span className="text-xs text-zinc-500 mb-1 block uppercase tracking-wider">Estado</span>
        <select name="status" defaultValue={status} className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm">
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="text-xs text-zinc-500 mb-1 block uppercase tracking-wider">N° de seguimiento</span>
        <Input name="tracking_number" defaultValue={tracking} placeholder="DOM-12345" />
      </label>
      <Button type="submit" disabled={pending} className="bg-rd-red hover:bg-rd-red-dark text-white">
        {pending ? 'Guardando…' : 'Actualizar'}
      </Button>
    </form>
  )
}
