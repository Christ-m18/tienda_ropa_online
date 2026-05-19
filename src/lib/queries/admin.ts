import 'server-only'
import { createClient } from '@/utils/supabase/server'
import type { Order, Product, Profile } from '@/types'
import type { OrderFilters, UserFilters } from '@/types/admin'

export async function requireAdminProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (!profile?.is_admin) return null
  return profile as Profile
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
    .select('*, items:order_items(*, product:products(name))')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error

  const orders = data ?? []
  const userIds = [...new Set(orders.map((o) => o.user_id))]
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', userIds)
    : { data: [] }
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  return orders.map((o) => ({
    ...o,
    profiles: profileMap.get(o.user_id) ?? null,
  })) as (Order & { profiles: { full_name?: string; email?: string } | null })[]
}

export async function getAdminOrdersFiltered(filters: OrderFilters) {
  const supabase = await createClient()
  let query = supabase
    .from('orders')
    .select('*, items:order_items(*, product:products(name, images))')
    .order('created_at', { ascending: false })
    .limit(100)

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters.payment_status && filters.payment_status !== 'all') {
    query = query.eq('payment_status', filters.payment_status)
  }
  if (filters.payment_method && filters.payment_method !== 'all') {
    query = query.eq('payment_method', filters.payment_method)
  }
  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from)
  }
  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to + 'T23:59:59')
  }

  const { data, error } = await query
  if (error) throw error

  const orders = data ?? []
  const userIds = [...new Set(orders.map((o) => o.user_id))]
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', userIds)
    : { data: [] }
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  let results = orders.map((o) => ({
    ...o,
    profiles: profileMap.get(o.user_id) ?? null,
  })) as (Order & { profiles: { full_name?: string; email?: string } | null })[]

  // Client-side search (Supabase doesn't support cross-table text search easily)
  if (filters.search?.trim()) {
    const term = filters.search.trim().toLowerCase()
    results = results.filter((o) =>
      o.id.toLowerCase().includes(term) ||
      o.profiles?.full_name?.toLowerCase().includes(term) ||
      o.profiles?.email?.toLowerCase().includes(term)
    )
  }

  return results
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

export async function getAdminUsersFiltered(filters: UserFilters) {
  const supabase = await createClient()
  let query = supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (filters.role === 'admin') {
    query = query.eq('is_admin', true)
  } else if (filters.role === 'client') {
    query = query.eq('is_admin', false)
  }

  if (filters.blocked === 'blocked') {
    query = query.eq('is_blocked', true)
  } else if (filters.blocked === 'active') {
    query = query.eq('is_blocked', false)
  }

  const { data, error } = await query
  if (error) throw error

  let results = (data ?? []) as Profile[]

  if (filters.search?.trim()) {
    const term = filters.search.trim().toLowerCase()
    results = results.filter((u) =>
      u.full_name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    )
  }

  return results
}

export async function getUserOrderStats(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, { count: number; total: number; lastOrder: string | null }>()

  const supabase = await createClient()
  const { data } = await supabase
    .from('orders')
    .select('user_id, total, created_at')
    .in('user_id', userIds)

  const stats = new Map<string, { count: number; total: number; lastOrder: string | null }>()
  for (const row of data ?? []) {
    const existing = stats.get(row.user_id) ?? { count: 0, total: 0, lastOrder: null }
    existing.count++
    existing.total += Number(row.total)
    if (!existing.lastOrder || row.created_at > existing.lastOrder) {
      existing.lastOrder = row.created_at
    }
    stats.set(row.user_id, existing)
  }
  return stats
}
