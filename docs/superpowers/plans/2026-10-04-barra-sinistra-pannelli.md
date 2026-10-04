# Barra sinistra a pannelli Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La barra strati a sinistra diventa una barra di tab verticali a tutta altezza; ogni gruppo apre i suoi sotto-menu in un pannello ancorato, come la barra di destra (Scheda, RNDT).

**Architecture:** Solo desktop (>720px). CSS e markup riusano `.rail-tab` e introducono `--sx` (ingombro a sinistra, analogo di `--scheda-l`). `js/core/pannello.js` perde la chiusura al clic fuori e guadagna il ripiegamento incrociato sotto 1280px. Mobile (bottom sheet) resta identico.

**Tech Stack:** HTML/CSS/JS ES module senza build, pytest + Playwright (`tests/test_viewer.py`), test JS `tests/js/*.test.mjs`.

**Spec:** `docs/superpowers/specs/2026-10-04-barra-sinistra-pannelli-design.md`

## Global Constraints

- Desktop = `@media (min-width: 721px)`; mobile = `max-width: 720px` e non cambia.
- `--rail-w: 44px`, `--scheda-w: 380px` (340px sotto 1000px); id esistenti invariati: `#barra-strati`, `#barra-gruppi`, `#pannello`, `.sotto-pannello`, `#btn-gruppo-<id>`, `#gruppo-<id>`.
- Un solo gruppo aperto alla volta; secondo clic sul tab attivo lo ripiega.
- Sotto 1280px di larghezza aprire un pannello (sinistro o destro) ripiega l'altro; sopra possono stare aperti insieme.
- Testi dell'interfaccia in italiano. Dopo le modifiche al codice: `graphify update .`.
- Non committare gli altri file già modificati nel working tree (`git add` solo dei file del task).

## Review Focus

- Base `:root --sx: 100px` mantiene `112px` su mobile (`calc(var(--sx) + 12px)`): test di geometria a 390px che legenda e chip non si spostano.
- Tab con molti gruppi su schermo basso (viewport 1280x500): la barra scorre, nessun tab tagliato in modo irraggiungibile.
- Gruppo `base` (icona con miniatura): il tab da 34px non deve rompersi; verificare `.base-mini` visibile.
- Pannello sinistro + scheda a destra a 1280px: la ricerca resta centrata nella mappa visibile e non esce dallo schermo.
- Clic sulla mappa con pannello aperto non lo chiude più; Esc o secondo clic sul tab sì.

---

### Task 1: Barra e pannello ancorati, layout con `--sx` (CSS)

**Files:**
- Modify: `css/app.css` (`:root` ~L58-60; `#legende-box` ~L513; `.avviso-fisso` ~L520; `#strati-chip` ~L649; blocco desktop ~L536-539; nuovo blocco in fondo al file)
- Modify: `js/core/pannello.js` (`bottoneGruppo`, riga `b.innerHTML`)
- Test: `tests/test_viewer.py`

**Interfaces:**
- Produces: variabile CSS `--sx` (100px di base, `--rail-w` / `--rail-w + --scheda-w` su desktop); classe `rail-tab` sui bottoni `#btn-gruppo-*`.

- [ ] **Step 1: Test che fallisce** (aggiungere dopo `test_strati_stanno_in_sotto_pannelli_della_barra_e_si_apre_uno_solo`)

```python
def test_desktop_barra_sinistra_a_tab_e_pannello_ancorato(apri):
    v = apri()
    v.attendi_pronto()
    v.page.set_viewport_size({"width": 1440, "height": 800})
    v.page.wait_for_timeout(300)
    b = v.js("(() => { const r = document.getElementById('barra-strati').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()")
    assert b["x"] == 0 and b["y"] == 0 and b["w"] == 44 and b["h"] == 800
    assert v.js("document.getElementById('btn-gruppo-base').classList.contains('rail-tab')")
    v.page.click("#btn-gruppo-edifici")
    p = v.js("(() => { const r = document.getElementById('pannello').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()")
    assert p["x"] == 44 and p["y"] == 0 and p["h"] == 800 and p["w"] == 380
    assert v.js("getComputedStyle(document.body).getPropertyValue('--sx').trim()") == "424px"
    v.page.click("#btn-gruppo-edifici")
    assert v.js("getComputedStyle(document.body).getPropertyValue('--sx').trim()") == "44px"
```

