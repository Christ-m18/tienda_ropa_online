import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-lg mx-auto text-center space-y-5">
        <p className="font-display text-9xl text-rd-red tracking-tighter">404</p>
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">Esta página no existe</h1>
        <p className="text-zinc-500">Puede que el producto se haya agotado o el enlace esté roto.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/">
            <Button className="bg-rd-red hover:bg-rd-red-dark text-white">Ir al inicio</Button>
          </Link>
          <Link href="/productos">
            <Button variant="outline">Ver productos</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
