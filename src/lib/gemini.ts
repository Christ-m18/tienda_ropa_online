import 'server-only'

// Orden de preferencia segun cuota free tier disponible en tu cuenta.
// 3.1-flash-lite: 500 RPD. 2.5-flash-lite: 20 RPD. 2.5-flash: 20 RPD.
const FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-3.1-flash-lite',
] as const

export class GeminiQuotaError extends Error {
  retryAfterSeconds?: number
  constructor(message: string, retry?: number) {
    super(message)
    this.name = 'GeminiQuotaError'
    this.retryAfterSeconds = retry
  }
}

function buildEndpoint(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
}

type GeminiContent = {
  role: 'user' | 'model'
  parts: Array<{ text: string }>
}

async function callModel(model: string, apiKey: string, body: unknown) {
  const res = await fetch(`${buildEndpoint(model)}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  return res
}

export async function geminiChat(messages: GeminiContent[], systemInstruction?: string) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('Falta GEMINI_API_KEY')

  const body = {
    contents: messages,
    systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
  }

  const preferred = process.env.GEMINI_MODEL
  const candidates = preferred
    ? [preferred, ...FALLBACK_MODELS.filter((m) => m !== preferred)]
    : [...FALLBACK_MODELS]

  let lastError = ''
  let lastStatus = 0
  let lastRetry: number | undefined
  for (const model of candidates) {
    const res = await callModel(model, apiKey, body)
    if (res.ok) {
      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
      }
      return data.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join('\n') ?? ''
    }
    const text = await res.text()
    lastError = text
    lastStatus = res.status
    if (res.status === 429) {
      const m = text.match(/"retryDelay":\s*"(\d+)s"/)
      lastRetry = m ? Number(m[1]) : undefined
      continue
    }
    if (res.status !== 404 && res.status !== 400) break
  }
  if (lastStatus === 429) {
    throw new GeminiQuotaError(
      lastRetry
        ? `Cuota agotada. Intenta de nuevo en ${lastRetry} segundos.`
        : 'Cuota de Gemini agotada por hoy.',
      lastRetry
    )
  }
  throw new Error(`Gemini ${lastStatus}: ${lastError}`)
}
