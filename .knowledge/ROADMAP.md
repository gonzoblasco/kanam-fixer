# ROADMAP - kanam-fixer

**Version objetivo del primer ciclo:** `0.0.1` (cerrado 2026-09-15)
**Siguiente ciclo:** `0.0.2` - MCP companion server (abierto 2026-09-15, commit `f1f60fa`)
**Estado:** 0.0.1 cerrado. La apuesta se sostiene parcial (atributos: si; timing: no). 0.0.2 expone la asercion a agentes IA via MCP mientras S3 espera upstream.

## La apuesta, en una frase

Que una asercion sobre **lo que el lector de pantalla anuncia** se pueda escribir una vez y correr en dos planos: virtual en CI, lector real en local.

Si eso funciona, existe el producto. Si no, no hay roadmap que valga.

## Criterio de exito de 0.0.1 (criterio de salida)

Los cuatro, verificables:

1. Una asercion escrita por nosotros falla **cuando el anuncio se rompe** y pasa **cuando esta bien** (probado mutando el codigo, como hacemos con los tests de regresion en OSS).
2. La **misma** asercion corre con el driver virtual (CI) y con **VoiceOver real** (local), sin cambiar el codigo de la asercion.
3. Reproduce el **caso testigo** documentado: radix-ui #4109 - `aria-posinset` correcto en el DOM y tests unitarios en verde, pero el anuncio no ocurre. La herramienta lo detecta donde el test unitario no puede.
4. `npm test` verde desde un clone limpio, con pre-commit hooks activos.

## Slices de 0.0.1

### S1 - Esqueleto y decisiones (sin logica de a11y)

**Que:** repo, tooling y las decisiones de arquitectura escritas antes de escribir codigo.

- TypeScript + Node, Biome, Vitest, pre-commit hooks (lint -> test -> build).
- **ADR-0001 de kanam-fixer:** capa propia fina sobre Guidepup. Por que no se usa su API directa como contrato publico, y que pasa si Guidepup desaparece.
- **ADR-0002:** la matriz declarada (lector x version x SO). El anuncio no es universal - queda escrito desde el dia uno para no prometer de mas.
- README con el problema, no con la feature.

**Criterio de salida:** `npm test` corre en verde desde un clone limpio y los dos ADRs estan escritos.

### S2 - La asercion, solo virtual

**Que:** la API minima sobre `@guidepup/virtual-screen-reader`.

- `expectAnnouncement(target, phrase)`: lleva el navegador al estado previo al anuncio (Playwright) y asserta la frase.
- Un componente de juguete propio como sujeto de prueba (no dependemos de un repo ajeno para el test base).
- El test **debe fallar** al mutar el componente (sin ese fallo, el test no prueba nada).

**Criterio de salida:** el test pasa con el componente correcto y falla al romper el anuncio. Demostrado con la mutacion, no afirmado.

### S3 - VoiceOver real en local

**Que:** el mismo assert, con el lector de verdad.

- Driver real de VoiceOver sobre la maquina de Gonzo (macOS 27, VoiceOver presente).
- Documentar los permisos necesarios y el flake inherente (timing, foco, audio) con la disciplina que nos costo cara en kanam-pulse.
- Reporte de la frase **realmente** anunciada, para comparar contra la esperada.

**Criterio de salida:** la misma asercion de S2 pasa con VoiceOver real, y el reporte muestra la frase que salio por el audio.

### S4 - El caso testigo

**Que:** reproducir radix-ui #4109 en un entorno controlado.

- Un componente con `aria-posinset` correcto en el DOM y anuncio ausente por carrera de timing (el mismo patron del caso real).
- **El test unitario de atributos pasa; el assert de anuncio falla.** Esa es la evidencia de que la herramienta ve algo que el toolchain mainstream no ve.

**Criterio de salida:** el par de resultados (unitario verde / anuncio rojo) queda documentado como evidencia, con el componente minimo que lo reproduce.

### S5 - Cierre del ciclo

- README con la evidencia de S4 (la demostracion, no la promesa).
- Decidir 0.0.2 con datos: si la apuesta se sostuvo, el siguiente paso es uso real; si no, se para.
- `HANDOFF.md` + registro en el workspace.

**Criterio de salida:** el ciclo cierra con evidencia reproducible y una decision sobre 0.0.2.

## Fuera de alcance de 0.0.1 (y por que)

| Cosa | Por que no |
|---|---|
| Publicar en npm / GitHub | Accion publica: requiere OK. El ciclo prueba, no distribuye. |
| Comentario automatico en PRs | Es el camino de a11y-fixer, el que murio por saturado. |
| Soporte de NVDA | Necesita Windows. Se declara en la matriz (ADR-0002) y queda para despues. |
| Configuracion, umbrales, ignore rules | Features. Primero la apuesta. |
| IA para explicar fixes | Era de a11y-fixer. Aca el valor es la asercion, no la explicacion. |
| Integracion con kanam-forge | Idea buena, prematura: primero que la asercion funcione sola. |

## Riesgos, con su mitigacion

| Riesgo | Mitigacion |
|---|---|
| El driver real es flaky y arrastra al virtual | S2 (virtual puro) cierra antes de tocar VoiceOver. Si S2 no es estable, S3 no arranca. |
| Guidepup cambia de API o se estanca | Capa propia fina (ADR-0001): el contrato publico es nuestro, no su API. |
| La apuesta no se sostiene | Es el punto del ciclo 0.0.1: se descubre en S4, con poco invertido. |

## Nota de metodo

Los slices siguen la convencion del workspace: cada uno termina en un **criterio de salida verificable**, no en "quedo funcionando". El pipeline A/B se aplica con el complexity-scorer: S1 y S5 son de Kanam; S2-S4 se evaluan al arrancar cada uno.


## Migrado del HANDOFF (projects/kanam-fixer/HANDOFF.md)

Contenido propio del HANDOFF que vivia solo alla. El HANDOFF ahora es
el estado de la ultima sesion (ADR-122).

- **`0.0.2`:** no se abre todavia. El siguiente paso depende de S3, que depende de upstream.
- **npm:** `kanam-fixer` **no se publica** (`private: true`). El paquete viejo `@gonzoblasco/a11y-fixer@0.6.0` queda **publicado a proposito, sin deprecar**.
- **`a11y-fixer`**: repo archivado. **`a11y-playground`**: archivado (scaffold vacio).
- **`DISTRIBUTION.md`:** sigue congelado. Esperaba la evidencia de S4 para destrabarse; S4 dio un resultado negativo, asi que **no se destraba**.
- **Lo primero:** `npm install && npm test`. Deberia dar 17 passed, 4 skipped.
- **Si Guidepup ya soporta tu macOS:** los 4 skips se convierten en tests reales. Ese es el cierre de S3.
- **Si vas a tocar `realDriver`:** el contrato esta en `src/readers.ts`. La regla de ADR-0001 es que la API de Guidepup **nunca** se exporta al usuario.
- **No ejecutar `npx @guidepup/setup setup`**: escribe directo en la base de privacidad del sistema (`TCC.db` via `sqlite3`), con una lista de clientes ajena al proyecto (`sshd`, `bash`, `zsh`, `osascript`, Terminal, System Events, navegadores).
- **No desactivar SIP.** El maintainer de `setup` reporto (`guidepup/setup#66`) que el marcador solo se escribe con SIP apagado, y que como root falla igual.
- **No pushear `.knowledge/`** al repo publico: esta excluido via `.git/info/exclude`.
- **No correr `npx simple-git-hooks` antes de que exista `.git` en un proyecto nuevo**: git resuelve hacia arriba y pisa el hook del workspace.
