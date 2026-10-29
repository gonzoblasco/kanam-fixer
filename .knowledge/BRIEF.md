# BRIEF - kanam-fixer

**Estado:** ciclo 0.0.1 cerrado (2026-09-15, limitacion S3 declarada); ciclo 0.0.2 abierto con el MCP companion server (commit `f1f60fa`). Repo publico: https://github.com/gonzoblasco/kanam-fixer.
**Primer ciclo:** 0.0.1
**Pilar:** Accesibilidad como diferenciador (ADR-001, seccion 6: candidato a ancla, alcance en definicion)
**Sucede a:** `a11y-fixer` (archivado 2026-09-14). **No hereda su codigo ni su alcance.**

> **Direccion propuesta, pendiente de confirmacion de Gonzo.** El alcance se definio a partir de evidencia (ver "Por que"), pero la decision de direccion es de Gonzo. Si cambia la direccion, cambia el roadmap.

---

## Que es, en una linea

**De los atributos a lo que se escucha:** assertar el **anuncio** del lector de pantalla - en local con el lector real, y en CI con uno virtual, con la misma API.

## Por que este proyecto y no un a11y-fixer v2

`a11y-fixer` no murio por falta de codigo: murio por **falta de uso**. Llego feature-complete (40/40 tareas), publicado en npm, con 102 tests verdes - y 0 estrellas, 0 usuarios externos. El espacio de "correr axe-core sobre un PR y comentar" esta **saturado y commoditizado**: en el propio Marketplace de GitHub conviven `a11y-check`, `a11yguard`, `accessibility-scanner` y varios mas.

Rehacer eso seria no haber aprendido nada. **La leccion de 0.0.1 es que el camino empieza por el usuario, no por la feature.**

## El hueco que ataca

Todo el toolchain mainstream de a11y **testea atributos y estructura**. Ninguno testea **lo que el lector de pantalla dice**.

Ese limite esta documentado en nuestra propia practica. La skill `a11y-at-validation` define la frontera asi:

| Verificable por test unitario | Solo verificable a mano |
|---|---|
| Atributos ARIA en el DOM | **Lo que el lector de pantalla anuncia (la frase)** |
| Roles, `aria-labelledby`, `aria-selected` | **El timing del anuncio** (cuando se dice, si se dice) |
| Estructura del arbol de accesibilidad | Interaccion real (roving focus, `aria-activedescendant`) |

