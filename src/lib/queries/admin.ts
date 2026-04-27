import 'server-only'
import { createClient } from '@/utils/supabase/server'
import type { Order, Product, Profile } from '@/types'

export async function requireAdminProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (!profile?.is_admin) return null
  return profile
}

export async function getAdminMetrics() {
  const supabase = await createClient()
  const [orders, products, profiles, recent] = await Promise.all([
    supabase.from('orders').select('total, status, created_at'),
    supabase.from('products').select('id, stock'),
    supabase.from('profiles').select('id'),
    supabase.from('orders').select('id, total, status, created_at, user_id').order('created_at', { ascending: false }).limit(10),
  ])

  const orderRows = orders.data ?? []
  const totalRevenue = orderRows.filter((o) => o.status !== 'cancelled').reduce((acc, o) => acc + Number(o.total), 0)
  const productRows = products.data ?? []
  const lowStock = productRows.filter((p) => p.stock <= 5).length

  return {
    totalRevenue,
    totalOrders: orderRows.length,
    pendingOrders: orderRows.filter((o) => o.status === 'pending' || o.status === 'processing').length,
    totalProducts: productRows.length,
    totalUsers: profiles.data?.length ?? 0,
    lowStock,
    recentOrders: (recent.data ?? []) as Pick<Order, 'id' | 'total' | 'status' | 'created_at' | 'user_id'>[],
  }
}

export async function getAdminProducts() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(id,name,slug,image_url)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Product[]
}

export async function getAdminOrders() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*, items:order_items(*, product:products(name)), profiles:profiles!orders_user_id_fkey(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []) as (Order & { profiles: { full_name?: string; email?: string } | null })[]
}

export async function getAdminUsers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return (data ?? []) as Profile[]
}
