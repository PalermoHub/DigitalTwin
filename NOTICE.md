# Licenze

| Cosa | Licenza |
|---|---|
| Codice (`js/`, `scripts/`, `tests/`, `css/`, `index.html`, `mappa.html`, workflow) | [EUPL-1.2](LICENSE) |
| Dati e documentazione prodotti da questo progetto (`dati/catalogo.json`, `dati/uffici/`, `dati/incedi/`) | [CC BY 4.0](LICENSE-DATA.md) |

## Dati di terzi

I dati di terzi **non sono coperti** da CC BY 4.0 e mantengono la licenza della fonte. Prima di riusarli verificare le
condizioni aggiornate presso il titolare. Fonti usate:

- ISTAT (sezioni censuarie, indicatori, censimento permanente): in genere CC BY
- Comune di Palermo (catasto/SITR, PRG, civici, GTFS, uffici): condizioni del portale open data del Comune
- Ministero dell'economia e delle finanze, Dipartimento del Tesoro (immobili dichiarati al censimento, `dati/mef-immobili/`): [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), con citazione della fonte
- Comune di Palermo, Piano di Eliminazione delle Barriere Architettoniche (PEBA), Delibera di Giunta Comunale n. 272 del 18/07/2026, elaborazione OpenDataSicilia e PalermoHub (`dati/peba/`; foto e PDF originali su <https://palermohub.github.io/peba/>): [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), con citazione della fonte
- Ministero dell'economia e delle finanze, Ragioneria generale dello Stato, Open BDAP: Monitoraggio Opere Pubbliche (MOP), progetti e localizzazione delle opere pubbliche a Palermo (`dati/opere/`; <https://bdap-opendata.rgs.mef.gov.it/>; licenza «CC BY - Libero riuso citando la fonte»); posizioni dai numeri civici ANNCSU, elaborazione DigitalTwin Palermo
- Comune di Palermo, Programma triennale dei lavori pubblici 2026-2028, schede e allegati della Delibera di Consiglio comunale n. 553/2026 (`dati/piano-triennale/`): tabelle estratte dai PDF e geometrie ricavate dalle tavole da OpenDataSicilia con Claude AI (progetto `piano_triennale_26_28`); dati informativi, senza valore legale; elaborazione DigitalTwin Palermo
- Italia Domani — Struttura di missione PNRR, Sogei, progetti del PNRR localizzati a Palermo (`dati/pnrr/`; catalogo open data <https://www.italiadomani.gov.it/content/sogei-ng/it/it/catalogo-open-data.html>): [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), con citazione della fonte
- AgID, Indice delle Pubbliche Amministrazioni (IPA), sedi degli istituti scolastici usate per posizionare i progetti PNRR delle scuole (`dati/pnrr/`; <https://indicepa.gov.it/ipa-dati/dataset/amministrazioni>): [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), con citazione della fonte
- ISTAT, Censimento permanente della popolazione e delle abitazioni 2021, matrice di pendolarismo per lavoro; elaborazione PalermoHub, mappa originale <https://palermohub.github.io/Pendolarismo_2021/> (`dati/pendolarismo/`): [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), con citazione della fonte
- Trasporto ferroviario urbano di Palermo (feed GTFS): Trenitalia S.p.A. / CCISS MMTIS (dati NeTEx sul Punto di Accesso Nazionale), convertiti in GTFS da Clément Desouche ([deryclem/trenitalia-gtfs](https://github.com/deryclem/trenitalia-gtfs)), licenza [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) con obbligo di attribuzione; feed valido dal 26/09/2026 al 12/12/2026
- Ministero delle Imprese e del Made in Italy (MIMIT), Osservaprezzi carburanti, anagrafica degli impianti e prezzi comunicati dai gestori (`dati/distributori/`, rigenerato ogni giorno; <https://www.mimit.gov.it/it/open-data/elenco-dataset/carburanti-prezzi-praticati-e-anagrafica-degli-impianti>): [IODL 2.0](https://www.dati.gov.it/content/italian-open-data-license-v20)
- Agenzia delle Entrate, OMI: condizioni dell'Osservatorio del Mercato Immobiliare
- adsb.lol, traffico aereo attorno all'aeroporto di Palermo, posizioni ADS-B raccolte da volontari (Worker `worker/voli-core.js`, nessun file nel repository, aggiornato al massimo ogni 5 minuti; <https://www.adsb.lol/>): [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/), con obbligo di attribuzione e share-alike
- OpenSky Network, riserva del traffico aereo quando adsb.lol non risponde (stesso Worker, stesso aggiornamento ogni 5 minuti, nessun file nel repository; <https://opensky-network.org/>): dati ADS-B di volontari, condizioni d'uso in <https://opensky-network.org/about/terms-of-use>; senza matricola né modello
- AISStream (<https://aisstream.io/>), traffico navale attorno alla Sicilia, dati AIS terrestri dei transponder delle navi (Worker `worker/navi-core.js`, nessun file nel repository, ascolto ogni 5 minuti): condizioni d'uso da verificare, il servizio non indica una licenza dei dati
- OpenStreetMap (mappe di base, posizione corretta di 13 stazioni ferroviarie e stazioni in apertura Politeama e Porto, `scripts/ferrovia_posizioni.json` e `scripts/ferrovia_in_apertura.json`; tracciato dei binari delle linee ferroviarie urbane, `scripts/ferrovia_osm.json` e `dati/trasporto/ferrovia-linee.geojson`): ODbL, © contributori OpenStreetMap, con obbligo di attribuzione e share-alike
- Dati incendi: servizio ArcGIS del titolare, secondo le sue condizioni
- Isole di calore: Landsat 8/9 (USGS, dominio pubblico) elaborati per sezione censuaria ISTAT; studio di OpenDataSicilia / PalermoHub, CC BY 4.0

- Ex Noviziato dei Crociferi (`dati/edificio/`): piante DWG, sezione e prospetti del Comune di Palermo, Settore Centro Storico; il modello 3D in `dati/edificio/crociferi/` ne è un'elaborazione

Attribuzione richiesta per i dati CC BY: «Digital Twin Palermo, PalermoHub».

## Software di terzi

- `js/vendor/openrndt-geolibre/`: plugin [openrndt-geolibre](https://github.com/ondata/openrndt-geolibre) 0.3.1 di Andrea Borruso (ricerca nel catalogo RNDT), incluso senza modifiche, licenza MIT (`js/vendor/openrndt-geolibre/LICENSE`). Contiene proj4 (MIT).
- `js/geoimage/`: porting in MapLibre di [Geoimage](https://github.com/gbvitrano/Geoimage) di @gbvitrano (nel repository originale: GPL-2.0).
- `js/vendor/proj4.js`: [proj4js](https://github.com/proj4js/proj4js) 2.11.0, licenza MIT (`js/vendor/LICENSE-proj4.txt`).
- `js/vendor/three.module.min.js`: [three.js](https://threejs.org/) r160, licenza MIT (`js/vendor/LICENSE-three.txt`); disegna i prospetti in `crociferi.html`.
- `js/vendor/jszip.min.js`: [JSZip](https://stuk.github.io/jszip/) 3.10.1, licenza MIT o GPL-3.0 a scelta (`js/vendor/LICENSE-jszip.txt`).

## Font

Montserrat (Julieta Ulanovsky e collaboratori), licenza SIL Open Font License 1.1 — https://fonts.google.com/specimen/Montserrat. Sottoinsieme latino in `css/fonts/`.
