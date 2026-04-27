import 'server-only'
import { cache } from 'react'
import { createClient } from '@/utils/supabase/server'
import type { Category } from '@/types'

export const getCategories = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  if (error) throw error
  return (data ?? []) as Category[]
})

export const getCategoryBySlug = cache(async (slug: string) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return data as Category | null
})
