# Misura di base, 2026-10-07

Metodo: `scripts/lighthouse.sh` su `scripts/serve.py` (porta 8000), Chromium 155 headless senza GPU.
Limiti: render software di MapLibre (TBT e TTI gonfiati), nessuna compressione, `no-store` su html/js/css.
Rifare la misura sul sito pubblicato prima di fissare gli obiettivi.

| | Performance | Accessibilità | Best practices | SEO |
|---|---|---|---|---|
| Desktop | 33 | 95 | 100 | 100 |
| Mobile | 27 | 100 | 100 | 100 |

| | FCP | LCP | TBT | TTI | CLS |
|---|---|---|---|---|---|
| Desktop | 1,6 s | 4,7 s | 8,6 s | 12,2 s | 0,004 |
| Mobile | 5,7 s | 7,2 s | 13,6 s | 21,8 s | 0,029 |

Richieste più pesanti: `dati/monumenti/monumenti.geojson` 1,7 MB, `edificato.pmtiles` (3 richieste, 2,2 MB in tutto), `maplibre-gl.js` 785 KiB.
Accessibilità desktop: `#strati-chip` con `role="list"` senza `listitem`; `intersezione.svg` senza dimensioni.
