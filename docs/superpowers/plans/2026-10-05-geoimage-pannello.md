# Geoimage nel pannello di destra Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un tab «Geoimage» nel pannello di destra (accanto a Scheda e RNDT) che sovrappone una mappa storica alla base di Palermo e la georeferenzia con i GCP, con tutte le funzioni di Geoimage, più un tab «Guida Geoimage» nel foglio Info.

**Architecture:** L'immagine è un `<img>` sopra il canvas MapLibre, portato sui 4 angoli geografici con un'omografia CSS (`matrix3d`) ricalcolata a ogni `render`; Swipe e Spotlight sono `clip-path` del suo contenitore. La logica sta in `js/geoimage/`: moduli puri (omografia, trasformazioni, geometria, storico, formati di export) testati con `node --test`, e moduli `collega*` (uno per sezione del pannello) che usano un contesto condiviso creato in `index.js`. In modalità GCP un modulo dirotta `map.fire('click')` così Scheda e strati non reagiscono.

**Tech Stack:** JS ES modules senza build, MapLibre GL (globale `maplibregl`), `node --test` (`npm run test:js`), pytest + Playwright (`tests/test_geoimage.py`, con GDAL per verificare i GeoTIFF), CSS in `css/app.css`. Librerie vendor: `proj4` 2.11.0 e `jszip` 3.10.1.

**Spec:** `docs/superpowers/specs/2026-10-05-geoimage-pannello-design.md`

## Global Constraints

- Tutto il codice nuovo sta in `DigitalTwin/`; la cartella `Geoimage` (`/mnt/d/GitHub - Clone/gbvitrano/Geoimage`) non si modifica: è solo la sorgente da cui è stata portata la logica.
- Base cartografica = quella del Twin (MapLibre, anche 3D). Niente selettore di mappa di base né geocoding di Geoimage.
- Rendering **R1**: `<img>` DOM con `matrix3d` sopra il canvas; l'immagine sta sopra tutti gli strati.
- Solo desktop (>720 px): il tab sta nella barra di destra, che su mobile non c'è.
- Testi dell'interfaccia in italiano con accenti corretti; commenti e nomi come il resto del codice (italiano).
- Colori e dimensioni solo con i token esistenti in `css/app.css` (`--accent`, `--surface`, `--border-ui`, `--r-md`, `--fs-sm`…).
- Nessuna libreria da CDN: `proj4` e `jszip` in `js/vendor/`, caricate al primo export.
- Storage con `try/catch`: se `localStorage` o IndexedDB sono bloccati o pieni l'app funziona lo stesso.
- Il formato del progetto JSON è quello di Geoimage (`version: 1`); `transformType` è un campo in più, facoltativo.
- Commit in italiano, stile `feat(geoimage): …`, terminati con la riga `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Dopo aver modificato codice: `graphify update .` (regola del progetto).

## Review Focus

Casi che la spec lascia impliciti e che un utente incontra davvero; ognuno ha il suo test nel task indicato.

- **File che non è un'immagine, illeggibile o enorme** (8000×6000 px): avviso, nessun overlay rotto; l'immagine mostrata si riduce a 4096 px sul lato lungo. → Task 6 (`dimensioniSchermo`), Task 8 (file `.txt`).
- **Mappa molto inclinata o ruotata** (pitch 50–85°, bearing): l'immagine segue in prospettiva; con angoli dietro la camera si nasconde senza errori in console. → Task 6 (`trasformazione`), Task 8 (test pitch).
- **Storage bloccato, pieno o con dati rovinati**: l'app si apre e funziona, un avviso suggerisce «Esporta JSON». → Task 13 (`archivio`, `progetto`).
- **GCP degeneri** (meno del minimo, tutti allineati, poly2 con 5 punti): nessuna eccezione, «Allinea» e gli export spenti, RMSE nascosto. → Task 2 (matematica), Task 11 (interfaccia).
- **Modalità attive e immagine cambiata** (Swipe, Spotlight o modalità GCP accesi mentre si carica un'altra immagine o si ripiega il pannello): tornano spenti, i clic sulla mappa tornano normali, le maniglie spariscono. → Task 8, Task 10, Task 11.

---

## File Structure

Nuovi, in `js/geoimage/`:

- `omografia.js`, `trasformazioni.js`, `geometria.js`, `storico.js`, `sospensione.js`, `confronto-clip.js`, `archivio.js`, `progetto.js`, `export.js`, `export-geotiff.js` — logica pura, testata con `node --test`.
- `overlay.js` — l'`<img>` sulla mappa e la sua trasformazione; `maniglie.js` — i marker di posizionamento.
- `pannello.js` — il markup del pannello; `index.js` — stato e contesto condivisi.
- `immagine.js`, `posizione.js`, `confronto.js`, `gcp.js`, `sessione.js`, `esporta.js` — un modulo `collega*` per sezione del pannello.
- `librerie.js` — carica `proj4` e `jszip`; `guida-contenuti.js`, `guida.js` — il tab «Guida Geoimage».

Nuovi altrove: `tests/js/geoimage-*.test.mjs`, `tests/test_geoimage.py`, `js/vendor/proj4.js`, `js/vendor/jszip.min.js` (+ licenze), `docs/GEOIMAGE.md`.

Modificati: `index.html` (aside del pannello), `js/app.js` (collegamento e voce del rail), `js/core/rail.js` (icona), `js/core/pannello.js` (ripiegamento sotto 1280 px), `js/core/catalogo.js` (tab della guida), `css/app.css`, `README.md`, `NOTICE.md`.

**Come lavorare:** nella cartella `/home/coseerobe/GitHub-Clone/coseerobe/DigitalTwin`. I test Python usano Chromium di Playwright (già installato) e `osgeo.gdal` (per i GeoTIFF). Base di partenza: `npm run test:js` passa tutto (386 test).

---

### Task 1: Omografia (da 4 punti schermo a `matrix3d`)

**Files:**
- Create: `js/geoimage/omografia.js`
- Test: `tests/js/geoimage-omografia.test.mjs`

**Interfaces:**
- Consumes: niente.
- Produces: `omografia(larghezza, altezza, angoli) → { A,B,C,D,E,F,G,H } | null` (angoli `[[x,y]×4]` in ordine NO, NE, SO, SE); `proietta(m, x, y) → { x, y, w }`; `davanti(m, larghezza, altezza) → boolean`; `css3d(m) → string`.

- [ ] **Step 1: Scrivi il test che fallisce**

Crea `tests/js/geoimage-omografia.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { omografia, proietta, davanti, css3d } from '../../js/geoimage/omografia.js';

const vicino = (a, b, e = 1e-6) => assert.ok(Math.abs(a - b) < e, `${a} ≠ ${b}`);
const ANGOLI_IMMAGINE = [[0, 0], [300, 0], [0, 200], [300, 200]]; // NO, NE, SO, SE

test('un rettangolo semplice è una traslazione con scala', () => {
  const m = omografia(200, 100, [[10, 20], [210, 20], [10, 120], [210, 120]]);
  const nord = proietta(m, 0, 0), sud = proietta(m, 200, 100);
  vicino(nord.x, 10); vicino(nord.y, 20);
  vicino(sud.x, 210); vicino(sud.y, 120);
});

test('un parallelogramma ruotato porta ogni angolo dell\'immagine sul suo punto', () => {
  const q = [[50, 10], [150, 40], [30, 90], [130, 120]];
  const m = omografia(300, 200, q);
  ANGOLI_IMMAGINE.forEach(([x, y], i) => { const p = proietta(m, x, y); vicino(p.x, q[i][0]); vicino(p.y, q[i][1]); });
});

test('un quadrilatero in prospettiva (mappa inclinata) porta ogni angolo sul suo punto', () => {
  const q = [[0, 0], [100, 10], [-20, 90], [130, 100]];
  const m = omografia(300, 200, q);
  ANGOLI_IMMAGINE.forEach(([x, y], i) => { const p = proietta(m, x, y); vicino(p.x, q[i][0]); vicino(p.y, q[i][1]); });
  assert.equal(davanti(m, 300, 200), true);
});

test('un quadrilatero degenere (punti coincidenti) non ha omografia', () => {
  assert.equal(omografia(10, 10, [[0, 0], [0, 0], [0, 0], [0, 0]]), null);
  assert.equal(omografia(10, 10, [[0, 0], [10, 0], [20, 0], [30, 0]]), null, 'tutti su una retta');
});

test('coordinate non finite (punto dietro la camera) non danno una matrice', () => {
  assert.equal(omografia(10, 10, [[NaN, 0], [1, 0], [0, 1], [1, 1]]), null);
});

test('css3d scrive le colonne nell\'ordine di matrix3d', () => {
  const m = { A: 2, B: 3, C: 5, D: 7, E: 11, F: 13, G: 0.1, H: 0.2 };
  assert.equal(css3d(m), 'matrix3d(2,7,0,0.1,3,11,0,0.2,0,0,1,0,5,13,0,1)');
});
```

- [ ] **Step 2: Verifica che fallisca**

Run: `node --test tests/js/geoimage-omografia.test.mjs`
Expected: FAIL con `ERR_MODULE_NOT_FOUND` (manca `js/geoimage/omografia.js`).

- [ ] **Step 3: Scrivi l'implementazione**

Crea `js/geoimage/omografia.js`:

```js
// js/geoimage/omografia.js
// Matematica pura: porta il rettangolo dell'immagine (0,0)-(larghezza,altezza) su un quadrilatero qualsiasi dello schermo
// e lo scrive come CSS matrix3d. Angoli nell'ordine NO, NE, SO, SE (come quelli di Geoimage).

// Quadrato unitario → quadrilatero (Heckbert, «Fundamentals of Texture Mapping», 1989). null se il quadrilatero è degenere.
export function omografia(larghezza, altezza, angoli) {
  const [[x0, y0], [x1, y1], [x3, y3], [x2, y2]] = angoli; // p0=NO, p1=NE, p2=SE, p3=SO
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  let g = 0, h = 0, a, b, d, e;
  if (dx3 === 0 && dy3 === 0) {
    a = x1 - x0; b = x3 - x0; d = y1 - y0; e = y3 - y0; // caso affine: colonne = lati NO→NE e NO→SO
  } else {
    const den = dx1 * dy2 - dx2 * dy1;
    if (den === 0) return null;
    g = (dx3 * dy2 - dx2 * dy3) / den;
    h = (dx1 * dy3 - dx3 * dy1) / den;
    a = x1 - x0 + g * x1; b = x3 - x0 + h * x3;
    d = y1 - y0 + g * y1; e = y3 - y0 + h * y3;
  }
  if (a * e - b * d === 0) return null; // lati paralleli o coincidenti: nessuna immagine da mostrare
  const m = { A: a / larghezza, B: b / altezza, C: x0, D: d / larghezza, E: e / altezza, F: y0, G: g / larghezza, H: h / altezza };
  return Object.values(m).every(Number.isFinite) ? m : null;
}

// Dove va a finire il punto (x, y) dell'immagine; w > 0 solo se il punto sta davanti alla camera
export function proietta(m, x, y) {
  const w = m.G * x + m.H * y + 1;
  return { x: (m.A * x + m.B * y + m.C) / w, y: (m.D * x + m.E * y + m.F) / w, w };
}

// Il quadrilatero è valido solo se i quattro angoli dell'immagine stanno davanti alla camera
export function davanti(m, larghezza, altezza) {
  return [[0, 0], [larghezza, 0], [0, altezza], [larghezza, altezza]].every(([x, y]) => proietta(m, x, y).w > 0);
}

// matrix3d è in colonne: x' = A·x + B·y + C, y' = D·x + E·y + F, w = G·x + H·y + 1
export const css3d = m => `matrix3d(${m.A},${m.D},0,${m.G},${m.B},${m.E},0,${m.H},0,0,1,0,${m.C},${m.F},0,1)`;
```

- [ ] **Step 4: Verifica che passi**

Run: `node --test tests/js/geoimage-omografia.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/geoimage/omografia.js tests/js/geoimage-omografia.test.mjs
git commit -m "feat(geoimage): omografia da 4 punti a matrix3d

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Trasformazioni dai GCP (affine, poly2, RMSE)

**Files:**
- Create: `js/geoimage/trasformazioni.js`
- Test: `tests/js/geoimage-trasformazioni.test.mjs`

**Interfaces:**
- Consumes: niente.
- Produces: `TIPI = ['poly1','poly2']`; `minimoGcp(tipo) → 3 | 6`; `calcolaAffine(gcp)`, `calcolaPoly2(gcp)`, `calcolaTrasformazione(tipo, gcp) → t | null` (affine `{a,b,c,d,e,f}`, poly2 `{order:2,cLng,cLat}`); `applica(t, px, py) → {lng, lat}`; `inversa(t, lng, lat) → {px, py} | null`; `residui(t, gcp) → number[]` (metri); `rmse(res) → number`. Un GCP è `{ px, py, lat, lng }`.

- [ ] **Step 1: Scrivi il test che fallisce**

Crea `tests/js/geoimage-trasformazioni.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { calcolaAffine, calcolaPoly2, calcolaTrasformazione, applica, inversa, residui, rmse, minimoGcp } from '../../js/geoimage/trasformazioni.js';

// una trasformazione nota, a scala di pixel realistica (immagine 3000×2000)
const veraAffine = (px, py) => ({ lng: 13.36 + 1.2e-5 * px + 3e-6 * py, lat: 38.12 - 1.1e-5 * py + 2e-6 * px });
const veraPoly2 = (px, py) => ({
  lng: 13.36 + 1.2e-5 * px + 3e-6 * py + 1e-10 * px * px - 2e-10 * px * py + 4e-11 * py * py,
  lat: 38.12 - 1.1e-5 * py + 2e-6 * px + 5e-11 * px * px + 1e-10 * py * py,
});
const gcpDa = (vera, punti) => punti.map(([px, py]) => ({ px, py, ...vera(px, py) }));

test('i minimi: 3 GCP per l\'affine, 6 per la poly2', () => {
  assert.equal(minimoGcp('poly1'), 3);
  assert.equal(minimoGcp('poly2'), 6);
});

test('affine: ritrova i coefficienti e l\'errore è zero su dati esatti', () => {
  const gcp = gcpDa(veraAffine, [[0, 0], [3000, 0], [0, 2000], [3000, 2000], [1500, 1000]]);
  const t = calcolaAffine(gcp);
  assert.ok(Math.abs(t.a - 1.2e-5) < 1e-12 && Math.abs(t.e + 1.1e-5) < 1e-12);
  assert.ok(rmse(residui(t, gcp)) < 1e-6);
});

test('affine: l\'inversa riporta alle coordinate pixel', () => {
  const gcp = gcpDa(veraAffine, [[0, 0], [3000, 0], [0, 2000]]);
  const t = calcolaAffine(gcp);
  const p = inversa(t, gcp[1].lng, gcp[1].lat);
  assert.ok(Math.abs(p.px - 3000) < 1e-4 && Math.abs(p.py) < 1e-4);
});

test('con meno GCP del minimo, o tutti allineati, non c\'è trasformazione', () => {
  assert.equal(calcolaAffine(gcpDa(veraAffine, [[0, 0], [10, 10]])), null);
  assert.equal(calcolaAffine(gcpDa(veraAffine, [[0, 0], [10, 10], [20, 20]])), null, 'collineari');
  assert.equal(calcolaPoly2(gcpDa(veraPoly2, [[0, 0], [3000, 0], [0, 2000], [3000, 2000], [1500, 1000]])), null);
});

test('poly2: errore trascurabile su dati esatti e inversa con Newton', () => {
  const gcp = gcpDa(veraPoly2, [[0, 0], [3000, 0], [0, 2000], [3000, 2000], [1500, 1000], [700, 1500], [2200, 300], [400, 300]]);
  const t = calcolaPoly2(gcp);
  assert.ok(rmse(residui(t, gcp)) < 1e-3, `rmse ${rmse(residui(t, gcp))} m`);
  const p = inversa(t, gcp[6].lng, gcp[6].lat);
  assert.ok(Math.abs(p.px - 2200) < 1e-3 && Math.abs(p.py - 300) < 1e-3);
});

test('applica ricostruisce la posizione di un punto', () => {
  const gcp = gcpDa(veraAffine, [[0, 0], [3000, 0], [0, 2000]]);
  const g = applica(calcolaTrasformazione('poly1', gcp), 1500, 1000);
  assert.ok(Math.abs(g.lng - veraAffine(1500, 1000).lng) < 1e-9);
});

test('i residui sono in metri: un GCP spostato di 0,001° in latitudine pesa circa 111 m', () => {
  const gcp = gcpDa(veraAffine, [[0, 0], [3000, 0], [0, 2000], [3000, 2000]]);
  const t = calcolaAffine(gcp);
  const spostato = gcp.map((g, i) => (i === 0 ? { ...g, lat: g.lat + 0.001 } : g));
  assert.ok(residui(t, spostato)[0] > 100 && residui(t, spostato)[0] < 120);
});
```

- [ ] **Step 2: Verifica che fallisca**

Run: `node --test tests/js/geoimage-trasformazioni.test.mjs`
Expected: FAIL con `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Scrivi l'implementazione**

Crea `js/geoimage/trasformazioni.js`:

```js
// js/geoimage/trasformazioni.js
// Georeferenziazione dai GCP: trasformazione affine (≥3 punti) o polinomiale di 2° grado (≥6), residui e RMSE.
// Un GCP è { px, py, lat, lng }: pixel dell'immagine e posizione sulla mappa. Portata da Geoimage (app.js, «Affine» e «Polynomial 2»).

export const TIPI = ['poly1', 'poly2'];
export const minimoGcp = tipo => (tipo === 'poly2' ? 6 : 3);

// Eliminazione di Gauss con pivot parziale; null se il sistema è singolare
export function risolvi(M, b) {
  const n = b.length;
  const A = M.map((riga, i) => [...riga, b[i]]);
  for (let col = 0; col < n; col++) {
    let mx = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[mx][col])) mx = r;
    [A[col], A[mx]] = [A[mx], A[col]];
    if (Math.abs(A[col][col]) < 1e-12) return null;
    for (let r = col + 1; r < n; r++) {
      const f = A[r][col] / A[col][col];
      for (let k = col; k <= n; k++) A[r][k] -= f * A[col][k];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = A[i][n];
    for (let j = i + 1; j < n; j++) x[i] -= A[i][j] * x[j];
    x[i] /= A[i][i];
  }
  return x;
}

// Minimi quadrati con le equazioni normali AᵗA·x = Aᵗb
function minimiQuadrati(A, b) {
  const n = A.length, m = A[0].length;
  const AtA = Array.from({ length: m }, () => new Array(m).fill(0));
  const Atb = new Array(m).fill(0);
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) for (let k = 0; k < n; k++) AtA[i][j] += A[k][i] * A[k][j];
    for (let k = 0; k < n; k++) Atb[i] += A[k][i] * b[k];
  }
  return risolvi(AtA, Atb);
}

// lng = a·px + b·py + c, lat = d·px + e·py + f
export function calcolaAffine(gcp) {
  if (gcp.length < 3) return null;
  const A = gcp.map(g => [g.px, g.py, 1]);
  const l = minimiQuadrati(A, gcp.map(g => g.lng));
  const t = minimiQuadrati(A, gcp.map(g => g.lat));
  if (!l || !t) return null;
  return { a: l[0], b: l[1], c: l[2], d: t[0], e: t[1], f: t[2] };
}

// lng = a0 + a1·px + a2·py + a3·px² + a4·px·py + a5·py² (idem lat)
export function calcolaPoly2(gcp) {
  if (gcp.length < 6) return null;
  const A = gcp.map(g => [1, g.px, g.py, g.px * g.px, g.px * g.py, g.py * g.py]);
  const cLng = minimiQuadrati(A, gcp.map(g => g.lng));
  const cLat = minimiQuadrati(A, gcp.map(g => g.lat));
  if (!cLng || !cLat) return null;
  return { order: 2, cLng, cLat };
}

export const calcolaTrasformazione = (tipo, gcp) => (tipo === 'poly2' ? calcolaPoly2(gcp) : calcolaAffine(gcp));

export function applica(t, px, py) {
  if (t.order === 2) {
    const v = [1, px, py, px * px, px * py, py * py];
    return { lng: t.cLng.reduce((s, c, i) => s + c * v[i], 0), lat: t.cLat.reduce((s, c, i) => s + c * v[i], 0) };
  }
  return { lng: t.a * px + t.b * py + t.c, lat: t.d * px + t.e * py + t.f };
}

function inversaAffine(t, lng, lat) {
  const det = t.a * t.e - t.b * t.d;
  if (Math.abs(det) < 1e-15) return null;
  const dl = lng - t.c, db = lat - t.f;
  return { px: (t.e * dl - t.b * db) / det, py: (-t.d * dl + t.a * db) / det };
}

// Inversa di poly2 con Newton-Raphson, partendo dalla parte lineare
function inversaPoly2(t, lng, lat) {
  const lineare = { a: t.cLng[1], b: t.cLng[2], c: t.cLng[0], d: t.cLat[1], e: t.cLat[2], f: t.cLat[0] };
  const inizio = inversaAffine(lineare, lng, lat);
  let px = inizio ? inizio.px : 0, py = inizio ? inizio.py : 0;
  for (let i = 0; i < 50; i++) {
    const g = applica(t, px, py);
    const dl = g.lng - lng, db = g.lat - lat;
    if (Math.abs(dl) < 1e-11 && Math.abs(db) < 1e-11) break;
    const J00 = t.cLng[1] + 2 * t.cLng[3] * px + t.cLng[4] * py;
    const J01 = t.cLng[2] + t.cLng[4] * px + 2 * t.cLng[5] * py;
    const J10 = t.cLat[1] + 2 * t.cLat[3] * px + t.cLat[4] * py;
    const J11 = t.cLat[2] + t.cLat[4] * px + 2 * t.cLat[5] * py;
    const det = J00 * J11 - J01 * J10;
    if (Math.abs(det) < 1e-15) break;
    px -= (J11 * dl - J01 * db) / det;
    py -= (-J10 * dl + J00 * db) / det;
  }
  return { px, py };
}

export const inversa = (t, lng, lat) => (t.order === 2 ? inversaPoly2(t, lng, lat) : inversaAffine(t, lng, lat));

// Errore di ogni GCP in metri
export function residui(t, gcp) {
  return gcp.map(g => {
    const p = applica(t, g.px, g.py);
    const dLat = (p.lat - g.lat) * 111320;
    const dLng = (p.lng - g.lng) * 111320 * Math.cos(g.lat * Math.PI / 180);
    return Math.hypot(dLat, dLng);
  });
}

export const rmse = res => Math.sqrt(res.reduce((s, r) => s + r * r, 0) / res.length);
```

- [ ] **Step 4: Verifica che passi**

Run: `node --test tests/js/geoimage-trasformazioni.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/geoimage/trasformazioni.js tests/js/geoimage-trasformazioni.test.mjs
git commit -m "feat(geoimage): trasformazione affine e poly2 dai GCP, con residui e RMSE

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Geometria dei 4 angoli

**Files:**
- Create: `js/geoimage/geometria.js`
- Test: `tests/js/geoimage-geometria.test.mjs`

**Interfaces:**
- Consumes: niente.
- Produces (angoli = `[{lat,lng}×4]` in ordine NO, NE, SO, SE): `centro(a)`, `passo(a)`, `sposta(a, dLat, dLng)`, `ruota(a, gradi)` (gradi > 0 = orario), `scala(a, fattore, ancora?)`, `scalaDaAngolo(a, i, punto)`, `postoRotazione(a)`, `geoAPixel(a, larghezza, altezza, lat, lng) → {px, py, valido}`, `limiti(a) → [[ovest,sud],[est,nord]]`, `angoliIniziali({centro,nord,sud,est,ovest}, larghezza, altezza)`.

- [ ] **Step 1: Scrivi il test che fallisce**

Crea `tests/js/geoimage-geometria.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../../js/geoimage/geometria.js';

const vicino = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} ≠ ${b}`);
// quadrato centrato all'equatore (cos lat = 1): NO, NE, SO, SE
const q = [{ lat: 1, lng: -1 }, { lat: 1, lng: 1 }, { lat: -1, lng: -1 }, { lat: -1, lng: 1 }];

test('centro e passo (5 % del lato più corto)', () => {
  const c = G.centro(q);
  vicino(c.lat, 0); vicino(c.lng, 0);
  vicino(G.passo(q), 0.1);
});

test('sposta trasla tutti gli angoli', () => {
  const s = G.sposta(q, 1, 2);
  vicino(s[0].lat, 2); vicino(s[0].lng, 1);
});

test('ruota in senso orario: 90° porta il nord-ovest sul nord-est', () => {
  const quadrato = [{ lat: 0.5, lng: -0.5 }, { lat: 0.5, lng: 0.5 }, { lat: -0.5, lng: -0.5 }, { lat: -0.5, lng: 0.5 }];
  const r = G.ruota(quadrato, 90);
  vicino(r[0].lat, 0.5, 1e-3); vicino(r[0].lng, 0.5, 1e-3);
});

test('ruotare di 360° riporta gli angoli dove erano', () => {
  const r = G.ruota(q, 360);
  q.forEach((p, i) => { vicino(r[i].lat, p.lat); vicino(r[i].lng, p.lng); });
});

test('scala ingrandisce rispetto al centro', () => {
  const s = G.scala(q, 2);
  vicino(s[1].lat, 2); vicino(s[1].lng, 2);
});

test('scalaDaAngolo tiene fermo l\'angolo opposto e non deforma', () => {
  const s = G.scalaDaAngolo(q, 0, { lat: 3, lng: -3 });
  vicino(s[3].lat, -1); vicino(s[3].lng, 1);
  vicino(s[0].lat, 3); vicino(s[0].lng, -3);
  vicino(s[1].lat, 3); vicino(s[1].lng, 1);
});

test('scalaDaAngolo con l\'angolo sull\'ancora (trascinamento degenere) non cambia nulla', () => {
  const nulla = q.map(() => ({ lat: 0, lng: 0 }));
  assert.deepEqual(G.scalaDaAngolo(nulla, 0, { lat: 1, lng: 1 }), nulla);
});

test('geoAPixel: il centro è a metà immagine, un punto lontano non è valido', () => {
  const p = G.geoAPixel(q, 200, 100, 0, 0);
  assert.equal(p.px, 100); assert.equal(p.py, 50); assert.equal(p.valido, true);
  assert.equal(G.geoAPixel(q, 200, 100, 5, 5).valido, false);
});

test('limiti in formato [[ovest, sud], [est, nord]]', () => {
  assert.deepEqual(G.limiti(q), [[-1, -1], [1, 1]]);
});

test('angoliIniziali conserva le proporzioni e sta nel 38 % della vista', () => {
  const a = G.angoliIniziali({ centro: { lat: 38, lng: 13 }, nord: 38.1, sud: 37.9, est: 13.2, ovest: 12.8 }, 200, 100);
  vicino((a[1].lng - a[0].lng) / (a[0].lat - a[2].lat), 2);
  assert.ok(a[1].lng - a[0].lng <= (13.2 - 12.8) * 0.38 + 1e-12);
});

