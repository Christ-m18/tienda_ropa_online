import Link from 'next/link'
import { Camera, AtSign, Hash, Truck, ShieldCheck, RefreshCw, CreditCard } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="w-full bg-rd-charcoal text-zinc-300 mt-auto">
      {/* Trust strip */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Truck, title: 'ENVÍO CUIDADOSO', desc: '24-72h en RD, embalaje protegido' },
            { icon: CreditCard, title: 'PAGO FLEX', desc: 'Stripe, PayPal, contra entrega' },
            { icon: RefreshCw, title: 'CAMBIOS', desc: '30 días para devolver' },
            { icon: ShieldCheck, title: 'SEGURO', desc: 'Encriptación SSL' },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-rd-red/20 flex items-center justify-center text-rd-red">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-sm tracking-wider text-white">{item.title}</p>
                <p className="text-xs text-zinc-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1 space-y-3">
          <h3 className="font-display text-3xl tracking-wider text-white">
            Cora<span className="text-rd-red">Mely</span>
          </h3>
          <p className="text-sm text-zinc-400">
            Decoración artesanal hecha a mano en República Dominicana. Macramé, texturas y yeso para tu hogar.
          </p>
          <div className="flex gap-3 pt-2">
            <Link
              href="#"
              aria-label="Instagram"
              className="h-9 w-9 rounded-full bg-white/5 hover:bg-rd-red flex items-center justify-center transition-colors"
            >
              <Camera className="h-4 w-4" />
            </Link>
            <Link
              href="#"
              aria-label="Facebook"
              className="h-9 w-9 rounded-full bg-white/5 hover:bg-rd-red flex items-center justify-center transition-colors"
            >
              <AtSign className="h-4 w-4" />
            </Link>
            <Link
              href="#"
              aria-label="X / Twitter"
              className="h-9 w-9 rounded-full bg-white/5 hover:bg-rd-red flex items-center justify-center transition-colors"
            >
              <Hash className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div>
          <h4 className="font-display tracking-wider text-white text-sm mb-4">SERVICIO</h4>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li>
              <Link href="/ayuda" className="hover:text-rd-yellow">
                Centro de ayuda
              </Link>
            </li>
            <li>
              <Link href="/envios" className="hover:text-rd-yellow">
                Información de envío
              </Link>
            </li>
            <li>
              <Link href="/devoluciones" className="hover:text-rd-yellow">
                Devoluciones
              </Link>
            </li>
            <li>
              <Link href="/perfil/pedidos" className="hover:text-rd-yellow">
                Rastrea tu pedido
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-display tracking-wider text-white text-sm mb-4">CATEGORÍAS</h4>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li>
              <Link href="/categorias/macrame" className="hover:text-rd-yellow">
                Macramé
              </Link>
            </li>
            <li>
              <Link href="/categorias/cuadros-texturizados" className="hover:text-rd-yellow">
                Cuadros texturizados
              </Link>
            </li>
            <li>
              <Link href="/categorias/esculturas-yeso" className="hover:text-rd-yellow">
                Esculturas en yeso
              </Link>
            </li>
            <li>
              <Link href="/categorias/decoracion-mesa" className="hover:text-rd-yellow">
                Decoración de mesa
              </Link>
            </li>
            <li>
              <Link href="/categorias/piezas-pared" className="hover:text-rd-yellow">
                Piezas de pared
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-display tracking-wider text-white text-sm mb-4">CONTACTO</h4>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li>
              <a href="tel:+18092566896" className="hover:text-rd-yellow">
                +1 (809) 256-6896
              </a>
            </li>
            <li>
              <a href="mailto:hola@coramely.do" className="hover:text-rd-yellow">
                hola@coramely.do
              </a>
            </li>
            <li>Av. Calle Libertad, La Vega</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row gap-3 items-center justify-between text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} Cora Mely · Hecho con 🇩🇴 desde La Vega</p>
          <div className="flex gap-4">
            <Link href="/terminos" className="hover:text-zinc-300">
              Términos
            </Link>
            <Link href="/privacidad" className="hover:text-zinc-300">
              Privacidad
            </Link>
            <Link href="/admin" className="hover:text-zinc-300">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
