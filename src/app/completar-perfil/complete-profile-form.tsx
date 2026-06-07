'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { completeProfileAction, type ActionState } from '@/lib/actions/auth'

const initial: ActionState = { status: 'idle' }

export default function CompleteProfileForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(completeProfileAction, initial)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-1">
        <label className="text-sm text-zinc-300">Nombre completo</label>
        <Input
          name="full_name"
          required
          minLength={2}
          placeholder="Juan Dominicano"
          className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus-visible:ring-rd-red"
        />
      </div>
      {state.status === 'error' && (
        <p className="text-sm text-red-400">{state.message}</p>
      )}
      <Button
        type="submit"
        disabled={pending}
        className="w-full h-12 text-base font-display tracking-wide bg-rd-red hover:bg-rd-red/90 text-white"
      >
        {pending ? 'Guardando…' : 'Continuar'}
      </Button>
    </form>
  )
}