test('postoRotazione sta oltre il lato nord', () => {
  const p = G.postoRotazione(q);
  vicino(p.lat, 1.3); vicino(p.lng, 0);
});
```

- [ ] **Step 2: Verifica che fallisca**

Run: `node --test tests/js/geoimage-geometria.test.mjs`
Expected: FAIL con `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Scrivi l'implementazione**

Crea `js/geoimage/geometria.js`:

```js
// js/geoimage/geometria.js
// Geometria dei 4 angoli dell'immagine, in gradi lat/lng, nell'ordine NO, NE, SO, SE ({ lat, lng }).
// Spostamenti, rotazione e scala di Geoimage; le distanze est-ovest si correggono con cos(lat).
const RAD = Math.PI / 180;
const cosLat = lat => Math.cos(lat * RAD);
const copia = a => a.map(p => ({ lat: p.lat, lng: p.lng }));

export const centro = a => ({
  lat: (a[0].lat + a[1].lat + a[2].lat + a[3].lat) / 4,
  lng: (a[0].lng + a[1].lng + a[2].lng + a[3].lng) / 4,
});

// Passo dei pulsanti freccia: 5 % del lato più corto
export const passo = a => Math.min(Math.abs(a[0].lat - a[2].lat), Math.abs(a[0].lng - a[1].lng)) * 0.05;

export const sposta = (a, dLat, dLng) => a.map(p => ({ lat: p.lat + dLat, lng: p.lng + dLng }));

// gradi > 0 = in senso orario
export function ruota(a, gradi) {
  const c = centro(a), k = cosLat(c.lat);
  const cos = Math.cos(gradi * RAD), sin = Math.sin(gradi * RAD);
  return a.map(p => {
    const y = p.lat - c.lat, x = (p.lng - c.lng) * k;
    return { lat: c.lat + y * cos - x * sin, lng: c.lng + (y * sin + x * cos) / k };
  });
}

export const scala = (a, fattore, ancora = centro(a)) => a.map(p => ({
  lat: ancora.lat + (p.lat - ancora.lat) * fattore,
  lng: ancora.lng + (p.lng - ancora.lng) * fattore,
}));

// Trascinando l'angolo `i` verso `punto` l'immagine si ingrandisce senza deformarsi, tenendo fermo l'angolo opposto.
// `a` sono gli angoli all'inizio del trascinamento.
export function scalaDaAngolo(a, i, punto) {
  const ancora = a[3 - i], k = cosLat(ancora.lat);
  const y0 = a[i].lat - ancora.lat, x0 = (a[i].lng - ancora.lng) * k;
  const y1 = punto.lat - ancora.lat, x1 = (punto.lng - ancora.lng) * k;
  const dot = y0 * y0 + x0 * x0;
  if (dot === 0) return copia(a);
  return scala(a, (y1 * y0 + x1 * x0) / dot, ancora);
}

// Posizione della maniglia di rotazione: oltre il lato nord, il 30 % della distanza dal centro
export function postoRotazione(a) {
  const c = centro(a);
  const lat = (a[0].lat + a[1].lat) / 2, lng = (a[0].lng + a[1].lng) / 2;
  return { lat: lat + (lat - c.lat) * 0.3, lng: lng + (lng - c.lng) * 0.3 };
}

// Da un punto della mappa al pixel dell'immagine (interpolazione bilineare risolta con Newton)
export function geoAPixel(a, larghezza, altezza, lat, lng) {
  const [NO, NE, SO, SE] = a;
  let s = 0.5, t = 0.5;
  for (let i = 0; i < 30; i++) {
    const fLat = (1 - s) * (1 - t) * NO.lat + s * (1 - t) * NE.lat + (1 - s) * t * SO.lat + s * t * SE.lat - lat;
    const fLng = (1 - s) * (1 - t) * NO.lng + s * (1 - t) * NE.lng + (1 - s) * t * SO.lng + s * t * SE.lng - lng;
    if (Math.abs(fLat) < 1e-11 && Math.abs(fLng) < 1e-11) break;
    const dLatS = -(1 - t) * NO.lat + (1 - t) * NE.lat - t * SO.lat + t * SE.lat;
    const dLatT = -(1 - s) * NO.lat - s * NE.lat + (1 - s) * SO.lat + s * SE.lat;
    const dLngS = -(1 - t) * NO.lng + (1 - t) * NE.lng - t * SO.lng + t * SE.lng;
    const dLngT = -(1 - s) * NO.lng - s * NE.lng + (1 - s) * SO.lng + s * SE.lng;
    const det = dLatS * dLngT - dLatT * dLngS;
    if (Math.abs(det) < 1e-15) break;
    s -= (fLat * dLngT - fLng * dLatT) / det;
    t -= (dLatS * fLng - dLngS * fLat) / det;
  }
  return { px: Math.round(s * larghezza), py: Math.round(t * altezza), valido: s >= -0.02 && s <= 1.02 && t >= -0.02 && t <= 1.02 };
}

// [[ovest, sud], [est, nord]] per fitBounds
export function limiti(a) {
  const lats = a.map(p => p.lat), lngs = a.map(p => p.lng);
  return [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
}

// Posizione iniziale di una nuova immagine: centrata sulla vista, nel 38 % dello spazio visibile, con le sue proporzioni
export function angoliIniziali(vista, larghezza, altezza) {
  const { centro: c, nord, sud, est, ovest } = vista;
  const spanLat = (nord - sud) * 0.38, spanLng = (est - ovest) * 0.38;
  const proporzione = larghezza / altezza;
  const dLat = proporzione > spanLng / spanLat ? spanLng / proporzione : spanLat;
  const dLng = proporzione > spanLng / spanLat ? spanLng : spanLat * proporzione;
  return [
    { lat: c.lat + dLat / 2, lng: c.lng - dLng / 2 },
    { lat: c.lat + dLat / 2, lng: c.lng + dLng / 2 },
    { lat: c.lat - dLat / 2, lng: c.lng - dLng / 2 },
    { lat: c.lat - dLat / 2, lng: c.lng + dLng / 2 },
  ];
}
```

- [ ] **Step 4: Verifica che passi**

Run: `node --test tests/js/geoimage-geometria.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/geoimage/geometria.js tests/js/geoimage-geometria.test.mjs
git commit -m "feat(geoimage): geometria dei 4 angoli (sposta, ruota, scala, geoAPixel)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Cronologia Annulla / Ripeti

**Files:**
- Create: `js/geoimage/storico.js`
- Test: `tests/js/geoimage-storico.test.mjs`

**Interfaces:**
- Produces: `creaStorico(massimo = 50) → { salva(angoli), annulla(passi = 1) → angoli | null, ripeti(passi = 1) → angoli | null, puoAnnullare(), puoRipetere(), azzera() }`.

- [ ] **Step 1: Scrivi il test che fallisce**

Crea `tests/js/geoimage-storico.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { creaStorico } from '../../js/geoimage/storico.js';

const pos = n => [{ lat: n, lng: n }, { lat: n, lng: n }, { lat: n, lng: n }, { lat: n, lng: n }];

test('annulla e ripeti ripercorrono le posizioni salvate', () => {
  const s = creaStorico();
  s.salva(pos(1)); s.salva(pos(2)); s.salva(pos(3));
  assert.equal(s.annulla()[0].lat, 2);
  assert.equal(s.annulla()[0].lat, 1);
  assert.equal(s.annulla(), null, 'al primo passo non si torna più indietro');
  assert.equal(s.ripeti()[0].lat, 2);
  assert.equal(s.ripeti(5)[0].lat, 3, 'i passi in eccesso si fermano all\'ultimo');
  assert.equal(s.ripeti(), null);
});

test('una nuova azione dopo un annulla cancella i passi da ripetere', () => {
  const s = creaStorico();
  s.salva(pos(1)); s.salva(pos(2)); s.annulla(); s.salva(pos(9));
  assert.equal(s.puoRipetere(), false);
  assert.equal(s.annulla()[0].lat, 1);
});

test('oltre il massimo scarta i passi più vecchi', () => {
  const s = creaStorico(3);
  for (let n = 1; n <= 5; n++) s.salva(pos(n));
  assert.equal(s.annulla(10)[0].lat, 3, 'restano 3, 4, 5');
  assert.equal(s.puoAnnullare(), false);
});

test('salva una copia: modificare gli angoli dopo non cambia la cronologia', () => {
  const s = creaStorico();
  const a = pos(1);
  s.salva(a); s.salva(pos(2));
  a[0].lat = 99;
  assert.equal(s.annulla()[0].lat, 1);
});

test('azzera svuota tutto', () => {
  const s = creaStorico();
  s.salva(pos(1)); s.salva(pos(2)); s.azzera();
  assert.equal(s.puoAnnullare(), false);
  assert.equal(s.puoRipetere(), false);
});
```

- [ ] **Step 2: Verifica che fallisca**

Run: `node --test tests/js/geoimage-storico.test.mjs`
Expected: FAIL con `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Scrivi l'implementazione**

Crea `js/geoimage/storico.js`:

```js
// js/geoimage/storico.js
// Cronologia delle posizioni dell'immagine per Annulla / Ripeti (fino a 50 passi, come in Geoimage).
const copia = a => a.map(p => ({ lat: p.lat, lng: p.lng }));

export function creaStorico(massimo = 50) {
  let voci = [], i = -1;
  return {
    // registra la posizione corrente; una nuova azione cancella i passi «ripeti»
    salva(angoli) {
      voci = voci.slice(0, i + 1);
      voci.push(copia(angoli));
      if (voci.length > massimo) voci.shift();
      i = voci.length - 1;
    },
    // restituiscono gli angoli da applicare, o null se non c'è nulla da fare
    annulla(passi = 1) {
      if (i <= 0) return null;
      i = Math.max(0, i - passi);
      return copia(voci[i]);
    },
    ripeti(passi = 1) {
      if (i >= voci.length - 1) return null;
      i = Math.min(voci.length - 1, i + passi);
      return copia(voci[i]);
    },
    puoAnnullare: () => i > 0,
    puoRipetere: () => i < voci.length - 1,
    azzera() { voci = []; i = -1; },
  };
}
```

- [ ] **Step 4: Verifica che passi**

Run: `node --test tests/js/geoimage-storico.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/geoimage/storico.js tests/js/geoimage-storico.test.mjs
git commit -m "feat(geoimage): cronologia Annulla/Ripeti degli angoli

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Sospensione dei clic e ritagli di Swipe/Spotlight

**Files:**
- Create: `js/geoimage/sospensione.js`, `js/geoimage/confronto-clip.js`
- Test: `tests/js/geoimage-sospensione.test.mjs`, `tests/js/geoimage-confronto-clip.test.mjs`

**Interfaces:**
- Produces: `creaSospensione(map) → { attiva(fn), disattiva() }` (rimpiazza `map.fire` sull'istanza: con un gestore attivo i `click` vanno solo a `fn(evento)`); `clipSwipe(percentuale) → string`; `clipSpotlight({ x, y, raggio, invertito, larghezza, altezza }) → string`.

- [ ] **Step 1: Scrivi i test che falliscono**

Crea `tests/js/geoimage-sospensione.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { creaSospensione } from '../../js/geoimage/sospensione.js';

const mappaFinta = () => {
  const visti = [];
  return { visti, fire(evento) { visti.push(typeof evento === 'string' ? evento : evento.type); return this; } };
};

test('senza sospensione tutti gli eventi arrivano agli altri', () => {
  const m = mappaFinta();
  creaSospensione(m);
  m.fire('click'); m.fire({ type: 'move' });
  assert.deepEqual(m.visti, ['click', 'move']);
});

test('con la sospensione il clic va solo al gestore, il resto passa', () => {
  const m = mappaFinta();
  const s = creaSospensione(m);
  const dentro = [];
  s.attiva(e => dentro.push(e.type));
  m.fire({ type: 'click' }); m.fire({ type: 'move' });
  assert.deepEqual(dentro, ['click']);
  assert.deepEqual(m.visti, ['move']);
});

test('dopo disattiva i clic tornano a tutti', () => {
  const m = mappaFinta();
  const s = creaSospensione(m);
  s.attiva(() => {});
  s.disattiva();
  m.fire('click');
  assert.deepEqual(m.visti, ['click']);
});

test('fire restituisce la mappa, come l\'originale', () => {
  const m = mappaFinta();
  creaSospensione(m).attiva(() => {});
  assert.equal(m.fire({ type: 'click' }), m);
});
```

Crea `tests/js/geoimage-confronto-clip.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { clipSwipe, clipSpotlight } from '../../js/geoimage/confronto-clip.js';

test('swipe: a metà taglia il 50 % di destra', () => {
  assert.equal(clipSwipe(50), 'inset(0 50% 0 0)');
  assert.equal(clipSwipe(98), 'inset(0 2% 0 0)');
});

