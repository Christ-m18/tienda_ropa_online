'use client'

import { useState, useTransition } from 'react'
import { Building2, Copy, Check, CheckCircle2, Upload, FileText, Truck, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { uploadVoucher } from '@/lib/actions/voucher'
import { toast } from 'sonner'

const BANKS = [
  { id: 'reservas', name: 'Banco de Reservas', account: '9601750827', color: 'bg-green-600' },
  { id: 'bhd', name: 'Banco BHD', account: '38675820016', color: 'bg-blue-700' },
  { id: 'santa_cruz', name: 'Banco Santa Cruz', account: '11145000018017', color: 'bg-red-700' },
]

export default function BankTransferInstructions({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const [selectedBank, setSelectedBank] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [reference, setReference] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')

  const selected = BANKS.find((b) => b.id === selectedBank)

  function copyAccount(bankId: string, account: string) {
    navigator.clipboard.writeText(account)
    setCopiedId(bankId)
    toast.success('Numero de cuenta copiado')
    setTimeout(() => setCopiedId(null), 2000)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return toast.error('Selecciona un banco')
    if (!file) return toast.error('Sube el comprobante')
    if (!reference.trim()) return toast.error('Ingresa el numero de referencia')
    if (!amount.trim()) return toast.error('Ingresa el monto')

    startTransition(async () => {
      const fd = new FormData()
      fd.set('order_id', orderId)
      fd.set('file', file)
      fd.set('bank_name', selected.name)
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
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-emerald-600 font-bold">
          <Truck className="h-4 w-4" />
          Tu pedido tiene entrega preferencial
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Preferential delivery badge */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <p className="font-bold text-sm text-emerald-800">Entrega preferencial</p>
          <p className="text-xs text-emerald-700">Los pedidos por transferencia tienen prioridad de envio.</p>
        </div>
      </div>

      {/* Step 1: Select bank */}
      <div className="bg-rd-blue/5 border border-rd-blue/20 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="h-5 w-5 text-rd-blue" />
          <p className="font-display text-lg tracking-wider">1. Elige tu banco</p>
        </div>
        <p className="text-xs text-zinc-500 mb-4">
          Selecciona el banco al que haras la transferencia para ver el numero de cuenta.
        </p>

        <div className="grid gap-2">
          {BANKS.map((bank) => {
            const isSelected = selectedBank === bank.id
            const isCopied = copiedId === bank.id
            return (
              <button
                key={bank.id}
                type="button"
                onClick={() => setSelectedBank(bank.id)}
                className={`w-full text-left rounded-xl p-4 border-2 transition-all ${
                  isSelected
                    ? 'border-rd-blue bg-white shadow-sm'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg ${bank.color} text-white flex items-center justify-center font-display text-sm shrink-0`}>
                    {bank.name.split(' ').pop()?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{bank.name}</p>
                    {isSelected && (
                      <p className="font-mono text-base text-zinc-800 mt-0.5">{bank.account}</p>
                    )}
                  </div>
                  {isSelected && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyAccount(bank.id, bank.account)
                      }}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                        isCopied
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rd-blue/10 text-rd-blue hover:bg-rd-blue/20'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copiar
                        </>
                      )}
                    </button>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Step 2: Upload voucher */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Upload className="h-5 w-5 text-rd-red" />
          <p className="font-display text-lg tracking-wider">2. Sube tu comprobante</p>
        </div>
        <p className="text-xs text-zinc-500">
          Realiza la transferencia y luego sube el voucher. Un administrador lo revisara y confirmara tu pedido.
        </p>

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
          disabled={pending || !selectedBank}
          className="w-full bg-rd-red hover:bg-rd-red-dark text-white h-11 font-display tracking-wider"
        >
          {pending ? 'Enviando...' : 'Enviar comprobante'}
        </Button>
      </form>
    </div>
  )
}
