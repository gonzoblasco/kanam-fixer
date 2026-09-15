# ADR-0002: Matriz de Lectores Declarada

**Status:** Aceptado
**Fecha:** 2026-09-15
**Contexto:** kanam-fixer 0.0.1 (BRIEF, 2026-09-14)

## Context

La apuesta de kanam-fixer es assertar lo que el lector de pantalla anuncia, con la misma asercion en dos planos: virtual en CI y lector real en local.

Pero lo que un lector de pantalla anuncia **no es universal**: la frase varia por lector, por version del lector y por sistema operativo. Un anuncio correcto en VoiceOver/macOS puede no coincidir con lo que dice NVDA/Windows, y una version nueva de un lector puede cambiar el texto que produce. Es la misma restriccion que ya manejamos a mano en los PRs de accesibilidad, donde la frase esperada se declara por lector.

El BRIEF lo registra textualmente: "La frase anunciada varia por lector, version y SO. No se puede prometer 'el anuncio' universal: hay que declarar la matriz (lector x version x SO) igual que hacemos en los PRs."

Sin una decision escrita, la tentacion es prometer una asercion generica contra "el anuncio", que en la practica no existe como entidad unica. Este ADR la cierra desde el dia uno.

## Decision

Cada asercion de kanam-fixer declara explicitamente la matriz sobre la que se compromete: **lector x version x SO**. Esa matriz es parte del contrato publico de la asercion, no un detalle de implementacion.

La forma concreta: una asercion sin matriz declarada no es valida. Quien escribe el test dice contra que lector (o lectores) corre, en que version(es) y en que SO, y el resultado se reporta en esos terminos.

El anuncio de un lector se trata como una caracteristica de esa combinacion (lector, version, SO), no como propiedad del componente bajo test.

## Por que la matriz se declara desde el dia uno

- **El anuncio no es universal.** Es un hecho del dominio, documentado en el BRIEF y en nuestra practica: la frase la produce el lector, no el componente. Prometer "el anuncio" generico es prometer algo que no existe.
- **El plano virtual no elimina la variacion.** El driver virtual produce anuncios con su propia semantica; aun cuando se alinee con un lector real, el alineamiento es por combinacion, no global.
- **La matriz es honestidad de alcance.** Declarar (lector x version x SO) desde el primer test evita el ciclo clasico: una asercion que pasa en CI virtual, se promueve como "correcta en general" y falla en local con el lector real. Con la matriz, la promesa es exacta y verificable.
- **Es la practica que ya tenemos.** En los PRs de accesibilidad la frase esperada se declara por lector, con su version y SO. Este ADR convierte esa practica en regla del producto, no en excepcion.
- **Se escribe antes de la logica de a11y.** El ADR-0002 se decide en S1, antes de que exista la primera asercion (S2), para que ninguna promesa generica quede escrita en README o en codigo sin la matriz.

## Matriz declarada para 0.0.1

| Plano | Lector | Version | SO | Estado |
|---|---|---|---|---|
| CI (virtual) | `@guidepup/virtual-screen-reader` | la que fije el lockfile | cualquier SO donde corra Node | Activo, cubre S2 |
| Local (real) | VoiceOver | la instalada en la maquina de desarrollo | macOS | Previsto en S3 |
| Local (real) | NVDA | - | Windows | Fuera de alcance de 0.0.1 (declarado en el BRIEF) |

La columna "Estado" es dinamica: se actualiza por slice del roadmap, no por este ADR. Lo que este ADR fija es que **cualquier** fila nueva entra con su (lector x version x SO) completo, o no entra.

## Consecuencias

- El README y la documentacion de la API nombran la matriz desde S1, antes de la primera asercion.
- Una asercion sin matriz declarada (lector, version, SO) no pasa la revision del proyecto.
- Los reportes de anuncios (S3: "la frase realmente anunciada") se comparan siempre contra la fila de matriz correspondiente.
- Cuando se agregue un lector o SO nuevo, se agrega una fila a la matriz con su alcance y su estado; no se reescribe la promesa de universalidad (que nunca existio).