test('spotlight normale: rettangolo meno cerchio, regola evenodd', () => {
  const c = clipSpotlight({ x: 100, y: 80, raggio: 20, invertito: false, larghezza: 800, altezza: 600 });
  assert.match(c, /^path\(evenodd, "M0 0 H800 V600 H0 Z /);
  assert.match(c, /M100 80 m-20 0 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0"\)$/);
});

test('spotlight invertito: solo il cerchio', () => {
  assert.equal(clipSpotlight({ x: 10, y: 20, raggio: 30, invertito: true, larghezza: 1, altezza: 1 }), 'circle(30px at 10px 20px)');
});
```

- [ ] **Step 2: Verifica che falliscano**

Run: `node --test tests/js/geoimage-sospensione.test.mjs tests/js/geoimage-confronto-clip.test.mjs`
Expected: FAIL con `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Scrivi le implementazioni**

Crea `js/geoimage/sospensione.js`:

```js
// js/geoimage/sospensione.js
// Mentre si aggiungono i GCP il clic sulla mappa non deve aprire la Scheda né attivare gli altri strati (ognuno ha il suo
// map.on('click')). MapLibre consegna ogni evento con map.fire(): in modalità GCP i clic vanno solo al gestore dei GCP.
export function creaSospensione(map) {
  const originale = map.fire.bind(map);
  let gestore = null;
  map.fire = function (evento, dati) {
    const tipo = typeof evento === 'string' ? evento : evento?.type;
    if (gestore && tipo === 'click') {
      gestore(evento);
      return map;
    }
    return originale(evento, dati);
  };
  return {
    attiva(fn) { gestore = fn; },
    disattiva() { gestore = null; },
  };
}
```

Crea `js/geoimage/confronto-clip.js`:

```js
// js/geoimage/confronto-clip.js
// I ritagli CSS di Swipe e Spotlight: stringhe pure, applicate al contenitore dell'immagine (vedi confronto.js).

// Swipe: l'immagine si vede a sinistra della linea; `percentuale` è la posizione della linea (0-100)
export const clipSwipe = percentuale => `inset(0 ${100 - percentuale}% 0 0)`;

// Spotlight: di norma un foro rotondo nell'immagine (si vede la mappa di base); invertito, l'immagine si vede solo nel cerchio.
// `larghezza` e `altezza` sono quelle della mappa: servono al rettangolo da cui si toglie il cerchio.
export function clipSpotlight({ x, y, raggio, invertito, larghezza, altezza }) {
  if (invertito) return `circle(${raggio}px at ${x}px ${y}px)`;
  const R = raggio * 2;
  return `path(evenodd, "M0 0 H${larghezza} V${altezza} H0 Z M${x} ${y} m${-raggio} 0 a${raggio} ${raggio} 0 1 0 ${R} 0 a${raggio} ${raggio} 0 1 0 ${-R} 0")`;
}
```

- [ ] **Step 4: Verifica che passino**

Run: `node --test tests/js/geoimage-sospensione.test.mjs tests/js/geoimage-confronto-clip.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/geoimage/sospensione.js js/geoimage/confronto-clip.js tests/js/geoimage-sospensione.test.mjs tests/js/geoimage-confronto-clip.test.mjs
git commit -m "feat(geoimage): sospensione dei clic in modalità GCP e ritagli di Swipe/Spotlight

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---
### Task 6: L'immagine sulla mappa (overlay con `matrix3d`)

**Files:**
- Create: `js/geoimage/overlay.js`
- Test: `tests/js/geoimage-overlay.test.mjs`

**Interfaces:**
- Consumes: `omografia`, `css3d`, `davanti` (Task 1).
- Produces: `LATO_MASSIMO = 4096`; `dimensioniSchermo(larghezza, altezza, massimo?) → { larghezza, altezza, ridotta }`; `trasformazione(map, angoli, larghezza, altezza) → string | null`; `preparaSchermo(dataUrl) → Promise<{ src, larghezza, altezza, originaleL, originaleA }>`; `creaOverlay(map) → { contenitore, mostra(schermo, angoli), angoli(a), opacita(v), nascondi() }`.

- [ ] **Step 1: Scrivi il test che fallisce**

Crea `tests/js/geoimage-overlay.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { trasformazione, dimensioniSchermo, LATO_MASSIMO } from '../../js/geoimage/overlay.js';
import { proietta } from '../../js/geoimage/omografia.js';

// mappa finta: 1° = 1000 px, nord in alto
const mappa = (f = ([lng, lat]) => ({ x: (lng - 13) * 1000, y: (38 - lat) * 1000 })) => ({ project: f });
const angoli = [{ lat: 38, lng: 13 }, { lat: 38, lng: 13.2 }, { lat: 37.9, lng: 13 }, { lat: 37.9, lng: 13.2 }]; // 200×100 px sullo schermo

const leggiMatrice = css => {
  const n = css.slice(css.indexOf('(') + 1, -1).split(',').map(Number);
  return { A: n[0], D: n[1], G: n[3], B: n[4], E: n[5], H: n[7], C: n[12], F: n[13] };
};

test('trasformazione porta gli angoli dell\'immagine sui punti proiettati dalla mappa', () => {
  const css = trasformazione(mappa(), angoli, 400, 200);
  assert.match(css, /^matrix3d\(/);
  const m = leggiMatrice(css);
  const se = proietta(m, 400, 200);
  assert.ok(Math.abs(se.x - 200) < 1e-6 && Math.abs(se.y - 100) < 1e-6);
  const no = proietta(m, 0, 0);
  assert.ok(Math.abs(no.x) < 1e-6 && Math.abs(no.y) < 1e-6);
});

test('punti non finiti o quadrilatero degenere: nessuna trasformazione', () => {
  assert.equal(trasformazione(mappa(() => ({ x: NaN, y: 0 })), angoli, 400, 200), null);
  assert.equal(trasformazione(mappa(() => ({ x: 5, y: 5 })), angoli, 400, 200), null);
});

test('mappa molto inclinata con un angolo dietro la camera: nessuna trasformazione', () => {
  // la proiezione finta ribalta l'angolo SE oltre il punto di fuga (w negativo)
  const dietro = ([lng, lat]) => ({ x: (lng - 13) * 1000, y: (38 - lat) * 1000 * (lng > 13.1 && lat < 37.95 ? -3 : 1) });
  assert.equal(trasformazione(mappa(dietro), angoli, 400, 200), null);
});

test('dimensioniSchermo: sotto il massimo non tocca, sopra riduce mantenendo le proporzioni', () => {
  assert.deepEqual(dimensioniSchermo(1000, 500), { larghezza: 1000, altezza: 500, ridotta: false });
  const g = dimensioniSchermo(8192, 6144);
  assert.equal(g.ridotta, true);
  assert.equal(g.larghezza, LATO_MASSIMO);
  assert.equal(g.altezza, 3072);
});
```

- [ ] **Step 2: Verifica che fallisca**

Run: `node --test tests/js/geoimage-overlay.test.mjs`
Expected: FAIL con `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Scrivi l'implementazione**

Crea `js/geoimage/overlay.js`:

```js
// js/geoimage/overlay.js
// L'immagine storica sulla mappa: un <img> sopra il canvas, portato sui 4 angoli proiettati con un'omografia CSS (matrix3d).
// A ogni render della mappa (pan, zoom, rotazione, inclinazione) si riproiettano gli angoli, quindi segue anche il 3D.
// Sta sopra tutti gli strati: è un confronto con la base, e Swipe e Spotlight sono ritagli CSS del contenitore.
import { omografia, css3d, davanti } from './omografia.js';

// Lato lungo massimo dell'immagine mostrata: oltre, un matrix3d su un'immagine enorme appesantisce la mappa.
// L'originale resta in memoria per l'export.
export const LATO_MASSIMO = 4096;

export function dimensioniSchermo(larghezza, altezza, massimo = LATO_MASSIMO) {
  const lungo = Math.max(larghezza, altezza);
  if (lungo <= massimo) return { larghezza, altezza, ridotta: false };
  const f = massimo / lungo;
  return { larghezza: Math.round(larghezza * f), altezza: Math.round(altezza * f), ridotta: true };
}

// CSS che porta l'immagine (larghezza×altezza) sui 4 angoli geografici; null se non si può disegnare
// (punti non finiti, quadrilatero degenere o angoli dietro la camera con la mappa molto inclinata)
export function trasformazione(map, angoli, larghezza, altezza) {
  const p = angoli.map(a => { const q = map.project([a.lng, a.lat]); return [q.x, q.y]; });
  if (!p.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))) return null;
  const m = omografia(larghezza, altezza, p);
  return m && davanti(m, larghezza, altezza) ? css3d(m) : null;
}

// Legge il file come immagine e, se serve, ne prepara una versione ridotta per lo schermo.
// → { src, larghezza, altezza (mostrate), originaleL, originaleA }
export function preparaSchermo(dataUrl) {
  return new Promise((ok, ko) => {
    const img = new Image();
    img.onerror = () => ko(new Error('immagine non leggibile'));
    img.onload = () => {
      const originaleL = img.naturalWidth, originaleA = img.naturalHeight;
      if (!originaleL || !originaleA) return ko(new Error('immagine vuota'));
      const d = dimensioniSchermo(originaleL, originaleA);
      if (!d.ridotta) return ok({ src: dataUrl, larghezza: originaleL, altezza: originaleA, originaleL, originaleA });
      const cv = Object.assign(document.createElement('canvas'), { width: d.larghezza, height: d.altezza });
      cv.getContext('2d').drawImage(img, 0, 0, d.larghezza, d.altezza);
      ok({ src: cv.toDataURL('image/jpeg', 0.92), larghezza: d.larghezza, altezza: d.altezza, originaleL, originaleA });
    };
    img.src = dataUrl;
  });
}

export function creaOverlay(map) {
  const contenitore = document.createElement('div');
  contenitore.className = 'gi-overlay';
  contenitore.hidden = true;
  const img = document.createElement('img');
  img.className = 'gi-immagine';
  img.alt = '';
  img.draggable = false;
  contenitore.append(img);
  map.getCanvasContainer().append(contenitore);

  let corrente = null; // { angoli, larghezza, altezza } dell'immagine mostrata
  const ridisegna = () => {
    if (!corrente) return;
    const t = trasformazione(map, corrente.angoli, corrente.larghezza, corrente.altezza);
    img.style.transform = t ?? 'none';
    img.style.visibility = t ? 'visible' : 'hidden';
  };
  map.on('render', ridisegna);

  return {
    contenitore,
    mostra(schermo, angoli) {
      img.style.width = `${schermo.larghezza}px`;
      img.style.height = `${schermo.altezza}px`;
      img.src = schermo.src;
      corrente = { angoli, larghezza: schermo.larghezza, altezza: schermo.altezza };
      contenitore.hidden = false;
      ridisegna();
    },
    angoli(angoli) {
      if (!corrente) return;
      corrente.angoli = angoli;
      ridisegna();
    },
    // l'opacità sta sul contenitore, così il ritaglio di Swipe e Spotlight resta indipendente
    opacita(valore) { contenitore.style.opacity = String(valore); },
    nascondi() {
      corrente = null;
      contenitore.hidden = true;
      contenitore.style.clipPath = '';
      img.removeAttribute('src');
    },
  };
}
```

- [ ] **Step 4: Verifica che passi**

Run: `node --test tests/js/geoimage-overlay.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/geoimage/overlay.js tests/js/geoimage-overlay.test.mjs
git commit -m "feat(geoimage): overlay dell'immagine sopra il canvas con omografia CSS

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Maniglie di posizionamento

**Files:**
- Create: `js/geoimage/maniglie.js`

**Interfaces:**
- Consumes: `centro`, `sposta`, `ruota`, `scalaDaAngolo`, `postoRotazione` (Task 3); la variabile globale `maplibregl`.
- Produces: `creaManiglie(map, { leggi, scrivi, alFine }) → { mostra(), nascondi(), aggiorna(), ricostruisci(), modo(), cambiaModo('scala'|'deforma'), bloccate(), blocca(bool) }`. `leggi()` dà gli angoli correnti (o `null`), `scrivi(angoli)` li applica durante il trascinamento, `alFine()` segna la fine di un gesto.

Il file è un'unità DOM + MapLibre senza logica pura da isolare: si prova nel browser al Task 8.

- [ ] **Step 1: Scrivi il modulo**

Crea `js/geoimage/maniglie.js`:

```js
// js/geoimage/maniglie.js
// Maniglie per posizionare l'immagine direttamente sulla mappa, come in Geoimage ma con i marker di MapLibre:
//   centro → sposta · punto sopra il lato nord → ruota · angoli → scala (proporzionale) o deforma (libera).
// Non conoscono l'overlay: leggono e scrivono i 4 angoli tramite `leggi`, `scrivi` e `alFine`, che le collegano allo stato.
import { centro, sposta, ruota, scalaDaAngolo, postoRotazione } from './geometria.js';

const copia = a => a.map(p => ({ lat: p.lat, lng: p.lng }));
const lngLat = p => [p.lng, p.lat];
const crea = classe => Object.assign(document.createElement('div'), { className: `gi-maniglia ${classe}` });
// angolo in gradi, orario a partire dal nord, di un punto dello schermo visto da `c`
const rotta = (c, p) => Math.atan2(p.x - c.x, -(p.y - c.y)) * 180 / Math.PI;
const normalizza = g => ((g + 540) % 360) - 180;

export function creaManiglie(map, { leggi, scrivi, alFine }) {
  let modo = 'scala'; // 'scala' | 'deforma'
  let attive = false; // il pannello è aperto
  let bloccate = false;
  let marcatori = [];

  function nuovo(elemento, punto) {
    // il clic su una maniglia non deve arrivare alla mappa (aprirebbe la Scheda)
    elemento.addEventListener('click', e => e.stopPropagation());
    const k = new maplibregl.Marker({ element: elemento, draggable: true }).setLngLat(lngLat(punto)).addTo(map);
    marcatori.push(k);
    return k;
  }

  function costruisci() {
    const a = leggi();
    // angoli
    a.forEach((p, i) => {
      const k = nuovo(crea(modo === 'scala' ? 'gi-angolo gi-scala' : 'gi-angolo gi-deforma'), p);
      let inizio = null;
      k.on('dragstart', () => { inizio = copia(leggi()); });
      k.on('drag', () => {
        if (!inizio) return;
        const { lat, lng } = k.getLngLat();
        scrivi(modo === 'scala' ? scalaDaAngolo(inizio, i, { lat, lng }) : inizio.map((q, j) => (j === i ? { lat, lng } : q)));
        riposiziona(k);
      });
      k.on('dragend', () => { inizio = null; riposiziona(); alFine(); });
    });
    // centro: sposta
    const kc = nuovo(Object.assign(crea('gi-centro'), { title: 'Trascina per spostare l\'immagine' }), centro(a));
    let base = null, da = null;
    // MapLibre emette dragstart dopo il primo movimento: il punto di partenza è dove stava la maniglia, non dove si trova ora
    kc.on('dragstart', () => { base = copia(leggi()); da = centro(base); });
    kc.on('drag', () => {
      if (!base) return;
      const q = kc.getLngLat();
      scrivi(sposta(base, q.lat - da.lat, q.lng - da.lng));
      riposiziona(kc);
    });
    kc.on('dragend', () => { base = null; riposiziona(); alFine(); });
    // rotazione: l'angolo si misura sullo schermo, quindi funziona anche con la mappa ruotata o inclinata
    const kr = nuovo(Object.assign(crea('gi-rota'), { title: 'Trascina per ruotare l\'immagine' }), postoRotazione(a));
    let inizioRot = null, cs = null, a0 = 0;
    kr.on('dragstart', () => {
      inizioRot = copia(leggi());
      const c = centro(inizioRot);
      cs = map.project(lngLat(c));
      a0 = rotta(cs, map.project(lngLat(postoRotazione(inizioRot))));
    });
    kr.on('drag', () => {
      if (!inizioRot) return;
      scrivi(ruota(inizioRot, normalizza(rotta(cs, map.project(kr.getLngLat())) - a0)));
      riposiziona(kr);
    });
    kr.on('dragend', () => { inizioRot = null; riposiziona(); alFine(); });
  }

  // le maniglie seguono gli angoli; quella che si sta trascinando resta sotto il puntatore
  function riposiziona(tranne = null) {
    const a = leggi();
    if (!a || marcatori.length !== 6) return;
    const [k0, k1, k2, k3, kc, kr] = marcatori;
    [k0, k1, k2, k3].forEach((k, i) => { if (k !== tranne) k.setLngLat(lngLat(a[i])); });
    if (kc !== tranne) kc.setLngLat(lngLat(centro(a)));
    if (kr !== tranne) kr.setLngLat(lngLat(postoRotazione(a)));
  }

  function rimuovi() {
    marcatori.forEach(k => k.remove());
    marcatori = [];
  }

  function ricostruisci() {
    rimuovi();
    if (attive && !bloccate && leggi()) costruisci();
  }

  return {
    mostra() { attive = true; ricostruisci(); },
    nascondi() { attive = false; rimuovi(); },
    aggiorna: () => riposiziona(),
    ricostruisci,
    modo: () => modo,
    cambiaModo(nuovoModo) { modo = nuovoModo; ricostruisci(); },
    bloccate: () => bloccate,
    blocca(valore) { bloccate = valore; ricostruisci(); },
  };
}
```

Note che servono a chi lo mantiene:
- MapLibre emette `dragstart` **dopo** il primo movimento: per questo il centro parte da `centro(base)` e la rotazione dalla posizione `postoRotazione` originale, non da `getLngLat()`. Con `getLngLat()` il primo spostamento (qualche pixel) andrebbe perso.
- Il clic su una maniglia ferma la propagazione (`stopPropagation`), altrimenti arriverebbe alla mappa e aprirebbe la Scheda.
- Il pan della mappa non parte: `Marker` draggable chiama `preventDefault` sull'evento `mousedown` della mappa.

- [ ] **Step 2: Controllo di sintassi**

Run: `node --check js/geoimage/maniglie.js`
Expected: nessun output (la prova funzionale è nel Task 8).

- [ ] **Step 3: Commit**

```bash
git add js/geoimage/maniglie.js
git commit -m "feat(geoimage): maniglie MapLibre per spostare, ruotare, scalare e deformare

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Il tab Geoimage e il caricamento dell'immagine (punto di controllo)

Collega tutto in modo minimo ma reale: il tab nella barra di destra, il pannello con le sue sezioni, il caricamento di un'immagine, l'overlay e le maniglie. Alla fine di questo task si **verifica a occhio e con i test** che overlay e maniglie sono fluidi: è la parte che, se non funzionasse bene, farebbe cambiare strada.

**Files:**
- Create: `js/geoimage/pannello.js`, `js/geoimage/index.js`, `js/geoimage/immagine.js`
- Modify: `index.html`, `js/app.js`, `js/core/rail.js`, `js/core/pannello.js`, `css/app.css`
- Test: `tests/test_geoimage.py`

**Interfaces:**
- Consumes: `creaOverlay`, `preparaSchermo` (Task 6); `creaManiglie` (Task 7); `creaStorico` (Task 4); `creaSospensione` (Task 5); `angoliIniziali`, `limiti` (Task 3); `segnala` da `js/core/pannello.js`.
- Produces: `collegaGeoimage(map, elemento) → { stato, apri(), chiudi(), ripristina() }`. Il **contesto** `ctx` che usano i moduli dei task seguenti:
  - `ctx.map`, `ctx.stato` = `{ immagine, schermo, angoli, angoliIniziali, opacita, tipo, gcp }`, `ctx.overlay`, `ctx.storico`, `ctx.sospensione`, `ctx.maniglie`, `ctx.aperto()`.
  - `ctx.$(id)` → `#gi-<id>` nel pannello; `ctx.avvisa(testo)` (avviso sulla mappa); `ctx.messaggio(testo)` (riga di stato del pannello).
  - Eventi: `ctx.sulCambio(fn)`, `ctx.sulCaricamento(fn(origine))` con origine `'file' | 'progetto' | 'ripristino' | 'rimossa'`, `ctx.suVisibilita(fn(aperto))`, `ctx.sulTasto(fn(evento) → true se gestito)`; `ctx.cambiato()` li fa scattare.
  - Azioni: `ctx.impostaAngoli(a)`, `ctx.conferma()` (fine gesto: entra nella cronologia), `ctx.inquadra(angoli, maxZoom?)`, `ctx.caricaImmagine(immagine, schermo, angoli, opzioni)`, `ctx.rimuoviImmagine()`.
  - Gli id nel pannello (`#gi-zona`, `#gi-file`, `#gi-opacita`, `#gi-swipe`, `#gi-gcp-modo`, `#gi-kmz`…) sono tutti creati da `pannello.js` in questo task.

- [ ] **Step 1: Scrivi i test che falliscono**

Crea `tests/test_geoimage.py` con le funzioni di appoggio e i primi test:

```python
"""Geoimage nel pannello di destra: tab, caricamento dell'immagine, maniglie, GCP, confronto, persistenza ed export."""
import struct
import zlib

import pytest


def _png(larghezza=400, altezza=300):
    """PNG RGB con un gradiente, valido (CRC corretti)."""
    def blocco(tipo, dati):
        return struct.pack(">I", len(dati)) + tipo + dati + struct.pack(">I", zlib.crc32(tipo + dati) & 0xFFFFFFFF)

    righe = b"".join(
        b"\x00" + b"".join(bytes((x * 255 // larghezza, y * 255 // altezza, 128)) for x in range(larghezza))
        for y in range(altezza)
    )
    ihdr = struct.pack(">IIBBBBB", larghezza, altezza, 8, 2, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + blocco(b"IHDR", ihdr) + blocco(b"IDAT", zlib.compress(righe)) + blocco(b"IEND", b"")


def _apri_geoimage(v):
    v.attendi_pronto()
    v.page.set_viewport_size({"width": 1440, "height": 800})
    v.page.click("#rail-pannelli [data-pannello=geoimage]")
    v.page.wait_for_selector("#geoimage-pannello:not([hidden]):not(.collassato)")


def _carica(v, nome="storica.png"):
    v.page.set_input_files("#gi-file", files=[{"name": nome, "mimeType": "image/png", "buffer": _png()}])
    v.page.wait_for_selector(".gi-overlay:not([hidden]) .gi-immagine[src]")
    v.page.wait_for_selector(".gi-angolo")
    v.page.wait_for_function("!window.dt.map.isMoving()")  # la mappa ha finito di inquadrare l'immagine


def _angoli(v):
    """Centri delle 4 maniglie angolari sullo schermo: NO, NE, SO, SE."""
    return v.js("""[...document.querySelectorAll('.gi-angolo')].map(e => { const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })""")


def _punto(angoli, u, w):
    (nx, ny), (ex, ey), (sx, sy) = angoli[0], angoli[1], angoli[2]
    return nx + u * (ex - nx) + w * (sx - nx), ny + u * (ey - ny) + w * (sy - ny)


def test_il_tab_geoimage_apre_il_pannello_e_ripiega_gli_altri(apri):
    v = apri()
    v.attendi_pronto()
    v.page.set_viewport_size({"width": 1440, "height": 800})
    assert v.page.is_visible("#rail-pannelli [data-pannello=geoimage]")
    v.page.click("#rail-pannelli [data-pannello=geoimage]")
    assert v.page.is_visible("#geoimage-pannello")
    assert v.page.is_visible("#gi-zona")
    assert not v.page.is_visible("#gi-swipe"), "le sezioni di confronto compaiono solo con un'immagine"
    v.js("document.getElementById('btn-rndt').click()")
    v.page.wait_for_selector("#rndt-pannello:not([hidden]):not(.collassato)", timeout=15000)
    assert v.js("document.getElementById('geoimage-pannello').classList.contains('collassato')")
    assert not any("geoimage" in e.lower() for e in v.errori), v.errori


def test_caricare_un_immagine_la_mostra_con_le_maniglie(apri):
    v = apri()
    _apri_geoimage(v)
    _carica(v)
    assert v.js("document.querySelector('.gi-immagine').style.transform").startswith("matrix3d(")
    assert v.page.locator(".gi-maniglia").count() == 6  # 4 angoli, centro, rotazione
    assert v.page.is_visible("#gi-swipe")
    assert v.page.inner_text("#gi-info") == "400×300 px"
    v.js("(() => { const r = document.getElementById('gi-opacita'); r.value = 30; r.dispatchEvent(new Event('input')); })()")
    assert v.js("document.querySelector('.gi-overlay').style.opacity") == "0.3"
    assert not any("geoimage" in e.lower() for e in v.errori), v.errori


def test_pannello_ripiegato_toglie_le_maniglie_e_riaperto_le_rimette(apri):
    v = apri()
    _apri_geoimage(v)
    _carica(v)
    v.page.click("#rail-pannelli [data-pannello=geoimage]")  # ripiega
    assert v.page.locator(".gi-maniglia").count() == 0
    assert v.page.is_visible(".gi-overlay"), "l'immagine resta sulla mappa"
    v.page.click("#rail-pannelli [data-pannello=geoimage]")
    assert v.page.locator(".gi-maniglia").count() == 6


def test_file_non_immagine_si_rifiuta_con_un_avviso(apri):
    v = apri()
    _apri_geoimage(v)
    v.page.set_input_files("#gi-file", files=[{"name": "note.txt", "mimeType": "text/plain", "buffer": b"ciao"}])
    v.page.wait_for_selector("#avvisi", state="attached")
    v.page.wait_for_timeout(300)
    assert not v.page.is_visible(".gi-overlay")
    assert "immagine" in v.page.inner_text("#avvisi").lower()


def test_con_la_mappa_inclinata_e_ruotata_l_immagine_segue_in_prospettiva(apri):
    v = apri()
    _apri_geoimage(v)
    _carica(v)
    v.js("window.dt.map.jumpTo({ pitch: 50, bearing: 20 })")
    v.page.wait_for_function("document.querySelector('.gi-immagine').style.transform.startsWith('matrix3d(')")
    m = v.js("document.querySelector('.gi-immagine').style.transform.slice(9, -1).split(',').map(Number)")
    assert abs(m[3]) > 0 or abs(m[7]) > 0, "con il pitch la matrice ha una componente prospettica"
    assert not any("geoimage" in e.lower() or "matrix" in e.lower() for e in v.errori), v.errori
```

- [ ] **Step 2: Verifica che falliscano**

Run: `python3 -m pytest tests/test_geoimage.py -x -q`
Expected: FAIL (`#rail-pannelli [data-pannello=geoimage]` non esiste).

- [ ] **Step 3: Il markup del pannello**

Crea `js/geoimage/pannello.js`:

```js
// js/geoimage/pannello.js
// Il pannello Geoimage nella barra di destra: solo il markup, nell'ordine delle sezioni di Geoimage.
// Il comportamento sta nei moduli collega* (immagine, posizione, confronto, gcp, sessione, esporta); gli elementi si
// ritrovano per id (`#gi-<nome>`). Le sezioni con data-richiede="immagine" compaiono dopo aver caricato un'immagine.
const el = (tag, classe, testo) => {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
};

function bottone(id, testo, titolo, classe = '') {
  const b = el('button', `gi-btn ${classe}`.trim(), testo);
  b.type = 'button';
  b.id = `gi-${id}`;
  if (titolo) { b.title = titolo; b.setAttribute('aria-label', titolo); }
  return b;
}

const campo = (id, tipo, attributi = {}) => Object.assign(el('input'), { type: tipo, id: `gi-${id}`, ...attributi });
const riga = (...figli) => { const r = el('div', 'gi-riga'); r.append(...figli); return r; };
const nota = testo => el('p', 'gi-nota', testo);
const valore = (id, testo) => Object.assign(el('span', 'gi-valore', testo), { id: `gi-${id}` });

function intervallo(testo, id, min, max, iniziale, unita = '') {
  const l = el('label', 'gi-campo', testo);
  l.append(campo(id, 'range', { min, max, value: iniziale }), valore(`${id}-val`, `${iniziale}${unita}`));
  return l;
}

function selezione(id, titolo, opzioni) {
  const s = Object.assign(el('select'), { id: `gi-${id}` });
  s.setAttribute('aria-label', titolo);
  for (const [v, testo] of opzioni) s.append(Object.assign(el('option', null, testo), { value: v }));
  return s;
}

function sezione(titolo, figli, richiedeImmagine = true) {
  const s = el('section', 'gi-sezione');
  if (richiedeImmagine) { s.dataset.richiede = 'immagine'; s.hidden = true; }
  s.append(el('h3', null, titolo), ...figli);
  return s;
}

function sezioneImmagine() {
  const zona = bottone('zona', '', 'Carica una mappa storica', 'gi-zona');
  zona.append(el('strong', null, 'Carica mappa storica'), el('span', null, 'JPG · PNG · WEBP · BMP — oppure trascina qui'));
  const rimuovi = bottone('rimuovi', 'Rimuovi immagine', 'Toglie l\'immagine dalla mappa', 'gi-pericolo');
  rimuovi.hidden = true;
  return [
    sezione('Immagine storica', [zona, campo('file', 'file', { accept: 'image/*', hidden: true }), Object.assign(el('p', 'gi-info'), { id: 'gi-info' }), rimuovi], false),
    sezione('Opacità', [intervallo('Opacità', 'opacita', 0, 100, 70, '%')]),
  ];
}

function sezioneConfronto() {
  const swipe = bottone('swipe', 'Swipe', 'Linea scorrevole: a sinistra l\'immagine, a destra la mappa di base');
  const spotlight = bottone('spotlight', 'Spotlight', 'Cerchio che scopre la mappa di base sotto l\'immagine');
  const inverti = bottone('inverti', '⇄', 'Inverti lo Spotlight: l\'immagine si vede solo nel cerchio');
  [swipe, spotlight, inverti].forEach(b => b.setAttribute('aria-pressed', 'false'));
  return sezione('Confronto visivo', [riga(swipe, spotlight, inverti), intervallo('Raggio', 'raggio', 80, 600, 250)]);
}

function sezionePosizione() {
  const vuoto = () => el('span');
  const frecce = el('div', 'gi-frecce');
  frecce.append(
    vuoto(), bottone('su', '↑', 'Sposta su'), vuoto(),
    bottone('sinistra', '←', 'Sposta a sinistra'), bottone('adatta', '⌖', 'Zoom sull\'immagine'), bottone('destra', '→', 'Sposta a destra'),
    vuoto(), bottone('giu', '↓', 'Sposta giù'), vuoto(),
  );
  const blocca = bottone('blocca', 'Blocca (L)', 'Blocca o sblocca le maniglie');
  blocca.setAttribute('aria-pressed', 'false');
  return sezione('Posiziona overlay', [
    nota('Trascina le maniglie sulla mappa: il centro sposta, il punto in alto ruota, gli angoli scalano o deformano.'),
    frecce,
    riga(bottone('ruota-sx', '⟲ 5°', 'Ruota di 5° a sinistra'), bottone('ruota-dx', '⟳ 5°', 'Ruota di 5° a destra'), bottone('meno', '− 10%', 'Rimpicciolisci del 10%'), bottone('piu', '+ 10%', 'Ingrandisci del 10%')),
    riga(bottone('modo', 'Maniglie: scala', 'Cambia il comportamento degli angoli: scala proporzionale o deformazione libera'), blocca),
    riga(bottone('annulla', 'Annulla', 'Annulla (Ctrl+Z). Maiusc+clic: 10 passi'), bottone('ripeti', 'Ripeti', 'Ripeti (Ctrl+Y). Maiusc+clic: 10 passi'), bottone('reset', 'Reset', 'Riporta l\'immagine alla posizione iniziale', 'gi-pericolo')),
  ]);
}

function sezioneGcp() {
  const modo = bottone('gcp-modo', 'Aggiungi GCP (G)', 'Aggiungi un punto di controllo: un clic sull\'immagine, uno sulla mappa');
  modo.setAttribute('aria-pressed', 'false');
  const anteprima = Object.assign(el('div', 'gi-anteprima'), { id: 'gi-anteprima-box', hidden: true });
  anteprima.append(Object.assign(el('canvas'), { id: 'gi-anteprima' }), nota('Passo 1: clicca sull\'immagine sulla mappa · Passo 2: clicca la posizione reale sulla mappa'));
  const tabella = el('table', 'gi-tabella');
  const testata = el('tr');
  for (const t of ['#', 'Lat', 'Lon', 'Px', 'Py', 'Res (m)', '']) testata.append(el('th', null, t));
  const thead = el('thead');
  thead.append(testata);
  tabella.append(thead, Object.assign(el('tbody'), { id: 'gi-gcp-corpo' }));
  const rmse = Object.assign(el('p', 'gi-info'), { id: 'gi-rmse', hidden: true });
  rmse.append('RMSE: ', Object.assign(el('strong', null, '—'), { id: 'gi-rmse-val' }), ' m');
  const tipo = el('label', 'gi-campo', 'Trasformazione');
  tipo.append(selezione('tipo', 'Tipo di trasformazione', [['poly1', 'Affine (≥3 GCP)'], ['poly2', 'Polinomiale 2 (≥6 GCP)']]));
  const scorri = el('div', 'gi-scorri');
  scorri.append(tabella);
  const allinea = Object.assign(bottone('allinea', 'Allinea immagine ai GCP', 'Sposta l\'immagine nelle coordinate calcolate dai GCP', 'gi-primario'), { disabled: true });
  const svuota = Object.assign(bottone('gcp-svuota', 'Cancella tutti i GCP', 'Rimuove tutti i punti di controllo', 'gi-pericolo'), { disabled: true });
  return sezione('Ground Control Points', [modo, anteprima, Object.assign(el('p', 'gi-info', 'Nessun GCP inserito'), { id: 'gi-gcp-conteggio' }), scorri, rmse, tipo, allinea, svuota]);
}

function sezioneExport() {
  const kmz = bottone('kmz', 'KMZ', 'Per Google Earth, QGIS, ArcGIS: immagine incorporata', 'gi-primario');
  const geotiff = bottone('geotiff', 'GeoTIFF', 'Raster georeferenziato per QGIS, ArcGIS, GDAL', 'gi-primario');
  const qgis = bottone('qgis', 'GCP per QGIS (.points)', 'File dei GCP per il Georeferenziatore di QGIS', 'gi-primario');
  const mondo = bottone('mondo', 'World file', 'World file affine (richiede almeno 3 GCP)');
  const geojson = bottone('geojson', 'GCP GeoJSON', 'I punti di controllo in GeoJSON');
  const esporta = bottone('json-esporta', 'Esporta JSON', 'Salva immagine, posizione e GCP in un file');
  [kmz, geotiff, qgis, mondo, geojson, esporta].forEach(b => { b.disabled = true; });
  const gtiff = Object.assign(el('fieldset', 'gi-gtiff'), { id: 'gi-gtiff', hidden: true });
  const gruppo = (testo, controllo, id) => { const l = el('label', 'gi-campo gi-campo-colonna', testo); l.append(controllo); if (id) l.id = id; return l; };
  gtiff.append(
    el('legend', null, 'Impostazioni GeoTIFF'),
    gruppo('Sistema di riferimento', selezione('gtiff-sr', 'Sistema di riferimento', [['4326', 'EPSG:4326 — WGS 84'], ['32632', 'EPSG:32632 — UTM 32N'], ['32633', 'EPSG:32633 — UTM 33N'], ['3857', 'EPSG:3857 — Web Mercator']])),
    gruppo('Ricampionamento', selezione('gtiff-ricamp', 'Metodo di ricampionamento', [['bilinear', 'Bilineare (2×2)'], ['nearest', 'Vicino più prossimo']]), 'gi-gtiff-ricamp-gruppo'),
    gruppo('Risoluzione massima (lato lungo)', selezione('gtiff-max', 'Risoluzione massima', [['2000', '2000 px'], ['4000', '4000 px'], ['8000', '8000 px']])),
    gruppo('Compressione', selezione('gtiff-compr', 'Compressione', [['5', 'LZW (consigliata)'], ['1', 'Nessuna']])),
    Object.assign(nota(''), { id: 'gi-gtiff-nota' }),
    riga(bottone('gtiff-annulla', 'Annulla', 'Chiudi le impostazioni'), bottone('gtiff-vai', 'Esporta GeoTIFF', 'Crea il file GeoTIFF', 'gi-primario')),
  );
  gtiff.querySelector('#gi-gtiff-max').value = '4000';
  const importa = bottone('json-importa', 'Importa JSON', 'Apre un progetto salvato (anche quelli di Geoimage)');
  const mapwarper = Object.assign(el('a', 'gi-btn gi-link', 'MapWarper ↗'), { href: 'https://mapwarper.net/', target: '_blank', rel: 'noopener', title: 'Per georeferenziazioni più precise usa mapwarper.net' });
  return sezione('Export', [riga(kmz, geotiff), qgis, riga(mondo, geojson), gtiff, riga(esporta, importa), campo('json-file', 'file', { accept: '.json,application/json', hidden: true }), mapwarper], false);
}

export function creaPannello(elemento) {
  const testata = el('header', 'gi-testata');
  testata.append(el('h2', null, 'Geoimage · mappe storiche'));
  const autore = el('p', 'gi-autore', 'Georeferenzia una mappa storica sulla base di Palermo. Da ');
  const link = Object.assign(el('a', null, 'Geoimage'), { href: 'https://github.com/gbvitrano/Geoimage', target: '_blank', rel: 'noopener' });
  autore.append(link, ' di @gbvitrano.');
  const stato = Object.assign(el('p', 'gi-stato', 'Carica un\'immagine storica per iniziare.'), { id: 'gi-stato' });
  stato.setAttribute('role', 'status');
  const corpo = el('div', 'gi-corpo');
  corpo.append(...sezioneImmagine(), sezioneConfronto(), sezionePosizione(), sezioneGcp(), sezioneExport());
  elemento.replaceChildren(testata, autore, stato, corpo);
}
```

- [ ] **Step 4: Il modulo dell'immagine**

Crea `js/geoimage/immagine.js`:

```js
// js/geoimage/immagine.js
// Sezione «Immagine storica»: scelta o trascinamento del file, informazioni, rimozione e opacità.
import { preparaSchermo } from './overlay.js';
import { angoliIniziali } from './geometria.js';

const leggiFile = file => new Promise((ok, ko) => {
  const r = new FileReader();
  r.onload = () => ok(r.result);
  r.onerror = () => ko(new Error('file non leggibile'));
  r.readAsDataURL(file);
});

export function collegaImmagine(ctx) {
  const { $, map, stato } = ctx;

  async function carica(file) {
    if (!file?.type.startsWith('image/')) return ctx.avvisa('Geoimage: scegli un file immagine (JPG, PNG, WEBP o BMP).');
    try {
      const dataUrl = await leggiFile(file);
      const schermo = await preparaSchermo(dataUrl);
      const immagine = { dataUrl, nome: file.name, larghezza: schermo.originaleL, altezza: schermo.originaleA };
      const b = map.getBounds();
      const c = map.getCenter();
      const angoli = angoliIniziali({ centro: { lat: c.lat, lng: c.lng }, nord: b.getNorth(), sud: b.getSouth(), est: b.getEast(), ovest: b.getWest() }, immagine.larghezza, immagine.altezza);
      ctx.caricaImmagine(immagine, schermo, angoli);
      ctx.inquadra(angoli);
      ctx.messaggio('Immagine caricata. Posizionala con le maniglie sulla mappa, poi aggiungi i GCP (tasto G).');
    } catch (errore) {
      ctx.avvisa(`Geoimage: non carico «${file.name}»: ${errore.message}`);
    }
  }

  const zona = $('zona');
  zona.addEventListener('click', () => $('file').click());
  $('file').addEventListener('change', e => { carica(e.target.files[0]); e.target.value = ''; });
  zona.addEventListener('dragover', e => { e.preventDefault(); zona.classList.add('trascina'); });
  zona.addEventListener('dragleave', () => zona.classList.remove('trascina'));
  zona.addEventListener('drop', e => { e.preventDefault(); zona.classList.remove('trascina'); carica(e.dataTransfer.files[0]); });
  $('rimuovi').addEventListener('click', () => { ctx.rimuoviImmagine(); ctx.messaggio('Immagine rimossa.'); });

  $('opacita').addEventListener('input', () => {
    stato.opacita = Number($('opacita').value) / 100;
    ctx.overlay.opacita(stato.opacita);
    $('opacita-val').textContent = `${$('opacita').value}%`;
    ctx.cambiato();
  });

  ctx.sulCaricamento(() => {
    const c = !!stato.immagine;
    zona.classList.toggle('ha-immagine', c);
    zona.querySelector('strong').textContent = c ? stato.immagine.nome : 'Carica mappa storica';
    $('info').textContent = c ? `${stato.immagine.larghezza}×${stato.immagine.altezza} px` : '';
    $('rimuovi').hidden = !c;
    const pct = Math.round(stato.opacita * 100);
    $('opacita').value = String(pct);
    $('opacita-val').textContent = `${pct}%`;
  });
}
```

- [ ] **Step 5: Il contesto condiviso**

Crea `js/geoimage/index.js` (in questo task solo `collegaImmagine` è collegato: gli altri moduli arrivano nei task seguenti, ognuno con la sua riga):

```js
// js/geoimage/index.js
// Geoimage nel pannello di destra: georeferenzia una mappa storica (o qualsiasi immagine) sulla base di Palermo.
// Qui nasce lo stato condiviso e il «contesto» che i moduli collega* usano; ogni modulo gestisce una sezione del pannello.
import { creaPannello } from './pannello.js';
import { creaOverlay } from './overlay.js';
import { creaManiglie } from './maniglie.js';
import { creaStorico } from './storico.js';
import { creaSospensione } from './sospensione.js';
import { collegaImmagine } from './immagine.js';
import { limiti } from './geometria.js';
import { segnala } from '../core/pannello.js';

const copia = a => a.map(p => ({ lat: p.lat, lng: p.lng }));

export function collegaGeoimage(map, elemento) {
  creaPannello(elemento);
  // immagine = { dataUrl, nome, larghezza, altezza } originale; schermo = quella mostrata (vedi overlay.js);
  // angoli = [NO, NE, SO, SE] in gradi; gcp = [{ px, py, lat, lng }]; tipo = 'poly1' | 'poly2'
  const stato = { immagine: null, schermo: null, angoli: null, angoliIniziali: null, opacita: 0.7, tipo: 'poly1', gcp: [] };
  const overlay = creaOverlay(map);
  const storico = creaStorico();
  const sospensione = creaSospensione(map);
  const ascoltatori = { cambio: [], caricamento: [], visibilita: [], tasto: [] };
  const aperto = () => !elemento.hidden && !elemento.classList.contains('collassato');

  const ctx = {
    map, stato, overlay, storico, sospensione, aperto,
    $: id => elemento.querySelector(`#gi-${id}`),
    avvisa: segnala, // avvisi che restano visibili sulla mappa
    messaggio: testo => { elemento.querySelector('#gi-stato').textContent = testo; },
    sulCambio: fn => ascoltatori.cambio.push(fn),
    sulCaricamento: fn => ascoltatori.caricamento.push(fn), // fn(origine): 'file' | 'progetto' | 'ripristino' | 'rimossa'
    suVisibilita: fn => ascoltatori.visibilita.push(fn),
    sulTasto: fn => ascoltatori.tasto.push(fn), // fn(evento) → true se ha gestito il tasto
    cambiato: () => ascoltatori.cambio.forEach(fn => fn()),
    // il pannello copre la destra della mappa e la ricerca il basso: l'immagine si inquadra nella parte rimasta visibile
    inquadra(angoli, maxZoom = 16) {
      const r = elemento.getBoundingClientRect();
      const destra = aperto() ? window.innerWidth - r.left : 44;
      map.fitBounds(limiti(angoli), { padding: { top: 40, bottom: 80, left: 60, right: destra + 20 }, maxZoom });
    },
    impostaAngoli(angoli) { stato.angoli = angoli; overlay.angoli(angoli); ctx.maniglie.aggiorna(); },
    conferma() { storico.salva(stato.angoli); ctx.cambiato(); }, // fine di un gesto: entra nella cronologia
    caricaImmagine(immagine, schermo, angoli, { gcp = [], opacita = stato.opacita, tipo = stato.tipo, iniziali = angoli, origine = 'file' } = {}) {
      Object.assign(stato, { immagine, schermo, angoli: copia(angoli), angoliIniziali: copia(iniziali), gcp: gcp.map(g => ({ ...g })), opacita, tipo });
      overlay.mostra(schermo, stato.angoli);
      overlay.opacita(opacita);
      storico.azzera();
      storico.salva(stato.angoli);
      ctx.maniglie.ricostruisci();
      ascoltatori.caricamento.forEach(fn => fn(origine));
      ctx.cambiato();
    },
    rimuoviImmagine() {
      Object.assign(stato, { immagine: null, schermo: null, angoli: null, angoliIniziali: null, gcp: [] });
      overlay.nascondi();
      storico.azzera();
      ctx.maniglie.ricostruisci();
      ascoltatori.caricamento.forEach(fn => fn('rimossa'));
      ctx.cambiato();
    },
  };
  ctx.maniglie = creaManiglie(map, { leggi: () => stato.angoli, scrivi: a => ctx.impostaAngoli(a), alFine: () => ctx.conferma() });

  // le sezioni che hanno senso solo con un'immagine compaiono e spariscono con lei
  ctx.sulCambio(() => elemento.querySelectorAll('[data-richiede="immagine"]').forEach(s => { s.hidden = !stato.immagine; }));

  // le maniglie si vedono solo a pannello aperto e non ripiegato
  new MutationObserver(() => {
    const on = aperto();
    if (on) ctx.maniglie.mostra(); else ctx.maniglie.nascondi();
    ascoltatori.visibilita.forEach(fn => fn(on));
  }).observe(elemento, { attributes: true, attributeFilter: ['hidden', 'class'] });

  // scorciatoie: solo a pannello aperto e fuori dai campi di testo, per non toccare quelle del resto dell'app
  document.addEventListener('keydown', e => {
    if (!aperto() || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName) || e.target.isContentEditable) return;
    for (const fn of ascoltatori.tasto) if (fn(e) === true) { e.preventDefault(); break; }
  });

  collegaImmagine(ctx);
  ctx.cambiato(); // stato iniziale dei pulsanti

  return {
    stato, // sola lettura: lo usano i test del browser
    apri() { elemento.hidden = false; },
    chiudi() { elemento.hidden = true; },
    async ripristina() {}, // la memoria tra le sessioni arriva con il Task 13
  };
}
```

- [ ] **Step 6: Il pannello in `index.html`**

In `index.html`, dopo la riga di `#rndt-pannello`:

```html
<aside id="rndt-pannello" hidden aria-label="Catalogo RNDT"></aside>
```

aggiungi:

```html
<aside id="geoimage-pannello" hidden aria-label="Geoimage: mappe storiche"></aside>
```

- [ ] **Step 7: Il tab nella barra di destra**

In `js/core/rail.js` aggiungi l'icona in `ICONE` (prima di `};`):

```js
  geoimage: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m21 16-5-5-9 9"/></svg>',
```

In `js/app.js`, tra gli import:

```js
import { creaGruppoRndt } from './rndt/gruppo.js';
import { collegaGeoimage } from './geoimage/index.js';
```

e dove si crea il rail, sostituisci:

```js
  const rail = collegaRail(document.getElementById('rail-pannelli'), [
    { id: 'scheda', etichetta: 'Scheda', pannello: document.getElementById('scheda') },
    { id: 'rndt', etichetta: 'RNDT', pannello: document.getElementById('rndt-pannello'), apri: rndt.apri, chiudi: rndt.chiudi },
  ]);
```

con:

```js
  const geoimage = collegaGeoimage(map, document.getElementById('geoimage-pannello'));
  const rail = collegaRail(document.getElementById('rail-pannelli'), [
    { id: 'scheda', etichetta: 'Scheda', pannello: document.getElementById('scheda') },
    { id: 'rndt', etichetta: 'RNDT', pannello: document.getElementById('rndt-pannello'), apri: rndt.apri, chiudi: rndt.chiudi },
    { id: 'geoimage', etichetta: 'Geoimage', pannello: document.getElementById('geoimage-pannello'), apri: geoimage.apri, chiudi: geoimage.chiudi },
  ]);
```

e dopo la riga `rndt.ripristina(); …` aggiungi (la seconda riga serve ai test del browser, che leggono lo stato):

```js
  geoimage.ripristina(); // e la mappa storica di Geoimage, se c'era
  window.dt.geoimage = geoimage;
```

In `js/core/pannello.js` (cerca `['scheda', 'rndt-pannello']`, circa riga 477) il pannello conta tra quelli che ripiegano la barra sinistra sotto 1280 px:

```js
    const aperto = ['scheda', 'rndt-pannello', 'geoimage-pannello'].some(id => { const p = document.getElementById(id); return p && !p.hidden && !p.classList.contains('collassato'); });
```

- [ ] **Step 8: Gli stili**

In `css/app.css`, riga ~433, aggiungi il nuovo pannello alla regola che sposta la mappa:

```css
  body:has(#scheda:not([hidden]):not(.collassato), #rndt-pannello:not([hidden]):not(.collassato), #geoimage-pannello:not([hidden]):not(.collassato)) { --scheda-l: calc(var(--scheda-w) + var(--rail-w)); }
```

e alla riga ~879:

```css
#scheda.collassato, #rndt-pannello.collassato, #geoimage-pannello.collassato { display: none; }
```

In fondo a `css/app.css` aggiungi:

```css
/* ==========================================================================
   Geoimage: mappa storica sulla base, pannello a destra (come RNDT)
   ========================================================================== */
#geoimage-pannello { position: fixed; z-index: var(--z-foglio); left: 0; right: 0; bottom: 0; top: 8vh; display: flex; flex-direction: column; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-sm) var(--r-sm) 0 0; box-shadow: var(--ombra); overflow: hidden; }
#geoimage-pannello[hidden] { display: none; }
@media (min-width: 721px) { #geoimage-pannello { top: 0; left: auto; right: var(--rail-w); width: var(--scheda-w); border-radius: 0; } }
.gi-testata { flex: none; padding: 10px 12px 0; }
.gi-testata h2 { margin: 0; font-size: var(--fs-md); font-weight: 700; }
.gi-autore { flex: none; margin: 0; padding: 4px 12px 8px; font-size: var(--fs-sm); color: var(--text-muted); border-bottom: 1px solid var(--border); }
.gi-autore a { color: inherit; font-weight: 600; }
.gi-stato { flex: none; margin: 0; padding: 6px 12px; font-size: var(--fs-sm); background: var(--accent-soft); border-bottom: 1px solid var(--border); }
.gi-corpo { flex: 1; min-height: 0; overflow-y: auto; padding: 4px 12px 16px; }
.gi-sezione { padding: 10px 0; border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 8px; }
.gi-sezione[hidden] { display: none; }
.gi-sezione h3 { margin: 0; font-size: var(--fs-sm); font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--text-muted); }
.gi-riga { display: flex; flex-wrap: wrap; gap: 6px; }
.gi-riga > .gi-btn { flex: 1 1 0; }
.gi-nota, .gi-info { margin: 0; font-size: var(--fs-sm); color: var(--text-muted); }
.gi-info:empty { display: none; }
.gi-btn { display: inline-flex; align-items: center; justify-content: center; gap: 4px; min-height: 32px; padding: 4px 10px; border: 1px solid var(--border-ui); border-radius: var(--r-pill); background: var(--surface); color: var(--text); font: inherit; font-size: var(--fs-sm); cursor: pointer; text-decoration: none; transition: background .12s, border-color .12s; }
.gi-btn:hover:not(:disabled) { border-color: var(--accent); background: var(--accent-soft); }
.gi-btn:disabled { opacity: .45; cursor: default; }
.gi-btn[aria-pressed="true"] { border-color: var(--accent); background: var(--accent-soft); color: var(--accent-strong); font-weight: 700; }
.gi-btn:focus-visible, .gi-campo input:focus-visible, .gi-campo select:focus-visible { outline: 2px solid var(--focus); outline-offset: 1px; }
.gi-primario { border-color: var(--accent); background: var(--accent); color: var(--accent-ink); font-weight: 700; }
.gi-primario:hover:not(:disabled) { background: var(--accent); filter: brightness(.96); }
.gi-pericolo { color: #b42318; }
.gi-zona { flex-direction: column; gap: 2px; padding: 16px 10px; width: 100%; border: 2px dashed var(--border-ui); border-radius: var(--r-md); }
.gi-zona span { font-size: var(--fs-xs); color: var(--text-muted); }
.gi-zona.trascina, .gi-zona.ha-immagine { border-color: var(--accent); background: var(--accent-soft); }
.gi-campo { display: flex; align-items: center; gap: 8px; font-size: var(--fs-sm); }
.gi-campo input[type="range"] { flex: 1; min-width: 0; accent-color: var(--accent); }
.gi-campo select { flex: 1; min-width: 0; min-height: 32px; padding: 2px 6px; border: 1px solid var(--border-ui); border-radius: var(--r-sm); background: var(--surface); color: inherit; font: inherit; }
.gi-campo-colonna { flex-direction: column; align-items: stretch; gap: 2px; }
.gi-valore { min-width: 3ch; text-align: right; font-variant-numeric: tabular-nums; color: var(--text-muted); }
.gi-frecce { display: grid; grid-template-columns: repeat(3, 40px); gap: 4px; justify-content: center; }
.gi-frecce .gi-btn { padding: 0; }
.gi-anteprima canvas { display: block; width: 100%; height: auto; border: 1px solid var(--border-ui); border-radius: var(--r-sm); }
.gi-scorri { max-height: 180px; overflow: auto; }
.gi-tabella { width: 100%; border-collapse: collapse; font-size: var(--fs-xs); font-variant-numeric: tabular-nums; }
.gi-tabella th, .gi-tabella td { padding: 3px 4px; text-align: right; border-bottom: 1px solid var(--border); white-space: nowrap; }
.gi-tabella th { position: sticky; top: 0; background: var(--surface-alt); color: var(--text-muted); }
.gi-res-buono td:nth-child(6) { color: #166534; }
.gi-res-medio td:nth-child(6) { color: #9a3412; }
.gi-res-alto td:nth-child(6) { color: #b42318; font-weight: 700; }
.gi-x { min-height: 22px; padding: 0 6px; }
.gi-gtiff { display: flex; flex-direction: column; gap: 8px; margin: 0; padding: 8px 10px 10px; border: 1px solid var(--border-ui); border-radius: var(--r-md); }
.gi-gtiff[hidden] { display: none; }
.gi-gtiff legend { padding: 0 4px; font-size: var(--fs-sm); font-weight: 700; }
.gi-spento { opacity: .4; pointer-events: none; }

/* sulla mappa: immagine, maniglie, linea dello Swipe, cerchio dello Spotlight, GCP */
.gi-overlay { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.gi-overlay[hidden] { display: none; }
.gi-immagine { position: absolute; left: 0; top: 0; max-width: none; transform-origin: 0 0; user-select: none; }
.gi-maniglia { box-sizing: border-box; cursor: grab; }
.gi-maniglia:active { cursor: grabbing; }
.gi-centro { width: 28px; height: 28px; border-radius: 50%; background: var(--accent); border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0, 0, 0, .4); }
.gi-centro::before { content: "✥"; display: flex; align-items: center; justify-content: center; height: 100%; color: var(--accent-ink); font-size: 16px; line-height: 1; }
.gi-rota { width: 22px; height: 22px; border-radius: 50%; background: #fff; border: 2px solid var(--accent); box-shadow: 0 1px 4px rgba(0, 0, 0, .4); }
.gi-rota::before { content: "⟳"; display: flex; align-items: center; justify-content: center; height: 100%; color: var(--accent-strong); font-size: 14px; line-height: 1; }
.gi-scala { width: 16px; height: 16px; background: var(--accent); border: 2px solid #fff; border-radius: 3px; box-shadow: 0 1px 4px rgba(0, 0, 0, .4); }
.gi-deforma { width: 14px; height: 14px; background: #2f5fc7; border: 2px solid #fff; transform: rotate(45deg); box-shadow: 0 1px 4px rgba(0, 0, 0, .4); }
.gi-divisore { position: absolute; top: 0; bottom: 0; width: 0; z-index: 1; border-left: 2px solid #fff; box-shadow: 0 0 0 1px rgba(0, 0, 0, .35); pointer-events: none; }
.gi-divisore[hidden] { display: none; }
.gi-divisore-maniglia { position: absolute; top: 50%; left: -16px; width: 32px; height: 32px; margin-top: -16px; padding: 0; border: 2px solid #fff; border-radius: 50%; background: var(--accent); color: var(--accent-ink); font: inherit; font-weight: 700; cursor: ew-resize; pointer-events: auto; touch-action: none; box-shadow: 0 1px 4px rgba(0, 0, 0, .4); }
.gi-cerchio { position: absolute; z-index: 1; transform: translate(-50%, -50%); border: 2px solid var(--accent); border-radius: 50%; pointer-events: none; box-shadow: 0 0 0 1px rgba(0, 0, 0, .3); }
.gi-cerchio[hidden] { display: none; }
.gi-gcp { display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; border: 2px solid #fff; background: #ef4444; color: #fff; font-size: 11px; font-weight: 700; box-shadow: 0 1px 4px rgba(0, 0, 0, .45); cursor: grab; }
.gi-gcp-attesa { background: rgba(245, 158, 11, .9); pointer-events: none; }
```

- [ ] **Step 9: Verifica che i test passino**

Run: `python3 -m pytest tests/test_geoimage.py -x -q`
Expected: PASS.

- [ ] **Step 10: Punto di controllo: provalo a mano**

Avvia il server (`python3 scripts/serve.py 8000`, poi `http://127.0.0.1:8000/index.html`), apri il tab «Geoimage» a destra e carica una mappa storica (o una foto qualsiasi). Controlla:

1. L'immagine compare al centro, si inquadra a sinistra del pannello, e le sue **4 maniglie angolari, il cerchio centrale e quello di rotazione** sono visibili.
2. Trascina il **centro**: l'immagine segue il puntatore senza ritardo né salti. Trascina un **angolo** (qui scala in proporzione; la deformazione libera si attiva col pulsante del Task 9). Trascina il cerchio di **rotazione**.
3. Muovi, zooma, ruota (tasto destro + trascina) e inclina la mappa: l'immagine resta attaccata al terreno.
4. Ripiega il tab Geoimage: le maniglie spariscono, l'immagine resta; riaprilo: tornano.

**Se overlay o maniglie non sono fluidi o corretti, fermati qui** e discuti con l'utente: le alternative, già emerse in fase di progetto, sono sistemare, ripiegare su un `<iframe>` con Geoimage originale (con la sua mappa, quindi senza la base del Twin) oppure rinunciare alla deformazione libera a 4 angoli.

- [ ] **Step 11: Commit**

```bash
git add js/geoimage/pannello.js js/geoimage/index.js js/geoimage/immagine.js index.html js/app.js js/core/rail.js js/core/pannello.js css/app.css tests/test_geoimage.py
git commit -m "feat(geoimage): tab nel pannello di destra, caricamento dell'immagine, overlay e maniglie

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Posizionamento preciso, Annulla/Ripeti, Reset, blocco, scala/deforma

**Files:**
- Create: `js/geoimage/posizione.js`
- Modify: `js/geoimage/index.js`
- Test: `tests/test_geoimage.py`

**Interfaces:**
- Consumes: `sposta`, `ruota`, `scala`, `passo` (Task 3); `ctx` (Task 8): `stato`, `storico`, `maniglie`, `impostaAngoli`, `conferma`, `inquadra`, `sulTasto`, `sulCambio`, `messaggio`.
- Produces: `collegaPosizione(ctx)`.

- [ ] **Step 1: Scrivi il test che fallisce**

Aggiungi in fondo a `tests/test_geoimage.py`:

```python


def test_trascinare_il_centro_sposta_l_immagine(apri):
    v = apri()
    _apri_geoimage(v)
    _carica(v)
    prima = _angoli(v)
    cx, cy = v.js("(() => { const r = document.querySelector('.gi-centro').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()")
    v.page.mouse.move(cx, cy)
    v.page.mouse.down()
    v.page.mouse.move(cx + 60, cy + 40, steps=8)
    v.page.mouse.up()
    dopo = _angoli(v)
    assert abs((dopo[0][0] - prima[0][0]) - 60) < 3 and abs((dopo[0][1] - prima[0][1]) - 40) < 3
    assert v.js("!document.getElementById('gi-annulla').disabled")
    v.page.click("#gi-annulla")
    tornato = _angoli(v)
    assert abs(tornato[0][0] - prima[0][0]) < 2
```

- [ ] **Step 2: Verifica che fallisca**

Run: `python3 -m pytest tests/test_geoimage.py -x -q -k centro`
Expected: FAIL (`#gi-annulla` resta disabilitato: nessuno ascolta ancora i pulsanti).

- [ ] **Step 3: Scrivi l'implementazione**

Crea `js/geoimage/posizione.js`:

```js
// js/geoimage/posizione.js
// Sezione «Posiziona overlay»: frecce, rotazione, scala, adatta, reset, blocco delle maniglie, scala/deforma, Annulla e Ripeti.
import { sposta, ruota, scala, passo } from './geometria.js';

const copia = a => a.map(p => ({ lat: p.lat, lng: p.lng }));

export function collegaPosizione(ctx) {
  const { $, stato, storico, maniglie } = ctx;
  const cambia = f => { if (!stato.angoli) return; ctx.impostaAngoli(f(stato.angoli)); ctx.conferma(); };

  $('su').addEventListener('click', () => cambia(a => sposta(a, passo(a), 0)));
  $('giu').addEventListener('click', () => cambia(a => sposta(a, -passo(a), 0)));
  $('sinistra').addEventListener('click', () => cambia(a => sposta(a, 0, -passo(a))));
  $('destra').addEventListener('click', () => cambia(a => sposta(a, 0, passo(a))));
  $('ruota-sx').addEventListener('click', () => cambia(a => ruota(a, -5)));
  $('ruota-dx').addEventListener('click', () => cambia(a => ruota(a, 5)));
  $('meno').addEventListener('click', () => cambia(a => scala(a, 0.9)));
  $('piu').addEventListener('click', () => cambia(a => scala(a, 1.1)));
  $('adatta').addEventListener('click', () => { if (stato.angoli) ctx.inquadra(stato.angoli, 17); });
  $('reset').addEventListener('click', () => {
    if (!stato.angoliIniziali) return;
    cambia(() => copia(stato.angoliIniziali));
    ctx.inquadra(stato.angoli);
    ctx.messaggio('Immagine riportata alla posizione iniziale.');
  });

  $('blocca').addEventListener('click', () => { maniglie.blocca(!maniglie.bloccate()); ctx.cambiato(); });
  $('modo').addEventListener('click', () => { maniglie.cambiaModo(maniglie.modo() === 'scala' ? 'deforma' : 'scala'); ctx.cambiato(); });

  const torna = angoli => { if (!angoli) return; ctx.impostaAngoli(angoli); ctx.cambiato(); };
  const annulla = passi => torna(storico.annulla(passi));
  const ripeti = passi => torna(storico.ripeti(passi));
  $('annulla').addEventListener('click', e => annulla(e.shiftKey ? 10 : 1));
  $('ripeti').addEventListener('click', e => ripeti(e.shiftKey ? 10 : 1));

  ctx.sulTasto(e => {
    const tasto = e.key.toLowerCase();
    if (e.ctrlKey && tasto === 'z') { annulla(e.shiftKey ? 10 : 1); return true; }
    if (e.ctrlKey && tasto === 'y') { ripeti(e.shiftKey ? 10 : 1); return true; }
    if (!e.ctrlKey && !e.metaKey && tasto === 'l' && stato.immagine) { $('blocca').click(); return true; }
    return false;
  });

  ctx.sulCambio(() => {
    $('annulla').disabled = !storico.puoAnnullare();
    $('ripeti').disabled = !storico.puoRipetere();
    const bloccate = maniglie.bloccate();
    $('blocca').textContent = bloccate ? 'Sblocca (L)' : 'Blocca (L)';
    $('blocca').setAttribute('aria-pressed', String(bloccate));
    $('modo').textContent = maniglie.modo() === 'scala' ? 'Maniglie: scala' : 'Maniglie: deforma';
    $('modo').disabled = bloccate;
  });
}
```

- [ ] **Step 4: Collegalo in `index.js`**

In `js/geoimage/index.js` aggiungi l'import dopo quello di `collegaImmagine`:

```js
import { collegaImmagine } from './immagine.js';
import { collegaPosizione } from './posizione.js';
```

e la chiamata dopo `collegaImmagine(ctx);`:

```js
  collegaImmagine(ctx);
  collegaPosizione(ctx);
```

- [ ] **Step 5: Verifica che passi**

Run: `python3 -m pytest tests/test_geoimage.py -x -q`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/geoimage/posizione.js js/geoimage/index.js tests/test_geoimage.py
git commit -m "feat(geoimage): frecce, rotazione, scala, adatta, reset, blocco e Annulla/Ripeti

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---
### Task 10: Confronto con la base (Swipe e Spotlight)

**Files:**
- Create: `js/geoimage/confronto.js`
- Modify: `js/geoimage/index.js`
- Test: `tests/test_geoimage.py`

**Interfaces:**
- Consumes: `clipSwipe`, `clipSpotlight` (Task 5); `ctx.overlay.contenitore`, `ctx.map`, `ctx.sulCaricamento`, `ctx.messaggio` (Task 8).
- Produces: `collegaConfronto(ctx)`. Swipe e Spotlight si escludono; una nuova immagine li spegne.

- [ ] **Step 1: Scrivi il test che fallisce**

Aggiungi in fondo a `tests/test_geoimage.py`:

```python


def test_swipe_e_spotlight_ritagliano_l_immagine(apri):
    v = apri()
    _apri_geoimage(v)
    _carica(v)
    v.page.click("#gi-swipe")
    assert "50%" in v.js("document.querySelector('.gi-overlay').style.clipPath")
    assert v.page.is_visible(".gi-divisore")
    v.page.click("#gi-spotlight")
    assert not v.page.is_visible(".gi-divisore"), "Swipe e Spotlight si escludono"
    v.page.mouse.move(500, 400)
    v.page.mouse.move(520, 410)
    assert v.js("document.querySelector('.gi-overlay').style.clipPath").startswith("path(")
    v.page.click("#gi-inverti")
    v.page.mouse.move(540, 420)
    assert v.js("document.querySelector('.gi-overlay').style.clipPath").startswith("circle(")
```

- [ ] **Step 2: Verifica che fallisca**

Run: `python3 -m pytest tests/test_geoimage.py -x -q -k swipe`
Expected: FAIL (il clip-path non cambia: nessuno ascolta `#gi-swipe`).

- [ ] **Step 3: Scrivi l'implementazione**

Crea `js/geoimage/confronto.js`:

```js
// js/geoimage/confronto.js
// Confronto con la base: Swipe (linea verticale trascinabile) e Spotlight (cerchio che scopre la mappa sotto l'immagine).
// Sono ritagli CSS del contenitore dell'immagine (confronto-clip.js); i due modi si escludono a vicenda.
import { clipSwipe, clipSpotlight } from './confronto-clip.js';

const el = (classe, tag = 'div') => Object.assign(document.createElement(tag), { className: classe });

export function collegaConfronto(ctx) {
  const { $, map, overlay, stato } = ctx;
  const mappa = map.getContainer();
  const divisore = el('gi-divisore');
  const maniglia = el('gi-divisore-maniglia', 'button');
  maniglia.type = 'button';
  maniglia.title = 'Trascina per spostare la linea';
  maniglia.setAttribute('aria-label', 'Sposta la linea dello Swipe');
  maniglia.textContent = '↔';
  divisore.append(maniglia);
  divisore.hidden = true;
  const cerchio = el('gi-cerchio');
  cerchio.hidden = true;
  mappa.append(divisore, cerchio);

  let modo = null; // 'swipe' | 'spotlight' | null
  let percentuale = 50;
  let raggio = 125;
  let invertito = false;
  let puntatore = null; // { x, y } in pixel della mappa

  function applica() {
    const c = overlay.contenitore;
    if (modo === 'swipe') c.style.clipPath = clipSwipe(percentuale);
    else if (modo === 'spotlight' && puntatore) c.style.clipPath = clipSpotlight({ ...puntatore, raggio, invertito, larghezza: mappa.clientWidth, altezza: mappa.clientHeight });
    else c.style.clipPath = '';
    divisore.hidden = modo !== 'swipe';
    divisore.style.left = `${percentuale}%`;
    cerchio.hidden = !(modo === 'spotlight' && puntatore);
    if (puntatore) Object.assign(cerchio.style, { left: `${puntatore.x}px`, top: `${puntatore.y}px`, width: `${raggio * 2}px`, height: `${raggio * 2}px` });
    $('swipe').setAttribute('aria-pressed', String(modo === 'swipe'));
    $('spotlight').setAttribute('aria-pressed', String(modo === 'spotlight'));
    $('inverti').setAttribute('aria-pressed', String(invertito));
  }

  function imposta(nuovo) {
    modo = nuovo;
    puntatore = null;
    applica();
  }

  $('swipe').addEventListener('click', () => { if (stato.immagine) imposta(modo === 'swipe' ? null : 'swipe'); });
  $('spotlight').addEventListener('click', () => {
    if (!stato.immagine) return;
    imposta(modo === 'spotlight' ? null : 'spotlight');
    if (modo === 'spotlight') ctx.messaggio('Spotlight: muovi il mouse sulla mappa per vedere la base sotto l\'immagine.');
  });
  $('inverti').addEventListener('click', () => { invertito = !invertito; applica(); });
  $('raggio').addEventListener('input', () => {
    raggio = Math.round(Number($('raggio').value) / 2);
    $('raggio-val').textContent = String(raggio * 2);
    applica();
  });

  map.on('mousemove', e => {
    if (modo !== 'spotlight') return;
    puntatore = { x: e.point.x, y: e.point.y };
    applica();
  });
  mappa.addEventListener('mouseleave', () => { if (modo === 'spotlight') { puntatore = null; applica(); } });
  map.on('resize', applica);

  // trascinamento della linea dello Swipe: il divisore non sta nel contenitore del canvas, quindi la mappa non si sposta
  let trascina = false;
  maniglia.addEventListener('pointerdown', e => { trascina = true; maniglia.setPointerCapture(e.pointerId); e.preventDefault(); });
  maniglia.addEventListener('pointermove', e => {
    if (!trascina) return;
    const r = mappa.getBoundingClientRect();
    percentuale = Math.max(2, Math.min(98, (e.clientX - r.left) / r.width * 100));
    applica();
  });
  const fine = () => { trascina = false; };
  maniglia.addEventListener('pointerup', fine);
  maniglia.addEventListener('pointercancel', fine);

  // un'altra immagine, o nessuna: il confronto riparte spento
  ctx.sulCaricamento(() => imposta(null));
}
```

- [ ] **Step 4: Collegalo in `index.js`**

```js
import { collegaPosizione } from './posizione.js';
import { collegaConfronto } from './confronto.js';
```

```js
  collegaPosizione(ctx);
  collegaConfronto(ctx);
```

- [ ] **Step 5: Verifica che passi**

Run: `python3 -m pytest tests/test_geoimage.py -x -q`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/geoimage/confronto.js js/geoimage/index.js tests/test_geoimage.py
git commit -m "feat(geoimage): confronto con la base, Swipe e Spotlight

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 11: GCP, allineamento, RMSE

**Files:**
- Create: `js/geoimage/gcp.js`
- Modify: `js/geoimage/index.js`
- Test: `tests/test_geoimage.py`

**Interfaces:**
- Consumes: `geoAPixel` (Task 3); `calcolaTrasformazione`, `minimoGcp`, `applica`, `residui`, `rmse` (Task 2); `ctx.sospensione` (Task 8); `ctx.stato.gcp` = `[{ px, py, lat, lng }]`, `ctx.inquadra`, `ctx.suVisibilita`, `ctx.sulTasto`.
- Produces: `collegaGcp(ctx)`. Modalità GCP (tasto G): passo 1 clic sull'immagine, passo 2 clic sulla mappa; tabella con residui colorati; RMSE; «Allinea» riscrive gli angoli; «Cancella» svuota.

- [ ] **Step 1: Scrivi i test che falliscono**

Aggiungi in fondo a `tests/test_geoimage.py` (`_tre_gcp` serve anche al Task 15):

```python


def _tre_gcp(v):
    angoli = _angoli(v)
    v.page.click("#gi-gcp-modo")
    for u, w in [(0.25, 0.25), (0.75, 0.3), (0.5, 0.75)]:
        x, y = _punto(angoli, u, w)
        v.page.mouse.click(x, y)
        v.page.mouse.click(x + 10, y + 5)
    v.page.click("#gi-gcp-modo")


def test_gcp_due_clic_per_punto_senza_aprire_la_scheda_e_allinea(apri):
    v = apri()
    _apri_geoimage(v)
    _carica(v)
    angoli = _angoli(v)
    v.page.click("#gi-gcp-modo")
    for u, w, dx, dy in [(0.25, 0.25, 30, 20), (0.75, 0.3, 30, 20), (0.5, 0.75, 30, 20)]:
        x, y = _punto(angoli, u, w)
        v.page.mouse.click(x, y)              # passo 1: sull'immagine
        v.page.mouse.click(x + dx, y + dy)    # passo 2: sulla mappa
    assert v.page.locator(".gi-gcp:not(.gi-gcp-attesa)").count() == 3
    assert v.page.locator("#gi-gcp-corpo tr").count() == 3
    assert v.js("document.getElementById('scheda').hidden"), "in modalità GCP il clic non apre la Scheda"
    assert v.js("!document.getElementById('gi-allinea').disabled")
    assert v.page.is_visible("#gi-rmse")
    prima = v.js("window.dt.geoimage.stato.angoli[0]")
    v.page.click("#gi-allinea")
    dopo = v.js("window.dt.geoimage.stato.angoli[0]")
    assert abs(dopo["lat"] - prima["lat"]) > 1e-6 or abs(dopo["lng"] - prima["lng"]) > 1e-6, "l'immagine si è spostata sulle coordinate dei GCP"
    v.page.click("#gi-gcp-modo")  # esce: i clic tornano normali
    assert v.js("document.getElementById('gi-gcp-modo').getAttribute('aria-pressed')") == "false"
    assert not any("geoimage" in e.lower() for e in v.errori), v.errori


def test_con_pochi_gcp_o_poly2_senza_abbastanza_punti_allinea_resta_spento(apri):
    v = apri()
    _apri_geoimage(v)
    _carica(v)
    angoli = _angoli(v)
    v.page.click("#gi-gcp-modo")
    for u, w in [(0.25, 0.25), (0.75, 0.3)]:
        x, y = _punto(angoli, u, w)
        v.page.mouse.click(x, y)
        v.page.mouse.click(x + 10, y + 5)
    assert v.js("document.getElementById('gi-allinea').disabled")
    assert not v.page.is_visible("#gi-rmse")
    assert "ne servono almeno 3" in v.page.inner_text("#gi-gcp-conteggio")
    x, y = _punto(angoli, 0.5, 0.75)
    v.page.mouse.click(x, y)
    v.page.mouse.click(x + 10, y + 5)
    assert v.js("!document.getElementById('gi-allinea').disabled")
    v.page.select_option("#gi-tipo", "poly2")
    assert v.js("document.getElementById('gi-allinea').disabled"), "la poly2 vuole almeno 6 GCP"
    assert not any("geoimage" in e.lower() for e in v.errori), v.errori


def test_una_nuova_immagine_spegne_swipe_e_modalita_gcp_e_azzera_i_gcp(apri):
    v = apri()
    _apri_geoimage(v)
    _carica(v)
    angoli = _angoli(v)
    v.page.click("#gi-gcp-modo")
    x, y = _punto(angoli, 0.3, 0.3)
    v.page.mouse.click(x, y)
    v.page.mouse.click(x + 10, y + 5)
    v.page.click("#gi-swipe")
    assert v.page.locator(".gi-gcp:not(.gi-gcp-attesa)").count() == 1
    _carica(v, "seconda.png")
    assert v.js("document.getElementById('gi-gcp-modo').getAttribute('aria-pressed')") == "false"
    assert v.js("document.getElementById('gi-swipe').getAttribute('aria-pressed')") == "false"
    assert v.js("document.querySelector('.gi-overlay').style.clipPath") == ""
    assert v.page.locator(".gi-gcp").count() == 0
    assert v.page.locator("#gi-gcp-corpo tr").count() == 0


def test_chiudere_il_pannello_in_modalita_gcp_restituisce_i_clic_alla_mappa(apri):
    v = apri()
    _apri_geoimage(v)
    _carica(v)
    v.page.click("#gi-gcp-modo")
    v.page.click("#rail-pannelli [data-pannello=geoimage]")  # ripiega il pannello
    assert v.js("document.getElementById('gi-gcp-modo').getAttribute('aria-pressed')") == "false"
    assert v.js("window.dt.map.getCanvas().style.cursor") == ""
```

- [ ] **Step 2: Verifica che falliscano**

Run: `python3 -m pytest tests/test_geoimage.py -x -q -k "gcp or poly2 or nuova_immagine"`
Expected: FAIL (`.gi-gcp` non compare: nessuno ascolta `#gi-gcp-modo`).

- [ ] **Step 3: Scrivi l'implementazione**

Crea `js/geoimage/gcp.js`:

```js
// js/geoimage/gcp.js
// Ground Control Points: modalità GCP (due clic per punto), tabella con residui, RMSE, tipo di trasformazione,
// «Allinea immagine ai GCP» e anteprima dell'immagine con i punti.
//   Passo 1: clic sull'immagine storica sulla mappa → pixel dell'immagine (geoAPixel).
//   Passo 2: clic sulla mappa nel punto reale corrispondente → coordinate.
import { geoAPixel } from './geometria.js';
import { calcolaTrasformazione, minimoGcp, applica, residui, rmse } from './trasformazioni.js';

const segno = (classe, testo = '') => Object.assign(document.createElement('div'), { className: classe, textContent: testo });
const LARGHEZZA_ANTEPRIMA = 800;

export function collegaGcp(ctx) {
  const { $, map, stato, sospensione } = ctx;
  let attivo = false;
  let attesa = null; // { px, py }: passo 1 fatto
  let segnoAttesa = null;
  let marcatori = [];
  let anteprima = null; // Image dell'immagine storica per il canvas

  const titolo = (g, i) => `GCP ${i + 1} · lat ${g.lat.toFixed(6)} · lon ${g.lng.toFixed(6)} · px ${g.px}, py ${g.py}`;

  function ricostruisci() {
    marcatori.forEach(k => k.remove());
    marcatori = stato.gcp.map((g, i) => {
      const elemento = segno('gi-gcp', String(i + 1));
      elemento.title = titolo(g, i);
      elemento.addEventListener('click', e => e.stopPropagation());
      const k = new maplibregl.Marker({ element: elemento, draggable: true }).setLngLat([g.lng, g.lat]).addTo(map);
      // px e py restano quelli del passo 1: sono un punto dell'immagine, non dipendono da dove sta l'overlay
      k.on('dragend', () => { const { lat, lng } = k.getLngLat(); Object.assign(g, { lat, lng }); elemento.title = titolo(g, i); ctx.cambiato(); });
      return k;
    });
  }

  const aggiungi = (lat, lng, px, py) => { stato.gcp.push({ px, py, lat, lng }); ricostruisci(); ctx.cambiato(); };
  const rimuovi = i => { stato.gcp.splice(i, 1); ricostruisci(); ctx.cambiato(); };
  const svuota = () => { stato.gcp = []; ricostruisci(); ctx.cambiato(); };

  function annullaAttesa() {
    attesa = null;
    segnoAttesa?.remove();
    segnoAttesa = null;
  }

  function clic(e) {
    if (!stato.immagine) return;
    const { lat, lng } = e.lngLat;
    if (!attesa) {
      const r = geoAPixel(stato.angoli, stato.immagine.larghezza, stato.immagine.altezza, lat, lng);
      if (!r.valido) return ctx.messaggio('Passo 1: clicca sull\'immagine storica per scegliere il punto.');
      attesa = { px: r.px, py: r.py };
      segnoAttesa = new maplibregl.Marker({ element: segno('gi-gcp gi-gcp-attesa') }).setLngLat([lng, lat]).addTo(map);
      ctx.cambiato();
      return ctx.messaggio(`Pixel (${r.px}, ${r.py}) scelto. Passo 2: clicca sulla mappa nel punto reale corrispondente. Esc per annullare.`);
    }
    const { px, py } = attesa;
    annullaAttesa();
    aggiungi(lat, lng, px, py);
    ctx.messaggio(`GCP ${stato.gcp.length} aggiunto. Passo 1: clicca sull'immagine per il prossimo punto, Esc per uscire.`);
  }

  function imposta(on) {
    if (on && !stato.immagine) return;
    attivo = on;
    annullaAttesa();
    if (on) { sospensione.attiva(clic); map.doubleClickZoom.disable(); } else { sospensione.disattiva(); map.doubleClickZoom.enable(); }
    map.getCanvas().style.cursor = on ? 'crosshair' : '';
    $('gcp-modo').setAttribute('aria-pressed', String(on));
    $('gcp-modo').textContent = on ? 'Esci dalla modalità GCP (G)' : 'Aggiungi GCP (G)';
    if (on) ctx.messaggio('Modalità GCP. Passo 1: clicca sull\'immagine storica per scegliere un punto riconoscibile.');
    ctx.cambiato();
  }

  function disegnaAnteprima() {
    const box = $('anteprima-box');
    box.hidden = !(attivo && stato.immagine);
    if (box.hidden || !anteprima) return;
    const canvas = $('anteprima');
    const { larghezza: W, altezza: H } = stato.immagine;
    const k = Math.min(1, LARGHEZZA_ANTEPRIMA / W);
    canvas.width = Math.round(W * k);
    canvas.height = Math.round(H * k);
    const g = canvas.getContext('2d');
    g.drawImage(anteprima, 0, 0, canvas.width, canvas.height);
    const pallino = (p, colore, r, testo) => {
      g.beginPath(); g.arc(p.px * k, p.py * k, r, 0, Math.PI * 2);
      g.fillStyle = colore; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
      if (testo) { g.fillStyle = '#fff'; g.font = 'bold 11px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(testo, p.px * k, p.py * k); }
    };
    stato.gcp.forEach((p, i) => pallino(p, '#ef4444', 9, String(i + 1)));
    if (attesa) pallino(attesa, 'rgba(245, 158, 11, .9)', 10);
  }

  function aggiornaTabella() {
    const n = stato.gcp.length, min = minimoGcp(stato.tipo);
    $('gcp-conteggio').textContent = n === 0 ? 'Nessun GCP inserito' : n < min ? `${n} GCP: ne servono almeno ${min}` : `${n} GCP`;
    const t = n >= min ? calcolaTrasformazione(stato.tipo, stato.gcp) : null;
    const res = t ? residui(t, stato.gcp) : [];
    const media = res.length ? res.reduce((s, r) => s + r, 0) / res.length : 0;
    const corpo = $('gcp-corpo');
    corpo.replaceChildren(...stato.gcp.map((g, i) => {
      const riga = document.createElement('tr');
      const r = res[i];
      if (r != null) riga.className = r < media * 1.5 ? 'gi-res-buono' : r < media * 3 ? 'gi-res-medio' : 'gi-res-alto';
      for (const testo of [i + 1, g.lat.toFixed(6), g.lng.toFixed(6), g.px, g.py, r != null ? r.toFixed(1) : '—']) riga.append(Object.assign(document.createElement('td'), { textContent: String(testo) }));
      const x = Object.assign(document.createElement('button'), { type: 'button', className: 'gi-btn gi-x', textContent: '×', title: `Rimuovi il GCP ${i + 1}` });
      x.setAttribute('aria-label', `Rimuovi il GCP ${i + 1}`);
      x.addEventListener('click', () => rimuovi(i));
      const cella = document.createElement('td');
      cella.append(x);
      riga.append(cella);
      return riga;
    }));
    $('rmse').hidden = !t;
    $('rmse-val').textContent = t ? rmse(res).toFixed(2) : '—';
    $('allinea').disabled = !(t && stato.immagine);
    $('gcp-svuota').disabled = n === 0;
    $('tipo').value = stato.tipo;
    disegnaAnteprima();
  }

  $('gcp-modo').addEventListener('click', () => imposta(!attivo));
  $('gcp-svuota').addEventListener('click', () => { annullaAttesa(); svuota(); });
  $('tipo').addEventListener('change', () => { stato.tipo = $('tipo').value; ctx.cambiato(); });
  $('allinea').addEventListener('click', () => {
    const t = calcolaTrasformazione(stato.tipo, stato.gcp);
    if (!t || !stato.immagine) return;
    const { larghezza: W, altezza: H } = stato.immagine;
    const angoli = [[0, 0], [W, 0], [0, H], [W, H]].map(([px, py]) => { const g = applica(t, px, py); return { lat: g.lat, lng: g.lng }; });
    ctx.impostaAngoli(angoli);
    ctx.conferma();
    ctx.inquadra(angoli);
    ctx.messaggio('Immagine allineata alle coordinate dei GCP.');
  });

  ctx.sulTasto(e => {
    if (!stato.immagine) return false;
    if (!e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'g') { imposta(!attivo); return true; }
    if (e.key === 'Escape') {
      if (attesa) { annullaAttesa(); ctx.messaggio('Passo 1 annullato: clicca sull\'immagine per scegliere un altro punto.'); ctx.cambiato(); return true; }
      if (attivo) { imposta(false); return true; }
      return false;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && stato.gcp.length) { rimuovi(stato.gcp.length - 1); return true; }
    return false;
  });

  // nuova immagine o progetto: la modalità GCP si spegne, i marcatori e l'anteprima ripartono dai GCP dello stato
  ctx.sulCaricamento(() => {
    attivo = false; annullaAttesa(); sospensione.disattiva(); map.doubleClickZoom.enable(); map.getCanvas().style.cursor = '';
    $('gcp-modo').setAttribute('aria-pressed', 'false');
    $('gcp-modo').textContent = 'Aggiungi GCP (G)';
    ricostruisci();
    anteprima = null;
    if (stato.immagine) {
      const img = new Image();
      img.onload = () => { anteprima = img; disegnaAnteprima(); };
      img.src = stato.immagine.dataUrl;
    }
  });
  // il pannello si chiude o si ripiega: con la mappa libera i clic tornano normali
  ctx.suVisibilita(aperto => { if (!aperto && attivo) imposta(false); });
  ctx.sulCambio(aggiornaTabella);
}
```

- [ ] **Step 4: Collegalo in `index.js`**

```js
import { collegaConfronto } from './confronto.js';
import { collegaGcp } from './gcp.js';
```

```js
  collegaConfronto(ctx);
  collegaGcp(ctx);
```

- [ ] **Step 5: Verifica che passino**

Run: `python3 -m pytest tests/test_geoimage.py -x -q`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/geoimage/gcp.js js/geoimage/index.js tests/test_geoimage.py
git commit -m "feat(geoimage): GCP a due clic, tabella con residui, RMSE e allineamento

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Formati di export basati su testo (KMZ, .points, world file, GeoJSON)

**Files:**
- Create: `js/geoimage/export.js`, `js/geoimage/scarica.js`
- Test: `tests/js/geoimage-export.test.mjs`

**Interfaces:**
- Produces: `nomeBase(nome)`, `escXml(s)`, `puntiQgis(gcp) → string`, `geojsonGcp(gcp) → FeatureCollection`, `worldFile(t) → string`, `estensioneWorldFile(nomeFile)`, `kml({ nome, fileImmagine, angoli, gcp }) → string`, `creaKmz(JSZip, { nome, dataUrl, angoli, gcp }) → Promise<Blob>`; `scarica(blob, nome)` (scarica un file dal browser).

- [ ] **Step 1: Scrivi il test che fallisce**

Crea `tests/js/geoimage-export.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { nomeBase, escXml, puntiQgis, geojsonGcp, worldFile, estensioneWorldFile, kml, creaKmz } from '../../js/geoimage/export.js';

const gcp = [{ px: 10, py: 20, lat: 38.15, lng: 13.35 }, { px: 30, py: 40, lat: 38.16, lng: 13.36 }];
const angoli = [{ lat: 38.2, lng: 13.3 }, { lat: 38.2, lng: 13.4 }, { lat: 38.1, lng: 13.3 }, { lat: 38.1, lng: 13.4 }];

test('nomeBase toglie l\'estensione e ha un nome di riserva', () => {
  assert.equal(nomeBase('Palermo 1864.jpg'), 'Palermo 1864');
  assert.equal(nomeBase(''), 'mappa');
  assert.equal(nomeBase(undefined), 'mappa');
});

test('escXml protegge &, < e >', () => assert.equal(escXml('a&b<c>'), 'a&amp;b&lt;c&gt;'));

test('.points di QGIS: intestazione e y capovolta', () => {
  assert.equal(puntiQgis(gcp), 'mapX,mapY,sourceX,sourceY,enable\n13.35,38.15,10,-20,1\n13.36,38.16,30,-40,1\n');
});

test('GeoJSON dei GCP: punti [lng, lat] con id da 1', () => {
  const fc = geojsonGcp(gcp);
  assert.equal(fc.features.length, 2);
  assert.deepEqual(fc.features[1].geometry.coordinates, [13.36, 38.16]);
  assert.equal(fc.features[1].properties.id, 2);
});

test('world file: sei righe nell\'ordine a, d, b, e, c, f', () => {
  const righe = worldFile({ a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 }).split('\n');
  assert.deepEqual(righe, ['1.0000000000', '4.0000000000', '2.0000000000', '5.0000000000', '3.0000000000', '6.0000000000']);
});

test('estensione del world file dal tipo dell\'immagine', () => {
  assert.equal(estensioneWorldFile('a.JPG'), 'jgw');
  assert.equal(estensioneWorldFile('a.png'), 'pgw');
  assert.equal(estensioneWorldFile('a.webp'), 'wld');
});

test('KML: gli angoli sono scritti SO, SE, NE, NO e il nome è protetto', () => {
  const k = kml({ nome: 'A&B', fileImmagine: 'files/a.jpg', angoli, gcp });
  assert.match(k, /<name>A&amp;B<\/name>/);
  const ordine = [...k.matchAll(/^\s+(13\.\d+),(38\.\d+),0$/gm)].map(m => `${m[1]},${m[2]}`);
  assert.deepEqual(ordine.slice(0, 4), ['13.30000000,38.10000000', '13.40000000,38.10000000', '13.40000000,38.20000000', '13.30000000,38.20000000']);
  assert.match(k, /<name>GCP 2<\/name>/);
});

test('KMZ: doc.kml e immagine in files/ con il nome giusto', async () => {
  const scritti = {};
  class ZipFinto {
    file(n, c, o) { scritti[n] = { c, o }; }
    folder(d) { return { file: (n, c, o) => { scritti[`${d}/${n}`] = { c, o }; } }; }
    async generateAsync(opz) { return { blob: true, opz }; }
  }
  const r = await creaKmz(ZipFinto, { nome: 'mappa.jpeg', dataUrl: 'data:image/jpeg;base64,QUJD', angoli, gcp });
  assert.ok(r.blob);
  assert.match(scritti['doc.kml'].c, /<href>files\/mappa\.jpg<\/href>/);
  assert.equal(scritti['files/mappa.jpg'].c, 'QUJD');
  assert.deepEqual(scritti['files/mappa.jpg'].o, { base64: true });
});
```

- [ ] **Step 2: Verifica che fallisca**

Run: `node --test tests/js/geoimage-export.test.mjs`
Expected: FAIL con `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Scrivi le implementazioni**

Crea `js/geoimage/export.js`:

```js
// js/geoimage/export.js
// Formati di esportazione basati su testo: KMZ, file .points di QGIS, world file, GCP GeoJSON. Portati da Geoimage.
// Il GeoTIFF sta in export-geotiff.js.

export const nomeBase = nome => (nome || 'mappa').replace(/\.[^/.]+$/, '');
export const escXml = s => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// File dei GCP per il Georeferenziatore di QGIS (l'asse y dell'immagine va verso l'alto, quindi -py)
export function puntiQgis(gcp) {
  return 'mapX,mapY,sourceX,sourceY,enable\n' + gcp.map(g => `${g.lng},${g.lat},${g.px},${-g.py},1\n`).join('');
}

export function geojsonGcp(gcp) {
  return {
    type: 'FeatureCollection',
    features: gcp.map((g, i) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [g.lng, g.lat] },
      properties: { id: i + 1, px: g.px, py: g.py, lat: g.lat, lng: g.lng },
    })),
  };
}

// World file a 6 righe (convenzione del centro del pixel). `t` è la trasformazione affine pixel → coordinate.
export function worldFile(t) {
  return [t.a, t.d, t.b, t.e, t.c, t.f].map(v => v.toFixed(10)).join('\n');
}

export function estensioneWorldFile(nomeFile) {
  const ext = (nomeFile.split('.').pop() || '').toLowerCase();
  return { jpg: 'jgw', jpeg: 'jgw', png: 'pgw', tif: 'tfw', tiff: 'tfw' }[ext] || 'wld';
}

// KML con gx:LatLonQuad: l'immagine sta esattamente sui 4 angoli, anche ruotata o deformata (ordine SO, SE, NE, NO)
export function kml({ nome, fileImmagine, angoli, gcp }) {
  const [NO, NE, SO, SE] = angoli;
  const coord = p => `${p.lng.toFixed(8)},${p.lat.toFixed(8)},0`;
  const segnaposti = gcp.map((g, i) => `    <Placemark>
      <name>GCP ${i + 1}</name>
      <description>Pixel: ${g.px}, ${g.py}</description>
      <Point><coordinates>${coord(g)}</coordinates></Point>
    </Placemark>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"
     xmlns:gx="http://www.google.com/kml/ext/2.2">
  <Document>
    <name>Mappa storica georeferenziata</name>
    <GroundOverlay>
      <name>${escXml(nome)}</name>
      <Icon><href>${fileImmagine}</href></Icon>
      <gx:LatLonQuad>
        <coordinates>
          ${coord(SO)}
          ${coord(SE)}
          ${coord(NE)}
          ${coord(NO)}
        </coordinates>
      </gx:LatLonQuad>
    </GroundOverlay>
    <Folder>
      <name>Ground Control Points</name>
${segnaposti}
    </Folder>
  </Document>
</kml>`;
}

// KMZ: doc.kml più l'immagine originale in files/. `JSZip` si passa dall'esterno (si carica solo quando serve).
export async function creaKmz(JSZip, { nome, dataUrl, angoli, gcp }) {
  const mime = dataUrl.split(';')[0].split(':')[1]; // per esempio image/jpeg
  const ext = mime.split('/')[1].replace('jpeg', 'jpg');
  const nomeImmagine = `${nomeBase(nome)}.${ext}`;
  const zip = new JSZip();
  zip.file('doc.kml', kml({ nome, fileImmagine: `files/${nomeImmagine}`, angoli, gcp }));
  zip.folder('files').file(nomeImmagine, dataUrl.split(',')[1], { base64: true });
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
}
```

Crea `js/geoimage/scarica.js`:

```js
// js/geoimage/scarica.js
// Scarica un file generato nel browser (KMZ, GeoTIFF, JSON…).
export function scarica(blob, nome) {
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href: url, download: nome }).click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
```

- [ ] **Step 4: Verifica che passi**

Run: `node --test tests/js/geoimage-export.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/geoimage/export.js js/geoimage/scarica.js tests/js/geoimage-export.test.mjs
git commit -m "feat(geoimage): formati di export KMZ, .points, world file e GeoJSON

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Progetto JSON, memoria tra le sessioni

**Files:**
- Create: `js/geoimage/archivio.js`, `js/geoimage/progetto.js`, `js/geoimage/sessione.js`
- Modify: `js/geoimage/index.js`
- Test: `tests/js/geoimage-archivio.test.mjs`, `tests/js/geoimage-progetto.test.mjs`, `tests/test_geoimage.py`

**Interfaces:**
- Consumes: `TIPI` (Task 2); `nomeBase` e `scarica` (Task 12); `preparaSchermo` (Task 6); `archivioIndexedDB` da `js/rndt/dati.js` (esistente: `{ leggi(id), scrivi(id, valore), elimina(id) }` o `null`); `ctx` (Task 8).
- Produces: `CHIAVE = 'dt:geoimage:v1'`, `ID_IMMAGINE`, `leggi(storage) → parametri | null`, `salva(storage, parametri) → boolean`, `elimina(storage)`; `serializza(stato) → oggetto Geoimage v1`, `leggi(dati) → stato`, `daTesto(testo) → stato` (lanciano `Error` con messaggio per l'utente); `collegaSessione(ctx) → { ripristina(), salvaOra() }`.

- [ ] **Step 1: Scrivi i test che falliscono**

Crea `tests/js/geoimage-archivio.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { CHIAVE, leggi, salva, elimina } from '../../js/geoimage/archivio.js';

const finto = (iniziale = {}) => {
  const dati = new Map(Object.entries(iniziale));
  return { getItem: k => dati.get(k) ?? null, setItem: (k, v) => { dati.set(k, v); }, removeItem: k => { dati.delete(k); }, dati };
};
const quattro = n => [0, 1, 2, 3].map(i => ({ lat: 38 + n + i / 100, lng: 13 + n }));
const progetto = () => ({ nome: 'a.png', larghezza: 300, altezza: 200, angoli: quattro(0), angoliIniziali: quattro(1), opacita: 0.4, tipo: 'poly2', gcp: [{ px: 1, py: 2, lat: 38, lng: 13 }] });

test('senza storage o senza dati non c\'è nulla da ripristinare', () => {
  assert.equal(leggi(null), null);
  assert.equal(leggi(finto()), null);
});

test('salva e rilegge lo stesso progetto', () => {
  const s = finto();
  assert.equal(salva(s, progetto()), true);
  assert.deepEqual(leggi(s), progetto());
});

test('JSON rotto, versione diversa o angoli sbagliati non rompono la lettura', () => {
  assert.equal(leggi(finto({ [CHIAVE]: '{rotto' })), null);
  assert.equal(leggi(finto({ [CHIAVE]: JSON.stringify({ v: 2, ...progetto() }) })), null);
  assert.equal(leggi(finto({ [CHIAVE]: JSON.stringify({ v: 1, ...progetto(), angoli: [{ lat: 1, lng: 2 }] }) })), null);
  assert.equal(leggi(finto({ [CHIAVE]: JSON.stringify({ v: 1, ...progetto(), angoli: quattro(0).map(p => ({ lat: null, lng: p.lng })) }) })), null);
});

test('un GCP rovinato si scarta, il resto resta; un tipo sconosciuto torna all\'affine', () => {
  const s = finto({ [CHIAVE]: JSON.stringify({ v: 1, ...progetto(), tipo: 'altro', gcp: [{ px: 1, py: 2, lat: 38, lng: 13 }, { px: 'x' }] }) });
  const p = leggi(s);
  assert.equal(p.gcp.length, 1);
  assert.equal(p.tipo, 'poly1');
});

test('storage pieno o bloccato: salva dice false e non lancia', () => {
  const pieno = { setItem() { throw new DOMException('quota', 'QuotaExceededError'); } };
  assert.equal(salva(pieno, progetto()), false);
  assert.equal(salva(null, progetto()), false);
});

test('elimina toglie il progetto e non lancia senza storage', () => {
  const s = finto();
  salva(s, progetto());
  elimina(s);
  assert.equal(leggi(s), null);
  assert.doesNotThrow(() => elimina(null));
});
```

Crea `tests/js/geoimage-progetto.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { serializza, leggi, daTesto } from '../../js/geoimage/progetto.js';

const stato = () => ({
  immagine: { dataUrl: 'data:image/png;base64,AAAA', larghezza: 300, altezza: 200, nome: 'palermo.png' },
  angoli: [{ lat: 38.2, lng: 13.3 }, { lat: 38.2, lng: 13.4 }, { lat: 38.1, lng: 13.3 }, { lat: 38.1, lng: 13.4 }],
  angoliIniziali: [],
  opacita: 0.5,
  tipo: 'poly2',
  gcp: [{ px: 10, py: 20, lat: 38.15, lng: 13.35 }],
});

test('serializza usa il formato di Geoimage (angoli come [lat, lng])', () => {
  const o = serializza(stato());
  assert.equal(o.version, 1);
  assert.deepEqual(o.overlayCorners[0], [38.2, 13.3]);
  assert.equal(o.imageDataUrl, 'data:image/png;base64,AAAA');
  assert.deepEqual(o.gcps[0], { px: 10, py: 20, lat: 38.15, lng: 13.35 });
});

test('serializza e leggi sono l\'una l\'inverso dell\'altra', () => {
  const s = leggi(JSON.parse(JSON.stringify(serializza(stato()))));
  assert.deepEqual(s.angoli, stato().angoli);
  assert.equal(s.tipo, 'poly2');
  assert.equal(s.opacita, 0.5);
  assert.equal(s.immagine.nome, 'palermo.png');
  assert.deepEqual(s.angoliIniziali, s.angoli, 'il Reset riporta alla posizione del file');
});

test('un file di Geoimage senza transformType si apre con l\'affine e l\'opacità di default', () => {
  const o = serializza(stato());
  delete o.transformType; delete o.opacity;
  const s = leggi(o);
  assert.equal(s.tipo, 'poly1');
  assert.equal(s.opacita, 0.7);
});

test('file non validi danno un errore comprensibile', () => {
  assert.throws(() => daTesto('{rotto'), /JSON valido/);
  assert.throws(() => leggi(null), /progetto Geoimage/);
  assert.throws(() => leggi({ imageDataUrl: 'http://x/y.png', overlayCorners: [] }), /immagine/);
  assert.throws(() => leggi({ ...serializza(stato()), overlayCorners: [[1, 2]] }), /coordinate/);
  assert.throws(() => leggi({ ...serializza(stato()), overlayCorners: [[999, 0], [0, 0], [0, 0], [0, 0]] }), /coordinate/);
});

test('i GCP con numeri mancanti o fuori scala si scartano, gli altri restano; opacità fuori scala si riporta in 0-1', () => {
  const o = serializza(stato());
  o.gcps.push({ px: 1, py: 2, lat: 'x', lng: 3 }, { px: 1, py: 2, lat: 95, lng: 3 });
  o.opacity = 7;
  const s = leggi(o);
  assert.equal(s.gcp.length, 1);
  assert.equal(s.opacita, 1);
});
```

Aggiungi in fondo a `tests/test_geoimage.py`:

```python


def test_il_progetto_si_ricorda_dopo_il_ricaricamento(apri):
    v = apri()
    _apri_geoimage(v)
    _carica(v)
    v.page.wait_for_timeout(800)  # salvataggio ritardato e scrittura in IndexedDB
    v.page.reload()
    v.attendi_pronto()
    v.page.wait_for_selector(".gi-overlay:not([hidden]) .gi-immagine[src]", timeout=15000)
    assert v.js("document.querySelector('.gi-immagine').style.transform").startswith("matrix3d(")


def test_rimuovere_l_immagine_pulisce_mappa_e_memoria(apri):
    v = apri()
    _apri_geoimage(v)
    _carica(v)
    v.page.click("#gi-rimuovi")
    assert not v.page.is_visible(".gi-overlay")
    assert v.page.locator(".gi-maniglia").count() == 0
    assert not v.page.is_visible("#gi-swipe")
    assert v.js("localStorage.getItem('dt:geoimage:v1')") is None
```

- [ ] **Step 2: Verifica che falliscano**

Run: `node --test tests/js/geoimage-archivio.test.mjs tests/js/geoimage-progetto.test.mjs`
Expected: FAIL con `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Scrivi la memoria dei parametri**

Crea `js/geoimage/archivio.js`:

```js
// js/geoimage/archivio.js
// Il progetto si ricorda tra una sessione e l'altra: i parametri (angoli, GCP, opacità…) in localStorage, l'immagine — troppo
// grande per i 5 MB di localStorage — in IndexedDB con ID_IMMAGINE (vedi js/rndt/dati.js).
// Se il browser blocca lo storage o è pieno l'app funziona lo stesso, senza memoria.
import { TIPI } from './trasformazioni.js';

export const CHIAVE = 'dt:geoimage:v1';
export const ID_IMMAGINE = 'geoimage:immagine';

const numero = v => typeof v === 'number' && Number.isFinite(v);
const punto = p => p && numero(p.lat) && numero(p.lng);
const quattro = a => Array.isArray(a) && a.length === 4 && a.every(punto);

// null se manca, è di un'altra versione o è rovinato
export function leggi(storage) {
  try {
    const grezzo = storage?.getItem(CHIAVE);
    if (!grezzo) return null;
    const p = JSON.parse(grezzo);
    if (p?.v !== 1 || !quattro(p.angoli) || !quattro(p.angoliIniziali)) return null;
    if (!numero(p.larghezza) || !numero(p.altezza) || typeof p.nome !== 'string') return null;
    return {
      nome: p.nome,
      larghezza: p.larghezza,
      altezza: p.altezza,
      angoli: p.angoli.map(({ lat, lng }) => ({ lat, lng })),
      angoliIniziali: p.angoliIniziali.map(({ lat, lng }) => ({ lat, lng })),
      opacita: numero(p.opacita) ? Math.min(1, Math.max(0, p.opacita)) : 0.7,
      tipo: TIPI.includes(p.tipo) ? p.tipo : 'poly1',
      gcp: (Array.isArray(p.gcp) ? p.gcp : []).filter(g => g && [g.px, g.py, g.lat, g.lng].every(numero)).map(({ px, py, lat, lng }) => ({ px, py, lat, lng })),
    };
  } catch {
    return null;
  }
}

// true se salvato
export function salva(storage, p) {
  try {
    storage.setItem(CHIAVE, JSON.stringify({ v: 1, ...p }));
    return true;
  } catch {
    return false;
  }
}

export function elimina(storage) {
  try { storage?.removeItem(CHIAVE); } catch { /* storage bloccato: niente da cancellare */ }
}
```

- [ ] **Step 4: Scrivi il formato del progetto**

Crea `js/geoimage/progetto.js`:

```js
// js/geoimage/progetto.js
// Il progetto Geoimage come file JSON. Il formato è quello dell'app originale (version 1), così i file si scambiano:
// immagine incorporata come data URL, 4 angoli [lat, lng] nell'ordine NO, NE, SO, SE, opacità e GCP.
// `transformType` è un'aggiunta facoltativa: i file di Geoimage senza il campo si aprono con l'affine.
import { TIPI } from './trasformazioni.js';

const numero = v => typeof v === 'number' && Number.isFinite(v);
const coordinataValida = ([lat, lng]) => numero(lat) && numero(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

// stato → oggetto da scrivere nel file
export function serializza(s) {
  return {
    version: 1,
    imageName: s.immagine.nome,
    imageWidth: s.immagine.larghezza,
    imageHeight: s.immagine.altezza,
    imageDataUrl: s.immagine.dataUrl,
    overlayCorners: s.angoli.map(p => [p.lat, p.lng]),
    opacity: s.opacita,
    transformType: s.tipo,
    gcps: s.gcp.map(g => ({ px: g.px, py: g.py, lat: g.lat, lng: g.lng })),
  };
}

// oggetto (già letto da JSON) → stato; lancia un Error con un messaggio per l'utente se il file non è un progetto valido
export function leggi(dati) {
  if (!dati || typeof dati !== 'object') throw new Error('il file non è un progetto Geoimage');
  if (typeof dati.imageDataUrl !== 'string' || !dati.imageDataUrl.startsWith('data:image/')) throw new Error('manca l\'immagine');
  const c = dati.overlayCorners;
  if (!Array.isArray(c) || c.length !== 4 || !c.every(p => Array.isArray(p) && coordinataValida(p))) throw new Error('le coordinate dell\'immagine non sono valide');
  const gcp = (dati.gcps ?? []).filter(g => g && [g.px, g.py, g.lat, g.lng].every(numero) && coordinataValida([g.lat, g.lng]));
  const opacita = numero(dati.opacity) ? Math.min(1, Math.max(0, dati.opacity)) : 0.7;
  const angoli = c.map(([lat, lng]) => ({ lat, lng }));
  return {
    immagine: { dataUrl: dati.imageDataUrl, larghezza: dati.imageWidth || 0, altezza: dati.imageHeight || 0, nome: dati.imageName || 'immagine' },
    angoli,
    angoliIniziali: angoli.map(p => ({ ...p })),
    opacita,
    tipo: TIPI.includes(dati.transformType) ? dati.transformType : 'poly1',
    gcp: gcp.map(g => ({ px: g.px, py: g.py, lat: g.lat, lng: g.lng })),
  };
}

// testo del file → stato
export function daTesto(testo) {
  let dati;
  try { dati = JSON.parse(testo); } catch { throw new Error('il file non è un JSON valido'); }
  return leggi(dati);
}
```

- [ ] **Step 5: Verifica i test puri**

Run: `node --test tests/js/geoimage-archivio.test.mjs tests/js/geoimage-progetto.test.mjs`
Expected: PASS.

- [ ] **Step 6: Scrivi il modulo della sessione**

Crea `js/geoimage/sessione.js`:

```js
// js/geoimage/sessione.js
// Il progetto si ricorda (archivio.js) e si scambia come file JSON (progetto.js, formato di Geoimage).
import { leggi, salva, elimina, ID_IMMAGINE } from './archivio.js';
import { serializza, daTesto } from './progetto.js';
import { preparaSchermo } from './overlay.js';
import { nomeBase } from './export.js';
import { scarica } from './scarica.js';
import { archivioIndexedDB } from '../rndt/dati.js';

const storageSicuro = () => { try { return window.localStorage; } catch { return null; } };

export function collegaSessione(ctx) {
  const { $, stato } = ctx;
  const storage = storageSicuro();
  const dati = archivioIndexedDB(); // null senza IndexedDB: il progetto vale solo per questa sessione
  let avvisato = false;
  const avvisaUnaVolta = testo => { if (!avvisato) { avvisato = true; ctx.avvisa(testo); } };

  const parametri = () => ({
    nome: stato.immagine.nome, larghezza: stato.immagine.larghezza, altezza: stato.immagine.altezza,
    angoli: stato.angoli, angoliIniziali: stato.angoliIniziali, opacita: stato.opacita, tipo: stato.tipo, gcp: stato.gcp,
  });

  function salvaOra() {
    if (!stato.immagine) return;
    if (!salva(storage, parametri())) avvisaUnaVolta('Geoimage: il browser non permette di salvare il progetto. Usa «Esporta JSON» per tenerne una copia.');
  }

  let timer = null;
  ctx.sulCambio(() => { clearTimeout(timer); timer = setTimeout(salvaOra, 300); });

  ctx.sulCaricamento(origine => {
    if (origine === 'ripristino') return;
    if (!stato.immagine) {
      elimina(storage);
      dati?.elimina(ID_IMMAGINE).catch(() => {});
      return;
    }
    if (!dati) return avvisaUnaVolta('Geoimage: il browser non conserva immagini grandi, il progetto non si ricorderà alla prossima visita. Usa «Esporta JSON».');
    dati.scrivi(ID_IMMAGINE, stato.immagine.dataUrl).catch(() => avvisaUnaVolta('Geoimage: non riesco a salvare l\'immagine in questo browser. Usa «Esporta JSON».'));
  });

  ctx.sulTasto(e => {
    if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 's' || !stato.immagine) return false;
    salvaOra();
    ctx.messaggio('Progetto salvato in questo browser.');
    return true;
  });

  $('json-esporta').addEventListener('click', () => {
    if (!stato.immagine) return;
    scarica(new Blob([JSON.stringify(serializza(stato), null, 2)], { type: 'application/json' }), `${nomeBase(stato.immagine.nome)}_geoimage.json`);
    ctx.messaggio('Progetto esportato.');
  });
  $('json-importa').addEventListener('click', () => $('json-file').click());
  $('json-file').addEventListener('change', async e => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const p = daTesto(await file.text());
      const schermo = await preparaSchermo(p.immagine.dataUrl);
      ctx.caricaImmagine({ ...p.immagine, larghezza: schermo.originaleL, altezza: schermo.originaleA }, schermo, p.angoli, { gcp: p.gcp, opacita: p.opacita, tipo: p.tipo, iniziali: p.angoliIniziali, origine: 'progetto' });
      ctx.inquadra(p.angoli, 17);
      ctx.messaggio('Progetto caricato dal file JSON.');
    } catch (errore) {
      ctx.avvisa(`Geoimage: non apro «${file.name}»: ${errore.message}`);
    }
  });

  // all'avvio: se c'è un progetto salvato e la sua immagine, torna sulla mappa
  async function ripristina() {
    const p = leggi(storage);
    if (!p || !dati) return;
    try {
      const dataUrl = await dati.leggi(ID_IMMAGINE);
      if (typeof dataUrl !== 'string') return elimina(storage); // i parametri senza immagine non servono
      const schermo = await preparaSchermo(dataUrl);
      ctx.caricaImmagine({ dataUrl, nome: p.nome, larghezza: p.larghezza, altezza: p.altezza }, schermo, p.angoli, { gcp: p.gcp, opacita: p.opacita, tipo: p.tipo, iniziali: p.angoliIniziali, origine: 'ripristino' });
    } catch {
      /* immagine rovinata o archivio non raggiungibile: si riparte vuoti, il progetto vecchio non blocca nulla */
    }
  }

  return { ripristina, salvaOra };
}
```

- [ ] **Step 7: Collegalo in `index.js`**

```js
import { collegaGcp } from './gcp.js';
import { collegaSessione } from './sessione.js';
```

```js
  collegaGcp(ctx);
  const sessione = collegaSessione(ctx);
```

e nel valore restituito sostituisci `async ripristina() {},` con:

```js
    ripristina: sessione.ripristina,
```

- [ ] **Step 8: Verifica nel browser**

Run: `python3 -m pytest tests/test_geoimage.py -x -q`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add js/geoimage/archivio.js js/geoimage/progetto.js js/geoimage/sessione.js js/geoimage/index.js tests/js/geoimage-archivio.test.mjs tests/js/geoimage-progetto.test.mjs tests/test_geoimage.py
git commit -m "feat(geoimage): progetto JSON di Geoimage e memoria tra le sessioni

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---
### Task 14: GeoTIFF (ricampionamento e compressione LZW)

**Files:**
- Create: `js/geoimage/export-geotiff.js`
- Test: `tests/js/geoimage-geotiff.test.mjs`

**Interfaces:**
- Consumes: `applica`, `inversa` (Task 2).
- Produces: `SR` (definizioni proj4 di EPSG 4326, 32632, 32633, 3857); `definisciSr(proj4)`; `campionaVicino`, `campionaBilineare` `(dati, W, H, px, py) → [r,g,b] | null`; `riproietta({ proj4, t, imgData, srcW, srcH, sc, epsg, maxRes, campiona, progresso? }) → Promise<{ W, H, rgb, originX, originY, pixSizeX, pixSizeY }>`; `lzwComprimi(Uint8Array) → Uint8Array`; `scriviTiffNordSu(...)`, `scriviTiffAffine(...)`, `scriviGeoTiff(W, H, rgb, georef, compressione)`; `creaGeoTiff({ proj4, t, imgData, srcW, srcH, sc, epsg, maxRes, campiona, compressione, progresso? }) → Promise<{ W, H, buffer }>`.

Nota di fondo: Geoimage offriva «LZW (raccomandata)» ma non comprimeva mai: caricava `geotiff.js` con `import()`, e quel file è un modulo UMD che così non esporta nulla, quindi usava sempre il writer minimo senza compressione. Qui il writer minimo sa scrivere LZW davvero e `geotiff.js` non serve.

- [ ] **Step 1: Scrivi il test che fallisce**

Crea `tests/js/geoimage-geotiff.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { campionaVicino, campionaBilineare, riproietta, lzwComprimi, scriviTiffNordSu, scriviTiffAffine, scriviGeoTiff, creaGeoTiff, definisciSr } from '../../js/geoimage/export-geotiff.js';

// immagine 4×2: pixel (x, y) = [x*10, y*100, 5, 255]
const rgba = (W, H) => { const d = new Uint8ClampedArray(W * H * 4); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) d.set([x * 10, y * 100, 5, 255], (y * W + x) * 4); return d; };
// proj4 finto: identità (entrambi i sistemi sono «gradi» nel test)
const proj4 = Object.assign((da, a, [x, y]) => [x, y], { defs: () => {} });

test('campionaVicino legge il pixel più vicino e dà null fuori dall\'immagine', () => {
  const d = rgba(4, 2);
  assert.deepEqual(campionaVicino(d, 4, 2, 2.2, 0.9), [20, 100, 5]);
  assert.equal(campionaVicino(d, 4, 2, 4, 0), null);
  assert.equal(campionaVicino(d, 4, 2, -1, 0), null);
});

test('campionaBilineare interpola tra i pixel e dà null fuori', () => {
  const d = rgba(4, 2);
  assert.deepEqual(campionaBilineare(d, 4, 2, 0.5, 0).map(Math.round), [5, 0, 5]);
  assert.equal(campionaBilineare(d, 4, 2, 9, 0), null);
});

test('definisciSr registra i 4 sistemi di riferimento', () => {
  const visti = [];
  definisciSr({ defs: (nome) => visti.push(nome) });
  assert.deepEqual(visti, ['EPSG:3857', 'EPSG:4326', 'EPSG:32632', 'EPSG:32633']);
});

test('riproietta con identità: l\'immagine esce intera e orientata nord-su', async () => {
  const W = 8, H = 4;
  const t = { a: 0.001, b: 0, c: 13, d: 0, e: -0.001, f: 38 }; // x → est, y → sud
  const r = await riproietta({ proj4, t, imgData: rgba(W, H), srcW: W, srcH: H, sc: 1, epsg: 3857, maxRes: 100, campiona: campionaVicino });
  assert.equal(r.W, 8); assert.equal(r.H, 4);
  assert.ok(Math.abs(r.originX - 13) < 1e-9 && Math.abs(r.originY - 38) < 1e-9);
  const px = (x, y) => [...r.rgb.slice((y * r.W + x) * 3, (y * r.W + x) * 3 + 3)];
  assert.ok(px(7, 0)[0] > px(0, 0)[0], 'il rosso cresce verso est (x dell\'immagine)');
  assert.ok(px(0, 3)[1] > px(0, 0)[1], 'il verde cresce verso sud (y dell\'immagine): nord in alto');
});

test('riproietta rispetta la risoluzione massima', async () => {
  const t = { a: 0.001, b: 0, c: 13, d: 0, e: -0.001, f: 38 };
  const r = await riproietta({ proj4, t, imgData: rgba(8, 4), srcW: 8, srcH: 4, sc: 1, epsg: 3857, maxRes: 4, campiona: campionaVicino });
  assert.equal(Math.max(r.W, r.H), 4);
});

test('writer nord-su: intestazione TIFF little-endian, dimensioni e dati dei pixel', () => {
  const rgb = new Uint8Array([1, 2, 3, 4, 5, 6]); // 2×1
  const buf = scriviTiffNordSu(2, 1, rgb, 13, 38, 0.001, 0.001, 4326);
  const dv = new DataView(buf);
  assert.equal(dv.getUint16(0, true), 0x4949);
  assert.equal(dv.getUint16(2, true), 42);
  assert.equal(dv.getUint16(8, true), 13, '13 voci nell\'IFD');
  assert.deepEqual([...new Uint8Array(buf).slice(-6)], [1, 2, 3, 4, 5, 6]);
});

test('writer affine: tag ModelTransformation con la trasformazione e dati in coda', () => {
  const rgb = new Uint8Array([9, 8, 7]);
  const buf = scriviTiffAffine(1, 1, rgb, { a: 0.5, b: 0, c: 13, d: 0, e: -0.5, f: 38 });
  const dv = new DataView(buf);
  assert.equal(dv.getUint16(8, true), 12);
  assert.deepEqual([...new Uint8Array(buf).slice(-3)], [9, 8, 7]);
  const off = 8 + 2 + 12 * 12 + 4 + 6; // dopo IFD e BitsPerSample
  assert.equal(dv.getFloat64(off, true), 0.5);
  assert.equal(dv.getFloat64(off + 3 * 8, true), 13);
});

// decodificatore LZW dei TIFF scritto dalla specifica (TIFF 6.0, sezione 13): serve a verificare il compressore
function lzwDecomprimi(dati) {
  const out = [];
  let tabella = [], larghezza = 9, buffer = 0, nBit = 0, i = 0, precedente = null;
  const reset = () => { tabella = Array.from({ length: 256 }, (_, k) => [k]); tabella.push(null, null); larghezza = 9; precedente = null; };
  reset();
  for (;;) {
    while (nBit < larghezza && i < dati.length) { buffer = (buffer << 8) | dati[i++]; nBit += 8; }
    if (nBit < larghezza) break;
    const codice = (buffer >>> (nBit - larghezza)) & ((1 << larghezza) - 1);
    nBit -= larghezza; buffer &= (1 << nBit) - 1;
    if (codice === 257) break;
    if (codice === 256) { reset(); continue; }
    let voce;
    if (codice < tabella.length) voce = tabella[codice];
    else voce = [...precedente, precedente[0]];
    out.push(...voce);
    if (precedente) tabella.push([...precedente, voce[0]]);
    precedente = voce;
    // «early change»: la larghezza sale un codice prima del naturale
    if (larghezza < 12 && tabella.length >= (1 << larghezza) - 1) larghezza++;
  }
  return Uint8Array.from(out);
}

test('LZW: i dati ripetitivi si comprimono e tornano identici (anche oltre la tabella da 4096 codici)', () => {
  const ripetitivo = new Uint8Array(5000).map((_, k) => (k >> 4) & 7);
  const c = lzwComprimi(ripetitivo);
  assert.ok(c.length < ripetitivo.length / 2, `${c.length} byte per ${ripetitivo.length}`);
  assert.deepEqual([...lzwDecomprimi(c)], [...ripetitivo]);
  // rumore pseudo-casuale: riempie la tabella più volte e forza i Clear
  let seme = 12345;
  const rumore = new Uint8Array(60000).map(() => { seme = (seme * 1103515245 + 12345) & 0x7fffffff; return seme >> 16; });
  assert.deepEqual([...lzwDecomprimi(lzwComprimi(rumore))], [...rumore]);
});

test('LZW: dati vuoti e di un solo byte', () => {
  assert.deepEqual([...lzwDecomprimi(lzwComprimi(new Uint8Array(0)))], []);
  assert.deepEqual([...lzwDecomprimi(lzwComprimi(Uint8Array.of(7)))], [7]);
});

test('i writer scrivono Compression = 5 e la strip compressa quando richiesto', () => {
  const rgb = new Uint8Array(30 * 20 * 3).fill(9);
  const buf = scriviTiffNordSu(30, 20, rgb, 13, 38, 0.001, 0.001, 4326, 5);
  const dv = new DataView(buf);
  const compressione = [...Array(13).keys()].map(k => [dv.getUint16(10 + k * 12, true), dv.getUint32(10 + k * 12 + 8, true)]).find(([tag]) => tag === 259)[1];
  assert.equal(compressione, 5);
  assert.ok(buf.byteLength < 8 + 2 + 13 * 12 + 4 + rgb.length, 'più piccolo di quello non compresso');
  const affine = scriviTiffAffine(30, 20, rgb, { a: 1, b: 0, c: 0, d: 0, e: 1, f: 0 }, 5);
  assert.ok(affine.byteLength < 8 + 2 + 12 * 12 + 4 + 6 + 128 + 40 + rgb.length);
});

test('scriviGeoTiff sceglie il writer dal tipo di georeferenza', () => {
  const rgb = new Uint8Array([1, 2, 3]);
  assert.equal(new DataView(scriviGeoTiff(1, 1, rgb, { type: 'affine', t: { a: 1, b: 0, c: 0, d: 0, e: 1, f: 0 } }, 1)).getUint16(8, true), 12);
  assert.equal(new DataView(scriviGeoTiff(1, 1, rgb, { type: 'northup', epsg: 3857, originX: 0, originY: 0, pixSizeX: 1, pixSizeY: 1 }, 1)).getUint16(8, true), 13);
});

test('creaGeoTiff in EPSG:4326 con affine incorpora la trasformazione scalata senza ricampionare', async () => {
  const t = { a: 0.002, b: 0, c: 13, d: 0, e: -0.002, f: 38 };
  const r = await creaGeoTiff({ proj4, t, imgData: rgba(4, 2), srcW: 4, srcH: 2, sc: 0.5, epsg: 4326, maxRes: 100, campiona: campionaVicino, compressione: 1 });
  assert.equal(r.W, 4);
  const dv = new DataView(r.buffer);
  assert.equal(dv.getUint16(8, true), 12, 'writer affine');
  const trOff = 8 + 2 + 12 * 12 + 4 + 6;
  assert.equal(dv.getFloat64(trOff, true), 0.004, 'a / sc');
});
```

- [ ] **Step 2: Verifica che fallisca**

Run: `node --test tests/js/geoimage-geotiff.test.mjs`
Expected: FAIL con `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Scrivi l'implementazione**

Crea `js/geoimage/export-geotiff.js`:

```js
// js/geoimage/export-geotiff.js
// GeoTIFF: ricampiona l'immagine su una griglia nord-su nel sistema di riferimento scelto e la scrive con un writer minimo,
// con compressione LZW o senza. Portato da Geoimage (che offriva l'LZW ma in pratica non comprimeva: qui sì).
import { applica, inversa } from './trasformazioni.js';

export const SR = {
  4326: '+proj=longlat +datum=WGS84 +no_defs',
  32632: '+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs',
  32633: '+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs',
  3857: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +no_defs',
};

export function definisciSr(proj4) {
  for (const [epsg, def] of Object.entries(SR)) proj4.defs(`EPSG:${epsg}`, def);
}

export function campionaVicino(d, W, H, px, py) {
  const x = Math.round(px), y = Math.round(py);
  if (x < 0 || y < 0 || x >= W || y >= H) return null;
  const i = (y * W + x) * 4;
  return [d[i], d[i + 1], d[i + 2]];
}

export function campionaBilineare(d, W, H, px, py) {
  if (px < -0.5 || py < -0.5 || px > W - 0.5 || py > H - 0.5) return null;
  const x0 = Math.max(0, Math.min(W - 1, Math.floor(px))), y0 = Math.max(0, Math.min(H - 1, Math.floor(py)));
  const x1 = Math.min(x0 + 1, W - 1), y1 = Math.min(y0 + 1, H - 1);
  const fx = Math.max(0, Math.min(1, px - x0)), fy = Math.max(0, Math.min(1, py - y0));
  const i00 = (y0 * W + x0) * 4, i10 = (y0 * W + x1) * 4, i01 = (y1 * W + x0) * 4, i11 = (y1 * W + x1) * 4;
  return [0, 1, 2].map(c => d[i00 + c] * (1 - fx) * (1 - fy) + d[i10 + c] * fx * (1 - fy) + d[i01 + c] * (1 - fx) * fy + d[i11 + c] * fx * fy);
}

// Ricampiona sulla griglia nord-su di `epsg`. `t` lavora sui pixel dell'immagine originale; `sc` è il fattore con cui
// l'immagine di partenza (imgData, srcW×srcH) è stata ridotta. `progresso(percentuale)` è facoltativo.
export async function riproietta({ proj4, t, imgData, srcW, srcH, sc, epsg, maxRes, campiona, progresso }) {
  const DA = 'EPSG:4326', A = `EPSG:${epsg}`;
  const proietta = (px, py) => { const g = applica(t, px / sc, py / sc); return proj4(DA, A, [g.lng, g.lat]); };
  const angoli = [[0, 0], [srcW, 0], [0, srcH], [srcW, srcH]].map(([px, py]) => proietta(px, py));
  const minX = Math.min(...angoli.map(c => c[0])), maxX = Math.max(...angoli.map(c => c[0]));
  const minY = Math.min(...angoli.map(c => c[1])), maxY = Math.max(...angoli.map(c => c[1]));

  // dimensione del pixel d'uscita: conserva la risoluzione della sorgente
  const p00 = proietta(0, 0), p10 = proietta(srcW, 0), p01 = proietta(0, srcH);
  const pixSize = Math.min(Math.hypot(p10[0] - p00[0], p10[1] - p00[1]) / srcW, Math.hypot(p01[0] - p00[0], p01[1] - p00[1]) / srcH);
  let W = Math.max(1, Math.round((maxX - minX) / pixSize)), H = Math.max(1, Math.round((maxY - minY) / pixSize));
  if (W > maxRes || H > maxRes) {
    const f = maxRes / Math.max(W, H);
    W = Math.round(W * f); H = Math.round(H * f);
  }
  const pixSizeX = (maxX - minX) / W, pixSizeY = (maxY - minY) / H;
  const rgb = new Uint8Array(W * H * 3);

  // riga per riga: si proiettano il bordo sinistro e destro e si interpola in mezzo
  for (let iy = 0; iy < H; iy++) {
    const y = maxY - (iy + 0.5) * pixSizeY;
    const wL = proj4(A, DA, [minX + 0.5 * pixSizeX, y]), wR = proj4(A, DA, [minX + (W - 0.5) * pixSizeX, y]);
    const sL = inversa(t, wL[0], wL[1]), sR = inversa(t, wR[0], wR[1]);
    if (!sL || !sR) continue;
    for (let ix = 0; ix < W; ix++) {
      const a = W > 1 ? ix / (W - 1) : 0;
      const v = campiona(imgData, srcW, srcH, (sL.px + a * (sR.px - sL.px)) * sc, (sL.py + a * (sR.py - sL.py)) * sc);
      if (!v) continue;
      const o = (iy * W + ix) * 3;
      rgb[o] = Math.round(v[0]); rgb[o + 1] = Math.round(v[1]); rgb[o + 2] = Math.round(v[2]);
    }
    if (iy % 25 === 0) {
      progresso?.(Math.round(iy / H * 100));
      await new Promise(r => setTimeout(r, 0)); // lascia respirare l'interfaccia
    }
  }
  return { W, H, rgb, originX: minX, originY: maxY, pixSizeX, pixSizeY };
}

// Compressione LZW dei TIFF (Compression = 5): codici da 9 a 12 bit, bit più significativo per primo, «early change».
// Stessa regola del codificatore di libtiff: la larghezza sale quando il prossimo codice libero supera 2^n - 1.
export function lzwComprimi(dati) {
  let out = new Uint8Array(Math.max(1024, dati.length >> 1));
  let n = 0, buffer = 0, nBit = 0;
  const scrivi = (codice, larghezza) => {
    buffer = (buffer << larghezza) | codice;
    nBit += larghezza;
    while (nBit >= 8) {
      if (n === out.length) { const piu = new Uint8Array(out.length * 2); piu.set(out); out = piu; }
      out[n++] = (buffer >>> (nBit - 8)) & 0xFF;
      nBit -= 8;
    }
    buffer &= (1 << nBit) - 1;
  };
  let tabella = new Map(), libero = 258, larghezza = 9;
  scrivi(256, larghezza); // Clear
  if (dati.length) {
    let prefisso = dati[0];
    for (let i = 1; i < dati.length; i++) {
      const c = dati[i], chiave = prefisso * 256 + c;
      const trovato = tabella.get(chiave);
      if (trovato !== undefined) { prefisso = trovato; continue; }
      scrivi(prefisso, larghezza);
      tabella.set(chiave, libero++);
      if (libero === 4094) { scrivi(256, larghezza); tabella = new Map(); libero = 258; larghezza = 9; } // tabella piena: si riparte
      else if (libero > (1 << larghezza) - 1) larghezza++;
      prefisso = c;
    }
    scrivi(prefisso, larghezza);
  }
  scrivi(257, larghezza); // EOI
  if (nBit) {
    if (n === out.length) { const piu = new Uint8Array(out.length + 1); piu.set(out); out = piu; }
    out[n++] = (buffer << (8 - nBit)) & 0xFF;
  }
  return out.slice(0, n);
}

// Writer minimo nord-su. `compressione`: 1 = nessuna, 5 = LZW.
export function scriviTiffNordSu(W, H, rgb, originX, originY, pixSizeX, pixSizeY, epsg, compressione = 1) {
  const strip = compressione === 5 ? lzwComprimi(rgb) : rgb;
  const geografico = epsg === 4326;
  const nChiavi = geografico ? 4 : 3;
  const N = 13, HDR = 8, IFD = 2 + N * 12 + 4;
  let off = HDR + IFD;
  const bpsOff = off; off += 6;
  const scOff = off; off += 24;
  const tpOff = off; off += 48;
  const gkOff = off; off += (nChiavi + 1) * 4 * 2;
  const pxOff = off; off += strip.length;
  const buf = new ArrayBuffer(off), dv = new DataView(buf), by = new Uint8Array(buf);
  dv.setUint8(0, 0x49); dv.setUint8(1, 0x49); dv.setUint16(2, 42, true); dv.setUint32(4, HDR, true);
  let p = HDR;
  dv.setUint16(p, N, true); p += 2;
  const voce = (tag, tipo, n, val) => { dv.setUint16(p, tag, true); p += 2; dv.setUint16(p, tipo, true); p += 2; dv.setUint32(p, n, true); p += 4; dv.setUint32(p, val, true); p += 4; };
  voce(256, 3, 1, W); voce(257, 3, 1, H); voce(258, 3, 3, bpsOff);
  voce(259, 3, 1, compressione); voce(262, 3, 1, 2); voce(273, 4, 1, pxOff);
  voce(277, 3, 1, 3); voce(278, 4, 1, H); voce(279, 4, 1, strip.length);
  voce(284, 3, 1, 1);
  voce(33550, 12, 3, scOff); voce(33922, 12, 6, tpOff); voce(34735, 3, (nChiavi + 1) * 4, gkOff);
  dv.setUint32(p, 0, true);
  [8, 8, 8].forEach((v, i) => dv.setUint16(bpsOff + i * 2, v, true));
  [pixSizeX, pixSizeY, 0].forEach((v, i) => dv.setFloat64(scOff + i * 8, v, true));
  [0, 0, 0, originX, originY, 0].forEach((v, i) => dv.setFloat64(tpOff + i * 8, v, true));
  const chiavi = geografico
    ? [1, 1, 0, 4, 1024, 0, 1, 2, 1025, 0, 1, 1, 2048, 0, 1, 4326, 2054, 0, 1, 9102]
    : [1, 1, 0, 3, 1024, 0, 1, 1, 1025, 0, 1, 1, 3072, 0, 1, epsg];
  chiavi.forEach((v, i) => dv.setUint16(gkOff + i * 2, v, true));
  by.set(strip, pxOff);
  return buf;
}

// Writer minimo affine in WGS84: ModelTransformationTag gestisce anche la rotazione. `compressione`: 1 = nessuna, 5 = LZW.
export function scriviTiffAffine(W, H, rgb, t, compressione = 1) {
  const strip = compressione === 5 ? lzwComprimi(rgb) : rgb;
  const N = 12, HDR = 8, IFD = 2 + N * 12 + 4;
  let off = HDR + IFD;
  const bpsOff = off; off += 6;
  const trOff = off; off += 128;
  const gkOff = off; off += 40;
  const pxOff = off; off += strip.length;
  const buf = new ArrayBuffer(off), dv = new DataView(buf), by = new Uint8Array(buf);
  dv.setUint8(0, 0x49); dv.setUint8(1, 0x49); dv.setUint16(2, 42, true); dv.setUint32(4, HDR, true);
  let p = HDR;
  dv.setUint16(p, N, true); p += 2;
  const voce = (tag, tipo, n, val) => { dv.setUint16(p, tag, true); p += 2; dv.setUint16(p, tipo, true); p += 2; dv.setUint32(p, n, true); p += 4; dv.setUint32(p, val, true); p += 4; };
  voce(256, 3, 1, W); voce(257, 3, 1, H); voce(258, 3, 3, bpsOff);
  voce(259, 3, 1, compressione); voce(262, 3, 1, 2); voce(273, 4, 1, pxOff);
  voce(277, 3, 1, 3); voce(278, 4, 1, H); voce(279, 4, 1, strip.length);
  voce(284, 3, 1, 1); voce(34264, 12, 16, trOff); voce(34735, 3, 20, gkOff);
  dv.setUint32(p, 0, true);
  [8, 8, 8].forEach((v, i) => dv.setUint16(bpsOff + i * 2, v, true));
  [t.a, t.b, 0, t.c, t.d, t.e, 0, t.f, 0, 0, 1, 0, 0, 0, 0, 1].forEach((v, i) => dv.setFloat64(trOff + i * 8, v, true));
  [1, 1, 0, 4, 1024, 0, 1, 2, 1025, 0, 1, 1, 2048, 0, 1, 4326, 2054, 0, 1, 9102].forEach((v, i) => dv.setUint16(gkOff + i * 2, v, true));
  by.set(strip, pxOff);
  return buf;
}

// `georef` è { type: 'affine', t } oppure { type: 'northup', epsg, originX, originY, pixSizeX, pixSizeY }
export const scriviGeoTiff = (W, H, rgb, georef, compressione) => (georef.type === 'affine'
  ? scriviTiffAffine(W, H, rgb, georef.t, compressione)
  : scriviTiffNordSu(W, H, rgb, georef.originX, georef.originY, georef.pixSizeX, georef.pixSizeY, georef.epsg, compressione));

// Tutta la pipeline: `imgData` sono i pixel RGBA dell'immagine ridotta a srcW×srcH (fattore sc).
// Con EPSG:4326 e affine si incorpora la trasformazione senza ricampionare; altrimenti si riproietta.
export async function creaGeoTiff({ proj4, t, imgData, srcW, srcH, sc, epsg, maxRes, campiona, compressione, progresso }) {
  let W, H, rgb, georef;
  if (epsg === 4326 && t.order !== 2) {
    W = srcW; H = srcH;
    rgb = new Uint8Array(W * H * 3);
    for (let i = 0; i < W * H; i++) { rgb[i * 3] = imgData[i * 4]; rgb[i * 3 + 1] = imgData[i * 4 + 1]; rgb[i * 3 + 2] = imgData[i * 4 + 2]; }
    georef = { type: 'affine', t: { a: t.a / sc, b: t.b / sc, c: t.c, d: t.d / sc, e: t.e / sc, f: t.f } };
  } else {
    const r = await riproietta({ proj4, t, imgData, srcW, srcH, sc, epsg, maxRes, campiona, progresso });
    ({ W, H, rgb } = r);
    georef = { type: 'northup', epsg, originX: r.originX, originY: r.originY, pixSizeX: r.pixSizeX, pixSizeY: r.pixSizeY };
  }
  return { W, H, buffer: scriviGeoTiff(W, H, rgb, georef, compressione) };
}
```

- [ ] **Step 4: Verifica che passi**

Run: `node --test tests/js/geoimage-geotiff.test.mjs`
Expected: PASS. Il test «LZW» ricostruisce i dati con un decodificatore scritto dalla specifica TIFF; la prova definitiva sul file è il Task 15 (GDAL).

- [ ] **Step 5: Commit**

```bash
git add js/geoimage/export-geotiff.js tests/js/geoimage-geotiff.test.mjs
git commit -m "feat(geoimage): GeoTIFF con ricampionamento, sistemi di riferimento e compressione LZW

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 15: Sezione Export (librerie, KMZ, GeoTIFF, .points, world file, GeoJSON)

**Files:**
- Create: `js/geoimage/librerie.js`, `js/geoimage/esporta.js`, `js/vendor/proj4.js`, `js/vendor/jszip.min.js`, `js/vendor/LICENSE-proj4.txt`, `js/vendor/LICENSE-jszip.txt`
- Modify: `js/geoimage/index.js`
- Test: `tests/test_geoimage.py`

**Interfaces:**
- Consumes: tutto l'export puro (Task 12 e 14), `calcolaTrasformazione`, `calcolaAffine`, `minimoGcp` (Task 2), `scarica` (Task 12), `ctx` (Task 8).
- Produces: `jszip()`, `proj4()` (promesse che caricano lo script UMD al primo uso); `collegaEsporta(ctx)`. Abilitazioni come in Geoimage: KMZ e GeoTIFF con immagine e GCP sufficienti per il tipo; `.points` e GeoJSON da 1 GCP; world file da 3 GCP; Esporta JSON con un'immagine.

- [ ] **Step 1: Scarica le librerie e le licenze**

```bash
curl -fsSL -o js/vendor/proj4.js https://cdn.jsdelivr.net/npm/proj4@2.11.0/dist/proj4.js
curl -fsSL -o js/vendor/jszip.min.js https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js
curl -fsSL -o js/vendor/LICENSE-proj4.txt https://cdn.jsdelivr.net/npm/proj4@2.11.0/LICENSE.md
curl -fsSL -o js/vendor/LICENSE-jszip.txt https://cdn.jsdelivr.net/npm/jszip@3.10.1/LICENSE.markdown
ls -la js/vendor/proj4.js js/vendor/jszip.min.js
```

Expected: `proj4.js` ~91 KB, `jszip.min.js` ~98 KB.

- [ ] **Step 2: Scrivi il test che fallisce**

Aggiungi in fondo a `tests/test_geoimage.py` (`_compressione` e `_controlla_con_gdal` leggono i file scaricati: il secondo verifica con GDAL compressione, sistema di riferimento e pixel):

```python


def _compressione(tiff):
    """Valore del tag Compression (259) nel primo IFD di un TIFF little-endian."""
    ifd = struct.unpack_from("<I", tiff, 4)[0]
    for i in range(struct.unpack_from("<H", tiff, ifd)[0]):
        tag, tipo, n, valore = struct.unpack_from("<HHII", tiff, ifd + 2 + i * 12)
        if tag == 259:
            return valore & 0xFFFF
    return None


def _controlla_con_gdal(percorso, larghezza, altezza, epsg):
    """Il file si apre con GDAL, ha il sistema di riferimento giusto, i pixel decodificati e un'estensione plausibile (Palermo)."""
    gdal = pytest.importorskip("osgeo.gdal")
    ds = gdal.Open(str(percorso))
    assert ds is not None
    assert ds.GetMetadata("IMAGE_STRUCTURE").get("COMPRESSION") == "LZW"
    if larghezza:
        assert (ds.RasterXSize, ds.RasterYSize) == (larghezza, altezza)
    srs = ds.GetSpatialRef()
    assert f"{srs.GetAuthorityName(None)}:{srs.GetAuthorityCode(None)}" == epsg
    banda = ds.GetRasterBand(1).ReadAsArray()
    assert banda.min() != banda.max(), "i pixel si decodificano (il gradiente non è piatto)"
    gt = ds.GetGeoTransform()
    if epsg == "EPSG:4326":
        assert 13.0 < gt[0] < 13.7 and 37.9 < gt[3] < 38.4


def test_export_qgis_kmz_world_file_geojson_e_geotiff(apri, tmp_path):
    v = apri()
    _apri_geoimage(v)
    _carica(v)
    _tre_gcp(v)
    for selettore in ["#gi-qgis", "#gi-kmz", "#gi-mondo", "#gi-geojson"]:
        assert v.js(f"!document.querySelector('{selettore}').disabled"), selettore
    with v.page.expect_download() as d:
        v.page.click("#gi-qgis")
    assert d.value.suggested_filename == "gcp_qgis.points"
    assert open(d.value.path()).read().startswith("mapX,mapY,sourceX,sourceY,enable\n")
    with v.page.expect_download() as d:
        v.page.click("#gi-kmz")
    assert d.value.suggested_filename == "storica_georef.kmz"
    assert open(d.value.path(), "rb").read(2) == b"PK"
    with v.page.expect_download() as d:
        v.page.click("#gi-mondo")
    assert d.value.suggested_filename == "storica.pgw"
    with v.page.expect_download() as d:
        v.page.click("#gi-geojson")
    assert d.value.suggested_filename == "storica_gcp.geojson"
    v.page.click("#gi-geotiff")
    assert v.page.is_visible("#gi-gtiff")
    with v.page.expect_download(timeout=30000) as d:
        v.page.click("#gi-gtiff-vai")
    assert d.value.suggested_filename == "storica_georef_EPSG4326.tif"
    dati = open(d.value.path(), "rb").read()
    assert dati[:4] == b"II*\x00"
    assert _compressione(dati) == 5, "compressione LZW come richiesto"
    _controlla_con_gdal(d.value.path(), 400, 300, "EPSG:4326")
    v.page.click("#gi-geotiff")
    v.page.select_option("#gi-gtiff-sr", "32633")
    with v.page.expect_download(timeout=30000) as d:
        v.page.click("#gi-gtiff-vai")
    assert d.value.suggested_filename == "storica_georef_EPSG32633.tif"
    _controlla_con_gdal(d.value.path(), None, None, "EPSG:32633")
    assert not any("geoimage" in e.lower() for e in v.errori), v.errori
```

- [ ] **Step 3: Verifica che fallisca**

Run: `python3 -m pytest tests/test_geoimage.py -x -q -k export`
Expected: FAIL (`#gi-qgis` resta disabilitato: nessuno ascolta i pulsanti).

- [ ] **Step 4: Scrivi il caricatore delle librerie**

Crea `js/geoimage/librerie.js`:

```js
// js/geoimage/librerie.js
// Le librerie dell'export (js/vendor/) si caricano solo al primo uso: l'avvio dell'app non cambia.
const url = nome => new URL(`../vendor/${nome}`, import.meta.url).href;
const caricate = new Map();
const unaVolta = (nome, carica) => {
  if (!caricate.has(nome)) caricate.set(nome, carica().catch(errore => { caricate.delete(nome); throw errore; }));
  return caricate.get(nome);
};

// script classico (UMD): definisce una variabile globale
const script = src => new Promise((ok, ko) => {
  const s = Object.assign(document.createElement('script'), { src, onload: ok, onerror: () => ko(new Error(`non riesco a caricare ${src}`)) });
  document.head.append(s);
});

export const jszip = () => unaVolta('jszip', async () => { await script(url('jszip.min.js')); return window.JSZip; });
export const proj4 = () => unaVolta('proj4', async () => { await script(url('proj4.js')); return window.proj4; });
```

- [ ] **Step 5: Scrivi la sezione Export**

Crea `js/geoimage/esporta.js`:

```js
// js/geoimage/esporta.js
// Sezione «Export»: KMZ, GeoTIFF (con le sue impostazioni), .points di QGIS, world file e GCP GeoJSON.
// Gli abilitati sono quelli di Geoimage: KMZ e GeoTIFF servono immagine e GCP sufficienti, il world file almeno 3 GCP.
import { nomeBase, puntiQgis, geojsonGcp, worldFile, estensioneWorldFile, creaKmz } from './export.js';
import { campionaVicino, campionaBilineare, definisciSr, creaGeoTiff } from './export-geotiff.js';
import { calcolaTrasformazione, calcolaAffine, minimoGcp } from './trasformazioni.js';
import { jszip, proj4 } from './librerie.js';
import { scarica } from './scarica.js';

const caricaImg = src => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ko(new Error('immagine non leggibile')); i.src = src; });

export function collegaEsporta(ctx) {
  const { $, stato } = ctx;
  const testo = (contenuto, tipo, nome) => scarica(new Blob([contenuto], { type: tipo }), nome);

  function aggiorna() {
    const img = !!stato.immagine;
    const ok = img && stato.gcp.length >= minimoGcp(stato.tipo);
    $('kmz').disabled = !ok;
    $('geotiff').disabled = !ok;
    $('qgis').disabled = stato.gcp.length < 1;
    $('mondo').disabled = !(img && stato.gcp.length >= 3);
    $('geojson').disabled = stato.gcp.length < 1;
    $('json-esporta').disabled = !img;
    if (!ok) $('gtiff').hidden = true;
  }
  ctx.sulCambio(aggiorna);

  $('kmz').addEventListener('click', async () => {
    try {
      const blob = await creaKmz(await jszip(), { nome: stato.immagine.nome, dataUrl: stato.immagine.dataUrl, angoli: stato.angoli, gcp: stato.gcp });
      scarica(blob, `${nomeBase(stato.immagine.nome)}_georef.kmz`);
      ctx.messaggio('KMZ esportato (immagine incorporata).');
    } catch (errore) { ctx.avvisa(`Geoimage: KMZ non creato: ${errore.message}`); }
  });
  $('qgis').addEventListener('click', () => { testo(puntiQgis(stato.gcp), 'text/plain', 'gcp_qgis.points'); ctx.messaggio('File dei GCP per il Georeferenziatore di QGIS esportato.'); });
  $('geojson').addEventListener('click', () => {
    testo(JSON.stringify(geojsonGcp(stato.gcp), null, 2), 'application/json', `${nomeBase(stato.immagine?.nome)}_gcp.geojson`);
    ctx.messaggio(`GeoJSON dei GCP esportato (${stato.gcp.length} punti).`);
  });
  $('mondo').addEventListener('click', () => {
    const t = calcolaAffine(stato.gcp);
    if (!t) return ctx.messaggio('Servono almeno 3 GCP non allineati per il world file.');
    const ext = estensioneWorldFile(stato.immagine.nome);
    testo(worldFile(t), 'text/plain', `${nomeBase(stato.immagine.nome)}.${ext}`);
    ctx.messaggio(`World file esportato (${ext}).`);
  });

  // GeoTIFF: prima si scelgono le impostazioni, poi si esporta
  const nota = () => {
    const epsg = Number($('gtiff-sr').value);
    $('gtiff-ricamp-gruppo').classList.toggle('gi-spento', epsg === 4326);
    $('gtiff-nota').textContent = epsg === 4326
      ? 'EPSG:4326: trasformazione affine incorporata nel file, nessun ricampionamento (con la poly2 l\'immagine si ricampiona).'
      : `I pixel vengono ricampionati (${$('gtiff-ricamp').selectedOptions[0].text}) per riproiettare l'immagine in EPSG:${epsg}.`;
  };
  $('geotiff').addEventListener('click', () => { $('gtiff').hidden = !$('gtiff').hidden; nota(); });
  $('gtiff-annulla').addEventListener('click', () => { $('gtiff').hidden = true; });
  $('gtiff-sr').addEventListener('change', nota);
  $('gtiff-ricamp').addEventListener('change', nota);
  $('gtiff-vai').addEventListener('click', async () => {
    const t = calcolaTrasformazione(stato.tipo, stato.gcp);
    if (!t || !stato.immagine) return ctx.messaggio(`Servono almeno ${minimoGcp(stato.tipo)} GCP per il GeoTIFF.`);
    const epsg = Number($('gtiff-sr').value), maxRes = Number($('gtiff-max').value), compressione = Number($('gtiff-compr').value);
    const campiona = $('gtiff-ricamp').value === 'nearest' ? campionaVicino : campionaBilineare;
    $('gtiff').hidden = true;
    $('geotiff').disabled = true;
    try {
      ctx.messaggio('Caricamento immagine…');
      const [p4, img] = await Promise.all([proj4(), caricaImg(stato.immagine.dataUrl)]);
      definisciSr(p4);
      let srcW = img.naturalWidth, srcH = img.naturalHeight, sc = 1;
      if (srcW > maxRes || srcH > maxRes) { sc = maxRes / Math.max(srcW, srcH); srcW = Math.round(srcW * sc); srcH = Math.round(srcH * sc); }
      const cv = Object.assign(document.createElement('canvas'), { width: srcW, height: srcH });
      const g = cv.getContext('2d');
      g.drawImage(img, 0, 0, srcW, srcH);
      const imgData = g.getImageData(0, 0, srcW, srcH).data;
      const r = await creaGeoTiff({
        proj4: p4, t, imgData, srcW, srcH, sc, epsg, maxRes, campiona, compressione,
        progresso: pct => ctx.messaggio(`Ricampionamento ${pct}%…`),
      });
      scarica(new Blob([r.buffer], { type: 'image/tiff' }), `${nomeBase(stato.immagine.nome)}_georef_EPSG${epsg}.tif`);
      ctx.messaggio(`GeoTIFF EPSG:${epsg} esportato — ${r.W}×${r.H} px.`);
    } catch (errore) {
      ctx.avvisa(`Geoimage: GeoTIFF non creato: ${errore.message}`);
    } finally {
      aggiorna();
    }
  });
}
```

- [ ] **Step 6: Collegala in `index.js`**

```js
import { collegaSessione } from './sessione.js';
import { collegaEsporta } from './esporta.js';
```

```js
  const sessione = collegaSessione(ctx);
  collegaEsporta(ctx);
