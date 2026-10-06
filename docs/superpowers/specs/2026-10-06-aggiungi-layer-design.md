# Pannello «Aggiungi layer»: file e servizi XYZ, WMS, WFS

Data: 2026-10-06 · Stato: in revisione

## Obiettivo

Un solo punto per aggiungere layer propri alla mappa, come il Browser di QGIS: i file dal computer e i servizi
incollati per URL (XYZ, WMS, WFS). I servizi aggiunti si salvano nel browser e si possono riaggiungere con un clic.

## Fuori ambito

- Il catalogo RNDT: ha già ricerca ed elenco «Layer aggiunti», non si duplica nel nuovo pannello.
- WMTS e ArcGIS REST: ciclo successivo, con la stessa interfaccia.
- Recenti, Database, SQL Server (il browser non si collega a un database; i progetti non esistono in questa app).
- Aprire un servizio fuori da Palermo (vedi «Limite di area»).

## Decisioni

| Tema | Scelta |
|---|---|
| Tipi di servizio | XYZ, WMS, WFS |
| Gruppo nella barra strati | nuovo gruppo «I miei layer» (file e servizi); il gruppo «RNDT» resta solo del catalogo |
| Limite di area | come RNDT: tile ritagliati sul riquadro di Palermo, WFS filtrati sul confine comunale |
| Architettura | seconda istanza di `creaHost`, con memoria separata; il catalogo RNDT non cambia |

## Architettura

- **Tab «Aggiungi layer»** nella rail sinistra (`collegaRail`), accanto a «RNDT», con un pulsante nella barra strumenti.
  Il pannello è un elemento come `rndt-pannello`.
- **Secondo host**: `creaHost({ map, proxy: PROXY_RNDT, stato, scrivi, anelli, notifica, pannello, archivioDati })`
  con stato letto da `dt:miei:v1`. Condivide con il catalogo il proxy, i confini e l'IndexedDB `dt-rndt`
  (gli id dei layer sono hash dei contenuti, non collidono).
- **Gruppo «I miei layer»** nella barra strati, costruito come `creaGruppoRndt` ma legato al secondo host. L'ordine
  è alfabetico, come tutti i gruppi (vedi memoria del progetto).
- **`archivio.js`**: la chiave oggi fissa (`dt:rndt:v1`) diventa un parametro di `leggi`/`salva`, con default invariato.
  I tipi ammessi non cambiano: un WFS è un layer `geojson` con URL.

### Moduli nuovi (`js/aggiungi/`)

| File | Responsabilità | Dipende da |
|---|---|---|
| `servizi.js` | puro: valida l'URL XYZ; legge le capabilities WMS (1.1.1, 1.3.0) e WFS (1.1.0, 2.0.0) e restituisce l'elenco dei layer/tipi con nome, titolo, CRS, bbox, formati | nulla (riceve il testo XML) |
| `pannello.js` | UI ad albero: «I miei dati», «Servizi» (XYZ, WMS, WFS), elenco dei servizi salvati, errori | `servizi.js`, host |
| `index.js` | collega host, pannello, gruppo e rail; migrazione dei file; carica i servizi salvati | tutti |
| `rndt/gruppo.js` (modificato) | `creaGruppoRndt` si parametrizza (titolo, icona, id, pulsanti) e serve entrambi i gruppi; il pulsante «Carica file» sta solo in «I miei layer» | — |

### Host: aggiunte

- **`addWfsLayer(nome, { url, tipo, versione })`**: scarica con `GetFeature`, `outputFormat` JSON, `bbox` di Palermo
  e un massimo di 5.000 feature; filtra sul confine con `filtraSuConfine`; crea il layer con `creaGeoJson` e lo salva
  **con l'URL** della richiesta, così il ripristino riscarica come già fa per i WFS del catalogo. Se il servizio
  non produce JSON o supera il tetto, errore chiaro.
- `creaWms` e `creaTile` si riusano. Il WMS accetta solo EPSG:3857 (errore già presente).
- Nessun tipo nuovo in `archivio.js`: il WFS è un `geojson` con URL.

