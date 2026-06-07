'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase'

export default function OAuthButtons({ redirectTo = '/' }: { redirectTo?: string }) {
  const [loading, setLoading] = useState<'google' | 'facebook' | null>(null)

  async function handleOAuth(provider: 'google' | 'facebook') {
    setLoading(provider)
    const supabase = createClient()
    const callbackUrl = new URL('/auth/callback', window.location.origin)
    callbackUrl.searchParams.set('next', redirectTo)
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl.toString() },
    })
  }

  const disabled = loading !== null

  return (
    <div className="space-y-3">
      <Button
        type="button"
        onClick={() => handleOAuth('google')}
        disabled={disabled}
        className="w-full h-12 bg-white hover:bg-zinc-100 text-zinc-900 font-medium border border-zinc-300 flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {loading === 'google' ? (
          'Redirigiendo…'
        ) : (
          <>
            <GoogleIcon />
            Continuar con Google
          </>
        )}
      </Button>

      <Button
        type="button"
        onClick={() => handleOAuth('facebook')}
        disabled={disabled}
        className="w-full h-12 bg-[#1877F2] hover:bg-[#1564CC] text-white font-medium flex items-center justify-center gap-3 disabled:opacity-50"
      >
        {loading === 'facebook' ? (
          'Redirigiendo…'
        ) : (
          <>
            <FacebookIcon />
            Continuar con Facebook
          </>
        )}
      </Button>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.705 17.64 9.2z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.266h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" fill="white" />
    </svg>
  )
}