```

- [ ] **Step 7: Verifica che passi**

Run: `python3 -m pytest tests/test_geoimage.py -x -q`
Expected: PASS. Il test export scarica davvero tutti e sei i file e apre i due GeoTIFF (EPSG:4326 e 32633) con GDAL: compressione LZW, dimensioni, SR e pixel decodificati.

- [ ] **Step 8: Commit**

```bash
git add js/geoimage/librerie.js js/geoimage/esporta.js js/geoimage/index.js js/vendor/proj4.js js/vendor/jszip.min.js js/vendor/LICENSE-proj4.txt js/vendor/LICENSE-jszip.txt tests/test_geoimage.py
git commit -m "feat(geoimage): sezione Export con KMZ, GeoTIFF, .points, world file e GeoJSON

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 16: Tab «Guida Geoimage» nel foglio Info

**Files:**
- Create: `js/geoimage/guida-contenuti.js`, `js/geoimage/guida.js`
- Modify: `js/core/catalogo.js`
- Test: `tests/js/geoimage-guida.test.mjs`, `tests/test_geoimage.py`

**Interfaces:**
- Produces: `SEZIONI` (array di `{ id, titolo, paragrafi?, passi?: [{ titolo, testo, elenco? }], elenco?, link? }`); `schedaGeoimage(doc = document, sezioni = SEZIONI) → HTMLElement`.

