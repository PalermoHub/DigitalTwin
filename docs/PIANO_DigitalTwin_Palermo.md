# Digital Twin di Palermo — inventario e piano

Stato: **bozza per revisione**. Nessun codice scritto. Data: 2026-09-30.

## 1. Obiettivo (da confermare)

Piattaforma web unica, multi-tema, che unisce in un solo "gemello" navigabile (2D/3D) i dati
già raccolti su Palermo nelle cartelle di `coseerobe/`, più alcune fonti da acquisire.
Il gemello serve a **esplorare, incrociare e simulare scenari** (what-if) sul territorio comunale.

Assunzioni (da correggere se sbagliate):

- Hosting statico (GitHub Pages), nessun backend: stessa scelta di tutte le app esistenti.
- I dati sono in gran parte **statici** (censimento 2021, DTM, edificato, strade). Un gemello
  "live" è possibile solo per pochi flussi (meteo, rischio caldo) — vedi fase 8.
- Stack comune già usato nei progetti: MapLibre GL + PMTiles + JS vanilla/Vite, Python offline per le pipeline.
- Lingua UI: italiano. Licenze: attribuzione dati ISTAT, CNR-IRPI (CC BY 4.0), OSM (ODbL).

Successo = un visitatore sceglie un punto/area di Palermo e vede **tutti** gli strati
sovrapposti (terreno, edifici 3D, ombra, caldo, popolazione, verde, servizi, strade), può
confrontarli (bivariate) e lanciare almeno 3 scenari semplici.

## 2. Inventario dati già disponibili

| Tema | Cartella | Cosa contiene | Stato |
|---|---|---|---|
| Terreno | `palermo_dtm_5m` | DTM 5 m (`palermo_dtm5m.tif`, EPSG:6875), 36+ layer derivati: pendenza, esposizione, curvature, bacini, flow accumulation, TWI, SVF, viewshed, rischio PAI; per zona in JSON; `edificato.gpkg` | pronto |
| Edifici 3D | `palermo_dtm_5m/dati/edificato.gpkg`, `ombre/dati/` | 111.844 MultiPolygon 3D con `altezza`, `quota_piede`, `quota_gronda`. **Stesso file duplicato** | pronto |
| Ombre / sole | `ombre` | Pipeline Python (DSM, ore di sole, shader WebGL live), `dsm.tif` | in sviluppo |
| Caldo | `sup_temp_estiva`, `bivariate/lst_densvia`, `worklimate_*` | LST estiva per sezione, isole di calore, rischio caldo lavoro 391 comuni SI (giornaliero) | pronto / live |
| Popolazione | `palermo_popolazione`, `Istat` | Censimento 2021: 3.600 sezioni (3.079 popolate, 635.439 residenti), `sezioni_indicatori.json`. **Censimento permanente 2023** (`sezioni_indicatori_2023.json`): 3.090 sezioni con `Pop_2022`, variabili `P1…Pn`, `lon/lat`, `Area`; già usato per il confronto di tendenza 2021→2023 (fonte: Cruscotto Statistico Comunale, CC BY 4.0). Inoltre punti pop 1/10, griglia, circoscrizioni, quartieri | pronto |
| Società | `dispersione_scolastica`, `potere_d'acquisto_reale`, `bivariate/anncus` | dispersione scolastica, potere d'acquisto, indicatori socio-economici bivariati (base ANNCUS) | pronto |
| Mobilità | `Pendolarismo 2021`, `Rete-Stradale`, `Rete-Stradale 01`, `strade`, `bivariate/lst_densvia` | matrice OD pendolarismo ISTAT 2021, grafo stradale (gpkg 082053 Palermo, assi stradali), ZTL | pronto |
| Verde | `Verde_Urbano` | rilievo alberi (CSV: specie, quadrante, foto, costi), LiDAR `.laz/.las` (71+69), analisi Viale Emilia, stime O₂/CO₂, `test_gemello_digitale` | parziale |
| Servizi | `fontanelle_pa`, `Fontanelle` | 150 fontanelle, isocrone 5/10 min a piedi su rete OSM (PMTiles) | pronto |
| Accessibilità | `peba` | 209 punti PEBA con punteggio, criticità, foto | pronto |
| Clima/rischio | `bivariate/pai`, `bivariate/sicily_climate_change` | rischio idrogeologico PAI, scenari cambiamento climatico Sicilia | da verificare |
| PA digitale | `bivariate/Pa_Digitale_2026` | indicatori digitalizzazione PA | da verificare |
| Storia | `atlante moderno`, `datazione` | atlante storico (immagini), datazione edifici | da verificare |
| Strumenti | `opensdmx`, `QGIS_Plugin`, `Favorita*`, `Parco_della_Favorita` | CLI SDMX ISTAT/Eurostat, plugin QGIS, design system, parco della Favorita | riuso |

