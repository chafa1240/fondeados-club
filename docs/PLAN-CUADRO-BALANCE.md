# Plan — Cuadro de balance en el Home

Pedido: un cuadro en el Home con **el balance de las cuentas, con cuánto
arrancaron y cómo van ahora**, todo junto en un mismo cuadro. Va como una
sección nueva, aparte de lo que ya hay (prueba: si no convence, se saca
borrando un componente y una línea).

## Qué muestra

Un solo cuadro, "Balance de tus cuentas", con tres números en fila:

| Inicio | Balance | Cómo van |
|---|---|---|
| balance con el que arrancó el período | suma de `balance_actual` | Balance − Inicio, en $ y en % |

- **Inicio y Balance van del mismo tamaño.** El Inicio queda en gris, el
  Balance en blanco. Al lado de "Inicio" se ve la fecha desde la que mide.
- "Cómo van" en verde si es positivo, rojo si es negativo.

Debajo, dentro del mismo cuadro, una línea por cuenta: inicio → balance →
+/−. También ahí el inicio va del mismo tamaño que el balance, en gris.

## Desde cuándo se mide el Inicio (filtro)

- **Semana** (default): balance al arrancar el lunes de esta semana.
- **Mes**: balance al arrancar el día 1 del mes.
- **Lun / Mar / Mié / Jue / Vie**: balance al arrancar ese día de esta
  semana. Los días que todavía no llegaron quedan deshabilitados.
- Sábado y domingo cuentan como parte de la semana que termina.

"Balance al arrancar el día X" = el cierre del último día cargado antes de
X. Si la cuenta empezó después de X, se toma su balance de arranque.

## Qué cuentas entran

- **Solo las cuentas en juego** (activa / en curso).
- **Fondeadas o evaluaciones, nunca juntas** (misma regla que los números de
  trading del Home). Selector propio Fondeadas / Evaluaciones, arranca en
  Fondeadas.

## De dónde salen los números

Nada nuevo en la base. `page.tsx` del Home ya calcula cada cuenta con
`estadoDeCuenta()`; ahora además guarda su curva (`serie`: fecha + balance
al cierre de cada día) y se la pasa a `HomeVista` → `CuadroBalance`. Con esa
curva se busca el balance al inicio del período elegido.

Ojo: un **retiro** dentro del período baja el balance, así que aparece como
si fuera pérdida en "Cómo van". Si molesta, se puede excluir.

## Dónde va

En `home-vista.tsx`, después de la fila de números (Hoy / Este mes /
Acumulado / Racha) y antes del calendario.

## Archivos

- `src/components/home/cuadro-balance.tsx` — el componente entero.
- `src/components/home/home-vista.tsx` — lo importa, lo renderiza y recibe `series`.
- `src/app/(app)/page.tsx` — arma `series` y se la pasa a `HomeVista`.

Para sacarlo: borrar el componente, la línea en `home-vista.tsx` y el prop
`series` en los dos archivos.

## Verificación

`npx tsc --noEmit` sin errores, y revisarlo en el localhost.
