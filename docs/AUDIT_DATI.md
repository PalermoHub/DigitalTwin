# Audit dati e caricamento — 2026-10-02

## Spostamento dei dati non usati

Spostati 68 file (264 MB) in `dati/delete/`.

- **Criterio:** un file è "non usato" se il suo nome non compare né in `js/`/`index.html` né in `scripts/`/`tests/`. Nessun nome dinamico (`${...}`) corrisponde ai file spostati.
- **Esclusi** (citati dagli script, sorgenti della pipeline): `rete_rischio.geojson`, `incidenti_snap.geojson`, `hotspot_griglia.geojson`, `dsm.tif`, `Variente_Generale_PRG_2004.gpkg`.
- **Non toccati:** i file del catalogo ospitati su altri repository GitHub (88 voci) e quelli fuori catalogo (strati sicurezza, trasporto, scuole, monumenti).
- **File principali spostati:** `assi_stradali_gb.gpkg` (78 MB), `aggregati_strutturali_palermo.gpkg` (57 MB), `082053_Palermo-…gpkg` (41 MB), `matrix_pendoLAVORO_2021.txt`, `Vincoli areali.geojson`, i 4 `potere_acquisto_*.geoparquet`, i CSV degli incidenti, `aree_verdi.geojson`.
- **Reversibile:** `dati/` non è tracciato da git (solo `MANIFEST.tsv`, `README.md`, `catalogo.json`). Il ripristino è manuale:
  - elenco in `dati/delete/SPOSTATI.txt`;
  - righe del manifest in `dati/delete/MANIFEST_spostati.tsv`.
- **Manifest:** le 68 righe sono state tolte da `MANIFEST.tsv`; `verifica_manifest` torna senza errori e i 30 test di `tests/test_valida_dati.py` passano. `catalogo.json` non è stato modificato: elenca ancora quei file, ma il viewer non li richiede mai.
- **Non rilanciati:** i test del viewer (`test_viewer.py`) e quelli JS.

## Audit di caricamento

Misurato con Chromium reale contro il server locale (`scripts/serve.py`) e i link remoti.

| Voce | Esito |
|---|---|
| Avvio | 140 richieste, **17,8 MB**, 6 s |
| Richiesta più pesante | `monumenti.geojson` (1,7 MB) + `monumenti_edifici.geojson` (2,8 MB); in gzip, come su Pages, 250 KB + 729 KB. Il «doppio download» era un artefatto del server locale senza cache |
| Dati remoti | `edificato.pmtiles`, `particelle.pmtiles`, `geo_sezioni_2021.pmtiles` a Range request |
| JSON statici | `sezioni_indicatori.json` (1 MB) e `sezioni_indicatori_2023.json` (1 MB) all'avvio |
| Strati 3D | I tile `.png` di terreno e rilievo costano pochi KB |
| Strati sicurezza | `archi.pmtiles` locale: 8 Range request da ~774 KB attivando gli hotspot |
| Cache | Link remoti con `max-age=600`; solo `tiles.openfreemap.org` ha cache lunga |
| Compressione | Il server locale non comprime; su GitHub Pages i file di testo sono compressi, quindi il dato locale non conta |

Il peso vettoriale è già in gran parte risolto con PMTiles. Quello che resta:

1. **Monumenti in PMTiles — fatto (solo poligoni).** `monumenti_edifici.geojson` (729 KB gz) è ora `monumenti_edifici.pmtiles` (1,47 MB in tutto, ~180 KB scaricati all'avvio). Si genera con `python3 scripts/monumenti.py abbina` (richiede `tippecanoe`). I punti restano in GeoJSON (250 KB gz): servono il clustering nativo e il filtro per categoria, e in PMTiles si guadagnerebbe pochissimo. Verificati: 23 test su monumenti e 788 poligoni disegnati a zoom 16.
2. **Tabelle in formato compatto — fatto.** Codifica in `scripts/compatta_dati.py` (e `codifica_orari` in `gtfs.py`), decodifica in `js/core/compatto.js` (restituisce la forma originale: il resto del viewer non cambia). Round-trip verificato in `tests/test_compatta_dati.py` e `tests/js/compatto.test.mjs`.

   | File | Prima (gzip) | Dopo (gzip) | Come |
   |---|---|---|---|
   | `sezioni_indicatori.json` (all'avvio) | 1010 KB | **85 KB** | colonne, solo i 15 campi usati |
   | `sezioni_indicatori_2023.json` (all'avvio) | 884 KB | **68 KB** | idem |
   | `trasporto/orari.json` (alla prima scheda) | 503 KB | **154 KB** | orari in differenze |
   | `civici_index.json` (alla prima ricerca) | 1320 KB | **64 KB** (+ ~25 KB per ogni file di civici, solo cercando «via + numero») | indice leggero delle vie + 32 file di civici per hash del nome |

   Nuovi file: `dati/popolazione/sezioni_indicatori{,_2023}.compatto.json`, `dati/civici-omi/civici_vie.json` e `dati/civici-omi/civici/00…31.json`; `orari.json` mantiene il nome ma è compatto. Rigenerazione: `python3 scripts/compatta_dati.py popolazione|civici`, `python3 scripts/gtfs.py`. I vecchi JSON remoti non sono più letti dal viewer (restano nel catalogo come fonte; i test li usano come riferimento).
   Per i civici la divisione per iniziale non funziona (663 KB dei 790 KB finivano sotto la «V» di «Via»): si usa un hash FNV-1a del nome su 32 file, identico in Python e JS (testato). Misurato nel browser: «via roma» scarica 64 KB gzip, «via roma 12» altri ~180 KB (7 file, perché trova anche Romagna, Romania…).
   Verificati: 177 test JS, 35 test del viewer (popolazione, trasporto, ricerca), `test_gtfs`, `test_valida_dati`, `test_compatta_dati`.
3. **Host terzi.** Ogni sorgente remota costa un handshake DNS/TLS: un `preconnect` su `gbvitrano.github.io` e `palermohub.github.io` fa guadagnare qualche centinaio di ms.
4. **Cache a 10 minuti sui remoti.** Non dipende da noi: servirebbe copiare i PMTiles su un host con cache lunga (es. Cloudflare R2).
