# Licenze

| Cosa | Licenza |
|---|---|
| Codice (`js/`, `scripts/`, `tests/`, `css/`, `index.html`, workflow) | [EUPL-1.2](LICENSE) |
| Dati e documentazione prodotti da questo progetto (`dati/catalogo.json`, `dati/uffici/`, `dati/incedi/`) | [CC BY 4.0](LICENSE-DATA.md) |

## Dati di terzi

I dati di terzi **non sono coperti** da CC BY 4.0 e mantengono la licenza della fonte. Prima di riusarli verificare le
condizioni aggiornate presso il titolare. Fonti usate:

- ISTAT (sezioni censuarie, indicatori, censimento permanente): in genere CC BY
- Comune di Palermo (catasto/SITR, PRG, civici, GTFS, uffici): condizioni del portale open data del Comune
- Trasporto ferroviario urbano di Palermo (feed GTFS): Trenitalia S.p.A. / CCISS MMTIS (dati NeTEx sul Punto di Accesso Nazionale), convertiti in GTFS da Clément Desouche ([deryclem/trenitalia-gtfs](https://github.com/deryclem/trenitalia-gtfs)), licenza [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) con obbligo di attribuzione; feed valido dal 26/09/2026 al 12/12/2026
- Agenzia delle Entrate, OMI: condizioni dell'Osservatorio del Mercato Immobiliare
- OpenStreetMap (solo le mappe di base): ODbL, © contributori OpenStreetMap, con obbligo di attribuzione e share-alike
- Dati incendi: servizio ArcGIS del titolare, secondo le sue condizioni
- Isole di calore: Landsat 8/9 (USGS, dominio pubblico) elaborati per sezione censuaria ISTAT; studio di OpenDataSicilia / PalermoHub, CC BY 4.0

Attribuzione richiesta per i dati CC BY: «Digital Twin Palermo, PalermoHub».

## Software di terzi

- `js/vendor/openrndt-geolibre/`: plugin [openrndt-geolibre](https://github.com/ondata/openrndt-geolibre) 0.3.1 di Andrea Borruso (ricerca nel catalogo RNDT), incluso senza modifiche, licenza MIT (`js/vendor/openrndt-geolibre/LICENSE`). Contiene proj4 (MIT).
- `js/geoimage/`: porting in MapLibre di [Geoimage](https://github.com/gbvitrano/Geoimage) di @gbvitrano (nel repository originale: GPL-2.0).
- `js/vendor/proj4.js`: [proj4js](https://github.com/proj4js/proj4js) 2.11.0, licenza MIT (`js/vendor/LICENSE-proj4.txt`).
- `js/vendor/jszip.min.js`: [JSZip](https://stuk.github.io/jszip/) 3.10.1, licenza MIT o GPL-3.0 a scelta (`js/vendor/LICENSE-jszip.txt`).

## Font

Montserrat (Julieta Ulanovsky e collaboratori), licenza SIL Open Font License 1.1 — https://fonts.google.com/specimen/Montserrat. Sottoinsieme latino in `css/fonts/`.
