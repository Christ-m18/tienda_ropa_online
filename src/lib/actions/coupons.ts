'use server'

import { createClient } from '@/utils/supabase/server'
import type { Coupon } from '@/types'

export type ValidatedCoupon = {
  ok: true
  coupon: Coupon
  discount: number
}

export async function validateCoupon(code: string, subtotal: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .eq('is_active', true)
    .maybeSingle()

  if (error) return { ok: false as const, message: 'Error validando cupón' }
  if (!data) return { ok: false as const, message: 'Cupón no encontrado' }

  const now = new Date()
  if (data.valid_until && new Date(data.valid_until) < now) {
    return { ok: false as const, message: 'Cupón vencido' }
  }
  if (data.max_uses != null && data.used_count >= data.max_uses) {
    return { ok: false as const, message: 'Cupón agotado' }
  }
  if (subtotal < (data.min_purchase ?? 0)) {
    return { ok: false as const, message: `Mínimo de compra RD$${data.min_purchase}` }
  }

  const discount = data.type === 'percentage'
    ? Math.round((subtotal * data.discount_value) / 100)
    : Math.min(data.discount_value, subtotal)

  return { ok: true as const, coupon: data as Coupon, discount }
}
