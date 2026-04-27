'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { markAllRead } from '@/lib/actions/notifications'

export default function MarkAllReadButton() {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(async () => { await markAllRead() })}
    >
      Marcar todo como leído
    </Button>
  )
}
