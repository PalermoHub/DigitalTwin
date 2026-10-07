#!/usr/bin/env bash
# Misura Lighthouse (desktop e mobile) e stampa un riassunto.
# Uso: scripts/lighthouse.sh [URL] [CARTELLA_REPORT]
#   URL predefinito: http://localhost:8000/ (avviare prima `python3 scripts/serve.py`)
# Serve Node (npx) e un Chromium: usa quello di Playwright, oppure CHROME_PATH.
# Nota: senza GPU MapLibre va in render software e gonfia TBT/TTI; per cifre
# confrontabili misurare sempre con lo stesso metodo, meglio sul sito pubblicato.
set -euo pipefail
URL="${1:-http://localhost:8000/}"
OUT="${2:-docs/misure/$(date +%F)}"
PORTA=9333
CHROME="${CHROME_PATH:-$(ls -d "$HOME"/.cache/ms-playwright/chromium-*/chrome-linux*/chrome 2>/dev/null | sort -V | tail -1)}"
[ -x "$CHROME" ] || { echo "Chromium non trovato: imposta CHROME_PATH" >&2; exit 1; }
mkdir -p "$OUT"
PROFILO="$(mktemp -d)"
"$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
  --remote-debugging-port="$PORTA" --user-data-dir="$PROFILO" about:blank >/dev/null 2>&1 &
PID=$!
trap 'kill "$PID" 2>/dev/null || true; rm -rf "$PROFILO"' EXIT
for _ in $(seq 1 20); do curl -s "localhost:$PORTA/json/version" >/dev/null && break; sleep 1; done
npx --yes lighthouse "$URL" --port="$PORTA" --preset=desktop --output=json --output-path="$OUT/lh-desktop.json" --quiet
npx --yes lighthouse "$URL" --port="$PORTA" --output=json --output-path="$OUT/lh-mobile.json" --quiet
node -e '
const fs = require("fs");
for (const f of ["desktop", "mobile"]) {
  const r = JSON.parse(fs.readFileSync(process.argv[1] + "/lh-" + f + ".json"));
  const c = Object.values(r.categories).map(x => x.id + ":" + Math.round(x.score * 100)).join("  ");
  const m = k => r.audits[k].displayValue;
  console.log(f.padEnd(8), c);
  console.log("        FCP", m("first-contentful-paint"), "LCP", m("largest-contentful-paint"), "TBT", m("total-blocking-time"), "TTI", m("interactive"), "CLS", m("cumulative-layout-shift"));
}' "$OUT"
