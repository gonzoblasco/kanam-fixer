#!/usr/bin/env bash
# apply-darwin27-workaround.sh
#
# Habilita el plano real de VoiceOver en macOS 27 (Darwin 27), donde
# @guidepup/guidepup 0.34.0 no tiene asset oficial (su manifest cubre 21-25).
#
# Workaround local, documentado en el issue https://github.com/guidepup/guidepup/issues/149.
# NO toca TCC.db ni SIP. Cuando Guidepup publique el asset oficial para 27,
# este script deja de ser necesario (el watcher guidepup-darwin27-watcher avisa).
#
# Requisito final: Full Disk Access en el proceso que ejecuta los tests
# (p.ej. Terminal). Sin eso, el symlink dentro del Group Container de
# VoiceOver falla con EPERM - es TCC protegiendo un directorio del sistema.
set -euo pipefail

cd "$(dirname "$0")/.."

# 1. Solo aplica en Darwin 27
MAJOR="$(uname -r | cut -d. -f1)"
if [ "$MAJOR" != "27" ]; then
  echo "[skip] workaround es para Darwin 27; este equipo es Darwin $MAJOR. Nada que hacer."
  exit 0
fi

PKG_DIR="node_modules/@guidepup/guidepup"
MANIFEST="$PKG_DIR/manifest.json"
DMG_NAME="guidepup-voiceover-preferences-macos-26.dmg"
DMG_SHA="c46e353d4f2d4a717d3362211de638ee55fcb58dbec9cf9abd0170c35d41b225"
CACHE_DIR="$HOME/Library/Caches/guidepup/voiceover/27/0.0.1-VoiceOver4"
RELEASE_URL="https://github.com/guidepup/voiceover/releases/download/0.0.1-VoiceOver4/$DMG_NAME"

if [ ! -f "$MANIFEST" ]; then
  echo "[error] $MANIFEST no existe. Corré 'npm install' primero."
  exit 1
fi

# 2. Manifest: agregar platformVersion 27 con el asset de macOS 26 (idempotente)
if grep -q '"platformVersion": "27"' "$MANIFEST"; then
  echo "[manifest] ya parcheado."
else
  cp "$MANIFEST" "$MANIFEST.bak.$(date +%s)"
  python3 - "$MANIFEST" <<'PY'
import json, sys
p = sys.argv[1]
d = json.load(open(p))
for sr in d["screenReaders"]:
    if sr["id"] == "voiceover":
        a25 = [a for a in sr["assets"] if a["platformVersion"] == "25"][0]
        a27 = dict(a25)
        a27["platformVersion"] = "27"
        sr["assets"].append(a27)
json.dump(d, open(p, "w"), indent=1)
PY
  echo "[manifest] platformVersion 27 agregado (misma config que macOS 26)."
fi

# 3. Asset en el cache del driver, con SHA verificado contra el manifest
mkdir -p "$CACHE_DIR"
if [ -f "$CACHE_DIR/$DMG_NAME" ] && [ "$(shasum -a 256 "$CACHE_DIR/$DMG_NAME" | cut -d' ' -f1)" = "$DMG_SHA" ]; then
  echo "[asset] ya instalado y verificado."
else
  curl -fsS -m 120 -L -o "$CACHE_DIR/$DMG_NAME" "$RELEASE_URL"
  echo "$DMG_SHA  $CACHE_DIR/$DMG_NAME" | shasum -a 256 -c - > /dev/null
  echo "[asset] instalado y verificado (SHA256 ok)."
fi

echo
echo "Workaround aplicado. Estado del plano real:"
echo "  - manifest: cubre 27 (asset de macOS 26)"
echo "  - asset:    $CACHE_DIR/$DMG_NAME"
echo
echo "Falta un permiso manual de macOS para que los symlinks de preferencias"
echo "se creen dentro del Group Container de VoiceOver:"
echo "  System Settings -> Privacy & Security -> Full Disk Access ->"
echo "  agregar y tildar el proceso que ejecuta los tests (p.ej. Terminal)."
echo
echo "Despues: npm test  (el test real deja de saltearse y cierra S3)."
