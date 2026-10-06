# Da fare prima dell'uso in produzione

Elenco aggiornato al 6 ottobre 2026 (dopo il merge su `main`, commit `31f8187`). Spunta le voci man mano. Nulla qui è già stato fatto: `main` è solo locale, non c'è stato nessun push.

---

## 1. Pubblicare il Worker (proxy CORS)

Senza Worker pubblicato, il catalogo RNDT e tutti i servizi di «I miei layer» (XYZ, WMS, WMTS, WFS, ArcGIS) non funzionano online. Il Worker deve anche essere **ripubblicato** perché inoltra l'autenticazione (utente, password, token).

- [ ] `cd worker && npx wrangler login` (una volta) e `npx wrangler deploy`.
- [ ] **Origini ammesse** in `worker/wrangler.toml` (`ORIGINI`): oggi ci sono solo `localhost:8000`, `127.0.0.1:8000` e `https://gbvitrano.github.io`. Il repository è `PalermoHub/DigitalTwin`, quindi l'app online probabilmente gira su **`https://palermohub.github.io`** (o su un dominio proprio): aggiungere l'origine reale, **senza** percorso e senza `/` finale, e ripubblicare. Verificare l'origine vera con la console del browser sull'app online.
- [ ] Controllare che `PROXY_PREDEFINITO` in `js/rndt/proxy.js` sia l'indirizzo stampato da `wrangler deploy` (`https://rndt-proxy.<account>.workers.dev`).
- [ ] Prova dopo il deploy, dall'app online: aggiungere un XYZ, un WMS e un WFS da «I miei layer»; con `curl`:
  `curl -i -H "Origin: https://<origine>" https://<worker>/t/httpbin.org/basic-auth/user/pass` → 401 **senza** `WWW-Authenticate`; con `-H "Authorization: Basic dXNlcjpwYXNz"` → 200.
- [ ] Quota: il piano gratuito ha **100.000 richieste al giorno**; ogni tile WMS/XYZ/WMTS ne usa una. Decidere se basta o se serve un piano a pagamento/cache.

## 2. Prove ancora da fare con servizi reali

Fatte in locale con servizi pubblici (XYZ, WMS terrestris, WMTS basemap.at, ArcGIS Esri cache e FeatureServer, WFS ARPA Piemonte, token finto). **Non** provato:

- [ ] Un **WFS con elementi a Palermo**: conferma l'ordine degli assi del `bbox` per WFS ≥ 1.1.0 (`urlGetFeature` in `js/aggiungi/servizi.js`). Sintomo di errore: «nessun elemento nell'area di Palermo» su un servizio che dovrebbe averne.
- [ ] Un servizio **protetto con utente e password (Basic)** vero: capabilities, tile e, dopo il ricaricamento, lucchetto e richiesta della password.
- [ ] Un **token ArcGIS** vero (`…/MapServer?token=…`): tile, dati, scadenza.
- [ ] Il **tema scuro** della scheda «Ordine layer in mappa» e di tutto l'albero di «I miei layer».
- [ ] Altri browser (Firefox, Safari) e telefono vero: albero, moduli, selettore file.
- [ ] Rilanciare la suite **Python** (`python3 -m pytest -q`): in questa sessione ho rilanciato solo i test JS (598 ✓).

## 3. Guida e contenuti

Vedi `docs/APPUNTI_GUIDA.md` (sezioni 1–13 e checklist). In particolare:

- [ ] Rigenerare lo screenshot `img/guida/passi/rndt-gruppo.webp` (mostra ancora il pulsante file nel gruppo RNDT): `python3 scripts/guida_screenshot_rndt.py` (serve Chrome per Playwright).
- [ ] Passi nuovi della Guida: «I miei layer» (albero, servizi, credenziali), isole di calore, mappe storiche, ordine layer. Un passo nuovo **non** deve avere un id che inizia con `rndt` (`tests/js/guida.test.mjs` conta i passi `rndt*`).
- [ ] «Fonti e avvisi»: voci per mappe storiche e isole di calore.
- [ ] Video e voce della Guida, se i passi nuovi entrano nel video.

## 4. Ripulire il repository: su GitHub solo ciò che serve all'app

Regola: **su GitHub va ciò che serve per far girare e mantenere l'app online; il resto resta solo in locale** (nel disco, non nel repository). Oggi il repository tracciato contiene molto materiale di lavoro; `.git` pesa **229 MB**.

### 4.1 Cosa resta pubblicato

