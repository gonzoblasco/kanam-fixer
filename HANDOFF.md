# HANDOFF - kanam-fixer

**Fecha:** 2026-11-25 12:23 GMT-3
**Proyecto:** kanam-fixer
**Branch:** main
**Repo:** https://github.com/gonzoblasco/kanam-fixer
**Autor:** Kanam (CORE)

> HANDOFF generado en el cierre de sesion (2026-11-25). Es el punto de entrada para continuar este proyecto. El informe detallado de la sesion vive en `memory/2026-11-25.md`.

---

## Que se hizo en esta sesion

Una asercion sobre **lo que un lector de pantalla anuncia** (no sobre los atributos del DOM). La misma llamada corre en dos planos: un lector virtual en CI y un lector real en local, detras de un contrato propio.

## Estado actual

El ciclo no shippeo features: **probo la apuesta**. El veredicto es **parcial**, y esta medido: **Hallazgo que hay que recordar:** el plano virtual **puede dar un falso verde** en bugs de timing. Es una red de regresion barata para atributos, no una prueba de que el usuario escuche bien. **Corolario:** el plano real es el **nucleo del producto**; el virtual es la red, no el sustituto. Y el plano real resulto ser la parte fragil (ver abajo). **S3 no se puede cerrar en esta maquina.** Causa: **Guidepup 0.34.0 no tiene asset de VoiceOver para Darwin 27** (su `manifest.json` cubre 21-25; la rama `main` tampoco tiene 26 ni 27). **No es un problema de permisos.** Verificado: `/private/var/db/Accessibility/.VoiceOverAppleScriptEnabled` existe con `a`, y VoiceOver arranca y se controla por AppleScript. **Reportado upstream:** https://github.com/guidepup/guidepup/issues/149 **Se cierra asi:** cuando Guidepup publique el asset de Darwin 27, correr `npm test`. **No hay que cambiar codigo**: `realDriver` ya esta escrito y el test se saltea solo mientras falte.

## Proximos pasos

1. **Lo primero:** `npm install && npm test`. Deberia dar 17 passed, 4 skipped.
2. **Si Guidepup ya soporta tu macOS:** los 4 skips se convierten en tests reales. Ese es el cierre de S3.
3. **Antes de prometer cobertura de timing:** leer `test/witness-case.test.ts`. Ahi esta medido por que el plano virtual no lo ve.
4. **Si vas a tocar `realDriver`:** el contrato esta en `src/readers.ts`. La regla de ADR-0001 es que la API de Guidepup **nunca** se exporta al usuario.

## Decisiones y contexto que no debe perderse

1) `screenReader.start()` tira `VoiceOver cannot be started` y esconde la causa en un `cause` anidado (`macOS version not supported`). **Leer solo el mensaje externo manda a buscar por el lado de permisos y se pierde tiempo.** `realReaderAvailability()` ya aplana la cadena; el skip del test lo muestra completo. Regla general: **si un error no explica el fallo, buscar el `cause` antes de formular una hipotesis.** El resto de las trampas medidas de este proyecto (plano virtual y falso verde, fin de recorrido por frase fija, `@guidepup/setup setup` y TCC.db, exclusion de `.knowledge/`, etc.) viven en [`docs/KNOWN-PITFALLS.md`](docs/KNOWN-PITFALLS.md) con greps de deteccion.
2) **`0.0.2`:** no se abre todavia. El siguiente paso depende de S3, que depende de upstream.
3) **npm:** `kanam-fixer` **no se publica** (`private: true`). El paquete viejo `@gonzoblasco/a11y-fixer@0.6.0` queda **publicado a proposito, sin deprecar**.
4) **`a11y-fixer`**: repo archivado. **`a11y-playground`**: archivado (scaffold vacio).
5) **`DISTRIBUTION.md`:** sigue congelado. Esperaba la evidencia de S4 para destrabarse; S4 dio un resultado negativo, asi que **no se destraba**.
6) **No ejecutar `npx @guidepup/setup setup`**: escribe directo en la base de privacidad del sistema (`TCC.db` via `sqlite3`), con una lista de clientes ajena al proyecto (`sshd`, `bash`, `zsh`, `osascript`, Terminal, System Events, navegadores).
7) **No desactivar SIP.** El maintainer de `setup` reporto (`guidepup/setup#66`) que el marcador solo se escribe con SIP apagado, y que como root falla igual.
8) **No pushear `.knowledge/`** al repo publico: esta excluido via `.git/info/exclude`.
9) **No correr `npx simple-git-hooks` antes de que exista `.git` en un proyecto nuevo**: git resuelve hacia arriba y pisa el hook del workspace.

## Archivos tocados

```
.knowledge/ROADMAP.md
HANDOFF.md
```

## Como continuar

1. Leer este HANDOFF (estado actual + proximos pasos).
2. Leer `memory/2026-11-25.md` para el informe completo de la sesion.
3. Verificar el estado real antes de actuar (git, tests, la DB).

---

*Generado por `scripts/session-handoff.py` (session-lifecycle). Se regenera en cada cierre de sesion.*
