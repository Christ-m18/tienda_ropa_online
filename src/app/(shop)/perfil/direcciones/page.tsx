import { getUserAddresses } from '@/lib/queries/user'
import { MapPin } from 'lucide-react'

export default async function AddressesPage() {
  const addresses = await getUserAddresses()

  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl tracking-tight mb-6">Direcciones</h1>
      {addresses.length === 0 ? (
        <p className="text-zinc-500">Aún no tienes direcciones guardadas. Se guardan automáticamente al hacer un pedido.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border border-zinc-200 p-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <MapPin className="h-5 w-5 text-rd-red" />
                {a.is_default && <span className="text-xs bg-rd-yellow text-rd-charcoal px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Principal</span>}
              </div>
              <p className="font-bold">{a.address_line1}</p>
              {a.address_line2 && <p className="text-sm text-zinc-600">{a.address_line2}</p>}
              <p className="text-sm">{a.city}, {a.province}</p>
              <p className="text-sm text-zinc-500 mt-2">📞 {a.phone}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
