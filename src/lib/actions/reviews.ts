'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

const reviewSchema = z.object({
  product_id: z.uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
})

export async function submitReview(formData: FormData) {
  const parsed = reviewSchema.safeParse({
    product_id: formData.get('product_id'),
    rating: formData.get('rating'),
    comment: formData.get('comment'),
  })
  if (!parsed.success) return { ok: false as const, message: 'Datos inválidos' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: 'Inicia sesión para reseñar' }

  // Verificar compra para badge verified
  const { data: verified } = await supabase.rpc('is_verified_purchase', {
    p_user: user.id,
    p_product: parsed.data.product_id,
  })

  const { error } = await supabase
    .from('reviews')
    .upsert(
      {
        user_id: user.id,
        product_id: parsed.data.product_id,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
        verified: verified === true,
      },
      { onConflict: 'product_id,user_id' },
    )
  if (error) return { ok: false as const, message: error.message }

  // Recalcular rating del producto
  const { data: ratings } = await supabase
    .from('reviews')
    .select('rating')
    .eq('product_id', parsed.data.product_id)
  if (ratings && ratings.length) {
    const avg = ratings.reduce((a, r) => a + r.rating, 0) / ratings.length
    await supabase.from('products').update({ rating: Number(avg.toFixed(1)) }).eq('id', parsed.data.product_id)
  }

  revalidatePath(`/productos/${parsed.data.product_id}`)
  return { ok: true as const }
}
