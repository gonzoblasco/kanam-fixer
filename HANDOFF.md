# HANDOFF - kanam-fixer

**Estado:** ciclo `0.0.1` cerrado (2026-09-15). Decidido no abrir `0.0.2` todavia.
**Repo:** https://github.com/gonzoblasco/kanam-fixer
**Ultimo commit:** ver `git log -1`. La terna (`test`, `lint`, `build`) esta en verde.

## Que es esto, en dos lineas

Una asercion sobre **lo que un lector de pantalla anuncia** (no sobre los atributos del DOM). La misma llamada corre en dos planos: un lector virtual en CI y un lector real en local, detras de un contrato propio.

## El resultado del ciclo (lo importante)

El ciclo no shippeo features: **probo la apuesta**. El veredicto es **parcial**, y esta medido:

| Clase de bug | Plano virtual | Evidencia |
|---|---|---|
| **Atributos y composicion** | **SI** | Quitar `aria-pressed` cambia `button, Email, pressed` por `button, Email`. Igual con `aria-label` faltante y con heading reemplazado por contenedor. |
| **Timing y viewport** | **NO** | Sondas discriminantes: atributos ausentes -> derivados igual; atributos erroneos -> repetidos tal cual; aplicado tarde vs nunca -> salida identica. |

**Hallazgo que hay que recordar:** el plano virtual **puede dar un falso verde** en bugs de timing. Es una red de regresion barata para atributos, no una prueba de que el usuario escuche bien.

**Corolario:** el plano real es el **nucleo del producto**; el virtual es la red, no el sustituto. Y el plano real resulto ser la parte fragil (ver abajo).

## Donde esta cada cosa

| Archivo | Que contiene |
|---|---|
| `src/index.ts` | Superficie publica. |
| `src/expect-announcement.ts` | `expectAnnouncement` y `readAnnouncements`. |
| `src/matrix.ts` | La matriz de lectores (ADR-0002). La version se lee del paquete instalado. |
| `src/readers.ts` | Contrato `ReaderDriver`, `virtualDriver`, `realDriver`, `realReaderAvailability()`. |
| `test/expect-announcement.test.ts` | S2: 7 tests, incluidos los de mutacion. |
| `test/witness-case.test.ts` | S4: 8 tests de **caracterizacion** del driver virtual. |
| `test/real-reader.test.ts` | S3: se saltea con causa visible si el plano real no corre. |
| `docs/adr/` | ADR-0001 (capa propia sobre Guidepup) y ADR-0002 (matriz de lectores). |
| `.knowledge/` | BRIEF, ROADMAP, STATUS, DISTRIBUTION. **No se pushea al repo publico.** |

## El blocker abierto (y su estado real)

**S3 no se puede cerrar en esta maquina.** Causa: **Guidepup 0.34.0 no tiene asset de VoiceOver para Darwin 27** (su `manifest.json` cubre 21-25; la rama `main` tampoco tiene 26 ni 27).

**No es un problema de permisos.** Verificado: `/private/var/db/Accessibility/.VoiceOverAppleScriptEnabled` existe con `a`, y VoiceOver arranca y se controla por AppleScript.

**Reportado upstream:** https://github.com/guidepup/guidepup/issues/149

**Se cierra asi:** cuando Guidepup publique el asset de Darwin 27, correr `npm test`. **No hay que cambiar codigo**: `realDriver` ya esta escrito y el test se saltea solo mientras falte.

## Trampa de debugging (no repetirla)

`screenReader.start()` tira `VoiceOver cannot be started` y esconde la causa en un `cause` anidado (`macOS version not supported`). **Leer solo el mensaje externo manda a buscar por el lado de permisos y se pierde tiempo.** `realReaderAvailability()` ya aplana la cadena; el skip del test lo muestra completo.

Regla general: **si un error no explica el fallo, buscar el `cause` antes de formular una hipotesis.**

## Decisiones tomadas (2026-09-15)

- **`0.0.2`:** no se abre todavia. El siguiente paso depende de S3, que depende de upstream.
- **npm:** `kanam-fixer` **no se publica** (`private: true`). El paquete viejo `@gonzoblasco/a11y-fixer@0.6.0` queda **publicado a proposito, sin deprecar**.
- **`a11y-fixer`**: repo archivado. **`a11y-playground`**: archivado (scaffold vacio).
- **`DISTRIBUTION.md`:** sigue congelado. Esperaba la evidencia de S4 para destrabarse; S4 dio un resultado negativo, asi que **no se destraba**.

## Si retomas esto

1. **Lo primero:** `npm install && npm test`. Deberia dar 17 passed, 4 skipped.
2. **Si Guidepup ya soporta tu macOS:** los 4 skips se convierten en tests reales. Ese es el cierre de S3.
3. **Antes de prometer cobertura de timing:** leer `test/witness-case.test.ts`. Ahi esta medido por que el plano virtual no lo ve.
4. **Si vas a tocar `realDriver`:** el contrato esta en `src/readers.ts`. La regla de ADR-0001 es que la API de Guidepup **nunca** se exporta al usuario.

## Lo que NO hacer

- **No ejecutar `npx @guidepup/setup setup`**: escribe directo en la base de privacidad del sistema (`TCC.db` via `sqlite3`), con una lista de clientes ajena al proyecto (`sshd`, `bash`, `zsh`, `osascript`, Terminal, System Events, navegadores).
- **No desactivar SIP.** El maintainer de `setup` reporto (`guidepup/setup#66`) que el marcador solo se escribe con SIP apagado, y que como root falla igual.
- **No pushear `.knowledge/`** al repo publico: esta excluido via `.git/info/exclude`.
- **No correr `npx simple-git-hooks` antes de que exista `.git` en un proyecto nuevo**: git resuelve hacia arriba y pisa el hook del workspace.
