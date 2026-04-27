'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { setUserAdmin } from '@/lib/actions/admin'
import { toast } from 'sonner'

export default function ToggleAdminButton({ userId, isAdmin }: { userId: string; isAdmin: boolean }) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('user_id', userId)
      fd.set('is_admin', String(!isAdmin))
      const r = await setUserAdmin(fd)
      if (!r.ok) toast.error(r.message)
      else toast.success(isAdmin ? 'Permisos admin revocados' : 'Promovido a admin')
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={pending}>
      {pending ? 'Guardando...' : isAdmin ? 'Quitar admin' : 'Hacer admin'}
    </Button>
  )
}
