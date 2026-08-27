import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieAGuardar = { name: string; value: string; options: CookieOptions };

// Rutas públicas: se pueden ver sin estar logueado.
const RUTAS_PUBLICAS = ["/login", "/registro", "/recuperar", "/nueva-password", "/auth"];

/**
 * Un redirect con las cookies que Supabase acaba de refrescar.
 *
 * `NextResponse.redirect()` crea un response **nuevo y vacío**: las cookies
 * que `getUser()` dejó en `supabaseResponse` (el token recién refrescado) no
 * viajan solas. Si no se copian, el navegador se queda con el token viejo,
 * que Supabase ya invalidó al refrescarlo; la request siguiente llega sin
 * sesión válida, el middleware manda al login, ahí ve la cookie y manda a la
 * app, y vuelta a empezar: un loop /login -> / -> /login que en pantalla se
 * ve como una página cargando para siempre, no como un error.
 */
function redirigirCon(url: URL, conCookies: NextResponse) {
  const respuesta = NextResponse.redirect(url);
  for (const cookie of conCookies.cookies.getAll()) {
    respuesta.cookies.set(cookie);
  }
  return respuesta;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieAGuardar[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: no meter código entre createServerClient y getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const esPublica = RUTAS_PUBLICAS.some((r) => path.startsWith(r));

  // Sin sesión y en una ruta privada -> al login.
  if (!user && !esPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return redirigirCon(url, supabaseResponse);
  }

  // Con sesión y entrando al login/registro -> a la app.
  if (user && (path === "/login" || path === "/registro")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return redirigirCon(url, supabaseResponse);
  }

  return supabaseResponse;
}
