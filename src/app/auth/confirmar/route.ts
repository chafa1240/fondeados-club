import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Ruta a la que llega el usuario desde el link del email
// (confirmación de cuenta o recuperación de contraseña).
// Soporta las dos formas en que Supabase puede mandar el link:
//   - ?code=...        (flujo PKCE, el que usa el template por defecto)
//   - ?token_hash=...  (si se personaliza el template del email)
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const next = searchParams.get("next") ?? "/";
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=link_invalido`);
}