| Percorso | Perché |
|---|---|
| `index.html`, `css/`, `js/` (anche `js/vendor/`) | l'app |
| `img/` | favicon, logo, immagini delle basi, immagini della Guida, scheda social (`social_card.jpg`) |
| `media/guida/` — solo `guida.mp4`, `guida.mp3`, `guida.vtt` | usati dalla Guida (`js/core/guida.js`) |
| `dati/` — `catalogo.json`, `MANIFEST.tsv`, `README.md`, `colonnine/`, `incedi/`, `isole-calore/`, `pai/`, `uffici/` | dati che l'app legge o che i workflow rigenerano (`.gitignore` esclude già gli altri dati pesanti) |
| `worker/` | sorgente del proxy: serve a pubblicarlo; non contiene segreti |
| `.github/workflows/` e gli script che usano: `scripts/colonnine.py`, `incendi.py`, `pai.py`, `uffici_build.py`, `uffici_scrape.py` | aggiornamento automatico dei dati |
| `scripts/serve.py`, `scripts/valida_dati.py` | citati nel `README` (avvio locale e catalogo dati) |
| `README.md`, `LICENSE`, `LICENSE-DATA.md`, `NOTICE.md` | licenze e attribuzioni (obbligatorie) |
| `docs/RNDT.md`, `docs/AGGIUNGI_LAYER.md`, `docs/GEOIMAGE.md`, `docs/STILI.md`, `docs/catalogo.md` | documentazione utile a chi usa o riusa l'app |
| `package.json`, `pytest.ini`, `tests/` | **da decidere**: non servono all'app, ma permettono a chi contribuisce di provare le modifiche (`tests/` pesa 684 KB). Se vuoi solo l'app, spostali in locale |

### 4.2 Cosa resta solo in locale (da togliere dal repository, non dal disco)

| Percorso | Peso / nota |
|---|---|
| `graphify-out/` | 55 MB, 246 file: grafo di conoscenza generato (`graphify update .`) |
| `social/` | 13 MB: caroselli e materiale per i social |
| `media/guida/` — `guida-whatsapp.mp4`, `guida_02.mp4`, `guida.txt` | non usati dall'app (la versione WhatsApp è per condividere il video) |
| `plugin/` | sorgenti dei pacchetti `openrndt-geolibre` 0.2.0 e 0.3.1: l'app usa solo `js/vendor/openrndt-geolibre/` |
| `docs/superpowers/` (22 file: specifiche e piani) | storia di lavoro |
| `docs/` di lavoro: `ANALISI_DESIGN.md`, `APPUNTI_GUIDA.md`, `ARCHITETTURA_HOSTING.md`, `AUDIT_DATI.md`, `FILE_DA_SPOSTARE_SUL_VPS.md`, `ISTRUZIONI_SERVER.md`, `PIANO_DigitalTwin_Palermo.md`, `RIPARTENZA.md`, `schermata-fase1.png`, **questo file** | note interne |
| `scripts/` di sviluppo: `guida_*.py`, `carosello5.py`, `alberi.py`, `build_gerarchia.py`, `compatta_dati.py`, `estrai_stile_omi.mjs`, `fonti.py`, `gtfs.py`, `monumenti*.py`, `scuole.py`, `sicurezza_stradale.py`, `isole_calore.py` | servono a rigenerare dati, Guida e social, non all'app online. **Prima** di spostarli, controllare che nessun workflow né `valida_dati.py` li importi |
| `aggiungere.txt` | appunti |
| 9 file `*:Zone.Identifier` (es. `js/app.js:Zone.Identifier`, `js/core/icone.js:Zone.Identifier`, `media/guida/guida.mp4:Zone.Identifier`) | residui di Windows/WSL: cancellare anche dal disco |

Nota: `README.md` rimanda a file che usciranno dal repository (`docs/PIANO_DigitalTwin_Palermo.md`, sezioni su Guida e Carosello). Dopo la pulizia, **riscrivere il `README`** perché parli solo di ciò che resta, e controllare i link in `docs/RNDT.md` e `docs/AGGIUNGI_LAYER.md`.

### 4.3 Come farlo (senza perdere i file locali)

1. Lavorare su un ramo: `git switch -c pulizia-repo`.
2. Aggiungere i percorsi del punto 4.2 a `.gitignore` (così non rientrano per sbaglio) — per le cartelle `graphify-out/`, `social/`, `plugin/`, `docs/superpowers/`, e per i singoli file.
3. Toglierli dal repository **lasciandoli sul disco**: `git rm -r --cached <percorso>` per ciascuno. Per i `Zone.Identifier`: `git ls-files | grep 'Zone.Identifier' | xargs -d '\n' git rm -f --`.
4. Controllare con `git status` e `git ls-files | wc -l` che ciò che resta sia solo la tabella 4.1; provare l'app in locale (`python3 scripts/serve.py 8000`) e `npm run test:js`.
5. Commit, poi revisione e merge su `main`.
6. **Opzionale e distruttivo** — ridurre il peso della cronologia (`.git` 229 MB): serve `git filter-repo` per cancellare i file dalla storia e poi `git push --force` con **riscrittura della cronologia**. Cambia tutti gli hash e rompe i cloni e i fork esistenti: da fare solo con una copia di sicurezza e dopo averne parlato con chi lavora sul repository. Se non serve ridurre il peso dei cloni, **non farlo**: togliere i file dall'indice (punto 3) basta per non pubblicarli più.

### 4.4 Dopo la pulizia

- [ ] Verificare i workflow GitHub (`aggiorna-*.yml`): partono ancora e trovano i loro script.
- [ ] Verificare che l'app online non cerchi file spariti (console del browser, scheda Rete: nessun 404).
- [ ] `graphify-out/` resta utile in locale: `graphify update .` lo ricostruisce dopo ogni modifica.

## 5. Revisione del codice

- [ ] La revisione finale del lavoro del 6 ottobre è stata una mia rilettura, non di un revisore indipendente: lanciare `/code-review` sul diff di `main` (commit `639a7aa`…`31f8187`) prima della pubblicazione.