- [ ] **Step 1: Scrivi i test che falliscono**

Crea `tests/js/geoimage-guida.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { SEZIONI } from '../../js/geoimage/guida-contenuti.js';
import { schedaGeoimage } from '../../js/geoimage/guida.js';

test('le sezioni hanno id univoci e validi come ancora', () => {
  const ids = SEZIONI.map(s => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^[a-z0-9-]+$/);
});

test('ogni sezione ha titolo e almeno un contenuto, senza testi vuoti', () => {
  for (const s of SEZIONI) {
    assert.ok(s.titolo.trim(), `${s.id}: titolo`);
    assert.ok(s.paragrafi?.length || s.passi?.length || s.elenco?.length, `${s.id}: contenuto`);
    const testi = [...(s.paragrafi ?? []), ...(s.elenco ?? []), ...(s.passi ?? []).flatMap(p => [p.titolo, p.testo, ...(p.elenco ?? [])])];
    assert.ok(testi.every(t => t.trim().length > 3), `${s.id}: testi vuoti`);
  }
});

test('la guida copre le funzioni di Geoimage: GCP, allinea, RMSE, export, swipe, spotlight', () => {
  const tutto = JSON.stringify(SEZIONI);
  for (const parola of ['GCP', 'Allinea', 'RMSE', 'KMZ', 'GeoTIFF', 'World file', 'Swipe', 'Spotlight', 'MapWarper', 'Ctrl+Z']) assert.ok(tutto.includes(parola), parola);
});

// un document finto che conta i nodi
function docFinto() {
  const nodi = [];
  return {
    nodi,
    createElement(tag) {
      const e = { tag, figli: [], testo: '', append(...c) { this.figli.push(...c); }, set textContent(t) { this.testo = t; }, get textContent() { return this.testo; } };
      nodi.push(e);
      return e;
    },
  };
}

test('schedaGeoimage costruisce un titolo, una sezione per voce e un elenco per ogni passo con punti', () => {
  const doc = docFinto();
  const radice = schedaGeoimage(doc, SEZIONI);
  assert.equal(radice.figli[0].testo, 'Guida Geoimage');
  assert.equal(radice.figli.filter(n => n.tag === 'section').length, SEZIONI.length);
  assert.ok(doc.nodi.filter(n => n.tag === 'ol').length >= 3, 'i passi sono liste numerate');
});
```

