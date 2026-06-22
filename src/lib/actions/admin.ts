'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import type { OrderStatus } from '@/types'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, ok: false as const }
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
  if (!profile?.is_admin) return { supabase, ok: false as const }
  return { supabase, ok: true as const, userId: user.id }
}

const productSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().min(2),
  description: z.string().min(0),
  category_id: z.uuid().nullable().optional(),
  slug: z.string().min(2),
  price: z.coerce.number().nonnegative(),
  discount_price: z.coerce.number().nonnegative().nullable().optional(),
  stock: z.coerce.number().int().nonnegative(),
  images: z.array(z.string().url()).min(1),
  is_featured: z.coerce.boolean().optional(),
  materials: z.string().nullable().optional(),
  dimensions: z.string().nullable().optional(),
  care_instructions: z.string().nullable().optional(),
})

export async function upsertProduct(formData: FormData) {
  const guard = await requireAdmin()
  if (!guard.ok) return { ok: false as const, message: 'No autorizado' }

  const parsed = productSchema.safeParse({
    id: formData.get('id') || undefined,
    name: formData.get('name'),
    description: formData.get('description'),
    category_id: formData.get('category_id') || null,
    slug: formData.get('slug'),
    price: formData.get('price'),
    discount_price: formData.get('discount_price') || null,
    stock: formData.get('stock'),
    images: (formData.get('images') as string ?? '').split('\n').map((s) => s.trim()).filter(Boolean),
    is_featured: formData.get('is_featured') === 'on',
    materials: formData.get('materials') || null,
    dimensions: formData.get('dimensions') || null,
    care_instructions: formData.get('care_instructions') || null,
  })
  if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const { error } = await guard.supabase.from('products').upsert(parsed.data)
  if (error) return { ok: false as const, message: error.message }

  await guard.supabase.from('audit_logs').insert({
    user_id: guard.userId,
    action: parsed.data.id ? 'product.update' : 'product.create',
    entity_type: 'product',
    entity_id: parsed.data.id,
    metadata: { name: parsed.data.name },
  })

  revalidatePath('/admin/productos')
  revalidatePath('/productos')
  return { ok: true as const }
}

export async function deleteProduct(id: string) {
  const guard = await requireAdmin()
  if (!guard.ok) return { ok: false as const, message: 'No autorizado' }

  const { error } = await guard.supabase.from('products').delete().eq('id', id)
  if (error) return { ok: false as const, message: error.message }

  await guard.supabase.from('audit_logs').insert({
    user_id: guard.userId,
    action: 'product.delete',
    entity_type: 'product',
    entity_id: id,
  })

  revalidatePath('/admin/productos')
  revalidatePath('/productos')
  return { ok: true as const }
}

const orderUpdateSchema = z.object({
  id: z.uuid(),
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  tracking_number: z.string().optional(),
})

export async function updateOrderStatus(formData: FormData) {
  const guard = await requireAdmin()
  if (!guard.ok) return { ok: false as const, message: 'No autorizado' }

  const parsed = orderUpdateSchema.safeParse({
    id: formData.get('id'),
    status: formData.get('status'),
    tracking_number: formData.get('tracking_number') || undefined,
  })
  if (!parsed.success) return { ok: false as const, message: 'Datos inválidos' }

  const { data: order, error } = await guard.supabase
    .from('orders')
    .update({ status: parsed.data.status, tracking_number: parsed.data.tracking_number })
    .eq('id', parsed.data.id)
    .select('user_id')
    .single()
  if (error) return { ok: false as const, message: error.message }

  const niceStatus: Record<OrderStatus, string> = {
    pending: 'Pendiente',
    processing: 'En proceso',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  }
  await guard.supabase.from('notifications').insert({
    user_id: order.user_id,
    title: 'Tu pedido cambió de estado',
    message: `Estado: ${niceStatus[parsed.data.status]}`,
    type: 'order',
    link: `/perfil/pedidos/${parsed.data.id}`,
  })

  await guard.supabase.from('audit_logs').insert({
    user_id: guard.userId,
    action: 'order.status_change',
    entity_type: 'order',
    entity_id: parsed.data.id,
    metadata: { status: parsed.data.status },
  })

  revalidatePath('/admin/ordenes')
  revalidatePath(`/perfil/pedidos/${parsed.data.id}`)
  return { ok: true as const }
}

const setAdminSchema = z.object({
  user_id: z.uuid(),
  is_admin: z.enum(['true', 'false']),
})

export async function setUserAdmin(formData: FormData) {
  const guard = await requireAdmin()
  if (!guard.ok) return { ok: false as const, message: 'No autorizado' }

  const parsed = setAdminSchema.safeParse({
    user_id: formData.get('user_id'),
    is_admin: formData.get('is_admin'),
  })
  if (!parsed.success) return { ok: false as const, message: 'Datos invalidos' }

  const isAdmin = parsed.data.is_admin === 'true'
  const { error } = await guard.supabase
    .from('profiles')
    .update({ is_admin: isAdmin })
    .eq('id', parsed.data.user_id)
  if (error) return { ok: false as const, message: error.message }

  await guard.supabase.from('audit_logs').insert({
    user_id: guard.userId,
    action: 'profile.admin_toggle',
    entity_type: 'profile',
    entity_id: parsed.data.user_id,
    metadata: { is_admin: isAdmin },
  })

  revalidatePath('/admin/usuarios')
  return { ok: true as const }
}

function csvEscape(value: unknown) {
  if (value == null) return ''
  const s = String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export async function exportOrdersCSV() {
  const guard = await requireAdmin()
  if (!guard.ok) return { ok: false as const, message: 'No autorizado' }

  const { data, error } = await guard.supabase
    .from('orders')
    .select('id, user_id, status, total, payment_method, payment_status, created_at')
    .order('created_at', { ascending: false })
    .limit(5000)
  if (error) return { ok: false as const, message: error.message }

  const orderRows = data ?? []
  const userIds = [...new Set(orderRows.map((o) => o.user_id))]
  const { data: profilesData } = userIds.length
    ? await guard.supabase.from('profiles').select('id, full_name, email').in('id', userIds)
    : { data: [] }
  const pMap = new Map((profilesData ?? []).map((p) => [p.id, p]))

  type Row = {
    id: string
    status: string
    total: number
    payment_method: string
    payment_status: string
    created_at: string
    profiles: { full_name?: string | null; email?: string | null } | null
  }

  const rows = orderRows.map((o) => ({
    ...o,
    profiles: pMap.get(o.user_id) ?? null,
  })) as unknown as Row[]
  const header = ['id', 'fecha', 'cliente', 'email', 'estado', 'metodo_pago', 'estado_pago', 'total']
  const lines = [header.join(',')]
  for (const r of rows) {
    lines.push(
      [
        csvEscape(r.id),
        csvEscape(r.created_at),
        csvEscape(r.profiles?.full_name ?? ''),
        csvEscape(r.profiles?.email ?? ''),
        csvEscape(r.status),
        csvEscape(r.payment_method),
        csvEscape(r.payment_status),
        csvEscape(r.total),
      ].join(','),
    )
  }
  const csv = lines.join('\n')
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return { ok: true as const, csv, filename: `ordenes-${stamp}.csv` }
}
