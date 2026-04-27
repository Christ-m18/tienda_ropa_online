'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function ShopError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-lg mx-auto text-center space-y-5">
        <div className="h-16 w-16 mx-auto rounded-full bg-rd-red/10 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-rd-red" />
        </div>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight">Algo se trabó</h1>
        <p className="text-zinc-500">{error.message || 'Hubo un error cargando esta página.'}</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} className="bg-rd-red hover:bg-rd-red-dark text-white">Reintentar</Button>
          <Link href="/">
            <Button variant="outline">Ir al inicio</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