Aggiungi in fondo a `tests/test_geoimage.py`:

```python


def test_il_foglio_info_ha_il_tab_guida_geoimage(apri):
    v = apri()
    v.attendi_pronto()
    v.page.set_viewport_size({"width": 1440, "height": 800})
    v.page.click("#apri-crediti")
    v.page.click("#tab-geoimage")
    assert v.page.is_visible("#tabpanel-geoimage")
    assert "Come georeferenziare" in v.page.inner_text("#tabpanel-geoimage")
    assert "Cosa cambia nel Digital Twin" in v.page.inner_text("#tabpanel-geoimage")
    assert not any("geoimage" in e.lower() for e in v.errori), v.errori
```

- [ ] **Step 2: Verifica che falliscano**

Run: `node --test tests/js/geoimage-guida.test.mjs`
Expected: FAIL con `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Scrivi il testo della guida**

Crea `js/geoimage/guida-contenuti.js` (adattato dalla guida di Geoimage, `index.html` righe 333-515 dell'app originale: via la ricerca dei luoghi e la mappa di base, maniglie con pulsante, tutto riferito al pannello del Twin):

```js
// js/geoimage/guida-contenuti.js
// Testo della guida di Geoimage (tab «Guida Geoimage» del foglio Info), adattato al pannello del Digital Twin.
// Ogni sezione ha un titolo e, a scelta, paragrafi, passi numerati ({ titolo, testo, elenco }) o un elenco puntato.
export const SEZIONI = [
  {
    id: 'cos-e',
    titolo: 'Cos’è Geoimage',
    paragrafi: [
      'Geoimage ti permette di sovrapporre una mappa storica (o qualsiasi immagine) alla cartografia moderna e di georeferenziarla, cioè di associarle coordinate geografiche reali tramite i Ground Control Points (GCP).',
      'Nel Digital Twin funziona sulla base cartografica di Palermo: apri il tab «Geoimage» nella barra a destra. L’idea e il codice vengono da Geoimage di @gbvitrano (github.com/gbvitrano/Geoimage).',
    ],
  },
  {
    id: 'georeferenziare',
    titolo: 'Come georeferenziare un’immagine',
    passi: [
      {
        titolo: 'Inquadra la zona',
        testo: 'Con la ricerca del Digital Twin (via, civico, quartiere) porta la mappa sull’area che l’immagine rappresenta, così l’immagine si carica già vicina al posto giusto.',
      },
      {
        titolo: 'Carica la mappa storica',
        testo: 'Trascina il file (JPG, PNG, WEBP, BMP) nel riquadro «Carica mappa storica», oppure clicca il riquadro per scegliere il file. L’immagine appare subito al centro della mappa, con le maniglie di posizionamento. Segue la mappa anche se la ruoti o la inclini in 3D.',
      },
      {
        titolo: 'Posiziona e orienta l’immagine',
        testo: 'Usa le maniglie direttamente sulla mappa:',
        elenco: [
          'Cerchio arancione al centro: trascina per spostare l’intera immagine.',
          'Cerchio con la freccia sopra il lato nord: trascina per ruotare.',
          'Maniglie agli angoli, in due modalità che cambi con il pulsante «Maniglie: scala / deforma»: in modalità scala (quadratini arancioni) ridimensionano l’immagine in proporzione tenendo fermo l’angolo opposto; in modalità deforma (diamanti blu) ogni angolo si muove liberamente, utile per le mappe storiche non rettangolari.',
          'Per spostamenti precisi usa le frecce, la rotazione di 5° e la scala del 10 % nella sezione «Posiziona overlay».',
          'Annulla e Ripeti (oppure Ctrl+Z e Ctrl+Y; con Maiusc fanno 10 passi) ripercorrono fino a 50 posizioni. La cronologia riparte quando carichi un’altra immagine.',
        ],
      },
      {
        titolo: 'Aggiungi i GCP (due clic per ogni punto)',
        testo: 'Premi «Aggiungi GCP» (oppure il tasto G). Per ogni punto di controllo servono due clic direttamente sulla mappa:',
        elenco: [
          'Passo 1, sull’immagine storica: clicca un punto riconoscibile (un incrocio, un edificio, un monumento). Compare un cerchio arancione che conferma il punto scelto.',
          'Passo 2, sulla mappa di base: clicca lo stesso luogo nella cartografia moderna. Il GCP è aggiunto e il cerchio diventa rosso e numerato.',
          'Usa lo Swipe o lo Spotlight per vedere la base sotto l’immagine e cliccare con precisione al passo 2.',
          'Esc annulla il passo 1 in attesa; premilo ancora per uscire dalla modalità GCP. Finché sei in questa modalità i clic sulla mappa non aprono la scheda dei luoghi.',
          'Aggiungi almeno 3 GCP, meglio se distribuiti agli angoli dell’area coperta dall’immagine.',
        ],
      },
      {
        titolo: 'Allinea l’immagine ai GCP',
        testo: 'Con 3 o più GCP si abilita «Allinea immagine ai GCP». L’app calcola la trasformazione (affine, oppure polinomiale di 2° grado con almeno 6 GCP) e sposta l’immagine nelle coordinate giuste. Puoi ripetere l’operazione aggiungendo altri GCP.',
      },
      {
        titolo: 'Controlla l’errore (RMSE)',
        testo: 'Dal terzo GCP compare l’RMSE, l’errore medio in metri: più è basso, meglio è. Nella tabella ogni GCP ha il suo residuo, colorato in verde, arancione o rosso. Se l’errore è alto, riposiziona i GCP meno precisi (trascinali sulla mappa) o aggiungine altri.',
      },
      {
        titolo: 'Esporta il risultato',
        testo: 'Dalla sezione «Export» scarichi:',
        elenco: [
          'KMZ: per Google Earth, QGIS e ArcGIS, con l’immagine incorporata.',
          'GeoTIFF: raster con le coordinate incorporate, pronto per QGIS, ArcGIS e GDAL. Scegli sistema di riferimento (WGS 84, UTM 32N o 33N, Web Mercator), ricampionamento, risoluzione massima e compressione LZW.',
          '.points: i GCP per il Georeferenziatore di QGIS.',
          'World file: la trasformazione affine in sei righe (richiede almeno 3 GCP).',
          'GCP GeoJSON: i punti di controllo come dati geografici.',
          'JSON: salva e riapre l’intero progetto; è lo stesso formato di Geoimage.',
        ],
      },
    ],
  },
  {
    id: 'swipe',
    titolo: 'Come usare lo Swipe',
    paragrafi: ['Lo Swipe divide la mappa in due metà con una linea verticale scorrevole: a sinistra vedi l’immagine storica, a destra la sola cartografia di base.'],
    passi: [
      { titolo: 'Attivalo', testo: 'Nella sezione «Confronto visivo» premi «Swipe»: sulla mappa compare la linea con la maniglia centrale.' },
      { titolo: 'Trascina la linea', testo: 'Trascina la maniglia per spostare la divisione tra il 2 % e il 98 % della larghezza della mappa.' },
      { titolo: 'Naviga normalmente', testo: 'Con lo Swipe attivo puoi ancora spostare e ingrandire la mappa: la linea resta ferma e la divisione si aggiorna in tempo reale. Per spostare la mappa tieni il cursore fuori dalla maniglia.' },
      { titolo: 'Disattivalo', testo: 'Premi di nuovo «Swipe». Swipe e Spotlight si escludono: attivarne uno spegne l’altro.' },
    ],
  },
  {
    id: 'spotlight',
    titolo: 'Come usare lo Spotlight',
    paragrafi: ['Lo Spotlight ti aiuta a calibrare la posizione dell’immagine rispetto alla cartografia moderna.'],
    passi: [
      { titolo: 'Attivalo', testo: 'Premi «Spotlight» e muovi il mouse sulla mappa: un cerchio scopre la cartografia di base nascosta sotto l’immagine.' },
      { titolo: 'Regola il raggio', testo: 'Il cursore «Raggio» ingrandisce o riduce il cerchio.' },
      { titolo: 'Inverti l’effetto', testo: 'Il pulsante ⇄ inverte la logica: l’immagine storica si vede solo dentro il cerchio e il resto è nascosto.' },
    ],
  },
  {
    id: 'suggerimenti',
    titolo: 'Scorciatoie e suggerimenti',
    elenco: [
      'Le scorciatoie funzionano con il pannello Geoimage aperto e il cursore fuori dai campi di testo.',
      'G: attiva o spegne la modalità GCP. Esc: annulla il passo 1 in attesa, poi esce dalla modalità GCP.',
      'Canc o Backspace: rimuove l’ultimo GCP aggiunto.',
      'Ctrl+Z: annulla. Ctrl+Y: ripete. Con Maiusc 10 passi alla volta.',
      'Ctrl+S: salva il progetto nel browser. L: blocca o sblocca le maniglie.',
      'Il progetto si salva da solo nel browser: ricaricando la pagina ritrovi l’immagine dove l’avevi lasciata (se il browser lo permette). «Esporta JSON» ne tiene una copia.',
      'Più GCP aggiungi, e più li distribuisci agli angoli dell’immagine, più precisa è la georeferenziazione.',
    ],
  },
  {
    id: 'differenze',
    titolo: 'Cosa cambia nel Digital Twin',
    elenco: [
      'L’immagine sta sopra tutti gli strati della mappa, per confrontarla con la base: regola l’opacità o usa Swipe e Spotlight per vedere cosa c’è sotto.',
      'Funziona anche con la mappa inclinata (3D) e ruotata.',
      'La base cartografica e la ricerca sono quelle del Digital Twin: non ci sono il selettore della mappa di base né la ricerca dei luoghi di Geoimage.',
      'Le maniglie si vedono solo con il pannello Geoimage aperto; a pannello ripiegato resta solo l’immagine.',
      'Il cambio tra scala e deforma degli angoli si fa con un pulsante, non cliccando sull’immagine (il clic sulla mappa apre la scheda dei luoghi).',
      'È pensato per il computer, con il mouse: sul telefono il tab non è disponibile.',
    ],
  },
  {
    id: 'mapwarper',
    titolo: 'Vuoi più precisione?',
    paragrafi: ['Per georeferenziazioni e rettifiche più precise, con trasformazioni polinomiali avanzate e collaborazione online, ti consigliamo MapWarper.'],
    link: { testo: 'mapwarper.net', url: 'https://mapwarper.net/' },
  },
];
```

- [ ] **Step 4: Scrivi il costruttore della scheda**

Crea `js/geoimage/guida.js`:

```js
// js/geoimage/guida.js
// Tab «Guida Geoimage» del foglio Info: costruisce la guida da guida-contenuti.js.
import { SEZIONI } from './guida-contenuti.js';

