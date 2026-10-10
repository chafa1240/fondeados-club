---
name: noticias-firms
description: Escribir y estructurar noticias de prop firms de futuros para la comunidad de Fondeados Club, desde un link, un texto o la carpeta noticias.
---

# Noticias de firms (Fondeados Club)

Se usa para redactar noticias sobre cambios en prop firms de futuros (reglas, precios, payouts, plataformas, cierres) que se publican en la comunidad. La publicación es siempre manual: esta habilidad se ocupa de la estructura y del texto, nunca publica nada sola.

## Entradas posibles

- **Un link** a una página pública (artículo del help center, post del blog, nota de prensa): leerlo con WebFetch, extraer el cambio, compararlo contra el `reglas.md` de la firma y redactar la noticia. La fecha y el tipo de fuente (oficial o terceros) salen del propio link. Si no se indica la firma, deducirla del dominio.
- **Un texto pegado** (por ejemplo de X o Discord, que no se pueden leer desde acá): usarlo tal cual, con el link del post si lo hay, y rotular la fuente como "X" o "Discord", sin presentarla como oficial salvo que sea la cuenta oficial de la firma.
- **Un relevamiento de la firma**: ver el método más abajo.

Si el link requiere login, da error o devuelve una página vacía (contenido cargado con JavaScript), decirlo y pedir el texto. No inventar el contenido.

## Estructura de cada noticia

1. **Etiqueta y firm**: `[ETIQUETA] Nombre de la firm`
2. **Titular**: una sola línea, concreta, con el cambio y no el tema.
3. **Párrafo único** de 3 a 5 líneas que diga: qué cambió, cómo era antes, desde cuándo y a quién aplica.
4. **Fuente y fecha**: `Fuente: <sitio o artículo> (oficial | nota de terceros) · dd/mm/aaaa`

No se incluyen: "a quién afecta" como campo aparte, "qué conviene hacer" ni nivel de confianza. La fuente oficial la pasa y verifica la persona que publica.

## Etiquetas

`REGLAS`, `PRECIO`, `PAYOUT`, `PLATAFORMA`, `PROMO`, `CIERRE`. Si un cambio encaja en dos, se elige la que más pesa para el trader y no se duplica la noticia.

## Tono e idioma

Español neutro latinoamericano: sin voseo ni modismos argentinos. Directo y informativo, sin adjetivos de marketing ni opinión. Fechas en el párrafo como "4 de septiembre de 2026"; en la línea de fuente como dd/mm/aaaa. Los términos del rubro (payout, drawdown, trailing, qualified, reset) se dejan en inglés.

## Reglas de fuentes y de contenido

- Fuente oficial primero (help center, blog, comunicados). Las notas de terceros solo sirven como aviso y siempre se rotulan "nota de terceros". Otra prop firm es parte interesada: se cita con cautela.
- No inventar el "antes". Si no hay dato del valor anterior, el párrafo lo dice ("No hay dato del valor anterior").
- Si la fecha de entrada en vigencia no figura, no afirmarla: usar "según el artículo, actualizado el ...".
- Si dos artículos oficiales se contradicen, la noticia lo marca y no elige uno.
- No guardar ni publicar promos, cupones ni banners como noticia.
- Nunca publicar sola. Todo sale como borrador para revisión manual.

## Registro en los archivos

Después de redactar una noticia, actualizar `noticias.md` (y `reglas.md` si cambió una regla) de la firma. Si la persona pide solo el texto, no tocar los archivos.

## Dónde vive cada cosa

Carpeta local `FONDEADOS CLUB\noticias\<firm>\` con tres archivos:
- `firm.md`: datos y links de la firma.
- `reglas.md`: foto de las reglas por plan. Es la línea base para saber qué cambió.
- `noticias.md`: novedades y otra información que no son reglas, de más nueva a más vieja, indicando el tipo de fuente de cada ítem.

Además `noticias\fuentes-oficiales.md` (help center, blog, X y Discord de cada firm) y `noticias\ESTADO.md` (estado del trabajo; leerlo primero al retomar).

Si faltan las carpetas de la firma, crearlas. Si hay varias carpetas conectadas, preguntar cuál es.

## Método al relevar una firma

1. Abrir help center, blog y home. Fuente oficial primero.
2. Leer artículos de reglas, payouts, precios, drawdown, conducta y países; anotar la fecha de "última actualización" de cada uno.
3. Buscar notas de terceros solo como radar.
4. Comparar contra `reglas.md` para detectar qué cambió y redactar la noticia con la estructura de arriba.
5. Actualizar `reglas.md` y `noticias.md` de la firma y marcar lo que no se pudo leer.
