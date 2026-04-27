import type { Metadata } from 'next'
import { Inter, Bebas_Neue, Geist_Mono } from 'next/font/google'
import './globals.css'
import Providers from '@/components/common/Providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-display' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'TIENDA RD | Moda Urbana Dominicana',
  description: 'Ropa urbana, streetwear y accesorios con flow caribeño. Envíos a toda República Dominicana. Pago contra entrega disponible.',
  keywords: ['ropa', 'streetwear', 'república dominicana', 'tienda online', 'urbano', 'caribe'],
  openGraph: {
    title: 'TIENDA RD - Moda Urbana Dominicana',
    description: 'El flow del Caribe en tu closet. Envíos rápidos a toda RD.',
    locale: 'es_DO',
    type: 'website',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} ${bebas.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
