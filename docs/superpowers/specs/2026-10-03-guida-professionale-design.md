# Guida professionale del Digital Twin — design

Data: 2026-10-03 · Stato: da approvare

## Obiettivo

Sostituire il testo provvisorio del tab «Guida» del foglio Info (`js/core/catalogo.js`, costante `GUIDA`) con una guida
professionale fatta di testo e immagini, e produrre dagli **stessi contenuti** un video con voce narrante e un file audio.

Destinatari: cittadini, tecnici e amministratori che aprono la mappa per la prima volta.

### Cosa spiega la guida
1. Cos'è la mappa e a cosa serve.
2. Con quali dati è realizzata (fonti per famiglie, coerenti con `catalogo.json` e con il tab «Fonti e avvisi»).
3. La barra degli strati: icone, accensione/spegnimento, legenda.
4. Click sulla mappa: si apre la scheda.
5. Quali dati si leggono nella scheda (sezioni e indicatori reali).
6. I filtri, mostrati eseguendo una ricerca di esempio.
7. Avvertenze: dati informativi, senza valore legale.

### Fuori ambito
- Vista 3D (esclusa per ora).
- Traduzioni, sottotitoli in altre lingue, interattività oltre al normale scorrimento.
- Modifica dei tab «Fonti e avvisi», «Argomenti», «Credits».

## Assunzioni (da correggere se sbagliate)
- Voce narrante: **Piper** offline, voce italiana (es. `it_IT-paola-medium`). Alternativa non scelta: Edge TTS.
- Il video e l'audio vanno incorporati nel tab Guida e versionati nel repo (solo gli output, non i modelli vocali).
- I testi sono scritti da noi a partire da `catalogo.json` e dal codice; l'utente li rivede prima del video finale.

## Architettura

Fonte unica dei contenuti → tre consumatori.

```
js/core/guida-contenuti.js  ──►  js/core/guida.js          (rende il tab)
        │                  ├──►  scripts/guida_screenshot.py (produce le immagini)
        │                  └──►  scripts/guida_video.py      (produce mp3/mp4/vtt)
```

### Unità

**`js/core/guida-contenuti.js`** — dati puri, nessuna logica DOM.
Esporta `PASSI`: array ordinato di
`{ id, titolo, paragrafi: string[], immagine: { file, alt, didascalia }, narrazione: string, scena }`.
- `narrazione`: testo parlato (può differire leggermente da `paragrafi`: niente sigle da leggere male, numeri in lettere dove serve).
- `scena`: istruzioni dichiarative per lo script degli screenshot (strati da accendere, punto del click, query di ricerca e filtri, zoom/centro mappa). Lo script Python legge `scena` da un JSON esportato (`node` stampa `PASSI` come JSON) per non duplicare il formato.
Dipende da: nulla.

**`js/core/guida.js`** — `schedaGuida(doc = document)` ritorna l'elemento del tab, sulla falsariga di `schedaArgomenti()`.
Struttura: titolo, indice con ancore (`#guida-<id>`), blocco media (video + audio, `<track kind="captions">`), poi una `<section>` per passo con `h3`, paragrafi, `<figure><img loading="lazy" alt><figcaption>`.
Dipende da: `guida-contenuti.js`. `catalogo.js` sostituisce `GUIDA` con `schedaGuida()`.

**`scripts/guida_screenshot.py`** — Playwright (già installato) apre l'app servita da `scripts/serve.py`, porta la mappa nello stato di ogni `scena`, salva `img/guida/passi/<id>.webp` (viewport fisso 1280×720, stesso per tutti per coerenza e per il video). Opzione `--solo <id>`. I click sul popup/scheda e la ricerca con filtri sono eseguiti sull'interfaccia reale (nessun mock), così le immagini mostrano dati veri.
Per la barra degli strati: ritaglio/evidenziazione dell'elemento `#pannello`, non uno screenshot a pieno schermo.

**`scripts/guida_video.py`** — per ogni passo:
1. Piper sintetizza `narrazione` → WAV (modello scaricato in cache fuori dal repo, `~/.cache`).
2. `ffmpeg` crea un segmento: immagine del passo con lento zoom (Ken Burns), durata = durata WAV + 0,6 s di pausa, titolo del passo in sovrimpressione.
3. Concatenazione dei segmenti → `media/guida/guida.mp4` (H.264 + AAC, 1280×720, `+faststart`).
4. `media/guida/guida.mp3` dalla traccia audio; `media/guida/guida.vtt` con i testi di `narrazione` temporizzati sulle durate reali.
Ritorna errore chiaro se manca il modello Piper o `ffmpeg`.

### Stile
Classi nuove in `css/app.css` con i token esistenti (nessun colore hardcoded nuovo): `.guida-indice`, `.guida-passo`, `.guida-figura`. Figure a larghezza piena del foglio, `max-width: 100%`, didascalia piccola e in grigio, coerenti con `.argomento`. Il video ha `preload="metadata"` e poster = immagine del primo passo.

### Accessibilità
Ogni immagine ha `alt` descrittivo e didascalia; il video ha sottotitoli `.vtt`; l'indice è navigabile da tastiera; il player usa i controlli nativi.

## Flusso di lavoro
1. Si scrivono/rivedono i testi in `guida-contenuti.js`.
2. `python scripts/guida_screenshot.py` rigenera le immagini.
3. `python scripts/guida_video.py` rigenera mp4/mp3/vtt.
4. Si committano contenuti, immagini e media.
Quando cambiano mappa o dati: punti 2–4.

## Test
- **JS** (`tests/js/guida.test.mjs`): ogni passo ha `id` univoco, titolo, ≥1 paragrafo, `narrazione`, immagine con `alt` e `didascalia`; `schedaGuida()` produce una `section` per passo e un'ancora nell'indice per ciascuno.
- **Selenium** (`tests/test_viewer.py`): aggiornare `test_modale_info_ha_i_tab_fonti_guida_credits`; nuovo test: tab Guida mostra tutti i passi, tutte le immagini caricano (`naturalWidth > 0`), il link dell'indice scorre al passo.
- **Python** (`tests/test_guida_media.py`): ogni `immagine.file` e i tre file media esistono; durata del video ≈ somma delle durate audio (tolleranza 1 s) via `ffprobe`; il `.vtt` ha una cue per passo.
- Verifica visiva manuale a 1280×720 e a viewport mobile, e ascolto del video.

## Rischi
- Download del modello Piper richiede rete (una tantum).
- Peso del repo: WebP ≈ 100–200 KB per immagine, mp4 stimato 5–15 MB; se oltre 20 MB, ridurre il bitrate o servirlo fuori dal repo.
- Gli screenshot dipendono dai dati correnti: lo script è deterministico solo a dati invariati.
- Pronuncia di toponimi e sigle (PRG, GTFS): gestita con `narrazione` dedicata.
