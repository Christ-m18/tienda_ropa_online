'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, XCircle, Download, FileText, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { reviewPaymentProof } from '@/lib/actions/voucher'
import { formatRD, formatDate } from '@/lib/format'
import { toast } from 'sonner'
import type { PaymentProof } from '@/types'

const STATUS_CONFIG = {
  pending: { label: 'Pendiente de revision', color: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Aprobado', color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700' },
}

export default function VoucherReview({
  proofs,
  signedUrls,
}: {
  proofs: PaymentProof[]
  signedUrls: Record<string, string>
}) {
  if (proofs.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800 font-medium">Sin comprobante</p>
        <p className="text-xs text-amber-600 mt-1">El cliente aun no ha subido un comprobante de transferencia.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {proofs.map((proof) => (
        <ProofCard key={proof.id} proof={proof} signedUrl={signedUrls[proof.id]} />
      ))}
    </div>
  )
}

function ProofCard({ proof, signedUrl }: { proof: PaymentProof; signedUrl?: string }) {
  const [pending, startTransition] = useTransition()
  const [rejectionReason, setRejectionReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const config = STATUS_CONFIG[proof.status]

  const isPdf = proof.file_path.endsWith('.pdf')

  function handleAction(action: 'approve' | 'reject') {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('proof_id', proof.id)
      fd.set('action', action)
      if (action === 'reject') fd.set('rejection_reason', rejectionReason)
      const r = await reviewPaymentProof(fd)
      if (!r.ok) toast.error(r.message)
      else toast.success(action === 'approve' ? 'Pago aprobado' : 'Pago rechazado')
      setShowReject(false)
    })
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <div className="p-4 border-b border-zinc-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Comprobante de pago</p>
          <Badge className={`${config.color} text-[10px] font-bold uppercase`}>{config.label}</Badge>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          {proof.bank_name && (
            <div>
              <span className="text-xs text-zinc-400">Banco</span>
              <p className="font-medium">{proof.bank_name}</p>
            </div>
          )}
          {proof.reference_number && (
            <div>
              <span className="text-xs text-zinc-400">Referencia</span>
              <p className="font-medium font-mono">{proof.reference_number}</p>
            </div>
          )}
          {proof.amount != null && (
            <div>
              <span className="text-xs text-zinc-400">Monto</span>
              <p className="font-medium font-display text-lg">{formatRD(proof.amount)}</p>
            </div>
          )}
          <div>
            <span className="text-xs text-zinc-400">Fecha envio</span>
            <p className="font-medium">{formatDate(proof.created_at)}</p>
          </div>
          {proof.notes && (
            <div className="sm:col-span-2">
              <span className="text-xs text-zinc-400">Notas</span>
              <p className="text-zinc-700">{proof.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* File preview */}
      <div className="p-4 bg-zinc-50 border-b border-zinc-100">
        {signedUrl ? (
          <div className="space-y-2">
            {!isPdf && (
              <div className="relative rounded-lg overflow-hidden bg-zinc-200 max-h-64 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={signedUrl} alt="Comprobante" className="max-h-64 object-contain" />
              </div>
            )}
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-rd-red font-bold hover:underline"
            >
              {isPdf ? <FileText className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
              <Download className="h-3.5 w-3.5" />
              Abrir comprobante
            </a>
          </div>
        ) : (
          <p className="text-xs text-zinc-400">Archivo no disponible</p>
        )}
      </div>

      {/* Actions for pending proofs */}
      {proof.status === 'pending' && (
        <div className="p-4">
          {!showReject ? (
            <div className="flex gap-2">
              <Button
                onClick={() => handleAction('approve')}
                disabled={pending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                {pending ? 'Procesando...' : 'Aprobar pago'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowReject(true)}
                disabled={pending}
                className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
              >
                <XCircle className="h-4 w-4" />
                Rechazar
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Motivo del rechazo (requerido)..."
                className="w-full rounded-lg border border-zinc-200 p-2 text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-rd-red"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleAction('reject')}
                  disabled={pending || !rejectionReason.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {pending ? 'Procesando...' : 'Confirmar rechazo'}
                </Button>
                <Button variant="outline" onClick={() => setShowReject(false)} disabled={pending}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Review result */}
      {proof.status !== 'pending' && (
        <div className="p-4 text-sm">
          {proof.status === 'rejected' && proof.rejection_reason && (
            <p className="text-red-600"><span className="font-bold">Motivo:</span> {proof.rejection_reason}</p>
          )}
          {proof.reviewed_at && (
            <p className="text-xs text-zinc-400 mt-1">Revisado: {formatDate(proof.reviewed_at)}</p>
          )}
        </div>
      )}
    </div>
  )
}
