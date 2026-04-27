import { createClient } from '@/utils/supabase/server'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/format'
import type { Coupon } from '@/types'

export default async function AdminCouponsPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
  const coupons = (data ?? []) as Coupon[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">Cupones</h1>
        <p className="text-zinc-500">{coupons.length} cupones</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-zinc-200 p-5 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-rd-yellow/30" />
            <p className="font-mono text-xs text-zinc-500">{c.type === 'percentage' ? '% OFF' : 'RD$ OFF'}</p>
            <p className="font-display text-2xl tracking-wider mt-1">{c.code}</p>
            <p className="text-3xl font-display text-rd-red my-2">
              {c.type === 'percentage' ? `-${c.discount_value}%` : `-RD$${c.discount_value}`}
            </p>
            {c.description && <p className="text-sm text-zinc-600">{c.description}</p>}
            <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
              <span>Usos: {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ''}</span>
              {c.is_active ? (
                <Badge className="bg-emerald-100 text-emerald-700">Activo</Badge>
              ) : (
                <Badge className="bg-zinc-200 text-zinc-700">Inactivo</Badge>
              )}
            </div>
            {c.valid_until && (
              <p className="text-xs text-zinc-400 mt-1">Vence {formatDate(c.valid_until)}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
