import { redirect } from 'next/navigation'
import CheckoutFlow from '@/components/checkout/CheckoutFlow'
import { getCurrentProfile, getUserAddresses } from '@/lib/queries/user'

export default async function CheckoutPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login?redirect=/checkout')
  const addresses = await getUserAddresses()

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="font-display text-4xl md:text-5xl tracking-tight mb-2">Checkout</h1>
      <p className="text-zinc-500 mb-8">Completa tu pedido en 4 pasos</p>
      <CheckoutFlow
        profile={{ full_name: profile.full_name ?? '', email: profile.email ?? '', phone: profile.phone ?? '' }}
        addresses={addresses}
      />
    </div>
  )
}
