# KNOWN-PITFALLS - kanam-fixer

Trampas medidas de este proyecto, con su deteccion. Formato: **que parece / que es / como detectarlo / regla para no caer**. Inspirado en `rules/openspec.md#known-traps-verified` (mcabreradev/hermes-sdd-agency), adaptado al contexto del proyecto.

> Si una trampa no esta aca, no es trampa: es bug o deuda tecnica, y va al ROADMAP.

## 1. El plano virtual puede dar un falso verde en timing/viewport

**Que parece:** un test pasa porque la asercion coincide con lo que el driver virtual reporta.
**Que es:** el driver camina el arbol de accesibilidad **una vez**, sin momento de anuncio contra el cual correr una carrera, y deriva atributos de la estructura en lugar de leerlos.
**Detectado con sondas discriminantes (S4, `test/witness-case.test.ts`):**

```bash
grep -n 'witness-case' test/*.test.ts
# 8 tests de caracterizacion del driver virtual. El resultado esta fijo en codigo.
```

| Sonda | Prediccion | Resultado |
|---|---|---|
| Atributos ausentes | Announce degrada | **Anuncia igual** (deriva de la estructura) |
| Atributos deliberadamente erroneos (`9` de `99`) | Announce refleja verdad | **Repite la declaracion** |
| Atributo aplicado tarde vs nunca | Diferencia visible | **Salida identica** |

**Regla:** un test verde en el plano virtual **no prueba** que el usuario escuche bien. Para timing y derivacion del viewport, hace falta el plano real (S3). Cualquier afirmacion de cobertura debe nombrar la clase de bug, no "a11y tests pass".

## 2. `VoiceOver cannot be started` esconde la causa en `cause` anidado

**Que parece:** problema de permisos de macOS (Full Disk Access, Accessibility, etc).
**Que es:** Guidepup busca `os.release()` (Darwin mayor) en su `manifest.json` y, si no hay asset para esa plataforma, lanza el error con la causa real (`macOS version not supported`) anidada en `cause`.

**Deteccion:**

```bash
npx @guidepup/setup install voiceover 2>&1 | grep -i "asset is not available"
# Verificado: Guidepup 0.34.0 cubre Darwin 21-25. Darwin 27 no tiene asset oficial.
```

| Darwin host | Asset en manifest |
|---|---|
| 21, 22, 23, 24, 25 | si |
| 26, 27 | **no** |

**Regla:** leer el `cause` antes de formular una hipotesis. Un error que no nombra la causa concreta es una pista incompleta, no una conclusion. `realReaderAvailability()` aplana la cadena y el skip del test muestra la razon completa.

## 3. `readAnnouncements()` no puede terminar por una frase fija

**Que parece:** el metodo deberia completar cuando el lector "termina".
**Que es:** Guidepup usa `end of document` como marcador de fin de recorrido. VoiceOver en espanol no pronuncia esa frase, asi que el bucle va a `MAX_STEPS` (1000) y el test muere por timeout.
**Deteccion:** ver el timeout en el log del test del plano real cuando se ejecuta en espanol.

**Regla:** el criterio de fin de recorrido tiene que ser **del plano**, no una frase fija. El bug es del arnes, no del driver.

## 4. `@guidepup/setup setup` escribe directo en TCC.db

**Que parece:** una herramienta util para configurar permisos automaticamente.
**Que es:** escribe en la base de privacidad del sistema (`TCC.db` via `sqlite3`), con una lista de clientes ajena al proyecto: `sshd`, `bash`, `zsh`, `osascript`, Terminal, System Events, navegadores.

**Deteccion:**

```bash
which @guidepup/setup 2>/dev/null && echo "ADVERTENCIA: revisar si ya se ejecuto"
ls -la ~/Library/Application\ Support/com.apple.TCC/TCC.db 2>/dev/null
```

**Regla:** **nunca ejecutar** `npx @guidepup/setup setup`. El workaround documentado (`2fc3d0d`) **no lo necesita**.

## 5. Nunca desactivar SIP

