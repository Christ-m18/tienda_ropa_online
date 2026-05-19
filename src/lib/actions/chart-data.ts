'use server'

import { createClient } from '@/utils/supabase/server'
import { getAdminDashboardMetrics } from '@/lib/queries/admin-dashboard'
import type { AdminMetrics } from '@/types/admin'

export async function getChartDataAction(): Promise<AdminMetrics> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.is_admin) throw new Error('Prohibido')

  return getAdminDashboardMetrics()
}
