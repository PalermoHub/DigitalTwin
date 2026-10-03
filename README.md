# Digital Twin di Palermo

Viewer web statico che sovrappone sulla stessa mappa catasto (S.I.T.R. 2026-09), PRG 2004 con PPE e vincoli, zone OMI,
popolazione ISTAT 2021 e 2023, edifici 3D, rilievo 3D, elevazione e civici. Un clic restituisce la **scheda del luogo**
(indirizzo, particella con link a SISTER, edificio, zonizzazione, vincoli, quotazioni OMI, sezione di censimento e terreno
DTM 5 m); la casella di ricerca porta su una via e un civico.

Stili e formati sono quelli delle app originali (vedi `docs/STILI.md`). Nessun backend, nessun bundler.

## Avvio

```bash
python3 scripts/serve.py 8000     # server con HTTP Range (necessario ai PMTiles)
# poi aprire http://127.0.0.1:8000/index.html
```

Serve la rete: base cartografica (OpenFreeMap), tile PRG/terreno e PMTiles sono letti dai link pubblicati.

## Dati

- I file già pubblicati su GitHub Pages **non sono copiati**: stanno in `dati/MANIFEST.tsv` con il loro `url`
  (verificati per hash prima di rimuovere le copie). `dati/catalogo.json` è la fonte unica per il viewer e per i crediti.
- Restano in `dati/` (non in git) solo i file senza link (≈ 350 MB: gpkg, geoparquet, DTM…). Vedi `dati/README.md`.
- I **tileset** (cartelle `z/x/y`: PRG, terreno, elevazione, griglia DTM) sono voci `tileset` del catalogo.

## Test

```bash
python3 -m pytest -q                # dati + viewer (Playwright/Chromium): ~10 minuti, usa la rete
node --test tests/js/*.test.mjs     # logica pura (indicatori, indirizzi, scheda, terreno, OMI, stili)
python3 scripts/valida_dati.py      # rigenera dati/catalogo.json e docs/catalogo.md; controlla link, CORS e tileset
python3 scripts/valida_dati.py --completo   # in più scarica i file remoti e ne verifica l'hash (≈ 270 MB)
```

## Avvisi

Catasto, PRG e vincoli sono informativi e senza valore legale; il PRG vigente è la Variante generale 2004. I dati 2023 sono
stime campionarie (censimento permanente).

## Struttura

`js/core/` nucleo (mappa, catalogo, pannello, scheda, ricerca) · `js/layers/` un modulo per tema · `scripts/` validazione dei
dati e server · `tests/` · `docs/` piano, spec, catalogo e stili. Piano generale: `docs/PIANO_DigitalTwin_Palermo.md`.

## Licenza

Codice sotto [EUPL-1.2](LICENSE). Dati e documentazione prodotti dal progetto sotto [CC BY 4.0](LICENSE-DATA.md). I dati di terzi mantengono la licenza della fonte: vedi [NOTICE.md](NOTICE.md).

## Rigenerare la guida
1. Rivedi i testi in `js/core/guida-contenuti.js`.
2. `python3 scripts/guida_screenshot.py` (immagini in `img/guida/passi/`; serve la rete per la base cartografica).
3. `python3 scripts/guida_video.py` (video, audio, sottotitoli e la versione ridotta per gli stati WhatsApp, sotto i 9 MB, in `media/guida/`; richiede `ffmpeg`, `piper-tts` e il modello vocale: `python3 -m piper.download_voices it_IT-paola-medium --data-dir ~/.cache/piper`).
   Per rifare solo la versione WhatsApp: `python3 scripts/guida_video.py --whatsapp`.

## Carosello social
`python3 scripts/guida_carosello.py` genera 11 slide 1080×1350 in `social/carosello/` dagli screenshot della guida (rigenerali prima con `guida_screenshot.py` se la mappa è cambiata). I testi brevi sono in `SLIDES` nello script. Il link riportato nelle slide è `palermodigitaltwin.opendatasicilia.it` (costante `LINK`).

### Secondo carosello (stile notturno)
`python3 scripts/guida_carosello2.py` genera 11 slide 1080×1350 in `social/carosello-2/`: un panorama continuo della mappa, numeri dai nostri dati (monumenti, uffici, strati), screenshot ritagliati con annotazioni. Le sorgenti ad alta risoluzione (screenshot a doppia scala e panorama) vanno in `lavoro/carosello/` (non versionato); `--rigenera` le rifà.

### Quarto carosello (stile editoriale moderno)
`python3 scripts/guida_carosello4.py` genera 11 slide 1080×1350 in `social/carosello-4/`: stile Digital Atlas in midnight navy e accenti oro/ambra, cornice device window con visuale ad alta risoluzione, badge contestuali floating e schede con le caratteristiche chiave.