**Caso testigo (radix-ui #4109/#4110):** el `aria-posinset` estaba correcto en el DOM y los 51 tests pasaban en verde - pero con VoiceOver el first option **no anunciaba nada**, por una carrera de timing entre el mount y el anuncio. Ningun test unitario podia atraparlo.

> **Correccion importante (2026-09-15, resultado de S4):** este caso **no se reproduce en el plano virtual**. Medido con sondas discriminantes: el driver virtual **deriva** la posicion de la estructura cuando el atributo falta (anuncia `position 1, set size 4` igual), **repite** atributos erroneos (dice `position 9` de `99` en una lista de 4), y da salida **identica** si el atributo se aplica tarde o nunca (no hay momento de anuncio contra el cual correr una carrera).
>
> Las dos causas reales - total derivado del viewport y carrera en el anuncio - viven en el lector real y el browser. **Consecuencia:** el plano virtual puede dar un **falso verde** en esa clase de bug. El caso testigo queda como evidencia del **hueco del ecosistema**, no como demostracion de que este driver lo cubra. El detalle esta en `STATUS.md`, seccion S4.

Hoy eso se resuelve **a mano**: abrir el storybook, prender VoiceOver, escuchar. Es conocimiento de especialista, no se automatiza. **Ahi esta el producto.** Y es exactamente el trabajo que hacemos en cada PR de accesibilidad en repos ajenos.

## El usuario

**Especialistas de a11y y maintainers de design systems** que tienen que defender el comportamiento de un componente en review y no pueden correr un lector de pantalla en cada PR.

Es el usuario que Gonzo conoce desde adentro: 8+ anos en el tema, ~5 con a11y como funcion central, 200+ fixes probados con lectores de pantalla, y hoy Lead Software Engineer de Digital Accessibility. No es un usuario imaginado.

**Criterio de exito (definido por NORTH.md, Horizonte 1):** que lo use alguien que no sea Gonzo, con issues y PRs de terceros.

## La apuesta

Que el trabajo que hoy es **manual y de especialista** se vuelva **una asercion repetible** - sin perder la verdad del lector real.

La pieza que lo hace posible ya existe y esta viva: **Guidepup** (MIT, 561 stars, ultimo push 2026-09-13, ~27.500 descargas semanales). Automatiza lectores de pantalla **reales**: VoiceOver en macOS, NVDA en Windows. Y su driver virtual (`@guidepup/virtual-screen-reader`, ~33.000 descargas semanales) corre sin AT real.

**El diferenciador no es automatizar un lector - es la misma asercion en dos planos:**

| Plano | Driver | Donde corre | Para que |
|---|---|---|---|
| Rapido | virtual | CI, cualquier SO | No romper el anuncio en cada PR |
| Verdad | VoiceOver / NVDA | local, macOS / Windows | Confirmar antes de publicar |

Eso es un workflow que hoy nadie empaqueta, y que nosotros ya ejecutamos a mano.

## Que NO es

- **No es un scanner.** No compite con axe-core ni lo reemplaza. Si el problema es un `alt` vacio, axe-core ya lo resuelve mejor.
- **No es un dashboard de reportes.** Nadie cambia de herramienta por graficos.
- **No es SaaS.** Sin lock-in, corre en la maquina de quien lo usa.
- **No hereda el engine de a11y-fixer.** Si algo de ese codigo sirve, se porta con decision explicita, no por inercia.
- **No es un framework de testing.** Es una asercion puntual sobre el anuncio, no un runner.

## Stack propuesto (a validar en 0.0.1)

- **TypeScript** + Node (el ecosistema de Guidepup es JS/TS).
- **Guidepup** para el driver real; su driver virtual para CI.
- **Playwright** para llevar el navegador al estado previo al anuncio.
- Biome, Vitest, pre-commit hooks (regla del workspace: lint -> test -> build).

## Riesgos y restricciones (honestos)

1. **El lector real no corre en CI.** VoiceOver necesita macOS y permisos de accesibilidad; NVDA, Windows. **Por eso existe el driver virtual** - no es un extra, es la respuesta a esta restriccion.
2. **Automatizar lectores de pantalla es intrinsecamente flaky** (timing, foco, audio). Exige la misma disciplina que ya nos costo caro con SSE en kanam-pulse: waits generosos y tests que no dependan del reloj.
3. **Dependencia de terceros.** Guidepup es MIT y esta activo, pero es una dependencia central. Verificado el 2026-09-14: `stars=561`, `pushed=2026-09-13`, `archived=false`, `license=MIT`. No hay alternativa real para automatizar lectores de pantalla reales; el riesgo se mitiga con una capa propia fina sobre su API.
4. **La frase anunciada varia por lector, version y SO.** No se puede prometer "el anuncio" universal: hay que declarar la matriz (lector x version x SO) igual que hacemos en los PRs.

### Documentos del proyecto

- **`ROADMAP.md`** - el ciclo `0.0.1` y sus slices.
- **`DISTRIBUTION.md`** - material de lanzamiento **guardado, sin ejecutar**. Investiga los canales de descubrimiento (awesome lists, GitHub Marketplace) y conserva los textos redactados el 2026-09-14 para `a11y-fixer`, con la advertencia de que no se reciclan tal cual. **Congelado hasta que exista evidencia (S4).** Publicar esta fuera de alcance de `0.0.1`.

## Blocker real de S3: Guidepup no soporta macOS 27

> **Actualizacion final (2026-09-15, noche):** el intento acotado se ejecuto con el permiso de Gonzo y **se abandona** (acuerdo previo: si no estabilizaba, se declara la limitacion). Resumen medido:
>
> - El Full Disk Access funciono: el EPERM del mount desaparecio.
> - El plano real HABLO en esta maquina: con el workaround del manifest + un parche local al `start.js` de Guidepup (fallback al binario actual + lanzamiento en background, espejando el setup oficial), frase real capturada: `"VoiceOver Audio de VoiceOver cuadro de dialogo Audio de VoiceOver ..."`.
> - La suite real no estabilizo por **dos causas del arnes, no del driver**: (a) el `activate` de Guidepup es intermitente en este SO (timing del bridge de scripting); (b) `readAnnouncements()` termina solo con la frase fija `end of document`, que el VoiceOver en espanol nunca pronuncia -> el bucle se va a MAX_STEPS y el test muere por timeout.
> - **Cierre de S3 queda pendiente de dos arreglos del arnes** (criterio de fin de recorrido por plano + retry de activate) **o del soporte oficial de Guidepup para Darwin 27** (issue #149). Hasta eso, el plano real se declara no verificable en esta maquina y S3 queda limitado.
> - Estado de la maquina al cerrar: repos pristinos (`2fc3d0d`, npm ci), VoiceOver apagado, preferencia en 0, sin procesos de prueba.

> **Correccion de diagnostico (2026-09-15).** Un diagnostico previo, escrito el mismo dia, atribuyo el fallo a **permisos de macOS faltantes**. **Era incorrecto.** Los permisos se resolvieron y el fallo siguio. La causa real esta abajo, verificada siguiendo el codigo de Guidepup hasta el origen. Se deja registrado el error y su correccion, no solo el resultado final.

### La causa exacta

`screenReader.start()` falla con `VoiceOver cannot be started`, pero ese mensaje **oculta un cause anidado**. El error real es:

```
VoiceOver cannot be started
  cause: Error: macOS version not supported
```

El origen esta en `lib/macOS/VoiceOver/VoiceOver.js` y en `preferences/resolveDmgPath.js`: Guidepup busca la version mayor de Darwin (`os.release()`) en su `manifest.json` y **lanza si no hay asset para esa plataforma**.

| Este equipo | Guidepup 0.34.0 (latest, 2026-08-31) |
|---|---|
| macOS 27.0, **Darwin 27** | `platformVersions` disponibles: **21, 22, 23, 24, 25** |

Confirmado tambien por el CLI, que lo dice sin ambiguedad:

```
$ npx @guidepup/setup install voiceover
Error: The requested screen reader asset is not available for this platform: VoiceOver on darwin 27
```

Verificado ademas contra la rama `main` del repo upstream: su `manifest.json` tampoco tiene 26 ni 27.

### Los permisos NO eran el problema (verificado)

Esto importa porque invalida la receta que habia quedado escrita:

- El paso de **VoiceOver Utility** esta **hecho**: `/private/var/db/Accessibility/.VoiceOverAppleScriptEnabled` existe y contiene `a` (creado 2026-09-15 10:39).
- El **control por AppleScript funciona**: verificado con `osascript -e 'tell application "VoiceOver" to activate'`, que arranco VoiceOver. El binario arranca y se controla. Lo que falla es que Guidepup **no tiene el asset de preferencias portables** para Darwin 27, asi que ni siquiera llega a intentar arrancarlo.
- `detect()` y `.default()` devuelven `true` porque VoiceOver **esta instalado en el sistema**; eso nunca fue una prueba de que Guidepup pudiera manejarlo.

### Consecuencia: S3 no depende de Gonzo, depende de un tercero

**S3 no se puede cerrar en esta maquina hasta que Guidepup publique un asset de VoiceOver para Darwin 27.** No es una accion del usuario, ni una configuracion, ni un permiso: es cobertura faltante upstream.

Esto es exactamente el riesgo que **ADR-0001** anticipo como el mas duro: *"el plano real es el lado mas dificil de reemplazar"*. Dejo de ser una advertencia teorica y pasa a ser un hecho medido: el driver virtual corre en cualquier SO, el real depende de que exista un asset para la version exacta del sistema.

### Opciones (ninguna tomada todavia)

1. **Esperar / seguir upstream.** **HECHO (2026-09-15):** el hueco fue reportado en https://github.com/guidepup/guidepup/issues/149. No existia un issue previo por darwin 26/27 (buscado el mismo dia). Queda esperar que lo tomen o que el asset de Darwin 27 aparezca.
2. **Correr el plano real en otra maquina** con macOS soportado (Darwin 21-25). **DESCARTADA (2026-09-15):** todas las maquinas de Gonzo corren macOS 27. No hay segunda maquina aprovechable.
3. **Declarar la limitacion** en la matriz de ADR-0002 y dejar S3 documentado como bloqueado por upstream.

### Lo que si se aprende de esto

El mensaje de error de Guidepup es enganoso: `VoiceOver cannot be started` sugiere un problema de arranque o permisos, cuando la causa real es una plataforma no soportada. **Un cause anidado que no se lee es un diagnostico perdido.** Vale registrarlo como leccion de debugging.

### Advertencia que sigue en pie: `@guidepup/setup setup`

Ese comando escribe directo en la base de privacidad del sistema (`TCC.db` via `sqlite3`) y su lista de clientes incluye cosas ajenas a este proyecto (`sshd`, `bash`, `zsh`, `osascript`, Terminal, System Events, navegadores). **No ejecutarlo.** Ademas, en este caso no habria servido: el bloqueo es un asset faltante, no un permiso.

**Nunca desactivar SIP.** Verificado: sigue `enabled`. Su propio maintainer reporto (issue `guidepup/setup#66`) que en macOS 26 el marcador solo se escribe con SIP desactivado, y que escribirlo como root falla igual. No es un camino viable ni seguro.

## Pendientes de decision (de Gonzo)

1. ~~Confirmar la direccion~~ **HECHO (2026-09-15):** direccion confirmada.
2. ~~Nombre / repo~~ **HECHO (2026-09-15):** `gonzoblasco/kanam-fixer` creado y **publico** (https://github.com/gonzoblasco/kanam-fixer). Verificado que `.knowledge/` NO se filtra al repo publico. `kanam-fixer` sigue libre en npm (404) - publicar el paquete es una decision aparte, no tomada.
3. ~~`a11y-fixer`~~ **HECHO:** repo de GitHub archivado (verificado `isArchived=true`, 2026-09-15 12:46 UTC).
4. ~~Paquete npm `@gonzoblasco/a11y-fixer@0.6.0`~~ **DECIDIDO (2026-09-15):** queda **publicado a proposito, sin deprecar**. Razon de Gonzo: "puede servir de entrada a alguien quien llegue a el por error". Verificado: sigue publicado (`0.6.0`), sin flag de deprecacion, 28 descargas en el ultimo mes.
5. ~~`a11y-playground`~~ **DECIDIDO (2026-09-15):** **archivado**. Verificado: `isArchived=true`, `size=0KB`, un solo commit, sin descripcion (era un scaffold vacio).
6. ~~S5 - cierre del ciclo~~ **HECHO (2026-09-15):** ciclo `0.0.1` **cerrado**. La apuesta se sostiene para bugs de **atributos y composicion** (S2) y no para los de **timing y viewport** (S4, que ademas encontro falsos verdes ahi). Lectura adoptada: el valor se invierte hacia el **plano real** como unico juez de esa clase. **Decision: no abrir `0.0.2`** hasta que S3 se pueda cerrar.

**Abierto, y es una espera, no una tarea:** Guidepup publique el asset de VoiceOver para Darwin 27 ([issue #149](https://github.com/guidepup/guidepup/issues/149), ya reportado).

Seguimiento en la DB de memoria: todo **id=54**.
