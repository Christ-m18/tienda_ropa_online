import InfoPage from '@/components/layout/InfoPage'

export const metadata = { title: 'Información de envío | TIENDA RD' }

const ZONES = [
  { name: 'Distrito Nacional', time: '24h', price: 'RD$150' },
  { name: 'Santo Domingo (Este, Norte, Oeste)', time: '24-48h', price: 'RD$200' },
  { name: 'Santiago', time: '48h', price: 'RD$250' },
  { name: 'La Vega, Moca, San Francisco', time: '48-72h', price: 'RD$250' },
  { name: 'Resto del país', time: '48-72h', price: 'RD$300' },
]

export default function EnviosPage() {
  return (
    <InfoPage title="Información de envío" subtitle="Cobertura en todo el país. Envío gratis en compras superiores a RD$3,000.">
      <h2>Tiempos y tarifas por zona</h2>
      <div className="not-prose overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="text-left px-4 py-3">Zona</th>
              <th className="text-left px-4 py-3">Tiempo</th>
              <th className="text-right px-4 py-3">Costo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {ZONES.map((z) => (
              <tr key={z.name}>
                <td className="px-4 py-3 font-medium">{z.name}</td>
                <td className="px-4 py-3 text-zinc-600">{z.time}</td>
                <td className="px-4 py-3 text-right font-bold">{z.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Envío gratis</h2>
      <p>Todos los pedidos por encima de RD$3,000 viajan sin costo a cualquier punto del país.</p>

      <h2>Procesamiento</h2>
      <ul>
        <li>Pedidos confirmados antes de las 2:00 PM salen el mismo día.</li>
        <li>Después de las 2:00 PM se despachan al día siguiente hábil.</li>
        <li>Los domingos no hay reparto. Los pedidos del domingo salen el lunes.</li>
      </ul>

      <h2>Seguimiento</h2>
      <p>Cuando tu pedido salga, recibirás una notificación con el número de seguimiento. Puedes verlo en tiempo real desde Mis pedidos.</p>

      <h2>Couriers</h2>
      <p>Trabajamos con motoconchos verificados, Caribe Express y Domex. La asignación depende de la zona.</p>
    </InfoPage>
  )
}
