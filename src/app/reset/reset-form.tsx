'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updatePasswordAction, type ActionState } from '@/lib/actions/auth'

const initial: ActionState = { status: 'idle' }

export default function ResetForm() {
  const [state, formAction, pending] = useActionState(updatePasswordAction, initial)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const mismatch = password.length > 0 && confirm.length > 0 && password !== confirm

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm text-zinc-300">Nueva contraseña</label>
        <Input
          name="password"
          type="password"
          placeholder="••••••••"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus-visible:ring-rd-red"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm text-zinc-300">Confirmar contraseña</label>
        <Input
          name="confirm"
          type="password"
          placeholder="••••••••"
          required
          minLength={6}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus-visible:ring-rd-red"
        />
      </div>
      {mismatch && (
        <p className="text-sm text-red-400">Las contraseñas no coinciden</p>
      )}
      {state.status === 'error' && (
        <p className="text-sm text-red-400">{state.message}</p>
      )}
      <Button
        type="submit"
        disabled={pending || mismatch}
        className="w-full h-12 text-base font-display tracking-wide bg-rd-red hover:bg-rd-red/90 text-white"
      >
        {pending ? 'Guardando…' : 'Actualizar contraseña'}
      </Button>
    </form>
  )
}
