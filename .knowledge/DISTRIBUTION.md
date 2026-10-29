# DISTRIBUTION - kanam-fixer

**Estado:** material guardado, **nada ejecutado**. Ninguna accion publica se hizo.
**Origen:** redactado el **2026-09-14** para `a11y-fixer`. Ese proyecto se archivo ese mismo dia y el lanzamiento nunca ocurrio. Se preserva aca porque el trabajo de investigacion es reusable.
**Alcance:** el ROADMAP de `0.0.1` dice explicito que publicar **esta fuera de alcance** ("El ciclo prueba, no distribuye"). Este documento es para un horizonte posterior, no para el ciclo actual.

> **Advertencia de procedencia.** Los textos de abajo se escribieron para un **GitHub Action** (`a11y-fixer`). `kanam-fixer` es una **asercion sobre el anuncio del lector de pantalla** (ver BRIEF). No todo aplica - ver "Que sirve y que no".

---

## Que sirve y que no

| Pieza | Aplica a kanam-fixer? | Por que |
|---|---|---|
| **Entradas de `awesome-a11y`** | **Si**, con reescritura | Es una lista de herramientas de a11y. Cualquier tool del dominio entra. |
| **Entradas de `awesome-actions`** | **Solo si** kanam-fixer shippea un GitHub Action | Si es una libreria npm sin `action.yml`, no corresponde la seccion. Y el BRIEF marca el "comentario automatico en PRs" como **fuera de alcance** (es el camino muerto de a11y-fixer). |
| **Texto de release del Marketplace** | **Solo si** es una Action | El Marketplace requiere `action.yml` + un release con la casilla de publicacion. Si se distribuye como paquete npm, este texto no aplica; sirve como base para el release de GitHub. |
| **Investigacion de las listas** (abajo) | **Si**, entera | Datos verificados el 2026-09-14, con URL y estrellas. |

**Lo que hay que cambiar en cualquier caso:** el nombre del repo en las URLs (`a11y-fixer` -> `kanam-fixer`), la descripcion de una linea, y el angulo. El pitch de a11y-fixer era "auditar un PR con axe-core"; el de kanam-fixer es "**assertar lo que el lector de pantalla anuncia** - virtual en CI, real en local". **No son el mismo producto y el texto no se recicla tal cual.**

---

## Investigacion de canales (verificada 2026-09-14)

### Listas curadas

