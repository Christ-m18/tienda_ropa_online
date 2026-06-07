'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

const loginSchema = z.object({
  email: z.email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

const registerSchema = z.object({
  full_name: z.string().min(2, 'Tu nombre completo'),
  email: z.email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

const resetRequestSchema = z.object({
  email: z.email('Correo inválido'),
})

const updatePasswordSchema = z
  .object({
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirm: z.string().min(6, 'Mínimo 6 caracteres'),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm'],
  })

export type ActionState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'success'; message?: string }

export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) {
    return { status: 'error', message: 'Credenciales inválidas' }
  }
  const redirectTo = (formData.get('redirect') as string) || '/'
  revalidatePath('/', 'layout')
  redirect(redirectTo)
}

export async function registerAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }
  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  })
  if (error) {
    return { status: 'error', message: error.message }
  }
  revalidatePath('/', 'layout')
  redirect(`/registro/exito?email=${encodeURIComponent(parsed.data.email)}`)
}

export async function completeProfileAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const full_name = (formData.get('full_name') as string)?.trim()
  if (!full_name || full_name.length < 2) {
    return { status: 'error', message: 'El nombre debe tener al menos 2 caracteres' }
  }
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return { status: 'error', message: 'Sesión no válida' }
  }
  const { error } = await supabase.from('profiles').update({ full_name }).eq('id', user.id)
  if (error) {
    return { status: 'error', message: error.message }
  }
  const next = (formData.get('next') as string) || '/'
  revalidatePath('/', 'layout')
  redirect(next)
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function requestPasswordResetAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = resetRequestSchema.safeParse({
    email: formData.get('email'),
  })
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }
  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/reset`,
  })
  return { status: 'success', message: 'Te enviamos un correo si la cuenta existe.' }
}

export async function updatePasswordAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  })
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) {
    return { status: 'error', message: error.message }
  }
  revalidatePath('/', 'layout')
  redirect('/')
}
