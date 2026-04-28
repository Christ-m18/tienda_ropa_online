import type { PaymentMethod } from '@/types'

// Para habilitar Stripe / PayPal cuando se integre el gateway,
// agrega el id a este Set y borra la entrada de DISABLED_REASON.
export const ENABLED_PAYMENT_METHODS: ReadonlySet<PaymentMethod> = new Set([
  'cod',
  'bank_transfer',
])

export const DISABLED_REASON: Partial<Record<PaymentMethod, string>> = {
  stripe: 'Próximamente',
  paypal: 'Próximamente',
}

export function isPaymentEnabled(method: PaymentMethod): boolean {
  return ENABLED_PAYMENT_METHODS.has(method)
}
