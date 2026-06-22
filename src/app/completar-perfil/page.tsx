import Link from 'next/link'
import type { Metadata } from 'next'
import CompleteProfileForm from './complete-profile-form'

export const metadata: Metadata = { title: 'Completar perfil — CoraMely' }

type SearchParams = Promise<{ next?: string }>

export default async function CompletarPerfilPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { next } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black px-4 py-12">
      <div className="w-full max-w-md bg-zinc-950/80 border border-red-600/30 rounded-3xl shadow-[0_0_60px_rgba(214,40,40,0.15)] backdrop-blur-xl p-8 md:p-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-3xl font-display tracking-wider text-white">
            Cora<span className="text-rd-red">Mely</span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-display mt-6 text-white">Un paso más</h1>
          <p className="text-zinc-400 mt-2">Necesitamos tu nombre para completar el perfil</p>
        </div>
        <CompleteProfileForm next={next ?? '/'} />
      </div>
    </div>
  )
}
