'use client'

import { useState, useRef, useEffect, useTransition, type SyntheticEvent } from 'react'
import { MessageCircle, X, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { assistantReply } from '@/lib/actions/assistant'

type Message = { role: 'user' | 'assistant'; content: string }

const INITIAL: Message[] = [
  {
    role: 'assistant',
    content: '¡Qué lo qué! Soy El Broth, tu asistente de TIENDA RD. Pregúntame sobre productos, envíos o pagos. 🇩🇴',
  },
]

export default function Assistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(INITIAL)
  const [input, setInput] = useState('')
  const [pending, startTransition] = useTransition()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  function send(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    const next: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    startTransition(async () => {
      try {
        const reply = await assistantReply(next.slice(-8), text)
        setMessages((m) => [...m, { role: 'assistant', content: reply }])
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error inesperado'
        setMessages((m) => [...m, { role: 'assistant', content: `Algo falló: ${message}` }])
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Cerrar asistente' : 'Abrir asistente'}
        aria-expanded={open}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 h-14 w-14 rounded-full bg-rd-red hover:bg-rd-red-dark text-white shadow-lg shadow-rd-red/30 flex items-center justify-center z-50 transition-transform hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Chat con El Broth"
          className="fixed bottom-34 md:bottom-24 right-4 md:right-6 w-[min(380px,calc(100vw-2rem))] h-[520px] max-h-[calc(100vh-10rem)] bg-white rounded-3xl shadow-2xl border border-zinc-200 flex flex-col z-50 overflow-hidden"
        >
          <div className="bg-rd-charcoal text-white p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-rd-red flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg tracking-wider">EL BROTH</p>
              <p className="text-xs text-zinc-400">Tu asistente urbano · powered by Gemini</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-rd-bone">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                    m.role === 'user'
                      ? 'bg-rd-red text-white rounded-br-sm'
                      : 'bg-white border border-zinc-200 text-zinc-800 rounded-bl-sm'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {pending && (
              <div className="flex justify-start">
                <div className="bg-white border border-zinc-200 px-4 py-2.5 rounded-2xl text-sm">
                  <span className="inline-flex gap-1">
                    <span className="h-2 w-2 bg-zinc-400 rounded-full animate-bounce" />
                    <span className="h-2 w-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="h-2 w-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={send} className="p-3 border-t border-zinc-200 bg-white flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregúntame algo…"
              className="flex-1"
              disabled={pending}
            />
            <Button type="submit" size="icon" disabled={pending || !input.trim()} className="bg-rd-red hover:bg-rd-red-dark">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  )
}