| Lista | Stars | Ultimo push | Entra? |
|---|---|---|---|
| [sdras/awesome-actions](https://github.com/sdras/awesome-actions) | 27.900 | activa | Solo si es Action. **No tiene ninguna entrada de accesibilidad** (verificado) |
| [brunopulis/awesome-a11y](https://github.com/brunopulis/awesome-a11y) | 1.987 | 2026-08-03 | Si - va en `topics/tools.md`, seccion `Validators` |
| [sindresorhus/awesome](https://github.com/sindresorhus/awesome) | canonica | activa | No se agrega directo: **ya linkea a brunopulis/awesome-a11y** como la lista de Web Accessibility |
| lukeslp/awesome-accessibility | 54 | 2026-09-13 | Alternativa menor |

**Requisitos reales** (leidos de cada CONTRIBUTING, no asumidos):
- `awesome-actions`: descripcion de **una linea**, sin bold/italic, Title Casing, un PR por sugerencia, lint automatico que hay que pasar.
- `awesome-a11y`: **orden alfabetico**, agregar `description`, respetar el formato de tabla de cada seccion. Prohibe explicitamente herramientas de *overlay* (no aplica a un tool de testing).

### Hallazgos sobre el Marketplace de GitHub

- Se publica **al instante y sin revision** si el repo es publico, tiene un solo `action.yml` en la raiz, y el nombre es unico.
- **El checkbox de publicacion esta deshabilitado hasta aceptar el GitHub Marketplace Developer Agreement.** Es la razon por la que el branding de `a11y-fixer` quedo listo en `action.yml` y la publicacion nunca ocurrio.
- **No hay analytics de instalaciones para Actions.** El Insights que documenta GitHub es para *Apps*, no para Actions. Se publica a ciegas.
- Categorias utiles para el dominio: `code-quality`, `code-review`, `continuous-integration`, `code-scanning-ready`.
- **El Marketplace da credibilidad, no trafico.** Evidencia recogida en la investigacion: publicar una action no garantiza adopcion. Los canales que mueven la aguja de verdad son contribuir en repos donde vive la audiencia y aparecer en listas curadas.

---

## Texto A - Release / Marketplace

**Usar solo si kanam-fixer se distribuye como GitHub Action.** El `[cambios]` y el nombre de version son placeholders.

```markdown
# kanam-fixer vX.Y.Z - Assert what the screen reader actually announces

Accessibility testing stops at attributes and structure. kanam-fixer asserts
the announcement itself - the phrase a screen reader actually says.

## The gap

Every mainstream tool checks the DOM: roles, ARIA attributes, the accessibility
tree. None of them check what gets announced. A component can have a perfectly
correct `aria-posinset` while VoiceOver announces nothing at all, because the
announcement fires before the element is mounted.

That gap is real and documented. It is why accessibility experts still open a
storybook, turn on a screen reader, and listen - by hand, on every review.

kanam-fixer turns that manual step into an assertion.

## One assertion, two planes

| Plane | Driver | Runs on | Purpose |
|---|---|---|---|
| Fast | virtual screen reader | CI, any OS | Do not break the announcement in a PR |
| Truth | VoiceOver / NVDA | local, macOS / Windows | Confirm before shipping |

The same assertion runs on both. No rewriting between them.

## What it is not

- Not a scanner. If the problem is an empty `alt`, axe-core already solves it better.
- Not a reporting dashboard.
- Not a SaaS. Nothing leaves your machine.

## What's in this release

[release changes]

Matrix note: announcements vary by screen reader, version and OS.
See ADR-0002 for the declared support matrix.

**Full changelog**: https://github.com/gonzoblasco/kanam-fixer/blob/main/CHANGELOG.md
```

**Recordatorio operativo:** el release tiene que cortarse con la casilla *"Publish this Action to the GitHub Marketplace"* tildada, despues de aceptar el Developer Agreement.

---

## Texto B - awesome-a11y

Va en `topics/tools.md`, seccion **`Validators`**, que usa **formato de tabla** (no bullets). Orden alfabetico - verificar la posicion al momento de enviar.

```markdown
|[kanam-fixer](https://github.com/gonzoblasco/kanam-fixer)|Asserts the phrase a screen reader actually announces, running the same assertion with a virtual screen reader in CI and a real one locally|
```

PR:

```
Title: Add kanam-fixer to Validators

Body:
Adds kanam-fixer, a testing tool that asserts what a screen reader actually
announces - not just the ARIA attributes in the DOM. The same assertion runs
with a virtual screen reader in CI and with a real one (VoiceOver) locally,
so announcement regressions can be caught in a pull request instead of by
hand in a review.

Placed in Validators, following the existing table format. Description kept
to one line.
```

---

## Texto C - awesome-actions (solo si es una GitHub Action)

Si kanam-fixer publica un `action.yml`. La seccion propuesta es **nueva** (`Accessibility`): el CONTRIBUTING autoriza crearla ("*If you don't find a section that it belongs in, please make one*") y **la lista no tiene ninguna entrada de accesibilidad**.

```markdown
- [Assert Screen Reader Announcements in Pull Requests](https://github.com/gonzoblasco/kanam-fixer) - Checks what a screen reader actually announces, using a virtual reader in CI.
```

PR:

```
Title: Add Accessibility section with kanam-fixer

Body:
Adds an Accessibility section - the list had no accessibility entries.

kanam-fixer asserts what a screen reader actually announces rather than only
checking ARIA attributes in the DOM. It runs a virtual screen reader in CI,
catching announcement regressions in a pull request instead of leaving them
to manual review.

Repo: https://github.com/gonzoblasco/kanam-fixer
```

---

## Antes de publicar cualquiera de estos textos

1. **La direccion del BRIEF tiene que estar confirmada** por Gonzo (esta pendiente).
2. **El repo tiene que existir** (`kanam-fixer` no tiene repo ni en GitHub ni en npm; el nombre esta libre en ambos a la fecha de este documento).
3. **README escrito con el problema, no con la feature** (lo pide el ROADMAP, slice S1).
4. **Evidencia real en el README** antes de pedir adopcion: el ROADMAP pide que S4 (el caso testigo) quede documentado como demostracion. Pedir entrada en una lista curada sin evidencia reproducible quema el canal.
5. **Escanear guiones** (`scripts/check_em_dash.py`) en cualquier texto que salga.
6. **Superficie publica:** PRs a repos de terceros y publicacion en npm/Marketplace requieren **OK explicito de Gonzo**.

## Leccion que este material deja

El material de lanzamiento de `a11y-fixer` estaba listo y **nunca se uso**: el proyecto se archivo antes. La leccion no es "publicar antes", es la del BRIEF - **el camino empieza por el usuario, no por la feature**. Repartir textos de lanzamiento de algo que nadie pidio no habria cambiado el resultado.

Por eso este archivo queda **congelado hasta que haya evidencia** (S4) y usuarios potenciales identificados.
