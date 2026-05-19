'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

const uploadSchema = z.object({
  order_id: z.string().uuid(),
  bank_name: z.string().min(1, 'Selecciona un banco'),
  reference_number: z.string().min(1, 'Ingresa el número de referencia'),
  amount: z.coerce.number().positive('Ingresa el monto transferido'),
  notes: z.string().optional(),
})

export async function uploadVoucher(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: 'Inicia sesión' }

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return { ok: false as const, message: 'Sube un comprobante' }
  if (file.size > MAX_FILE_SIZE) return { ok: false as const, message: 'El archivo no puede superar 5MB' }
  if (!ALLOWED_TYPES.includes(file.type)) return { ok: false as const, message: 'Formato no válido. Usa JPG, PNG, WebP o PDF' }

  const parsed = uploadSchema.safeParse({
    order_id: formData.get('order_id'),
    bank_name: formData.get('bank_name'),
    reference_number: formData.get('reference_number'),
    amount: formData.get('amount'),
    notes: formData.get('notes'),
  })
  if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  // Verify the order belongs to this user and is bank_transfer
  const { data: order } = await supabase
    .from('orders')
    .select('id, payment_method')
    .eq('id', parsed.data.order_id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!order) return { ok: false as const, message: 'Pedido no encontrado' }
  if (order.payment_method !== 'bank_transfer') return { ok: false as const, message: 'Este pedido no usa transferencia bancaria' }

  // Upload file to storage
  const ext = file.name.split('.').pop() ?? 'jpg'
  const filePath = `${user.id}/${parsed.data.order_id}/${Date.now()}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from('payment-vouchers')
    .upload(filePath, file, { contentType: file.type, upsert: false })
  if (uploadError) return { ok: false as const, message: 'Error al subir el archivo: ' + uploadError.message }

  // Create payment proof record
  const { error: insertError } = await supabase.from('payment_proofs').insert({
    order_id: parsed.data.order_id,
    user_id: user.id,
    file_path: filePath,
    bank_name: parsed.data.bank_name,
    reference_number: parsed.data.reference_number,
    amount: parsed.data.amount,
    notes: parsed.data.notes || null,
  })
  if (insertError) return { ok: false as const, message: 'Error al guardar el comprobante' }

  // Notification - confirm receipt
  await supabase.from('notifications').insert({
    user_id: user.id,
    title: 'Comprobante recibido',
    message: `Tu comprobante para el pedido #${parsed.data.order_id.slice(0, 8)} está siendo revisado.`,
    type: 'order',
    link: `/perfil/pedidos/${parsed.data.order_id}`,
  })

  revalidatePath(`/perfil/pedidos/${parsed.data.order_id}`)
  revalidatePath('/admin/ordenes')
  return { ok: true as const }
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, ok: false as const }
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
  if (!profile?.is_admin) return { supabase, ok: false as const }
  return { supabase, ok: true as const, userId: user.id }
}

const reviewSchema = z.object({
  proof_id: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  rejection_reason: z.string().optional(),
})

export async function reviewPaymentProof(formData: FormData) {
  const guard = await requireAdmin()
  if (!guard.ok) return { ok: false as const, message: 'No autorizado' }

  const parsed = reviewSchema.safeParse({
    proof_id: formData.get('proof_id'),
    action: formData.get('action'),
    rejection_reason: formData.get('rejection_reason'),
  })
  if (!parsed.success) return { ok: false as const, message: 'Datos inválidos' }

  if (parsed.data.action === 'reject' && !parsed.data.rejection_reason?.trim()) {
    return { ok: false as const, message: 'Ingresa un motivo de rechazo' }
  }

  // Get the proof with order info
  const { data: proof } = await guard.supabase
    .from('payment_proofs')
    .select('id, order_id, user_id, status')
    .eq('id', parsed.data.proof_id)
    .maybeSingle()
  if (!proof) return { ok: false as const, message: 'Comprobante no encontrado' }
  if (proof.status !== 'pending') return { ok: false as const, message: 'Este comprobante ya fue revisado' }

  const isApprove = parsed.data.action === 'approve'

  // Update proof
  const { error: proofError } = await guard.supabase
    .from('payment_proofs')
    .update({
      status: isApprove ? 'approved' : 'rejected',
      reviewed_by: guard.userId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: isApprove ? null : parsed.data.rejection_reason,
    })
    .eq('id', parsed.data.proof_id)
  if (proofError) return { ok: false as const, message: proofError.message }

  // Update order
  if (isApprove) {
    await guard.supabase
      .from('orders')
      .update({ payment_status: 'paid', status: 'processing' })
      .eq('id', proof.order_id)
  } else {
    await guard.supabase
      .from('orders')
      .update({ payment_status: 'failed' })
      .eq('id', proof.order_id)
  }

  // Notification to user
  await guard.supabase.from('notifications').insert({
    user_id: proof.user_id,
    title: isApprove ? 'Pago aprobado' : 'Pago rechazado',
    message: isApprove
      ? `Tu pago para el pedido #${proof.order_id.slice(0, 8)} fue aprobado. Tu pedido está en proceso.`
      : `Tu comprobante para el pedido #${proof.order_id.slice(0, 8)} fue rechazado: ${parsed.data.rejection_reason}`,
    type: 'order',
    link: `/perfil/pedidos/${proof.order_id}`,
  })

  // Audit log
  await guard.supabase.from('audit_logs').insert({
    user_id: guard.userId,
    action: isApprove ? 'payment_proof.approved' : 'payment_proof.rejected',
    entity_type: 'payment_proof',
    entity_id: parsed.data.proof_id,
    metadata: {
      order_id: proof.order_id,
      rejection_reason: parsed.data.rejection_reason ?? null,
    },
  })

  revalidatePath(`/admin/ordenes/${proof.order_id}`)
  revalidatePath('/admin/ordenes')
  revalidatePath('/admin')
  return { ok: true as const }
}