## Pannello

```
Aggiungi layer
 ▾ I miei dati
     [ Carica file dal computer ]   GeoJSON · KML/KMZ · GPX · SHP (zip) · CSV
 ▾ Servizi                          [cerca servizi salvati…]
   ▸ XYZ     (n)  [+]
   ▸ WMS     (n)  [+]
   ▸ WFS     (n)  [+]
```

- **XYZ [+]**: nome e URL con `{z}`, `{x}`, `{y}`; si valida e si aggiunge.
- **WMS / WFS [+]**: URL del servizio → `GetCapabilities` via proxy → elenco di layer o tipi con casella → «Aggiungi».
- Un servizio salvato compare sotto il suo tipo; il clic lo riaggiunge alla mappa se non c'è già.
- Tetto di **50 servizi salvati**; al raggiungimento un avviso e nessun salvataggio ulteriore.
- Un servizio può essere rimosso dall'elenco dei salvati (non solo dalla mappa).

## Dati e salvataggio

- `dt:miei:v1` in `localStorage`: layer aggiunti alla mappa (stesso formato di `dt:rndt:v1`).
- `dt:miei:servizi:v1` in `localStorage`: **servizi salvati** `{ tipo, nome, url, layer[] }` (solo URL e scelte, nessun dato).
  Distinto dall'elenco dei layer perché un servizio salvato può non essere in mappa.
- File dal computer: IndexedDB `dt-rndt`, tetto 5 MB per file (come oggi).
- Se `localStorage` o IndexedDB sono bloccati: funziona per la sessione con l'avviso già in uso.

### Migrazione

All'avvio, una sola volta: i layer di `dt:rndt:v1` con `sorgente.dati === true` (file dal computer) passano a
`dt:miei:v1`; i loro dati restano in IndexedDB con lo stesso id. Fatto prima di `ripristina()`. Si segna
`dt:miei:migrato=1`. Se la scrittura fallisce, nulla si perde: i layer restano dov'erano e si riprova al prossimo avvio.

## Limite di area

Identico al catalogo, non configurabile:
- XYZ e WMS: `bounds` = riquadro di Palermo (`creaTile`/`creaWms` già lo fanno).
- WFS: `bbox` di Palermo nella richiesta e filtro sul confine comunale; avviso se alcune feature sono fuori.
- Un file con tutte le feature fuori dal Comune viene rifiutato (comportamento esistente di `creaGeoJson`).

## Errori

Mostrati accanto al campo, senza eccezioni: URL non valido, host non ammesso dal proxy (solo https, nomi pubblici),
servizio che non risponde, capabilities non riconosciute, CRS non supportato, WFS senza output JSON, più di 5.000 feature.
Un servizio salvato che non risponde più resta nell'elenco come «non disponibile».

## Costi e avvertenze

- I tile passano dal Worker: 100.000 richieste al giorno nel piano gratuito. L'avviso va nella guida, non nella UI.
- Il Worker va pubblicato (`wrangler deploy`, vedi `docs/RNDT.md`) prima di promettere la funzione in produzione.

## Test

- `tests/js/aggiungi-servizi.test.mjs`: capabilities WMS 1.1.1 e 1.3.0, WFS 1.1.0 e 2.0.0 (XML di esempio in `tests/js/fixture/`),
  XYZ valido e non valido, XML malformato.
- Host: `addWfsLayer` (URL con bbox e tetto), ripristino da stato salvato, errore su servizio non JSON.
- Archivio: chiave parametrica, limite di 50 servizi, stato corrotto → vuoto.
- Migrazione: stato RNDT con file e con layer del catalogo → solo i file si spostano; idempotente; scrittura fallita.
- Gruppo «I miei layer»: ordine alfabetico e note di stato.
- Verifica a mano nel browser con `wrangler dev` e `?rndt-proxy=`: un XYZ, un WMS, un WFS, un file; riaperture dell'app.

## Documentazione

Aggiornare `docs/RNDT.md` (il file dal computer si sposta), una nuova pagina `docs/AGGIUNGI_LAYER.md` e, se serve, la guida.
