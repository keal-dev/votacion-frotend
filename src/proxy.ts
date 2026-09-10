import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Leer el token de la cookie
  const token = request.cookies.get('token')?.value;

  // Saber si el usuario está intentando entrar a rutas públicas
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');
  const isMaintenancePage = request.nextUrl.pathname.startsWith('/mantenimiento');

  // Si NO tiene token y NO está en una página pública -> Redirigir a login
  if (!token && !isLoginPage && !isMaintenancePage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si SÍ tiene token y está intentando acceder a /login -> Redirigir al dashboard
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Si todo está correcto, continuar con la petición normal
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplica el middleware a todas las rutas excepto:
     * - api (rutas de API internas de Next.js si las hay)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico (icono)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
