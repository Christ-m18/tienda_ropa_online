'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, ok: false as const }
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
  if (!profile?.is_admin) return { supabase, ok: false as const }
  return { supabase, ok: true as const, userId: user.id }
}

const blockSchema = z.object({
  user_id: z.string().uuid(),
  reason: z.string().min(3, 'Ingresa un motivo de al menos 3 caracteres'),
})

export async function blockUser(formData: FormData) {
  const guard = await requireAdmin()
  if (!guard.ok) return { ok: false as const, message: 'No autorizado' }

  const parsed = blockSchema.safeParse({
    user_id: formData.get('user_id'),
    reason: formData.get('reason'),
  })
  if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  // Prevent self-blocking
  if (parsed.data.user_id === guard.userId) {
    return { ok: false as const, message: 'No puedes bloquearte a ti mismo' }
  }

  const { error } = await guard.supabase
    .from('profiles')
    .update({
      is_blocked: true,
      blocked_reason: parsed.data.reason,
      blocked_at: new Date().toISOString(),
      blocked_by: guard.userId,
    })
    .eq('id', parsed.data.user_id)
  if (error) return { ok: false as const, message: error.message }

  // Notification
  await guard.supabase.from('notifications').insert({
    user_id: parsed.data.user_id,
    title: 'Cuenta suspendida',
    message: `Tu cuenta ha sido suspendida. Motivo: ${parsed.data.reason}`,
    type: 'system',
  })

  // Audit log
  await guard.supabase.from('audit_logs').insert({
    user_id: guard.userId,
    action: 'profile.blocked',
    entity_type: 'profile',
    entity_id: parsed.data.user_id,
    metadata: { reason: parsed.data.reason },
  })

  revalidatePath('/admin/usuarios')
  return { ok: true as const }
}

const unblockSchema = z.object({
  user_id: z.string().uuid(),
})

export async function unblockUser(formData: FormData) {
  const guard = await requireAdmin()
  if (!guard.ok) return { ok: false as const, message: 'No autorizado' }

  const parsed = unblockSchema.safeParse({
    user_id: formData.get('user_id'),
  })
  if (!parsed.success) return { ok: false as const, message: 'Datos inválidos' }

  const { error } = await guard.supabase
    .from('profiles')
    .update({
      is_blocked: false,
      blocked_reason: null,
      blocked_at: null,
      blocked_by: null,
    })
    .eq('id', parsed.data.user_id)
  if (error) return { ok: false as const, message: error.message }

  // Notification
  await guard.supabase.from('notifications').insert({
    user_id: parsed.data.user_id,
    title: 'Cuenta restaurada',
    message: 'Tu cuenta ha sido reactivada. Puedes continuar usando la tienda.',
    type: 'system',
  })

  // Audit log
  await guard.supabase.from('audit_logs').insert({
    user_id: guard.userId,
    action: 'profile.unblocked',
    entity_type: 'profile',
    entity_id: parsed.data.user_id,
  })

  revalidatePath('/admin/usuarios')
  return { ok: true as const }
}
