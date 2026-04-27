import Link from 'next/link'

export default function InfoPage({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <nav className="text-xs text-zinc-500 mb-4 flex gap-2">
        <Link href="/" className="hover:text-rd-red">Inicio</Link>
        <span>/</span>
        <span className="text-zinc-700">{title}</span>
      </nav>
      <h1 className="font-display text-4xl md:text-5xl tracking-tight">{title}</h1>
      {subtitle && <p className="text-zinc-500 mt-2">{subtitle}</p>}
      <article className="prose prose-zinc max-w-none mt-8 [&_h2]:font-display [&_h2]:tracking-wider [&_h2]:text-2xl [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:font-bold [&_h3]:mt-5 [&_h3]:mb-2 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-1 [&_a]:text-rd-red [&_a:hover]:underline">
        {children}
      </article>
    </div>
  )
}
