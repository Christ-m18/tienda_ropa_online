'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import OAuthButtons from '@/components/auth/OAuthButtons'
import { registerAction, type ActionState } from '@/lib/actions/auth'

const initial: ActionState = { status: 'idle' }

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initial)

  return (
    <div>
      <OAuthButtons />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-zinc-950 px-3 text-zinc-500 uppercase tracking-widest">
            o registrate con correo
          </span>
        </div>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm text-zinc-300">Nombre completo</label>
          <Input
            name="full_name"
            required
            placeholder="Juan Dominicano"
            className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus-visible:ring-rd-red"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-zinc-300">Correo electrónico</label>
          <Input
            name="email"
            type="email"
            required
            placeholder="tu@correo.com"
            className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus-visible:ring-rd-red"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-zinc-300">Contraseña</label>
          <Input
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
            className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus-visible:ring-rd-red"
          />
        </div>
        {state.status === 'error' && <p className="text-sm text-red-400">{state.message}</p>}
        <Button
          type="submit"
          disabled={pending}
          className="w-full h-12 text-base font-display tracking-wide bg-rd-yellow hover:bg-rd-yellow/90 text-zinc-900"
        >
          {pending ? 'Creando…' : 'Activar mi cuenta'}
        </Button>
      </form>
    </div>
  )
}
