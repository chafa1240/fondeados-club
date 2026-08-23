"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EstadoJournal = { error?: string; ok?: string };

/**
 * Guarda la nota de un día.
 *
 * Es un **upsert por (usuario, día)**: el journal es una nota por día, así
 * que volver a guardar corrige la que había en vez de agregar otra. El
 * índice único de la migración 013 es el que lo garantiza del lado de la
 * base, no solo del lado de la app.
 *
 * Una nota vacía **borra** la fila en vez de guardar un texto en blanco:
 * si no, el día quedaría "escrito" para siempre por haber abierto el modal
 * una vez, y el indicador de qué días escribiste dejaría de servir.
 */
export async function guardarNota(
  _prev: EstadoJournal,
  fd: FormData
): Promise<EstadoJournal> {
  const fecha = String(fd.get("fecha") ?? "").trim();
  const notas = String(fd.get("notas") ?? "").trim();

  if (!fecha) return { error: "Falta el día." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Se venció tu sesión. Volvé a entrar." };

  if (notas === "") {
    const { error } = await supabase
      .from("journal_dias")
      .delete()
      .eq("user_id", user.id)
      .eq("fecha", fecha);

    if (error) return { error: error.message };

    revalidatePath("/journal");
    revalidatePath("/");
    return { ok: "Nota borrada." };
  }

  const { error } = await supabase
    .from("journal_dias")
    .upsert(
      { user_id: user.id, fecha, notas },
      { onConflict: "user_id,fecha" }
    );

  if (error) {
    // La tabla todavía no existe: el error crudo de Postgres no le dice
    // nada a nadie, así que se traduce.
    if (error.message.includes("journal_dias")) {
      return {
        error:
          "Falta correr la migración 013 en Supabase (supabase/013_journal.sql).",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/journal");
  revalidatePath("/");
  return { ok: "Guardado." };
}
