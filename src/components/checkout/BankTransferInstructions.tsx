'use client'

import { useState, useTransition } from 'react'
import { Building2, Copy, CheckCircle2, Upload, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { uploadVoucher } from '@/lib/actions/voucher'
import { toast } from 'sonner'

const BANK_ACCOUNTS = [
  { bank: 'Banco Popular Dominicano', account: '123-4567890-1', type: 'Ahorro', holder: 'Tienda RD SRL', rnc: '1-23-45678-9' },
  { bank: 'BHD Leon', account: '987-6543210-1', type: 'Corriente', holder: 'Tienda RD SRL', rnc: '1-23-45678-9' },
  { bank: 'Banreservas', account: '456-7891234-1', type: 'Ahorro', holder: 'Tienda RD SRL', rnc: '1-23-45678-9' },
]

const BANK_NAMES = BANK_ACCOUNTS.map((b) => b.bank)

export default function BankTransferInstructions({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [bankName, setBankName] = useState(BANK_NAMES[0])
  const [reference, setReference] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast.success('Copiado')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return toast.error('Sube el comprobante')
    if (!reference.trim()) return toast.error('Ingresa el numero de referencia')
    if (!amount.trim()) return toast.error('Ingresa el monto')

    startTransition(async () => {
      const fd = new FormData()
      fd.set('order_id', orderId)
      fd.set('file', file)
      fd.set('bank_name', bankName)
      fd.set('reference_number', reference)
      fd.set('amount', amount)
      fd.set('notes', notes)
      const r = await uploadVoucher(fd)
      if (!r.ok) toast.error(r.message)
      else {
        toast.success('Comprobante enviado. Lo revisaremos pronto.')
        setSubmitted(true)
      }
    })
  }

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
        <p className="font-display text-xl tracking-wider">Comprobante recibido</p>
        <p className="text-sm text-emerald-700 mt-1">
          Estamos revisando tu comprobante. Te notificaremos cuando tu pago sea aprobado.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Bank accounts */}
      <div className="bg-rd-blue/5 border border-rd-blue/20 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-rd-blue" />
          <p className="font-display text-lg tracking-wider">Datos bancarios</p>
        </div>
        <p className="text-sm text-zinc-600 mb-4">
          Transfiere el monto total a cualquiera de estas cuentas y luego sube el comprobante:
        </p>
        <div className="space-y-3">
          {BANK_ACCOUNTS.map((acc) => (
            <div key={acc.bank} className="bg-white rounded-xl p-3 border border-zinc-200">
              <div className="flex items-center justify-between mb-1">
                <p className="font-bold text-sm">{acc.bank}</p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(acc.account)}
                  className="text-zinc-400 hover:text-rd-red p-1"
                  title="Copiar cuenta"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-sm font-mono text-zinc-700">{acc.account} ({acc.type})</p>
              <p className="text-xs text-zinc-500">{acc.holder} &middot; RNC: {acc.rnc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Upload form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Upload className="h-5 w-5 text-rd-red" />
          <p className="font-display text-lg tracking-wider">Subir comprobante</p>
        </div>

        <div>
          <label className="text-sm text-zinc-600 mb-1 block">Banco utilizado</label>
          <select
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-rd-red"
          >
            {BANK_NAMES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-zinc-600 mb-1 block">Numero de referencia</label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ej: 123456789"
            />
          </div>
          <div>
            <label className="text-sm text-zinc-600 mb-1 block">Monto transferido (RD$)</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ej: 2500"
              min="1"
              step="0.01"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-zinc-600 mb-1 block">Notas (opcional)</label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Informacion adicional..."
          />
        </div>

        <div>
          <label className="text-sm text-zinc-600 mb-1 block">Comprobante (imagen o PDF, max 5MB)</label>
          <label className="flex items-center justify-center gap-2 h-20 rounded-xl border-2 border-dashed border-zinc-300 hover:border-rd-red cursor-pointer transition-colors">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <span className="flex items-center gap-2 text-sm text-zinc-700">
                <FileText className="h-4 w-4 text-rd-red" />
                {file.name}
              </span>
            ) : (
              <span className="text-sm text-zinc-400">Haz clic para seleccionar archivo</span>
            )}
          </label>
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="w-full bg-rd-red hover:bg-rd-red-dark text-white h-11 font-display tracking-wider"
        >
          {pending ? 'Enviando...' : 'Enviar comprobante'}
        </Button>
      </form>
    </div>
  )
}
