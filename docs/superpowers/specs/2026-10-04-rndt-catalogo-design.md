# Catalogo RNDT nella scheda del luogo — design

Data: 2026-10-04. Percorso: architetturale. Stato: design approvato in chat, spec da rivedere.

## Obiettivo

Dalla scheda del luogo l'utente apre il catalogo RNDT (Repertorio Nazionale dei Dati Territoriali), aggiunge servizi WMS/WFS/GeoJSON alla mappa e ne consulta i dati nella scheda. L'area di lavoro è **solo Palermo**.

## Decisioni già prese

- Si riusa il plugin `plugin/openrndt-geolibre-0.2.0` (bundle `dist/index.js` + `dist/style.css`) **senza modificarlo**. Uno shim implementa sulla mappa MapLibre le API che il plugin chiede all'host GeoLibre.
- Il pannello RNDT si apre da un'icona nell'header della scheda (accanto a ingranaggio e X) e si sovrappone al corpo della scheda. Chiuso, la scheda riappare. I layer aggiunti restano sulla mappa.
- I layer aggiunti si salvano tra una sessione e l'altra (`localStorage`).
- Un Cloudflare Worker fa da proxy CORS.
- Le info dei layer RNDT compaiono nella scheda in una tab dedicata **«Altri dati (RNDT)»**.
- Area fissa su Palermo: ricerca nel catalogo, download WFS e ritaglio sono limitati al Comune.

## Assunzioni da confermare

- «Salvare le sezioni» = salvare le **sessioni** (i layer ricompaiono alla riapertura).
- Un pulsante RNDT anche nella toolbar della mappa, per poter aprire il pannello senza scheda aperta (consigliato, da confermare).
- Licenza del bundle `openrndt-geolibre` da verificare prima di includerlo nel repo.

## Unità

| File | Scopo | Dipende da |
|---|---|---|
| `js/rndt/host.js` | Shim delle API GeoLibre sulla mappa MapLibre | `maplibregl`, mappa |
| `js/rndt/pannello.js` | Overlay sopra la scheda; ospita la UI del plugin; barra «‹ Scheda» | `host.js`, bundle |
| `js/rndt/archivio.js` | Puro: salva e ricarica i layer RNDT in `localStorage` | nessuna |
| `js/rndt/info.js` | Puro: dato un punto, produce le sezioni del modello scheda per i layer RNDT attivi | `scheda-modello.js` |
| `js/rndt/area.js` | Puro: bbox di Palermo, ritaglio delle feature sul confine comunale | confine esistente |
| `worker/rndt-proxy.js` | Proxy GET con CORS e allowlist di host | Cloudflare Workers |

### `host.js` — API GeoLibre implementate

- Pannello e menu: `registerRightPanel`, `openRightPanel`, `closeRightPanel`, `registerToolbarMenu`.
- Mappa: `getMap`, `getViewBounds`, `fitBounds`, `getLayers`, `getDrawnFeatures` (vuota), `getProjectSnapshot`.
- Aggiunta layer: `addWmsLayer` e `addTileLayer` creano una source `raster`; `addGeoJsonLayer` crea source GeoJSON più layer fill/line/circle.
- Rete: `fetchArrayBuffer`, `fetchVectorUrl` passano dal Worker.
- Altro: `exportTextFile`, `openExternalUrl`, `importLayerStyle` (stub), `activatePlugin`.
- Ogni layer aggiunto è registrato in `archivio.js` con tipo, URL, nome, `crs`, visibilità.

## Area: solo Palermo

- Il filtro «Where» del plugin parte con la bbox del Comune (da `LIMITI` in `js/core/config.js`) e non con «Anywhere». Il filtro catalogo predefinito è «Touches», così restano anche i servizi regionali e nazionali che coprono Palermo (esempio: PAI).
- Il download WFS è sempre filtrato sul bbox: la casella «Only features in the current map view» è forzata, con il bbox del Comune al posto della vista. Il tetto di 10.000 feature resta; per layer densi (esempio: particelle catastali, 243.000) si usa il WMS.
- Ritaglio sul confine comunale delle feature scaricate, **solo sotto una soglia di feature** per non bloccare il browser. Il WMS non si può ritagliare: si vede il rettangolo.
- La modalità «Anywhere» non è offerta.

## Persistenza

- Chiave `localStorage` dedicata, con versione di schema. Tutte le letture e scritture in `try/catch`; senza `localStorage` l'app funziona e lo segnala una volta.
- Al caricamento della mappa, `restoreLayers` ricrea i layer. I GeoJSON scaricati da WFS salvano URL e filtro, non i dati. Un layer che non risponde più è segnato «non disponibile», mai rimosso senza azione dell'utente.

## Info nella scheda (tab «Altri dati (RNDT)»)

- Il click sulla mappa è sincrono; le risposte RNDT sono asincrone. La scheda si apre come oggi; la tab RNDT compare in fondo con «Caricamento…» e si riempie quando arrivano le risposte.
- WMS: `GetFeatureInfo` con `application/json` se supportato, altrimenti `text/html` o `text/plain` mostrati come testo. WFS: richiesta con filtro spaziale su un piccolo bbox attorno al punto.
- Ogni layer è una sezione: titolo, fonte (ente e link alla scheda del catalogo), attributi come righe, «nessun dato» se vuoto.
- Avviso in fondo: dati di terzi, senza valore legale (riuso di `NOTA_LEGALE`).
- Modifica a `js/core/scheda.js`: `mostra` accetta sezioni in ritardo, con una funzione `aggiungiSezioni` che aggiunge anche la tab. È la parte più delicata.
- Punto senza dati: oggi la scheda si chiude con «Nessun dato». Con almeno un layer RNDT attivo nel punto la scheda si apre comunque, per mostrare la tab RNDT.

## Errori e sicurezza

- Timeout di 8 s per layer; un errore mostra «servizio non raggiungibile» e non blocca gli altri.
- Worker: solo GET, allowlist di host (`geodati.gov.it` più i domini dei servizi del catalogo), rifiuto di risposte oltre ~10 MB, nessuna cache sui dati.

## Test

- `node --test` per `archivio`, `info` (con risposte GetFeatureInfo di esempio), `area` e `host` (mappa finta).
- Test del Worker con fetch simulata (allowlist, limite di dimensione, solo GET).
- Verifica nel browser con chrome-devtools-mcp (Playwright e Chrome non sono disponibili in questo ambiente).

## Fuori ambito

- Modifica del bundle del plugin.
- Ricerca nazionale (modalità «Anywhere»).
- Salvataggio dei dati scaricati (solo URL e filtri).

## Aggiornamenti dal piano (2026-10-04)

- **Worker**: niente allowlist statica; regole: solo https, solo GET/HEAD, nessun IP/localhost/porta, origine nella lista `ORIGINI`, limite 10 MB. Rotta `/t/<host>/<percorso>?<query>` (serve anche ai tile WMS).
- **Info WFS**: un WFS scaricato è un layer GeoJSON in mappa; la scheda usa `queryRenderedFeatures`. Solo il WMS usa `GetFeatureInfo`.
- **Ritaglio**: filtra le feature intere che toccano il Comune, nessun taglio geometrico.
- **Persistenza WFS**: l'URL del download si lega al layer con l'ultimo URL di dati scaricato negli ultimi 30 s; senza URL noto il layer vale solo per la sessione.
- **Elenco layer**: l'overlay mostra «Layer aggiunti» con visibilità e rimozione.
