'use client'

import { useState } from 'react'
import { Star, BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { submitReview } from '@/lib/actions/reviews'
import { formatDate } from '@/lib/format'
import { toast } from 'sonner'
import type { Review } from '@/types'

export default function ReviewsSection({ productId, reviews }: { productId: string; reviews: Review[] }) {
  const [pending, setPending] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    const fd = new FormData()
    fd.set('product_id', productId)
    fd.set('rating', String(rating))
    fd.set('comment', comment)
    const result = await submitReview(fd)
    setPending(false)
    if (!result.ok) return toast.error(result.message)
    toast.success('¡Gracias por tu reseña!')
    setComment('')
  }

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-8">
      <form onSubmit={onSubmit} className="bg-zinc-50 rounded-3xl p-6 h-fit">
        <h3 className="font-display text-xl tracking-wider mb-4">Deja tu reseña</h3>
        <div className="flex items-center gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => {
            const value = i + 1
            return (
              <button key={i} type="button" onClick={() => setRating(value)} className="text-2xl">
                <Star className={`h-7 w-7 ${value <= rating ? 'fill-rd-yellow text-rd-yellow' : 'text-zinc-300'}`} />
              </button>
            )
          })}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Cuenta cómo te quedó…"
          rows={4}
          className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rd-red"
        />
        <Button type="submit" disabled={pending} className="w-full mt-4 bg-rd-red hover:bg-rd-red-dark text-white font-display tracking-wider">
          {pending ? 'Enviando…' : 'Publicar reseña'}
        </Button>
        <p className="text-[11px] text-zinc-500 mt-2">Necesitas iniciar sesión para reseñar.</p>
      </form>

      <div>
        {reviews.length === 0 ? (
          <p className="text-zinc-500">Aún no hay reseñas. ¡Sé el primero!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="border border-zinc-200 rounded-2xl p-5 bg-white">
                <div className="flex items-center justify-between mb-2 gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="font-bold truncate">{r.profiles?.full_name ?? 'Cliente RD'}</p>
                    {r.verified && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <BadgeCheck className="h-3.5 w-3.5" /> Compra verificada
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500 shrink-0">{formatDate(r.created_at)}</span>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < r.rating ? 'fill-rd-yellow text-rd-yellow' : 'text-zinc-300'}`} />
                  ))}
                </div>
                {r.comment && <p className="text-sm text-zinc-700">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
