# Guida professionale — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sostituire il testo provvisorio del tab «Guida» con una guida professionale (testo + screenshot) e generare dagli stessi contenuti un video con voce narrante e un file audio.

**Architecture:** Un modulo dati (`guida-contenuti.js`) è la fonte unica: lo legge il renderer del tab (`guida.js`), lo script Playwright degli screenshot e lo script del video (Piper + ffmpeg). Le immagini sono WebP in `img/guida/passi/`, i media in `media/guida/`.

**Tech Stack:** JS ES modules (`node --test`), Playwright (Python, già installato), Piper TTS (`piper-tts`, offline), ffmpeg/ffprobe, pytest.

**Spec:** `docs/superpowers/specs/2026-10-03-guida-professionale-design.md`

## Global Constraints

- Lingua dei testi: italiano con tutti gli accenti corretti; nel codice identificatori italiani come nel resto del repo.
- Nessun 3D nella guida.
- Screenshot a viewport fisso 1280×720, formato WebP, in `img/guida/passi/<id>.webp` (non toccare le immagini orfane già presenti in `img/guida/`).
- Media in `media/guida/`: `guida.mp4` (H.264+AAC, 1280×720, `+faststart`), `guida.mp3`, `guida.vtt`.
- Nessun colore nuovo hardcoded nel CSS: solo i token esistenti (`--text`, `--text-muted`, `--border-ui`, `--surface`, `--r-sm`, `--fs-md`…).
- I modelli Piper stanno in `~/.cache/piper`, mai nel repo. Nessun `.whl` o file temporaneo nella radice.
- Test: `npm run test:js` e `python -m pytest tests -k <nome>`; l'app per i test parte da `scripts/serve.py` (fixture `server`/`apri` in `tests/conftest.py`).
- Dopo ogni modifica al codice: `graphify update .`.
- Commit con la riga `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Review Focus

- Passo senza immagine o file immagine mancante → il tab non deve mostrare un'icona rotta; il test dati e il test Python devono fallire in anticipo.
- `alt` vuoto o `narrazione` con cifre/sigle (PRG, GTFS) non pronunciabili → il test dati rifiuta cifre nelle narrazioni e `alt` vuoti.
- Id di passo duplicati o con caratteri non validi per un'ancora → test su unicità e formato `^[a-z0-9-]+$`.
- Viewport mobile (390 px): le figure non devono causare scroll orizzontale nel foglio.
- Modello Piper o ffmpeg assenti → lo script deve uscire con messaggio chiaro, non con traceback.
- Durata del video ≠ somma delle narrazioni (segmenti troncati) → test con `ffprobe`.

---

## File Structure

| File | Responsabilità |
|---|---|
| `js/core/guida-contenuti.js` (nuovo) | Dati puri: `PASSI` |
| `js/core/guida.js` (nuovo) | `schedaGuida(doc)`: DOM del tab |
| `js/core/catalogo.js` (modifica) | Usa `schedaGuida()` al posto di `GUIDA` |
| `css/app.css` (modifica) | `.guida-*` |
| `scripts/guida_screenshot.py` (nuovo) | Produce le immagini dai `scena` |
| `scripts/guida_video.py` (nuovo) | Produce mp4/mp3/vtt |
| `tests/js/guida.test.mjs` (nuovo) | Test dati + DOM (jsdom-free: DOM finto minimo) |
| `tests/test_guida_media.py` (nuovo) | Esistenza file, durata, cue |
| `tests/test_viewer.py` (modifica) | Test tab Guida |

---

### Task 1: Contenuti della guida (dati + test)

**Files:**
- Create: `js/core/guida-contenuti.js`
- Test: `tests/js/guida.test.mjs`

**Interfaces:**
- Produces: `export const PASSI: Array<{ id: string, titolo: string, paragrafi: string[], immagine: { file: string, alt: string, didascalia: string }, narrazione: string, scena: { strati: string[], centro: [number, number], zoom: number, clic?: [number, number], ricerca?: { testo: string, apriFiltri?: boolean, circ?: number }, ritaglio?: string } }>`

- [ ] **Step 1: Write the failing test**

```js
// tests/js/guida.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { PASSI } from '../../js/core/guida-contenuti.js';

test('sette passi nell\'ordine previsto', () => {
  assert.deepEqual(PASSI.map(p => p.id), ['cos-e', 'dati', 'strati', 'clic', 'scheda', 'filtri', 'avvertenze']);
});

test('id univoci e validi come ancora', () => {
  const ids = PASSI.map(p => p.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^[a-z0-9-]+$/);
});

test('ogni passo ha titolo, paragrafi, narrazione e immagine completa', () => {
  for (const p of PASSI) {
    assert.ok(p.titolo.trim(), `${p.id}: titolo`);
    assert.ok(p.paragrafi.length >= 1 && p.paragrafi.every(t => t.trim()), `${p.id}: paragrafi`);
    assert.ok(p.narrazione.trim().length > 40, `${p.id}: narrazione`);
    assert.equal(p.immagine.file, `img/guida/passi/${p.id}.webp`);
    assert.ok(p.immagine.alt.trim() && p.immagine.didascalia.trim(), `${p.id}: alt e didascalia`);
  }
});

test('le narrazioni non contengono cifre né sigle da leggere male', () => {
  for (const p of PASSI) {
    assert.doesNotMatch(p.narrazione, /\d/, `${p.id}: cifre`);
    assert.doesNotMatch(p.narrazione, /\b(PRG|GTFS|DTM|ISTAT|OSM)\b/, `${p.id}: sigle`);
  }
});

test('nessun passo parla di 3D', () => {
  for (const p of PASSI) assert.doesNotMatch(JSON.stringify(p), /3D/i, p.id);
});

