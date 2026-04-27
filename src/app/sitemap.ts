import type { MetadataRoute } from 'next'
import { createClient } from '@/utils/supabase/server'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tiendard.do'

const CATEGORY_SLUGS = ['hombre', 'mujer', 'accesorios']

const INFO_PAGES = [
  { path: '/ayuda', priority: 0.5 },
  { path: '/envios', priority: 0.5 },
  { path: '/devoluciones', priority: 0.5 },
  { path: '/terminos', priority: 0.3 },
  { path: '/privacidad', priority: 0.3 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('id, slug, created_at')
    .order('created_at', { ascending: false })

  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/productos`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ]

  const categoryEntries: MetadataRoute.Sitemap = CATEGORY_SLUGS.map((slug) => ({
    url: `${BASE_URL}/categorias/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const productEntries: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${BASE_URL}/productos/${p.slug ?? p.id}`,
    lastModified: p.created_at ? new Date(p.created_at) : now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const infoEntries: MetadataRoute.Sitemap = INFO_PAGES.map((page) => ({
    url: `${BASE_URL}${page.path}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: page.priority,
  }))

  return [...staticEntries, ...categoryEntries, ...productEntries, ...infoEntries]
}
