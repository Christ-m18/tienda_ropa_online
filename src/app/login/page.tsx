import Link from 'next/link'
import LoginForm from './login-form'

type SearchParams = Promise<{ redirect?: string }>

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { redirect } = await searchParams
  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black px-4 py-12">
      <div className="w-full max-w-md bg-zinc-950/80 border border-red-600/30 rounded-3xl shadow-[0_0_60px_rgba(214,40,40,0.15)] backdrop-blur-xl p-8 md:p-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-3xl font-display tracking-wider text-white">
            TIENDA<span className="text-rd-red">RD</span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-display mt-6 text-white">Qué lo qué, bro</h1>
          <p className="text-zinc-400 mt-2">Entra a tu cuenta y sigue el flow</p>
        </div>
        <LoginForm redirectTo={redirect ?? '/'} />
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
