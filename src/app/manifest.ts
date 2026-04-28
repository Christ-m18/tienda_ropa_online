import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TIENDA RD',
    short_name: 'TIENDA RD',
    description: 'Moda urbana dominicana. Streetwear y accesorios con envío a toda RD.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f3ec',
    theme_color: '#d62828',
  }
}
