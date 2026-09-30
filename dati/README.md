# Dati del Digital Twin di Palermo

> **Aggiornamento 2026-10-01:** i file già pubblicati su GitHub Pages **non sono più copiati qui**: nel
> `MANIFEST.tsv` hanno la colonna `url` e il viewer li legge dal link (risolto da `catalogo.json`).
> Prima di cancellare ogni copia ho verificato che hash SHA-256 e dimensione fossero identici al file
> online: 81 file (268 MB) rimossi. Restano in locale solo i file senza un link (80 file, ≈ 350 MB) e
> `verde/04_foto.csv`, che online ha lo stesso peso ma contenuto diverso.
> Le sezioni qui sotto descrivono il contenuto *logico* di ogni cartella, indipendentemente da dove sta il file.

Copia di lavoro (605 MB, 161 file) dei dati indicati nel piano `../docs/PIANO_DigitalTwin_Palermo.md`.
Copiati il 2026-09-30 **senza modifiche**. `MANIFEST.tsv` riporta per ogni file percorso, dimensione, SHA-256 e sorgente originale.
Le copie sono state verificate per dimensione contro l'origine. Non sono ancora validate nei contenuti (CRS, attributi, copertura).

## Contenuto

| Cartella | Cosa c'è | Note |
|---|---|---|
| `catasto/` | `particelle.pmtiles` (243.681 particelle, SITR settembre 2026) | sorgente canonica; campi `Foglio`, `Paricella` |
| `prg-vincoli/` | `prg.pmtiles` (layer `zto`, `cs`, `ns`, `va`, `vl`); `Variente_Generale_PRG_2004.gpkg`; vincoli areali/lineari GeoJSON; parcheggi PRG; vincoli architettonici e `ListaVincoli.csv` | PRG vigente = 2004. I vincoli architettonici sono tabelle senza geometria |
| `civici-omi/` | civici (febbraio 2026), zone OMI 2025 sem. II, immobili comunali 2024 | PMTiles |
| `edifici/` | `edificato.gpkg` (111.844 edifici 3D, **unica copia**), `buildings_wgs84.pmtiles`, `edificato_pop.pmtiles`, `aggregati_strutturali_palermo.gpkg` | |
| `terreno/` | DTM 5 m (`palermo_dtm5m.tif`, EPSG:6875), `dsm.tif`, statistiche per zona in JSON | |
| `popolazione/` | sezioni ISTAT 2021 e indicatori 2021/2023 (PMTiles, JSON, GPKG, CSV, XLSX), confini, circoscrizioni, quartieri, UPL, serie storiche ISTAT | 2023: 3.090 sezioni contro 3.600 del 2021 |
| `societa/` | dispersione scolastica, potere d'acquisto (parquet), censimento 2021 | |
| `clima/` | LST estiva, statistiche per sezione, regressioni, geo (PMTiles/GeoJSON) | |
| `mobilita/` | grafo stradale 2026-07-01, assi stradali, ZTL, pendolarismo 2021 (matrice OD), incidenti | **GTFS escluso** (rinviato) |
| `verde/` | rilievo alberi, specie, costi, O₂/CO₂, aree verdi, verde OSM | |
| `servizi/` | fontanelle, isocrone 5/10 min, PEBA (209 punti) | senza foto |

## Non copiato, e perché

- `palermo_dtm_5m/dati/relief` (3,7 GB) e `analisi/*.tif` (945 MB): derivati del DTM, rigenerabili dalle pipeline. Da recuperare solo i layer necessari.
- LiDAR di `Verde_Urbano` (`.laz`/`.las`, ≈1,7 GB): troppo grandi. Serve un derivato leggero (chioma, altezza).
- GTFS AMAT (2,5 GB, 2014–2018): rinviato; si scaricherà il feed 2026.
- GeoJSON pesanti duplicati dei PMTiles (`punti_pop_1`, `edificato_wgs84`, `edificato_pop`: ≈260 MB): rigenerabili da `edificato.gpkg` e dalle sezioni.
- Catasto storico (`particelle_0125…0926`, `.gpkg` 2024) e `particelle_backup_*`: solo la versione canonica.
- PRG 2025/PUG (non vigenti, solo raster/PDF), scuole 2017 (obsolete), OMI grezzi multi-semestre (140 MB: c'è già `Zone_OMI_2025_II`), foto PEBA (≈400 MB), cartelle `node_modules`, log, `*:Zone.Identifier`.
- Dati sensibili o di terzi: anagrafe, TARI, elezioni, beni confiscati, georadar OpenFiber. Da valutare prima.

## Cose da verificare (fase 0)

1. `particelle.pmtiles` è un PMTiles di sola visualizzazione: il sorgente `particelle.geojsonl` non è stato trovato. Per calcoli serve recuperarlo.
2. Verificare CRS, campi e copertura di ogni file; i PMTiles sono in EPSG:3857, il DTM in EPSG:6875.
3. Licenze e ripubblicabilità di ogni dataset prima di un rilascio.
4. File oltre 100 MB: nessuno; il più grande è `assi_stradali_gb.gpkg` (74 MB). Se il repo andrà su GitHub, restare sotto 100 MB per file.
