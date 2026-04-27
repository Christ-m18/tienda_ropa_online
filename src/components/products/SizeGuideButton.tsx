'use client'

import { Ruler } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const SIZES = [
  { size: 'XS', chest: '86', waist: '70', hip: '90' },
  { size: 'S', chest: '90', waist: '74', hip: '94' },
  { size: 'M', chest: '96', waist: '80', hip: '100' },
  { size: 'L', chest: '102', waist: '86', hip: '106' },
  { size: 'XL', chest: '108', waist: '92', hip: '112' },
  { size: 'XXL', chest: '114', waist: '98', hip: '118' },
]

export default function SizeGuideButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-bold text-rd-charcoal hover:text-rd-red underline-offset-4 hover:underline"
        >
          <Ruler className="h-4 w-4" /> Guia de tallas
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-wider">Guia de tallas</DialogTitle>
          <DialogDescription>Medidas en centimetros. Toma la medida sobre tu cuerpo.</DialogDescription>
        </DialogHeader>
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="text-left px-3 py-2">Talla</th>
                <th className="text-right px-3 py-2">Pecho</th>
                <th className="text-right px-3 py-2">Cintura</th>
                <th className="text-right px-3 py-2">Cadera</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {SIZES.map((s) => (
                <tr key={s.size}>
                  <td className="px-3 py-2 font-bold">{s.size}</td>
                  <td className="px-3 py-2 text-right">{s.chest} cm</td>
                  <td className="px-3 py-2 text-right">{s.waist} cm</td>
                  <td className="px-3 py-2 text-right">{s.hip} cm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-zinc-500">
          Si estas entre dos tallas, recomendamos elegir la mas grande para corte holgado.
        </p>
      </DialogContent>
    </Dialog>
  )
}
