import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import MobileNav from '@/components/layout/MobileNav'
import Assistant from '@/components/assistant/Assistant'
import { getCurrentProfile } from '@/lib/queries/user'

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile()
  return (
    <>
      <div className="hidden md:block bg-rd-charcoal text-white text-xs overflow-hidden">
        <div className="container mx-auto px-4 h-9 flex items-center gap-6">
          <div className="flex-1 overflow-hidden">
            <div className="marquee">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex gap-10 whitespace-nowrap">
                  <span>🚚 Envío gratis en compras +RD$3,000</span>
                  <span>💸 Pago contra entrega disponible</span>
                  <span>🔥 Cupón <b className="text-rd-yellow">BIENVENIDA20</b> en tu primera compra</span>
                  <span>🇩🇴 Hecho con flow dominicano</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-3 text-zinc-400">
            <a href="tel:+18092566896" className="hover:text-rd-yellow">📞 (809) 256-6896</a>
            <span>·</span>
            <span>Lun-Sáb 9-7</span>
          </div>
        </div>
      </div>
      <Navbar profile={profile} />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer />
      <Assistant />
      <MobileNav />
    </>
  )
}
