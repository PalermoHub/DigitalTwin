# Piano di miglioramento della webapp Digital Twin Palermo

Data: 2026-10-07. Basato su analisi del codice, audit `innerHTML` e Lighthouse (server locale, Chromium headless senza GPU).

## Punto di partenza

| Misura | Desktop | Mobile |
|---|---|---|
| Performance | 33 | 27 |
| Accessibilità | 95 | 100 |
| Best practices | 100 | 100 |
| SEO | 100 | 100 |
| LCP | 4,7 s | 7,2 s |
| TBT | 8,6 s | 13,6 s |
| TTI | 12,2 s | 21,8 s |
| CLS | 0,004 | 0,029 |

Limiti della misura: senza GPU MapLibre usa il render software e gonfia TBT/TTI; `scripts/serve.py` non comprime e manda `no-store`, quindi byte e cache non rappresentano la produzione. La Fase 0 serve a fissare una base affidabile.

Esito audit `innerHTML`: 29 punti, tutti con contenuto statico (icone SVG, `<option>` fissi, numeri formattati). Nessun testo esterno entra in `innerHTML`. Nessun intervento urgente.

## Regole di lavoro

- Una fase = uno o più commit piccoli, test verdi prima di chiudere (`npm run test:js`, `pytest`).
- Dopo ogni modifica al codice: `graphify update .`.
- Ogni fase di prestazioni si chiude con una nuova misura, confrontata con la tabella sopra.
- Non cambiare indirizzi (`#guida`, `#fonti`...), etichette del menu, né nomi dei campi: i link condivisi devono continuare a funzionare.

---

## Fase 0. Misura affidabile e rete di sicurezza

Obiettivo: numeri confrontabili e test automatici ad ogni push.

- [ ] Misurare Lighthouse sul sito pubblicato (o su un server locale con gzip/brotli e cache) e salvare i report in `docs/misure/2026-10-07/`.
- [ ] Salvare lo script di misura (Chromium di Playwright + `lighthouse --port`) in `scripts/lighthouse.sh`, così si ripete uguale.
- [ ] Aggiungere `.github/workflows/test.yml`: su push e pull request lancia `npm run test:js` e `pytest`.
- [ ] Verificare il `.gitignore`: c'è `!dati/incedi/` ma il layer si chiama `incendi`. Se la cartella reale è `dati/incendi`, correggere l'eccezione e controllare che i dati siano tracciati.
- [ ] Eliminare o spostare fuori dal repo `dati/delete` (257 MB, già ignorato da git).

Chiusura: workflow verde, report di base committati.

## Fase 1. Correzioni rapide (poche ore)

Obiettivo: chiudere i difetti già misurati, senza rischi.

- [ ] `#strati-chip`: rimuovere `role="list"` oppure dare `role="listitem"` ai figli (audit `aria-required-children`). Rimisurare l'accessibilità desktop.
- [ ] `img/guida/passi/intersezione.svg`: aggiungere `width` e `height`.
- [ ] `index.html`: aggiungere `og:image`, `og:url`, `twitter:card` e `link rel="canonical"`; creare l'immagine di anteprima 1200x630 in `img/`.
- [ ] `index.html`: aggiungere `<link rel="manifest">` con un `manifest.webmanifest` minimo (nome, icone, colori) in preparazione alla Fase 5.
- [ ] Piè di pagina: rendere leggibili ai lettori di schermo le coordinate (`#piede-coord`), oppure lasciarle `aria-hidden` ma documentare la scelta.

Chiusura: Lighthouse accessibilità 100 su desktop e mobile, anteprima social verificata con un debugger di link.

## Fase 2. Peso dei dati caricati all'avvio

Obiettivo: ridurre i byte e il lavoro prima del primo layer visibile.

- [ ] `dati/monumenti/monumenti.geojson` (1,7 MB): ridurre la precisione delle coordinate, togliere i campi non usati dalla scheda, valutare PMTiles o un file compatto come già fatto in `compatta_dati.py`.
- [ ] Controllare gli altri GeoJSON differiti (alberi, fontanelle, scuole, uffici, colonnine) con la stessa procedura.
- [ ] `edificato.pmtiles` è richiesto 3 volte in range diversi: verificare se il layer parte anche da spento e rinviare le richieste finché lo strato non è acceso.
- [ ] Controllare che il server di produzione serva dati e JS con compressione (brotli o gzip) e `Cache-Control` lungo per i file con hash o versione.
- [ ] Aggiornare `scripts/valida_dati.py` con un limite di peso per file, così un dato troppo grande non rientra per sbaglio.

Chiusura: byte iniziali ridotti di almeno il 30%, test dati verdi, nuova misura.

## Fase 3. JavaScript e CSS: build leggera

Obiettivo: meno codice da scaricare e da eseguire. Il main thread è il collo di bottiglia (TBT e TTI).

