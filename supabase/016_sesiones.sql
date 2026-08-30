-- Fondeados Club — migración 016 (2026-08-30)
--
-- En qué sesión operaste: Asia, Londres o Nueva York.
--
-- Es de la **entrada**, no del día, igual que `sentido`: desde la 012 un
-- día puede tener varias entradas y cada una puede caer en otra plaza.
--
-- **Es un array y no un texto**, porque una operación puede cruzar de una
-- sesión a la siguiente: entrás en Londres y cerrás cuando ya abrió Nueva
-- York. Guardar una sola sesión obligaría a elegir dónde "estuvo" un
-- trade que estuvo en las dos, y a mentir en la mitad de los casos.
--
-- **El orden del array es el orden en que se marcaron**, y eso importa:
-- con las tres marcadas, la plata cuenta para la última que tocaste (ver
-- `sesionQueCuenta()` en `src/lib/resultados.ts`). Por eso es un array y
-- no un set — Postgres conserva el orden, un set no.
--
-- **Nullable / vacío a propósito.** Todo lo cargado hasta hoy no lo tiene
-- y no se le inventa una: las estadísticas cuentan solo las marcadas y
-- dicen cuántas quedaron afuera.
--
-- **No se guarda a qué sesión cuenta la plata**: se calcula recorriendo
-- el array, igual que el pico del drawdown. Una columna derivada queda
-- envenenada el día que se corrige la entrada y nadie se entera.
--
-- Correr en Supabase → SQL Editor. Se puede correr más de una vez.

alter table public.resultados_diarios
  add column if not exists sesiones text[];

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'resultados_diarios_sesiones_check'
  ) then
    alter table public.resultados_diarios
      add constraint resultados_diarios_sesiones_check
      check (
        sesiones is null
        or (
          -- Hasta las tres, sin repetidas y sin valores raros. El array
          -- vacío se acepta: es lo que llega de un formulario donde no se
          -- marcó nada, y tratarlo como error rompería el alta por un
          -- campo opcional.
          array_length(sesiones, 1) is null
          or (
            array_ndims(sesiones) = 1
            and array_length(sesiones, 1) <= 3
            and sesiones <@ array['asia', 'londres', 'ny']::text[]
            -- "Sin repetidas", comparando de a pares.
            --
            -- Lo natural sería `count(distinct ...)` sobre un `unnest`,
            -- pero **Postgres no acepta subqueries en un check**: la
            -- condición tiene que poder evaluarse mirando solo la fila.
            -- Con un tope de tres elementos alcanza con tres
            -- comparaciones.
            --
            -- Cada par se compara **solo si la segunda posición existe**.
            -- Sin ese guardián, un array de una sola sesión comparaba dos
            -- posiciones vacías, y en Postgres NULL contra NULL no es "no
            -- son iguales": no se sabe. La comparación no daba verdadero
            -- y el check rechazaba el caso más común de todos.
            and (sesiones[2] is null or sesiones[1] <> sesiones[2])
            and (
              sesiones[3] is null
              or (sesiones[1] <> sesiones[3] and sesiones[2] <> sesiones[3])
            )
          )
        )
      );
  end if;
end $$;

comment on column public.resultados_diarios.sesiones is
  'Sesiones de la operación, en el orden en que se marcaron: asia | londres | ny. Null o vacío = sin marcar.';

-- Sin índice propio: las estadísticas filtran en memoria sobre lo que ya
-- se trae por usuario, que son decenas de filas y no millones.

notify pgrst, 'reload schema';
