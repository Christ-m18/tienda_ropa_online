'use client'

import { useTransition } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportOrdersCSV } from '@/lib/actions/admin'
import { toast } from 'sonner'

export default function ExportOrdersButton() {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const r = await exportOrdersCSV()
      if (!r.ok) {
        toast.error(r.message)
        return
      }
      const blob = new Blob([r.csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = r.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('CSV descargado')
    })
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={pending}>
      <Download className="h-4 w-4 mr-1" />
      {pending ? 'Generando...' : 'Exportar CSV'}
    </Button>
  )
}
