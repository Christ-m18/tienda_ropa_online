import 'server-only'
import { createClient } from '@/utils/supabase/server'
import type { AdminMetrics, ActivityEvent } from '@/types/admin'

export async function getAdminDashboardMetrics(): Promise<AdminMetrics> {
  const supabase = await createClient()

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const last14Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()

  const [
    allOrders,
    recentOrdersList,
    products,
    allProfiles,
    newProfiles,
    topProductsData,
    pendingProofs,
  ] = await Promise.all([
    supabase.from('orders').select('id, total, status, payment_status, payment_method, created_at'),
    supabase
      .from('orders')
      .select('id, user_id, total, status, payment_status, payment_method, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('products').select('id, stock, name, sales_count, price'),
    supabase.from('profiles').select('id, full_name, created_at'),
    supabase.from('profiles').select('id').gte('created_at', last7Days),
    supabase.from('products').select('name, sales_count, price').order('sales_count', { ascending: false }).limit(5),
    supabase.from('payment_proofs').select('id').eq('status', 'pending'),
  ])

  // Build profile name lookup from allProfiles (already fetched)
  const profileMap = new Map<string, string>()
  for (const p of allProfiles.data ?? []) {
    if (p.full_name) profileMap.set(p.id, p.full_name)
  }

  const orders = allOrders.data ?? []
  const nonCancelled = orders.filter((o) => o.status !== 'cancelled')

  const totalRevenue = nonCancelled.reduce((acc, o) => acc + Number(o.total), 0)

  const revenueToday = nonCancelled
    .filter((o) => o.created_at >= todayStart)
    .reduce((acc, o) => acc + Number(o.total), 0)

  const revenueLast7Days = nonCancelled
    .filter((o) => o.created_at >= last7Days)
    .reduce((acc, o) => acc + Number(o.total), 0)

  const revenueLast30Days = nonCancelled
    .filter((o) => o.created_at >= last30Days)
    .reduce((acc, o) => acc + Number(o.total), 0)

  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'processing').length
  const awaitingTransferReview = orders.filter(
    (o) => o.payment_method === 'bank_transfer' && o.payment_status === 'pending'
  ).length + (pendingProofs.data?.length ?? 0)
  const paidOrders = orders.filter((o) => o.payment_status === 'paid').length
  const failedOrders = orders.filter((o) => o.payment_status === 'failed').length
  const averageTicket = nonCancelled.length > 0 ? totalRevenue / nonCancelled.length : 0

  const productRows = products.data ?? []
  const lowStockProducts = productRows.filter((p) => p.stock <= 5).length

  // Orders by status
  const ordersByStatus: Record<string, number> = {}
  for (const o of orders) {
    ordersByStatus[o.status] = (ordersByStatus[o.status] ?? 0) + 1
  }

  // Orders by payment method
  const ordersByPaymentMethod: Record<string, number> = {}
  for (const o of orders) {
    ordersByPaymentMethod[o.payment_method] = (ordersByPaymentMethod[o.payment_method] ?? 0) + 1
  }

  // Revenue by day (last 14 days)
  const revenueByDay: Array<{ date: string; revenue: number }> = []
  const dayOrders = nonCancelled.filter((o) => o.created_at >= last14Days)
  const dayMap = new Map<string, number>()
  for (const o of dayOrders) {
    const day = o.created_at.slice(0, 10)
    dayMap.set(day, (dayMap.get(day) ?? 0) + Number(o.total))
  }
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    revenueByDay.push({ date: key, revenue: dayMap.get(key) ?? 0 })
  }

  // Top products
  const topProducts = (topProductsData.data ?? []).map((p) => ({
    name: p.name,
    sales: p.sales_count,
    revenue: p.sales_count * Number(p.price),
  }))

  return {
    totalRevenue,
    revenueToday,
    revenueLast7Days,
    revenueLast30Days,
    totalOrders: orders.length,
    pendingOrders,
    awaitingTransferReview,
    paidOrders,
    failedOrders,
    averageTicket,
    lowStockProducts,
    totalUsers: allProfiles.data?.length ?? 0,
    newUsersLast7Days: newProfiles.data?.length ?? 0,
    topProducts,
    recentOrders: (recentOrdersList.data ?? []).map((o) => ({
      ...o,
      profiles: { full_name: profileMap.get(o.user_id) ?? null },
    })) as AdminMetrics['recentOrders'],
    ordersByStatus,
    ordersByPaymentMethod,
    revenueByDay,
  }
}

export async function getRecentActivity(): Promise<ActivityEvent[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('audit_logs')
    .select('id, action, entity_type, entity_id, metadata, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(20)
  return (data ?? []) as ActivityEvent[]
}
