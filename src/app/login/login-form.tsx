'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loginAction, type ActionState } from '@/lib/actions/auth'

const initial: ActionState = { status: 'idle' }

export default function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initial)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirect" value={redirectTo} />
      <div className="space-y-1">
        <label className="text-sm text-zinc-300">Correo electrónico</label>
        <Input
          name="email"
          type="email"
          placeholder="tu@correo.com"
          required
          className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus-visible:ring-rd-red"
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm text-zinc-300">Contraseña</label>
        <Input
          name="password"
          type="password"
          placeholder="••••••••"
          required
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
        {pending ? 'Entrando…' : 'Entrar al flow'}
      </Button>
    </form>
  )
}
