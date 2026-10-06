# Geoimage: mappe storiche sulla base di Palermo

Il tab **Geoimage** nella barra verticale a destra (accanto a Scheda e RNDT) sovrappone una mappa storica, o qualsiasi immagine, alla base del Digital Twin e la georeferenzia con i punti di controllo (GCP). Nasce da [Geoimage](https://github.com/gbvitrano/Geoimage) di @gbvitrano, portato da Leaflet a MapLibre. La guida d'uso sta nel foglio Info, tab «Guida Geoimage» (testo in `js/geoimage/guida-contenuti.js`, screenshot in `img/guida/passi/geoimage-*.webp` rigenerati con `python scripts/guida_screenshot_geoimage.py`).

## Come funziona

- **L'immagine** è un `<img>` sopra il canvas della mappa, portato sui 4 angoli geografici con un'omografia CSS (`matrix3d`, `js/geoimage/omografia.js`). A ogni `render` della mappa gli angoli si riproiettano: l'immagine segue pan, zoom, rotazione e inclinazione (3D). Sta sopra tutti gli strati, come un confronto con la base. Oltre 4096 px sul lato lungo si mostra una versione ridotta; l'originale resta per l'export.
- **Swipe e Spotlight** sono ritagli CSS (`clip-path`) del contenitore dell'immagine (`confronto-clip.js`, `confronto.js`).
- **Maniglie** (`maniglie.js`): marker MapLibre trascinabili. Centro sposta, punto sopra il lato nord ruota, angoli scalano (proporzionale) o deformano (liberi). Compaiono solo a pannello aperto.
- **GCP** (`gcp.js`): due clic per punto, il primo sull'immagine (si ricava il pixel con `geoAPixel`), il secondo sulla mappa. In questa modalità `sospensione.js` intercetta `map.fire('click')`, così il clic non apre la Scheda né attiva gli altri strati.
- **Trasformazioni** (`trasformazioni.js`): affine (≥3 GCP) o polinomiale di 2° grado (≥6), con residui in metri e RMSE.
- **Export** (`export.js`, `export-geotiff.js`): KMZ (`gx:LatLonQuad`), GeoTIFF (ricampionato sul sistema scelto, con compressione LZW scritta da `lzwComprimi`), `.points` di QGIS, world file, GCP GeoJSON, progetto JSON. Le librerie `proj4` e `jszip` (`js/vendor/`) si caricano al primo export.

## Memoria e file

- I parametri del progetto (angoli, GCP, opacità, tipo di trasformazione) stanno in `localStorage` (`dt:geoimage:v1`); l'immagine in IndexedDB, nell'archivio `dt-rndt` con chiave `geoimage:immagine` (`js/rndt/dati.js`). Se il browser blocca lo storage, l'app funziona e un avviso suggerisce «Esporta JSON».
- Il progetto JSON ha il formato di Geoimage (version 1): i file dell'app originale si aprono qui e viceversa. `transformType` è un campo in più, facoltativo.

## Limiti noti

- Pensato per il mouse. Sotto i 720 px la barra di destra non c'è: Geoimage si apre dal pulsante nel pannello Strati e si chiude con la X del pannello.
- L'immagine non può stare sotto altri strati: usa opacità, Swipe e Spotlight.
- Con la mappa molto inclinata gli angoli possono finire dietro la camera: l'immagine si nasconde finché tornano davanti.
- Sostituito rispetto a Geoimage: niente selettore della mappa di base né ricerca luoghi (si usano quelli del Twin); il cambio scala/deforma degli angoli è un pulsante, non il clic sull'immagine (il clic apre la Scheda).
- Il GeoTIFF è compresso davvero LZW; nell'app originale la scelta «LZW» non comprimeva (la libreria `geotiff.js` non veniva caricata) e scriveva sempre senza compressione.

## Prove

`npm run test:js` (matematica, formati, archivio) e `python -m pytest tests/test_geoimage.py` (browser: tab, maniglie, GCP, Swipe/Spotlight, persistenza, export verificati con GDAL). Prova manuale consigliata con una vera mappa storica di Palermo (per esempio dalle mappe digitalizzate della Biblioteca Comunale o dell'Archivio di Stato): caricarla, posizionarla, aggiungere almeno 4 GCP agli angoli, allineare, controllare l'RMSE, provare Swipe e Spotlight, inclinare la mappa, esportare il KMZ e aprirlo in Google Earth o QGIS. Anche i file JSON salvati con Geoimage si aprono con «Importa JSON».
