import ProductGridSkeleton from '@/components/products/ProductGridSkeleton'

export default function Loading() {
  return (
    <div>
      <div className="h-[400px] md:h-[600px] bg-rd-charcoal animate-pulse" />
      <div className="container mx-auto px-4 py-16">
        <div className="h-8 w-64 bg-zinc-200/70 rounded animate-pulse mb-8" />
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  )
}
