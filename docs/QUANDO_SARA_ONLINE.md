# Quando l'app sarà online, e se cambierà indirizzo

Promemoria di lavoro (scritto il 2026-10-07 dopo le fasi 0-6 di `PIANO_miglioramenti_webapp.md`). Serve a riprendere il lavoro senza rifare le domande.

## 0. Stato di partenza

- Indirizzo previsto: `https://palermohub.github.io/DigitalTwin/`. Repository `PalermoHub/DigitalTwin`, **privato**: finché non è pubblico GitHub Pages non funziona (piano gratuito). L'utente decide quando.
- Un dominio proprio è già previsto altrove: `https://palermodigitaltwin.opendatasicilia.it` (compare nelle origini del Worker e in `PROCEDURA_DEPLOY_WORKER.md`).
- `main` locale è avanti rispetto a `origin/main` e **il bot** (`github-actions[bot]`) fa un commit orario sui dati delle colonnine: prima di ogni push `git pull --rebase origin main`.
- Il service worker NON si registra in locale (solo HTTPS o `?sw`).

## 1. Prima di rendere pubblico (blocchi da risolvere con l'utente)

1. **Ramo `pulizia-repo`** (non unito, molto indietro): toglie dall'indice 316 file (89 MB) e alleggerisce `.git` (648 MB). **Unirlo cancella dal disco** i file tolti dall'indice: serve prima il backup in `../DigitalTwin-locale-backup` (vedi `DA_FARE_PRIMA_DELLA_PRODUZIONE.md`, sezione 4). Non farlo senza ok esplicito.
2. **Test in git:** l'utente ha scelto di tracciare `tests/js` e `package.json` (per la CI); `DA_FARE_PRIMA_DELLA_PRODUZIONE.md` dice ancora «test solo in locale»: aggiornarlo. I test Python restano locali.
3. **Dati:** `dati/*` è ignorato da git (tranne uffici, incedi [sic: la cartella si chiama così], isole-calore, pai, colonnine). L'app online legge i dati da `catalogo.json` (gbvitrano.github.io, palermohub.github.io, palermohub.opendatasicilia.it) o da `dati/` locale: verificare quali percorsi restano locali e dove vanno ospitati (`ARCHITETTURA_HOSTING.md`, `FILE_DA_SPOSTARE_SUL_VPS.md`).
4. **Worker CORS** (catalogo RNDT e «I miei layer» non funzionano senza): `docs/PROCEDURA_DEPLOY_WORKER.md` passo 2 (login `wrangler` già fatto il 2026-10-06, Worker non pubblicato). `ORIGINI` in `worker/wrangler.toml` oggi: localhost:8000, 127.0.0.1:8000, gbvitrano.github.io, palermohub.github.io, palermodigitaltwin.opendatasicilia.it. Dopo il deploy: controllare `PROXY_PREDEFINITO` in `js/rndt/proxy.js`.
5. `dati/delete` (257 MB) lasciato com'è su decisione dell'utente.

## 2. Verifiche da fare appena è online (non si possono fare prima)

Eseguire nell'ordine; confrontare con la base in `docs/misure/2026-10-07/RIASSUNTO.md` (locale, Chromium senza GPU).

