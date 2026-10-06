# Appunti per l'aggiornamento della Guida

Modifiche fatte dopo l'ultimo aggiornamento della Guida (slide «Tutto in un punto», commit `20d1fd5`, 5 ottobre 2026 ore 23:42) fino al 6 ottobre 2026 ore 01:45 (commit `a9e4a7b`). Le sezioni 8–13 raccolgono il lavoro della mattina del 6 ottobre (ore 08–09:15, commit da `639a7aa` a `7b62922` e successivi).
Alla fine degli aggiornamenti: rivedere `js/core/guida-contenuti.js` (fonte unica), rigenerare screenshot (`scripts/guida_screenshot.py`) e, se serve, il video con la voce.

Legenda: **[Guida]** = da riflettere nella Guida; **[Fonti]** = da riflettere in «Fonti e avvisi»; **[Tecnico]** = non per l'utente.

---

## 1. Invito «Clicca sulla mappa» all'avvio — `js/core/invito.js`
(commit `20d1fd5`, `1073838`, `1b6731e`, `c057fdb`, `da6409b`, `5c49515`)

- All'apertura compare un pill con l'invito a cliccare sulla mappa, con lo schema «Tutto in un punto» (`img/guida/passi/intersezione.svg`, SVG leggero 4 KB al posto del jpg da 200 KB). Su schermi stretti (< 600 px) resta solo il pill, senza schema.
- Il pill **non sparisce da solo** (nessun timer): scompare solo con il clic sulla mappa.
- **Compare a ogni apertura.** Il pulsante **«Non mostrare più»** lo spegne per sempre (localStorage `dt.invito.no`); **«Ripristina»** (nel ripristino impostazioni) lo riaccende.
- Chiave localStorage nuova: la vecchia nascondeva il pill nei browser già usati.
- **[Guida]** Slide «Tutto in un punto» già inserita nella Guida; verificare che il testo citi anche l'invito all'avvio e il «Non mostrare più».

## 2. Legenda «Selezione in mappa» — `js/core/evidenza.js`
(commit `d2a6902`)

- Quando si clicca sulla mappa, le aree evidenziate (edificio, particella, fermate vicine, ecc.) hanno ora una **legenda** in basso (`#legenda-selezione`) con una voce per etichetta e il colore con cui è disegnata (cerchio per i punti, quadrato per le aree).
- La legenda **fa da filtro**, come le altre: clic su una voce = resta in mappa solo quella; secondo clic = le riaccende tutte.
- **Tooltip al passaggio del mouse** sulle aree evidenziate: nome del layer + attributo che identifica l'elemento (foglio/particella, zona PRG con descrizione, fascia OMI, indirizzo dell'immobile, civico, nome della fermata, sezione censuaria…).
- **Pulsante icona fumetto** nella legenda: accende/spegne i tooltip.
- **[Guida]** Aggiungere un cenno nel passo «Un clic sulla mappa» (e/o «Tutto in un punto»): cosa significano i colori evidenziati, il filtro dalla legenda, il tooltip e come spegnerlo. Nuovo screenshot del passo `clic`.

## 3. Mappe storiche (15 carte) — `js/layers/base.js`, `js/core/catalogo.js`
(commit `3e321f3`, `ccf6613`)

