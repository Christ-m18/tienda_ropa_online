'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { validateCoupon } from './coupons'
import { isPaymentEnabled } from '@/lib/payments'

const itemSchema = z.object({
  id: z.uuid(),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
})

const addressSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().min(8),
  address_line1: z.string().min(3),
  address_line2: z.string().optional(),
  city: z.string().min(2),
  province: z.string().min(2),
  zip_code: z.string().optional(),
})

const checkoutSchema = z.object({
  items: z.array(itemSchema).min(1),
  address: addressSchema,
  payment_method: z.enum(['stripe', 'paypal', 'cod', 'bank_transfer']),
  coupon_code: z.string().optional(),
  save_address: z.boolean().optional(),
})

export type CheckoutInput = z.input<typeof checkoutSchema>

const SHIPPING_FREE_THRESHOLD = 3000
const FLAT_SHIPPING = 250

export async function placeOrder(input: CheckoutInput) {
  const parsed = checkoutSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, message: 'Datos del pedido inválidos' }

  if (!isPaymentEnabled(parsed.data.payment_method)) {
    return { ok: false as const, message: 'Método de pago no disponible por ahora.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: 'Inicia sesión para completar el pedido' }

  const { items, address, payment_method, coupon_code } = parsed.data

  const subtotal = items.reduce((acc, it) => acc + it.price * it.quantity, 0)

  let discount = 0
  let couponId: string | null = null
  if (coupon_code) {
    const result = await validateCoupon(coupon_code, subtotal)
    if (result.ok) {
      discount = result.discount
      couponId = result.coupon.id
    }
  }

  const shipping = subtotal >= SHIPPING_FREE_THRESHOLD ? 0 : FLAT_SHIPPING
  const total = Math.max(0, subtotal + shipping - discount)

  // Guardar direccion
  const { data: addressRow, error: addressError } = await supabase
    .from('addresses')
    .insert({
      user_id: user.id,
      address_line1: address.address_line1,
      address_line2: address.address_line2,
      city: address.city,
      province: address.province,
      zip_code: address.zip_code,
      phone: address.phone,
      is_default: false,
    })
    .select('id')
    .single()
  if (addressError) return { ok: false as const, message: 'No se pudo guardar la dirección' }

  // Crear orden de forma atomica con bloqueo de stock
  const { data: orderId, error: rpcError } = await supabase.rpc('place_order_atomic', {
    p_user_id: user.id,
    p_items: items.map((it) => ({ id: it.id, quantity: it.quantity, price: it.price })),
    p_address_id: addressRow.id,
    p_payment_method: payment_method,
    p_subtotal: subtotal,
    p_shipping: shipping,
    p_discount: discount,
    p_total: total,
    p_coupon_id: couponId,
  })

  if (rpcError) {
    const msg = rpcError.message ?? ''
    if (msg.includes('stock_insufficient')) {
      return { ok: false as const, message: 'Stock insuficiente. Algun producto fue actualizado.' }
    }
    if (msg.includes('product_not_found')) {
      return { ok: false as const, message: 'Producto no disponible.' }
    }
    if (msg.includes('items_empty') || msg.includes('user_required')) {
      return { ok: false as const, message: 'Datos del pedido invalidos.' }
    }
    return { ok: false as const, message: 'No se pudo crear el pedido' }
  }

  // Notificacion al usuario
  await supabase.from('notifications').insert({
    user_id: user.id,
    title: 'Pedido confirmado',
    message: `Tu pedido #${String(orderId).slice(0, 8)} esta siendo procesado.`,
    type: 'order',
    link: `/perfil/pedidos/${orderId}`,
  })

  revalidatePath('/perfil/pedidos')
  return { ok: true as const, orderId: orderId as string }
}
