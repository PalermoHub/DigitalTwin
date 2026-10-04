# Layer RNDT: gruppo nella barra strati e caricamento di file dal computer

Data: 2026-10-04 · Branch: `rndt-catalogo` · Estende `2026-10-04-rndt-catalogo-design.md`

## Obiettivo

L'utente carica dati nella mappa dal catalogo RNDT o da file del proprio computer, li ritrova nel gruppo «RNDT» della
barra strati e nella tab Argomenti, e li rivede alla riapertura dell'app.

## Già fatto (non committato al momento della stesura)

- Gruppo «RNDT» nella barra strati (`js/rndt/gruppo.js`): pulsante per il catalogo, righe in ordine alfabetico con accensione e rimozione,
  allineate all'host con `suCambio`; contano nel pulsante «Strati · N» e nei chip.
- Argomento «RNDT» nella tab Argomenti (caselle `strato-<id>`, elenco dal getter `strati` del modulo).
- GeoJSON senza URL salvati coi dati in `localStorage` (tetto 1 MB, rollback se la scrittura fallisce).

## Da fare

### 1. Importazione di file (`js/rndt/importa.js`)

`importaFile(file, librerie) → { nome, fc }` oppure errore con messaggio in italiano. Sceglie il lettore dall'estensione (non dal tipo MIME):

| Estensione | Lettore |
|---|---|
| `.geojson`, `.json` | `JSON.parse`; accetta `FeatureCollection`, `Feature` o geometria, riconduce a `FeatureCollection`. Se dichiara un `crs` diverso da WGS84 o ha coordinate fuori da lon/lat → errore. |
| `.kml` | `@tmcw/togeojson` (`kml`) con `DOMParser`. |
| `.kmz` | si apre lo zip, si legge il primo `.kml`, poi come KML. |
| `.gpx` | `@tmcw/togeojson` (`gpx`). |
| `.zip` (shapefile) | `shpjs`: legge shp, dbf, prj e riproietta in WGS84. |
| `.csv` | parser interno (`,` o `;`, virgolette): colonne lat/lon per nome (`lat`, `latitudine`, `y`; `lon`, `lng`, `long`, `longitudine`, `x`), virgola decimale ammessa; senza colonne riconosciute → errore. Le altre colonne diventano proprietà. |

- Le librerie sono in `js/vendor/` e si caricano con `import()` al primo file di quel formato (l'avvio non cambia). Il modulo le riceve
  come parametro, così i test non le caricano.
- Un file non valido non aggiunge nulla: avviso in pagina col nome del file e il motivo.
- Dopo l'importazione ogni `fc` passa da `host.addGeoJsonLayer(nome, fc)`: filtro sul confine di Palermo, errore «nessuna feature dentro il
  Comune di Palermo», salvataggio.
- Nome del layer = nome del file senza estensione. File multipli: uno alla volta, un avviso per ogni errore.

### 2. Selettore file nel gruppo

`gruppo.js`: due pulsanti, «＋ Dal catalogo RNDT» e «📁 Carica file dal computer» (`<input type=file multiple>`, `accept` con le estensioni sopra). Il
pulsante invoca `importaFile` e poi `host.addGeoJsonLayer`; `index.js` fornisce la funzione `carica(file)` (host + librerie + notifica).

### 3. Dati in IndexedDB (`js/rndt/dati.js`)

- `localStorage` (`archivio.js`) tiene l'elenco: id, tipo, nome, visibilità e la sorgente (URL o, per i GeoJSON senza URL, un segno `dati: true`).
- I dati di un GeoJSON senza URL stanno in IndexedDB (db `dt-rndt`, store `dati`, chiave = id layer).
- Interfaccia asincrona `{ leggi(id), scrivi(id, fc), elimina(id) }` con implementazione IndexedDB e implementazione in memoria (test).
- Tetto 5 MB (testo JSON) per layer. Oltre → «solo questa sessione» con avviso, come ora.
- Scrittura fallita o IndexedDB assente/bloccato → layer solo in sessione con avviso; l'elenco in `localStorage` non lo contiene; gli altri layer non risentono.
- `host.addGeoJsonLayer` resta sincrono verso il plugin (il layer è subito in mappa): la scrittura dei dati parte dopo, e solo a scrittura riuscita il layer entra nell'elenco salvato e diventa «salvato».
- `ripristina()` legge i dati da IndexedDB; se mancano → layer «non disponibile» (come un URL irraggiungibile).
- `elimina()` rimuove anche i dati. Compatibilità: i layer vecchi con `sorgente.dati` in `localStorage` si leggono ancora e al primo salvataggio passano a IndexedDB.

## Errori e casi limite

- Nessun file riconosciuto per estensione → «Formato non supportato: .xyz (sono accettati: …)».
- File vuoto, shapefile senza `.prj` con coordinate non lon/lat, CSV con righe senza coordinate (si saltano, conteggio nell'avviso).
- File oltre 5 MB: si carica in mappa e resta solo in sessione.

## Test

- `importa.test.mjs`: un file d'esempio piccolo per formato (CSV, KML, GPX, GeoJSON in tre forme, errori); le librerie reali per KML/GPX/zip si provano nel browser.
- `rndt-dati.test.mjs`: archivio in memoria; `rndt-host.test.mjs`: salvataggio dopo la scrittura dei dati, tetto 5 MB, ripristino, eliminazione, compatibilità col vecchio formato.
- Verifica manuale nel browser (Chrome non disponibile in questo ambiente): un file per formato, riapertura dell'app, file oltre 5 MB.

## Fuori scope

GeoPackage, FlatGeobuf, riproiezione di GeoJSON/CSV non WGS84, trascinamento dei file sulla mappa, limite complessivo dello spazio occupato.
