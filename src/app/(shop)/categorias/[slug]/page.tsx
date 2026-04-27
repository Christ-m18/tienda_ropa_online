import { redirect } from 'next/navigation'

type RouteParams = Promise<{ slug: string }>

export default async function CategoryRedirect({ params }: { params: RouteParams }) {
  const { slug } = await params
  redirect(`/productos?category=${encodeURIComponent(slug)}`)
}
