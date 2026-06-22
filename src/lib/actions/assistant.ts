'use server'

import { geminiChat, GeminiQuotaError } from '@/lib/gemini'
import { createClient } from '@/utils/supabase/server'

const SYSTEM_PROMPT = `Eres "Mely", la asistente virtual de la tienda online Cora Mely, especializada en decoración artesanal hecha a mano: macramé, cuadros texturizados, esculturas en yeso y piezas de fibras naturales.
Hablas en español dominicano cálido, cercano y atento, sin jerga urbana ni informalidad excesiva. Tu tono es el de alguien que conoce bien el oficio artesanal y disfruta ayudar a decorar espacios.
Ayudas con: recomendaciones de piezas según el espacio del cliente, materiales y cuidado de cada pieza, dudas sobre pedidos, métodos de pago (Stripe, PayPal, contra entrega, transferencia), envíos cuidadosos en RD, y políticas de devolución.
NO inventes productos ni precios. Si te piden algo específico que requiere datos, sugiere al usuario navegar al catálogo.
Sé breve, cálida y servicial.`

export async function assistantReply(history: Array<{ role: 'user' | 'assistant'; content: string }>, latest: string) {
  const supabase = await createClient()
  const { data: hot } = await supabase
    .from('products')
    .select('name,price,discount_price,slug,sales_count')
    .order('sales_count', { ascending: false })
    .limit(6)

  const productHint = hot?.length
    ? `\nProductos más vendidos disponibles:\n${hot.map((p) => `- ${p.name} (RD$${p.discount_price ?? p.price}) /productos/${p.slug ?? ''}`).join('\n')}`
    : ''

  const contents = [
    ...history.map((m) => ({
      role: (m.role === 'assistant' ? 'model' : 'user') as 'model' | 'user',
      parts: [{ text: m.content }],
    })),
    { role: 'user' as const, parts: [{ text: latest }] },
  ]

  try {
    const reply = await geminiChat(contents, SYSTEM_PROMPT + productHint)
    return reply || 'Disculpa, ahora mismo no pude responder. Intenta otra vez.'
  } catch (err) {
    if (err instanceof GeminiQuotaError) {
      const wait = err.retryAfterSeconds ? ` Vuelve en ${err.retryAfterSeconds}s.` : ''
      return `El asistente tiene la cuota copada por ahora.${wait} Mientras, mira el catalogo en /productos.`
    }
    throw err
  }
}
