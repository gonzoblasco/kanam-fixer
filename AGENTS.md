# AGENTS.md - kanam-fixer

Reglas operativas específicas de este proyecto. Complementan, no reemplazan, las reglas globales del workspace (que viven en `../AGENTS.md` y se aplican por el `CLAUDE.md` de la raíz): guion común siempre (nunca em dash U+2014/en dash U+2013), commits atómicos en inglés, verificación obligatoria antes de commitear.

## Qué es este proyecto (1 línea)

**De los atributos a lo que se escucha:** assertar el **anuncio** del lector de pantalla. Misma aserción, dos planos: driver virtual en CI, lector (VoiceOver) real en local.

## La idea que NO hay que romper

- **Testeamos lo que el lector de pantalla DICE, no lo que el DOM tiene.** Un atributo ARIA correcto en el DOM NO es prueba de que se anuncie bien (ver `witness-case`). No "corregir" una aserción para que use el DOM en vez del anuncio.
- **El plano virtual es un subconjunto honesto, no la verdad completa.** Medido en S4: el driver virtual **deriva** la posición, **repite** atributos erróneos y **no** tiene momento de anuncio (timing). No produce un anuncio contra el cual correr una carrera. Por eso el caso testigo #4109 (timing + viewport) solo se reproduce en lector real, y el virtual puede dar **falso verde** en esa clase de bug.
- **Documentar la limitación SIEMPRE.** Cada vez que se toque el README o un ADR, conservar la tabla de qué clases de bug captura el plano virtual y cuáles no. Vender de más es lo que mató al `a11y-fixer` (0 usuarios).

## Stack y comandos (verificado)

- **TypeScript + Node** (`type: module`), **Biome 2** (lint+format), **Vitest 5**, **Playwright**, **jsdom**.
- Los tests del plano real usan **Guidepup/Playwright + `@guidepup/guidepup`**; el virtual usa `@guidepup/virtual-screen-reader`.
- **Pre-commit hooks** (`simple-git-hooks`, `prepare`): lint -> test -> build. No esquivarlos; si un hook bloquea, se arregla la causa.
- Comandos: `npm test` (vitest run), `npm run lint`, `npm run format`, `npm run build` (tsc).

## Reglas del dominio (a11y)

- La skill del workspace `a11y-at-validation` es la referencia: lo que un test unitario puede verificar (atributos ARIA, roles, estructura) vs. lo que SOLO se verifica a mano (la frase, el timing, interacción real con roving focus / `aria-activedescendant`). Si un cambio toca el anuncio del lector, no basta un test verde.
- **Nunca prometer de más en la matriz de compatibilidad.** El anuncio no es universal (lector x versión x SO). Si no está verificado, se escribe "no verificado", no "soportado".

## Estado actual y decisiones vivas

- **Ciclo 0.0.1 CERRADO.** S1-S2 y S4-S5 completados; **S3 bloqueado por upstream** (`guidepup/guidepup` no publica un asset para Darwin 27; reportado en guidepup/guidepup#149).
- **Decisión: no abrir 0.0.2 todavía.** El siguiente paso depende de S3, que depende de que Guidepup publique ese asset. Abrir 0.0.2 hoy sería invertir sobre la parte más frágil sin resolverla. No relanzar 0.0.2 sobre esto sin revisar si el asset ya existe.
- ADR-0001 (capa propia sobre Guidepup) y ADR-0002 (matriz de lectores) son la decisión fundacional; no se contradicen sin ADR nuevo.
- Repo público, paquete `private: true`, **no publicado en npm**. No dar ejemplos de `import from 'kanam-fixer'` como si fuera instalable.

## Lo que NO se hace

- No se reescribe el caso testigo #4109 como "demostración de que el plano virtual lo cubre" - es el **hueco del ecosistema**, la evidencia del problema que el producto ataca, no una feature del driver.
- No se agregan features a `0.0.1` (está cerrado); la próxima unidad es `0.0.2` cuando el blocker se destrabe.
