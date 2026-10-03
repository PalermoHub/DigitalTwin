# File e cartelle da mettere sul VPS (opzione B)

Elenco di ciò che il viewer legge davvero, ricavato da `urlDati(...)` / `pmt(...)` in `js/` e verificato con le richieste del browser (2026-10-02). Origine delle cartelle: `dati/` del repository. Destinazione suggerita: `/var/www/digitaltwin-dati/` sul VPS, servita da Apache (vedi `docs/ISTRUZIONI_SERVER.md`).

## 1. Da copiare: file locali usati dal viewer (≈ 64 MB)

| Percorso in `dati/` | Dimensione | Note |
|---|---:|---|
| `catalogo.json` | 71 KB | cache **breve** (cambia a ogni aggiornamento) |
| `mobilita/sicurezza/archi.pmtiles` | 6,6 MB | |
| `mobilita/sicurezza/incidenti.pmtiles` | 1,1 MB | |
| `mobilita/sicurezza/hotspot.pmtiles` | 98 KB | |
| `mobilita/sicurezza/vie.json` | 424 KB | ricerca incidenti |
| `monumenti/monumenti.geojson` | 1,7 MB | |
| `monumenti/monumenti_edifici.pmtiles` | 1,5 MB | |
| `monumenti/foto/` (solo le **1893** foto referenziate) | 47 MB | vedi comando sotto: nella cartella ce ne sono 2054 |
| `scuole/scuole.geojson` | 113 KB | |
| `scuole/scuole_edifici.geojson` | 237 KB | |
| `scuole/seggi.geojson` | 20 KB | |
| `scuole/seggi_edifici.geojson` | 51 KB | |
| `trasporto/fermate.geojson` | 351 KB | |
| `trasporto/linee.geojson` | 353 KB | |
| `trasporto/orari.json` | 1,6 MB | formato compatto |
| `popolazione/sezioni_indicatori.compatto.json` | 319 KB | |
| `popolazione/sezioni_indicatori_2023.compatto.json` | 189 KB | |
| `civici-omi/civici_vie.json` | 203 KB | |
| `civici-omi/civici/` (32 file `00.json`…`31.json`) | 2,4 MB | |

Per le foto, copia solo quelle usate:

```bash
cd dati
python3 - <<'E' > /tmp/foto-usate.txt
import json
for f in json.load(open("monumenti/monumenti.geojson"))["features"]:
    p = f["properties"].get("foto")
    if p and not p.startswith("http"):
        print("monumenti/" + p)
E
rsync -av --files-from=/tmp/foto-usate.txt . utente@82.165.59.122:/var/www/digitaltwin-dati/
```

## 2. Opzionale: copia dei file che oggi arrivano da altri repository (≈ 92 MB)

Oggi il viewer li legge dai link nel catalogo (`palermohub.github.io`, `gbvitrano.github.io`). Copiarli sul VPS serve a ottenere cache lunga e a non dipendere da repo altrui. **Prima controlla la licenza** di ciascuno (`scripts/fonti.py`).

| Percorso in `dati/` | Dimensione | Origine attuale |
|---|---:|---|
| `catasto/particelle.pmtiles` | 40 MB | palermohub.github.io/PRG2004 |
| `edifici/edificato_pop.pmtiles` | 20 MB | gbvitrano.github.io/palermo_popolazione |
| `prg-vincoli/prg.pmtiles` | 9,2 MB | palermohub.github.io/PRG2004 |
| `popolazione/geo_sezioni_2021.pmtiles` | 7,1 MB | gbvitrano.github.io/palermo_popolazione |
| `civici-omi/civici_0226.pmtiles` | 6,8 MB | palermohub.github.io/PRG2004 |
| `civici-omi/Zone_OMI_2025_II.pmtiles` | 4,9 MB | palermohub.github.io/PRG2004 |
| `civici-omi/immobili_comunali_2024.pmtiles` | 4,2 MB | palermohub.github.io/PRG2004 |
| `popolazione/confini_amministrativi.pmtiles` | 0,2 MB | gbvitrano.github.io/palermo_popolazione |

Questi file **non sono in `dati/`**: vanno scaricati dal loro URL (campo `url` di `catalogo.json`) e copiati con lo stesso percorso relativo. Poi si aggiorna il campo `url` nel catalogo.

**Cartelle di tile `z/x/y` (non copiate finora, 7 tileset):** `prg-zto`, `prg-ppe`, `prg-va`, `prg-vl`, `terrain-dem`, `elevazione`, `griglia`. Sono migliaia di piccoli file PNG/PBF: si possono copiare, ma solo se serve davvero (meglio convertirle in PMTiles/MBTiles prima).

## 3. Già sul server

Non vanno ricopiati: i download ANNCSU (`/export/geoparquet/`, `/export/gpkg/`) e l'API `developers.coseerobe.it/api/v1/…`.

## 4. Da NON copiare

Sorgenti e file di lavoro degli script, non letti dal viewer:

- `mobilita/sicurezza/*.geojson` (`archi`, `hotspot`, `hotspot_griglia`, `incidenti`, `incidenti_snap`, `rete_rischio`): input di `scripts/sicurezza_stradale.py`.
- `monumenti/monumenti_edifici.geojson`, `tutti.json`, `luoghi.json`, `correzioni.json`, `confine_comunale.geojson`, `_cache/`, il `.kml` e le 161 foto `kml-*.jpg` non referenziate (3,7 MB).
- `scuole/scuole_asili_comunali.geojson`, `scuole/sezioni_elettorali_di_palermo_ac.geojson`: input di `scripts/scuole.py`.
- `gtfs/` (feed GTFS grezzo), `edifici/*.gpkg`, `mobilita/*.gpkg`, `terreno/`, `prg-vincoli/*.gpkg`, `societa/`, `verde/`, `servizi/`: non usati a runtime.
- `MANIFEST.tsv`, `README.md`.
- `delete/`: file già messi da parte.

## 5. Modifica necessaria nell'app

I file locali si risolvono rispetto alla pagina (`DATI = 'dati/'` in `js/core/config.js`). Per leggerli dal VPS serve cambiare quella base (per esempio `https://developers.coseerobe.it/dati/`) oppure aggiungere il campo `url` a ogni voce locale del catalogo. Fino ad allora il viewer continua a usare i file del repository: copiare i dati sul VPS non rompe nulla. La modifica va fatta dopo che il VPS serve i file con CORS e Range corretti (vedi la verifica in `docs/ISTRUZIONI_SERVER.md`).

## 6. Versioni nel nome

Con `Cache-Control: immutable` (cache di un anno) ogni file aggiornato deve cambiare nome (es. `archi.2026-10.pmtiles`). Gli unici file con cache breve sono `catalogo.json` e, se si aggiorna spesso, `orari.json`.

## Riepilogo dimensioni

| Gruppo | Dimensione |
|---|---:|
| Obbligatori (sezione 1) | ≈ 64 MB (di cui 47 MB di foto) |
| Opzionali (sezione 2) | ≈ 92 MB |
| **Totale** | **≈ 156 MB** |
