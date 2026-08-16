-- Fondeados Club — exponer las tablas en la API
--
-- Por qué hace falta: el proyecto tiene desactivado "Automatically expose
-- new tables", así que las tablas nacen sin permisos para los roles de la
-- API y cualquier consulta devuelve "permission denied for table X".
--
-- Esto NO debilita la seguridad: el permiso es "podés hablarle a la tabla",
-- y quién ve qué filas lo sigue decidiendo RLS (auth.uid() = user_id).
-- Al rol `anon` (visitantes sin sesión) no se le da nada.
--
-- Correr en Supabase → SQL Editor.

grant usage on schema public to authenticated;

grant select, insert, update, delete
  on public.cuentas_fondeo,
     public.gastos,
     public.payouts
  to authenticated;

-- Las 3 tablas usan id uuid por default, no secuencias, así que no hace
-- falta dar permisos sobre sequences.

-- Avisarle a la API que recargue su cache de schema.
notify pgrst, 'reload schema';
