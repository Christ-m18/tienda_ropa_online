import Link from 'next/link'
import InfoPage from '@/components/layout/InfoPage'

export const metadata = { title: 'Centro de ayuda | TIENDA RD' }

const FAQS = [
  {
    q: '¿Cuánto tarda mi pedido en llegar?',
    a: 'Enviamos desde La Vega. Zona local (La Vega, Bonao, Moca): 24 horas. Cibao y Santo Domingo: 24 a 48 horas. Resto del pais: 48 a 72 horas. Los domingos no hay reparto.',
  },
  {
    q: '¿Puedo pagar contra entrega?',
    a: 'Sí. Es nuestro método más popular. Pagas en efectivo al recibir. Disponible en todo el país.',
  },
  {
    q: '¿Cómo aplico un cupón?',
    a: 'Escribe el código en la sección "Cupón" del checkout y pulsa Aplicar. El descuento se reflejará antes de confirmar.',
  },
  {
    q: '¿Puedo cambiar o devolver una prenda?',
    a: 'Tienes 30 días desde la entrega. La prenda debe estar sin usar y con su etiqueta. Escríbenos por WhatsApp para coordinar.',
  },
  {
    q: '¿Cómo rastreo mi pedido?',
    a: 'Inicia sesión y entra a Mis pedidos. Verás el estado en tiempo real y el número de seguimiento si ya fue enviado.',
  },
  {
    q: 'Olvidé mi contraseña',
    a: 'Pronto habilitaremos recuperación por correo. Mientras tanto escríbenos.',
  },
]

export default function AyudaPage() {
  return (
    <InfoPage title="Centro de ayuda" subtitle="Respuestas rápidas. Si no encuentras lo tuyo, escríbenos.">
      <div className="not-prose grid sm:grid-cols-2 gap-3 mb-8">
        <a href="https://wa.me/18092566896" target="_blank" rel="noreferrer" className="block bg-rd-charcoal text-white rounded-2xl p-5 hover:bg-rd-red transition">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">WhatsApp</p>
          <p className="font-display text-2xl mt-1">+1 (809) 256-6896</p>
        </a>
        <a href="mailto:hola@tiendard.do" className="block bg-rd-bone rounded-2xl p-5 hover:bg-rd-yellow transition">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Correo</p>
          <p className="font-display text-2xl mt-1">hola@tiendard.do</p>
        </a>
      </div>

      <h2>Preguntas frecuentes</h2>
      <div className="not-prose divide-y divide-zinc-200 border border-zinc-200 rounded-2xl bg-white">
        {FAQS.map((f) => (
          <details key={f.q} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
            <summary className="cursor-pointer flex items-center justify-between gap-4 font-bold">
              <span>{f.q}</span>
              <span className="h-6 w-6 rounded-full border border-zinc-300 flex items-center justify-center text-zinc-500 group-open:rotate-45 transition-transform text-lg leading-none">+</span>
            </summary>
            <p className="text-zinc-600 mt-3 leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>

      <h2>¿Necesitas más ayuda?</h2>
      <p>
        Visita <Link href="/envios">Información de envío</Link>, <Link href="/devoluciones">Devoluciones</Link> o{' '}
        <Link href="/perfil/pedidos">Rastrea tu pedido</Link>.
      </p>
    </InfoPage>
  )
}