- [ ] Introdurre `esbuild` come unica dipendenza di sviluppo: bundle e minificazione di `js/` e `css/app.css` in `dist/`, con source map.
- [ ] Mantenere l'app funzionante anche senza build in sviluppo (`scripts/serve.py` serve i sorgenti, la build serve solo alla pubblicazione).
- [ ] Spostare in `import()` lazy i moduli non necessari all'avvio, sul modello già usato per Geoimage: catalogo RNDT, pannello Aggiungi, stampa, guida, temi dei pannelli, grafici (colonnine, isole di calore).
- [ ] Ridurre il CSS non usato (circa 155 KiB): separare gli stili dei pannelli secondari e caricarli con il modulo.
- [ ] Analizzare la trace (DevTools) per `forced-reflow` e LCP discovery; correggere letture di layout dentro cicli.
- [ ] Valutare la sostituzione di `maplibre-gl.js` completo con la build CSP/minimale se compatibile.

Chiusura: JS non usato sotto 200 KiB, TBT dimezzato rispetto alla base, test JS verdi.

## Fase 4. Struttura del codice

Obiettivo: rendere più semplice cambiare l'app senza regressioni.

- [ ] `app.js`: sostituire il monkey-patch di `map.addSource` e il polling `setInterval` (timeout 20 s) con un campo dichiarativo nel modulo (`differito: true`) e l'attesa dell'evento `sourcedata`. Test dedicati.
- [ ] Spezzare `core/scheda.js` (706 righe) e `core/pannello.js` (704 righe) per responsabilità (intestazione, azioni, contenuto, riordino).
- [ ] Unificare le icone: una sola libreria (Phosphor o Tabler) al posto di SVG scritti a mano e simboli Unicode (`▾ ▸ ·`).
- [ ] Per gli `href` che arrivano da dati (`monumenti.js`, `scheda.js`, `isole-calore.js`): funzione unica `urlSicuro()` che accetta solo `http:` e `https:`.
- [ ] Unire i test della guida (`test_guida_carosello`, `2`, `3`, `4`) in un solo file parametrizzato.

Chiusura: nessun cambio visibile all'utente, tutti i test verdi, `graphify update .`.

## Fase 5. Navigazione e UX

Obiettivo: meno punti d'ingresso, controlli più chiari.

- [ ] Mappa dei punti d'ingresso attuali (menu, rail, Strati, barra strumenti, Filtri) e proposta di unificazione, da provare con 3-5 utenti reali prima di cambiare.
- [ ] Etichette testuali (o tooltip visibili) per Filtri e Ripristina, oggi solo icone nella barra di ricerca.
- [ ] Spiegare in legenda il limite di zoom 12-18, se dipende dai dati.
- [ ] Onboarding: estendere `collegaInvito` con 3 passi (cerca, accendi uno strato, apri la scheda) e opzione "non mostrare più".
- [ ] Alternativa testuale alla mappa: elenco dei risultati di ricerca navigabile da tastiera come vista tabellare.
- [ ] Controllo contrasto in tema scuro di chip e badge; aggiungere `prefers-contrast`.

Chiusura: test con utenti, nessuna regressione di accessibilità.

## Fase 6. Funzionamento offline e diffusione

Obiettivo: visite ripetute istantanee e scoperta del progetto.

- [ ] Service worker: cache dei file statici dell'app (shell, JS, CSS, icone) con strategia stale-while-revalidate; dati e PMTiles con cache a range e limite di dimensione.
- [ ] Completare il manifest (icone maschera, schermata di avvio, `display: standalone`) per l'installazione su mobile.
- [ ] Pagina di presentazione statica (landing) con il video del tour, link all'app, descrizione e dati strutturati `WebApplication`; da progettare con la skill `design-taste-frontend` solo per questa pagina, non per l'app.
- [ ] Aggiungere `sitemap.xml` e `robots.txt`.

Chiusura: Lighthouse PWA/installabilità, seconda visita sotto 1 s al primo layer.

---

## Obiettivi finali (da verificare in produzione)

| Misura | Oggi (locale) | Obiettivo |
|---|---|---|
| Performance mobile | 27 | 60+ |
| Performance desktop | 33 | 75+ |
| LCP mobile | 7,2 s | sotto 4 s |
| TBT mobile | 13,6 s | sotto 2 s |
| Accessibilità | 95-100 | 100 |
| JS non usato | 455 KiB | sotto 200 KiB |

## Rischi

- **Build e cache:** una build con hash cambia gli indirizzi dei file; la guida e il video citano solo `index.html`, ma controllare `scripts/guida_*.py` e `scripts/video_tour.py`.
- **Lazy loading:** moduli caricati tardi possono rompere codice che li assume presenti; coprire con i test JS e con un giro manuale su desktop e mobile.
- **Service worker:** una cache sbagliata serve dati vecchi; prevedere versione della cache e pulsante di aggiornamento.
- **Misure:** confrontare sempre con lo stesso metodo (stesso dispositivo emulato, stesso server).
