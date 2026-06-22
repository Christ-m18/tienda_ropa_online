'use client'

import { Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const CARE_TIPS = [
  { title: 'Macramé y fibras naturales', tip: 'Sacude el polvo suavemente o usa una brocha seca. Evita la humedad prolongada y la luz solar directa para que el color no se desgaste.' },
  { title: 'Yeso y esculturas', tip: 'Limpia con un paño seco o ligeramente húmedo. No sumerjas en agua ni uses productos abrasivos: el yeso es poroso y delicado.' },
  { title: 'Cuadros texturizados', tip: 'Cuelga lejos de fuentes de calor directo. Limpia el polvo con un paño suave, sin frotar la textura.' },
  { title: 'Piezas de mesa', tip: 'Usa una base o mantel para proteger superficies. Evita golpes en los bordes, son piezas hechas a mano y cada una es única.' },
]

export default function CareGuideButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-bold text-rd-charcoal hover:text-rd-red underline-offset-4 hover:underline"
        >
          <Sparkles className="h-4 w-4" /> Guía de cuidado y materiales
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-wider">Cuidado de tu pieza</DialogTitle>
          <DialogDescription>Cada pieza es hecha a mano: pequeñas variaciones de color y textura son parte de su carácter artesanal.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {CARE_TIPS.map((c) => (
            <div key={c.title} className="rounded-xl border border-zinc-200 p-3">
              <p className="font-bold text-sm">{c.title}</p>
              <p className="text-sm text-zinc-600 mt-0.5">{c.tip}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-500">
          Revisa la sección de materiales y dimensiones de cada producto para cuidados específicos.
        </p>
      </DialogContent>
    </Dialog>
  )
}
