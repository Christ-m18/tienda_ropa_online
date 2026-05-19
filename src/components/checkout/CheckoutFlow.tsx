'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { CheckCircle2, CreditCard, Truck, Wallet, Building2, ChevronRight, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/store/useCartStore'
import { placeOrder } from '@/lib/actions/checkout'
import { validateCoupon } from '@/lib/actions/coupons'
import { formatRD } from '@/lib/format'
import { isPaymentEnabled, DISABLED_REASON } from '@/lib/payments'
import { toast } from 'sonner'
import type { Address, PaymentMethod } from '@/types'

const PAYMENT_METHODS: Array<{
  id: PaymentMethod
  title: string
  desc: string
  icon: React.ComponentType<{ className?: string }>
  recommended?: boolean
}> = [
  {
    id: 'cod',
    title: 'Pago contra entrega',
    desc: 'Paga al recibir en tu puerta',
    icon: Truck,
    recommended: true,
  },
  { id: 'stripe', title: 'Tarjeta (Stripe)', desc: 'Visa, Mastercard, Amex', icon: CreditCard },
  { id: 'paypal', title: 'PayPal', desc: 'Cuenta PayPal o tarjeta', icon: Wallet },
  { id: 'bank_transfer', title: 'Transferencia bancaria', desc: 'BHD, Reservas, Santa Cruz — Entrega preferencial', icon: Building2 },
]

const PROVINCES = [
  'Distrito Nacional',
  'Santo Domingo',
  'Santiago',
  'La Vega',
  'Puerto Plata',
  'San Pedro de Macorís',
  'La Romana',
  'Higüey',
  'Bonao',
  'San Cristóbal',
  'Barahona',
  'Moca',
  'Azua',
  'Otra',
]

const SHIPPING_FREE_THRESHOLD = 3000
const FLAT_SHIPPING = 250

type Step = 0 | 1 | 2 | 3