const el = (doc, tag, testo) => {
  const e = doc.createElement(tag);
  if (testo != null) e.textContent = testo;
  return e;
};
const elenco = (doc, voci) => {
  const ul = el(doc, 'ul');
  for (const v of voci) ul.append(el(doc, 'li', v));
  return ul;
};

export function schedaGeoimage(doc = document, sezioni = SEZIONI) {
  const radice = el(doc, 'div');
  radice.append(el(doc, 'h2', 'Guida Geoimage'));
  for (const s of sezioni) {
    const sezione = el(doc, 'section');
    sezione.id = `guida-geoimage-${s.id}`;
    sezione.append(el(doc, 'h3', s.titolo));
    for (const t of s.paragrafi ?? []) sezione.append(el(doc, 'p', t));
    if (s.passi) {
      const ol = el(doc, 'ol');
      for (const p of s.passi) {
        const li = el(doc, 'li');
        const titolo = el(doc, 'strong', p.titolo);
        li.append(titolo, ' — ', p.testo);
        if (p.elenco) li.append(elenco(doc, p.elenco));
        ol.append(li);
      }
      sezione.append(ol);
    }
    if (s.elenco) sezione.append(elenco(doc, s.elenco));
    if (s.link) {
      const p = el(doc, 'p');
      const a = el(doc, 'a', s.link.testo);
      a.href = s.link.url;
      a.target = '_blank';
      a.rel = 'noopener';
      p.append(a);
      sezione.append(p);
    }
    radice.append(sezione);
  }
  return radice;
}
```

- [ ] **Step 5: Aggiungi il tab al foglio Info**

In `js/core/catalogo.js`, tra gli import in testa:

```js
import { schedaGuida } from './guida.js';
import { schedaGeoimage } from '../geoimage/guida.js';
```

e nell'elenco `schede`, dopo la voce `guida`:

```js
    ['guida', 'Guida', [guida]],
    ['geoimage', 'Guida Geoimage', [schedaGeoimage()]],
    ['plugin', 'Plugin RNDT', schedaPlugin()],
