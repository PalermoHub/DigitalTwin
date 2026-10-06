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

- ~~Tab «Aggiungi layer» nella rail destra~~ — **sostituito dalla Revisione 2**: non c'è un pannello destro; tutto sta nel gruppo «I miei layer» della barra sinistra.
- **Secondo host**: `creaHost({ map, proxy: PROXY_RNDT, prefisso: 'miei', etichetta: 'aggiunti', stato, scrivi, anelli, notifica, archivioDati })`
  con stato letto da `dt:miei:v1`. `prefisso` (default `rndt`) è l'inizio degli id di sorgenti e layer in mappa; `etichetta` entra nei messaggi. Condivide con il catalogo il proxy, i confini e l'IndexedDB `dt-rndt`
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

- **`addWfsLayer(nome, richiesta)`**: `richiesta` è l'URL `GetFeature` già completo (lo costruisce `servizi.js`, con `bbox` di Palermo
  e tetto di 5.001 feature); l'host scarica, rifiuta oltre 5.000 feature, filtra sul confine con `filtraSuConfine`, crea il layer
  con `creaGeoJson` e lo salva **con l'URL** della richiesta, così il ripristino riscarica come già fa per i WFS del catalogo. Se il servizio
  non produce JSON o supera il tetto, errore chiaro.
- `creaWms` e `creaTile` si riusano. Il WMS accetta solo EPSG:3857 (errore già presente).
- Nessun tipo nuovo in `archivio.js`: il WFS è un `geojson` con URL.

## Pannello (sostituito dalla Revisione 2, vedi sotto)

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
- `dt:miei:servizi:v1` in `localStorage`: **servizi salvati** `{ id, tipo, nome, url, voci[] }` (solo URL e scelte, nessun dato).
  Una voce è `{ chiave, nome, … }`: per WMS le opzioni del layer (`opz`), per WFS l'URL `GetFeature` (`richiesta`); XYZ non ha voci.
  Distinto dall'elenco dei layer perché un servizio salvato può non essere in mappa.
- File dal computer: IndexedDB `dt-rndt`, tetto 5 MB per file (come oggi).
- Se `localStorage` o IndexedDB sono bloccati: funziona per la sessione con l'avviso già in uso.

### Migrazione

All'avvio, una sola volta: i layer di `dt:rndt:v1` con `sorgente.dati === true` (file dal computer) passano a
`dt:miei:v1`; i loro dati restano in IndexedDB con lo stesso id. Fatto prima di creare gli host. Non serve un
marcatore: dopo il primo passaggio nello stato RNDT non restano file. Se una scrittura fallisce si torna allo stato
precedente: nessun layer si perde né si duplica, e si riprova al prossimo avvio.

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

## Revisione 2 — pannello unico a sinistra, ad albero, con credenziali

Richiesta del 2026-10-06: tutto avviene nello stesso pannello di sinistra, con un albero come il Browser di QGIS/GeoLibre,
e i servizi possono richiedere utente e password.

### Pannello

Il gruppo «I miei layer» (tab sinistro) contiene, dall'alto:

```
[ Cerca sorgenti dati… ]
▾ 📁 I miei dati                    ⬆   ← l'icona apre il selettore dei file
▾ 📁 Servizi
   ▸ XYZ (n)                         ＋
   ▸ WMS (n)                         ＋
   ▸ WFS (n)                         ＋
      · servizio salvato  (🔒)      🗑   ← clic: in mappa; 🔒 = serve la password
Layer in mappa                           ← le righe di oggi: casella, opacità, rimozione, ordine
```

- Il «＋» di un tipo apre, sotto il ramo, un modulo con Nome (facoltativo), Indirizzo, **Utente** e **Password** (facoltativi).
  WMS e WFS: «Leggi il servizio» mostra nel modulo i layer da spuntare, poi «Aggiungi selezionati».
- La ricerca filtra i servizi salvati (nome, indirizzo).
- L'albero si crea una sola volta e si sposta a ogni ridisegno del gruppo: lo stato (rami aperti, testo digitato) resta.
- Spariscono `#aggiungi-pannello`, il suo tab nella rail, il pulsante `btn-aggiungi` e il pulsante «＋ Aggiungi servizio o file…».

### Credenziali

- **Solo per la sessione.** Utente e password stanno in una `Map` in memoria (`host → intestazione Basic`); non vanno in
  `localStorage`, né nei servizi salvati, né in IndexedDB. Il servizio salvato ricorda l'URL e il nome utente (campo `utente`).