(La proprietà `--sx` è definita su `body`, come `--scheda-l`, quindi il test legge `body`.)

- [ ] **Step 2: Verificare che fallisce**

Run: `python -m pytest tests/test_viewer.py -k test_desktop_barra_sinistra -x -q`
Expected: FAIL (`b["w"] == 92`). Se Playwright/Chromium non è installato lo scrivere nel report: i passi 4-5 diventano verifica da parte dell'utente.

- [ ] **Step 3: Implementazione**

3a. `js/core/pannello.js`, in `bottoneGruppo` aggiungere la classe subito dopo `b.type = 'button';`:

```js
  b.className = 'rail-tab';
```

3b. `css/app.css`, in `:root` dopo `--rail-w: 44px;`:

```css
  /* ingombro a sinistra: su mobile resta il valore storico (legende a 112px); il desktop lo ridefinisce */
  --sx: 100px;
```

3c. Sostituire gli offset fissi:
- `#legende-box`: `left: 112px;` → `left: calc(var(--sx) + 12px);` e `max-width: calc(100% - 120px)` → `max-width: calc(100% - var(--sx) - 20px)`.
- `.avviso-fisso { left: 112px; }` → `.avviso-fisso { left: calc(var(--sx) + 12px); }`.
- `#strati-chip`: `left: 112px;` → `left: calc(var(--sx) + 12px);`.
- Blocco desktop ~L536-539: `#pannello { left: 112px; ... }` e `#area-ricerca { left: calc(104px + (100% - 104px - var(--scheda-l)) / 2); }` → quest'ultimo diventa `left: calc(var(--sx) + (100% - var(--sx) - var(--scheda-l)) / 2);`; la regola `#pannello` si elimina (la sostituisce il nuovo blocco).
- Regola ~L636-638: nella `clamp(...)` della ricerca `104px` → `var(--sx)`.

3d. In fondo a `css/app.css` aggiungere:

```css
/* ==========================================================================
   Barra sinistra a tab e pannello ancorato (desktop), come la barra di destra
   ========================================================================== */
@media (min-width: 721px) {
  body { --sx: var(--rail-w); }
  body:has(#pannello .sotto-pannello:not([hidden])) { --sx: calc(var(--scheda-w) + var(--rail-w)); }

  #barra-strati {
    z-index: var(--z-foglio); top: 0; left: 0; bottom: 0; width: var(--rail-w); padding: 10px 0; gap: 0; align-items: center;
    border-width: 0 1px 0 0; border-radius: 0; box-shadow: none; border-color: var(--border);
  }
  .barra-titolo { display: none; }
  #barra-gruppi { align-items: center; gap: 6px; }
  #barra-gruppi button.rail-tab {
    width: 34px; min-height: 0; padding: 10px 0; gap: 8px; border: 1px solid transparent; border-radius: var(--r-md);
    background: none; color: var(--text-muted); font-size: var(--fs-xs); font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
  }
  #barra-gruppi button.rail-tab .et { writing-mode: vertical-rl; transform: rotate(180deg); }
  #barra-gruppi button.rail-tab:hover { background: var(--surface-hover); color: var(--text); }
  #barra-gruppi button.rail-tab[aria-expanded="true"] { border-color: var(--accent); background: var(--accent-soft); color: var(--accent-strong); }
  #barra-gruppi button[data-attivo="true"]::after { top: -2px; right: -4px; }

  #pannello {
    z-index: var(--z-foglio); top: 0; bottom: 0; left: var(--rail-w); width: var(--scheda-w); max-height: none; transform: none;
    overflow-y: auto; background: var(--surface); border-right: 1px solid var(--border); box-shadow: 8px 0 28px rgba(20, 30, 60, .14);
  }
  #pannello .sotto-pannello { min-height: 100%; padding: 14px 16px; border: 0; border-radius: 0; box-shadow: none; }
  #pannello .sotto-pannello h2 { margin-bottom: 10px; font-size: var(--fs-sm); }

  #area-ricerca, #barra-strumenti, #linguetta-info { transition: left .18s ease; }
  .maplibregl-ctrl-bottom-left { left: var(--sx); }
}
```

