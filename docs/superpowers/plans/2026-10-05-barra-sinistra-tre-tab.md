# Barra sinistra a tre tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La barra sinistra mostra solo i tab Mappe di base, Layer e RNDT; tutti gli altri gruppi diventano sezioni ripiegabili dentro Layer.

**Architecture:** `costruisciPannello` (`js/core/pannello.js`) crea un tab solo per `base`, `rndt` e per un nuovo pannello `layer`; ogni altro gruppo diventa un `<details id="gruppo-<id>">` dentro `#gruppo-layer`, con il titolo `h2` nel `<summary>`. La parte pura (ordine alfabetico, stato aperto/chiuso in `localStorage`) vive in un nuovo `js/core/layer-sezioni.js`, testabile con `node --test`.

**Tech Stack:** JS ES modules senza build, `node --test` (`npm run test:js`), pytest + Playwright (`tests/test_viewer.py`), CSS in `css/app.css`.

**Spec:** `docs/superpowers/specs/2026-10-05-barra-sinistra-tre-tab-design.md`

## Global Constraints

- Tab a sinistra: esattamente `btn-gruppo-base`, `btn-gruppo-layer`, `btn-gruppo-rndt`, in quest'ordine.
- Sezioni di Layer in **ordine alfabetico** per titolo visibile (regola dell'utente: vale anche per i layer futuri).
- Sezioni **indipendenti** (non accordion); stato aperto/chiuso in `localStorage` con try/catch; prima apertura: tutte chiuse.
- Ogni sezione mantiene `id="gruppo-<id>"` e il titolo in un `h2` dentro `<summary>`.
- Invariati: pannello RNDT e Scheda a destra, tab RNDT a sinistra (`gruppoRndt`), mobile ≤720px (stessa struttura DOM, nessun CSS mobile nuovo), ricerca, filtri, legende, opacità, zoom, tema colore, riordino.
- Testi in italiano con accenti corretti; commenti e nomi come il resto del codice (italiano).

## Review Focus

- Un gruppo senza strati propri (RNDT vuoto, o `m.strati` vuoto): non deve creare una sezione vuota né rompere il conteggio.
- `localStorage` bloccato o con JSON corrotto: la pagina si apre, sezioni chiuse, nessuna eccezione.
- Moduli con `gruppo:` (alberi/fontanelle → monumenti; scuole/uffici → colonnine; incendi → territorio) finiscono nella sezione giusta, non in una nuova.
- «Cerca strato» e la barra del riordino devono comparire **dopo** il `summary`, mai dentro.
- Test e script che cliccano `#btn-gruppo-<id>` di un gruppo diventato sezione (`conftest.mostra`, `test_viewer.py`).

---

## File Structure

- Create: `js/core/layer-sezioni.js` — funzioni pure: `ordinaSezioni`, `leggiAperte`, `salvaAperta`, `CHIAVE`.
- Create: `tests/js/layer-sezioni.test.mjs` — test delle funzioni pure.
- Modify: `js/core/pannello.js` — tab `layer`, sezioni `<details>`, conteggi, helper `intestazione`.
- Modify: `js/core/icone.js` — icona `layer`.
- Modify: `css/app.css` — stile `summary`/`details`, badge conteggio, larghezza pannello.
- Modify: `tests/conftest.py`, `tests/test_viewer.py` — adattamento e nuovi test.
- Modify: `js/core/guida-contenuti.js` — testo del passo «La barra degli strati».

---

### Task 1: Funzioni pure per le sezioni di Layer

**Files:**
- Create: `js/core/layer-sezioni.js`
- Test: `tests/js/layer-sezioni.test.mjs`

**Interfaces:**
- Produces:
  - `CHIAVE = 'dt-layer-sezioni'`
  - `ordinaSezioni(voci: {id: string, titolo: string}[]): string[]` — id ordinati per titolo, alfabetico italiano, senza maiuscole/accenti.
  - `leggiAperte(storage): string[]` — id delle sezioni aperte; `[]` se storage assente, vuoto o corrotto.
  - `salvaAperta(storage, id: string, aperta: boolean): void` — aggiunge/toglie `id`; non lancia mai.

- [ ] **Step 1: Write the failing test**

```js
// tests/js/layer-sezioni.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { CHIAVE, ordinaSezioni, leggiAperte, salvaAperta } from '../../js/core/layer-sezioni.js';

const finto = (iniziale) => {
  const m = new Map(iniziale ? [[CHIAVE, iniziale]] : []);
  return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), m };
};

test('ordinaSezioni: alfabetico italiano, senza badare a maiuscole', () => {
  const voci = [
    { id: 'trasporto', titolo: 'Trasporti' }, { id: 'edifici', titolo: 'Edifici' },
    { id: 'colonnine', titolo: 'Servizi' }, { id: 'confini', titolo: 'confini' },
  ];
  assert.deepEqual(ordinaSezioni(voci), ['confini', 'edifici', 'colonnine', 'trasporto']);
});

test('ordinaSezioni: non modifica l\'elenco ricevuto', () => {
  const voci = [{ id: 'b', titolo: 'B' }, { id: 'a', titolo: 'A' }];
  ordinaSezioni(voci);
  assert.deepEqual(voci.map(v => v.id), ['b', 'a']);
});

test('leggiAperte: senza storage, vuoto o con JSON corrotto restituisce []', () => {
  assert.deepEqual(leggiAperte(null), []);
  assert.deepEqual(leggiAperte(finto()), []);
  assert.deepEqual(leggiAperte(finto('{non json')), []);
  assert.deepEqual(leggiAperte(finto('{"a":1}')), []);
  assert.deepEqual(leggiAperte(finto('["edifici", 3, null]')), ['edifici']);
});

test('salvaAperta: aggiunge e toglie senza duplicati', () => {
  const s = finto();
  salvaAperta(s, 'edifici', true);
  salvaAperta(s, 'edifici', true);
  salvaAperta(s, 'confini', true);
  assert.deepEqual(leggiAperte(s), ['edifici', 'confini']);
  salvaAperta(s, 'edifici', false);
  assert.deepEqual(leggiAperte(s), ['confini']);
});

test('salvaAperta: storage che lancia o assente non produce eccezioni', () => {
  assert.doesNotThrow(() => salvaAperta(null, 'a', true));
  const rotto = { getItem: () => { throw new Error('bloccato'); }, setItem: () => { throw new Error('pieno'); } };
  assert.doesNotThrow(() => salvaAperta(rotto, 'a', true));
  assert.deepEqual(leggiAperte(rotto), []);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/js/layer-sezioni.test.mjs`
Expected: FAIL con `Cannot find module '.../js/core/layer-sezioni.js'`

- [ ] **Step 3: Write minimal implementation**

```js
// js/core/layer-sezioni.js
// Sezioni del tab «Layer»: ordine alfabetico e stato aperto/chiuso. Solo parti pure (testabili);
// il collegamento al DOM sta in pannello.js.
export const CHIAVE = 'dt-layer-sezioni';

// Id delle sezioni in ordine alfabetico di titolo (italiano, senza distinguere maiuscole e accenti).
export function ordinaSezioni(voci) {
  return [...voci].sort((a, b) => a.titolo.localeCompare(b.titolo, 'it', { sensitivity: 'base' })).map(v => v.id);
}

// Id delle sezioni lasciate aperte; storage assente, bloccato o corrotto: nessuna.
export function leggiAperte(storage) {
  try {
    const v = JSON.parse(storage?.getItem(CHIAVE) ?? '[]');
    return Array.isArray(v) ? v.filter(x => typeof x === 'string') : [];
  } catch { return []; }
}

export function salvaAperta(storage, id, aperta) {
  const aperte = new Set(leggiAperte(storage));
  if (aperta) aperte.add(id); else aperte.delete(id);
  try { storage?.setItem(CHIAVE, JSON.stringify([...aperte])); } catch { /* storage pieno o bloccato: vale per la sessione */ }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/js/layer-sezioni.test.mjs`
Expected: PASS (5 test)

- [ ] **Step 5: Commit**

```bash
git add js/core/layer-sezioni.js tests/js/layer-sezioni.test.mjs
git commit -m "feat(pannello): funzioni pure per le sezioni del tab Layer"
```

---

### Task 2: Tab Layer con sezioni nel pannello

**Files:**
- Modify: `js/core/pannello.js` (import in cima; `ETICHETTE` riga 47; `aggiornaConteggio` ~50-75; `bottoneGruppo` ~86-94; `abilitaRiordino` riga ~315; `costruisciPannello` 331-415)
- Modify: `js/core/icone.js` (aggiungere `layer`)
- Test: `tests/test_viewer.py`, `tests/conftest.py`

**Interfaces:**
- Consumes: `ordinaSezioni`, `leggiAperte`, `salvaAperta` da `./layer-sezioni.js` (Task 1).
- Produces (DOM, usato da CSS e test):
  - `#barra-gruppi` contiene `#btn-gruppo-base`, `#btn-gruppo-layer`, `#btn-gruppo-rndt`.
  - `section#gruppo-layer.sotto-pannello` contiene `details.layer-sezione#gruppo-<id>` con `summary > h2`.
  - `summary` ha `dataset.attivo` (`"true"|"false"`) e `dataset.n` (conteggio strati accesi).
  - `#btn-gruppo-layer` ha `dataset.attivo`/`dataset.n` col totale degli strati accesi nelle sezioni.
  - Helper non esportato `intestazione(el)` → `summary` figlio diretto, altrimenti `h2`.

- [ ] **Step 1: Write the failing tests**

In `tests/conftest.py` sostituire il corpo di `mostra` (righe ~82-88) con:

```python
    def mostra(self, selettore):
        """Apre il pannello della barra e la sezione di Layer che contengono l'elemento (se sono chiusi)."""
        self.page.evaluate(
            """sel => {
                const el = document.querySelector(sel);
                const sezione = el?.closest('details.layer-sezione');
                if (sezione) sezione.open = true;
                const g = el?.closest('.sotto-pannello');
                if (g?.hidden) document.getElementById('btn-gruppo-' + g.id.replace('gruppo-', '')).click();
            }""", selettore)
```

In `tests/test_viewer.py` sostituire `test_strati_stanno_in_sotto_pannelli_della_barra_e_si_apre_uno_solo` (righe ~1120-1131) con:

```python
def test_barra_sinistra_ha_tre_tab_e_si_apre_un_pannello_solo(apri):
    v = apri()
    v.attendi_pronto()
    assert v.js("[...document.querySelectorAll('#barra-gruppi button')].map(b => b.id)") == [
        "btn-gruppo-base", "btn-gruppo-layer", "btn-gruppo-rndt"]
    assert v.js("!document.getElementById('pannello').querySelector('.sotto-pannello:not([hidden])')")
    v.page.click("#btn-gruppo-base")
    assert v.page.is_visible("#gruppo-base")
    v.page.click("#btn-gruppo-layer")
    assert v.page.is_visible("#gruppo-layer")
    assert not v.page.is_visible("#gruppo-base")
    v.page.click("#btn-gruppo-layer")
    assert not v.page.is_visible("#gruppo-layer")


def test_layer_raccoglie_i_gruppi_in_sezioni_alfabetiche_indipendenti(apri):
    v = apri()
    v.attendi_pronto()
    v.page.click("#btn-gruppo-layer")
    titoli = v.js("[...document.querySelectorAll('#gruppo-layer > details > summary > h2')].map(h => h.textContent)")
    assert titoli == sorted(titoli, key=str.casefold)
    for atteso in ("Edifici", "Popolazione", "Confini", "Monumenti", "Servizi"):
        assert atteso in titoli
    # i moduli con `gruppo:` stanno nella sezione del gruppo ospite
    assert v.js("!!document.querySelector('#gruppo-monumenti #strato-alberi, #gruppo-monumenti #strato-fontanelle')")
    # tutte chiuse alla prima apertura, poi indipendenti
    assert v.js("document.querySelectorAll('#gruppo-layer > details[open]').length") == 0
    v.page.click("#gruppo-edifici > summary")
    v.page.click("#gruppo-confini > summary")
    assert v.js("document.getElementById('gruppo-edifici').open && document.getElementById('gruppo-confini').open")
    # lo stato sopravvive alla ricarica
    v.page.reload()
    v.attendi_pronto()
    v.page.click("#btn-gruppo-layer")
    assert v.js("document.getElementById('gruppo-edifici').open && document.getElementById('gruppo-confini').open")
    assert not v.js("document.getElementById('gruppo-popolazione').open")


def test_layer_conteggio_strati_accesi_su_sezione_e_tab(apri):
    v = apri()
    v.attendi_pronto()
    v.page.click("#btn-gruppo-layer")
    v.js("document.querySelector('#gruppo-confini').open = true")
    v.js("document.querySelector('#gruppo-confini label.strato input').click()")
    totale = v.js("document.querySelectorAll('#gruppo-layer input[type=checkbox]:checked:not([data-filtro])').length")
    assert v.js("document.getElementById('btn-gruppo-layer').dataset.n") == str(totale)
    n = v.js("document.querySelectorAll('#gruppo-confini input[type=checkbox]:checked:not([data-filtro])').length")
    assert v.js("document.querySelector('#gruppo-confini > summary').dataset.n") == str(n)
    # «Cerca strato» e il riordino stanno dopo il summary, mai dentro
    assert v.js("!document.querySelector('#gruppo-layer summary .strato-cerca, #gruppo-layer summary .strato-strumenti')")
```

Nel test mobile (righe ~1264-1270) sostituire le ultime righe da `v.page.click("#btn-gruppo-edifici")` con:

```python
    v.page.click("#btn-gruppo-layer")
    v.page.click("#gruppo-edifici > summary")
    p = v.js("(() => { const r = document.getElementById('gruppo-layer').getBoundingClientRect(); return r.left; })()")
    assert p >= r["r"]  # il pannello si apre accanto alla barra
    assert v.js("document.querySelector('#gruppo-edifici > summary').dataset.attivo") == "true"
    assert v.js("document.querySelector('#gruppo-terreno > summary').dataset.attivo") == "false"
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest tests/test_viewer.py -k "tre_tab or layer_raccoglie or layer_conteggio or barra_verticale" -v`
Expected: FAIL (non esiste `btn-gruppo-layer`). Se Chrome/Playwright manca (`playwright install chromium` non disponibile), annotare nel commit che la verifica è passata dal browser con chrome-devtools MCP (Step 6) e saltare questo run.

- [ ] **Step 3: Implement**

`js/core/icone.js`: dopo la riga di `territorio` aggiungere

```js
  layer: 'M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z',
```

`js/core/pannello.js`:

1. In cima, dopo gli altri import:

```js
import { ordinaSezioni, leggiAperte, salvaAperta } from './layer-sezioni.js';
```

2. `ETICHETTE` (riga 47): cambiare `base: 'Mappa'` in `base: 'Mappe di base'` e aggiungere `layer: 'Layer'`.

3. Subito sotto `ETICHETTE`, l'helper e l'insieme dei tab diretti:

```js
// I soli gruppi che hanno un tab proprio; tutti gli altri sono sezioni del tab «Layer».
const TAB_DIRETTI = new Set(['base', 'rndt']);
// Titolo di un gruppo: il `summary` di una sezione, altrimenti l'`h2` del pannello. Barre e campi si inseriscono dopo.
const intestazione = el => el.querySelector(':scope > summary') ?? el.querySelector('h2');
```

4. `aggiornaConteggio`: dopo l'aggiornamento di `#strati-attivi` (prima del `const chip`), aggiungere:

```js
  const tabLayer = document.getElementById('btn-gruppo-layer');
  if (tabLayer) {
    const n = document.querySelectorAll('#gruppo-layer input[type=checkbox]:checked:not([data-filtro])').length;
    tabLayer.dataset.attivo = String(n > 0);
    tabLayer.dataset.n = String(n);
  }
```

5. `bottoneGruppo`: l'icona del tab Mappe di base non deve coincidere con quella di Layer:

```js
  b.innerHTML = `${svgIcona(id === 'base' ? 'mappa' : id) || svgIcona('info')}<span class="et">${ETICHETTE[id] ?? titolo}</span>`;
```

6. `abilitaRiordino` (riga ~315): `gruppo.querySelector('h2').after(barra)` → `intestazione(gruppo).after(barra)`.

7. `costruisciPannello`: all'inizio, prima di `const gruppi = []`:

```js
  let storage = null;
  try { storage = window.localStorage; } catch { /* storage bloccato: ordine e sezioni valgono per la sessione */ }
  const aperte = leggiAperte(storage);
  const sezioni = [];
  let layer = null;
```

e rimuovere più sotto le due righe che dichiarano `let storage = null;` / `try { storage = window.localStorage; } catch {...}`.

Rinominare l'attuale `const aggiungi = (id, titolo) => {...}` in `const nuovoTab = (id, titolo) => {...}` (corpo invariato) e dopo di essa aggiungere:

```js
  // gruppo ordinario: una sezione ripiegabile dentro il pannello «Layer», creato al primo uso
  const nuovaSezione = (id, titolo) => {
    layer ??= nuovoTab('layer', ETICHETTE.layer);
    const el = document.createElement('details');
    el.id = `gruppo-${id}`;
    el.className = 'layer-sezione';
    el.open = aperte.includes(id);
    const sommario = document.createElement('summary');
    const h = document.createElement('h2');
    h.textContent = ETICHETTE[id] ?? titolo;
    sommario.append(h);
    el.append(sommario);
    el.bottone = sommario; // `segna` ci scrive pallino e conteggio, come sul tab di un gruppo
    el.addEventListener('toggle', () => salvaAperta(storage, id, el.open));
    sezioni.push(el);
    layer.append(el);
    return el;
  };
  const aggiungi = (id, titolo) => (TAB_DIRETTI.has(id) ? nuovoTab(id, titolo) : nuovaSezione(id, titolo));
```

Dopo il ciclo `for (const m of moduli) {...}` e prima di `// albero ripiegabile e strati riordinabili`:

```js
  // sezioni in ordine alfabetico (anche per i gruppi che arriveranno)
  if (layer) layer.append(...ordinaSezioni(sezioni.map(el => ({ id: el.id, titolo: el.querySelector('h2').textContent }))).map(id => document.getElementById(id)));
  const contenitori = [...gruppi.map(g => g.el).filter(el => el !== layer), ...sezioni];
```

Sostituire i due cicli `for (const { el } of gruppi)` (riordino e «Cerca strato») con `for (const el of contenitori)`, e nel secondo `el.querySelector('h2').after(campo)` → `intestazione(el).after(campo)`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:js && python -m pytest tests/test_viewer.py -k "tre_tab or layer_raccoglie or layer_conteggio or barra_verticale or sfondo_chiaro" -v`
Expected: PASS. Poi l'intera suite `python -m pytest tests/test_viewer.py -q`: nessun nuovo fallimento rispetto a prima (confrontare con `git stash` se qualcosa fallisce).

- [ ] **Step 5: Commit**

```bash
git add js/core/pannello.js js/core/icone.js tests/conftest.py tests/test_viewer.py
git commit -m "feat(pannello): i gruppi diventano sezioni del tab Layer, a sinistra solo tre tab"
```

---

### Task 3: Stile delle sezioni e verifica nel browser

**Files:**
- Modify: `css/app.css` (blocco `@media (min-width: 721px)` ~riga 906 e fondo del file)

**Interfaces:**
- Consumes: DOM prodotto dal Task 2 (`details.layer-sezione > summary > h2`, `summary[data-attivo][data-n]`).

- [ ] **Step 1: Aggiungere lo stile**

Alla fine di `css/app.css`:

```css
/* Sezioni del tab «Layer»: ognuna si apre e si chiude da sola */
.layer-sezione { border-top: 1px solid var(--border); }
.layer-sezione:first-of-type { border-top: 0; }
.layer-sezione > summary {
  position: relative; display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 10px 2px; cursor: pointer; list-style: none; user-select: none;
}
.layer-sezione > summary::-webkit-details-marker { display: none; }
.layer-sezione > summary h2 { margin: 0; }
.layer-sezione > summary::before { content: '▸'; order: -1; color: var(--text-muted); font-size: var(--fs-xs); transition: transform .12s; }
.layer-sezione[open] > summary::before { transform: rotate(90deg); }
.layer-sezione > summary:hover h2 { color: var(--text); }
.layer-sezione > summary:focus-visible { outline: 2px solid var(--accent); outline-offset: 0; border-radius: var(--r-sm); }
.layer-sezione > summary[data-attivo="true"]::after {
  content: attr(data-n); min-width: 18px; height: 18px; padding: 0 5px; border-radius: var(--r-pill);
  background: var(--accent); color: var(--accent-ink); font-size: var(--fs-2xs); font-weight: 700; line-height: 18px; text-align: center;
}
.layer-sezione[open] { padding-bottom: 8px; }
```

Nel blocco desktop (`@media (min-width: 721px)`), cambiare `--pannello-w: 280px` in `--pannello-w: 320px` e aggiornare il commento sopra («i gruppi hanno liste corte» non è più vero: ora il pannello contiene tutte le sezioni).

- [ ] **Step 2: Verifica nel browser**

Avviare il server (`python -m http.server 8000` dalla radice, già in uso in questo progetto) e aprire `http://localhost:8000`, con Playwright o chrome-devtools MCP. Controllare con screenshot a 1440×900 e 390×760:
- tre soli tab a sinistra; Layer apre il pannello con sezioni chiuse in ordine alfabetico;
- sezioni aperte insieme (Edifici + Confini), triangolo che ruota, pallino col conteggio;
- il testo del tab «Mappe di base» entra in altezza; se no, ridurre `--fs-2xs` del tab o accorciare l'etichetta a «Basi» e ripetere;
- `--sx`: legende, ricerca e controlli MapLibre si spostano con il pannello a 320px;
- opacità, zoom, riordino, «Cerca strato» e tema colore funzionano dentro una sezione;
- console senza errori.

- [ ] **Step 3: Commit**

```bash
git add css/app.css
git commit -m "style(pannello): sezioni ripiegabili del tab Layer, pannello a 320px"
```

---

### Task 4: Guida, grafo e chiusura

**Files:**
- Modify: `js/core/guida-contenuti.js` (passo `strati`, righe ~34-41; riga 68 «gruppo Territorio» resta valida solo se Monumenti sta in Territorio: correggere in «sezione Monumenti»)
- Modify: `scripts/guida_screenshot_rndt.py` (solo se i selettori `#btn-gruppo-rndt` non funzionano più: non dovrebbe servire)

**Interfaces:**
- Consumes: struttura finale del Task 2-3.

- [ ] **Step 1: Aggiornare i testi della guida**

Nel passo `strati` sostituire in `corpo` e `narrazione` la descrizione dei tab:

```js
'Gli strati sono i temi che si possono sovrapporre alla mappa. La barra a sinistra ha tre tab: «Mappe di base» per scegliere la cartografia, «Layer» con tutti gli strati e «RNDT» con i dati aggiunti dal catalogo; da telefono si apre con il pulsante «Strati». In «Layer» gli strati sono raggruppati in sezioni (Rilievo, Popolazione, Territorio, Edifici, Trasporti, Sicurezza e altre) che si aprono e si chiudono ognuna per conto proprio, con una casella per accendere o spegnere ogni strato e un campo per cercarlo. Il pannello resta aperto finché non si preme di nuovo il tab o Esc.',
```

e nella `narrazione`: «La barra a sinistra ha tre tab: mappe di base, layer e R N D T. Dentro layer gli strati sono raggruppati in sezioni: rilievo, popolazione, territorio, edifici, trasporti e sicurezza. Apri una sezione per vedere i suoi strati e accendili con la casella. …» (il resto della frase invariato). Controllare le altre occorrenze di «gruppo Territorio» (riga 68) e «gruppo "Piano PAI"» (righe 90, 94): sostituire «gruppo» con «sezione» dove si parla della barra strati, non toccare «Il gruppo RNDT» (resta un tab).

- [ ] **Step 2: Test e grafo**

Run: `npm run test:js && python -m pytest tests -q -x --ignore=tests/test_guida_carosello.py`
Expected: PASS (guida.test.mjs controlla gli id dei passi, non i testi).
Run: `graphify update .`

- [ ] **Step 3: Commit**

```bash
git add js/core/guida-contenuti.js graphify-out
git commit -m "docs(guida): la barra sinistra ha tre tab, gli strati stanno in sezioni di Layer"
```

(Gli screenshot della guida con la scena `gruppo: 'Territorio'` vanno rigenerati con gli script esistenti solo se Chrome è disponibile; altrimenti annotarlo come lavoro residuo.)

---

## Self-Review

- **Spec coverage:** tre tab (T2), sezioni indipendenti con stato salvato e chiuse di default (T1+T2), ordine alfabetico (T1+T2), conteggi su sezione e tab (T2), `summary`/`h2` e `id` mantenuti (T2), larghezza pannello e stile (T3), test e guida (T2, T4), mobile invariato (stessa struttura DOM, test mobile adattato in T2). RNDT destra/Scheda invariati: nessun task li tocca.
- **Placeholder scan:** nessun TBD; l'unico rimando condizionale è la classe della barra del riordino, con il comando per verificarla.
- **Type consistency:** `ordinaSezioni`/`leggiAperte`/`salvaAperta` hanno gli stessi nomi e firme in T1 e T2; `intestazione(el)` è definita in T2 e usata solo lì.
