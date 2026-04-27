import 'server-only'
import { createClient } from '@/utils/supabase/server'
import type { Product, Review } from '@/types'

export type ProductFilters = {
  category?: string
  q?: string
  minPrice?: number
  maxPrice?: number
  sort?: 'newest' | 'best_selling' | 'top_rated' | 'price_asc' | 'price_desc'
  inStock?: boolean
  limit?: number
  offset?: number
}

export async function getProducts(filters: ProductFilters = {}) {
  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select('*, category:categories(id,name,slug,image_url)', { count: 'exact' })

  if (filters.category) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', filters.category)
      .maybeSingle()
    if (cat?.id) query = query.eq('category_id', cat.id)
  }

  if (filters.q) {
    query = query.ilike('name', `%${filters.q}%`)
  }

  if (filters.minPrice != null) {
    query = query.gte('price', filters.minPrice)
  }
  if (filters.maxPrice != null) {
    query = query.lte('price', filters.maxPrice)
  }
  if (filters.inStock) {
    query = query.gt('stock', 0)
  }

  switch (filters.sort) {
    case 'best_selling':
      query = query.order('sales_count', { ascending: false })
      break
    case 'top_rated':
      query = query.order('rating', { ascending: false })
      break
    case 'price_asc':
      query = query.order('price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price', { ascending: false })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  const limit = filters.limit ?? 24
  const offset = filters.offset ?? 0
  query = query.range(offset, offset + limit - 1)

  const { data, count, error } = await query
  if (error) throw error
  return { products: (data ?? []) as Product[], total: count ?? 0 }
}

export async function getFeaturedProducts(limit = 8) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(id,name,slug,image_url)')
    .eq('is_featured', true)
    .order('sales_count', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as Product[]
}

export async function getDealsProducts(limit = 8) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(id,name,slug,image_url)')
    .not('discount_price', 'is', null)
    .order('discount_price', { ascending: true })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as Product[]
}

export async function getBestSellers(limit = 8) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(id,name,slug,image_url)')
    .order('sales_count', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as Product[]
}

export async function getProductByIdOrSlug(idOrSlug: string) {
  const supabase = await createClient()
  const isUuid = /^[0-9a-f-]{36}$/i.test(idOrSlug)
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(id,name,slug,image_url)')
    .eq(isUuid ? 'id' : 'slug', idOrSlug)
    .maybeSingle()
  if (error) throw error
  return data as Product | null
}

export async function getRelatedProducts(productId: string, categoryId?: string | null, limit = 4) {
  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select('*, category:categories(id,name,slug,image_url)')
    .neq('id', productId)
    .limit(limit)
  if (categoryId) query = query.eq('category_id', categoryId)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Product[]
}

export async function getProductReviews(productId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reviews')
    .select('id, product_id, user_id, rating, comment, verified, created_at, profiles:profiles!reviews_user_id_profile_fkey(full_name, avatar_url)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as Review[]
}
