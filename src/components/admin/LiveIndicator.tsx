'use client'

import { useRealtimeStatus } from './RealtimeProvider'

export default function LiveIndicator() {
  const { status } = useRealtimeStatus()

  if (status === 'connected') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        En vivo
      </span>
    )
  }

  if (status === 'connecting') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-amber-600">
        <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
        Conectando...
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-red-500">
      <span className="h-2 w-2 rounded-full bg-red-400" />
      Reconectando...
    </span>
  )
}