- Un servizio salvato con `utente` e senza password in sessione mostra 🔒; al clic il modulo chiede la password
  (l'utente è già compilato) e poi lo mette in mappa.
- Una risposta 401 dà l'errore «il servizio richiede utente e password».
- `host.fetchArrayBuffer` (capabilities, GetFeature, WFS al ripristino) manda l'intestazione `Authorization` per l'host
  del servizio; i tile (WMS, XYZ) la ricevono da `map.setTransformRequest` per le richieste dirette al proxy con quell'host.
- **Worker**: inoltra `Authorization` al servizio solo per l'host richiesto (mai su un redirect verso un altro host);
  l'elenco `access-control-allow-headers` diventa esplicito (`authorization, accept, content-type`, perché `*` non
  copre `Authorization`); non gira al browser `WWW-Authenticate` (nessuna finestra di login del browser); non registra
  nulla. Va ripubblicato (`wrangler deploy`).
- Solo autenticazione Basic. Un token nell'URL si incolla nell'indirizzo come prima.

### Test aggiunti

Worker (inoltro dell'intestazione, niente su redirect cross-host, CORS), `credenziali.js` (puro), host (intestazione e 401),
controllo (credenziali, 🔒, salvati senza password), filtro dei servizi; verifica a mano nel browser.

## Revisione 3 — WMTS e ArcGIS REST

Richiesta del 2026-10-06: aggiungere i servizi WMTS e ArcGIS REST (MapServer e FeatureServer), sia come immagini sia come dati
vettoriali; token incollato nell'indirizzo, niente generazione di token.

### WMTS

- «Leggi il servizio» legge le `GetCapabilities` (KVP). Per ogni `Layer` sceglie il primo formato immagine, il primo stile e un
  `TileMatrixSet` **compatibile con la mappa**: EPSG:3857, tile 256×256, origine in alto a sinistra a (−20037508.34, 20037508.34),
  prima matrice 1×1, matrici in ordine di scala con identificatori `<prefisso><livello>` dove il livello coincide con la
  posizione (0, 1, 2…; es. `0`, `EPSG:3857:5`, `webmercator:3`). Gli altri layer compaiono «non supportato».
- Il layer diventa un normale layer XYZ: URL da `ResourceURL` (REST, `{TileMatrix}`→`<prefisso>{z}`, `{TileRow}`→`{y}`,
  `{TileCol}`→`{x}`, `{TileMatrixSet}` e `{Style}` sostituiti, altre dimensioni col valore predefinito) oppure costruito
  come `GetTile` KVP (indirizzo dell'operazione `GetTile`, altrimenti quello del servizio). Passa da `creaTile`: proxy, limite di
  Palermo e credenziali come per XYZ.
- Il servizio salvato ricorda per ogni layer l'URL XYZ già calcolato (voce `{ chiave, nome, tile }`).

### ArcGIS REST

- Indirizzi accettati: `…/MapServer`, `…/FeatureServer`, con o senza `/N` (un solo layer). `ImageServer` è fuori ambito.
  Si legge `<indirizzo>?f=json`; un `error` nel JSON diventa il messaggio d'errore.
- **Come immagini** (solo MapServer): se il servizio ha una cache a tile utilizzabile (`singleFusedMapCache`, Web Mercator,
  256×256, origine in alto a sinistra a (−20037508.34, 20037508.34), primo livello 0) c'è un solo layer «tutto il servizio» con URL
  `…/tile/{z}/{y}/{x}`; altrimenti ogni layer scelto è un layer raster con `…/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png32&transparent=true&layers=show:<id>&f=image`.
  Entrambi passano da `creaTile` (il segnaposto `{bbox-epsg-3857}` lo sostituisce MapLibre).
- **Come dati** (MapServer e FeatureServer, solo layer con geometria): `…/<N>/query?where=1%3D1&geometry=<ovest,sud,est,nord>&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&outSR=4326&returnGeometry=true&f=geojson&resultRecordCount=5001`.
  Passa da `host.addWfsLayer` (GeoJSON, area di Palermo, salvataggio con URL). Oltre 5.000 elementi **o** `exceededTransferLimit`
  (il servizio ha troncato la risposta) → errore: mai dati troncati in silenzio.
- Dopo «Leggi il servizio» un campo «Mostra come» sceglie immagini o dati; predefinito: immagini per MapServer, dati per FeatureServer.
- Il servizio salvato ricorda le voci `{ chiave, nome, tile }` (immagini) o `{ chiave, nome, richiesta }` (dati).

### Token ArcGIS

Un token incollato nell'indirizzo (`?token=…`) vale come credenziale **di sessione**: si toglie dall'URL, si tiene in memoria per l'host
(`credenziali.impostaToken`) e si aggiunge come parametro `token` a ogni richiesta verso quell'host (fetch dell'host e, per i tile,
`setTransformRequest`). Nei layer e nei servizi salvati l'URL non contiene mai il token; il servizio salvato ha il segno `conToken: true`
e alla riapertura mostra il lucchetto, che chiede di nuovo il token (stesso comportamento di utente e password). Non si genera nessun token.

### Test aggiunti

`wmts.js` e `arcgis.js` (puri, con documenti di esempio), `credenziali` (token), `salvati` (nuovi tipi, `conToken`), controllo
(WMTS, ArcGIS immagini/dati, token in sessione), host (`exceededTransferLimit`); verifica a mano nel browser.
