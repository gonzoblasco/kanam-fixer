# STATUS - kanam-fixer

**Actualizado:** 2026-09-15 (noche)
**Ciclo:** 0.0.1 **CERRADO**. S3: workaround probado con el permiso de Gonzo, **no estabilizo**; se declara la limitacion (ver S3). 0.0.2 **ABIERTO** (2026-09-15): MCP companion server, commit `f1f60fa`.

## Donde estamos

| Slice | Estado | Evidencia |
|---|---|---|
| S1 - Esqueleto y decisiones | **Completado** | Commit `6044856`. Terna en verde, hook activo. |
| S2 - La asercion, solo virtual | **Completado** | Commit `fb931ea`. 7 tests. Criterio de salida verificado. |
| S3 - VoiceOver real en local | **Limitado: no verificable en esta maquina** | El plano real HABLO una vez (workaround + Full Disk Access de Gonzo), pero la suite no estabiliza. Detalle en S3. |
| S4 - El caso testigo (#4109) | **Completado - NO reproduce** | Commit `5090278`. 8 tests. Hallazgo abajo. |
| S5 - Cierre del ciclo | **Completado** | Commit `88ca9ff`. README con la evidencia + `HANDOFF.md`. |

**Repo publico:** https://github.com/gonzoblasco/kanam-fixer (`2fc3d0d`).
**Regla:** cada proyecto de `projects/` versiona su `.knowledge/` en su propio repo. `projects/` esta ignorada entera por el workspace, asi que el repo del proyecto es el unico respaldo de estos archivos.
**Terna:** 17 passed, 4 skipped (los 4 son el plano real, con su causa impresa). Medido 2026-10-28: 22 passed, 4 skipped.

## S3: workaround probado - el plano real hablo, la suite no estabilizo, se declara la limitacion

### Que paso (2026-09-15, noche - intento acotado con el permiso de Gonzo)

El acuerdo fue: un intento acotado del workaround; si no estabilizaba, se abandona y se declara la limitacion. **Se abandona.**

**El Full Disk Access de Gonzo funciono:** el EPERM del mount de preferencias desaparecio (la cadena de `cause` dejo de mostrarlo).

**El plano real HABLO en esta maquina:** con el workaround del manifest (`2fc3d0d`) + un parche local al `start.js` de Guidepup (fallback al binario actual + lanzamiento en background, espejando el setup oficial), el smoke capturo frase real:

```
RESULT: START OK
RESULT: PHRASE | "VoiceOver Audio de VoiceOver cuadro de dialogo Audio de VoiceOver ..."
RESULT: STOP OK
```

**Pero la suite real no estabilizo.** Dos motivos medidos, el segundo es el que decide:

1. **El `activate` de Guidepup es intermitente** en este SO: a mano da `rc=0`, dentro de node falla un porcentaje de corridas (`Unable to activate application: VoiceOver`). Timing del bridge de scripting, no permiso (los permisos dan otro codigo).
2. **`readAnnouncements()` termina solo cuando el lector dice `end of document`** - el marcador que usa el plano virtual. El SO de Gonzo esta en espanol y el VoiceOver real nunca pronuncia esa frase: el bucle se va a MAX_STEPS (1000) y el test muere por timeout. Eso es un bug del arnes, no del driver: el criterio de fin de recorrido tiene que ser del plano, no una frase fija.

### Decision (2026-09-15)

**S3 queda declarado como limitacion** (opcion 3 del plan): el plano real no es verificable en esta maquina hasta que Guidepup soporte Darwin 27 oficialmente. No se sigue parcheando: el workaround de `node_modules` no sobrevive a un `npm ci` y requiere re-aplicacion manual en cada entorno.

**Estado de la maquina al cerrar:** repos pristinos (`2fc3d0d`, working tree limpio, `npm ci` re-ejecutado), VoiceOver apagado, preferencia maestra en `0` y estable tras 24s de monitoreo, sin procesos de prueba. Los parches locales quedaron eliminados.

### Que deja el intento (para quien retome)

- **El plano real FUNCIONA** en este hardware/SO con el parche minimo: la frase capturada es prueba de eso.
- **El cierre de S3 necesita dos arreglos, ambos del arnes, no del driver:** (a) criterio de fin de recorrido por plano (no la frase fija `end of document`); (b) retry en `activate` o espera del bridge de scripting. Con eso, la suite real deberia correr.
- **Reportado upstream:** https://github.com/guidepup/guidepup/issues/149 (sin respuesta al cierre de esta acta).

### Advertencias que siguen en pie

- **No ejecutar `npx @guidepup/setup setup`**: escribe directo en TCC.db con lista de clientes ajena al proyecto.
- **Nunca desactivar SIP** (verificado: sigue `enabled`).

---

---

## S4: el caso testigo - RESULTADO NEGATIVO

**El plano virtual NO reproduce el caso #4109/#4110.** Eso es el resultado, no un fracaso del slice: el ROADMAP dice que `0.0.1` prueba la apuesta y que si no se sostiene se descarta antes de invertir mas.

### El caso real (leido de los issues, no de memoria)

- **#4109** agrego `aria-posinset`/`aria-setsize` calculados a `Select.Item`. Los atributos quedan correctos y los tests unitarios pasan.
- **#4110** (abierto) reporta que, sin valor preseleccionado, la **primera opcion no anuncia nada** con VoiceOver + Chrome: carrera de timing, mas un total que el browser deriva de las opciones **visibles en el viewport**.

### Lo que verifique, con sondas discriminantes

No lo asumi: lo medi. Tres experimentos, cada uno con una prediccion distinta:

| Experimento | Resultado observado | Que significa |
|---|---|---|
| Atributos **ausentes** | Anuncia igual `position 1, set size 4` | **Deriva la posicion de la estructura.** No detecta la regresion que #4109 arreglo. |
| Atributos **deliberadamente erroneos** (`9` de `99`, en una lista de 4) | Repite `position 9, set size 99` | Refleja **la declaracion**, no la verdad. |
| Atributo aplicado **tarde** vs **nunca** | Salida **identica** | **No hay momento de anuncio** contra el cual correr una carrera. |

Las dos causas reales viven en el lector real y en el browser: un total derivado del viewport, y una carrera en el momento del anuncio. Un driver que camina el arbol de accesibilidad **una vez** no tiene ninguna de las dos.

### El hallazgo mas importante (y el mas incomodo)

El tercer experimento dice algo que va mas alla de S4: **el plano virtual puede dar un falso verde** en esta clase de bug. Un test virtual puede pasar mientras el lector real anuncia mal.

Eso no invalida S2: la asercion **si** ve los bugs de **atributos y composicion** (lo demostro con `aria-pressed`, `aria-label` y el nivel de heading). Lo que no ve son los de **timing y derivacion del viewport**.

**Corolario:** el plano real (S3) no es un lujo ni un extra de cobertura. Es la unica forma de cubrir esa clase. Es decir: **S4 refuerza la necesidad de S3**, en vez de restar valor al proyecto.

### Por que los tests quedaron, si el resultado es negativo

El suite de S4 es un **test de caracterizacion**: fija el comportamiento observado del driver para que la razon no se pierda ni se vuelva a adivinar. Si alguien retoma el proyecto en tres meses, encuentra escrito por que el caso testigo no se reproduce aca, con los numeros.

---

## S3: historial del diagnostico (contexto de la correccion)

> **Correccion de diagnostico (2026-09-15).** El registro anterior atribuia este blocker a **permisos de macOS faltantes**. **Era incorrecto.** Ver seccion "S3: ESTADO ACTUALIZADO" (arriba) para el estado real; esto queda como historial de la leccion.

### Que se creia vs que era (la leccion)

El primer diagnostico leyo solo el mensaje externo (`VoiceOver cannot be started`) y concluyo "permisos". La causa real estaba en el `cause` anidado (`macOS version not supported`): Guidepup busca la version mayor de Darwin (`os.release()`) en su `manifest.json` y lanza si no hay asset para esa plataforma.

| Este equipo | Guidepup 0.34.0 (latest) |
|---|---|
| macOS 27.0, **Darwin 27** | `platformVersions`: **21, 22, 23, 24, 25** |

El CLI lo confirma sin ambiguedad: `npx @guidepup/setup install voiceover` -> `asset is not available for this platform: VoiceOver on darwin 27`.

**La leccion, aplicada al codigo:** `realReaderAvailability()` ahora aplana la cadena de `cause`, asi el skip muestra la razon real y no un mensaje que sugiere permisos. Un error que no nombra la causa concreta es una pista incompleta, no una conclusion.

### Consecuencia para el proyecto (sigue vigente)

S3 materializo el riesgo que **ADR-0001** anticipo como el mas duro: *"el plano real es el lado mas dificil de reemplazar"*. El driver virtual corre en cualquier SO; el real depende del asset de Guidepup para la version exacta del sistema. Y lo que falta ahora no es codigo ni asset: es **un permiso manual de Gonzo** (Full Disk Access), paso final del workaround.

### Opciones sobre el hueco upstream (estado final)

1. **Reportar el hueco upstream** **HECHO (2026-09-15):** issue https://github.com/guidepup/guidepup/issues/149, abierto. El workaround (`2fc3d0d`) lo referencia.
2. **Correr el plano real en otra maquina** con macOS soportado (Darwin 21-25). **DESCARTADA (2026-09-15):** todas las maquinas de Gonzo corren macOS 27.
3. **Declarar la limitacion** en la matriz de ADR-0002 y dejar S3 documentado como bloqueado por upstream. Sigue siendo la opcion de respaldo si el permiso manual no destraba.

### Advertencia que sigue en pie: `@guidepup/setup setup`

Escribe directo en la base de privacidad del sistema (`TCC.db` via `sqlite3`), con lista de clientes ajena al proyecto (`sshd`, `bash`, `zsh`, `osascript`, Terminal, System Events, navegadores). **No ejecutarlo.** El workaround no lo necesita.

**Nunca desactivar SIP** (verificado: sigue `enabled`). El maintainer de setup reporto (`guidepup/setup#66`) que el marcador de VoiceOver solo se escribe con SIP desactivado, y que escribirlo como root falla igual.

---

## S5: el cierre del ciclo (registro)

- **README reescrito para abrir por lo que el ciclo ENCONTRO**, no por la promesa: tabla de que clases de bug captura el plano virtual (atributos: si) y cuales no (timing y viewport). El caso testigo quedo etiquetado como hueco del ecosistema.
- **Corregido un ejemplo enganoso**: el README mostraba `import from 'kanam-fixer'` como instalable, cuando el paquete es `private: true` y no esta en npm (verificado: 404).
- **ADR-0002 actualizado**: la version del plano real la determina el asset que Guidepup publique para la plataforma del host (dependencia dura, medida).
- **`HANDOFF.md` creado**: donde vive cada cosa, el blocker y como se cierra, la trampa de debugging, decisiones y lo que no hay que hacer.
- **Decision**: no abrir `0.0.2` hasta que S3 se cierre. Sigue vigente; ver "Proximo paso".

---

## S1: esqueleto y decisiones

- **Stack:** TypeScript (`nodenext` ESM), Biome 2.5, Vitest 5, build con `tsc`, pre-commit hook (`simple-git-hooks`).
- **Dependencias:** `@guidepup/virtual-screen-reader` (driver virtual), `jsdom` para el DOM en tests, `@guidepup/guidepup` y `@guidepup/playwright` para el plano real.
- **ADR-0001:** capa propia fina sobre Guidepup; su API nunca es el contrato publico. Incluye que pasa si Guidepup desaparece.
- **ADR-0002:** la matriz de lectores (lector x version x SO) se declara desde el dia uno.
- **README:** abre por el problema, no por la feature.

## S2: la asercion sobre el anuncio (driver virtual)

- **`expectAnnouncement(container, expected)`** - recorre el contenedor con el lector y compara la secuencia de frases habladas, en orden.
- **`readAnnouncements(container)`** - la observacion cruda, para que un fallo pueda mostrar que se anuncio de verdad.
- **La matriz viaja con el resultado** (ADR-0002), y su version se lee del paquete instalado en vez de escribirse a mano.
- **7 tests**, incluidos 3 de mutacion mas uno que verifica que TODAS las mutaciones fallan.

### Criterio de salida de S2: verificado

| Variante | Correcto anuncia | Roto anuncia |
|---|---|---|
| Sin `aria-label` en el grupo | `group, Channels` | `group` (sin nombre) |
| Sin `aria-pressed` | `button, Email, pressed` | `button, Email` |
| Heading reemplazado por contenedor con label | `heading, Notification settings, level 1` | `Notification settings` (sin nivel) |

Los tests de mutacion matchean contra **lo que el lector anuncia**, no contra la lista esperada que el mensaje de error repite (esa version debil habria pasado por cualquier mismatch).

**Dato que vale registrar:** la segunda fila es la clase de bug del PR #9879 en ibm-products (`aria-pressed` hace que VoiceOver anuncie un toggle). El driver virtual **si** lo detecta.

## El hook hizo su trabajo en todos los slices

- **S1:** bloqueo el primer commit. Biome encontro 2 errores en `dist/`.
- **S2:** `tsc` fallaba por tipos faltantes (`Node` del DOM, `node:module`) y Biome por un import sin usar.
- **S4:** Biome por un import sin usar y el orden de imports.

En los tres casos freno un commit que no estaba limpio.

---

## Proximo paso

**Ciclo 0.0.2 ABIERTO (2026-09-15, noche):** el MCP companion server (ADR-0003, commit `f1f60fa`) expone `read_announcements` y `assert_announcement` a agentes IA via MCP/stdio, sobre el plano virtual (corre en cualquier host, sin browser). La decision de abrirlo: la sesion hermana cerro 0.0.1 hoy con S3 limitado; el companion destraba el valor de la asercion sin esperar a Guidepup y es demoable/CI-safe. **S3 sigue declarado como limitacion** y el camino real (Playwright coordinado + criterio de fin por plano) queda pendiente de coordenar con Gonzo, sin tocar esta maquina sin aviso. Ver `docs/adr/ADR-0003-mcp-companion-server.md`.

### Cuando se destraba S3

| Evento | Que pasa |
|---|---|
| **Gonzo otorga Full Disk Access al proceso que ejecuta los tests** (System Settings -> Privacy & Security -> Full Disk Access -> agregar y tildar p.ej. Terminal) | **Es el paso actual.** Correr `npm test`: si los 4 skips se vuelven tests reales, **S3 se cierra** y el ciclo 0.0.1 queda completo. |
| ~~Guidepup publica el asset de Darwin 27~~ | ~~Correr `npm test`, sin cambiar codigo.~~ **Superado por el workaround** (`2fc3d0d`): el asset parcheado ya cubre 27; cuando salga el oficial, el workaround deja de ser necesario (es local, idempotente y no toca TCC/SIP). |
| ~~Correr el plano real en una maquina con Darwin 21-25~~ | ~~Igual: `npm test` y los skips se activan.~~ **Descartado (2026-09-15):** todas las maquinas de Gonzo tienen macOS 27. |
| Gonzo decide no esperar a upstream | Abrir `0.0.2` declarando la limitacion en la matriz (ADR-0002) y apoyarse en el plano virtual **solo** para bugs de atributos. |

### Lo que el ciclo dejo claro

- **Se sostiene** para bugs de **atributos y composicion** (S2, con las frases observadas).
- **No se sostiene** para **timing y derivacion del viewport** (S4), y ahi el plano virtual puede dar **falsos verdes**.
- **La apuesta sigue en pie, invertida:** el valor no esta en el virtual como sustituto, sino en el **real como unico juez** de esa clase, con el virtual como red barata para lo demas. S3 pasa de "cobertura extra" a **nucleo del producto**, y a la vez resulto ser la parte fragil.

### `DISTRIBUTION.md`

Estaba congelado esperando la evidencia de S4: si reproducia, se destrababa; si no, se descartaba. **No reprodujo.** Queda **sin destrabar**, y esa es la decision, no un pendiente olvidado.

## Pendientes de decision (de Gonzo)

1. ~~Crear el repo y hacerlo publico~~ **HECHO:** `gonzoblasco/kanam-fixer`, publico.
2. ~~Archivar `a11y-fixer`~~ **HECHO:** `isArchived=true` (2026-09-15 12:46 UTC).
3. ~~Paquete npm `@gonzoblasco/a11y-fixer@0.6.0`~~ **DECIDIDO (2026-09-15):** queda **publicado a proposito, sin deprecar**. Razon textual de Gonzo: "puede servir de entrada a alguien quien llegue a el por error". Verificado: sigue publicado (`0.6.0`), sin flag de deprecacion, 28 descargas en el ultimo mes. `kanam-fixer` sigue libre en npm y **no se publica** (el paquete es `private: true`).
4. ~~`a11y-playground`~~ **DECIDIDO (2026-09-15):** **archivado**. Verificado: `isArchived=true`, y era un scaffold vacio (1 commit, `size=0KB`, sin descripcion).
5. ~~S5 - cierre del ciclo~~ **HECHO (2026-09-15):** ciclo cerrado con evidencia. Decision: **no abrir `0.0.2`** hasta que S3 se pueda cerrar. Ver "Proximo paso".

**Abierto (2026-09-15, ultima iteracion):** S3 quedó declarado como **limitacion** en ADR-0002. El intento acotado probó que el plano real arranca y se detiene limpio en Darwin 27, pero la "frase real" capturada era el **dialogo del sistema de AirPlay**, no el contenido del fixture: VoiceOver anuncia contenido solo con una **aplicacion real enfocada**, y los tests corren sobre jsdom. El camino al plano real verificable pasa por **@guidepup/playwright** (browser real, ya declarado en S1) + criterio de fin de recorrido por plano + retry de activate. Ese fix queda como proximo paso coordinado, sin tocar esta maquina sin aviso.

Seguimiento en la DB de memoria: todo id=54.