```

- [ ] **Step 6: Verifica che passino**

Run: `node --test tests/js/geoimage-guida.test.mjs && python3 -m pytest tests/test_geoimage.py -x -q -k foglio`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add js/geoimage/guida-contenuti.js js/geoimage/guida.js js/core/catalogo.js tests/js/geoimage-guida.test.mjs tests/test_geoimage.py
git commit -m "feat(geoimage): tab «Guida Geoimage» nel foglio Info

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 17: Documentazione, licenze e verifica finale

**Files:**
- Create: `docs/GEOIMAGE.md`
- Modify: `README.md`, `NOTICE.md`

- [ ] **Step 1: Documenta il tab**

Crea `docs/GEOIMAGE.md`:

```markdown
# Geoimage: mappe storiche sulla base di Palermo

Il tab **Geoimage** nella barra verticale a destra (accanto a Scheda e RNDT) sovrappone una mappa storica, o qualsiasi immagine, alla base del Digital Twin e la georeferenzia con i punti di controllo (GCP). Nasce da [Geoimage](https://github.com/gbvitrano/Geoimage) di @gbvitrano, portato da Leaflet a MapLibre. La guida d'uso sta nel foglio Info, tab «Guida Geoimage» (testo in `js/geoimage/guida-contenuti.js`).

## Come funziona

- **L'immagine** è un `<img>` sopra il canvas della mappa, portato sui 4 angoli geografici con un'omografia CSS (`matrix3d`, `js/geoimage/omografia.js`). A ogni `render` della mappa gli angoli si riproiettano: l'immagine segue pan, zoom, rotazione e inclinazione (3D). Sta sopra tutti gli strati, come un confronto con la base. Oltre 4096 px sul lato lungo si mostra una versione ridotta; l'originale resta per l'export.
- **Swipe e Spotlight** sono ritagli CSS (`clip-path`) del contenitore dell'immagine (`confronto-clip.js`, `confronto.js`).
- **Maniglie** (`maniglie.js`): marker MapLibre trascinabili. Centro sposta, punto sopra il lato nord ruota, angoli scalano (proporzionale) o deformano (liberi). Compaiono solo a pannello aperto.
- **GCP** (`gcp.js`): due clic per punto, il primo sull'immagine (si ricava il pixel con `geoAPixel`), il secondo sulla mappa. In questa modalità `sospensione.js` intercetta `map.fire('click')`, così il clic non apre la Scheda né attiva gli altri strati.
- **Trasformazioni** (`trasformazioni.js`): affine (≥3 GCP) o polinomiale di 2° grado (≥6), con residui in metri e RMSE.
- **Export** (`export.js`, `export-geotiff.js`): KMZ (`gx:LatLonQuad`), GeoTIFF (ricampionato sul sistema scelto, con compressione LZW scritta da `lzwComprimi`), `.points` di QGIS, world file, GCP GeoJSON, progetto JSON. Le librerie `proj4` e `jszip` (`js/vendor/`) si caricano al primo export.

## Memoria e file

- I parametri del progetto (angoli, GCP, opacità, tipo di trasformazione) stanno in `localStorage` (`dt:geoimage:v1`); l'immagine in IndexedDB, nell'archivio `dt-rndt` con chiave `geoimage:immagine` (`js/rndt/dati.js`). Se il browser blocca lo storage, l'app funziona e un avviso suggerisce «Esporta JSON».
- Il progetto JSON ha il formato di Geoimage (version 1): i file dell'app originale si aprono qui e viceversa. `transformType` è un campo in più, facoltativo.

## Limiti noti

- Solo desktop (>720 px): il tab sta nella barra di destra, che su mobile non c'è.
- L'immagine non può stare sotto altri strati: usa opacità, Swipe e Spotlight.
- Con la mappa molto inclinata gli angoli possono finire dietro la camera: l'immagine si nasconde finché tornano davanti.
- Sostituito rispetto a Geoimage: niente selettore della mappa di base né ricerca luoghi (si usano quelli del Twin); il cambio scala/deforma degli angoli è un pulsante, non il clic sull'immagine (il clic apre la Scheda).
- Il GeoTIFF è compresso davvero LZW; nell'app originale la scelta «LZW» non comprimeva (la libreria `geotiff.js` non veniva caricata) e scriveva sempre senza compressione.

## Prove

`npm run test:js` (matematica, formati, archivio) e `python -m pytest tests/test_geoimage.py` (browser: tab, maniglie, GCP, Swipe/Spotlight, persistenza, export verificati con GDAL). Prova manuale consigliata con una vera mappa storica di Palermo (per esempio dalle mappe digitalizzate della Biblioteca Comunale o dell'Archivio di Stato): caricarla, posizionarla, aggiungere almeno 4 GCP agli angoli, allineare, controllare l'RMSE, provare Swipe e Spotlight, inclinare la mappa, esportare il KMZ e aprirlo in Google Earth o QGIS. Anche i file JSON salvati con Geoimage si aprono con «Importa JSON».
```

- [ ] **Step 2: Citalo nel README**

In `README.md`, nella sezione «Struttura», dopo la frase che elenca `js/layers/`, aggiungi `js/geoimage/` (mappe storiche georeferenziate, vedi `docs/GEOIMAGE.md`):

```markdown
`js/core/` nucleo (mappa, catalogo, pannello, scheda, ricerca) · `js/layers/` un modulo per tema · `js/geoimage/` mappe storiche
georeferenziate sulla base (`docs/GEOIMAGE.md`) · `scripts/` validazione dei dati e server · `tests/` · `docs/` piano, spec, catalogo e stili.
Piano generale: `docs/PIANO_DigitalTwin_Palermo.md`.
```

- [ ] **Step 3: Licenze di terzi in `NOTICE.md`**

Nella sezione «Software di terzi» di `NOTICE.md` aggiungi in fondo:

```markdown
- `js/geoimage/`: porting in MapLibre di [Geoimage](https://github.com/gbvitrano/Geoimage) di @gbvitrano (nel repository originale: GPL-2.0), con le modifiche descritte in `docs/GEOIMAGE.md`.
- `js/vendor/proj4.js`: [proj4js](https://github.com/proj4js/proj4js) 2.11.0, licenza MIT (`js/vendor/LICENSE-proj4.txt`).
- `js/vendor/jszip.min.js`: [JSZip](https://stuk.github.io/jszip/) 3.10.1, licenza MIT o GPL-3.0 a scelta (`js/vendor/LICENSE-jszip.txt`).
```

- [ ] **Step 4: Verifica finale**

Run: `npm run test:js` — Expected: tutti i test passano (386 di prima più quelli di Geoimage).

Run: `python3 -m pytest tests/test_geoimage.py -q` — Expected: PASS.

Run: `python3 -m pytest tests/test_viewer.py -q` — Expected: stesso esito di prima di questo lavoro (nessun test della barra, dei pannelli o del foglio Info rotto dal nuovo tab).

- [ ] **Step 5: Prova a mano con una mappa storica vera**

Con `python3 scripts/serve.py 8000` e `http://127.0.0.1:8000/index.html`: carica una mappa storica di Palermo; posizionala con le maniglie; aggiungi 4 GCP agli angoli (due clic ciascuno) e premi «Allinea»; controlla che l'RMSE sia plausibile; prova Swipe e Spotlight; inclina la mappa (3D) e ruotala; esporta il KMZ e aprilo in Google Earth o QGIS; esporta il GeoTIFF e aprilo in QGIS; ricarica la pagina e verifica che il progetto torni; apri il foglio Info e leggi il tab «Guida Geoimage».

- [ ] **Step 6: Aggiorna il grafo e committa**

```bash
graphify update .
git add docs/GEOIMAGE.md README.md NOTICE.md
git commit -m "docs(geoimage): guida tecnica, README e licenze di terzi

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

(`graphify-out/` non si committa in questo repository.)
