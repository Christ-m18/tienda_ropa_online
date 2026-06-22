import Link from 'next/link'
import { AlertTriangle, ShieldX, XCircle } from 'lucide-react'
import LoginForm from './login-form'

type SearchParams = Promise<{ redirect?: string; reason?: string }>

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const redirectTo = params.redirect
  const reason = params.reason

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black px-4 py-12">
      <div className="w-full max-w-md bg-zinc-950/80 border border-red-600/30 rounded-3xl shadow-[0_0_60px_rgba(214,40,40,0.15)] backdrop-blur-xl p-8 md:p-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-3xl font-display tracking-wider text-white">
            Cora<span className="text-rd-red">Mely</span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-display mt-6 text-white">Bienvenido de vuelta</h1>
          <p className="text-zinc-400 mt-2">Entra a tu cuenta para seguir decorando tu hogar</p>
        </div>

        {reason === 'auth_error' && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-950/60 p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">
                Ocurrió un error al autenticar con el proveedor. Por favor, intentá de nuevo.
              </p>
            </div>
          </div>
        )}

        {reason === 'blocked' && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-950/60 p-4">
            <div className="flex items-start gap-3">
              <ShieldX className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-300 text-sm">Cuenta suspendida</p>
                <p className="text-red-400/90 text-xs mt-1 leading-relaxed">
                  Tu cuenta ha sido bloqueada por un administrador. Si crees que esto es un error,
                  contacta con soporte para mas informacion.
                </p>
                <a
                  href="mailto:soporte@coramely.com"
                  className="inline-block mt-2 text-xs font-bold text-rd-yellow hover:underline"
                >
                  Contactar soporte
                </a>
              </div>
            </div>
          </div>
        )}

        {reason === 'unconfirmed' && (
          <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-950/60 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-300 text-sm">Correo no confirmado</p>
                <p className="text-amber-400/90 text-xs mt-1 leading-relaxed">
                  Debes confirmar tu correo electronico antes de iniciar sesion. Revisa tu bandeja de entrada.
                </p>
              </div>
            </div>
          </div>
        )}

        <LoginForm redirectTo={redirectTo ?? '/'} />
        <p className="text-center text-sm mt-4">
          <Link href="/recuperar" className="text-zinc-400 hover:text-rd-yellow">¿Olvidaste tu contraseña?</Link>
        </p>
        <p className="text-center text-sm text-zinc-400 mt-6">
          ¿Aún no tienes cuenta?{' '}
          <Link href="/registro" className="text-rd-yellow font-semibold hover:underline">Regístrate</Link>
        </p>
      </div>
    </div>
  )
}
