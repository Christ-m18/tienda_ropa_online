'use client'

import { useState, useTransition } from 'react'
import { Building2, Copy, Check, CheckCircle2, Upload, FileText, Truck, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { uploadVoucher } from '@/lib/actions/voucher'
import { formatRD } from '@/lib/format'
import { toast } from 'sonner'
import type { BankAccount } from '@/types'

interface Props {
  orderId: string
  orderTotal: number
  bankAccounts: BankAccount[]
}

function buildDisplayRef(orderId: string, bankName: string): string {
  const suffix = bankName.split(' ').pop()?.slice(0, 3).toUpperCase() ?? 'BNK'
  return `${orderId.slice(0, 8).toUpperCase()}-${suffix}`
}

export default function BankTransferInstructions({ orderId, orderTotal, bankAccounts }: Props) {
  const [pending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')

  const selected = bankAccounts.find((b) => b.id === selectedId)
  const displayRef = selected ? buildDisplayRef(orderId, selected.bank_name) : null

  function copyAccount(bankId: string, account: string) {
    navigator.clipboard.writeText(account).then(() => {
      setCopiedId(bankId)
      toast.success('Número de cuenta copiado')
      setTimeout(() => setCopiedId(null), 2000)
    }).catch(() => {
      toast.error('No se pudo copiar. Cópialo manualmente.')
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return toast.error('Selecciona un banco')
    if (!file) return toast.error('Sube el comprobante')

    startTransition(async () => {
      const fd = new FormData()
      fd.set('order_id', orderId)
      fd.set('bank_account_id', selected.id)
      fd.set('file', file)
      if (notes.trim()) fd.set('notes', notes)
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
          <p className="text-xs text-emerald-700">Los pedidos por transferencia tienen prioridad de envío.</p>
        </div>
      </div>

      {/* Step 1: Select bank */}
      <div className="bg-rd-blue/5 border border-rd-blue/20 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="h-5 w-5 text-rd-blue shrink-0" />
          <p className="font-display text-lg tracking-wider">1. Elige tu banco</p>
        </div>
        <p className="text-xs text-zinc-500 mb-4">
          Selecciona el banco al que harás la transferencia para ver el número de cuenta.
        </p>

        <div className="grid gap-2">
          {bankAccounts.map((bank) => {
            const isSelected = selectedId === bank.id
            const isCopied = copiedId === bank.id
            return (
              <div
                key={bank.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedId(bank.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(bank.id) } }}
                className={`w-full text-left rounded-xl p-3 sm:p-4 border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-rd-blue bg-white shadow-sm'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="h-9 w-9 rounded-lg text-white flex items-center justify-center font-display text-sm shrink-0"
                    style={{ backgroundColor: bank.display_color }}
                  >
                    {bank.bank_name.split(' ').pop()?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{bank.bank_name}</p>
                    {isSelected && (
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <p className="font-mono text-sm text-zinc-800 break-all min-w-0">
                          {bank.account_number}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            copyAccount(bank.id, bank.account_number)
                          }}
                          className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            isCopied
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rd-blue/10 text-rd-blue hover:bg-rd-blue/20'
                          }`}
                        >
                          {isCopied ? (
                            <><Check className="h-3.5 w-3.5" />Copiado</>
                          ) : (
                            <><Copy className="h-3.5 w-3.5" />Copiar</>
                          )}
                        </button>
                      </div>
                    )}
                    {isSelected && bank.account_holder && (
                      <p className="text-xs text-zinc-500 mt-0.5">Titular: {bank.account_holder}</p>
                    )}
                    {isSelected && bank.account_type && (
                      <p className="text-xs text-zinc-400">Tipo: {bank.account_type}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Transfer info box — shown once a bank is selected */}
      {selected && displayRef && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
            Datos para la transferencia
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-amber-700 mb-0.5">Monto exacto a transferir</p>
              <p className="font-display text-xl text-amber-900">{formatRD(orderTotal)}</p>
            </div>
            <div>
              <p className="text-xs text-amber-700 mb-0.5">Referencia (inclúyela en la transferencia)</p>
              <p className="font-mono text-base font-bold text-amber-900 break-all">{displayRef}</p>
            </div>
          </div>
          <p className="text-xs text-amber-600">
            Incluye la referencia en el concepto o descripción de la transferencia para identificarla más fácil.
          </p>
        </div>
      )}

      {/* Step 2: Upload voucher */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-rd-red shrink-0" />
          <p className="font-display text-lg tracking-wider">2. Sube tu comprobante</p>
        </div>
        <p className="text-xs text-zinc-500">
          Realiza la transferencia y luego sube el voucher. Un administrador lo revisará y confirmará tu pedido.
        </p>

        <div>
          <label htmlFor="notes-input" className="text-sm text-zinc-600 mb-1 block">Notas (opcional)</label>
          <Input
            id="notes-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Información adicional..."
          />
        </div>

        <div>
          <label className="text-sm text-zinc-600 mb-1 block">
            Comprobante (imagen o PDF, máx 5MB)
          </label>
          <label className="flex items-center justify-center gap-2 h-20 rounded-xl border-2 border-dashed border-zinc-300 hover:border-rd-red cursor-pointer transition-colors">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <span className="flex items-center gap-2 text-sm text-zinc-700 px-4 text-center min-w-0">
                <FileText className="h-4 w-4 text-rd-red shrink-0" />
                <span className="truncate">{file.name}</span>
              </span>
            ) : (
              <span className="text-sm text-zinc-400">Haz clic para seleccionar archivo</span>
            )}
          </label>
        </div>

        <Button
          type="submit"
          disabled={pending || !selectedId || !file}
          className="w-full bg-rd-red hover:bg-rd-red-dark text-white h-11 font-display tracking-wider"
        >
          {pending ? 'Enviando...' : 'Enviar comprobante'}
        </Button>
      </form>
    </div>
  )
}
