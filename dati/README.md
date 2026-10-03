# Dati del Digital Twin di Palermo

> **Aggiornamento 2026-10-01:** i file già pubblicati su GitHub Pages **non sono più copiati qui**: nel
> `MANIFEST.tsv` hanno la colonna `url` e il viewer li legge dal link (risolto da `catalogo.json`).
> Prima di cancellare ogni copia ho verificato che hash SHA-256 e dimensione fossero identici al file
> online: 81 file (268 MB) rimossi. Restano in locale solo i file senza un link (80 file, ≈ 350 MB) e
> `verde/04_foto.csv`, che online ha lo stesso peso ma contenuto diverso.
> I **tileset** (cartelle `z/x/y`: PRG ZTO/ppe/VA/VL, terrain, elevazione, griglia_pbf) non sono mai stati copiati: stanno nel catalogo come voci `tileset` con il loro URL.
> La copia iniziale di `palermo_popolazione/data` aveva preso solo i file e saltato le sottocartelle `terrain/`, `elevazione/`, `griglia_pbf/`: ora sono nel viewer, letti dal link.
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

## Monumenti (`monumenti/`)

Due fonti, unite senza duplicati (`scripts/monumenti.py` e `scripts/monumenti_kml.py`):

- **Portale del Turismo del Comune di Palermo** («Cosa Vedere», 10 categorie): `luoghi.json` (264 luoghi con descrizione e link), `correzioni.json`
  (coordinate del portale sostituite dove generiche o in disaccordo con OpenStreetMap e indice civici), `_cache/` (pagine scaricate).
- **«Mappa monumentale di Palermo e dell'Agro Palermitano»** di Marcello Petrucci (KML amatoriale, 4.826 punti): le coordinate sono più precise, quindi dove un luogo del portale
  ha un omonimo vicino nel KML ne prende la posizione; gli altri punti entro i limiti della mappa si aggiungono, senza i duplicati
  (stesso nome entro 60 m, o già luogo del portale entro 100 m). Il KML non ha cartelle: la categoria si deduce dal nome.

Il Portale e il KML includono luoghi di Monreale, Bagheria, Villabate, Carini e altri comuni vicini: `abbina` tiene solo quelli dentro il confine comunale
(`confine_comunale.geojson`: confine OpenStreetMap (ODbL, via Nominatim) unito a quello ISTAT di `societa/potere_acquisto_comuni.geoparquet`, con 50 m di tolleranza per costa e moli).
`tutti.json` conserva tutti i luoghi (4.464), il viewer ne mostra 4.039.

Risultato: `tutti.json` e `monumenti.geojson` (punto di ogni luogo con i dettagli + poligono dell'edificio di `edifici/edificato.gpkg`:
«contenuto» se il punto cade dentro, «vicino» se entro 25 m; per porte e archi tutti gli edifici entro 12 m, cioè i piloni).
`foto/`: miniature JPEG (480 px per il portale, 360 px per il KML; le foto del KML sono scaricate da qui perché Google le blocca nel browser).
Ordine: `monumenti.py scarica` → `correggi` → `monumenti_kml.py unisci` → `monumenti_kml.py foto` → `monumenti.py abbina`.

I testi e le foto sono del Comune di Palermo e dell'autore della mappa: verificarne le condizioni d'uso prima di ripubblicarli.

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

## Scuole e sezioni elettorali (`scuole/`)

Due GeoJSON del Comune di Palermo (dati aperti, 2017): `scuole_asili_comunali.geojson` (271 punti: asili nido, plessi, sedi degli istituti) e
`sezioni_elettorali_di_palermo_ac.geojson` (133 sedi con l'elenco delle sezioni). `scripts/scuole.py` li ripulisce e abbina ogni punto a un poligono di
`edifici/edificato.gpkg` (stessa regola dei monumenti). Le sedi elettorali con lo stesso indirizzo di una scuola (75 su 133) vengono unite alla scuola (campi `seggio_*`); le altre restano in `seggi.geojson`. Produce `scuole.geojson`, `seggi.geojson` (punti con i dettagli) e `scuole_edifici.geojson`,
`seggi_edifici.geojson` (poligoni con solo id, nome e tipo). Condizioni d'uso da verificare prima di ripubblicarli.

## Trasporto pubblico (`gtfs/` → `trasporto/`)

Feed GTFS di AMAT Palermo (71 linee: 67 bus e 4 tram; 1.668 fermate; validità 25/08/2026–31/10/2026) in `gtfs/`. `scripts/gtfs.py` lo trasforma in `trasporto/fermate.geojson`
(punti con linee che passano e accessibilità; membro `validita`), `trasporto/linee.geojson` (un tracciato per linea e direzione, con le fermate in sequenza) e `trasporto/orari.json`
(partenze per fermata, linea, direzione e servizio in minuti dalla mezzanotte; le date di ogni servizio vengono da `calendar_dates`: il feed non ha `calendar.txt`).
Come `scuole/`, `trasporto/` non sta in git: si rigenera con `python3 scripts/gtfs.py`. Alla scadenza del feed va sostituito `gtfs/` e rilanciato lo script.

## Sicurezza stradale (`mobilita/sicurezza/`)

Dallo studio «Rete stradale» (cartella `Rete-Stradale 01`, fase 2 sicurezza con contesto di pendenza e PAI): `rete_rischio.geojson` (18.736 archi OSM con incidenti, tasso/km, pendenza, TWI, rischio PAI),
`hotspot_griglia.geojson` (celle da 250 m, Getis-Ord Gi*) e `incidenti_snap.geojson` (23.490 incidenti 2015–2023 agganciati alla rete; il 2019 non è nel dataset pulito).
`python3 scripts/sicurezza_stradale.py` produce `archi.pmtiles`, `hotspot.pmtiles` e `incidenti.pmtiles` con campi ridotti: `classe` (0–3) = quartile del tasso per i tratti ≥ 20 m, solo le celle
significative (90/95/99%), solo gli incidenti con snap ≤ 60 m (23.457) e l'`anno` ricavato dalla data. Come `trasporto/`, i PMTiles non stanno in git: si rigenerano con lo script.
`vie.json` (2.806 vie con nome: incidenti, mortali, km, punto, riquadro e posto in classifica) alimenta la ricerca; gli incidenti portano anche `via` per il filtro. `incidenti.geojson` (≈5,5 MB) si scarica solo cercando con «incidente»/«sinistro».
Gli archi delle 20 vie con più gravità pesata per km (vie di almeno 3 km e 30 incidenti; archi senza nome in OSM esclusi) portano i campi `via_*` (rango, gravità/km, mortali, incidenti, km).
Fonte degli incidenti: Comune di Palermo (Polizia Municipale); elaborazione PalermoHub / OpenDataSicilia.