test('la scena ha centro dentro Palermo e zoom nel range della mappa', () => {
  for (const p of PASSI) {
    const [lon, lat] = p.scena.centro;
    assert.ok(lon > 13.2 && lon < 13.5 && lat > 38.0 && lat < 38.3, `${p.id}: centro`);
    assert.ok(p.scena.zoom >= 12 && p.scena.zoom <= 18, `${p.id}: zoom`);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/js/guida.test.mjs`
Expected: FAIL, `Cannot find module '.../guida-contenuti.js'`

- [ ] **Step 3: Write minimal implementation**

```js
// js/core/guida-contenuti.js
// Fonte unica della guida: la leggono il tab Info (guida.js), lo script degli screenshot e quello del video.
// `narrazione` è il testo parlato: niente cifre né sigle (si scrivono per esteso come si pronunciano).
// `scena` dice allo script degli screenshot come preparare la mappa (vedi scripts/guida_screenshot.py).
const TEATRO_MASSIMO = [13.3586, 38.1203];
const CENTRO = [13.3615, 38.1157];

export const PASSI = [
  {
    id: 'cos-e',
    titolo: 'Cos\'è la mappa e a cosa serve',
    paragrafi: [
      'Il Digital Twin di Palermo è una mappa interattiva che riunisce in un solo posto i dati aperti sulla città: catasto, piano regolatore, popolazione, edifici, monumenti, trasporto pubblico, sicurezza stradale e uffici comunali.',
      'Serve a leggere un luogo da più punti di vista: chi cerca una particella, chi vuole capire come è fatto un quartiere, chi studia la mobilità o i servizi. Ogni informazione resta collegata alla fonte da cui proviene.',
    ],
    immagine: { file: 'img/guida/passi/cos-e.webp', alt: 'La mappa di Palermo appena aperta, con la barra di ricerca in basso e i pulsanti degli strumenti a destra.', didascalia: 'La vista iniziale: il centro di Palermo.' },
    narrazione: 'Benvenuto nel Digital Twin di Palermo. È una mappa interattiva che riunisce in un solo posto i dati aperti sulla città: catasto, piano regolatore, popolazione, edifici, monumenti, trasporto pubblico e sicurezza stradale. Serve a leggere un luogo da più punti di vista, sempre con la fonte dei dati a portata di mano.',
    scena: { strati: [], centro: CENTRO, zoom: 12 },
  },
  {
    id: 'dati',
    titolo: 'Con quali dati è realizzata',
    paragrafi: [
      'La mappa usa dati pubblicati da enti pubblici e da progetti di dati aperti: il Comune di Palermo (scuole, uffici, incidenti, carta tecnica), l\'azienda del trasporto pubblico AMAT, il catasto e la zonizzazione del piano regolatore, i dati del censimento e la base cartografica di OpenStreetMap.',
      'L\'elenco completo, con data e licenza di ciascuna fonte, è nella scheda «Fonti e avvisi» di questo stesso foglio.',
    ],
    immagine: { file: 'img/guida/passi/dati.webp', alt: 'La scheda Fonti e avvisi del foglio informazioni, con l\'elenco delle fonti dei dati.', didascalia: 'Le fonti dei dati sono elencate in «Fonti e avvisi».' },
    narrazione: 'I dati arrivano da enti pubblici e da progetti di dati aperti: il Comune di Palermo, l\'azienda del trasporto pubblico, il catasto, la zonizzazione del piano regolatore, il censimento e la cartografia di OpenStreetMap. L\'elenco completo, con data e licenza di ogni fonte, si trova nella scheda Fonti e avvisi.',
    scena: { strati: [], centro: CENTRO, zoom: 12, ritaglio: '#crediti' },
  },
  {
    id: 'strati',
    titolo: 'La barra degli strati',
    paragrafi: [
      'Gli strati sono i temi che si possono sovrapporre alla mappa. Il pulsante «Strati» apre la barra: ogni icona accende o spegne un tema, e quelli accesi compaiono anche come etichette sopra la mappa.',
      'La legenda in alto a sinistra spiega i colori degli strati accesi. Si può accenderne più d\'uno alla volta per confrontare, ad esempio, edifici e catasto.',
    ],
    immagine: { file: 'img/guida/passi/strati.webp', alt: 'La barra degli strati aperta, con le icone dei temi e alcuni strati accesi sulla mappa.', didascalia: 'La barra degli strati con catasto ed edifici accesi.' },
    narrazione: 'Gli strati sono i temi che si sovrappongono alla mappa. Il pulsante Strati apre la barra: ogni icona accende o spegne un tema. Gli strati accesi compaiono anche come etichette sulla mappa, e la legenda ne spiega i colori. Puoi accenderne più di uno per confrontarli.',
    scena: { strati: ['edificato', 'catasto'], centro: TEATRO_MASSIMO, zoom: 16, apriStrati: true },
  },
  {
    id: 'clic',
    titolo: 'Fare clic sulla mappa',
    paragrafi: [
      'Per conoscere un luogo basta fare clic sulla mappa, o toccarla da telefono. Il punto scelto viene evidenziato e si apre la scheda del luogo.',
    ],
    immagine: { file: 'img/guida/passi/clic.webp', alt: 'Un edificio evidenziato sulla mappa dopo il clic, con la scheda del luogo che si apre sul lato.', didascalia: 'Un clic sul Teatro Massimo evidenzia l\'edificio e apre la scheda.' },
    narrazione: 'Per conoscere un luogo basta fare clic sulla mappa, o toccarla da telefono. Il punto scelto viene evidenziato e si apre la scheda del luogo.',
    scena: { strati: ['edificato', 'catasto'], centro: TEATRO_MASSIMO, zoom: 17, clic: TEATRO_MASSIMO },
  },
  {
    id: 'scheda',
    titolo: 'Cosa si legge nella scheda',
    paragrafi: [
      'La scheda raccoglie tutto ciò che la mappa sa del punto scelto, in sezioni: l\'indirizzo, la particella catastale, la zona del piano regolatore con i suoi vincoli, la popolazione della sezione di censimento e le caratteristiche dell\'edificio.',
      'Ogni sezione indica la fonte. I dati catastali, urbanistici e i vincoli sono solo informativi; la popolazione per edificio è una stima.',
    ],
    immagine: { file: 'img/guida/passi/scheda.webp', alt: 'La scheda del luogo aperta, divisa in sezioni con indirizzo, catasto, zona urbanistica, popolazione ed edificio.', didascalia: 'La scheda del luogo, divisa per argomento.' },
    narrazione: 'La scheda raccoglie ciò che la mappa sa del punto scelto, a sezioni: l\'indirizzo, la particella catastale, la zona del piano regolatore con i vincoli, la popolazione della sezione di censimento e le caratteristiche dell\'edificio. Ogni sezione indica la fonte, e i dati urbanistici sono solo informativi.',
    scena: { strati: ['edificato', 'catasto'], centro: TEATRO_MASSIMO, zoom: 17, clic: TEATRO_MASSIMO, ritaglio: '#scheda' },
  },
  {
    id: 'filtri',
    titolo: 'Cercare e filtrare',
    paragrafi: [
      'La barra in basso permette di cercare una via, un civico, un quartiere o una particella. Il pulsante dei filtri apre il pannello per limitare la ricerca a una circoscrizione, a un quartiere o a una zona.',
      'Esempio: scegliendo una circoscrizione e digitando «Maqueda», i risultati si restringono alle vie con quel nome dentro la zona scelta; un clic su un risultato porta la mappa sul posto e apre la scheda.',
    ],
    immagine: { file: 'img/guida/passi/filtri.webp', alt: 'Il pannello dei filtri aperto sopra la barra di ricerca, con una circoscrizione scelta e l\'elenco dei risultati per «Maqueda».', didascalia: 'Una ricerca di esempio: circoscrizione scelta e testo «Maqueda».' },
    narrazione: 'La barra in basso permette di cercare una via, un civico, un quartiere o una particella. Il pulsante dei filtri apre il pannello per limitare la ricerca a una circoscrizione, a un quartiere o a una zona. Per esempio, scegli una circoscrizione e scrivi Maqueda: i risultati si restringono, e un clic su uno di essi porta la mappa sul posto.',
    scena: { strati: [], centro: CENTRO, zoom: 13, ricerca: { testo: 'Maqueda', apriFiltri: true, circ: 1 } },
  },
  {
    id: 'avvertenze',
    titolo: 'Avvertenze',
    paragrafi: [
      'Catasto, zonizzazione e vincoli hanno valore solo informativo e non sostituiscono il certificato di destinazione urbanistica né le visure ufficiali. Il piano regolatore è la variante generale del duemilaquattro: varianti successive potrebbero non essere incluse.',
      'I dati del censimento sono stime campionarie, quindi i valori per sezione non sono conteggi esatti.',
    ],
    immagine: { file: 'img/guida/passi/avvertenze.webp', alt: 'La scheda Fonti e avvisi con le avvertenze sul valore informativo dei dati.', didascalia: 'Le avvertenze sono sempre consultabili in «Fonti e avvisi».' },
    narrazione: 'Un\'ultima avvertenza: catasto, zonizzazione e vincoli hanno valore solo informativo, e non sostituiscono il certificato di destinazione urbanistica né le visure ufficiali. I dati del censimento sono stime. Per usi legali rivolgiti sempre agli uffici competenti.',
    scena: { strati: [], centro: CENTRO, zoom: 12, ritaglio: '#crediti' },
  },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/js/guida.test.mjs`
Expected: PASS (6 test). Il test «3D» passa perché nessun testo cita il 3D (attenzione a `edificato`, non `edifici3d`).

- [ ] **Step 5: Commit**

```bash
git add js/core/guida-contenuti.js tests/js/guida.test.mjs
git commit -m "feat: contenuti della guida (sette passi, fonte unica per tab, screenshot e video)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Script degli screenshot

**Files:**
- Create: `scripts/guida_screenshot.py`
- Create (output): `img/guida/passi/*.webp` (7 file)
- Test: `tests/test_guida_media.py` (parte immagini)

**Interfaces:**
- Consumes: `PASSI` esportato come JSON da `node -e "import('./js/core/guida-contenuti.js').then(m=>console.log(JSON.stringify(m.PASSI)))"`; sul `scena` di Task 1 anche `apriStrati?: boolean`.
- Produces: `passi() -> list[dict]` (usata anche da `guida_video.py` e dai test) e `main(argv)` con `--solo <id>`; file `img/guida/passi/<id>.webp` 1280×720.

- [ ] **Step 1: Write the failing test**

```python
# tests/test_guida_media.py
import subprocess
from pathlib import Path

import pytest

from guida_screenshot import passi

ROOT = Path(__file__).resolve().parents[1]


def test_passi_letti_da_javascript():
    p = passi()
    assert [x["id"] for x in p][:3] == ["cos-e", "dati", "strati"]


@pytest.mark.parametrize("p", passi(), ids=lambda p: p["id"])
def test_immagine_esiste_ed_e_1280x720(p):
    f = ROOT / p["immagine"]["file"]
    assert f.exists(), f"manca {f}; esegui scripts/guida_screenshot.py"
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", str(f)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    assert out == "1280,720"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_guida_media.py -v`
Expected: FAIL/ERROR `ModuleNotFoundError: No module named 'guida_screenshot'`

- [ ] **Step 3: Write minimal implementation**

```python
#!/usr/bin/env python3
"""Rigenera gli screenshot della guida (img/guida/passi/<id>.webp) dall'app reale.

Uso: python scripts/guida_screenshot.py [--solo <id>]
Richiede rete (base cartografica OpenFreeMap) e Chromium di Playwright.
"""
import argparse
import io
import json
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VIEWPORT = {"width": 1280, "height": 720}


def passi():
    out = subprocess.run(
        ["node", "-e", "import('./js/core/guida-contenuti.js').then(m=>console.log(JSON.stringify(m.PASSI)))"],
        cwd=ROOT, capture_output=True, text=True, check=True,
    ).stdout
    return json.loads(out)


def _avvia_server():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        porta = s.getsockname()[1]
    proc = subprocess.Popen([sys.executable, str(ROOT / "scripts" / "serve.py"), str(porta)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    url = f"http://127.0.0.1:{porta}"
    for _ in range(50):
        try:
            urllib.request.urlopen(url + "/", timeout=0.5)
            return proc, url
        except Exception:
            time.sleep(0.1)
    proc.kill()
    raise RuntimeError("server non partito")


def _imposta_strati(page, voluti):
    page.evaluate(
        """voluti => {
            for (const cb of document.querySelectorAll('input[id^="strato-"]')) {
                const id = cb.id.slice(7), v = voluti.includes(id);
                if (cb.checked !== v && !cb.disabled) { cb.checked = v; cb.dispatchEvent(new Event('change', { bubbles: true })); }
            }
        }""",
        voluti,
    )


def _prepara(page, scena):
    page.evaluate("document.getElementById('crediti')?.open && document.getElementById('crediti').close()")
    _imposta_strati(page, scena["strati"])
    lon, lat = scena["centro"]
    page.evaluate("([c, z]) => window.dt.map.jumpTo({ center: c, zoom: z, pitch: 0, bearing: 0 })", [[lon, lat], scena["zoom"]])
    page.wait_for_function("window.dt.map.loaded()", timeout=30000)
    if scena.get("apriStrati"):
        page.click("#apri-strati")
    if "clic" in scena:
        x, y = page.evaluate(
            """([lon, lat]) => { const m = window.dt.map, p = m.project([lon, lat]), r = m.getCanvas().getBoundingClientRect(); return [r.left + p.x, r.top + p.y]; }""",
            scena["clic"],
        )
        page.mouse.click(x, y)
        page.wait_for_selector("#scheda:not([hidden])", timeout=15000)
    if "ricerca" in scena:
        r = scena["ricerca"]
        if r.get("apriFiltri"):
            page.click("#cerca-filtri")
            page.wait_for_selector("#pannello-filtri:not([hidden])")
        if "circ" in r:
            page.select_option("#f-circ", index=r["circ"])
        page.fill("#cerca-testo", r["testo"])
        page.wait_for_selector("#cerca-risultati:not([hidden])", timeout=15000)
    if scena.get("ritaglio") == "#crediti":
        page.click("#apri-crediti")
        page.wait_for_selector("#crediti[open]")
        page.click("#tab-fonti")
    page.wait_for_timeout(1200)  # fine animazioni e tile


def _salva_webp(png, destinazione):
    destinazione.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", "pipe:0", "-vf", "scale=1280:720", "-quality", "82", str(destinazione)],
        input=png, check=True,
    )


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--solo")
    args = ap.parse_args(argv)
    elenco = [p for p in passi() if args.solo in (None, p["id"])]
    if not elenco:
        sys.exit(f"passo sconosciuto: {args.solo}")
    from playwright.sync_api import sync_playwright

    proc, url = _avvia_server()
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            for p in elenco:
                ctx = browser.new_context(viewport=VIEWPORT, device_scale_factor=1)
                page = ctx.new_page()
                page.goto(url + "/index.html")
                page.wait_for_function("window.dt && window.dt.pronto === true", timeout=60000)
                _prepara(page, p["scena"])
                png = page.screenshot()
                _salva_webp(png, ROOT / p["immagine"]["file"])
                print("ok", p["id"])
                ctx.close()
            browser.close()
    finally:
        proc.terminate()


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Generate the images and run the tests**

Run: `python scripts/guida_screenshot.py && python -m pytest tests/test_guida_media.py -v`
Expected: stampa `ok <id>` per i sette passi; test PASS.
Poi **guarda ogni immagine** con Read (`img/guida/passi/*.webp`) e verifica che mostri ciò che `alt` descrive (scheda aperta in `clic`/`scheda`, risultati in `filtri`, barra strati in `strati`). Se un passo è sbagliato (es. il clic non colpisce un edificio, la circoscrizione `circ: 1` non restituisce risultati per «Maqueda»), correggi `scena` in `guida-contenuti.js` (punto del clic, `circ`, testo) e rigenera con `--solo <id>`; aggiorna `alt`/didascalia se cambia il contenuto.

- [ ] **Step 5: Commit**

```bash
git add scripts/guida_screenshot.py tests/test_guida_media.py img/guida/passi js/core/guida-contenuti.js
git commit -m "feat: script degli screenshot della guida e immagini dei sette passi

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Tab Guida (renderer, CSS, integrazione)

**Files:**
- Create: `js/core/guida.js`
- Modify: `js/core/catalogo.js:17-21` (rimuovere `GUIDA`), `js/core/catalogo.js:2` (import), `js/core/catalogo.js:58` (riga tab guida)
- Modify: `css/app.css` (dopo la riga `.argomento label`, ~233)
- Modify: `tests/test_viewer.py:1157-1169`
- Test: `tests/js/guida.test.mjs` (aggiunta), `tests/test_viewer.py`

**Interfaces:**
- Consumes: `PASSI` (Task 1).
- Produces: `export function schedaGuida(doc = document, passi = PASSI): HTMLElement` — radice con `h2` «Guida», `nav.guida-indice` (link `a[href="#guida-<id>"]`), un `section.guida-passo#guida-<id>` per passo con `h3`, `p`, `figure.guida-figura > img[loading=lazy][alt] + figcaption`.

- [ ] **Step 1: Write the failing tests**

Aggiungi in coda a `tests/js/guida.test.mjs` un DOM finto minimo (il repo non usa jsdom):

```js
import { schedaGuida } from '../../js/core/guida.js';

function elementoFinto(tag) {
  return {
    tag, children: [], attrs: {}, dataset: {}, className: '', textContent: '', hidden: false,
    append(...f) { this.children.push(...f); },
    setAttribute(k, v) { this.attrs[k] = v; },
    set href(v) { this.attrs.href = v; }, get href() { return this.attrs.href; },
    set src(v) { this.attrs.src = v; }, get src() { return this.attrs.src; },
    set alt(v) { this.attrs.alt = v; }, get alt() { return this.attrs.alt; },
    set loading(v) { this.attrs.loading = v; }, get loading() { return this.attrs.loading; },
    set id(v) { this.attrs.id = v; }, get id() { return this.attrs.id; },
  };
}
const doc = { createElement: elementoFinto };
const tutti = (n, tag, acc = []) => { if (n.tag === tag) acc.push(n); n.children?.forEach(c => tutti(c, tag, acc)); return acc; };

test('schedaGuida: una sezione per passo con id ancora, e un link nell\'indice per ciascuno', () => {
  const radice = schedaGuida(doc);
  const sezioni = tutti(radice, 'section');
  assert.deepEqual(sezioni.map(s => s.id), PASSI.map(p => `guida-${p.id}`));
  const link = tutti(radice, 'a').map(a => a.href);
  assert.deepEqual(link, PASSI.map(p => `#guida-${p.id}`));
});

test('schedaGuida: ogni immagine è lazy, ha alt e didascalia', () => {
  const imgs = tutti(schedaGuida(doc), 'img');
  assert.equal(imgs.length, PASSI.length);
  imgs.forEach((img, i) => {
    assert.equal(img.loading, 'lazy');
    assert.equal(img.alt, PASSI[i].immagine.alt);
    assert.equal(img.src, PASSI[i].immagine.file);
  });
  assert.equal(tutti(schedaGuida(doc), 'figcaption').length, PASSI.length);
});
```

Sostituisci in `tests/test_viewer.py` l'ultima asserzione di `test_modale_info_ha_i_tab_fonti_guida_credits` e aggiungi il test del tab:

```python
    v.page.click("#tab-credits")
    assert "provvisorio" in v.page.inner_text("#tabpanel-credits")


def test_tab_guida_mostra_i_passi_con_le_immagini(apri):
    v = apri()
    v.attendi_pronto()
    v.page.click("#apri-crediti")
    v.page.wait_for_selector("#crediti[open]")
    v.page.click("#tab-guida")
    assert "provvisorio" not in v.page.inner_text("#tabpanel-guida")
    assert v.js("document.querySelectorAll('#tabpanel-guida .guida-passo').length") == 7
    v.js("document.querySelectorAll('#tabpanel-guida img').forEach(i => i.loading = 'eager')")
    v.page.wait_for_function("[...document.querySelectorAll('#tabpanel-guida img')].every(i => i.complete && i.naturalWidth > 0)", timeout=15000)
    # l'indice porta al passo
    v.page.click("#tabpanel-guida .guida-indice a[href='#guida-filtri']")
    v.page.wait_for_timeout(400)
    assert v.js("document.getElementById('guida-filtri').getBoundingClientRect().top < innerHeight")


def test_tab_guida_non_causa_scroll_orizzontale_su_mobile(apri):
    v = apri()
    v.page.set_viewport_size({"width": 390, "height": 800})
    v.attendi_pronto()
    v.page.click("#apri-crediti")
    v.page.wait_for_selector("#crediti[open]")
    v.page.click("#tab-guida")
    assert v.js("(() => { const c = document.querySelector('#crediti .tab-corpo'); return c.scrollWidth <= c.clientWidth + 1; })()")
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/js/guida.test.mjs; python -m pytest tests/test_viewer.py -k "tab_guida or modale_info_ha_i_tab" -v`
Expected: JS FAIL `Cannot find module guida.js`; pytest FAIL (7 passi = 0).

- [ ] **Step 3: Write minimal implementation**

```js
// js/core/guida.js
import { PASSI } from './guida-contenuti.js';

// Tab «Guida» del foglio Info: indice, poi un passo per sezione con testo e figura.
export function schedaGuida(doc = document, passi = PASSI) {
  const radice = doc.createElement('div');
  const h = doc.createElement('h2');
  h.textContent = 'Guida';
  radice.append(h);

  const indice = doc.createElement('nav');
  indice.className = 'guida-indice';
  indice.setAttribute('aria-label', 'Indice della guida');
  const ol = doc.createElement('ol');
  for (const p of passi) {
    const li = doc.createElement('li');
    const a = doc.createElement('a');
    a.href = `#guida-${p.id}`;
    a.textContent = p.titolo;
    li.append(a);
    ol.append(li);
  }
  indice.append(ol);
  radice.append(indice);

  for (const p of passi) {
    const sez = doc.createElement('section');
    sez.className = 'guida-passo';
    sez.id = `guida-${p.id}`;
    const t = doc.createElement('h3');
    t.textContent = p.titolo;
    sez.append(t);
    for (const testo of p.paragrafi) {
      const par = doc.createElement('p');
      par.textContent = testo;
      sez.append(par);
    }
    const fig = doc.createElement('figure');
    fig.className = 'guida-figura';
    const img = doc.createElement('img');
    img.src = p.immagine.file;
    img.alt = p.immagine.alt;
    img.loading = 'lazy';
    img.width = 1280;
    img.height = 720;
    const cap = doc.createElement('figcaption');
    cap.textContent = p.immagine.didascalia;
    fig.append(img, cap);
    sez.append(fig);
    radice.append(sez);
  }
  return radice;
}
```

Nel DOM finto servono `width`/`height` come proprietà semplici: va bene, sono assegnazioni su oggetto.

`js/core/catalogo.js`: elimina le righe 17-21 (`const GUIDA = [...]`), aggiungi l'import accanto agli altri e cambia la riga del tab Guida (la radice di `schedaGuida()` ha già il suo `h2`):

```js
import { schedaGuida } from './guida.js';
```
```js
  const argomenti = schedaArgomenti(moduli);
  const guida = schedaGuida();
  const schede = [
    // ...
    ['guida', 'Guida', [guida]],
```

`css/app.css`, dopo `.argomento label { ... }`:

```css
.guida-indice { margin: 0 0 16px; }
.guida-indice ol { margin: 0; padding-left: 20px; }
.guida-indice a { color: var(--text); }
.guida-passo { margin: 0 0 24px; scroll-margin-top: 8px; }
.guida-passo h3 { margin: 0 0 6px; font-size: var(--fs-md); }
.guida-passo p { margin: 0 0 8px; color: var(--text-muted); font-size: 13px; line-height: 1.5; }
.guida-figura { margin: 10px 0 0; }
.guida-figura img { display: block; width: 100%; height: auto; border: 1px solid var(--border-ui); border-radius: var(--r-sm); }
.guida-figura figcaption { margin-top: 4px; color: var(--text-muted); font-size: 12px; }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/js/*.test.mjs; python -m pytest tests/test_viewer.py -k "tab_guida or modale_info_ha_i_tab" -v`
Expected: tutti PASS. Poi verifica visiva: apri l'app con `python scripts/serve.py 8000`, apri Info → Guida a 1280 px e a 390 px (Playwright screenshot), controlla leggibilità e che le figure non escano dal foglio.

- [ ] **Step 5: Commit**

```bash
graphify update .
git add js/core/guida.js js/core/catalogo.js css/app.css tests
git commit -m "feat: tab Guida professionale con indice, passi e figure

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Audio e video

**Files:**
- Create: `scripts/guida_video.py`
- Create (output): `media/guida/guida.mp4`, `media/guida/guida.mp3`, `media/guida/guida.vtt`
- Modify: `tests/test_guida_media.py` (aggiunta)

**Interfaces:**
- Consumes: `passi()` da `scripts/guida_screenshot.py`; immagini del Task 2.
- Produces: `main(argv)`; `formatta_vtt(durate: list[float], testi: list[str]) -> str`; `controlla_requisiti()` che esce con messaggio chiaro se mancano `ffmpeg`, `ffprobe`, il modulo `piper` o il modello.

- [ ] **Step 1: Preparare Piper (una tantum)**

Run:
```bash
python -m pip install piper-tts
python -m piper.download_voices it_IT-paola-medium --data-dir ~/.cache/piper
ls ~/.cache/piper
ffmpeg -hide_banner -filters | grep -c drawtext
```
Expected: `it_IT-paola-medium.onnx` e `.onnx.json` in `~/.cache/piper`; `drawtext` conta ≥ 1. Se `drawtext` manca, nei segmenti rimuovi il filtro `drawtext` (il titolo resta nei sottotitoli). Se `piper.download_voices` non esiste in questa versione, scarica i due file da `https://huggingface.co/rhasspy/piper-voices/resolve/main/it/it_IT/paola/medium/` con `curl -L -o`. Non lasciare file nella radice del repo.

- [ ] **Step 2: Write the failing tests**

Aggiungi a `tests/test_guida_media.py`:

```python
import re

from guida_video import formatta_vtt

MEDIA = ROOT / "media" / "guida"


def test_formatta_vtt_una_cue_per_passo_con_tempi_cumulativi():
    vtt = formatta_vtt([2.0, 3.5], ["Uno.", "Due."])
    assert vtt.startswith("WEBVTT\n")
    assert "00:00:00.000 --> 00:00:02.000\nUno." in vtt
    assert "00:00:02.000 --> 00:00:05.500\nDue." in vtt


def _durata(f):
    return float(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)],
        capture_output=True, text=True, check=True).stdout)


@pytest.mark.parametrize("nome", ["guida.mp4", "guida.mp3", "guida.vtt"])
def test_media_esistono(nome):
    assert (MEDIA / nome).stat().st_size > 1000, f"manca media/guida/{nome}: esegui scripts/guida_video.py"


def test_video_e_audio_hanno_la_stessa_durata_della_somma_dei_passi():
    vtt = (MEDIA / "guida.vtt").read_text(encoding="utf-8")
    fine = re.findall(r"--> (\d+):(\d+):(\d+)\.(\d+)", vtt)
    h, m, s, ms = map(int, fine[-1])
    totale = h * 3600 + m * 60 + s + ms / 1000
    assert len(fine) == len(passi())
    assert abs(_durata(MEDIA / "guida.mp4") - totale) < 1.0
    assert abs(_durata(MEDIA / "guida.mp3") - totale) < 1.0


def test_video_e_1280x720_h264_aac():
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "stream=codec_name,width,height", "-of", "csv=p=0", str(MEDIA / "guida.mp4")],
        capture_output=True, text=True, check=True).stdout.split()
    assert "h264,1280,720" in out and any(r.startswith("aac") for r in out)
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `python -m pytest tests/test_guida_media.py -k "vtt or media or video" -v`
Expected: ERROR `No module named 'guida_video'`.

- [ ] **Step 4: Write implementation**

```python
#!/usr/bin/env python3
"""Genera media/guida/guida.{mp4,mp3,vtt} dalle narrazioni e dagli screenshot dei passi.

Uso: python scripts/guida_video.py [--voce it_IT-paola-medium]
Richiede: ffmpeg/ffprobe, piper-tts e il modello vocale in ~/.cache/piper.
"""
import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from guida_screenshot import ROOT, passi

PAUSA = 0.6
FPS = 25
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
CACHE_VOCI = Path.home() / ".cache" / "piper"
OUT = ROOT / "media" / "guida"


def controlla_requisiti(voce):
    for exe in ("ffmpeg", "ffprobe"):
        if not shutil.which(exe):
            sys.exit(f"manca {exe}: installalo (es. sudo apt install ffmpeg)")
    try:
        import piper  # noqa: F401
    except ImportError:
        sys.exit("manca piper-tts: python -m pip install piper-tts")
    modello = CACHE_VOCI / f"{voce}.onnx"
    if not modello.exists():
        sys.exit(f"manca il modello {modello}: python -m piper.download_voices {voce} --data-dir {CACHE_VOCI}")
    return modello


def _ts(s):
    ms = round(s * 1000)
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d}.{ms % 1000:03d}"


def formatta_vtt(durate, testi):
    righe, t = ["WEBVTT", ""], 0.0
    for d, testo in zip(durate, testi):
        righe += [f"{_ts(t)} --> {_ts(t + d)}", testo, ""]
        t += d
    return "\n".join(righe)


def _durata(f):
    return float(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)],
        capture_output=True, text=True, check=True).stdout)


def _sintetizza(testo, modello, wav):
    subprocess.run([sys.executable, "-m", "piper", "-m", str(modello), "-f", str(wav)], input=testo, text=True, check=True)


def _segmento(passo, wav, durata_audio, dest):
    durata = durata_audio + PAUSA
    titolo = passo["titolo"].replace("'", "’").replace(":", "\\:")
    zoom = f"zoompan=z='min(zoom+0.0004,1.06)':d={int(durata * FPS) + 1}:s=1280x720:fps={FPS}"
    testo = f"drawtext=fontfile={FONT}:text='{titolo}':fontcolor=white:fontsize=34:box=1:boxcolor=black@0.55:boxborderw=14:x=40:y=h-th-40"
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-i", str(ROOT / passo["immagine"]["file"]), "-i", str(wav),
        "-filter_complex", f"[0:v]scale=2560:1440,{zoom},{testo},format=yuv420p[v];[1:a]apad=pad_dur={PAUSA},aresample=44100[a]",
        "-map", "[v]", "-map", "[a]", "-t", f"{durata:.3f}", "-c:v", "libx264", "-c:a", "aac", "-ar", "44100", "-ac", "1", "-r", str(FPS), str(dest),
    ], check=True)


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--voce", default="it_IT-paola-medium")
    args = ap.parse_args(argv)
    modello = controlla_requisiti(args.voce)
    elenco = passi()
    mancanti = [p["immagine"]["file"] for p in elenco if not (ROOT / p["immagine"]["file"]).exists()]
    if mancanti:
        sys.exit(f"immagini mancanti: {mancanti}; esegui scripts/guida_screenshot.py")
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        segmenti, durate = [], []
        for p in elenco:
            wav, seg = tmp / f"{p['id']}.wav", tmp / f"{p['id']}.mp4"
            _sintetizza(p["narrazione"], modello, wav)
            da = _durata(wav)
            _segmento(p, wav, da, seg)
            segmenti.append(seg)
            durate.append(da + PAUSA)
            print("ok", p["id"], f"{da + PAUSA:.1f}s")
        lista = tmp / "lista.txt"
        lista.write_text("".join(f"file '{s}'\n" for s in segmenti))
        mp4 = OUT / "guida.mp4"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lista), "-c", "copy", "-movflags", "+faststart", str(mp4)], check=True)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(mp4), "-vn", "-c:a", "libmp3lame", "-q:a", "4", str(OUT / "guida.mp3")], check=True)
    (OUT / "guida.vtt").write_text(formatta_vtt(durate, [p["narrazione"] for p in elenco]), encoding="utf-8")
    print("scritti", *(OUT / n for n in ("guida.mp4", "guida.mp3", "guida.vtt")))


if __name__ == "__main__":
    main()
```

- [ ] **Step 5: Generate media and run tests**

Run: `python scripts/guida_video.py && python -m pytest tests/test_guida_media.py -v && ls -lh media/guida`
Expected: `ok <id> <secondi>` per i sette passi; tutti i test PASS; `guida.mp4` ≤ 20 MB (se oltre, aggiungi `-crf 28` ai segmenti e rigenera).
Verifica a occhio e a orecchio: estrai tre frame (`ffmpeg -i media/guida/guida.mp4 -vf fps=1/10 /tmp/…` nella scratchpad) e guardali con Read; controlla che titolo in sovrimpressione e immagine siano corretti e che il parlato non sia troncato (ascolto da parte dell'utente: chiedi di riascoltare il file).

- [ ] **Step 6: Commit**

```bash
git add scripts/guida_video.py tests/test_guida_media.py media/guida
git commit -m "feat: video e audio della guida (Piper + ffmpeg) con sottotitoli

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Incorporare video e audio nel tab, verifica finale

**Files:**
- Modify: `js/core/guida.js` (blocco media dopo l'indice)
- Modify: `css/app.css` (`.guida-media`)
- Modify: `tests/js/guida.test.mjs`, `tests/test_viewer.py`
- Modify: `README.md` (sezione «Rigenerare la guida»)

**Interfaces:**
- Consumes: file di `media/guida/` (Task 4), `schedaGuida` (Task 3).
- Produces: `schedaGuida` aggiunge `div.guida-media` con `video[controls][preload=metadata][poster]` (+ `source` mp4, `track kind=captions srclang=it default`) e `audio[controls][preload=none]` con `source` mp3.

- [ ] **Step 1: Write the failing tests**

In `tests/js/guida.test.mjs`:

```js
test('schedaGuida: blocco media con video sottotitolato e audio', () => {
  const radice = schedaGuida(doc);
  const [video] = tutti(radice, 'video');
  assert.equal(video.attrs.preload, 'metadata');
  assert.equal(video.attrs.poster, PASSI[0].immagine.file);
  const [track] = tutti(video, 'track');
  assert.equal(track.attrs.kind, 'captions');
  assert.equal(track.attrs.src, 'media/guida/guida.vtt');
  const [audio] = tutti(radice, 'audio');
  assert.equal(audio.attrs.preload, 'none');
});
```

In `tests/test_viewer.py` (dentro `test_tab_guida_mostra_i_passi_con_le_immagini`, prima dell'indice):

```python
    assert v.js("document.querySelector('#tabpanel-guida video').readyState >= 0")
    v.page.wait_for_function("document.querySelector('#tabpanel-guida video').duration > 10", timeout=15000)
    assert v.js("document.querySelector('#tabpanel-guida video track').track.mode") in ("showing", "hidden", "disabled")
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/js/guida.test.mjs; python -m pytest tests/test_viewer.py -k tab_guida -v`
Expected: FAIL (nessun `video`).

- [ ] **Step 3: Write implementation**

Nel DOM finto servono `setAttribute` e `append` (già presenti). In `schedaGuida`, dopo `radice.append(indice)`:

```js
  const media = doc.createElement('div');
  media.className = 'guida-media';
  const video = doc.createElement('video');
  video.setAttribute('controls', '');
  video.setAttribute('preload', 'metadata');
  video.setAttribute('poster', passi[0].immagine.file);
  video.setAttribute('aria-label', 'Video guida: panoramica della mappa');
  const sv = doc.createElement('source');
  sv.setAttribute('src', 'media/guida/guida.mp4');
  sv.setAttribute('type', 'video/mp4');
  const tr = doc.createElement('track');
  tr.setAttribute('kind', 'captions');
  tr.setAttribute('srclang', 'it');
  tr.setAttribute('label', 'Italiano');
  tr.setAttribute('src', 'media/guida/guida.vtt');
  tr.setAttribute('default', '');
  video.append(sv, tr);
  const audio = doc.createElement('audio');
  audio.setAttribute('controls', '');
  audio.setAttribute('preload', 'none');
  audio.setAttribute('aria-label', 'Versione solo audio della guida');
  const sa = doc.createElement('source');
  sa.setAttribute('src', 'media/guida/guida.mp3');
  sa.setAttribute('type', 'audio/mpeg');
  audio.append(sa);
  media.append(video, audio);
  radice.append(media);
```

CSS:

```css
.guida-media { margin: 0 0 20px; }
.guida-media video { display: block; width: 100%; height: auto; border-radius: var(--r-sm); background: #000; }
.guida-media audio { display: block; width: 100%; margin-top: 8px; }
```

(`background: #000` è il fondo del player video, non un colore del tema: accettato.)

README: aggiungi sezione

```markdown
## Rigenerare la guida
1. Rivedi i testi in `js/core/guida-contenuti.js`.
2. `python scripts/guida_screenshot.py` (immagini in `img/guida/passi/`, serve rete).
3. `python scripts/guida_video.py` (video/audio/sottotitoli in `media/guida/`; richiede `piper-tts` e il modello vocale, vedi lo script).
```

- [ ] **Step 4: Run the whole suite**

Run: `npm run test:js && python -m pytest tests -q`
Expected: tutto verde. Se `test_strati_iniziali_e_attivabili` va in timeout come già annotato in sessioni precedenti, riportalo come problema preesistente confermando con `git stash` che fallisce anche senza queste modifiche; non mascherarlo.
Verifica finale a vista: screenshot del tab Guida a 1280 e 390 px (Playwright) e controllo che il video parta.

- [ ] **Step 5: Commit**

```bash
graphify update .
git add js css tests README.md
git commit -m "feat: video e audio incorporati nel tab Guida, istruzioni di rigenerazione

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Self-Review

- **Copertura spec:** contenuti (T1), screenshot (T2), tab con indice/figure/CSS/accessibilità (T3), audio+video+vtt (T4), incorporamento media e flusso di rigenerazione (T5), test JS/Selenium/Python previsti nella spec tutti presenti. Tab Credits invariato (resta «provvisorio», fuori ambito).
- **Placeholder:** nessuno; il solo punto condizionale (drawtext/modello Piper) ha il ripiego esplicito.
- **Coerenza tipi:** `PASSI`, `schedaGuida(doc, passi)`, `passi()`, `formatta_vtt(durate, testi)` usati con le stesse firme in tutti i task; `scena.apriStrati` introdotto nel dato del passo `strati` (T1) e letto in `_prepara` (T2) — dichiarato in Interfaces di T2.
- **Review Focus:** immagine mancante (T2 test), alt/cifre/sigle (T1), id (T1), mobile (T3), requisiti mancanti (T4 `controlla_requisiti`), durata (T4).