- [ ] **CI:** scheda Actions di GitHub: il workflow `Test` (test JS) deve essere verde.
- [ ] **Compressione e cache:** `curl -sI -H 'Accept-Encoding: gzip' <URL>dati/monumenti/monumenti.geojson` deve avere `content-encoding: gzip`; stesso per `js/app.js`, `css/app.css`. Se il dato viene dal VPS: modulo `deflate` (vedi `ISTRUZIONI_SERVER.md`).
- [ ] **`sw.js` con `Cache-Control: no-cache`** (o simile): se il browser lo tiene in cache a lungo, gli aggiornamenti dell'app arrivano in ritardo. Su GitHub Pages la cache è 10 minuti: accettabile, ma annotarlo.
- [ ] **Lighthouse sul sito vero:** `scripts/lighthouse.sh <URL> docs/misure/<data>` (desktop e mobile). Obiettivi in `PIANO_miglioramenti_webapp.md` (mobile 60+, desktop 75+, LCP mobile < 4 s). Confrontare TBT con la base: in locale era gonfiato dal render software.
- [ ] **Installabilità PWA** (Lighthouse/DevTools > Application): manifest valido, service worker attivo, icone 192/512 e maskable.
- [ ] **Service worker:** dopo la prima visita e una ricarica, in DevTools > Application le cache `dt-v1-statica` e `dt-v1-dati` hanno contenuto; aereo/offline: l'app si apre. Provare un aggiornamento: cambiare `VERSIONE` in `sw.js`, ripubblicare, ricaricare due volte, controllare che la cache vecchia sparisca.
- [ ] **Anteprima social:** Facebook Sharing Debugger, LinkedIn Post Inspector, (X/Telegram incollando il link). Controllare `og:image` (1200x750), titolo, descrizione. Il nome dell'app è «Palermo Digital Twin» (come nel logo, nel tooltip e nel `<title>`): uguale in `og:title`, `og:site_name`, `og:image:alt` e manifest. Restano fuori, per decisione dell'utente da prendere, la formula di attribuzione in `NOTICE.md` («Digital Twin Palermo, PalermoHub») e il titolo del video YouTube.
- [ ] **Mobile vero** (iPhone Safari e Android Chrome): barra a quattro tab, interruttore del tema, menù a comparsa, scheda sopra i tab, tastiera sulla ricerca in alto, installazione sulla schermata Home.
- [ ] **Worker (se pubblicato):** da «I miei layer» provare XYZ, WMS, WFS; `curl` di prova in `PROCEDURA_DEPLOY_WORKER.md`.
- [ ] **Quota Worker:** 100.000 richieste al giorno nel piano gratuito (una per tile): decidere se basta.

## 3. Da completare solo con l'indirizzo (non serve che sia online)

Si possono preparare subito con `https://palermohub.github.io/DigitalTwin/`:

