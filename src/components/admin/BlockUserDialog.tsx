'use client'

import { useState, useTransition } from 'react'
import { Ban, Unlock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { blockUser, unblockUser } from '@/lib/actions/block-user'
import { toast } from 'sonner'

export function BlockButton({
  userId,
  userName,
  isSelf,
}: {
  userId: string
  userName: string
  isSelf: boolean
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [pending, startTransition] = useTransition()

  function handleBlock() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('user_id', userId)
      fd.set('reason', reason)
      const r = await blockUser(fd)
      if (!r.ok) toast.error(r.message)
      else {
        toast.success('Usuario bloqueado')
        setOpen(false)
        setReason('')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isSelf}
          className="text-red-600 border-red-200 hover:bg-red-50 gap-1 h-8 text-xs"
          title={isSelf ? 'No puedes bloquearte a ti mismo' : undefined}
        >
          <Ban className="h-3.5 w-3.5" /> Bloquear
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bloquear usuario</DialogTitle>
          <DialogDescription>
            Bloquear a <strong>{userName}</strong>. No podra comprar ni acceder a la tienda.
          </DialogDescription>
        </DialogHeader>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Motivo del bloqueo (requerido)..."
          className="w-full rounded-lg border border-zinc-200 p-2.5 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-rd-red"
        />
        <DialogFooter>
          <Button
            onClick={handleBlock}
            disabled={pending || reason.trim().length < 3}
            className="bg-red-600 hover:bg-red-700 text-white gap-1"
          >
            <Ban className="h-4 w-4" />
            {pending ? 'Bloqueando...' : 'Confirmar bloqueo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function UnblockButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition()

  function handleUnblock() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('user_id', userId)
      const r = await unblockUser(fd)
      if (!r.ok) toast.error(r.message)
      else toast.success('Usuario desbloqueado')
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleUnblock}
      disabled={pending}
      className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1 h-8 text-xs"
    >
      <Unlock className="h-3.5 w-3.5" />
      {pending ? 'Procesando...' : 'Desbloquear'}
    </Button>
  )
}
