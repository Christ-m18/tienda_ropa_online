import type { Metadata } from 'next'
import { Inter, Bebas_Neue, Geist_Mono } from 'next/font/google'
import './globals.css'
import Providers from '@/components/common/Providers'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-display' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'Cora Mely | Decoración artesanal para el hogar',
  description: 'Macramé, cuadros texturizados, esculturas en yeso y piezas decorativas hechas a mano en República Dominicana. Envíos a todo el país, pago contra entrega y transferencia.',
  keywords: ['decoración artesanal', 'macramé', 'esculturas de yeso', 'cuadros texturizados', 'república dominicana', 'hecho a mano', 'decoración para el hogar'],
  openGraph: {
    title: 'Cora Mely - Decoración artesanal hecha a mano',
    description: 'Piezas únicas en macramé, yeso y fibras naturales para tu hogar. Envíos cuidadosos a toda RD.',
    locale: 'es_DO',
    type: 'website',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} ${bebas.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background">
        <Providers>{children}</Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
