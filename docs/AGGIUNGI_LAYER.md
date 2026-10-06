# Aggiungi layer

Il pulsante **Aggiungi layer** della barra strumenti (icona «libreria con +») apre un pannello nella barra verticale a destra, accanto a «RNDT». Serve ad aggiungere alla mappa dati propri: file dal computer e servizi XYZ, WMS e WFS incollati per indirizzo. I layer aggiunti stanno nel gruppo **I miei layer** della barra strati (in ordine alfabetico, con accensione, opacità e rimozione). Il catalogo RNDT resta separato, con il suo pannello e il suo gruppo.

## I miei dati

«Carica file dal computer» accetta GeoJSON/JSON, KML, KMZ, GPX, Shapefile in `.zip` (con `.prj`) e CSV con latitudine e longitudine. I GeoJSON e i CSV devono essere in WGS84. Di ogni file restano solo gli elementi dentro il Comune di Palermo. I dati si salvano in IndexedDB (`dt-rndt`), fino a 5 MB per layer; oltre, o se il browser blocca IndexedDB, il layer vale per la sessione e un avviso lo dice.

## Servizi

Ogni tipo ha un «＋» per aggiungere un servizio.

- **XYZ**: un indirizzo `https` con `{z}`, `{x}` e `{y}`.
- **WMS**: l'indirizzo del servizio; il pannello legge le capabilities e mostra i layer da spuntare. Funzionano solo i layer che offrono EPSG:3857 (gli altri compaiono come «non supportato»).
- **WFS**: come il WMS, per tipi di dati. Si scarica solo l'area di Palermo, in GeoJSON (`outputFormat=application/json`), fino a 5.000 elementi: oltre, o se il servizio non produce GeoJSON, il layer non si aggiunge e il pannello dice perché.

Servizi e layer passano dal Worker proxy (solo https, vedi `docs/RNDT.md`). Come per il catalogo, la mappa mostra i tile solo dentro il riquadro di Palermo.

## Salvataggio

- I layer aggiunti si salvano in `localStorage` (`dt:miei:v1`) e tornano alla riapertura dell'app; un servizio non più raggiungibile resta in elenco come «non disponibile».
- I **servizi salvati** (`dt:miei:servizi:v1`) compaiono sotto il loro tipo: un clic li rimette in mappa, «Rimuovi» li toglie dall'elenco. Se ne salvano al massimo 50; oltre, il layer entra in mappa ma il servizio non si salva e un avviso lo dice. Un campo di ricerca filtra l'elenco.
- Se `localStorage` è bloccato tutto funziona per la sessione.
- Chi aveva già file caricati nel gruppo RNDT li ritrova in «I miei layer»: all'avvio l'elenco passa da `dt:rndt:v1` a `dt:miei:v1`, i dati restano dove stavano.

## Limiti

- I layer di questo pannello non si interrogano con il clic sulla mappa (lo fa solo il catalogo RNDT).
- Il piano gratuito del Worker ha 100.000 richieste al giorno: ogni tile ne usa una.
- Il Worker va pubblicato (`npx wrangler deploy`, vedi `docs/RNDT.md`) prima di usare i servizi in produzione.
- L'ordine degli assi del `bbox` WFS dalla versione 1.1.0 è quello OGC (lat/lon con `urn:ogc:def:crs:EPSG::4326`); alcuni server lo trattano diversamente: se un WFS con dati a Palermo risponde «nessun elemento», si corregge `urlGetFeature` in `js/aggiungi/servizi.js`.
