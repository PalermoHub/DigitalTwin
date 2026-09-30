# Digital Twin di Palermo — Fase 0 + Fase 1: design

Stato: **bozza, in attesa di revisione dell'utente.** Data: 2026-09-30.
Riferimento: `docs/PIANO_DigitalTwin_Palermo.md` (inventario, rischi, fasi 0–10).

## 1. Obiettivo e ambito

Consegnare la **base** del gemello: un catalogo dati verificato (fase 0) e un viewer web unico che
sovrappone i dati già pronti e restituisce una scheda del luogo al click (fase 1).
Tutto il resto del piano (clima, ombre, mobilità, verde, scenari, GTFS) resta fuori da questo spec e avrà i propri.

Assunzioni da confermare (l'utente non ha ancora risposto):

- Pubblico: esplorazione di dati aperti, stile delle app OpenDataSicilia esistenti (non uso professionale).
- Tema di partenza: territorio e regole del suolo (catasto, PRG, vincoli) + popolazione + edifici, perché sono i dati più maturi e già in PMTiles.
- Solo comune di Palermo, nessun backend, nessun dato sensibile.

**Fuori ambito:** GTFS, terreno 3D e ombre, scenari what-if, LiDAR, dati live, dati personali.

## 2. Esito della validazione dati (fase 0, già eseguita in sola lettura)

| Dato | Verifica | Esito |
|---|---|---|
| `edifici/edificato.gpkg` | EPSG:4326, 3D MultiPolygon, 111.844 feature | ok. Campi: `altezza`, `quota_gronda`, `quota_piede`, `area_mq`, `volume_mc`, `floorspace`, `occupancy`, `source` |
| `terreno/palermo_dtm5m.tif`, `dsm.tif` | EPSG:6875, 3680×3871 px, passo ≈5 m, nodata −9999 | ok, stessa griglia |
| `prg-vincoli/Variente_Generale_PRG_2004.gpkg` | EPSG:4326; `Zonizzazione` 5.880, `Netto Storico` 6.032, `Vincoli areali` 662, `Vincoli lineari` 99, `Centro Storico` 1 | ok. Campi `ZTO`, `DESCRIZION`, `tipo`, `descrizone` (refuso nel dato) |
| `popolazione/sezioni_indicatori*.json` | 2021: 3.600 sezioni, 2023: 3.090, chiave `SEZ21_ID` intera e unica | **ogni sezione 2023 esiste nel 2021**; 510 sezioni 2021 senza dato 2023 |
| `mobilita/assi_stradali_gb.gpkg` | contiene 8 layer: `assi_stradali` (5.039), `Assi stradali_tratti-upl`, civici ANNCSU (165.027), `Numeri_civici` (141.958), sezioni 2021 (3.600), UPL (55), viario elettorale | ok: è un contenitore multi-tema, non solo strade |
| `mobilita/082053_Palermo-…gpkg` | estratto OSM (punti, linee, poligoni) | sorgente del grafo pedonale/stradale per le isocrone (fasi successive) |
| `edifici/aggregati_strutturali_palermo.gpkg` | 46.852 aggregati, CRS proiettato diverso (ID 7794) | ok, da riproiettare |
| `catasto/particelle.pmtiles` | 243.681 particelle, z12–18, campi `Foglio`, `Paricella` | solo visualizzazione; sorgente vettoriale non trovato |

CRS in uso: 4326 (vettoriali web), 3857 (PMTiles), 6875 (DTM/DSM), 7794 (aggregati). La conversione va dichiarata una volta sola nel catalogo.

Da verificare in implementazione (non ancora noto): campi e altezze di `buildings_wgs84.pmtiles`; nomi dei layer e campi dei PMTiles `clima/*`, `civici-omi/*`; zoom minimo utile per ogni tile.

## 3. Architettura

```
DigitalTwin/
  index.html                 viewer (unica pagina)
  css/  js/                  ES modules, nessun bundler (come palermo_popolazione)
  js/layers/<tema>.js        un modulo per tema: sorgenti, stili, scheda
  js/core/{mappa,catalogo,scheda,stato}.js
  dati/                      dati copiati + MANIFEST.tsv + README.md
  dati/catalogo.json         generato da scripts/valida_dati.py
  scripts/valida_dati.py     fase 0: legge i dati, scrive catalogo e report
  docs/                      piano, spec, catalogo.md
  tests/
```

- **MapLibre GL JS** + protocollo `pmtiles`. Stack già usato in `palermo_popolazione`, `Fontanelle`, `catasto-app`. Nessun backend.
- **Un modulo per tema** con interfaccia fissa: `{ id, titolo, sorgenti, layer, pannello(), scheda(features) }`. Aggiungere un tema non tocca gli altri.
- **Catalogo**: `catalogo.json` elenca per ogni dato percorso, formato, CRS, conteggio, campi, bbox, data, fonte, licenza (se nota). Il viewer legge solo da qui: nessun percorso scritto a mano nei moduli.
- **Scheda del luogo**: al click si interrogano i layer visibili con `queryRenderedFeatures`, si raggruppano per tema e si mostrano in un pannello (particella/foglio, zona PRG e vincoli, sezione e indicatori, edificio con altezza e volume, civico, zona OMI).
- **Chiavi di join**: `SEZ21_ID` per le sezioni; per catasto, PRG, edifici la relazione è **spaziale** (il punto cliccato), non per chiave. Nessuna join pre-calcolata in fase 1.
- **Server di sviluppo**: deve supportare HTTP Range (i PMTiles lo richiedono); `python -m http.server` non basta. Si riusa `palermo_dtm_5m/run_server.py` se adatto.
- **Hosting**: GitHub Pages; ogni file sotto i 100 MB (il maggiore è 74 MB).

## 4. Funzioni del viewer (fase 1)

1. Mappa di base (OSM raster) con confini: circoscrizioni, quartieri, UPL, sezioni.
2. Strati attivabili: catasto (visibile da zoom 15), zonizzazione PRG, vincoli areali/lineari, civici, zone OMI, immobili comunali.
3. Edifici 3D (estrusione dall'altezza) da zoom 15, **se** `buildings_wgs84.pmtiles` ha l'altezza; altrimenti si usa `edificato_pop.pmtiles` o si rigenera il tile dal gpkg.
4. Popolazione: coropletico per sezione con indicatore scelto da un menu, toggle 2021/2023; le sezioni senza dato 2023 sono mostrate grigie con legenda "senza dato".
5. Ricerca di indirizzo/civico (dai civici già in tile).
6. Scheda del luogo al click (punto 3 dell'architettura).
7. Pannello crediti: fonte e data di ogni strato (da `catalogo.json`).

**Non in fase 1:** disegno di aree, raggio mobile, bivariate, confronto A/B, terreno 3D.

## 5. Gestione errori e limiti

- Un PMTiles mancante o non caricabile disattiva solo il suo strato e mostra un avviso; il viewer continua a funzionare.
- I dati 2023 sono **stime campionarie** (censimento permanente): la legenda lo dichiara.
- Avviso permanente su catasto, PRG e vincoli: informativi, senza valore legale; il PRG 2004 può non includere varianti successive.
- Il confronto 2021→2023 si calcola solo sulle 3.090 sezioni comuni.

## 6. Test e verifica

- `scripts/valida_dati.py` **fallisce** se: un file del manifesto manca o ha hash diverso; un PMTiles non si apre; l'unicità di `SEZ21_ID` viene meno; il 2023 contiene sezioni assenti nel 2021; il CRS dichiarato non coincide con quello letto.
- Test automatici (pytest) per le regole sopra, con dati reali (sono già in `dati/`).
- Verifica del viewer con browser automatico (Playwright): carica senza errori in console, ogni strato si accende, il click su un punto noto (es. Teatro Massimo) restituisce particella, zona PRG e sezione.
- Definizione di "fatto": catalogo generato e validato, viewer online in locale con i 7 punti sopra funzionanti, nessun errore in console, pagina crediti completa.

## 7. Rischi specifici di questa fase

- Il catasto in PMTiles perde precisione agli zoom bassi: la scheda di particella funziona solo da zoom ≥ 15.
- Il peso iniziale (PMTiles + JSON da 6 MB) può rendere lento il caricamento: i JSON degli indicatori si caricano al primo uso del tema popolazione.
- L'altezza degli edifici viene da più fonti (campo `source`): l'estrusione può essere irregolare dove l'altezza è stimata.
- La directory `DigitalTwin/` **non è un repository git**: non posso fare commit. Serve `git init` se vuoi lo storico.

## 8. Decisioni da approvare

1. Ambito: fase 0 + 1 come sopra, tutto il resto rinviato.
2. Stack: MapLibre + PMTiles + ES modules, nessun bundler, nessun backend.
3. Le assunzioni della sezione 1 (pubblico, tema di partenza).
4. Fare `git init` in `DigitalTwin/` (sì/no).