- [ ] **Landing** statica (pagina di presentazione) con il video del tour (`https://youtu.be/Mzj1xk1l2QM`), link all'app, descrizione e dati strutturati `WebApplication`. Progettarla con la skill `design-taste-frontend` (solo per la landing, non per l'app). Rispettare: italiano, accenti, niente trattino lungo, contrasto, tema chiaro e scuro, mobile.
- [ ] **`sitemap.xml` e `robots.txt`** (con `Sitemap:` assoluto).
- [ ] **`scripts/imposta_indirizzo.py <nuovo indirizzo>`**: sostituisce l'indirizzo assoluto in `index.html` (`canonical`, `og:url`, `og:image`), `sitemap.xml`, `robots.txt`, landing e dati strutturati. Un solo comando per il cambio di dominio (vedi sezione 4).
- [ ] **Search Console**: registrare la proprietà e inviare la sitemap (lo fa l'utente).

## 4. Se ci sarà un reindirizzamento su un altro dominio

Che cosa dipende dal dominio e che cosa no:

**Non cambia nulla** (percorsi relativi): `manifest.webmanifest` (`start_url`, `scope`, `id` sono `./`), `sw.js`, tutti i percorsi dell'app, i link della Guida.

**Da aggiornare** (indirizzi assoluti):

1. `index.html`: `<link rel="canonical">`, `og:url`, `og:image` (+ `og:image:alt` se cambia) → con lo script del punto 3.
2. `sitemap.xml`, `robots.txt`, landing, dati strutturati.
3. **Worker:** `ORIGINI` in `worker/wrangler.toml` con la nuova origine (senza percorso e senza `/` finale; GitHub reindirizza `siciliahub.github.io` verso il dominio personalizzato: conta solo l'origine che vede il browser) e **nuovo `wrangler deploy`**. Il dominio `palermodigitaltwin.opendatasicilia.it` è già in elenco.
4. **VPS dei dati:** CORS con `SetEnvIf Origin` (vedi `ISTRUZIONI_SERVER.md` e `ARCHITETTURA_HOSTING.md`): aggiungere la nuova origine, togliere quelle inutilizzate. Anche gli altri host di `catalogo.json` (gbvitrano, palermohub) devono accettarla se usano CORS ristretto.
5. Testi che citano l'indirizzo: `README.md`, `NOTICE.md`, descrizione YouTube (`media/tour/tour_app_youtube.txt`), Guida (`js/core/guida-contenuti.js`, link all'app nelle slide dei caroselli: `tests/test_guida_carosello.py` verifica che il link sia in ogni slide), video del tour, `docs/*`.
6. Nome dell'app («Palermo Digital Twin») già coerente in `<title>`, `og:*` e manifest.

**Cosa succede agli utenti** (chiave per origine): `localStorage`, IndexedDB e service worker sono legati all'origine, quindi sul nuovo dominio **si riparte da zero**: si perdono layer salvati («I miei layer», RNDT, Geoimage), temi e colori degli strati, ordine degli strati, sezioni aperte, scelta «Non mostrare più», tema scuro. Chiavi usate: `dt-tema`, `dt-temi-strati`, `dt-ordine-strati`, `dt-ordine-disegno`, `dt-layer-sezioni`, `dt.invito.no`, `dt.scheda.nascosti`, `dt:miei:v1`, `dt:miei:servizi:v1`, `dt:rndt:v1`, `dt:geoimage:v1`, e i file locali in IndexedDB. Il service worker vecchio resta sull'origine vecchia.

**Come fare il reindirizzamento** (GitHub Pages non fa redirect 301 lato server):
- Con dominio personalizzato (file `CNAME` + DNS): GitHub reindirizza da solo il vecchio `*.github.io` al nuovo dominio con un 301. È la via più pulita.
- Altrimenti: lasciare sul vecchio indirizzo una pagina minima con `<meta http-equiv="refresh">`, `<link rel="canonical">` verso il nuovo e un testo con il link; togliere dal vecchio il service worker (pubblicare un `sw.js` che si disinstalla: `self.registration.unregister()` e `caches.delete`).
- Opzionale, se si vuole non far perdere le personalizzazioni: sul vecchio indirizzo un pulsante «Esporta» (JSON di tutte le chiavi `dt*`) e sul nuovo «Importa»; oggi esiste solo l'esportazione dei temi degli strati (`tema.js`).
- Dopo il cambio: aggiornare Search Console (cambio indirizzo), rifare le verifiche della sezione 2.

## 5. Altro in sospeso (non dipende dall'online)

- [x] **Guida per il telefono** (2026-10-07): nuovo passo statico «Sul telefono» (`telefono` in `js/core/guida-contenuti.js`, immagine con tre schermate fatta da `scripts/guida_screenshot_telefono.py`) e frasi aggiornate nei passi `cos-e`, `dati`, `strati`, `strumenti`. Il passo è statico: **non è nel video né nei caroselli** (restano com'erano, solo desktop). Se un giorno si rigenera il video con la voce, valutare di raccontare anche il telefono.
- [ ] **Screenshot degli altri passi e video:** descrivono solo il desktop (`scripts/guida_screenshot*.py`, `scripts/video_tour.py` usano gli id dei pulsanti).
- [ ] **Pagina di anteprima del mobile** (artifact «Punti d'ingresso: oggi e proposta», `https://claude.ai/artifact/EoECqKQtmEKFwneR6oMyiE`): la tavola «Proposta, mobile» è precedente alle scelte finali (tab «Menu» al posto di «Info», interruttore del tema nell'header, menù a comparsa a mezza larghezza).
- [ ] **Tablet (721-960 px):** oggi hanno ancora l'icona a tre righe e la barra laterale; decidere se estendere lo schema del telefono.
- [ ] **Fase 3:** `esbuild` (119 richieste di moduli, CSS e JS non usati) da valutare dopo le misure sul sito vero; non migliora il TBT.
- [ ] **Fase 4:** unificare le icone (SVG a mano e simboli Unicode): cambia l'aspetto in molti punti, chiedere prima.
- [ ] **Fase 5:** onboarding in 3 passi, vista testuale dei risultati di ricerca, `prefers-contrast`. Il pulsante di ripristino (↻) e la scheda a «metà» restano com'erano per scelta dell'utente.
- [ ] I test Python (`tests/test_*.py`) sono lenti e alcuni dipendono da file generati: non sono stati rilanciati per intero dopo le modifiche di queste fasi.

## 6. Convenzioni da ricordare

- Rispondere in italiano; niente trattino lungo nei testi della pagina; commit con la riga `Co-Authored-By` richiesta dalla sessione.
- Dopo ogni modifica al codice: `graphify update .`.
- Prima di ogni commit controllare l'esito dei test (`npm run test:js`) e non committare modifiche altrui non richieste.
