'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function toggleWishlist(productId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: 'Inicia sesión para guardar favoritos.' }

  const { data: existing } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle()

  if (existing) {
    await supabase.from('wishlists').delete().eq('id', existing.id)
    revalidatePath('/perfil/favoritos')
    return { ok: true as const, inWishlist: false }
  }

  const { error } = await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId })
  if (error) return { ok: false as const, message: error.message }
  revalidatePath('/perfil/favoritos')
  return { ok: true as const, inWishlist: true }
}
