import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getClaims() must be called to refresh the session
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims

  const pathname = request.nextUrl.pathname

  // Public API routes that don't require authentication
  const publicApiRoutes = [
    '/api/auth/login',
    '/api/auth/signup',
    '/api/route', // Health check endpoint
  ]

  // Check if this is a public API route
  const isPublicApiRoute = publicApiRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))

  // Handle API route authentication
  if (pathname.startsWith('/api/')) {
    // Allow public API routes
    if (isPublicApiRoute) {
      return supabaseResponse
    }

    // All other API routes require authentication
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    // Verify email confirmation for protected API routes
    try {
      const serverSupabase = await createClient()
      const { data: { user: authUser }, error: authError } = await serverSupabase.auth.getUser()

      if (authError || !authUser) {
        return NextResponse.json(
          { error: 'Unauthorized - Please log in' },
          { status: 401 }
        )
      }

      // Enforce email verification for protected routes
      if (!authUser.email_confirmed_at) {
        return NextResponse.json(
          { error: 'Email verification required. Please verify your email address.' },
          { status: 403 }
        )
      }

      // Verify user has a profile
      const { data: profile, error: profileError } = await serverSupabase
        .from('profiles')
        .select('id, role')
        .eq('id', authUser.id)
        .single()

      if (profileError || !profile) {
        return NextResponse.json(
          { error: 'User profile not found' },
          { status: 404 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      )
    }

    // User is authenticated and verified, allow request to proceed
    return supabaseResponse
  }

  // Dashboard routes and their allowed roles
  const dashboardRoutes: Record<string, string[]> = {
    '/dashboard/pm': ['projectManager'],
    '/dashboard/processor': ['processor', 'projectManager'],
    '/dashboard/qc': ['qcTeam', 'projectManager'],
    '/dashboard/qa': ['qaTeam', 'projectManager'],
  }

  // Check if accessing a dashboard route
  const isDashboardRoute = Object.keys(dashboardRoutes).some(route => pathname.startsWith(route))

  // Handle dashboard route access control
  if (isDashboardRoute && user) {
    try {
      const serverSupabase = await createClient()
      const { data: { user: authUser }, error: authError } = await serverSupabase.auth.getUser()

      if (authError || !authUser) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        return NextResponse.redirect(url)
      }

      // Enforce email verification
      if (!authUser.email_confirmed_at) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/verify-email'
        return NextResponse.redirect(url)
      }

      // Get user role from profile
      const { data: profile, error: profileError } = await serverSupabase
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .single()

      if (profileError || !profile) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        return NextResponse.redirect(url)
      }

      const userRole = profile.role

      // Check if user has access to this dashboard route
      const allowedRoles = Object.entries(dashboardRoutes).find(([route]) => 
        pathname.startsWith(route)
      )?.[1] || []

      // If user doesn't have access, redirect to their appropriate dashboard
      if (!allowedRoles.includes(userRole)) {
        const url = request.nextUrl.clone()
        
        // Redirect to role-appropriate dashboard
        switch (userRole) {
          case 'projectManager':
            url.pathname = '/dashboard/pm'
            break
          case 'processor':
            url.pathname = '/dashboard/processor'
            break
          case 'qcTeam':
            url.pathname = '/dashboard/qc'
            break
          case 'qaTeam':
            url.pathname = '/dashboard/qa'
            break
          default:
            url.pathname = '/auth/login'
        }
        
        return NextResponse.redirect(url)
      }
    } catch (error) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }
  }

  // Public routes that don't require authentication
  const authRoutes = ['/auth/login', '/auth/signup', '/auth/verify-email']
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // If user is authenticated and accessing root, redirect to dashboard
  if (user && pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Allow access to auth routes for non-authenticated users
  if (!user && isAuthRoute) {
    return supabaseResponse
  }

  // Redirect to login if not authenticated and trying to access protected routes
  if (!user && pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    // Preserve the original URL for redirect after login
    url.searchParams.set('redirect', pathname)
    // Add session timeout flag to show toast message
    url.searchParams.set('session_timeout', 'true')
    return NextResponse.redirect(url)
  }

  // Handle root path for non-authenticated users
  if (!user && pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