- [ ] **Step 4: Verificare che passa**

Run: `python -m pytest tests/test_viewer.py -k "test_desktop_barra_sinistra or test_strati_stanno or test_mobile_barra" -q`
Expected: PASS. Controllare anche a vista (se c'è un browser) il gruppo `base` (miniatura) e a 390px che legende e chip non si siano mossi.

- [ ] **Step 5: Commit**

```bash
git add css/app.css js/core/pannello.js tests/test_viewer.py
git commit -m "feat(ui): barra sinistra a tab verticali e pannello ancorato, layout con --sx"
```

---

### Task 2: Comportamento: niente chiusura al clic fuori, ripiegamento incrociato sotto 1280px

**Files:**
- Modify: `js/core/pannello.js` (`costruisciPannello`: listener `pointerdown` ~L170-173; gestione apertura nel click del bottone ~L131-137)
- Test: `tests/test_viewer.py`

**Interfaces:**
- Consumes: `.rail-tab.attivo` e `#scheda`, `#rndt-pannello` (classi `collassato`, attributo `hidden`) da `js/core/rail.js`.
- Produces: `chiudiGruppi()` locale a `costruisciPannello`.

- [ ] **Step 1: Test che falliscono**

```python
def test_desktop_pannello_sinistro_non_si_chiude_con_clic_sulla_mappa(apri):
    v = apri()
    v.attendi_pronto()
    v.page.set_viewport_size({"width": 1440, "height": 800})
    v.page.click("#btn-gruppo-edifici")
    v.page.mouse.click(1000, 500)
    assert v.page.is_visible("#gruppo-edifici")
    v.page.keyboard.press("Escape")
    assert not v.page.is_visible("#gruppo-edifici")


def test_desktop_sotto_1280_aprire_un_pannello_ripiega_l_altro(apri):
    v = apri()
    v.attendi_pronto()
    v.page.set_viewport_size({"width": 1200, "height": 800})
    v.page.click("#btn-rndt")
    v.page.wait_for_selector("#rndt-pannello:not([hidden]):not(.collassato)")
    v.page.click("#btn-gruppo-edifici")
    assert v.page.is_visible("#gruppo-edifici")
    assert v.js("document.getElementById('rndt-pannello').classList.contains('collassato')")
    v.page.click("#rail-pannelli [data-pannello=rndt]")
    assert not v.page.is_visible("#gruppo-edifici")
```

- [ ] **Step 2: Verificare che falliscono**

Run: `python -m pytest tests/test_viewer.py -k "test_desktop_pannello_sinistro or test_desktop_sotto_1280" -q`
Expected: FAIL (il clic sulla mappa chiude il gruppo; il pannello RNDT non si ripiega).

- [ ] **Step 3: Implementazione**

In `js/core/pannello.js`, dentro `costruisciPannello`, subito dopo `const gruppi = [];` aggiungere:

```js
  const STRETTO = 1280; // sotto questa larghezza due pannelli da 380px non stanno insieme
  const chiudiGruppi = () => { for (const g of gruppi) { g.el.hidden = true; g.bottone.setAttribute('aria-expanded', 'false'); } };
  const ripiegaDestra = () => {
    if (window.innerWidth >= STRETTO) return;
    document.querySelector('#rail-pannelli .rail-tab.attivo')?.click();
  };
```

Nel click del bottone gruppo sostituire il ciclo `for (const g of gruppi) {...}` con `chiudiGruppi();` e, dopo `bottone.setAttribute('aria-expanded', String(apri));`, aggiungere `if (apri) ripiegaDestra();`.

Sostituire il listener finale `pointerdown` con:

```js
  // Esc ripiega il gruppo aperto; il clic sulla mappa no (come i pannelli di destra)
  document.addEventListener('keydown', e => { if (e.key === 'Escape') chiudiGruppi(); });
  // sotto STRETTO, quando a destra si apre un pannello si ripiega il gruppo a sinistra
  const aDestra = ['scheda', 'rndt-pannello'].map(id => document.getElementById(id)).filter(Boolean);
  const osservatore = new MutationObserver(() => {
    if (window.innerWidth >= STRETTO) return;
    if (aDestra.some(p => !p.hidden && !p.classList.contains('collassato'))) chiudiGruppi();
  });
  for (const p of aDestra) osservatore.observe(p, { attributes: true, attributeFilter: ['hidden', 'class'] });
```

Nota: `#rndt-pannello` si crea al primo uso. Se non esiste ancora, `aDestra` non lo contiene: in tal caso osservare `document.body` con `{ childList: true }` finché compare. Soluzione minima: usare `document.body` come target con `{ subtree: true, attributes: true, attributeFilter: ['hidden', 'class'] }` e filtrare nel callback con `document.getElementById(...)` a ogni chiamata (al posto di `aDestra`).

- [ ] **Step 4: Verificare che passano**

Run: `python -m pytest tests/test_viewer.py -k "test_desktop or test_strati_stanno or test_mobile_barra" -q` e `node --test tests/js/` (o il comando usato nel repo per la suite JS).
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/core/pannello.js tests/test_viewer.py
git commit -m "feat(ui): pannello sinistro resta aperto col clic sulla mappa, ripiegamento incrociato sotto 1280px"
```

---

### Task 3: Documenti, guida e screenshot

**Files:**
- Modify: `docs/` (cercare le sezioni sulla barra strati: `grep -rn "barra" docs/*.md`), `js/core/guida-contenuti.js` (testi dei passi che descrivono la barra a sinistra)
- Regenerate: gli screenshot della guida con `scripts/guida_screenshot_rndt.py` e gli altri script `scripts/guida_*` che mostrano la barra

- [ ] **Step 1:** Cercare con `graphify query "guida passi barra strati sinistra"` e `grep -n "barra\|strati" js/core/guida-contenuti.js` i testi che descrivono la barra a sinistra come card o «sotto-pannello a comparsa» e riscriverli: «A sinistra la barra ha un tab per gruppo; il pannello si apre accanto alla barra». Stesso per `docs/`.
- [ ] **Step 2:** Eseguire `python -m pytest tests/test_guida_requisiti.py -q` e la suite JS: i test sui contenuti guida devono restare verdi.
- [ ] **Step 3:** Rigenerare gli screenshot (se c'è un browser): `python scripts/guida_screenshot_rndt.py` e gli altri script `scripts/guida_*`; controllare a vista che i selettori usati non puntino alla vecchia card.
- [ ] **Step 4:** `graphify update .`
- [ ] **Step 5: Commit**

```bash
git add docs js/core/guida-contenuti.js media
git commit -m "docs(guida): barra sinistra a tab e pannello ancorato"
```

---

## Self-review

- Copertura spec: barra (T1), pannello (T1), layout `--sx` (T1), sinistra+destra e ≥1280 (T2), mobile invariato (T1 base `--sx:100px`, review focus), test/documenti (T1-3).
- Placeholder: nessuno; il solo ramo condizionale è la nota su `#rndt-pannello` creato al primo uso, con soluzione indicata.
- Coerenza: `chiudiGruppi`, `ripiegaDestra`, `STRETTO`, `--sx` usati con gli stessi nomi in tutti i task.
