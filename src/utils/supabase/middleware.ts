import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user: rawUser } } = await supabase.auth.getUser()

  // Sin correo confirmado, lo tratamos como anónimo y cerramos cualquier sesión.
  let user = rawUser
  if (rawUser && !rawUser.email_confirmed_at) {
    await supabase.auth.signOut()
    user = null
  }

  const url = request.nextUrl
  const path = url.pathname
  const protectedPaths = ['/perfil', '/checkout', '/admin']
  const adminPaths = ['/admin']
  const authPaths = ['/login', '/registro', '/recuperar']

  if (!user && protectedPaths.some((p) => path.startsWith(p))) {
    const redirect = url.clone()
    redirect.pathname = '/login'
    redirect.searchParams.set('redirect', path)
    if (rawUser && !rawUser.email_confirmed_at) {
      redirect.searchParams.set('reason', 'unconfirmed')
    }
    return NextResponse.redirect(redirect)
  }

  if (user && authPaths.some((p) => path === p)) {
    const redirect = url.clone()
    redirect.pathname = '/'
    return NextResponse.redirect(redirect)
  }

  if (user && adminPaths.some((p) => path.startsWith(p))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle()
    if (!profile?.is_admin) {
      const redirect = url.clone()
      redirect.pathname = '/'
      return NextResponse.redirect(redirect)
    }
  }

  return response
}