### 2b. Dati fuori da `coseerobe/` (verificati il 2026-09-30)

Due archivi aggiuntivi: `D:\GitHub - Clone` (`/mnt/d/GitHub - Clone`, repo web già pubblicati)
e `H:\Archivio Lavori\Qgis-uMap` (dati grezzi QGIS; esiste un mirror su `D:`). Il grezzo vale più delle app.

| Tema | Dove | Cosa contiene | Stato / note |
|---|---|---|---|
| **Catasto (settembre 2026)** | **Sorgente canonica (scelta dell'utente): `D:\GitHub - Clone\SiciliaHub\PRG2004\particelle\particelle.pmtiles`** (40 MB, 243.681 particelle, zoom 12–18, tippecanoe da `particelle.geojsonl`, modificato il 30/09/2026 21:15). `particelle_0926.pmtiles` (29/09/2026, 243.680 particelle) è la copia datata, una particella in meno: non usarla. Serie storica: `_0125`, `_0226`, `_0525`, `_0825`. App: `SiciliaHub/palermohub/pmtiles/catasto-app.html` + `js/catasto_script.js` (MapLibre 3.3 + pmtiles 2.4). Copia grezza vecchia: `Catasto_Sitr_Palermo_Agosto_2024.gpkg` | **pronto**, già in PMTiles, fonte SITR Regione Siciliana + Agenzia Entrate. Attributi noti dal codice: `Foglio`, `Paricella` (sic, refuso nel dato). Il sorgente `particelle.geojsonl` non l'ho trovato: se serve per analisi (non solo visualizzazione), va recuperato. Nessun dato su proprietà o rendite |
| **Zonizzazione PRG 2004 + vincoli (PMTiles)** | `SiciliaHub/PRG2004/particelle/prg.pmtiles` (9 MB) | layer `zto` (zone territoriali, campo `DESCRIZION`), `cs` (centro storico), `ns` (netto storico), `va` (vincoli areali), `vl` (vincoli lineari); zoom 12–17 | **pronto** e già web-ready: copre la parte urbanistica senza rifare la pipeline dal gpkg |
| Civici e OMI (PMTiles) | `SiciliaHub/PRG2004/civici/civici_0226.pmtiles` (civici febbraio 2026, layer `civici_wgs84`, campi `Circoscrizione`, `Civico`, `Odonimo`); `Zone_OMI_2025_II.pmtiles`; `immobili/immobili_comunali_2024.pmtiles` | civici, zone OMI 2025 sem. II, immobili comunali | **pronto** |
| Edifici (PMTiles) | `SiciliaHub/palermohub/carto/buildings*.pmtiles`; `palermo_popolazione/data/edificato.pmtiles` | edifici già in tile | pronto, da confrontare con `edificato.gpkg` (altezze) |
| Catasto, altro | `…\Agenzia Entrate\Catasto Agenzia delle Entrate` (progetto QGIS + manuale WMS); `SiciliaHub/palermohub/Immobili_pa` | servizio di consultazione cartografica AdE; particelle inesistenti | WMS da usare come sfondo, non come dato scaricabile |
| **Variante generale PRG 2004 (vigente)** | `H:\…\PRG_PA_2004\Variente_Generale_PRG_2004.gpkg`; `GitHub-Clone/SiciliaHub/PRG2004`; `Maps/variante_generale` | Layer `Zonizzazione`, `Centro Storico`, `Netto Storico`, `Vincoli areali`, `Vincoli lineari` (vettoriali); `vg_zonizzazione.geojson` 11 MB, parcheggi PRG | pronto (vettoriale) |
| PRG 2025 / PUG (non vigenti) | `H:\…\PRG Palermo 2025` (solo JPG/PDF); `Maps/prg_2025`; `OpenDataSicilia/Pug`, `Pug1`; `Comune Palermo/PUG` | solo raster/PDF | **fuori scopo**: il piano vigente è il PRG 2004. Eventuale strato informativo come immagine, in fase 9 |
| **Vincoli** | `PRG_PA_2004/geojson/Vincoli *.geojson`; `Sicilia Beni Culturali/Vincoli Architettonici/vincoli_arichitettonici_palermo.csv`, `Vincoli_in_rete/ListaVincoli.csv`; `Carta del rischio`; `PAI Geomorfologia e Idraulica` (376 MB) | Vincoli urbanistici (PRG), architettonici (CSV, da geocodificare), PAI, carta del rischio | parziale: i vincoli architettonici sono tabelle senza geometria |
| **GTFS trasporto pubblico** (rinviato) | `H:\…\gtfs_Palermo` (AMAT 2014–2018, 2,5 GB) | Feed completi; più recente agosto 2018 (1.722 fermate, 71 linee) | **fuori dalla prima versione**, per decisione dell'utente. Si aggiunge dopo, scaricando il feed 2026 (fonte e licenza da verificare) |
| Edifici e civici | `…\Unità_Volumetriche` (CTC comunale, Overture 2026-06-17, `082053_Palermo-2026-06-26`), `Civici Palermo` (numeri civici gpkg), `ANNCSU`, `Aggregati strutturali` (DPC, 268 MB) | unità volumetriche comunali, edifici Overture, civici, aggregati strutturali sismici | pronto |
| Sismica e rischi | `Maps/vuln-sismica-pa`, `…\Aggregati strutturali`, `Arpa_2022` (mappe acustiche), `Maps/inq_acust`, `Maps/rimozione_amianto`, `Diossina`, `Catasto incendi 2021/22`, `Catasto soprassuoli-fuoco` | vulnerabilità sismica, rumore, amianto, incendi, inquinamento | pronto (da normalizzare) |
| Sicurezza e traffico | `Incidenti` (2015–2023), `SiciliaHub/Palermo-Incidenti`, `limitazioni traffico`, `ZTL_Palermo`, `Mappe traffico`, `autovelox`, `Viabilità` | sinistri georeferenziati, ZTL, limitazioni, autovelox | pronto |
| Patrimonio e PA | `Anagrafe edifici pubblici - Beni immobili Comune` (1,1 GB), `Beni Comunali`, `Patrimonio`, `INVENTARIO_TERRENI`, `Edilizia degradata` (2013), `Localizzazione Uffici`, `Uffici Anagrafe`, `scuole` (+ evasione scolastica), `Biblioteca`, `Servizi_al_cittadino`, `Sale Gioco`, `Aree Verde`, `3-30-300` (verde OSM) | dotazioni e immobili comunali, degrado, scuole, servizi | pronto |
| Mercato immobiliare | `D:\GitHub - Clone\OnData\quotazioni-immobiliari-agenzia-entrate` | quotazioni OMI per zona | pronto |
| Storia | `Maps/carto_storica`, `OnData/viabilitastorica`, `Maps/atlante_*`, `Centro Storico 3D`, `Maps/cs_pa_3d` | cartografia storica, centro storico 3D | parziale |
| 3D e DEM | `Palermo-3D` (Cesium), `Maps/dem_volumetrie_pa`, `3D/dem.tif`, `DEM 5m`, `Monte_Pellegrino`, `Piana dei Colli` | prototipi 3D già fatti con Cesium e Qgis2threejs | riuso come prototipo |
| Altro | `Rete OpenFiber` (georadar), `Elezioni Palermo`, `Tari`, `Stradario`, `Territorio` (ISTAT 2011/2021), `Italia/istat_mcp_server`, `SiciliaHub/evcharginglogsicilia`, `Temperatura_Precipitazioni`, `Pa-Digitale-2026`, `Dashboard-Monitoraggio`, `gbvitrano/Palermo_Residenti_Stranieri` | elezioni, tributi, ricarica EV, meteo storico, stranieri residenti | da valutare caso per caso |

Esistono già tre repo 3D (`Palermo-3D` Cesium, `cs_pa_3d`, `dem_volumetrie_pa`): vanno esaminati
prima di scegliere lo stack 3D (vedi sez. 4).

Il lavoro a **più alto valore** è già fatto: molte app sono mature ma **isolate**. Il gemello
è soprattutto integrazione (un solo identificatore spaziale, un solo viewer, un solo catalogo).

## 3. Cosa si potrebbe fare (elenco completo)

**A. Base territoriale**
1. Viewer 3D unico: terreno (DTM) + 111k edifici estrusi + confini (circoscrizioni, quartieri, UPL, sezioni).
2. Ricerca indirizzo/civico (ANNCSU) e selezione punto / cerchio / poligono.
3. Scheda "profilo di un luogo": tutti gli indicatori sotto, per punto o area.
4. Catalogo dati unico (metadati, fonte, licenza, data) e pagina crediti.
5. Timeline demografica 2021 → 2023 (già disponibile): slider/toggle di anno, differenze per sezione, quartiere, UPL; serie estendibile con ISTAT SDMX (`opensdmx`) per gli anni intermedi a livello comunale.

**B. Clima urbano**
6. Ombre live per data/ora e ore di sole annuali/stagionali.
7. Isole di calore (LST) per sezione + SVF + materiali/verde.
8. Rischio caldo giornaliero (Worklimate) e temperatura live (MeteoHub).
9. Percorsi all'ombra per pedoni (routing pesato con ombra).
10. Scenario "+N alberi / +verde": stima delle ore di ombra e del calo di LST.
11. Scenario cambiamento climatico (dati `sicily_climate_change`).

**C. Rischio e idrologia**
12. Rischio PAI, TWI, flow accumulation, bacini: zone di ristagno e frana.
13. Pluviale/allagamento semplificato (accumulo su DTM + edifici).
14. Esposizione popolazione al rischio (sovrapposizione sezioni × PAI).

**D. Popolazione e società**
15. Demografia a raggio mobile (già esistente) integrata nel viewer.
16. Mappe bivariate a scelta utente (qualsiasi coppia di indicatori per sezione).
17. Vulnerabilità composita: anziani, reddito, dispersione scolastica, caldo, accessibilità.
18. Stima popolazione per edificio (`edificato_pop.geojson`) e dasimetria 3D.
19. Potere d'acquisto reale per quartiere.
19b. Tendenza 2021→2023: dove cresce/cala la popolazione, invecchiamento, stranieri, famiglie; ricalcolo di vulnerabilità e prossimità con i dati più recenti.
19c. Esposizione dinamica: popolazione 2023 sotto caldo/rischio PAI invece del 2021.

**E. Mobilità**
20. Grafo stradale + ZTL + isocrone a piedi/bici/auto da qualsiasi punto.
21. Pendolarismo 2021 (OD) come flussi animati tra zone.
22. Pendenza dei percorsi (DTM) per accessibilità pedonale/ciclabile.
23. Trasporto pubblico (GTFS AMAT/AMAT-Palermo) se reperibile: da acquisire.

**F. Verde e ambiente**
24. Alberi puntuali + chioma da LiDAR (altezza, volume) e stima servizi ecosistemici (O₂, CO₂).
25. Indice di verde per quartiere e deficit di verde vs popolazione.
26. Gemello di dettaglio di un asse (Viale Emilia): già prototipato in `test_gemello_digitale`.

**G. Servizi e accessibilità**
27. Fontanelle + isocrone; generalizzabile a scuole, farmacie, ospedali, parchi (MCP Cruscotto Italia / OSM).
28. PEBA: punteggio accessibilità degli edifici comunali sul viewer.
29. Indice di prossimità ("città dei 15 minuti") per sezione.
30. Copertura e buchi di servizio: dove manca cosa, pesato per popolazione.

**H. Scenari what-if**
31. Nuova fontanella/servizio: ricalcolo copertura.
32. Alberatura, ZTL, pedonalizzazione: effetti su caldo, ombra, accessibilità.
33. Confronto A/B di due scenari affiancati.

**I. Live e dati esterni**
34. Meteo in tempo reale (MeteoHub), rischio caldo a 3 giorni.
35. Dati Cruscotto Italia via MCP: ISPRA, BDAP/SIOPE, ANAC, PNRR, scuole MIUR, veicoli ACI, redditi MEF, AGCOM FTTH, MIMIT carburanti.
36. Qualità aria, traffico: solo se si trovano feed aperti (non presenti oggi).

**K. Regole del suolo: catasto, PRG, vincoli** (nuovo)
40. Catasto: fogli e particelle (SITR ago. 2024) sul viewer; click su edificio → particella, foglio, zona PRG, vincoli.
41. Zonizzazione della Variante Generale PRG 2004 come strato (zone A–F, centro storico, netto storico) con legenda ufficiale.
42. Vincoli areali/lineari + vincoli architettonici (geocodificati dal CSV) + PAI + aree boscate/demaniali: "cosa si può fare qui".
43. Scheda di particella: zona urbanistica, vincoli, rischio PAI, vulnerabilità sismica, rumore, edifici sopra (altezza/volume), caldo, popolazione della sezione.
44. Indice edificabilità teorico per zona (volumi esistenti da CTC/Overture vs limiti di zona) → capacità residua stimata. Solo indicativo: non sostituisce il certificato di destinazione urbanistica.
45. Confronto storico PRG 1962 vs 2004 (vigente), con le immagini già in archivio. PRG 2025/PUG esclusi perché non vigenti.
46. Suolo pubblico e patrimonio: immobili comunali, beni confiscati, terreni, edilizia degradata sovrapposti a zonizzazione e vincoli → riuso e rigenerazione.
47. Mercato immobiliare: quotazioni OMI per zona vs zonizzazione, caldo, servizi, rischio.

**L. Trasporto pubblico (GTFS)** (nuovo)
48. Rete AMAT: fermate, linee, frequenze dal GTFS 2026 (da scaricare).
49. Accessibilità con trasporto pubblico: isocrone multimodali (piedi + bus) con orari da `stop_times`.
50. Copertura TPL per sezione (popolazione entro 300/500 m da una fermata, per fascia oraria) e buchi di servizio.
51. Scenario: nuova linea o fermata → variazione di copertura e tempi di viaggio.
52. Confronto evoluzione 2014 → 2018 (cinque feed disponibili): quali linee/fermate cambiano.
53. Intermodalità con ZTL, parcheggi PRG, ricarica EV, bike sharing (GBFS) se disponibili.

**J. Prodotto e diffusione**
37. Modalità "storytelling" guidata (percorsi tematici) e export immagini/PDF.
38. API statica dei dati (PMTiles/Parquet) riusabile da terzi; dataset su Zenodo.
39. Export verso QGIS (plugin già presente) e CityGML/3D Tiles per uso professionale.

## 4. Approccio consigliato

Tre strade considerate:

1. **Unico viewer MapLibre + PMTiles + JS vanilla (consigliata).** Riusa stack, design system e
   competenze già in tutte le cartelle; hosting statico; ombre già su WebGL. Limite: 3D di media
   complessità (edifici estrusi, terreno), non scene fotorealistiche.
2. **CesiumJS / 3D Tiles.** 3D più ricco e LiDAR nativo, ma stack nuovo, tile 3D da generare,
   pesante. Utile solo come fase finale per il dettaglio puntuale.
3. **Federazione di iframe delle app esistenti.** Veloce (giorni) ma non è un gemello: niente
   interazione tra i temi, nessuna ricerca unificata. Va bene solo come ponte iniziale.

Raccomandazione: **1**, con la 3 come "v0" di pochi giorni per avere subito qualcosa online.

Aggiornamento: esistono già `SiciliaHub/Palermo-3D` (Cesium), `Maps/cs_pa_3d` e `Maps/dem_volumetrie_pa`
(Qgis2threejs). Prima della fase 1 conviene **aprirli e valutare** cosa riusare. Se il Cesium funziona
bene con edifici e DTM, l'opzione 2 diventa più credibile di quanto sembrasse.

## 5. Architettura proposta

```
sorgenti (gpkg, tif, csv, laz, SDMX, API)
   │  pipeline Python offline (QGIS headless / GDAL / DuckDB)
   ▼
data/  ──  PMTiles (vettoriali)  +  Cloud-Optimized GeoTIFF / raster PNG (DSM, LST)  +  Parquet/JSON (indicatori)
   │
   ▼
viewer statico: MapLibre GL (+ custom layer WebGL per ombre) + moduli tema caricati a richiesta
   │
   ▼
GitHub Pages (+ Actions per aggiornare i dati live: meteo, rischio caldo)
```

Principi:

- **Un solo spazio di riferimento**: EPSG:4326 per il web, EPSG:6875 per i calcoli su DTM; conversione
  dichiarata in una sola funzione. Oggi il mix 4326/6875/3857 è il rischio tecnico principale.
- **Chiave comune**: `PRO_COM` + codice sezione ISTAT 2021 (e id edificio) per unire tutti gli indicatori.
- **Un modulo per tema** con interfaccia fissa (`id, sorgenti, layer, pannello, scheda`): si aggiunge un tema senza toccare gli altri.
- **Deduplicare i dati**: `edificato.gpkg` esiste in due cartelle; un solo sorgente in `DigitalTwin/dati/` (o link).
- I `.laz/.las` (≈1,7 GB) **restano fuori dal repo web**: derivati (chioma, altezza) in raster/Parquet.
- Peso massimo per file 100 MB (limite GitHub): tutto ciò che supera va in PMTiles/COG su storage esterno.

## 6. Fasi

| Fase | Contenuto | Esito verificabile |
|---|---|---|
| 0 | Catalogo dati, deduplicazione, CRS unico, scelta chiavi, scheletro `DigitalTwin/` (le cartelle esistono già, vuote); censimento dei PMTiles già pronti in `SiciliaHub/PRG2004` (catasto 0926, PRG, civici, OMI, immobili) e scelta di dove ospitarli; valutazione dei prototipi 3D esistenti. GTFS escluso | `catalogo.md` + script di validazione che passa. **Fatta (2026-10-01):** 169 voci (162 file + 7 tileset), 0 errori; i file già su GitHub Pages sono link, non copie |
| 1 | Viewer base: confini + sezioni + edifici 3D + terreno + ricerca + selezione punto/area | demo online con selezione che restituisce valori. **Fatta in locale (2026-10-01):** catasto, PRG 2004 + PPE + vincoli, OMI, popolazione 2021/2023, edifici 3D, rilievo 3D, elevazione, civici, ricerca e scheda del luogo strutturata; manca la pubblicazione |
| 2 | Clima: ombre live, LST, rischio caldo, SVF | slider ora/data funzionante, layer LST confrontabile |
| 3 | Popolazione e società + bivariate a scelta | profilo di un'area con ≥10 indicatori |
| 4 | Mobilità: isocrone, pendolarismo, ZTL | isocrona da punto arbitrario |
| 5 | Verde: alberi, chioma LiDAR, servizi ecosistemici | indice verde per quartiere |
| 6 | Servizi e accessibilità: fontanelle, PEBA, prossimità | mappa "città dei 15 minuti" |
| 6b | Regole del suolo: catasto SITR, zonizzazione PRG 2004, vincoli, scheda di particella | click su un punto → particella + zona + vincoli |
| 10 (dopo il resto) | Trasporto pubblico: GTFS 2026, isocrone bus+piedi. **Rinviata** | copertura TPL per sezione e isocrona multimodale |
| 7 | Scenari what-if (3 scenari iniziali) | confronto A/B con differenza numerica |
| 8 | Dati live e fonti esterne (MeteoHub, Cruscotto Italia) | aggiornamento automatico giornaliero via Actions |
| 9 | Storytelling, export, documentazione, rilascio dataset | release + DOI |

Ogni fase ha un piano di implementazione proprio (spec → piano → codice): non si progetta tutto insieme.
Ordine suggerito: 0 → 1 → 2 → 3, poi le altre in base alle priorità.

## 7. Rischi

- **Non è tempo reale**: se "gemello" significa sincronizzato con sensori, oggi mancano i dati. Solo meteo e rischio caldo sono live.
- **Peso dei dati**: DTM 5,4 GB e LiDAR 1,7 GB. Serve sempre un derivato leggero per il web.
- **Coerenza temporale**: ISTAT 2011 vs 2021 vs 2023, edificato di data incerta, OSM variabile. Ogni layer deve riportare data e fonte.
- **Censimento 2023 ≠ 2021**: 3.090 sezioni contro 3.600 (il 2023 contiene solo le sezioni con dati), `Pop_2022` è una stringa, e i confini sezione vanno verificati tra le due edizioni. Join sempre su `SEZ21_ID`, con controllo delle sezioni mancanti. Nessuna differenza 2021→2023 va calcolata senza questo controllo.
- **Campione**: il censimento permanente è campionario (rilevazione per anno di riferimento): i valori sezione-per-sezione sono stime, non conteggi esatti. Va detto in interfaccia.
- **Precisione**: stime (popolazione per edificio, ombre, LST) vanno etichettate come stime con incertezza.
- **Scenari**: rischio di promettere simulazioni fisiche. Restano modelli semplici e dichiarati.
- **Qualità edificato**: altezze da più fonti (`source`); verificare copertura prima di usarle per l'ombra.
- **Licenze**: ogni dataset va controllato prima della ripubblicazione.
- **GTFS rinviato**: niente TPL nella prima versione. Quando si aggiunge, usare il feed 2026 (quelli in archivio sono del 2014–2018) e ricordare che descrive l'orario programmato, non i ritardi. Controllo licenza prima di ripubblicare.
- **PMTiles di sola visualizzazione**: catasto e PRG sono già in tile con geometria semplificata agli zoom bassi (tippecanoe) e pochi attributi. Vanno bene per mostrare; per calcoli (join con edifici, aree, scenari) servono i sorgenti vettoriali originali (gpkg/geojson).
- **Ospitare i PMTiles**: i dati oggi sono serviti da `palermohub.github.io/PRG2004/...`. Il gemello può puntare lì, ma crea una dipendenza da un repo esterno: meglio copiare in un repo/storage proprio o concordare l'URL stabile.
- **PRG vigente = 2004**: la zonizzazione vettoriale è quella giusta. PRG 2025/PUG non sono vigenti e restano fuori. Attenzione: il gpkg 2004 è del 2024 e le norme possono essere state modificate con varianti puntuali successive; va detto in interfaccia.
- **Catasto 2026 vs dati 2024**: le particelle cambiano (frazionamenti, fusioni). Non si uniscono dati di anni diversi per particella senza verificare gli ID. L'allineamento con edifici e civici è geometrico e approssimato.
- **Valore legale**: catasto, zonizzazione e vincoli sono solo informativi. In interfaccia serve un avviso chiaro: per valore legale servono certificato di destinazione urbanistica e visure ufficiali. Il catasto SITR non contiene proprietà né rendite.
- **Dati personali**: anagrafe, elezioni, tributi (TARI), immobili e beni confiscati possono contenere dati sensibili o sotto soglia statistica. Non pubblicarli senza aggregazione e verifica GDPR.
- **Georadar OpenFiber**: probabilmente dati riservati di un terzo. Escluso dalla pubblicazione finché la licenza non è chiara.
- **Archivio sparso e duplicato**: stessi dati in `H:`, `D:` e nei repo (`SiciliaHub`, `Maps`). Serve un elenco di "sorgenti canoniche" e un hash per individuare i duplicati (come per `edificato.gpkg`).
- **Anagrafe vincoli architettonici**: CSV senza geometria; la geocodifica può avere errori, da marcare come stima.

## 8. Domande aperte

1. Destinatario principale: cittadini, PA, ricerca, o uso personale/portfolio?
2. (Risolta) GTFS rinviato a dopo; PRG vigente = 2004; catasto settembre 2026 = `particelle/particelle.pmtiles`.
2b. Il catasto ha solo `Foglio` e `Paricella`? Va bene per la scheda di particella, ma per unire al PRG o agli edifici serve una join spaziale, non per chiave.
2d. Il sorgente `particelle.geojsonl` da cui è generato `particelle.pmtiles` esiste ancora, o esiste solo il PMTiles? Il PMTiles perde precisione e attributi a bassi zoom.
2c. Quali dei dati sensibili (anagrafe, TARI, elezioni, beni confiscati) possono essere usati, e a che livello di aggregazione?
3. Priorità tra i temi A–J: quale serve per primo?
4. 3D solo estruso (MapLibre) o serve anche fotorealismo (Cesium)?
5. Dove pubblicare: GitHub Pages, Cloudflare (Pages/R2 per i file grandi)?
6. Copertura: solo comune di Palermo o anche area metropolitana?

Esito fasi 0–1: `docs/catalogo.md`, `docs/STILI.md`, `docs/superpowers/plans/2026-09-30-digitaltwin-fase0-1.md` (Task 0–13, incluse le aggiunte su richiesta: tematizzazione fedele, terreno/elevazione/griglia, scheda strutturata).
