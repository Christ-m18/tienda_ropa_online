/**
 * Shipping rates based on distance from La Vega (base de operaciones).
 * Zona 1: La Vega y alrededores inmediatos
 * Zona 2: Cibao central y cercano
 * Zona 3: Gran Santo Domingo y Santiago
 * Zona 4: Norte, Este y Sur cercano
 * Zona 5: Provincias lejanas (frontera, suroeste, este lejano)
 */

export const SHIPPING_FREE_THRESHOLD = 3000

type ShippingZone = {
  zone: number
  rate: number
  time: string
}

const PROVINCE_SHIPPING: Record<string, ShippingZone> = {
  // Zona 1 — La Vega y vecinas inmediatas (RD$100)
  'La Vega':             { zone: 1, rate: 100, time: '24h' },
  'Monseñor Nouel':      { zone: 1, rate: 100, time: '24h' },       // Bonao
  'Espaillat':           { zone: 1, rate: 100, time: '24h' },       // Moca
  'Sánchez Ramírez':     { zone: 1, rate: 100, time: '24h' },       // Cotuí

  // Zona 2 — Cibao central (RD$150)
  'Santiago':            { zone: 2, rate: 150, time: '24h' },
  'Hermanas Mirabal':    { zone: 2, rate: 150, time: '24h' },       // Salcedo
  'Duarte':              { zone: 2, rate: 150, time: '24-48h' },    // San Fco. de Macorís
  'Santiago Rodríguez':  { zone: 2, rate: 150, time: '24-48h' },

  // Zona 3 — Gran Santo Domingo, Puerto Plata, centro (RD$200)
  'Distrito Nacional':   { zone: 3, rate: 200, time: '24-48h' },
  'Santo Domingo':       { zone: 3, rate: 200, time: '24-48h' },
  'Puerto Plata':        { zone: 3, rate: 200, time: '24-48h' },
  'Valverde':            { zone: 3, rate: 200, time: '24-48h' },    // Mao
  'San Cristóbal':       { zone: 3, rate: 200, time: '24-48h' },
  'Monte Plata':         { zone: 3, rate: 200, time: '24-48h' },
  'María Trinidad Sánchez': { zone: 3, rate: 200, time: '24-48h' }, // Nagua
  'Samaná':              { zone: 3, rate: 200, time: '24-48h' },

  // Zona 4 — Este, Sur y Noroeste (RD$250)
  'San Pedro de Macorís': { zone: 4, rate: 250, time: '48h' },
  'La Romana':            { zone: 4, rate: 250, time: '48h' },
  'La Altagracia':        { zone: 4, rate: 250, time: '48h' },      // Higüey
  'El Seibo':             { zone: 4, rate: 250, time: '48h' },
  'Hato Mayor':           { zone: 4, rate: 250, time: '48h' },
  'Peravia':              { zone: 4, rate: 250, time: '48h' },      // Baní
  'Azua':                 { zone: 4, rate: 250, time: '48h' },
  'San José de Ocoa':     { zone: 4, rate: 250, time: '48h' },
  'Montecristi':          { zone: 4, rate: 250, time: '48h' },
  'Dajabón':              { zone: 4, rate: 250, time: '48h' },

  // Zona 5 — Provincias lejanas, frontera y sur profundo (RD$300)
  'Barahona':             { zone: 5, rate: 300, time: '48-72h' },
  'Baoruco':              { zone: 5, rate: 300, time: '48-72h' },    // Neyba
  'Independencia':        { zone: 5, rate: 300, time: '48-72h' },    // Jimaní
  'Pedernales':           { zone: 5, rate: 300, time: '72h' },
  'San Juan':             { zone: 5, rate: 300, time: '48-72h' },    // San Juan de la Maguana
  'Elías Piña':           { zone: 5, rate: 300, time: '48-72h' },    // Comendador
}

/** All 32 provinces sorted alphabetically */
export const PROVINCES = Object.keys(PROVINCE_SHIPPING).sort((a, b) => a.localeCompare(b, 'es'))

/** Get shipping rate for a province. Returns flat 250 for unknown provinces. */
export function getShippingRate(province: string): number {
  return PROVINCE_SHIPPING[province]?.rate ?? 250
}

/** Get shipping info for a province */
export function getShippingInfo(province: string): ShippingZone {
  return PROVINCE_SHIPPING[province] ?? { zone: 4, rate: 250, time: '48h' }
}

/** Calculate shipping cost (0 if above threshold) */
export function calculateShipping(province: string, subtotal: number): number {
  if (subtotal >= SHIPPING_FREE_THRESHOLD) return 0
  return getShippingRate(province)
}

/** Zones for the shipping info page */
export const SHIPPING_ZONES = [
  {
    name: 'La Vega, Bonao, Moca, Cotuí',
    description: 'Zona local',
    time: '24h',
    price: 'RD$100',
  },
  {
    name: 'Santiago, Salcedo, San Fco. de Macorís',
    description: 'Cibao central',
    time: '24-48h',
    price: 'RD$150',
  },
  {
    name: 'Santo Domingo, Puerto Plata, San Cristóbal, Samaná, Nagua',
    description: 'Centro y norte',
    time: '24-48h',
    price: 'RD$200',
  },
  {
    name: 'La Romana, Higüey, San Pedro, Azua, Baní, Montecristi',
    description: 'Este, sur y noroeste',
    time: '48h',
    price: 'RD$250',
  },
  {
    name: 'Barahona, San Juan, Pedernales, Jimaní, Elías Piña',
    description: 'Sur profundo y frontera',
    time: '48-72h',
    price: 'RD$300',
  },
]
