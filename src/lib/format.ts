const dop = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  maximumFractionDigits: 0,
})

export function formatRD(value: number | null | undefined) {
  if (value == null) return 'RD$0'
  return dop.format(value).replace('DOP', 'RD$')
}

const dateFmt = new Intl.DateTimeFormat('es-DO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function formatDate(value: string | Date) {
  return dateFmt.format(typeof value === 'string' ? new Date(value) : value)
}

export function discountPercent(price: number, discount?: number | null) {
  if (!discount || discount >= price) return 0
  return Math.round(((price - discount) / price) * 100)
}