- Nel tab **Mappe di base** nuova sezione **«Mappe storiche»** con 15 carte georeferenziate (tile Map Warper dall'Atlante delle carte tecniche storiche di Palermo, OpenDataSicilia): 1580, 1754, 1860, 1877, 1882, 1891, 1893, 1908, 1935, 1941, 1943, 1956, 1962, 1987, 1993. (Il «23» delle note di sessione era una stima: in `STORICHE` sono 15.)
- Ogni carta ha un **pallino di precisione** della sovrapposizione: verde = alta, giallo = media, rosso = bassa (giudizio editoriale dell'atlante). Zoom massimo diverso per carta (16–18).
- Sotto il titolo, nota con **link all'Atlante** che si apre in una nuova scheda, **con zoom e coordinate della mappa corrente** (pulsante aggiunto in `ccf6613`).
- **[Fonti]** Voce aggiunta: «Mappe storiche (1580–1993): Atlante delle carte tecniche storiche di Palermo, OpenDataSicilia (A. Borruso, F. P. Paolicelli, C. Spataro, G. B. Vitrano), Map Warper — CC BY 4.0»; fonti originali (BnF Gallica, Library of Congress, Harvard Map Collection, U.S. Army Map Service, Comune di Palermo) nell'attribuzione di ogni mappa.
- **[Guida]** Nuovo passo (o paragrafo) sulle mappe storiche: dove si trovano, il significato del pallino, la trasparenza per confrontare con la mappa attuale (se prevista), il link all'atlante. Nuovo screenshot.
- Immagini nuove: miniature `img/basi/st-*.jpg`.

## 4. Isole di calore — `js/layers/isole-calore*.js`, `scripts/isole_calore.py`, `dati/isole-calore/`
(commit `a9e4a7b`)

- Nuovo strato **Isole di calore** (gruppo con etichetta «Isole di calore»): temperatura superficiale estiva (LST, Landsat 8/9, USGS) per **sezione censuaria ISTAT 2021** (3600 sezioni), **solo anno 2025** in mappa.
- **Metodi di classificazione** selezionabili: Jenks, quantili, intervalli uguali; numero di classi da 3 a 9. Soglie precalcolate (`isole-calore.json`), il browser non ricalcola.
- **Grafici** dell'andamento comunale 2019–2025 (media, mediana, quartili) e legenda a classi.
- **Scheda del luogo**: nuova voce «Isola di calore» con *Temperatura estiva*, *Rispetto alla media comunale*, *Variazione dal 2019*.
- **Link di approfondimento** allo studio completo: <https://palermohub.opendatasicilia.it/isole_di_calore.html>.
- Avvertenza da riportare: è la temperatura **della superficie**, non dell'aria.
- Dati: `dati/isole-calore/sezioni.pmtiles` (1,3 MB), `isole-calore.json`, README.
- **[Fonti]** `NOTICE.md` già aggiornato: Landsat 8/9 (USGS, dominio pubblico) elaborati per sezione ISTAT; studio OpenDataSicilia / PalermoHub, CC BY 4.0. Aggiungere la voce anche in «Fonti e avvisi».
- **[Guida]** Nuovo passo come quelli di PAI/Incendi: strato, scelta metodo e classi, grafico, scheda, avvertenza. Nuova scena per `guida_screenshot.py`.

## 5. Ordine di disegno globale — `js/core/riordino.js`, `js/core/pannello.js`
(commit `a9e4a7b`)

- Nel **tab Layer**, sotto «Cerca strato», nuova sezione comprimibile **«Ordine layer in mappa»**: elenco unico di **tutti gli strati accesi, di qualsiasi gruppo** (accanto a ogni nome, il gruppo di provenienza).
- In alto = sopra sulla mappa. Si riordina con **frecce su/giù** o **trascinando** la maniglia; con un solo strato acceso i comandi sono nascosti.
- Pulsante **«Ripristina ordine»**; l'ordine è salvato nel browser (`dt-ordine-disegno`) e riapplicato alla visita successiva.
- Si sincronizza con il riordino interno dei gruppi (se cambia uno, si aggiorna l'altro).
- **[Guida]** Nuovo passo nel capitolo sugli strati: come portare un layer sopra un altro, anche di gruppi diversi. Screenshot del tab Layer con la sezione aperta.

## 6. Altre piccole modifiche
- `js/layers/trasporto-vicino.js`: ritocco minore (2 righe) nello stesso commit della legenda.
- `js/core/scheda-preferenze.js`: «Isola di calore» aggiunta alle preferenze della scheda (può essere nascosta come le altre sezioni).

## 7. Test (stato a fine sessione)
- JS: 482 ✓ · Python: 167 ✓ · prova nel browser ✓ (isole di calore, riordino).
- `tests/test_viewer.py` aggiornato per mappe storiche, isole di calore e Guida (15 sezioni).
- Prima di aggiornare la Guida controllare `tests/js/guida.test.mjs` e `tests/test_viewer.py`: contano i passi della Guida (aggiungere i nuovi passi cambia i conteggi).

## 8. «I miei layer»: file e servizi per indirizzo — `js/aggiungi/`, `js/rndt/gruppo.js`
(commit `639a7aa` … `b990dfe`, `2b7585a`; documento di riferimento: `docs/AGGIUNGI_LAYER.md`)

- Nuovo gruppo **«I miei layer»** nella barra sinistra (icona «libreria con +», subito dopo RNDT). In cima ha un **albero** come il Browser di QGIS: campo **«Cerca sorgenti dati…»**, **I miei dati** (l'icona di caricamento apre il selettore dei file) e **Servizi** con un ramo per tipo, ciascuno con conteggio e **«＋»** per aggiungere un servizio. Sotto: **«Layer in mappa»** con le righe di sempre (casella, opacità, rimozione, frecce).
- **Carica file dal computer** non sta più nel gruppo RNDT: si fa da «I miei dati» (stessi formati: GeoJSON, KML/KMZ, GPX, Shapefile zip, CSV con lat/lon; fino a 5 MB per file, solo gli elementi dentro Palermo). I file già caricati passano da soli al nuovo gruppo.
- **Servizi supportati**: XYZ, WMS, WFS (prima versione) e, dopo, **WMTS** e **ArcGIS REST** (sezione 11). Per WMS/WMTS/WFS/ArcGIS «Leggi il servizio» mostra i layer da spuntare; i layer non utilizzabili (WMS senza EPSG:3857, WMTS con piramide diversa) compaiono come «non supportato».
- **Servizi salvati**: ogni servizio aggiunto resta nel browser (massimo 50) sotto il suo tipo; un clic lo rimette in mappa, il cestino lo toglie dall'elenco, il campo di ricerca li filtra. I layer aggiunti tornano alla riapertura dell'app.
- **Stesso limite di Palermo del catalogo RNDT**: i tile si vedono solo nel riquadro della città, i WFS/ArcGIS-dati si scaricano solo per l'area di Palermo (massimo 5.000 elementi; un servizio che tronca la risposta dà un errore, mai dati parziali).
- I layer di questo gruppo **non** si interrogano con il clic sulla mappa (lo fa solo il catalogo RNDT).
- **[Guida]** Il passo statico `rndt-gruppo` («Il gruppo RNDT e i tuoi file») ha già il **testo aggiornato** (i file si caricano da «I miei layer»), ma lo **screenshot `img/guida/passi/rndt-gruppo.webp` mostra ancora il vecchio gruppo RNDT** con il pulsante «Carica file dal computer»: va rigenerato (`scripts/guida_screenshot_rndt.py`, serve Chrome per Playwright). Valutare un passo nuovo «Aggiungi i tuoi dati» con screenshot dell'albero (id **senza** il prefisso `rndt`, perché `guida.test.mjs` conta i passi `rndt*`).
- **[Tecnico]** Secondo host (`creaHost` con prefisso `miei`), memoria `dt:miei:v1` e `dt:miei:servizi:v1`; migrazione una tantum dei file da `dt:rndt:v1`.

## 9. Utente e password dei servizi — `js/aggiungi/credenziali.js`, `worker/proxy-core.js`
(commit `f5f064e`, `4add9f8`, `e69fadb`)

- Ogni modulo di aggiunta ha i campi **Utente** e **Password** (facoltativi) per i servizi protetti con autenticazione **Basic**.
- **Solo per la sessione**: restano in memoria finché la pagina è aperta; non vanno in `localStorage`, IndexedDB o URL. Del servizio salvato si ricorda solo il nome utente.
- Alla riapertura un servizio con utente mostra il **lucchetto**; i suoi layer risultano «non disponibili»; un clic sulla riga chiede la password e li rimette in mappa. Password sbagliata: il lucchetto resta e si può riprovare. Un 401 dà «il servizio richiede utente e password».
- **[Tecnico] Worker**: inoltra `Authorization` solo all'host richiesto (mai su un redirect verso un altro), non la registra, non rimanda `WWW-Authenticate` al browser (niente finestra di login), CORS con `authorization` esplicito. **Va ripubblicato** (`npx wrangler deploy`) perché i servizi protetti funzionino in produzione. Provato con httpbin: 200 con credenziali, 401 senza.
- **[Guida]** Un paragrafo nel passo sui dati aggiunti: utente e password restano solo finché la pagina è aperta; il lucchetto alla riapertura.

## 10. Ordine sopra/sotto anche per i nuovi layer — `js/core/pannello.js`
(commit `6d4ae84`)

- Nella sezione **«Ordine layer in mappa»** (sezione 5) compaiono ora anche i layer di **«I miei layer»** e **RNDT**, prima ignorati (l'elenco si leggeva una volta sola all'avvio): si possono mettere sopra o sotto gli strati di qualunque altro gruppo. Un layer appena aggiunto parte in cima a tutto.
- Dentro «I miei layer» le righe hanno anche frecce e trascinamento, come gli altri gruppi.
- **[Guida]** Nel passo «Ordine layer in mappa» (sezione 5) aggiungere che vale anche per i layer dei propri servizi e dei dati RNDT.

## 11. WMTS e ArcGIS REST — `js/aggiungi/wmts.js`, `js/aggiungi/arcgis.js`
(commit `9e1c0ee`, `e085e32`, `1062817`, `7b62922`)

- **WMTS**: funziona con le piramidi «Google Maps» (EPSG:3857, tile 256 px, livelli 0, 1, 2…); diventano layer XYZ. Provato con basemap.at (7 layer).
- **ArcGIS REST** (`…/MapServer` o `…/FeatureServer`, anche `/N`; `ImageServer` no): scelta **«Mostra come»**:
  - **Immagini** (MapServer): cache a tile se standard (un solo layer), altrimenti un raster `export` per layer. Provato con World_Street_Map (cache).
  - **Dati**: GeoJSON nell'area di Palermo, interrogabile; risposte troncate dal servizio = errore. Provato con un FeatureServer di Esri (poligoni in mappa).
- **Token ArcGIS** incollato nell'indirizzo (`?token=…`): credenziale di sessione, tolta dall'URL, tenuta in memoria e aggiunta a ogni richiesta (anche ai tile); mai salvata (il servizio salvato ha solo il segno `conToken` e al riavvio mostra il lucchetto). Non si generano token da utente e password.
- **[Guida]** Elencare i cinque tipi di servizio (XYZ, WMS, WMTS, WFS, ArcGIS REST) e il «Mostra come» di ArcGIS; limiti: piramidi diverse da Web Mercator e ImageServer non supportati.

## 12. Correzione di un difetto: i layer XYZ non comparivano in mappa
(commit `2b7585a`)

- Un layer **XYZ** (anche del catalogo RNDT) veniva aggiunto all'elenco ma **non alla mappa**: MapLibre rifiutava in silenzio la sorgente (`attribution: undefined`). Corretto, e ora un layer che la mappa rifiuta dà un errore visibile invece di restare un fantasma nell'elenco. Nessun testo di Guida da cambiare.

## 13. Test e verifiche (stato a fine mattina)
- JS: **598 ✓** (erano 482) · Python non rilanciati in questa sessione (167 ✓ a inizio mattina).
- Prove nel browser con Chromium headless e proxy locale: XYZ, WMS (terrestris), WMTS (basemap.at), ArcGIS cache e FeatureServer (Esri), WFS (ARPA Piemonte: capabilities e richiesta ok, nessun elemento a Palermo), file GeoJSON, migrazione, credenziali, token (richieste con `token=`, nulla in `localStorage`, lucchetto dopo il ricaricamento).
- **Non provato con dati reali**: WFS con elementi a Palermo (l'ordine degli assi del `bbox` WFS ≥ 1.1.0 resta da confermare), tile protetti da utente e password reali, token ArcGIS veri.
- `guida.test.mjs` conta i passi `rndt*` (3): un passo nuovo sui propri dati va chiamato in altro modo.

## Checklist per l'aggiornamento della Guida
- [ ] Passo «clic»: legenda selezione, filtro, tooltip, pulsante fumetto
- [ ] Slide «Tutto in un punto»: cenno all'invito e a «Non mostrare più»
- [ ] Nuovo passo Mappe storiche
- [ ] Nuovo passo Isole di calore
- [ ] Nuovo passo Ordine layer in mappa
- [ ] «Fonti e avvisi»: isole di calore (Landsat/USGS) verificata
- [ ] Screenshot e scene in `scripts/guida_screenshot.py`
- [ ] Video + voce (se i passi entrano nel video; i passi «statici» no)
- [ ] Aggiornare i test sul numero di passi
- [ ] Passo/paragrafo «I miei layer»: albero, file e servizi (XYZ, WMS, WMTS, WFS, ArcGIS REST), servizi salvati
- [ ] Rigenerare lo screenshot `rndt-gruppo.webp` (mostra ancora il pulsante file nel gruppo RNDT)
- [ ] Paragrafo su utente/password/token: restano solo nella sessione, lucchetto alla riapertura
- [ ] Passo «Ordine layer in mappa»: vale anche per i layer propri e RNDT
- [ ] Ripubblicare il Worker (`npx wrangler deploy`) prima di annunciare i servizi protetti
