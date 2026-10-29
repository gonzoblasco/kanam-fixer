# AUDIT - kanam-fixer

**Fecha:** 2026-10-28
**Auditor:** Kanam (CORE) - medición directa contra el repo, no lectura de README
**Commit auditado:** `262c004`
**Sync con GitHub:** SYNC (HEAD local == `gonzoblasco/kanam-fixer`)

---

## 1. Veredicto

**Cumple.** El proyecto promete una tesis acotada -"assertá lo que anuncia el lector de pantalla, no los atributos"- y la cumple con evidencia medida: tests verdes, build verde, y un STATUS que declara explícitamente dónde la tesis falla (S3: el plano real no estabiliza en esta máquina).

Es el proyecto con la documentación más honesta del conjunto: distingue lo completado de lo limitado, y no maquilla el resultado negativo.

---

## 2. Estado técnico medido

| Dimensión | Dato real |
|---|---|
| Tests | **22 passed, 4 skipped** (4 archivos, vitest, 6.5s). Los 4 skipped son el plano real de VoiceOver con su causa impresa. |
| Build | **Verde** (`tsc`, exit 0) |
| Lint | Script presente, no corrido en esta auditoría |
| CI | **Sin CI** - no hay `.github/workflows/` |
| Último commit | 2026-09-17 |
| Peso en disco | 254M (reconstruible: 252M `node_modules`) |

---

## 3. Promesas vs realidad

| Promesa | Fuente | Realidad medida |
|---|---|---|
| "Cycle 0.0.1 closed, the bet holds for part of the problem" | README | **Cierto.** STATUS documenta S1-S5 con commits y confirma que la tesis es parcial, no total. |
| "17 passed, 4 skipped" | `.knowledge/STATUS.md` | **Hoy 22 passed, 4 skipped.** El STATUS quedó 5 tests atrás: se agregaron tests después de la última actualización (2026-09-15). No es mentira, es desactualización. |
| Version 0.0.2 | `package.json` | El README habla de "cycle 0.0.1 closed" y el paquete dice 0.0.2 (0.0.2 abierto según STATUS: MCP companion server, `f1f60fa`). Coherente, pero el README no menciona 0.0.2. |

**Delta principal:** el STATUS tiene un número de tests viejo. El resto de las promesas se sostienen.

---

## 4. Deuda

- **Sin CI**: los tests corren a mano. Para un proyecto cuyo valor es "medir, no asumir", no tener CI es la deuda más cara.
- **S3 no cerrado**: el plano real de VoiceOver no estabiliza en esta máquina. Está declarado como limitación, no resuelto.
- **STATUS desactualizado**: 5 tests de diferencia con la realidad.
- **0 TODO/FIXME** en el código: limpio.

---

## 5. Qué haría falta para cerrarlo

1. Agregar `.github/workflows/ci.yml` con `npm test` + `npm run build` (el proyecto ya tiene los scripts).
2. Actualizar `.knowledge/STATUS.md` con el conteo real (22 passed, 4 skipped) y la fecha.
3. Decidir si 0.0.2 se cierra o sigue abierto - el README no lo menciona.

---

## 6. Prueba funcional del MCP server (2026-10-28)

No se auditó solo por tests: se **ejecutó** el servidor MCP contra casos reales.

**Build:** `tsc` verde, `dist/` completo.

**`initialize`:** responde `serverInfo: {name: kanam-fixer, version: 0.0.2}`.

**`tools/list`:** expone las dos tools prometidas - `read_announcements` y `assert_announcement`.

### Caso 1 - ejemplo del README

HTML `<div role="group" aria-label="Channels"><button aria-pressed="true">Email</button></div>` devuelve:

```
document
group, Channels
button, Email, pressed
end of group, Channels
end of document
```

Coincide con la secuencia que el README usa como ejemplo de aserción. **La promesa se sostiene contra la implementación.**

### Caso 2 - aserción mal escrita (falla correctamente)

Aserción esperada `option, Email, 1 of 3` contra un `listbox` con `aria-posinset`/`aria-setsize` correctos: **`passed: false`**. El lector anunció `option, Email, not selected, position 1, set size 3`.

Lo relevante: **los atributos del DOM estaban correctos**. Un test por atributo habría dado verde. La aserción por anuncio marcó el error - que era del que escribió la aserción, no del componente. Es el caso de uso de la tool funcionando.

### Caso 3 - contraste con y sin atributos

| HTML | Anuncio |
|---|---|
| con `aria-posinset="1" aria-setsize="3"` | `position 1, set size 3` |
| sin ambos atributos, 2 hijos | `position 1, set size 2` |

**Hallazgo:** el driver virtual reconstruye posición y tamaño por conteo del DOM; los atributos resultaron redundantes en este caso. Es justamente el tipo de suposición que la tool desmiente.

### Límite confirmado

El plano virtual (jsdom) **no puede** atrapar el bug de timing de #4109 (race entre mount y anuncio). Eso coincide con lo que `.knowledge/STATUS.md` S3 ya declara como limitación. La tool no lo oculta.

### Registro en el gateway

Registrada como MCP server `kanam-fixer` en `openclaw.json` (`mcp.servers.kanam-fixer`, `transport: stdio`, `command: node`, args al `dist/mcp-cli.js`), conviviendo con `browser-use`. Cambio aplicado sin reiniciar el gateway.

---

_Auditoría generada el 2026-10-28. Los conteos de tests son de una corrida real (`npm test`), no de badges. La sección 6 es de ejecución real del servidor MCP._
