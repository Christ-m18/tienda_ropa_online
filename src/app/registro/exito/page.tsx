import Link from 'next/link'
import { MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

type SearchParams = Promise<{ email?: string }>

export default async function RegisterSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { email } = await searchParams
  const target = email?.trim() || 'tu correo'

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black px-4 py-12">
      <div className="w-full max-w-md bg-zinc-950/80 border border-red-600/30 rounded-3xl shadow-[0_0_60px_rgba(214,40,40,0.15)] backdrop-blur-xl p-8 md:p-10">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block text-3xl font-display tracking-wider text-white">
            Cora<span className="text-rd-red">Mely</span>
          </Link>
        </div>

        <div className="flex flex-col items-center text-center space-y-5">
          <div className="h-16 w-16 rounded-full bg-rd-yellow/15 border border-rd-yellow/40 flex items-center justify-center">
            <MailCheck className="h-8 w-8 text-rd-yellow" />
          </div>

          <h1 className="text-2xl md:text-3xl font-display tracking-wider text-white">
            ¡Cuenta creada!
          </h1>

          <p className="text-zinc-300">
            Te enviamos un correo de confirmación a{' '}
            <span className="text-rd-yellow font-semibold break-all">{target}</span>.
          </p>

          <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-left text-sm text-zinc-300 space-y-2">
            <p className="font-bold text-white">Próximos pasos</p>
            <ol className="list-decimal list-inside space-y-1 text-zinc-400">
              <li>Abre tu bandeja de entrada.</li>
              <li>Si no lo ves, revisa <span className="text-zinc-200">spam</span> o promociones.</li>
              <li>Toca el botón de confirmación del correo.</li>
              <li>Vuelve aquí e inicia sesión.</li>
            </ol>
          </div>

          <div className="w-full flex flex-col gap-2 pt-2">
            <Link href="/login" className="w-full">
              <Button className="w-full h-12 bg-rd-yellow hover:bg-rd-yellow/90 text-zinc-900 font-display tracking-wide">
                Ir a iniciar sesión
              </Button>
            </Link>
            <Link href="/" className="w-full">
              <Button
                variant="outline"
                className="w-full h-12 border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-900 hover:text-white"
              >
                Seguir explorando
              </Button>
            </Link>
          </div>

          <p className="text-xs text-zinc-500 pt-2">
            ¿No te llegó el correo? Espera 1–2 minutos o intenta registrarte de nuevo con el mismo correo.
          </p>
        </div>
      </div>
    </div>
  )
}
