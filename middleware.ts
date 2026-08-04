import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rlrxixsceubedsrnwfkg.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJscnhpeHNjZXViZWRzcm53ZmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxOTE5NzIsImV4cCI6MjEwMDc2Nzk3Mn0.vozdkpcvWK3M3rmfCZLDiGNwrJP1t9BASEcecmJZJIc'

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
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

  // 1. Verificamos la ruta actual
  const path = request.nextUrl.pathname
  const isLoginRoute = path.startsWith('/login')

  // 2. Optimizacion: Si es una ruta estática o archivo directo, dejamos pasar sin golpear a Supabase
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.includes('.') // archivos como favicon.ico, imagenes, etc.
  ) {
    return supabaseResponse
  }

  // 3. Obtenemos el usuario de manera segura
  const { data: { user } } = await supabase.auth.getUser()

  // 4. Si NO está logueado y NO está en el login, redirigir al login
  if (!user && !isLoginRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 5. Si SÍ está logueado y está intentando entrar al login, mandarlo al inicio
  if (user && isLoginRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Excluir explícitamente recursos estáticos del sistema para evitar ejecuciones innecesarias del middleware
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)',
  ],
}