**Que parece:** paso necesario para que VoiceOver se controle por scripting.
**Que es:** el maintainer de `@guidepup/setup` reporto (issue #66) que el marcador de VoiceOver solo se escribe con SIP desactivado, y que escribirlo como root falla igual. SIP desactivado es un riesgo de seguridad que no se compensa con la funcionalidad.
**Deteccion:**

```bash
csrutil status
# esperado: "System Integrity Protection status: enabled"
```

**Regla:** SIP se queda `enabled`. El workaround es por la via documentada (Full Disk Access manual desde System Settings), no tocando el modo del sistema.

## 6. `.knowledge/` no debe ir al repo publico

**Que parece:** directorio util para documentar el proyecto desde el workspace.
**Que es:** contiene contexto interno (BRIEF, ROADMAP, STATUS, ARCHIVE, HANDOFF) que no es surface de GitHub. Mezclado con el repo publico, expone decisiones privadas y rutas locales.
**Deteccion:**

```bash
git -C projects/kanam-fixer ls-files | grep -E '^\.knowledge/' && echo "FUGA: .knowledge/ trackeado en git"
git -C projects/kanam-fixer check-ignore -v .knowledge/STATUS.md
# esperado: exclusion declarada via .git/info/exclude
```

**Regla:** `.knowledge/` vive en `.git/info/exclude` (workspace-level) o en `.gitignore` (repo-level). Antes de cualquier push, verificar que `git ls-files .knowledge/` devuelva vacio.

## 7. Estado de publicacion en npm y ejemplo de import

**Que parece:** el README puede mostrar `import from 'kanam-fixer'` como ejemplo valido de uso externo.
**Que es:** `kanam-fixer` **si esta publicado** en npm (v0.0.1 placeholder + v0.0.2 con bin `kanam-fixer-mcp`); el `package.json` no tiene `"private": true`. Pero el README dice **"Not published"**, lo cual es falso: induce a error sobre la superficie real del paquete y contradice el estado del registry.
**Deteccion:**

```bash
# Estado real del paquete en npm
curl -fsS https://registry.npmjs.org/kanam-fixer | python3 -c "import sys, json; d = json.load(sys.stdin); print('latest:', d.get('dist-tags', {}).get('latest')); print('versiones:', list(d.get('versions', {}).keys()))"
# esperado: latest: 0.0.2 (o posterior), con v0.0.1 placeholder y v0.0.2 real

# Verificar el flag private en el repo
grep -E '"private"' projects/kanam-fixer/package.json
# si NO hay match, el paquete es publicable (no implica que este publicado, pero el flag no lo bloquea)
```

**Regla:** antes de afirmar el estado de publicacion, verificar contra el registry (`curl https://registry.npmjs.org/<nombre>`), no contra la documentacion interna. Si el README dice "Not published" y el registry dice 200, **el README esta mal**: corregirlo, no perpetuarlo. La decision de publicar pertenece a Gonzo (regla del workspace: accion publica requiere OK).

## 8. `simple-git-hooks` no se corre antes de que exista `.git`

**Que parece:** paso inocuo del setup.
**Que es:** `simple-git-hooks` resuelve hacia arriba en busca del `.git/` mas cercano. Si se corre antes de inicializar el repo del proyecto, **pisa el hook del workspace raiz**.
**Deteccion:**

```bash
git -C projects/kanam-fixer rev-parse --git-dir
# si falla, NO correr simple-git-hooks todavia
```

**Regla:** orden obligatorio: `git init` -> `git add` minimo -> `npm install` (que dispara `prepare` y configura el hook). Si el repo ya esta inicializado, el hook del proyecto se aplica; si no, va a parar donde no debe.

## 9. El parche local en `node_modules/` no sobrevive a `npm ci`

**Que parece:** workaround valido para el plano real en Darwin 27.
**Que es:** cualquier modificacion dentro de `node_modules/` se pierde al ejecutar `npm ci` (instalacion limpia desde lockfile). Hay que reaplicar manualmente despues de cada `npm ci`.
**Deteccion:**

```bash
git -C projects/kanam-fixer status --ignored | grep node_modules
# parches locales visibles como "!!" (ignored but present)
```

**Regla:** el workaround `2fc3d0d` se documenta y se reaplica despues de cada `npm ci`. Cuando Guidepup publique el asset oficial de Darwin 27, el workaround deja de ser necesario (es local, idempotente, no toca TCC/SIP). Hasta entonces, **el plano real sigue declarado como limitacion**.

## 10. El pre-commit hook puede bloquear commits correctos

**Que parece:** el hook esta roto o la herramienta se equivoca.
**Que es:** el hook (`lint -> test -> build`) freno commits reales con causa legitima:

| Slice | Herramienta | Falla real |
|---|---|---|
| S1 | Biome | 2 errores en `dist/` |
| S2 | tsc | tipos faltantes (`Node` del DOM, `node:module`) |
| S2 | Biome | import sin usar |
| S4 | Biome | import sin usar + orden de imports |

**Regla:** si el hook bloquea, **se arregla la causa**, no se bypasea con `SKIP_SIMPLE_GIT_HOOKS=1`. Bypass es admisible solo en commits de infraestructura (regenerar `dist/`, mover archivos), nunca en cambios funcionales.

## Como se mantiene este archivo

- **Se agrega una entrada** cuando se descubre una trampa en una corrida real, no cuando se imagina un problema.
- **Se elimina una entrada** cuando la causa desaparece (ej: si Guidepup publica el asset oficial de Darwin 27, la entrada 9 cambia o se cierra).
- **Formato**: "que parece / que es / como detectarlo / regla para no caer". La deteccion incluye un grep o comando ejecutable, no solo una descripcion.
- **Origen**: cada entrada cita el slice (S1-S5) o el issue externo que la origino.