export default function CheckoutFlow({
  profile,
  addresses,
}: {
  profile: { full_name: string; email: string; phone: string }
  addresses: Address[]
}) {
  const router = useRouter()
  const items = useCartStore((s) => s.items)
  const clearCart = useCartStore((s) => s.clearCart)

  const subtotal = useMemo(() => items.reduce((a, it) => a + it.price * it.quantity, 0), [items])

  const [step, setStep] = useState<Step>(0)
  const [pending, startTransition] = useTransition()

  const [contact, setContact] = useState({
    full_name: profile.full_name,
    email: profile.email,
    phone: profile.phone,
  })

  const defaultAddress = addresses.find((a) => a.is_default) ?? addresses[0]
  const [address, setAddress] = useState({
    address_line1: defaultAddress?.address_line1 ?? '',
    address_line2: defaultAddress?.address_line2 ?? '',
    city: defaultAddress?.city ?? '',
    province: defaultAddress?.province ?? PROVINCES[0],
    zip_code: defaultAddress?.zip_code ?? '',
  })

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod')

  const [coupon, setCoupon] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null)
  const [couponPending, setCouponPending] = useState(false)

  const shipping = subtotal >= SHIPPING_FREE_THRESHOLD ? 0 : FLAT_SHIPPING
  const discount = appliedCoupon?.discount ?? 0
  const total = Math.max(0, subtotal + shipping - discount)

  if (items.length === 0 && step !== 3) {
    return (
      <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center">
        <p className="text-2xl font-display tracking-wider">Tu carrito está vacío</p>
        <Button
          onClick={() => router.push('/productos')}
          className="mt-6 bg-rd-red hover:bg-rd-red-dark text-white"
        >
          Explorar productos
        </Button>
      </div>
    )
  }

  async function applyCoupon() {
    if (!coupon.trim()) return
    setCouponPending(true)
    const result = await validateCoupon(coupon, subtotal)
    setCouponPending(false)
    if (!result.ok) {
      toast.error(result.message)
      setAppliedCoupon(null)
      return
    }
    setAppliedCoupon({ code: result.coupon.code, discount: result.discount })
    toast.success(`Cupón aplicado: -${formatRD(result.discount)}`)
  }

  function next() {
    if (step === 0) {
      if (!contact.full_name || !contact.email || !contact.phone) {
        return toast.error('Completa tus datos de contacto')
      }
    }
    if (step === 1) {
      if (!address.address_line1 || !address.city || !address.province) {
        return toast.error('Completa tu dirección')
      }
    }
    setStep((s) => Math.min(3, s + 1) as Step)
  }
  function prev() {
    setStep((s) => Math.max(0, s - 1) as Step)
  }

  function submit() {
    startTransition(async () => {
      const result = await placeOrder({
        items: items.map((it) => ({ id: it.id, quantity: it.quantity, price: it.price })),
        address: {
          full_name: contact.full_name,
          phone: contact.phone,
          address_line1: address.address_line1,
          address_line2: address.address_line2 || undefined,
          city: address.city,
          province: address.province,
          zip_code: address.zip_code || undefined,
        },
        payment_method: paymentMethod,
        coupon_code: appliedCoupon?.code,
      })

      if (!result.ok) {
        toast.error(result.message)
        return
      }
      clearCart()
      router.push(`/checkout/exito/${result.orderId}`)
    })
  }

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-8">
      <div>
        <Stepper step={step} />

        {step === 0 && (
          <Card title="Datos de contacto">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nombre completo">
                <Input
                  value={contact.full_name}
                  onChange={(e) => setContact({ ...contact, full_name: e.target.value })}
                />
              </Field>
              <Field label="Correo">
                <Input
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                />
              </Field>
              <Field label="Teléfono">
                <Input
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  placeholder="(809) 256-6896"
                />
              </Field>
            </div>
          </Card>
        )}

        {step === 1 && (
          <Card title="Dirección de envío">
            <div className="space-y-4">
              <Field label="Dirección">
                <Input
                  value={address.address_line1}
                  onChange={(e) => setAddress({ ...address, address_line1: e.target.value })}
                  placeholder="Calle, número"
                />
              </Field>
              <Field label="Referencia (opcional)">
                <Input
                  value={address.address_line2}
                  onChange={(e) => setAddress({ ...address, address_line2: e.target.value })}
                  placeholder="Sector, edificio, apto"
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Ciudad">
                  <Input
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  />
                </Field>
                <Field label="Provincia">
                  <select
                    value={address.province}
                    onChange={(e) => setAddress({ ...address, province: e.target.value })}
                    className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-rd-red"
                  >
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Código postal (opcional)">
                <Input
                  value={address.zip_code}
                  onChange={(e) => setAddress({ ...address, zip_code: e.target.value })}
                />
              </Field>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card title="Método de pago">
            <div className="grid gap-3">
              {PAYMENT_METHODS.map((m) => {
                const Icon = m.icon
                const enabled = isPaymentEnabled(m.id)
                const selected = paymentMethod === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => enabled && setPaymentMethod(m.id)}
                    disabled={!enabled}
                    aria-disabled={!enabled}
                    className={`text-left rounded-2xl border-2 p-4 flex items-center gap-4 transition ${
                      !enabled
                        ? 'border-zinc-200 bg-zinc-50 opacity-60 cursor-not-allowed'
                        : selected
                          ? 'border-rd-red bg-rd-red/5'
                          : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <div
                      className={`h-11 w-11 rounded-xl flex items-center justify-center ${
                        !enabled
                          ? 'bg-zinc-200 text-zinc-400'
                          : selected
                            ? 'bg-rd-red text-white'
                            : 'bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold flex items-center gap-2 flex-wrap">
                        {m.title}
                        {!enabled && DISABLED_REASON[m.id] && (
                          <Badge className="bg-zinc-300 text-zinc-700">{DISABLED_REASON[m.id]}</Badge>
                        )}
                        {enabled && m.recommended && (
                          <Badge className="bg-rd-yellow text-rd-charcoal">Recomendado en RD</Badge>
                        )}
                      </p>
                      <p className="text-sm text-zinc-500">{m.desc}</p>
                    </div>
                    {enabled && selected && <CheckCircle2 className="h-5 w-5 text-rd-red" />}
                  </button>
                )
              })}
            </div>
            {paymentMethod === 'bank_transfer' && (
              <div className="mt-4 bg-rd-blue/5 border border-rd-blue/20 rounded-xl p-4 space-y-2">
                <p className="text-sm text-rd-blue font-medium">
                  <Building2 className="h-4 w-4 inline mr-1.5" />
                  Despues de confirmar tu pedido, podras elegir el banco, ver el numero de cuenta y subir el comprobante.
                </p>
                <p className="text-xs text-emerald-700 font-bold">
                  <Truck className="h-3.5 w-3.5 inline mr-1" />
                  Entrega preferencial — los pedidos por transferencia tienen prioridad de envio.
                </p>
              </div>
            )}
          </Card>
        )}

        {step === 3 && (
          <Card title="Confirmación">
            <div className="space-y-4">
              <Section title="Contacto" data={`${contact.full_name} · ${contact.email} · ${contact.phone}`} />
              <Section
                title="Envío"
                data={`${address.address_line1}, ${address.city}, ${address.province}`}
              />
              <Section
                title="Método de pago"
                data={PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.title ?? ''}
              />
              <p className="text-sm text-zinc-500 pt-4 border-t border-zinc-200">
                Al confirmar aceptas nuestros términos y condiciones. Recibirás una notificación con el estado
                de tu pedido.
              </p>
            </div>
          </Card>
        )}

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={prev} disabled={step === 0}>
            Atrás
          </Button>
          {step < 3 ? (
            <Button onClick={next} className="bg-rd-charcoal hover:bg-rd-red text-white">
              Continuar <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={submit}
              disabled={pending}
              className="bg-rd-red hover:bg-rd-red-dark text-white h-12 px-8 font-display tracking-wider text-base"
            >
              {pending ? 'Procesando…' : 'Confirmar pedido'}
            </Button>
          )}
        </div>
      </div>

      {/* Summary */}
      <aside className="bg-white rounded-3xl border border-zinc-200 p-6 h-fit lg:sticky lg:top-28">
        <h3 className="font-display text-2xl tracking-wider mb-4">Resumen</h3>
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {items.map((it) => (
            <div key={it.id} className="flex gap-3 items-center">
              <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-zinc-100 shrink-0">
                <Image src={it.image} alt={it.name} fill sizes="56px" className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold line-clamp-1">{it.name}</p>
                <p className="text-xs text-zinc-500">x{it.quantity}</p>
              </div>
              <p className="text-sm font-bold">{formatRD(it.price * it.quantity)}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-zinc-200 my-4" />

        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Cupón"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value.toUpperCase())}
            className="uppercase"
          />
          <Button variant="outline" onClick={applyCoupon} disabled={couponPending || !coupon.trim()}>
            <Tag className="h-4 w-4 mr-1" /> Aplicar
          </Button>
        </div>

        <div className="space-y-1.5 text-sm">
          <Row label="Subtotal" value={formatRD(subtotal)} />
          <Row label={shipping === 0 ? 'Envío (gratis)' : 'Envío'} value={formatRD(shipping)} />
          {appliedCoupon && (
            <Row
              label={`Cupón ${appliedCoupon.code}`}
              value={`-${formatRD(appliedCoupon.discount)}`}
              accent
            />
          )}
        </div>
        <div className="border-t border-zinc-200 my-3" />
        <div className="flex justify-between items-baseline">
          <span className="text-base font-bold">Total</span>
          <span className="font-display text-3xl text-rd-red">{formatRD(total)}</span>
        </div>
      </aside>
    </div>
  )
}

function Stepper({ step }: { step: number }) {
  const labels = ['Datos', 'Dirección', 'Pago', 'Confirmar']
  return (
    <div className="flex items-center gap-2 mb-6">
      {labels.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
              i < step
                ? 'bg-emerald-600 text-white'
                : i === step
                  ? 'bg-rd-red text-white'
                  : 'bg-zinc-200 text-zinc-500'
            }`}
          >
            {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
          </div>
          <span
            className={`text-xs uppercase tracking-wider hidden sm:inline ${i === step ? 'font-bold text-rd-red' : 'text-zinc-500'}`}
          >
            {label}
          </span>
          {i < labels.length - 1 && <div className="hidden sm:block h-px w-6 bg-zinc-300" />}
        </div>
      ))}
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl border border-zinc-200 p-6 md:p-8">
      <h2 className="font-display text-2xl tracking-wider mb-5">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-zinc-600 mb-1 block">{label}</span>
      {children}
    </label>
  )
}

function Section({ title, data }: { title: string; data: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-sm text-zinc-500 uppercase tracking-wider">{title}</span>
      <span className="text-sm text-right">{data}</span>
    </div>
  )
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-600">{label}</span>
      <span className={accent ? 'text-emerald-600 font-bold' : ''}>{value}</span>
    </div>
  )
}
