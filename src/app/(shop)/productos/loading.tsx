import ProductGridSkeleton from '@/components/products/ProductGridSkeleton'

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="h-10 w-64 bg-zinc-200/70 rounded animate-pulse mb-2" />
      <div className="h-4 w-32 bg-zinc-200/70 rounded animate-pulse mb-8" />
      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 bg-zinc-200/70 rounded" />
              <div className="h-9 bg-zinc-200/70 rounded" />
              <div className="h-9 bg-zinc-200/70 rounded" />
            </div>
          ))}
        </div>
        <ProductGridSkeleton count={12} />
      </div>
    </div>
  )
}
