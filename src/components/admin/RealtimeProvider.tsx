'use client'

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected'

const RealtimeContext = createContext<{ status: ConnectionStatus }>({ status: 'connecting' })

export function useRealtimeStatus() {
  return useContext(RealtimeContext)
}

export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const refresh = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.refresh()
    }, 500)
  }, [router])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_proofs' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, refresh)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setStatus('connected')
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setStatus('disconnected')
        else setStatus('connecting')
      })

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      supabase.removeChannel(channel)
    }
  }, [refresh])

  return (
    <RealtimeContext.Provider value={{ status }}>
      {children}
    </RealtimeContext.Provider>
  )
}
