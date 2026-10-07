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

- [x] Misura di base in `docs/misure/2026-10-07/` (locale). Resta da rifare sul sito pubblicato.
- [x] Script di misura: `scripts/lighthouse.sh`.
- [x] `.github/workflows/test.yml`: lancia i test JS (621). Test JS e `package.json` ora in git; i test Python restano locali.
- [x] `.gitignore`: nessun bug. La cartella si chiama davvero `dati/incedi` (refuso nel nome, ma coerente in codice e workflow). Rinominarla è facoltativo.
- [x] `dati/delete` (257 MB, ignorato da git, non usato dal codice): lasciato com'è su decisione dell'utente.

Chiusura: workflow verde, report di base committati.

## Fase 1. Correzioni rapide (poche ore)

Obiettivo: chiudere i difetti già misurati, senza rischi.

- [x] `#strati-chip`: rimuovere `role="list"` oppure dare `role="listitem"` ai figli (audit `aria-required-children`). Rimisurare l'accessibilità desktop.
- [x] `intersezione.svg`: `width` e `height` aggiunti in `js/core/invito.js` (l'immagine è creata dal codice).
- [x] `index.html`: aggiunti `og:image` (usa `img/social_card.jpg`, già presente), `og:url`, `twitter:card` e canonical su `https://palermohub.github.io/DigitalTwin/` (da cambiare se l'indirizzo pubblico sarà un altro), `og:url`, `twitter:card` e `link rel="canonical"`; l'immagine di anteprima è 1200x750.
- [x] `index.html`: aggiunto `<link rel="manifest">` con un `manifest.webmanifest` minimo (nome, icone, colori) in preparazione alla Fase 5.
- [x] Piè di pagina: rendere leggibili ai lettori di schermo le coordinate (`#piede-coord`), oppure lasciarle `aria-hidden` ma documentare la scelta. Scelta: restano `aria-hidden`, perché cambiano a ogni movimento della mappa e un lettore di schermo le annuncerebbe di continuo.

Chiusura: Lighthouse accessibilità 100 su desktop e mobile (verificato). Resta da verificare l'anteprima social con un debugger di link dopo la pubblicazione.

## Fase 2. Peso dei dati caricati all'avvio

Obiettivo: ridurre i byte e il lavoro prima del primo layer visibile.

Esito dell'analisi (2026-10-07):
- I byte erano gonfiati da `scripts/serve.py`, che non comprimeva. `monumenti.geojson` pesa 1,7 MB ma 250 KB con gzip: GitHub Pages e Apache con `deflate` (già nelle istruzioni server) lo comprimono, quindi in produzione non è un problema. Riscrivere i dati per risparmiare qualche decina di KB compressi non vale il rischio sulla scheda dei monumenti.
- `edificato.pmtiles`: le 3 richieste grosse sono 3 tile diversi (risposte 206 con range distinti), non un doppione. L'edificato è acceso di default (`edifici.js`), quindi serve alla prima vista: nessun intervento.
- `valida_dati.py` ha già un limite di peso per file (`MAX_BYTE`, 100 MB).

- [x] `scripts/serve.py` comprime con gzip i file di testo (html, js, css, json, geojson, svg...) quando il client lo accetta; PMTiles e richieste Range restano invariati. Le misure locali ora si avvicinano alla produzione.
- [x] Rimisura: byte totali mobile da 8,5 a 4,5 MiB, locali 2,3 MiB. LCP desktop da 4,7 a 3,4 s. TBT invariato (è lavoro di CPU, tema della Fase 3).
- [x] Compressione e cache in produzione: già documentate in `docs/ISTRUZIONI_SERVER.md` (modulo `deflate`) e `docs/ARCHITETTURA_HOSTING.md`. Da verificare dopo la pubblicazione con `curl -H 'Accept-Encoding: gzip' -I <url>/dati/monumenti/monumenti.geojson`.
- [ ] Facoltativo: esaminare gli altri GeoJSON differiti (alberi, fontanelle, scuole, uffici, colonnine) solo se, rimisurati sul sito pubblico, risultano pesanti anche compressi.
- [ ] Facoltativo: i dati di altri repository (`gbvitrano.github.io` 3,7 MiB, `palermohub.github.io` 2 MiB al caricamento) sono fuori dal nostro controllo; valutare di copiarli sul nostro host solo se la latenza lo giustifica.

Chiusura: compressione verificata in produzione.

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
