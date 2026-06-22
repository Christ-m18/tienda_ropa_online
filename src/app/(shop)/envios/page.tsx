import InfoPage from '@/components/layout/InfoPage'
import { SHIPPING_ZONES } from '@/lib/shipping'

export const metadata = { title: 'Información de envío | Cora Mely' }

export default function EnviosPage() {
  return (
    <InfoPage title="Información de envío" subtitle="Enviamos desde La Vega a todo el país. Envio gratis en compras superiores a RD$3,000.">
      <h2>Embalaje cuidadoso</h2>
      <p>Cada pieza es hecha a mano y se embala individualmente con materiales protectores (papel kraft, espuma y cajas reforzadas) antes de salir de nuestro taller. Las piezas en yeso y cerámica viajan con protección adicional por ser artículos frágiles.</p>

      <h2>Tarifas por zona (desde La Vega)</h2>
      <div className="not-prose overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="text-left px-4 py-3">Zona</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">Provincias</th>
              <th className="text-left px-4 py-3">Tiempo</th>
              <th className="text-right px-4 py-3">Costo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {SHIPPING_ZONES.map((z) => (
              <tr key={z.name}>
                <td className="px-4 py-3">
                  <p className="font-medium">{z.description}</p>
                  <p className="text-xs text-zinc-500 sm:hidden mt-0.5">{z.name}</p>
                </td>
                <td className="px-4 py-3 text-zinc-600 hidden sm:table-cell text-xs">{z.name}</td>
                <td className="px-4 py-3 text-zinc-600">{z.time}</td>
                <td className="px-4 py-3 text-right font-bold">{z.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Envio gratis</h2>
      <p>Todos los pedidos por encima de RD$3,000 viajan sin costo a cualquier punto del pais.</p>

      <h2>Procesamiento</h2>
      <ul>
        <li>Pedidos confirmados antes de las 2:00 PM salen el mismo dia desde La Vega.</li>
        <li>Despues de las 2:00 PM se despachan al dia siguiente habil.</li>
        <li>Los domingos no hay reparto. Los pedidos del domingo salen el lunes.</li>
      </ul>

      <h2>Entrega preferencial</h2>
      <p>Los pedidos pagados por transferencia bancaria tienen prioridad de envio y se despachan primero.</p>

      <h2>Seguimiento</h2>
      <p>Cuando tu pedido salga, recibiras una notificacion con el numero de seguimiento. Puedes verlo en tiempo real desde Mis pedidos.</p>

      <h2>Couriers</h2>
      <p>Trabajamos con Caribe Express, Domex y mensajeros locales verificados. La asignacion depende de la zona de destino.</p>
    </InfoPage>
  )
}
