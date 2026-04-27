'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteProduct } from '@/lib/actions/admin'
import { toast } from 'sonner'

export default function DeleteProductButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm('¿Eliminar este producto?')) return
        startTransition(async () => {
          const r = await deleteProduct(id)
          if (!r.ok) toast.error(r.message)
          else toast.success('Producto eliminado')
        })
      }}
      className="text-sm text-zinc-500 hover:text-rd-red disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
