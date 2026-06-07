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

  // Sin correo confirmado, lo tratamos como anonimo y cerramos cualquier sesion.
  let user = rawUser
  if (rawUser && !rawUser.email_confirmed_at) {
    await supabase.auth.signOut()
    user = null
  }

  const url = request.nextUrl
  const path = url.pathname
  const protectedPaths = ['/perfil', '/checkout', '/admin', '/completar-perfil']
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

  if (user && protectedPaths.some((p) => path.startsWith(p))) {
    // Try with is_blocked first; fall back to is_admin only if column doesn't exist yet
    let profile: { is_admin?: boolean; is_blocked?: boolean } | null = null
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin, is_blocked')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      // is_blocked column may not exist yet — query with is_admin only
      const { data: fallback } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle()
      profile = fallback
    } else {
      profile = data
    }

    // Admin path check
    if (adminPaths.some((p) => path.startsWith(p))) {
      if (!profile?.is_admin) {
        const redirect = url.clone()
        redirect.pathname = '/'
        return NextResponse.redirect(redirect)
      }
    }

    // Blocked user check (all protected paths including admin)
    if (profile?.is_blocked) {
      await supabase.auth.signOut()
      const redirect = url.clone()
      redirect.pathname = '/login'
      redirect.searchParams.set('reason', 'blocked')
      return NextResponse.redirect(redirect)
    }
  }

  return response
}
