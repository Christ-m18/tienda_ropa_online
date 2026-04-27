export default function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/5] rounded-2xl bg-zinc-200/70" />
          <div className="pt-3 space-y-2">
            <div className="h-3 w-1/3 bg-zinc-200/70 rounded" />
            <div className="h-4 w-3/4 bg-zinc-200/70 rounded" />
            <div className="h-5 w-1/2 bg-zinc-200/70 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
