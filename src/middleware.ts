import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Expresión regular para verificar si una cadena parece un UUID
const uuidRegex =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => request.cookies.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove: (name: string, options: CookieOptions) => {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Si no está autenticado Y NO está intentando acceder a /login,
  // redirigir a /login.
  if (!user && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  //
  if (user) {
    const role = user.app_metadata.role;
    const clientId = user.app_metadata.client_id;

    // Si un usuario logueado va a /login, redirigirlo a su dashboard
    if (pathname === "/login") {
      let redirectTo = "/";
      if (role === "super_admin") redirectTo = "/2a/dashboard";
      else if (role === "client_admin")
        redirectTo = `/${clientId}/admin/dashboard`;
      else if (role === "client_viewer")
        redirectTo = `/${clientId}/viewer/dashboard`;
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }

    // 1. El super_admin tiene acceso a todo. No aplicamos ninguna restricción de ruta aquí.
    if (role === "super_admin") {
      return response; // Le permitimos continuar a cualquier ruta
    }

    // 2. Para los usuarios de cliente, solo protegemos las rutas que SON de otros clientes.
    if (role === "client_admin" || role === "client_viewer") {
      const pathSegments = pathname.split("/").filter(Boolean);

      // Si el primer segmento de la URL parece un ID de cliente (es un UUID)...
      if (pathSegments.length > 0 && uuidRegex.test(pathSegments[0])) {
        // ...entonces DEBE ser el ID de su propio cliente.
        if (pathSegments[0] !== clientId) {
          // Si no lo es, lo redirigimos porque está intentando acceder al espacio de otro cliente.
          return NextResponse.redirect(new URL("/unauthorized", request.url));
        }
      }
      // Si la ruta NO empieza con un UUID (ej. '/devices/...'), no hacemos nada.
      // Dejamos que la página y sus políticas RLS se encarguen de la seguridad a nivel de datos.
    }
  }

  return response;
}

// Este `matcher` es más robusto. Excluye solo los archivos estáticos y de API,
// asegurando que el middleware se ejecute en TODAS las páginas de tu aplicación.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
