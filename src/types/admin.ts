export interface AdminMetrics {
  totalRevenue: number
  revenueToday: number
  revenueLast7Days: number
  revenueLast30Days: number
  totalOrders: number
  pendingOrders: number
  awaitingTransferReview: number
  paidOrders: number
  failedOrders: number
  averageTicket: number
  lowStockProducts: number
  totalUsers: number
  newUsersLast7Days: number
  topProducts: Array<{ name: string; sales: number; revenue: number }>
  recentOrders: Array<{
    id: string
    total: number
    status: string
    payment_status: string
    payment_method: string
    created_at: string
    profiles?: { full_name?: string | null } | null
  }>
  ordersByStatus: Record<string, number>
  ordersByPaymentMethod: Record<string, number>
  revenueByDay: Array<{ date: string; revenue: number }>
}

export interface ActivityEvent {
  id: string
  action: string
  entity_type?: string | null
  entity_id?: string | null
  metadata?: Record<string, unknown> | null
  created_at: string
  user_id?: string | null
}

export interface OrderFilters {
  status?: string
  payment_status?: string
  payment_method?: string
  search?: string
  date_from?: string
  date_to?: string
}

export interface UserFilters {
  search?: string
  role?: 'all' | 'admin' | 'client'
  blocked?: 'all' | 'active' | 'blocked'
}
