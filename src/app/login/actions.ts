"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type EstadoAuth = { error?: string; ok?: string };

export async function login(
  _prev: EstadoAuth,
  formData: FormData
): Promise<EstadoAuth> {
  const supabase = createClient();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Completá email y contraseña." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.includes("Email not confirmed")) {
      return {
        error:
          "Todavía no confirmaste tu email. Revisá tu casilla (y la carpeta de spam).",
      };
    }
    if (error.message.includes("Invalid login credentials")) {
      return { error: "Email o contraseña incorrectos." };
    }
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function registro(
  _prev: EstadoAuth,
  formData: FormData
): Promise<EstadoAuth> {
  const supabase = createClient();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");

  if (!email || !password) {
    return { error: "Completá email y contraseña." };
  }
  if (password.length < 8) {
    return { error: "La contraseña tiene que tener al menos 8 caracteres." };
  }
  if (password !== password2) {
    return { error: "Las contraseñas no coinciden." };
  }

  const origin = headers().get("origin");

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/confirmar` },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "Ya existe una cuenta con ese email. Probá iniciando sesión." };
    }
    return { error: error.message };
  }

  return {
    ok: "Listo. Te mandamos un email para confirmar tu cuenta — revisá tu casilla (y la carpeta de spam).",
  };
}

export async function recuperarPassword(
  _prev: EstadoAuth,
  formData: FormData
): Promise<EstadoAuth> {
  const supabase = createClient();

  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Escribí tu email." };

  const origin = headers().get("origin");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirmar?next=/nueva-password`,
  });

  if (error) return { error: error.message };

  return {
    ok: "Si ese email tiene una cuenta, te mandamos un link para cambiar la contraseña.",
  };
}

export async function cambiarPassword(
  _prev: EstadoAuth,
  formData: FormData
): Promise<EstadoAuth> {
  const supabase = createClient();

  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");

  if (password.length < 8) {
    return { error: "La contraseña tiene que tener al menos 8 caracteres." };
  }
  if (password !== password2) {
    return { error: "Las contraseñas no coinciden." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/");
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
