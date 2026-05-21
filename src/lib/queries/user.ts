import 'server-only'
import { cache } from 'react'
import { createClient } from '@/utils/supabase/server'
import type { Address, BankAccount, Notification, Order, PaymentProof, Profile, Wishlist } from '@/types'

export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export const getCurrentProfile = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  return data as Profile | null
})

export async function getUserAddresses() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Address[]
}

export async function getUserOrders() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('orders')
    .select('*, items:order_items(*, product:products(name,images,slug)), address:addresses(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Order[]
}

export async function getOrderById(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('orders')
    .select('*, items:order_items(*, product:products(name,images,slug)), address:addresses(*)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as Order | null
}

export async function getUserWishlist() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('wishlists')
    .select('*, product:products(*, category:categories(*))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Wishlist[]
}

export const getUserWishlistIds = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Set<string>()
  const { data } = await supabase.from('wishlists').select('product_id').eq('user_id', user.id)
  return new Set((data ?? []).map((row) => row.product_id))
})

export async function getUserNotifications(limit = 20) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as Notification[]
}

export async function getActiveBankAccounts(): Promise<BankAccount[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('bank_accounts')
    .select('id, bank_name, account_number, account_holder, account_type, display_color, sort_order')
    .eq('is_active', true)
    .order('sort_order')
  return (data ?? []) as BankAccount[]
}

export async function getOrderPaymentProofs(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('payment_proofs')
    .select('id, status, bank_name, reference_number, amount, notes, created_at, rejection_reason, reviewed_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
  return (data ?? []) as Pick<PaymentProof, 'id' | 'status' | 'bank_name' | 'reference_number' | 'amount' | 'notes' | 'created_at' | 'rejection_reason' | 'reviewed_at'>[]
}
