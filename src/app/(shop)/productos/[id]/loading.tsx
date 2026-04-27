export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="aspect-[4/5] rounded-3xl bg-zinc-200/70 animate-pulse" />
        <div className="space-y-4 animate-pulse">
          <div className="h-5 w-24 bg-zinc-200/70 rounded" />
          <div className="h-12 w-3/4 bg-zinc-200/70 rounded" />
          <div className="h-5 w-48 bg-zinc-200/70 rounded" />
          <div className="h-14 w-40 bg-zinc-200/70 rounded mt-4" />
          <div className="h-24 bg-zinc-200/70 rounded mt-4" />
          <div className="h-14 bg-zinc-200/70 rounded mt-4" />
        </div>
      </div>
    </div>
  )
}
