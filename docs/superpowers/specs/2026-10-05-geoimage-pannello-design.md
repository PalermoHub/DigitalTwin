# Geoimage nel pannello di destra

Data: 2026-10-05

## Obiettivo
Portare dentro il Digital Twin di Palermo tutte le funzioni di **Geoimage** (`gbvitrano/Geoimage`, app Leaflet per
georeferenziare mappe storiche) come terzo tab del pannello di destra, accanto a Scheda e RNDT. La base cartografica è
quella del Twin (MapLibre, anche in 3D): niente seconda mappa. La guida di Geoimage diventa un nuovo tab del modale Info.

Successo: l'utente apre il tab «Geoimage», carica una mappa storica, la posiziona, aggiunge i GCP, allinea, confronta
(Swipe/Spotlight) ed esporta nei sei formati di Geoimage, tutto sulla mappa di Palermo. La cartella `Geoimage` non si tocca:
è solo la sorgente da cui si copia la logica. Tutto il codice nuovo sta in `DigitalTwin/`.

## Fuori ambito
- Selettore «Mappa di base» di Geoimage: la base è quella del Twin.
- Geocoding Nominatim: esiste già la ricerca del Twin.
- Barra del titolo, barra di stato e logo di Geoimage (il Twin ha i suoi).
- Mobile (≤720 px): il tab sta nella barra di destra, che su mobile non c'è.
- Google Analytics di Geoimage.

## Decisioni già prese
- **Approccio A**: logica portata su MapLibre; matematica (GCP, affine, poly2, RMSE, export) riusata dal codice di Geoimage.
- **Rendering R1**: l'immagine è un `<img>` DOM sopra il canvas, trasformato con `matrix3d`. Swipe e Spotlight sono
  `clip-path` CSS, come in Geoimage. Conseguenza accettata: l'immagine sta sopra tutti gli strati della mappa.

## Architettura

Nuova cartella `js/geoimage/`, un modulo per scopo, con interfacce piccole:

| File | Cosa fa | Dipende da |
|---|---|---|
| `omografia.js` | pura: da 4 punti schermo calcola l'omografia e il CSS `matrix3d` (immagine W×H → quadrilatero) | niente |
| `trasformazioni.js` | pura: affine, poly2, inverse, residui, RMSE (da `app.js` di Geoimage) | niente |
| `geometria.js` | pura: sposta/ruota/scala i 4 angoli, scala da un angolo, `geoAPixel`, posizione iniziale | niente |
| `storico.js` | pura: pila undo/redo degli angoli (50 passi) | niente |
| `sospensione.js` | intercetta `map.fire('click')` in modalità GCP, così il clic non va a Scheda e strati | niente |
| `confronto-clip.js` | pura: stringhe `clip-path` di Swipe e Spotlight | niente |
| `overlay.js` | l'`<img>` sopra il canvas, riposizionato a ogni `render`; versione ridotta oltre 4096 px | `omografia` |
| `maniglie.js` | marker MapLibre: centro (sposta), rotazione, 4 angoli (scala o deforma) | `geometria` |
| `pannello.js` | solo il markup delle sezioni | niente |
| `immagine.js`, `posizione.js`, `confronto.js`, `gcp.js`, `sessione.js`, `esporta.js` | un modulo `collega*` per sezione, che usa il contesto creato in `index.js` | i moduli sopra |
| `archivio.js`, `progetto.js` | puri: parametri in `localStorage`, progetto JSON nel formato di Geoimage | `trasformazioni` |
| `export.js`, `export-geotiff.js` | KMZ, `.points`, world file, GeoJSON; GeoTIFF con ricampionamento e compressione LZW propria | `trasformazioni` |
| `librerie.js` | carica `proj4` e `jszip` (`js/vendor/`) al primo export | niente |
| `guida-contenuti.js`, `guida.js` | testo e costruzione del tab «Guida Geoimage» | niente |
| `index.js` | `collegaGeoimage(map, elemento)` → `{ apri, chiudi, ripristina }`, stessa forma di `collegaRndt` | tutti |

Integrazione nell'esistente:
- `index.html`: `<aside id="geoimage-pannello" hidden>` accanto a `#rndt-pannello`.
- `js/app.js`: crea `collegaGeoimage` e aggiunge la voce `geoimage` all'elenco di `collegaRail`.
- `js/core/rail.js`: nuova icona `geoimage` in `ICONE`.
- `css/app.css`: `#geoimage-pannello` con le regole di `#rndt-pannello` (stesso posto, stessa larghezza `--scheda-w`) e
  `body:has(...)` esteso con il nuovo pannello. Solo token del tema esistenti (`--accent`, `--surface`, …).
- `js/core/catalogo.js` (modale Info): nuovo tab «Guida Geoimage». `js/core/pannello.js`: il pannello conta tra quelli che ripiegano la barra sinistra sotto 1280 px.
- `js/vendor/`: `proj4` e `jszip` in locale, con le loro licenze (oggi Geoimage li prende da CDN). `geotiff.js` non serve: nell'app originale non veniva mai caricata davvero (è un modulo UMD) e il GeoTIFF si scriveva sempre senza compressione; qui il writer minimo scrive anche LZW.

