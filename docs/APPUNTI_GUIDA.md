# Appunti per l'aggiornamento della Guida

Modifiche fatte dopo l'ultimo aggiornamento della Guida (slide «Tutto in un punto», commit `20d1fd5`, 5 ottobre 2026 ore 23:42) fino al 6 ottobre 2026 ore 01:45 (commit `a9e4a7b`).
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
