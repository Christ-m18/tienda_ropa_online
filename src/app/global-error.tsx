'use client'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body className="min-h-screen flex items-center justify-center bg-zinc-950 text-white px-4">
        <div className="max-w-md text-center space-y-6">
          <h1 className="text-6xl font-display tracking-tight">Algo se rompió</h1>
          <p className="text-zinc-400">
            {error.message || 'Hubo un error inesperado. Intenta de nuevo o vuelve al inicio.'}
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={reset} className="px-5 h-11 rounded-md bg-rd-red hover:bg-rd-red-dark text-white font-bold">
              Reintentar
            </button>
            <a href="/" className="px-5 h-11 rounded-md bg-white text-zinc-900 font-bold inline-flex items-center">
              Ir al inicio
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