## Pannello (sezioni, nell'ordine di Geoimage)
1. **Immagine storica**: area di trascinamento / selezione file (JPG, PNG, WEBP, BMP), info (dimensioni), Rimuovi.
2. **Opacità** (slider), Annulla / Ripeti.
3. **Confronto visivo**: Swipe, Spotlight, Inverti, Raggio.
4. **Posiziona overlay**: frecce di spostamento, rotazione ±5°, scala ±10%, Adatta (zoom sull'overlay), Reset, Blocca.
5. **Anteprima punti GCP** (solo in modalità GCP; è solo un'immagine di riferimento, i clic si fanno sulla mappa).
6. **Ground Control Points**: modalità GCP, tabella (#, lat, lon, px, py, residuo), RMSE, tipo di trasformazione
   (affine ≥3 GCP / poly2 ≥6 GCP), «Allinea immagine ai GCP», «Cancella GCP».
7. **Export**: KMZ, GeoTIFF, `.points`, World file, GCP GeoJSON, Esporta/Importa JSON, link MapWarper.

Tutte le etichette in italiano come in Geoimage. Scorciatoie (`G`, `Esc`, `Canc`, `Ctrl+S`, `L`, `Ctrl+Z/Y`) attive solo
con il pannello aperto e il focus fuori dai campi di testo, per non entrare in conflitto con quelle del Twin.

## Flusso dei dati
- Stato unico in `pannello.js`: `{ immagine, angoli[4] (lat/lng), angoliIniziali, gcp[], opacita, tipoTrasformazione }`.
  Ogni modifica degli angoli passa da `geometria`/`storico` e poi `overlay.aggiorna()`; le maniglie e l'overlay leggono
  dallo stesso stato.
- `overlay` si riposiziona su `render` (pan, zoom, rotazione, **pitch**): proietta i 4 angoli, calcola l'omografia,
  imposta `transform: matrix3d(...)` con `transform-origin: 0 0`. L'`<img>` ha `pointer-events: none`; l'interazione
  passa dalle maniglie.
- GCP: passo 1 clic sull'immagine sulla mappa (pixel dell'immagine con `geoAPixel`), passo 2 clic sulla mappa (lng/lat).
  Durante la modalità GCP `sospensione.js` dirotta i clic: Scheda e strati (9 `map.on('click')`) non li ricevono.
- «Allinea» calcola la trasformazione attiva e riscrive gli angoli (come `applyAffine`/`applyPoly2` in Geoimage).
- Export: parte dagli angoli e dai GCP correnti; stessi algoritmi di Geoimage (warp verso griglia nord-su, sampler
  nearest/bilineare, writer GeoTIFF con LZW, fallback senza compressione).

## Gestione errori e limiti
- File non immagine o illeggibile: avviso nel pannello (`#avvisi`, come gli altri moduli), stato invariato.
- Storage pieno o bloccato: il progetto non si salva, si avvisa una volta e si continua. Il JSON esportato resta il backup.
- Libreria vendor non caricata (`proj4`, `jszip`): l'export che la usa si ferma con un avviso, gli altri funzionano.
- Pitch elevato con angoli dietro la camera: l'omografia diventa instabile; si nasconde l'overlay finché i 4 angoli non sono
  davanti alla camera (nessun errore in console).
- L'overlay sta sopra gli strati del Twin: si dichiara nella guida; l'opacità e lo Swipe servono proprio a questo.
- Le maniglie sono marker MapLibre: non vanno in conflitto con il pan della mappa perché fermano la propagazione del
  puntatore durante il trascinamento.

## Test
- JS (Node, `tests/js`): `omografia` (quadrato unitario → identità, punti noti, ordine degli angoli), `trasformazioni`
  (affine esatta su 3 GCP, poly2 su 6, RMSE zero su dati esatti, residui), `geometria` (sposta, ruota 360° = identità,
  scala ±10%), `storico` (limiti, passi multipli), `archivio` (storage assente o pieno), `export` (world file, `.points`,
  GeoJSON dei GCP: testo atteso su un caso fisso).
- Python/Playwright (`tests/test_viewer.py`): il tab Geoimage compare nella barra dx; aprirlo mostra il pannello e
  ripiega gli altri; il tab «Guida Geoimage» compare nel modale Info. Se Chrome non c'è, restano i test JS.
- Verifica manuale nel browser con una vera mappa storica di Palermo: allineare con 4 GCP, RMSE plausibile, Swipe, Spotlight,
  inclinare la mappa in 3D, esportare e riaprire il KMZ. I GeoTIFF dei test si controllano con GDAL (compressione, SR, pixel).

## Documenti
- Guida in-app: tab «Guida Geoimage» nel modale Info (testo adattato da `Geoimage/index.html`, righe ~333-515).
- `README.md`, `NOTICE.md`: citare Geoimage (autore @gbvitrano, licenza del progetto, librerie vendor).

## Rischi
- Il `matrix3d` su `<img>` grandi (8000 px) può essere pesante: si ridimensiona l'immagine mostrata a un massimo di
  ~4096 px sul lato lungo, l'originale resta per l'export.
- Le maniglie in MapLibre sono la parte nuova più delicata (Geoimage usa quelle di `leaflet-distortableimage`):
  si prova per prima nel piano, con un test manuale.
- Il Twin ha già molti listener di clic sulla mappa: la modalità GCP deve spegnerli in modo reversibile.
