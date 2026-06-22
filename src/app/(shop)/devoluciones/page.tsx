import Link from 'next/link'
import InfoPage from '@/components/layout/InfoPage'

export const metadata = { title: 'Devoluciones y cambios | Cora Mely' }

export default function DevolucionesPage() {
  return (
    <InfoPage title="Devoluciones y cambios" subtitle="30 días para cambiarla o devolverla. Sin estrés.">
      <h2>Política de 30 días</h2>
      <p>Tienes 30 días desde la entrega para solicitar un cambio o devolución. La pieza debe estar:</p>
      <ul>
        <li>Sin uso ni alteraciones.</li>
        <li>En su empaque original, cuando aplique.</li>
        <li>Reportada de inmediato si llegó dañada durante el envío.</li>
      </ul>

      <h2>Cómo solicitarlo</h2>
      <ol className="list-decimal pl-6 space-y-1">
        <li>Entra a <Link href="/perfil/pedidos">Mis pedidos</Link>.</li>
        <li>Escríbenos por WhatsApp al +1 (809) 256-6896 con tu número de orden.</li>
        <li>Coordinamos la recogida sin costo dentro de La Vega y zonas cercanas.</li>
        <li>Recibirás el reembolso o el cambio en 3 a 5 días hábiles.</li>
      </ol>

      <h2>Reembolsos</h2>
      <ul>
        <li>Tarjeta Stripe o PayPal: a la misma tarjeta o cuenta original.</li>
        <li>Pago contra entrega o transferencia: por transferencia al banco que indiques.</li>
      </ul>

      <h2>Productos no retornables</h2>
      <ul>
        <li>Piezas personalizadas o hechas a pedido.</li>
        <li>Productos en oferta marcados como venta final.</li>
      </ul>

      <h2>Piezas frágiles y daños de transporte</h2>
      <p>Nuestras piezas son hechas a mano y embaladas con cuidado, pero si tu pieza en yeso, cerámica o macramé llegó dañada durante el envío, escríbenos con fotos en las primeras 48 horas. Nos hacemos cargo de la recogida y el reemplazo sin costo.</p>
    </InfoPage>
  )
}
