import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cora Mely',
    short_name: 'Cora Mely',
    description: 'Decoración artesanal hecha a mano: macramé, cuadros texturizados y esculturas en yeso, con envío a toda RD.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f4eee3',
    theme_color: '#b5563a',
  }
}
