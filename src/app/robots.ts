import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://coramely.do'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/perfil', '/checkout', '/login', '/registro'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
