# Catalogo RNDT nella scheda del luogo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dalla scheda del luogo l'utente apre il catalogo RNDT (plugin `openrndt-geolibre`), aggiunge servizi WMS/WFS alla mappa (solo area di Palermo), li ritrova alla sessione successiva e ne legge le info nella tab «Altri dati (RNDT)» della scheda.

**Architecture:** Il bundle del plugin resta invariato. Uno shim (`js/rndt/host.js`) implementa sulla mappa MapLibre le API GeoLibre che il plugin chiede all'host. Un overlay (`js/rndt/pannello.js`) si sovrappone alla scheda e ospita la UI del plugin. Un Cloudflare Worker (`worker/rndt-proxy.js`) fa da proxy CORS. Moduli puri (`area`, `archivio`, `info`) fanno il lavoro testabile; `scheda.js` riceve sezioni asincrone dopo l'apertura.

**Tech Stack:** JavaScript ES module (nessun build), MapLibre GL (già in `js/vendor`), `node --test`, Cloudflare Workers + wrangler.

**Spec:** `docs/superpowers/specs/2026-10-04-rndt-catalogo-design.md`

## Scostamenti dalla spec (decisi leggendo plugin e codice)

La Task 1 li riporta in fondo alla spec.

1. **Worker**: niente allowlist statica (gli host dei servizi sono nel catalogo, quindi sconosciuti). Regole: solo `https`, solo GET/HEAD, nessun IP né `localhost` né porta, origine della richiesta nella lista `ORIGINI`, limite 10 MB. Rotta `/t/<host>/<percorso>?<query>`: serve anche per i tile WMS, che MapLibre scarica con `fetch` (CORS) e che contengono il segnaposto `{bbox-epsg-3857}`.
2. **Info WFS**: un WFS scaricato diventa un layer GeoJSON in mappa, quindi la scheda interroga `queryRenderedFeatures` e non rifà richieste WFS. Solo il WMS usa `GetFeatureInfo`.
3. **Ritaglio**: filtra le feature intere che toccano il Comune (nessun taglio geometrico).
4. **Persistenza WFS**: il plugin passa all'host solo i dati (`addGeoJsonLayer(nome, fc)`), non l'URL. Lo shim lega l'ultimo URL di dati scaricato negli ultimi 30 s. Un layer senza URL noto vale solo per la sessione e l'elenco lo dice.
5. **Elenco layer**: l'overlay mostra «Layer aggiunti» con interruttore di visibilità e pulsante «Rimuovi» (GeoLibre, che offriva questa funzione, qui non c'è).

## Global Constraints

- Il bundle `plugin/openrndt-geolibre-0.2.0/dist/index.js` e `style.css` **non si modificano**. Si copiano in `js/vendor/openrndt-geolibre/`.
- Area di lavoro **solo Palermo**: bbox `[13.1, 37.9785, 13.55, 38.2919]` (ovest, sud, est, nord) = `LIMITI` di `js/core/config.js`. `config.js` usa `window` e non si importa in Node: le costanti si duplicano in `js/rndt/area.js`.
- Tab della scheda: etichetta esatta **«Altri dati (RNDT)»**, `peso` delle voci RNDT = **100**, chiavi delle voci che iniziano con **`rndt:`**.
- `localStorage`: chiave **`dt:rndt:v1`**, ogni accesso in `try/catch`, l'app funziona anche senza.
- Timeout per layer nell'interrogazione: **8000 ms**. Limite risposta del Worker: **10 MB**. Soglia del filtro sul confine: **5000 feature**.
- Testi per l'utente in italiano, con gli accenti. Codice, nomi e commenti nello stile del progetto (italiano).
- Test: `node --test tests/js/<file>.test.mjs`; suite completa `npm run test:js` (oggi 251 test passano e devono continuare a passare).
- Ogni commit termina con la riga `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Review Focus

Casi che la spec non nomina e che i test di ogni task fissano (la task è indicata tra parentesi):

1. WFS scaricato senza nessun feature dentro Palermo: errore chiaro, nessun layer vuoto in mappa (Task 5).
2. `localStorage` bloccato o pieno: l'app funziona, un solo avviso, nessuna eccezione (Task 3, 5).
3. Risposta `GetFeatureInfo` HTML con `<script>`/tag e testo molto lungo: testo ripulito e troncato a 2000 caratteri (Task 4).
4. Un servizio che non risponde entro 8 s: solo la sua sezione segnala l'errore, le altre arrivano (Task 4).
5. Worker: IP, `localhost`, nomi senza punto, porte, POST, origine non ammessa, risposta oltre il limite (Task 6).
6. Clic su un secondo punto prima che arrivino le risposte del primo: le risposte tardive non toccano la nuova scheda (Task 7).

---

## File Structure

| File | Azione | Responsabilità |
|---|---|---|
| `js/vendor/openrndt-geolibre/index.js`, `style.css`, `plugin.json` | copia | bundle del plugin, invariato |
| `js/rndt/area.js` | crea | bbox di Palermo, intersezione, filtro sul confine (puro) |
| `js/rndt/archivio.js` | crea | salvataggio dei layer in `localStorage` (puro) |
| `js/rndt/info.js` | crea | URL e parsing `GetFeatureInfo`, voci della scheda (puro) |
| `js/rndt/host.js` | crea | shim API GeoLibre sulla mappa MapLibre |
| `js/rndt/pannello.js` | crea | overlay sopra la scheda, elenco layer, limiti d'area sulla UI del plugin |
| `js/rndt/index.js` | crea | `collegaRndt`: assembla host, pannello, plugin lazy, integrazione scheda |
| `worker/rndt-proxy.js`, `worker/wrangler.toml` | crea | proxy CORS Cloudflare |
| `js/core/scheda-modello.js` | modifica | `sezioniConRitardo` (puro) |
| `js/core/scheda.js` | modifica | icona RNDT, tab, sezioni asincrone |
| `js/app.js`, `index.html`, `css/app.css` | modifica | cablaggio, pulsante barra strumenti, stili |
| `tests/js/rndt-*.test.mjs`, `tests/js/scheda-ritardo.test.mjs` | crea | test |
| `docs/RNDT.md`, `NOTICE.md` | crea/modifica | uso, deploy del Worker, licenza |

---

### Task 1: Importare il bundle e riallineare la spec

**Files:**
- Create: `js/vendor/openrndt-geolibre/index.js`, `js/vendor/openrndt-geolibre/style.css`, `js/vendor/openrndt-geolibre/plugin.json`
- Modify: `NOTICE.md`, `docs/superpowers/specs/2026-10-04-rndt-catalogo-design.md`

**Interfaces:**
- Produces: bundle ES module con `export default plugin` (`plugin.activate(host)`, `plugin.deactivate()`), servito da `js/vendor/openrndt-geolibre/index.js`.

- [ ] **Step 1: Copiare i file (senza i `Zone.Identifier` di Windows)**

```bash
mkdir -p js/vendor/openrndt-geolibre
cp plugin/openrndt-geolibre-0.2.0/dist/index.js plugin/openrndt-geolibre-0.2.0/dist/style.css plugin/openrndt-geolibre-0.2.0/plugin.json js/vendor/openrndt-geolibre/
ls js/vendor/openrndt-geolibre
```
Atteso: `index.js  plugin.json  style.css`.

- [ ] **Step 2: Verificare la licenza del plugin**

Cerca un file di licenza o un'intestazione propria del plugin (non di proj4, che è già coperto da `//#region node_modules/...`):

```bash
grep -n "openrndt\|openRNDT\|MIT License\|EUPL\|GPL" js/vendor/openrndt-geolibre/index.js | head -20
ls plugin/openrndt-geolibre-0.2.0
```
Se non c'è alcuna licenza del plugin, **fermati e chiedi all'utente** la licenza (o l'autorizzazione del titolare) prima del commit. Se c'è, annotala nello step successivo.

- [ ] **Step 3: Annotare il plugin in `NOTICE.md`**

In «Dati di terzi», dopo l'elenco, aggiungi la sezione:

```markdown

## Software di terzi

- `js/vendor/openrndt-geolibre/`: plugin openrndt-geolibre 0.2.0 (ricerca nel catalogo RNDT), incluso senza modifiche. Licenza: <LICENZA TROVATA NELLO STEP 2>. Contiene proj4 (MIT).
```
Sostituisci `<LICENZA TROVATA NELLO STEP 2>` con il testo reale prima del commit.

- [ ] **Step 4: Riportare gli scostamenti in fondo alla spec**

```bash
cat >> docs/superpowers/specs/2026-10-04-rndt-catalogo-design.md <<'EOF'

## Aggiornamenti dal piano (2026-10-04)

- **Worker**: niente allowlist statica; regole: solo https, solo GET/HEAD, nessun IP/localhost/porta, origine nella lista `ORIGINI`, limite 10 MB. Rotta `/t/<host>/<percorso>?<query>` (serve anche ai tile WMS).
- **Info WFS**: un WFS scaricato è un layer GeoJSON in mappa; la scheda usa `queryRenderedFeatures`. Solo il WMS usa `GetFeatureInfo`.
- **Ritaglio**: filtra le feature intere che toccano il Comune, nessun taglio geometrico.
- **Persistenza WFS**: l'URL del download si lega al layer con l'ultimo URL di dati scaricato negli ultimi 30 s; senza URL noto il layer vale solo per la sessione.
- **Elenco layer**: l'overlay mostra «Layer aggiunti» con visibilità e rimozione.
EOF
```

- [ ] **Step 5: Commit**

```bash
git add js/vendor/openrndt-geolibre NOTICE.md docs/superpowers/specs/2026-10-04-rndt-catalogo-design.md docs/superpowers/plans/2026-10-04-rndt-catalogo.md
git commit -m "chore(rndt): importa il bundle openrndt-geolibre e aggiorna la spec"
```

---

### Task 2: `area.js` — bbox di Palermo e filtro sul confine

**Files:**
- Create: `js/rndt/area.js`
- Test: `tests/js/rndt-area.test.mjs`

**Interfaces:**
- Produces:
  - `BBOX_PALERMO: [w,s,e,n]`, `CENTRO_PALERMO: [lng,lat]`, `SOGLIA_FILTRO = 5000`
  - `intersezione(a, b) → bbox | null`
  - `vistaPalermo(vista: bbox | null) → bbox` (la vista ristretta a Palermo, altrimenti tutta Palermo)
  - `dentroAnello([x,y], anello) → boolean`
  - `filtraSuConfine(fc, anelli, soglia = SOGLIA_FILTRO) → { fc, filtrato: boolean }`
  - `anelliDaZone(zone) → anello[]` (da `confini_zone.json`: `zone.circoscrizioni[].ring`)

- [ ] **Step 1: Scrivere il test che fallisce**

```js
// tests/js/rndt-area.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { BBOX_PALERMO, intersezione, vistaPalermo, dentroAnello, filtraSuConfine, anelliDaZone } from '../../js/rndt/area.js';

const quadrato = [[13.3, 38.1], [13.4, 38.1], [13.4, 38.2], [13.3, 38.2], [13.3, 38.1]]; // contiene il centro di Palermo

test('intersezione di due bbox, nulla se non si toccano o si sfiorano soltanto', () => {
  assert.deepEqual(intersezione([0, 0, 2, 2], [1, 1, 3, 3]), [1, 1, 2, 2]);
  assert.equal(intersezione([0, 0, 1, 1], [2, 2, 3, 3]), null);
  assert.equal(intersezione([0, 0, 1, 1], [1, 0, 2, 1]), null);
});

test('vistaPalermo: la vista dentro Palermo resta, altrimenti si ripiega su tutta Palermo', () => {
  assert.deepEqual(vistaPalermo([13.2, 38.0, 13.3, 38.1]), [13.2, 38.0, 13.3, 38.1]);
  assert.deepEqual(vistaPalermo([13.0, 37.0, 13.4, 38.1]), [13.1, 37.9785, 13.4, 38.1]);
  assert.deepEqual(vistaPalermo([0, 0, 1, 1]), BBOX_PALERMO);
  assert.deepEqual(vistaPalermo(null), BBOX_PALERMO);
});

test('dentroAnello: punto dentro e fuori', () => {
  assert.equal(dentroAnello([13.35, 38.15], quadrato), true);
  assert.equal(dentroAnello([14, 39], quadrato), false);
});

const fc = features => ({ type: 'FeatureCollection', features });
const punto = (n, c) => ({ type: 'Feature', properties: { n }, geometry: { type: 'Point', coordinates: c } });

test('filtraSuConfine tiene le feature che toccano il confine e scarta le altre', () => {
  const linea = { type: 'Feature', properties: { n: 'linea' }, geometry: { type: 'LineString', coordinates: [[13.35, 38.15], [15, 40]] } };
  const grande = { type: 'Feature', properties: { n: 'grande' }, geometry: { type: 'Polygon', coordinates: [[[10, 35], [20, 35], [20, 45], [10, 45], [10, 35]]] } };
  const { fc: out, filtrato } = filtraSuConfine(fc([punto('dentro', [13.35, 38.15]), punto('fuori', [14, 39]), linea, grande]), [quadrato]);
  assert.equal(filtrato, true);
  assert.deepEqual(out.features.map(f => f.properties.n), ['dentro', 'linea', 'grande']);
});

test('filtraSuConfine non filtra sopra soglia né senza confine', () => {
  const tre = fc([punto('a', [14, 39]), punto('b', [14, 39]), punto('c', [14, 39])]);
  assert.deepEqual(filtraSuConfine(tre, [quadrato], 2), { fc: tre, filtrato: false });
  assert.deepEqual(filtraSuConfine(tre, []), { fc: tre, filtrato: false });
});

test('anelliDaZone prende gli anelli validi delle circoscrizioni', () => {
  assert.deepEqual(anelliDaZone({ circoscrizioni: [{ name: 'I', ring: quadrato }, { name: 'x', ring: [[0, 0]] }] }), [quadrato]);
  assert.deepEqual(anelliDaZone(null), []);
});
```

- [ ] **Step 2: Eseguire il test e verificare che fallisca**

Run: `node --test tests/js/rndt-area.test.mjs`
Atteso: FAIL, `Cannot find module '.../js/rndt/area.js'`.

- [ ] **Step 3: Implementare**

```js
// js/rndt/area.js
// Area di lavoro del catalogo RNDT: solo Palermo. Moduli puri, senza DOM.

// ovest, sud, est, nord = LIMITI di core/config.js (config.js usa `window`: qui non si importa)
export const BBOX_PALERMO = [13.1, 37.9785, 13.55, 38.2919];
export const CENTRO_PALERMO = [13.33225, 38.14074];
export const SOGLIA_FILTRO = 5000; // sopra questo numero di feature il filtro sul confine costa troppo nel browser

export function intersezione(a, b) {
  const w = Math.max(a[0], b[0]), s = Math.max(a[1], b[1]), e = Math.min(a[2], b[2]), n = Math.min(a[3], b[3]);
  return w < e && s < n ? [w, s, e, n] : null;
}

// La vista della mappa ristretta a Palermo; fuori da Palermo (o senza vista) vale tutta Palermo.
export function vistaPalermo(vista) {
  return (vista && intersezione(vista, BBOX_PALERMO)) || BBOX_PALERMO;
}

export function dentroAnello([x, y], anello) {
  let dentro = false;
  for (let i = 0, j = anello.length - 1; i < anello.length; j = i++) {
    const [xi, yi] = anello[i], [xj, yj] = anello[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}

const dentroConfine = (p, anelli) => anelli.some(a => dentroAnello(p, a));

function* vertici(g) {
  if (!g) return;
  switch (g.type) {
    case 'Point': yield g.coordinates; break;
    case 'MultiPoint': case 'LineString': yield* g.coordinates; break;
    case 'MultiLineString': case 'Polygon': for (const r of g.coordinates) yield* r; break;
    case 'MultiPolygon': for (const p of g.coordinates) for (const r of p) yield* r; break;
    case 'GeometryCollection': for (const x of g.geometries) yield* vertici(x); break;
  }
}

// un poligono regionale può contenere Palermo senza avere un solo vertice dentro il Comune
function contieneCentro(g) {
  const poligoni = g?.type === 'Polygon' ? [g.coordinates] : g?.type === 'MultiPolygon' ? g.coordinates : [];
  return poligoni.some(p => dentroAnello(CENTRO_PALERMO, p[0]));
}

// Tiene le feature intere che toccano il Comune (nessun taglio geometrico). Sopra soglia, o senza confine, non filtra.
export function filtraSuConfine(fc, anelli, soglia = SOGLIA_FILTRO) {
  const feature = fc.features ?? [];
  if (!anelli?.length || feature.length > soglia) return { fc, filtrato: false };
  const tocca = f => { for (const v of vertici(f.geometry)) if (dentroConfine(v, anelli)) return true; return contieneCentro(f.geometry); };
  return { fc: { ...fc, features: feature.filter(tocca) }, filtrato: true };
}

// `confini_zone.json` (popolazione): le circoscrizioni sono anelli [lng, lat]; insieme coprono il Comune
export const anelliDaZone = zone => (zone?.circoscrizioni ?? []).map(c => c.ring).filter(r => Array.isArray(r) && r.length > 3);
```

- [ ] **Step 4: Eseguire il test e verificare che passi**

Run: `node --test tests/js/rndt-area.test.mjs`
Atteso: PASS, 6 test.

- [ ] **Step 5: Commit**

```bash
git add js/rndt/area.js tests/js/rndt-area.test.mjs
git commit -m "feat(rndt): area di Palermo e filtro sul confine comunale"
```

---

### Task 3: `archivio.js` — salvataggio dei layer

**Files:**
- Create: `js/rndt/archivio.js`
- Test: `tests/js/rndt-archivio.test.mjs`

**Interfaces:**
- Produces:
  - `CHIAVE = 'dt:rndt:v1'`
  - `leggi(storage | null) → { v: 1, layers: Salvato[] }`
  - `salva(storage | null, stato) → boolean`
  - `aggiungi(stato, salvato) → stato` (sostituisce lo stesso `id`), `rimuovi(stato, id) → stato`, `aggiorna(stato, id, patch) → stato`
  - `Salvato = { id: string, tipo: 'wms'|'tile'|'geojson', nome: string, visibile: boolean, sorgente: object }`

- [ ] **Step 1: Scrivere il test che fallisce**

```js
// tests/js/rndt-archivio.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { CHIAVE, leggi, salva, aggiungi, rimuovi, aggiorna } from '../../js/rndt/archivio.js';

const finto = (iniziale = {}) => {
  const dati = new Map(Object.entries(iniziale));
  return { getItem: k => dati.get(k) ?? null, setItem: (k, v) => { dati.set(k, v); }, dati };
};
const wms = { id: 'rndt-a', tipo: 'wms', nome: 'PAI', visibile: true, sorgente: { url: 'https://x.it/ows', layers: 'a' } };

test('senza storage o senza dati la lettura dà uno stato vuoto', () => {
  assert.deepEqual(leggi(null), { v: 1, layers: [] });
  assert.deepEqual(leggi(finto()), { v: 1, layers: [] });
});

test('salva e rilegge', () => {
  const s = finto();
  assert.equal(salva(s, aggiungi({ v: 1, layers: [] }, wms)), true);
  assert.deepEqual(leggi(s).layers, [wms]);
});

test('JSON rotto, versione diversa o layer non validi non rompono la lettura', () => {
  assert.deepEqual(leggi(finto({ [CHIAVE]: '{rotto' })), { v: 1, layers: [] });
  assert.deepEqual(leggi(finto({ [CHIAVE]: JSON.stringify({ v: 2, layers: [wms] }) })), { v: 1, layers: [] });
  const misto = JSON.stringify({ v: 1, layers: [wms, { id: 'x', tipo: 'boh' }, null, { tipo: 'wms' }] });
  assert.deepEqual(leggi(finto({ [CHIAVE]: misto })).layers, [wms]);
});

test('storage bloccato o pieno: salva dà false e non lancia', () => {
  assert.equal(salva(null, { v: 1, layers: [] }), false);
  const pieno = { getItem: () => null, setItem: () => { throw new DOMException('piena', 'QuotaExceededError'); } };
  assert.equal(salva(pieno, { v: 1, layers: [] }), false);
});

test('aggiungi sostituisce lo stesso id, rimuovi e aggiorna lavorano per id', () => {
  let s = aggiungi({ v: 1, layers: [] }, wms);
  s = aggiungi(s, { ...wms, nome: 'PAI nuovo' });
  assert.equal(s.layers.length, 1);
  assert.equal(s.layers[0].nome, 'PAI nuovo');
  s = aggiorna(s, 'rndt-a', { visibile: false });
  assert.equal(s.layers[0].visibile, false);
  assert.deepEqual(rimuovi(s, 'rndt-a').layers, []);
});
```

- [ ] **Step 2: Eseguire il test e verificare che fallisca**

Run: `node --test tests/js/rndt-archivio.test.mjs`
Atteso: FAIL, modulo non trovato.

- [ ] **Step 3: Implementare**

```js
// js/rndt/archivio.js
// I layer RNDT aggiunti si ricordano tra una sessione e l'altra (localStorage, passato come parametro).
// Se il browser lo blocca o è pieno l'app funziona lo stesso, senza memoria.

export const CHIAVE = 'dt:rndt:v1';
const TIPI = ['wms', 'tile', 'geojson'];
const vuoto = () => ({ v: 1, layers: [] });

export function leggi(storage) {
  try {
    const grezzo = storage?.getItem(CHIAVE);
    if (!grezzo) return vuoto();
    const s = JSON.parse(grezzo);
    if (s?.v !== 1 || !Array.isArray(s.layers)) return vuoto();
    return { v: 1, layers: s.layers.filter(l => l && typeof l.id === 'string' && TIPI.includes(l.tipo)) };
  } catch {
    return vuoto();
  }
}

export function salva(storage, stato) {
  try {
    storage.setItem(CHIAVE, JSON.stringify(stato));
    return true;
  } catch {
    return false;
  }
}

export const aggiungi = (stato, salvato) => ({ ...stato, layers: [...stato.layers.filter(l => l.id !== salvato.id), salvato] });
export const rimuovi = (stato, id) => ({ ...stato, layers: stato.layers.filter(l => l.id !== id) });
export const aggiorna = (stato, id, patch) => ({ ...stato, layers: stato.layers.map(l => (l.id === id ? { ...l, ...patch } : l)) });
```

- [ ] **Step 4: Eseguire il test e verificare che passi**

Run: `node --test tests/js/rndt-archivio.test.mjs`
Atteso: PASS, 5 test.

- [ ] **Step 5: Commit**

```bash
git add js/rndt/archivio.js tests/js/rndt-archivio.test.mjs
git commit -m "feat(rndt): salvataggio dei layer RNDT in localStorage"
```

---

### Task 4: `info.js` — interrogazione dei layer e voci della scheda

**Files:**
- Create: `js/rndt/info.js`
- Test: `tests/js/rndt-info.test.mjs`

**Interfaces:**
- Consumes: record di layer `{ id, tipo, nome, sorgente }` (come in `archivio.js`).
- Produces:
  - `lngLatA3857([lng, lat]) → [x, y]`
  - `urlGetFeatureInfo(sorgente, [lng, lat], zoom, formato) → string`
  - `leggiRisposta(testo) → { tipo: 'json'|'testo'|'vuoto'|'errore', elementi?: Riga[][], testo?: string }` con `Riga = { etichetta, valore }`
  - `proprieta(props) → Riga[]`
  - `vociDa(layer, esito) → Voce[]` (voci del modello scheda, `peso: 100`, chiave `rndt:<id>:<n>`)
  - `segnaposto() → Voce` (chiave `rndt:attesa`)
  - `interrogaTutti({ layers, lngLat, zoom, leggiTesto, featureAlPunto, timeoutMs = 8000 }) → Promise<Voce[]>`
    - `leggiTesto(url) → Promise<string>`; `featureAlPunto(layer) → Feature[]` (con `.properties`)

- [ ] **Step 1: Scrivere il test che fallisce**

```js
// tests/js/rndt-info.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { lngLatA3857, urlGetFeatureInfo, leggiRisposta, proprieta, vociDa, segnaposto, interrogaTutti } from '../../js/rndt/info.js';

test('conversione in Web Mercator', () => {
  const [x0, y0] = lngLatA3857([0, 0]);
  assert.ok(Math.abs(x0) < 1e-6 && Math.abs(y0) < 1e-6);
  assert.ok(Math.abs(lngLatA3857([180, 0])[0] - 20037508.342789244) < 1e-3);
});

test('GetFeatureInfo 1.3.0 usa CRS, I e J; 1.1.1 usa SRS, X e Y; i parametri già presenti restano', () => {
  const sorg = { url: 'https://x.it/ows?map=a.map', layers: 'uno,due', version: '1.3.0' };
  const u13 = new URL(urlGetFeatureInfo(sorg, [13.36, 38.11], 16, 'text/plain'));
  assert.equal(u13.searchParams.get('map'), 'a.map');
  assert.equal(u13.searchParams.get('REQUEST'), 'GetFeatureInfo');
  assert.equal(u13.searchParams.get('CRS'), 'EPSG:3857');
  assert.equal(u13.searchParams.get('I'), '50');
  assert.equal(u13.searchParams.get('QUERY_LAYERS'), 'uno,due');
  assert.equal(u13.searchParams.get('INFO_FORMAT'), 'text/plain');
  const u11 = new URL(urlGetFeatureInfo({ ...sorg, version: '1.1.1' }, [13.36, 38.11], 16, 'text/html'));
  assert.equal(u11.searchParams.get('SRS'), 'EPSG:3857');
  assert.equal(u11.searchParams.get('X'), '50');
  assert.equal(u11.searchParams.get('CRS'), null);
  const [w, s, e, n] = u13.searchParams.get('BBOX').split(',').map(Number);
  assert.ok(e > w && n > s);
});

test('proprieta scarta valori vuoti, oggetti e campi geometria', () => {
  assert.deepEqual(proprieta({ a: 1, b: null, c: '', d: { x: 1 }, geom: 'POINT', the_geom: 'x', e: 'ok' }),
    [{ etichetta: 'a', valore: '1' }, { etichetta: 'e', valore: 'ok' }]);
});

test('leggiRisposta: GeoJSON, vuoto, errore di servizio', () => {
  const json = JSON.stringify({ features: [{ properties: { a: 1 } }, { properties: {} }] });
  assert.deepEqual(leggiRisposta(json), { tipo: 'json', elementi: [[{ etichetta: 'a', valore: '1' }]] });
  assert.equal(leggiRisposta(JSON.stringify({ features: [] })).tipo, 'vuoto');
  assert.equal(leggiRisposta('').tipo, 'vuoto');
  assert.equal(leggiRisposta('<ServiceExceptionReport><ServiceException>x</ServiceException></ServiceExceptionReport>').tipo, 'errore');
  assert.equal(leggiRisposta('{rotto').tipo, 'errore');
});

test('leggiRisposta ripulisce l’HTML (script, tag) e tronca a 2000 caratteri', () => {
  const html = '<html><script>alert(1)</script><style>p{}</style><table><tr><td>Zona</td><td>B1</td></tr></table>' + '<p>' + 'x'.repeat(5000) + '</p></html>';
  const r = leggiRisposta(html);
  assert.equal(r.tipo, 'testo');
  assert.ok(!r.testo.includes('alert') && !r.testo.includes('<'));
  assert.ok(r.testo.startsWith('Zona B1'));
  assert.ok(r.testo.length <= 2000);
});

const layer = { id: 'rndt-1', tipo: 'wms', nome: 'Zone PAI', sorgente: { url: 'https://servizi.it/ows', layers: 'pai', version: '1.3.0' } };

test('vociDa: un elemento = una voce con peso 100, fonte e chiave rndt:', () => {
  const v = vociDa(layer, { tipo: 'json', elementi: [[{ etichetta: 'Classe', valore: 'P3' }], [{ etichetta: 'Classe', valore: 'P4' }]] });
  assert.equal(v.length, 2);
  assert.deepEqual(v.map(x => x.chiave), ['rndt:rndt-1:0', 'rndt:rndt-1:1']);
  assert.equal(v[0].titolo, 'Zone PAI (1/2)');
  assert.equal(v[0].peso, 100);
  assert.equal(v[0].legale, true);
  assert.match(v[0].fonte, /servizi\.it/);
});

test('vociDa: vuoto, errore, testo e layer non interrogabile', () => {
  assert.equal(vociDa(layer, { tipo: 'vuoto' })[0].gruppi[0].righe[0].valore, 'nessun dato in questo punto');
  assert.match(vociDa(layer, { tipo: 'errore' })[0].nota, /non raggiungibile/);
  assert.equal(vociDa(layer, { tipo: 'testo', testo: 'Zona B1' })[0].testo, 'Zona B1');
  assert.match(vociDa(layer, { tipo: 'non-interrogabile' })[0].gruppi[0].righe[0].valore, /solo grafico/);
});

test('segnaposto: voce di attesa con chiave rndt:attesa e peso 100', () => {
  const s = segnaposto();
  assert.equal(s.chiave, 'rndt:attesa');
  assert.equal(s.peso, 100);
});

test('interrogaTutti: WMS prova JSON, poi testo; GeoJSON legge la mappa senza duplicati; tile non interrogabile', async () => {
  const leggiTesto = async u => (u.includes('application%2Fjson') ? '<ServiceException>no</ServiceException>' : 'Valore: 5');
  const geo = { id: 'rndt-2', tipo: 'geojson', nome: 'Aree', sorgente: { url: 'https://servizi.it/wfs' } };
  const tile = { id: 'rndt-3', tipo: 'tile', nome: 'Sfondo', sorgente: { url: 'https://servizi.it/t/{z}/{x}/{y}' } };
  const voci = await interrogaTutti({
    layers: [layer, geo, tile], lngLat: [13.36, 38.11], zoom: 16, leggiTesto,
    featureAlPunto: () => [{ properties: { nome: 'A' } }, { properties: { nome: 'A' } }],
  });
  assert.equal(voci.find(v => v.chiave === 'rndt:rndt-1:0').testo, 'Valore: 5');
  assert.equal(voci.filter(v => v.chiave.startsWith('rndt:rndt-2')).length, 1);
  assert.match(voci.find(v => v.chiave.startsWith('rndt:rndt-3')).gruppi[0].righe[0].valore, /solo grafico/);
});

test('interrogaTutti: un servizio lento va in errore dopo il timeout, gli altri arrivano', async () => {
  const lento = { ...layer, id: 'rndt-lento' };
  const veloce = { ...layer, id: 'rndt-veloce' };
  const leggiTesto = u => (u.includes('lento') ? new Promise(() => {}) : Promise.resolve('Valore: 1'));
  const voci = await interrogaTutti({
    layers: [{ ...lento, sorgente: { ...lento.sorgente, url: 'https://lento.it/ows' } }, veloce],
    lngLat: [13.36, 38.11], zoom: 16, leggiTesto, featureAlPunto: () => [], timeoutMs: 30,
  });
  assert.match(voci.find(v => v.chiave === 'rndt:rndt-lento:0').nota, /non raggiungibile/);
  assert.equal(voci.find(v => v.chiave === 'rndt:rndt-veloce:0').testo, 'Valore: 1');
});
```

- [ ] **Step 2: Eseguire il test e verificare che fallisca**

Run: `node --test tests/js/rndt-info.test.mjs`
Atteso: FAIL, modulo non trovato.

- [ ] **Step 3: Implementare**

```js
// js/rndt/info.js
// Cosa dice un layer RNDT in un punto: richieste GetFeatureInfo (WMS), proprietà delle feature (GeoJSON) e voci
// nel formato della scheda (scheda-modello.js). Modulo puro: la rete e la mappa arrivano come parametri.

const R = 20037508.342789244; // metà circonferenza in Web Mercator
const PIXEL = 101; // finestra della richiesta, con il punto cliccato al centro
const META = 50;
const FORMATI = ['application/json', 'text/plain', 'text/html'];
const MAX_TESTO = 2000;
const NASCOSTE = /^(geom|the_geom|shape|geometry|wkb_geometry|bbox)$/i;

export function lngLatA3857([lng, lat]) {
  return [(lng * R) / 180, (Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / Math.PI) * R];
}

// Richiesta in EPSG:3857 attorno al punto: la finestra copre ±50 pixel allo zoom della mappa.
export function urlGetFeatureInfo(sorgente, lngLat, zoom, formato) {
  const [x, y] = lngLatA3857(lngLat);
  const m = ((2 * R) / 256 / 2 ** zoom) * META;
  const v13 = String(sorgente.version).startsWith('1.3');
  const url = new URL(sorgente.url);
  const imposta = (k, v) => url.searchParams.set(k, String(v));
  imposta('SERVICE', 'WMS');
  imposta('REQUEST', 'GetFeatureInfo');
  imposta('VERSION', sorgente.version);
  imposta('LAYERS', sorgente.layers);
  imposta('QUERY_LAYERS', sorgente.layers);
  imposta('STYLES', '');
  imposta(v13 ? 'CRS' : 'SRS', 'EPSG:3857');
  imposta('BBOX', [x - m, y - m, x + m, y + m].join(','));
  imposta('WIDTH', PIXEL);
  imposta('HEIGHT', PIXEL);
  imposta(v13 ? 'I' : 'X', META);
  imposta(v13 ? 'J' : 'Y', META);
  imposta('INFO_FORMAT', formato);
  imposta('FEATURE_COUNT', 5);
  return url.toString();
}

export function proprieta(props) {
  return Object.entries(props ?? {})
    .filter(([k, v]) => v != null && v !== '' && typeof v !== 'object' && !NASCOSTE.test(k))
    .slice(0, 25)
    .map(([k, v]) => ({ etichetta: k, valore: String(v).slice(0, 300) }));
}

const pulisciHtml = t => t
  .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
  .replace(/<br\s*\/?>|<\/(p|div|tr|li|h\d)>/gi, '\n')
  .replace(/<\/t[dh]>/gi, ' ')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  .replace(/[ \t]+/g, ' ').replace(/ *\n+ */g, '\n').trim();

export function leggiRisposta(testo) {
  const t = String(testo ?? '').trim();
  if (!t) return { tipo: 'vuoto' };
  if (/<ServiceException|<ows:Exception|<ExceptionReport/i.test(t)) return { tipo: 'errore' };
  if (t.startsWith('{')) {
    try {
      const j = JSON.parse(t);
      const elementi = (Array.isArray(j.features) ? j.features : []).map(f => proprieta(f.properties)).filter(r => r.length);
      return elementi.length ? { tipo: 'json', elementi } : { tipo: 'vuoto' };
    } catch {
      return { tipo: 'errore' };
    }
  }
  const pulito = pulisciHtml(t).slice(0, MAX_TESTO);
  return pulito ? { tipo: 'testo', testo: pulito } : { tipo: 'vuoto' };
}

const fonteDi = layer => {
  try { return new URL(layer.sorgente?.url ?? '').host; } catch { return ''; }
};

export function vociDa(layer, esito) {
  const host = fonteDi(layer);
  const base = { peso: 100, icona: 'mappa', legale: true, sempre: true, ...(host && { fonte: `Fonte: ${host} (catalogo RNDT)` }) };
  const chiave = `rndt:${layer.id}:0`;
  const riga = valore => ({ ...base, chiave, titolo: layer.nome, gruppi: [{ righe: [{ etichetta: 'Esito', valore }] }] });
  if (esito.tipo === 'json' && esito.elementi?.length) {
    const n = esito.elementi.length;
    return esito.elementi.map((righe, i) => ({
      ...base, chiave: `rndt:${layer.id}:${i}`, titolo: n > 1 ? `${layer.nome} (${i + 1}/${n})` : layer.nome, gruppi: [{ righe }],
    }));
  }
  if (esito.tipo === 'testo') return [{ ...base, chiave, titolo: layer.nome, testo: esito.testo, gruppi: [] }];
  if (esito.tipo === 'errore') return [{ ...base, chiave, titolo: layer.nome, gruppi: [], nota: 'Servizio non raggiungibile o senza informazioni interrogabili.' }];
  if (esito.tipo === 'non-interrogabile') return [riga('livello solo grafico, senza informazioni interrogabili')];
  return [riga('nessun dato in questo punto')];
}

export const segnaposto = () => ({
  chiave: 'rndt:attesa', peso: 100, titolo: 'Altri dati (RNDT)', icona: 'mappa', sempre: true,
  gruppi: [{ righe: [{ etichetta: 'Stato', valore: 'Interrogazione dei servizi in corso…' }] }],
});

function conTimeout(promessa, ms) {
  let timer;
  const scaduto = new Promise((_, rifiuta) => { timer = setTimeout(() => rifiuta(new Error('timeout')), ms); });
  return Promise.race([promessa, scaduto]).finally(() => clearTimeout(timer));
}

async function interrogaWms(sorgente, lngLat, zoom, leggiTesto) {
  for (const formato of FORMATI) {
    try {
      const esito = leggiRisposta(await leggiTesto(urlGetFeatureInfo(sorgente, lngLat, zoom, formato)));
      if (esito.tipo !== 'errore') return esito;
    } catch { /* si prova il formato successivo */ }
  }
  return { tipo: 'errore' };
}

const uniche = lista => {
  const viste = new Set();
  return lista.filter(p => { const k = JSON.stringify(p); return !viste.has(k) && viste.add(k); });
};

export async function interrogaTutti({ layers, lngLat, zoom, leggiTesto, featureAlPunto, timeoutMs = 8000 }) {
  const lavori = layers.map(async layer => {
    try {
      if (layer.tipo === 'geojson') {
        const elementi = uniche(featureAlPunto(layer).map(f => f.properties)).map(proprieta).filter(r => r.length);
        return vociDa(layer, elementi.length ? { tipo: 'json', elementi } : { tipo: 'vuoto' });
      }
      if (layer.tipo === 'wms') return vociDa(layer, await conTimeout(interrogaWms(layer.sorgente, lngLat, zoom, leggiTesto), timeoutMs));
      return vociDa(layer, { tipo: 'non-interrogabile' });
    } catch {
      return vociDa(layer, { tipo: 'errore' });
    }
  });
  return (await Promise.all(lavori)).flat();
}
```

- [ ] **Step 4: Eseguire il test e verificare che passi**

Run: `node --test tests/js/rndt-info.test.mjs`
Atteso: PASS, 10 test. Se `leggiRisposta` fallisce sul troncamento, controlla che `pulisciHtml` non lasci `<`.

- [ ] **Step 5: Commit**

```bash
git add js/rndt/info.js tests/js/rndt-info.test.mjs
git commit -m "feat(rndt): interrogazione dei layer e voci della scheda"
```

---

### Task 5: `host.js` — lo shim delle API GeoLibre

**Files:**
- Create: `js/rndt/host.js`
- Test: `tests/js/rndt-host.test.mjs`

**Interfaces:**
- Consumes: `area.js` (`BBOX_PALERMO`, `intersezione`, `vistaPalermo`, `filtraSuConfine`), `archivio.js` (`aggiungi`, `rimuovi`, `aggiorna`).
- Produces:
  - `urlProxy(proxy, url) → string` (`<proxy>/t/<host><percorso+query>`; i segnaposto `{z}`, `{bbox-epsg-3857}` restano intatti)
  - `creaHost({ map, proxy, stato, scrivi, anelli = () => [], notifica = () => {}, pannello = {}, fetchFn }) → host`
  - `host` espone le API GeoLibre usate dal plugin: `getMap`, `getViewBounds`, `fitBounds`, `getLayers`, `getDrawnFeatures`, `getProjectSnapshot`, `addWmsLayer(nome, opz) → id`, `addTileLayer(nome, urlTemplate, opz) → id`, `addGeoJsonLayer(nome, fc) → id`, `fetchArrayBuffer(url) → Promise<ArrayBuffer>`, `exportTextFile`, `openExternalUrl`, `activatePlugin`, `registerRightPanel(reg) → dispose`, `registerToolbarMenu(m) → dispose`, `openRightPanel(id)`, `closeRightPanel(id)`
  - e i metodi nostri: `elenco() → [{ id, tipo, nome, visibile, indisponibile, salvato, errore, sorgente }]`, `mostra(id, visibile)`, `elimina(id)`, `ripristina() → Promise<void>`, `featureAlPunto(id, punto, r = 4) → Feature[]`, `suCambio(fn) → dispose`
  - `pannello` (opzionale) = `{ registra(reg) → dispose, apri(), chiudi() }`

- [ ] **Step 1: Scrivere il test che fallisce**

```js
// tests/js/rndt-host.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { creaHost, urlProxy } from '../../js/rndt/host.js';

const PROXY = 'https://proxy.test';
const quadrato = [[13.3, 38.1], [13.4, 38.1], [13.4, 38.2], [13.3, 38.2], [13.3, 38.1]];

function mappaFinta() {
  const sorgenti = new Map(), strati = new Map(), chiamate = [];
  return {
    sorgenti, strati, chiamate,
    addSource: (id, s) => sorgenti.set(id, s), removeSource: id => sorgenti.delete(id), getSource: id => sorgenti.get(id),
    addLayer: l => strati.set(l.id, l), removeLayer: id => strati.delete(id), getLayer: id => strati.get(id),
    setLayoutProperty: (id, k, v) => { strati.get(id).layout = { ...strati.get(id).layout, [k]: v }; },
    getBounds: () => ({ getWest: () => 13.0, getSouth: () => 37.0, getEast: () => 13.4, getNorth: () => 38.1 }),
    fitBounds: (b, o) => chiamate.push(['fitBounds', b, o]),
    queryRenderedFeatures: () => [], on() {},
  };
}
const corpo = testo => ({ ok: true, status: 200, arrayBuffer: async () => new TextEncoder().encode(testo).buffer });
const costruisci = (extra = {}) => {
  const map = mappaFinta(), scritti = [], avvisi = [], chiamate = [];
  const host = creaHost({
    map, proxy: PROXY, stato: extra.stato ?? { v: 1, layers: [] }, scrivi: s => { scritti.push(s); return extra.scrivi?.(s) ?? true; },
    anelli: () => extra.anelli ?? [], notifica: m => avvisi.push(m),
    fetchFn: extra.fetchFn ?? (async u => { chiamate.push(u); return corpo(extra.corpo ?? '{}'); }),
  });
  return { host, map, scritti, avvisi, chiamate };
};
const wmsOpz = { url: 'https://wms.example.org/ows?map=a', layers: 'pai', version: '1.3.0', format: 'image/png', transparent: true };
const fc = features => ({ type: 'FeatureCollection', features });
const pt = c => ({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: c } });

test('urlProxy: percorso e query dell’originale, segnaposto intatti', () => {
  assert.equal(urlProxy(PROXY + '/', 'https://a.it/x/{z}/{x}/{y}.png'), 'https://proxy.test/t/a.it/x/{z}/{x}/{y}.png');
  assert.equal(urlProxy(PROXY, 'http://a.it/ows?SERVICE=WMS'), 'https://proxy.test/t/a.it/ows?SERVICE=WMS');
  assert.equal(urlProxy(PROXY, 'https://a.it'), 'https://proxy.test/t/a.it/');
  assert.throws(() => urlProxy(PROXY, 'ftp://a.it'), /non valido/);
});

test('addWmsLayer: sorgente raster dai tile proxati, una volta sola, e salvataggio', () => {
  const { host, map, scritti } = costruisci();
  const id = host.addWmsLayer('PAI', wmsOpz);
  const sorg = map.sorgenti.get(id);
  assert.equal(sorg.type, 'raster');
  assert.ok(sorg.tiles[0].startsWith('https://proxy.test/t/wms.example.org/ows?'));
  assert.ok(sorg.tiles[0].endsWith('&BBOX={bbox-epsg-3857}'));
  assert.match(sorg.tiles[0], /LAYERS=pai/);
  assert.match(sorg.tiles[0], /CRS=EPSG%3A3857|CRS=EPSG:3857/);
  assert.deepEqual(sorg.bounds, [13.1, 37.9785, 13.55, 38.2919]);
  assert.equal(map.strati.get(id).type, 'raster');
  assert.equal(host.addWmsLayer('PAI', wmsOpz), id);
  assert.equal(map.strati.size, 1);
  assert.equal(scritti.at(-1).layers[0].tipo, 'wms');
  assert.deepEqual(host.getLayers(), [id]);
});

test('addWmsLayer rifiuta un CRS diverso da EPSG:3857', () => {
  assert.throws(() => costruisci().host.addWmsLayer('X', { ...wmsOpz, crs: 'EPSG:4326' }), /non supportato/);
});

test('addTileLayer passa dal proxy e conserva i segnaposto', () => {
  const { host, map } = costruisci();
  const id = host.addTileLayer('Sfondo', 'https://tile.example.org/{z}/{x}/{y}.png', { attribution: '© X' });
  assert.equal(map.sorgenti.get(id).tiles[0], 'https://proxy.test/t/tile.example.org/{z}/{x}/{y}.png');
});

test('getViewBounds è sempre dentro Palermo; fitBounds muove la mappa', () => {
  const { host, map } = costruisci();
  assert.deepEqual(host.getViewBounds(), [13.1, 37.9785, 13.4, 38.1]);
  host.fitBounds([13.2, 38.0, 13.3, 38.1]);
  assert.deepEqual(map.chiamate[0][1], [[13.2, 38.0], [13.3, 38.1]]);
});

test('fetchArrayBuffer passa dal proxy e rifiuta il download senza area', async () => {
  const { host, chiamate } = costruisci();
  await host.fetchArrayBuffer('https://wfs.example.org/ows?SERVICE=WFS&REQUEST=GetFeature&TYPENAMES=x&BBOX=1,2,3,4');
  assert.equal(chiamate[0], 'https://proxy.test/t/wfs.example.org/ows?SERVICE=WFS&REQUEST=GetFeature&TYPENAMES=x&BBOX=1,2,3,4');
  await host.fetchArrayBuffer('https://wfs.example.org/ows?SERVICE=WFS&REQUEST=GetFeature&resultType=hits');
  await host.fetchArrayBuffer('https://wms.example.org/ows?REQUEST=GetFeatureInfo&LAYERS=a');
  await assert.rejects(host.fetchArrayBuffer('https://wfs.example.org/ows?SERVICE=WFS&REQUEST=GetFeature&TYPENAMES=x'), /limitato a Palermo/);
});

test('fetchArrayBuffer: risposta non ok = errore con lo stato', async () => {
  const { host } = costruisci({ fetchFn: async () => ({ ok: false, status: 403, arrayBuffer: async () => new ArrayBuffer(0) }) });
  await assert.rejects(host.fetchArrayBuffer('https://a.it/x'), /HTTP 403/);
});

test('addGeoJsonLayer salva l’URL del download recente; senza download il layer vale solo per la sessione', async () => {
  const url = 'https://wfs.example.org/ows?SERVICE=WFS&REQUEST=GetFeature&TYPENAMES=x&BBOX=13.1,37.9,13.5,38.3';
  const a = costruisci();
  await a.host.fetchArrayBuffer(url);
  const id = a.host.addGeoJsonLayer('Zone', fc([pt([13.35, 38.15])]));
  assert.equal(a.scritti.at(-1).layers[0].sorgente.url, url);
  assert.equal(a.host.elenco().find(l => l.id === id).salvato, true);
  const b = costruisci();
  const id2 = b.host.addGeoJsonLayer('Zone', fc([pt([13.35, 38.15])]));
  assert.equal(b.scritti.length, 0);
  assert.equal(b.host.elenco().find(l => l.id === id2).salvato, false);
});

test('addGeoJsonLayer: nessuna feature dentro Palermo = errore, nessun layer in mappa', () => {
  const { host, map } = costruisci({ anelli: [quadrato] });
  assert.throws(() => host.addGeoJsonLayer('Fuori', fc([pt([14, 39])])), /nessuna feature dentro/);
  assert.equal(map.sorgenti.size, 0);
});

test('addGeoJsonLayer filtra sul confine comunale', () => {
  const { host, map } = costruisci({ anelli: [quadrato] });
  const id = host.addGeoJsonLayer('Misto', fc([pt([13.35, 38.15]), pt([14, 39])]));
  assert.equal(map.sorgenti.get(id).data.features.length, 1);
});

test('localStorage bloccato: un solo avviso, il layer resta in mappa', () => {
  const { host, map, avvisi } = costruisci({ scrivi: () => false });
  host.addWmsLayer('A', wmsOpz);
  host.addWmsLayer('B', { ...wmsOpz, layers: 'altro' });
  assert.equal(map.sorgenti.size, 2);
  assert.equal(avvisi.length, 1);
  assert.match(avvisi[0], /Non riesco a salvare/);
});

test('mostra e elimina aggiornano mappa e archivio', () => {
  const { host, map, scritti } = costruisci();
  const id = host.addWmsLayer('PAI', wmsOpz);
  host.mostra(id, false);
  assert.equal(map.strati.get(id).layout.visibility, 'none');
  assert.equal(scritti.at(-1).layers[0].visibile, false);
  host.elimina(id);
  assert.equal(map.strati.size, 0);
  assert.equal(map.sorgenti.size, 0);
  assert.deepEqual(scritti.at(-1).layers, []);
  assert.deepEqual(host.getLayers(), []);
});

test('ripristina riaggiunge WMS e GeoJSON salvati; un GeoJSON irraggiungibile resta in elenco come indisponibile', async () => {
  const stato = { v: 1, layers: [
    { id: 'rndt-w', tipo: 'wms', nome: 'PAI', visibile: false, sorgente: wmsOpz },
    { id: 'rndt-g', tipo: 'geojson', nome: 'Zone', visibile: true, sorgente: { url: 'https://wfs.example.org/ok' } },
  ] };
  const ok = costruisci({ stato, corpo: JSON.stringify(fc([pt([13.35, 38.15])])) });
  await ok.host.ripristina();
  assert.equal(ok.map.sorgenti.size, 2);
  assert.equal(ok.host.elenco().find(l => l.tipo === 'wms').visibile, false);
  const ko = costruisci({ stato, fetchFn: async () => { throw new Error('rete'); } });
  await ko.host.ripristina();
  const g = ko.host.elenco().find(l => l.tipo === 'geojson');
  assert.equal(g.indisponibile, true);
  assert.equal(ko.scritti.length, 0); // il ripristino non riscrive l’archivio
});

test('registerRightPanel e openRightPanel passano dal pannello', () => {
  const eventi = [];
  const host = creaHost({
    map: mappaFinta(), proxy: PROXY, stato: { v: 1, layers: [] }, scrivi: () => true,
    pannello: { registra: r => { eventi.push(['registra', r.id]); return () => eventi.push(['rimuovi']); }, apri: () => eventi.push(['apri']), chiudi: () => eventi.push(['chiudi']) },
  });
  const dispose = host.registerRightPanel({ id: 'p', render() {} });
  host.openRightPanel('p');
  host.closeRightPanel('p');
  dispose();
  assert.deepEqual(eventi, [['registra', 'p'], ['apri'], ['chiudi'], ['rimuovi']]);
});
```

- [ ] **Step 2: Eseguire il test e verificare che fallisca**

Run: `node --test tests/js/rndt-host.test.mjs`
Atteso: FAIL, modulo non trovato.

- [ ] **Step 3: Implementare**

```js
// js/rndt/host.js
// Lo «host» che il plugin openrndt-geolibre si aspetta (API di GeoLibre), costruito sulla mappa MapLibre di questa app.
// I servizi esterni passano dal Worker proxy (CORS); i layer aggiunti si ricordano in archivio.js.
import { BBOX_PALERMO, intersezione, vistaPalermo, filtraSuConfine } from './area.js';
import { aggiungi as salvaAggiungi, rimuovi as salvaRimuovi, aggiorna as salvaAggiorna } from './archivio.js';

const COLORI = ['#1c7ed6', '#e8590c', '#2f9e44', '#ae3ec9', '#c92a2a', '#0c8599'];
const FINESTRA_DOWNLOAD_MS = 30000;
const SEMBRA_DATI = /getfeature(?!info)|\.geojson|f=geojson|outputformat=[^&]*json/i;
const GET_FEATURE = /request=getfeature(?!info)/i;
const SOLO_CONTEGGIO = /resulttype=hits/i;
const CON_AREA = /[?&](bbox|filter|cql_filter)=/i;

function hash(testo) {
  let h = 5381;
  for (let i = 0; i < testo.length; i++) h = ((h << 5) + h + testo.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

// https://host/percorso?query → <proxy>/t/host/percorso?query. Le graffe dei segnaposto ({z}, {bbox-epsg-3857}) restano com'erano.
export function urlProxy(proxy, url) {
  const m = String(url).match(/^https?:\/\/([^/?#]+)([^#]*)/i);
  if (!m) throw new Error(`indirizzo non valido: ${url}`);
  return `${proxy.replace(/\/$/, '')}/t/${m[1]}${m[2] || '/'}`;
}

export function creaHost({ map, proxy, stato: iniziale, scrivi, anelli = () => [], notifica = () => {}, pannello = {}, fetchFn = (...a) => fetch(...a) }) {
  let stato = iniziale;
  const layers = new Map(); // id → { id, tipo, nome, visibile, sorgente, idMappa[], idSorgente, salvato, indisponibile?, errore? }
  const ascoltatori = new Set();
  let ultimoDownload = null; // l'ultimo URL che sembra un download di dati: il plugin dà all'host i dati, non l'URL
  let avvisatoSalvataggio = false;
  let contatore = 0;

  const cambio = () => { for (const f of ascoltatori) f(); };
  const persisti = () => {
    if (scrivi(stato) || avvisatoSalvataggio) return;
    avvisatoSalvataggio = true;
    notifica('Non riesco a salvare i layer RNDT: restano finché la pagina è aperta.');
  };
  const daSalvare = ({ id, tipo, nome, visibile, sorgente }) => ({ id, tipo, nome, visibile, sorgente });

  function registra(rec, { salva = true } = {}) {
    layers.set(rec.id, rec);
    if (salva && rec.salvato) { stato = salvaAggiungi(stato, daSalvare(rec)); persisti(); }
    cambio();
    return rec.id;
  }

  function togliDallaMappa(rec) {
    for (const l of rec.idMappa) if (map.getLayer(l)) map.removeLayer(l);
    if (map.getSource(rec.idSorgente)) map.removeSource(rec.idSorgente);
  }

  function creaWms(nome, opz, salva) {
    if (opz.crs && opz.crs !== 'EPSG:3857') throw new Error(`CRS ${opz.crs} non supportato dalla mappa`);
    const id = `rndt-${hash(`wms|${opz.url}|${opz.layers}`)}`;
    if (layers.has(id)) return id;
    const v13 = String(opz.version).startsWith('1.3');
    const q = new URL(opz.url);
    const imposta = (k, v) => q.searchParams.set(k, v);
    imposta('SERVICE', 'WMS'); imposta('REQUEST', 'GetMap'); imposta('VERSION', opz.version); imposta('LAYERS', opz.layers);
    imposta('STYLES', ''); imposta('FORMAT', opz.format ?? 'image/png'); imposta('TRANSPARENT', String(opz.transparent !== false));
    imposta('WIDTH', '256'); imposta('HEIGHT', '256'); imposta(v13 ? 'CRS' : 'SRS', 'EPSG:3857');
    const bounds = (opz.bounds && intersezione(opz.bounds, BBOX_PALERMO)) || BBOX_PALERMO; // niente tile fuori da Palermo
    map.addSource(id, { type: 'raster', tiles: [`${urlProxy(proxy, q.toString())}&BBOX={bbox-epsg-3857}`], tileSize: 256, bounds });
    map.addLayer({ id, type: 'raster', source: id });
    return registra({ id, tipo: 'wms', nome, visibile: true, sorgente: { ...opz }, idMappa: [id], idSorgente: id, salvato: true }, { salva });
  }

  function creaTile(nome, url, opz = {}, salva) {
    const id = `rndt-${hash(`tile|${url}`)}`;
    if (layers.has(id)) return id;
    map.addSource(id, { type: 'raster', tiles: [urlProxy(proxy, url)], tileSize: 256, attribution: opz.attribution, bounds: BBOX_PALERMO });
    map.addLayer({ id, type: 'raster', source: id });
    return registra({ id, tipo: 'tile', nome, visibile: true, sorgente: { url, attribution: opz.attribution }, idMappa: [id], idSorgente: id, salvato: true }, { salva });
  }

  function creaGeoJson(nome, fc, url, salva) {
    const { fc: dati, filtrato } = filtraSuConfine(fc, anelli());
    if (filtrato && !dati.features.length) throw new Error('nessuna feature dentro il Comune di Palermo');
    const id = `rndt-${hash(url ? `geojson|${url}` : `geojson|${nome}|${contatore++}`)}`;
    if (layers.has(id)) { togliDallaMappa(layers.get(id)); layers.delete(id); }
    const colore = COLORI[parseInt(hash(nome), 36) % COLORI.length];
    map.addSource(id, { type: 'geojson', data: dati });
    const strati = [
      { id: `${id}-fill`, type: 'fill', source: id, filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': colore, 'fill-opacity': 0.3 } },
      { id: `${id}-line`, type: 'line', source: id, filter: ['!=', ['geometry-type'], 'Point'], paint: { 'line-color': colore, 'line-width': 2 } },
      { id: `${id}-pt`, type: 'circle', source: id, filter: ['==', ['geometry-type'], 'Point'], paint: { 'circle-color': colore, 'circle-radius': 5, 'circle-stroke-color': '#fff', 'circle-stroke-width': 1.5 } },
    ];
    for (const s of strati) map.addLayer(s);
    return registra({
      id, tipo: 'geojson', nome, visibile: true, sorgente: url ? { url } : {}, idMappa: strati.map(s => s.id), idSorgente: id, salvato: Boolean(url),
    }, { salva });
  }

  async function fetchArrayBuffer(url) {
    if (GET_FEATURE.test(url) && !SOLO_CONTEGGIO.test(url) && !CON_AREA.test(url)) {
      throw new Error('download limitato a Palermo: attiva «Only features in the current map view»');
    }
    const risposta = await fetchFn(urlProxy(proxy, url));
    if (!risposta.ok) throw new Error(`HTTP ${risposta.status}`);
    const buffer = await risposta.arrayBuffer();
    if (SEMBRA_DATI.test(url) && !SOLO_CONTEGGIO.test(url)) ultimoDownload = { url, t: Date.now() };
    return buffer;
  }

  function impostaVisibilita(id, visibile, salva = true) {
    const rec = layers.get(id);
    if (!rec) return;
    for (const l of rec.idMappa) if (map.getLayer(l)) map.setLayoutProperty(l, 'visibility', visibile ? 'visible' : 'none');
    rec.visibile = visibile;
    if (salva && rec.salvato) { stato = salvaAggiorna(stato, id, { visibile }); persisti(); }
    cambio();
  }

  map.on('error', e => {
    const rec = e?.sourceId && layers.get(e.sourceId);
    if (!rec || rec.errore) return;
    rec.errore = true; // un solo avviso per layer; non si disattiva (un tile mancante non è un layer rotto)
    notifica(`Layer RNDT con errori di caricamento: ${rec.nome}`);
    cambio();
  });

  return {
    getMap: () => map,
    getViewBounds() {
      const b = map.getBounds();
      return vistaPalermo([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    },
    fitBounds: bbox => map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 40, duration: 500 }),
    getLayers: () => [...layers.keys()],
    getDrawnFeatures: () => [],
    getProjectSnapshot: () => ({
      layers: [...layers.values()].map(r => (r.tipo === 'wms'
        ? { id: r.id, type: 'wms', source: { url: r.sorgente.url, layers: r.sorgente.layers } }
        : r.tipo === 'tile' ? { id: r.id, type: 'xyz', source: { tiles: [r.sorgente.url] } } : { id: r.id, type: 'geojson' })),
    }),
    addWmsLayer: (nome, opz) => creaWms(nome, opz, true),
    addTileLayer: (nome, url, opz) => creaTile(nome, url, opz, true),
    addGeoJsonLayer(nome, fc) {
      const recente = ultimoDownload && Date.now() - ultimoDownload.t < FINESTRA_DOWNLOAD_MS ? ultimoDownload.url : null;
      ultimoDownload = null;
      return creaGeoJson(nome, fc, recente, true);
    },
    fetchArrayBuffer,
    exportTextFile(nome, contenuto, opz = {}) {
      const url = URL.createObjectURL(new Blob([contenuto], { type: opz.mimeType ?? 'text/plain' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: nome });
      a.click();
      URL.revokeObjectURL(url);
    },
    openExternalUrl: url => window.open(url, '_blank', 'noopener,noreferrer'),
    activatePlugin: async () => false,
    registerRightPanel: reg => pannello.registra?.(reg) ?? (() => {}),
    registerToolbarMenu: () => () => {}, // il pannello si apre dall'icona della scheda e dalla barra strumenti
    openRightPanel: () => pannello.apri?.(),
    closeRightPanel: () => pannello.chiudi?.(),

    elenco: () => [...layers.values()].map(({ id, tipo, nome, visibile, indisponibile, errore, salvato, sorgente }) => ({
      id, tipo, nome, visibile, indisponibile: Boolean(indisponibile), errore: Boolean(errore), salvato, sorgente,
    })),
    mostra: impostaVisibilita,
    elimina(id) {
      const rec = layers.get(id);
      if (!rec) return;
      togliDallaMappa(rec);
      layers.delete(id);
      stato = salvaRimuovi(stato, id);
      persisti();
      cambio();
    },
    async ripristina() {
      for (const salvato of stato.layers) {
        try {
          if (salvato.tipo === 'wms') creaWms(salvato.nome, salvato.sorgente, false);
          else if (salvato.tipo === 'tile') creaTile(salvato.nome, salvato.sorgente.url, { attribution: salvato.sorgente.attribution }, false);
          else {
            const buffer = await fetchArrayBuffer(salvato.sorgente.url);
            creaGeoJson(salvato.nome, JSON.parse(new TextDecoder().decode(buffer)), salvato.sorgente.url, false);
          }
          if (salvato.visibile === false) impostaVisibilita(salvato.id, false, false);
        } catch {
          layers.set(salvato.id, { ...salvato, idMappa: [], idSorgente: salvato.id, salvato: true, indisponibile: true });
        }
      }
      cambio();
    },
    featureAlPunto(id, punto, r = 4) {
      const presenti = (layers.get(id)?.idMappa ?? []).filter(l => map.getLayer(l));
      if (!presenti.length) return [];
      return map.queryRenderedFeatures([[punto.x - r, punto.y - r], [punto.x + r, punto.y + r]], { layers: presenti });
    },
    suCambio(fn) { ascoltatori.add(fn); return () => ascoltatori.delete(fn); },
  };
}
```

Nota: in `ripristina`, `creaGeoJson` restituisce l'`id` calcolato da `geojson|<url>`, uguale a quello salvato perché l'id salvato derivava dallo stesso URL.

- [ ] **Step 4: Eseguire il test e verificare che passi**

Run: `node --test tests/js/rndt-host.test.mjs`
Atteso: PASS, 14 test. Se `ripristina` fallisce sull'`id` del GeoJSON (il test usa `rndt-g`), è normale che l'id ricalcolato sia diverso da `rndt-g`: il test controlla solo `sorgenti.size` e `indisponibile`, quindi non dipende dall'id.

- [ ] **Step 5: Commit**

```bash
git add js/rndt/host.js tests/js/rndt-host.test.mjs
git commit -m "feat(rndt): shim delle API GeoLibre sulla mappa MapLibre"
```

---

### Task 6: Worker Cloudflare `rndt-proxy`

**Files:**
- Create: `worker/rndt-proxy.js`, `worker/wrangler.toml`, `docs/RNDT.md`
- Test: `tests/js/rndt-proxy.test.mjs`

**Interfaces:**
- Produces:
  - `LIMITE_BYTE = 10 * 1024 * 1024`
  - `ospiteValido(host) → boolean`
  - `urlDestinazione(request) → string | null` (da `/t/<host>/<percorso>?<query>` a `https://<host>/<percorso>?<query>`)
  - `gestisci(request, env, fetchFn) → Promise<Response>`; `env.ORIGINI` (lista separata da virgole, vuota = qualsiasi origine) e `env.LIMITE_BYTE`
  - `export default { fetch(request, env) }` (formato Worker)

- [ ] **Step 1: Scrivere il test che fallisce**

```js
// tests/js/rndt-proxy.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { gestisci, ospiteValido, urlDestinazione, LIMITE_BYTE } from '../../worker/rndt-proxy.js';

const rq = (percorso, init = {}) => new Request(`https://proxy.test${percorso}`, init);
const ORIGINE = 'https://dt.example';
const env = { ORIGINI: `${ORIGINE}, http://localhost:8000` };
const upstream = (corpo = 'ciao', init = {}) => async () => new Response(corpo, { status: 200, headers: { 'content-type': 'text/plain', 'set-cookie': 'a=b', ...init } });

test('ospiteValido: solo nomi pubblici, niente IP, localhost, porte o nomi senza punto', () => {
  assert.equal(ospiteValido('geodati.gov.it'), true);
  for (const no of ['localhost', '10.0.0.1', '192.168.1.1', '[::1]', 'intranet', 'x.internal', 'a.local', 'a.com:8080']) assert.equal(ospiteValido(no), false, no);
});

test('urlDestinazione: rotta /t/<host>/<percorso>?<query>', () => {
  assert.equal(urlDestinazione(rq('/t/geodati.gov.it/RNDT/q?a=1&b={x}')), 'https://geodati.gov.it/RNDT/q?a=1&b={x}');
  assert.equal(urlDestinazione(rq('/t/host.it')), 'https://host.it/');
  assert.equal(urlDestinazione(rq('/altro')), null);
  assert.equal(urlDestinazione(rq('/t/10.0.0.1/x')), null);
  assert.equal(urlDestinazione(rq('/t/localhost/x')), null);
});

test('metodo diverso da GET/HEAD = 405; OPTIONS = 204 con CORS', async () => {
  assert.equal((await gestisci(rq('/t/a.it/x', { method: 'POST', headers: { origin: ORIGINE } }), env, upstream())).status, 405);
  const pre = await gestisci(rq('/t/a.it/x', { method: 'OPTIONS', headers: { origin: ORIGINE } }), env, upstream());
  assert.equal(pre.status, 204);
  assert.equal(pre.headers.get('access-control-allow-origin'), ORIGINE);
});

test('origine non ammessa o assente = 403; senza lista ORIGINI passa chiunque', async () => {
  assert.equal((await gestisci(rq('/t/a.it/x', { headers: { origin: 'https://evil.example' } }), env, upstream())).status, 403);
  assert.equal((await gestisci(rq('/t/a.it/x'), env, upstream())).status, 403);
  assert.equal((await gestisci(rq('/t/a.it/x', { headers: { origin: 'https://qualunque.example' } }), {}, upstream())).status, 200);
});

test('host non valido = 400', async () => {
  assert.equal((await gestisci(rq('/t/10.0.0.1/x', { headers: { origin: ORIGINE } }), env, upstream())).status, 400);
});

test('GET ok: corpo, CORS, niente cookie, nessuna cache', async () => {
  let chiamato;
  const r = await gestisci(rq('/t/a.it/ows?x=1', { headers: { origin: ORIGINE } }), env, async (u, init) => { chiamato = [u, init]; return upstream()(); });
  assert.equal(chiamato[0], 'https://a.it/ows?x=1');
  assert.equal(await r.text(), 'ciao');
  assert.equal(r.headers.get('access-control-allow-origin'), ORIGINE);
  assert.equal(r.headers.get('set-cookie'), null);
  assert.equal(r.headers.get('cache-control'), 'no-store');
  assert.equal(r.headers.get('content-type'), 'text/plain');
});

test('risposta oltre il limite: 413 se lo dichiara, errore sul flusso altrimenti', async () => {
  const dichiara = await gestisci(rq('/t/a.it/x', { headers: { origin: ORIGINE } }), env, upstream('x', { 'content-length': String(LIMITE_BYTE + 1) }));
  assert.equal(dichiara.status, 413);
  const flusso = await gestisci(rq('/t/a.it/x', { headers: { origin: ORIGINE } }), { ...env, LIMITE_BYTE: 10 }, upstream('x'.repeat(100)));
  await assert.rejects(flusso.text());
});

test('servizio irraggiungibile = 502', async () => {
  const r = await gestisci(rq('/t/a.it/x', { headers: { origin: ORIGINE } }), env, async () => { throw new Error('giù'); });
  assert.equal(r.status, 502);
});
```

- [ ] **Step 2: Eseguire il test e verificare che fallisca**

Run: `node --test tests/js/rndt-proxy.test.mjs`
Atteso: FAIL, modulo non trovato.

- [ ] **Step 3: Implementare il Worker**

```js
// worker/rndt-proxy.js
// Proxy CORS per i servizi del catalogo RNDT (WMS, WFS, GeoJSON, catalogo). Rotta: /t/<host>/<percorso>?<query>
// Non è un proxy aperto: solo https, solo GET/HEAD, solo nomi pubblici (niente IP, localhost, porte), solo dalle origini
// in ORIGINI e al massimo 10 MB per risposta. Nessuna cache e nessun cookie.

export const LIMITE_BYTE = 10 * 1024 * 1024;
const PRIVATO = /^(localhost|.*\.(local|localhost|internal|lan|home|corp))$/i;

export function ospiteValido(host) {
  const h = String(host).toLowerCase();
  if (h.includes(':') || h.startsWith('[') || !h.includes('.') || PRIVATO.test(h)) return false;
  return !/^\d+\.\d+\.\d+\.\d+$/.test(h);
}

export function urlDestinazione(richiesta) {
  const u = new URL(richiesta.url);
  const m = u.pathname.match(/^\/t\/([^/]+)(\/.*)?$/);
  if (!m) return null;
  const host = decodeURIComponent(m[1]);
  return ospiteValido(host) ? `https://${host}${m[2] ?? '/'}${u.search}` : null;
}

const risposta = (stato, testo, intestazioni = {}) => new Response(JSON.stringify({ errore: testo }), {
  status: stato, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...intestazioni },
});

export async function gestisci(richiesta, env, fetchFn) {
  const ammesse = String(env?.ORIGINI ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const origine = richiesta.headers.get('origin');
  if (ammesse.length && !ammesse.includes(origine)) return risposta(403, 'origine non ammessa');
  const cors = { 'access-control-allow-origin': origine ?? '*', vary: 'Origin' };
  if (richiesta.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...cors, 'access-control-allow-methods': 'GET, HEAD, OPTIONS', 'access-control-allow-headers': '*', 'access-control-max-age': '86400' } });
  }
  if (richiesta.method !== 'GET' && richiesta.method !== 'HEAD') return risposta(405, 'metodo non ammesso', cors);
  const destinazione = urlDestinazione(richiesta);
  if (!destinazione) return risposta(400, 'indirizzo non valido', cors);

  let remota;
  try {
    remota = await fetchFn(destinazione, {
      method: richiesta.method, redirect: 'follow',
      headers: { accept: richiesta.headers.get('accept') ?? '*/*', 'user-agent': 'DigitalTwinPalermo-RNDT-proxy' },
    });
  } catch {
    return risposta(502, 'servizio non raggiungibile', cors);
  }
  const limite = Number(env?.LIMITE_BYTE) || LIMITE_BYTE;
  if (Number(remota.headers.get('content-length')) > limite) return risposta(413, 'risposta troppo grande', cors);

  let letti = 0;
  const controllo = new TransformStream({
    transform(blocco, flusso) {
      letti += blocco.byteLength;
      if (letti > limite) flusso.error(new Error('risposta troppo grande'));
      else flusso.enqueue(blocco);
    },
  });
  const intestazioni = { ...cors, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
  for (const k of ['content-type', 'content-length']) if (remota.headers.get(k)) intestazioni[k] = remota.headers.get(k);
  return new Response(remota.body ? remota.body.pipeThrough(controllo) : null, { status: remota.status, headers: intestazioni });
}

export default { fetch: (richiesta, env) => gestisci(richiesta, env, fetch) };
```

- [ ] **Step 4: Eseguire il test e verificare che passi**

Run: `node --test tests/js/rndt-proxy.test.mjs`
Atteso: PASS, 8 test.

- [ ] **Step 5: Configurazione di deploy e documentazione**

Trova le origini di produzione e la porta di sviluppo:

```bash
grep -n "https\?://" docs/ARCHITETTURA_HOSTING.md | head -20
grep -n "port\|8000\|8080" scripts/serve.py docs/ISTRUZIONI_SERVER.md | head
```

Crea `worker/wrangler.toml` (aggiungi a `ORIGINI` ogni origine di produzione trovata sopra, separata da virgola; `localhost` è la porta di `scripts/serve.py`):

```toml
name = "rndt-proxy"
main = "rndt-proxy.js"
compatibility_date = "2026-09-01"
workers_dev = true

[vars]
ORIGINI = "http://localhost:8000,http://127.0.0.1:8000"
```

Crea `docs/RNDT.md`:

```markdown
# Catalogo RNDT

Dalla scheda del luogo, l'icona «cloud» (o il pulsante RNDT nella barra strumenti) apre il catalogo RNDT, limitato all'area di Palermo.

- Cerca per testo, tema INSPIRE, ente. Aggiungi servizi WMS/WFS/GeoJSON alla mappa.
- I layer aggiunti restano nell'elenco «Layer aggiunti» del pannello e tornano alla riapertura dell'app (solo i WFS scaricati da un URL noto; gli altri valgono per la sessione).
- Il clic sulla mappa interroga i layer RNDT visibili: la tab **Altri dati (RNDT)** della scheda mostra gli attributi. I WMS usano `GetFeatureInfo`, i WFS le feature già in mappa.
- Il download WFS è sempre limitato a Palermo; le feature fuori dal Comune si scartano (sotto 5000 feature).

## Proxy CORS (Cloudflare Worker)

I servizi di terzi non danno CORS: tutto passa da `worker/rndt-proxy.js`. Rotta `/t/<host>/<percorso>?<query>`; solo https, GET/HEAD, nomi pubblici, max 10 MB, nessuna cache.

```bash
cd worker
npx wrangler deploy
```

`wrangler` stampa l'indirizzo (`https://rndt-proxy.<account>.workers.dev`). Scrivilo in `PROXY_RNDT` di `js/rndt/index.js`, oppure prova al volo con `?rndt-proxy=<indirizzo>` nell'URL dell'app. Aggiungi le origini di produzione a `ORIGINI` in `wrangler.toml`. I tile WMS passano dal Worker: il piano gratuito ha 100.000 richieste al giorno.
```

- [ ] **Step 6: Commit**

```bash
git add worker docs/RNDT.md tests/js/rndt-proxy.test.mjs
git commit -m "feat(rndt): Worker Cloudflare come proxy CORS dei servizi RNDT"
```

---

### Task 7: `scheda.js` — tab RNDT, icona nell'header, sezioni asincrone

**Files:**
- Modify: `js/core/scheda-modello.js` (aggiunge `sezioniConRitardo`), `js/core/scheda.js`
- Test: `tests/js/scheda-ritardo.test.mjs`

**Interfaces:**
- Consumes: `unisci(voci) → { contesto, sezioni, legale }` (esistente).
- Produces:
  - `sezioniConRitardo(dati, nuovi, prefisso = 'rndt:') → dati` (toglie le sezioni con chiave che inizia per `prefisso`, aggiunge quelle di `nuovi`, ordina per `peso`, `legale` = vecchio OR nuovo)
  - `collegaScheda(map, moduli, contenitore, opzioni = {})`, con `opzioni.rndt` = `{ apri(), layerAlPunto(lngLat) → layer[], segnaposto() → voce, interroga(layers, lngLat, point, zoom) → Promise<voce[]> }`
  - `mostra(...)` ora **restituisce** `{ aggiungi(nuovi) }`, dove `nuovi` è il risultato di `unisci()`

- [ ] **Step 1: Scrivere il test che fallisce**

```js
// tests/js/scheda-ritardo.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { unisci, sezioniConRitardo } from '../../js/core/scheda-modello.js';

const indirizzo = { chiave: 'indirizzo', peso: 10, titolo: 'Indirizzo', gruppi: [{ righe: [{ etichetta: 'Via', valore: 'VIA ROMA' }] }] };
const attesa = { chiave: 'rndt:attesa', peso: 100, titolo: 'Altri dati (RNDT)', sempre: true, gruppi: [{ righe: [{ etichetta: 'Stato', valore: 'in corso' }] }] };
const risultato = { chiave: 'rndt:rndt-1:0', peso: 100, titolo: 'PAI', legale: true, gruppi: [{ righe: [{ etichetta: 'Classe', valore: 'P3' }] }] };

test('le sezioni RNDT in ritardo sostituiscono il segnaposto e le altre restano', () => {
  const dati = unisci([indirizzo, attesa]);
  const nuovi = unisci([risultato]);
  const fuso = sezioniConRitardo(dati, nuovi);
  assert.deepEqual(fuso.sezioni.map(s => s.chiave), ['indirizzo', 'rndt:rndt-1:0']);
});

test('ordina per peso e porta il flag legale', () => {
  const dati = unisci([{ ...indirizzo, peso: 200 }, attesa]);
  const fuso = sezioniConRitardo(dati, unisci([risultato]));
  assert.deepEqual(fuso.sezioni.map(s => s.peso), [100, 200]);
  assert.equal(fuso.legale, true);
  assert.equal(sezioniConRitardo(unisci([indirizzo]), unisci([])).legale, false);
});

test('senza nuove sezioni toglie solo il segnaposto', () => {
  const fuso = sezioniConRitardo(unisci([indirizzo, attesa]), unisci([]));
  assert.deepEqual(fuso.sezioni.map(s => s.chiave), ['indirizzo']);
});
```

- [ ] **Step 2: Eseguire il test e verificare che fallisca**

Run: `node --test tests/js/scheda-ritardo.test.mjs`
Atteso: FAIL, `sezioniConRitardo` non esportata.

- [ ] **Step 3: Implementare `sezioniConRitardo` in `js/core/scheda-modello.js`**

Aggiungi, dopo la funzione `unisci`:

```js
// Sezioni che arrivano dopo l'apertura della scheda (es. RNDT, dopo le risposte dei servizi): prendono il posto di quelle
// con la stessa famiglia di chiave (il segnaposto incluso). `nuovi` è il risultato di `unisci()` sulle voci arrivate.
export function sezioniConRitardo(dati, nuovi, prefisso = 'rndt:') {
  const rimaste = dati.sezioni.filter(s => !String(s.chiave).startsWith(prefisso));
  return { ...dati, sezioni: [...rimaste, ...nuovi.sezioni].sort((a, b) => a.peso - b.peso), legale: dati.legale || nuovi.legale };
}
```

- [ ] **Step 4: Eseguire il test e verificare che passi**

Run: `node --test tests/js/scheda-ritardo.test.mjs`
Atteso: PASS, 3 test.

- [ ] **Step 5: `scheda.js` — import, tab e `tabDi`**

Modifica 1, la riga di import:

```js
import { unisci, testoContesto, titoloScheda, separaMancanti, dividiDettaglio, valoreLungo, NOTA_LEGALE } from './scheda-modello.js';
```
diventa:
```js
import { unisci, sezioniConRitardo, testoContesto, titoloScheda, separaMancanti, dividiDettaglio, valoreLungo, NOTA_LEGALE } from './scheda-modello.js';
```

Modifica 2, nella costante `SCHEDE` aggiungi la tab in fondo:

```js
const SCHEDE = [['luogo', 'Luogo'], ['strumenti', 'Strumenti urbanistici'], ['mercato', 'Mercato'], ['popolazione', 'Popolazione'], ['terreno', 'Terreno'], ['servizi', 'Servizi su strada'], ['rndt', 'Altri dati (RNDT)']];
```

Modifica 3, la riga `const tabDi = ...`: davanti alla condizione esistente aggiungi il caso 100:

```js
const tabDi = (p, chiave = '') => (p === 100 ? 'rndt' : p === 20 || p === 40 || p === 50 || /^(pai|incendio)[:-]/.test(String(chiave)) ? 'strumenti' : p === 60 ? 'mercato' : p === 70 ? 'popolazione' : p === 80 ? 'terreno' : p === 90 ? 'servizi' : 'luogo');
```

- [ ] **Step 6: `scheda.js` — `mostra` accetta `rndt`, usa `corrente`, restituisce `aggiungi`**

Firma:

```js
function mostra(contenitore, lngLat, dati, chiusura, adattaVista, pref) {
```
diventa:
```js
function mostra(contenitore, lngLat, dati, chiusura, adattaVista, pref, rndt) {
```

Subito dopo `const { contesto, sezioni, legale } = dati;` aggiungi:

```js
  let corrente = dati; // le sezioni RNDT arrivano dopo: `aggiungi` le fonde qui e ridisegna il corpo
```

In `aggiorna`, la riga:

```js
    const visibili = applicaPreferenze(dati, pref.leggi());
```
diventa:
```js
    const visibili = applicaPreferenze(corrente, pref.leggi());
```

Prima di `const annuncio = ...` (dopo il blocco `personalizza`) aggiungi il pulsante RNDT:

```js
  const catalogo = el('button', 'scheda-azione scheda-rndt');
  catalogo.type = 'button';
  catalogo.title = 'Catalogo RNDT: aggiungi dati alla mappa';
  catalogo.setAttribute('aria-label', 'Apri il catalogo RNDT');
  catalogo.innerHTML = ICONA_RNDT;
  catalogo.addEventListener('click', () => rndt?.apri());
```

La riga `azioni.append(copia, stampa, personalizza, x);` diventa:

```js
  azioni.append(copia, stampa, ...(rndt ? [catalogo] : []), personalizza, x);
```

Vicino alle altre icone (dopo `ICONA_X`) aggiungi:

```js
const ICONA_RNDT = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>';
```

In fondo a `mostra`, dopo `adattaVista(lngLat); // la mappa si centra ...` aggiungi:

```js
  return {
    aggiungi(nuovi) {
      const y = corpo.scrollTop;
      corrente = sezioniConRitardo(corrente, nuovi);
      aggiorna();
      corpo.scrollTop = y; // l'arrivo di una risposta non riporta in cima chi sta leggendo
    },
  };
```

- [ ] **Step 7: `scheda.js` — `collegaScheda` interroga i layer RNDT**

Firma:

```js
export function collegaScheda(map, moduli, contenitore) {
```
diventa:
```js
export function collegaScheda(map, moduli, contenitore, opzioni = {}) {
  const rndt = opzioni.rndt;
```

Nel gestore `map.on('click', e => { ... })`, dopo il ciclo `for (const m of conScheda) { ... }` e prima di `const adattaVista = ...`, aggiungi:

```js
    const interrogabili = rndt ? rndt.layerAlPunto(e.lngLat) : [];
    if (interrogabili.length) voci.push(rndt.segnaposto()); // la scheda si apre subito: le risposte dei servizi arrivano dopo
```

La riga finale `mostra(contenitore, e.lngLat, dati, chiudiScheda, adattaVista, pref);` diventa:

```js
    const scheda = mostra(contenitore, e.lngLat, dati, chiudiScheda, adattaVista, pref, rndt);
    if (interrogabili.length) {
      const punto = contenitore.dataset.punto;
      rndt.interroga(interrogabili, e.lngLat, e.point, map.getZoom()).then(nuove => {
        if (contenitore.hidden || contenitore.dataset.punto !== punto) return; // la scheda ora è su un altro punto, o chiusa
        scheda.aggiungi(unisci(nuove));
      });
    }
```

- [ ] **Step 8: Eseguire tutta la suite JS**

Run: `npm run test:js`
Atteso: tutti i test passano (251 esistenti + quelli nuovi dei Task 2–7), nessun errore di import.

- [ ] **Step 9: Commit**

```bash
git add js/core/scheda-modello.js js/core/scheda.js tests/js/scheda-ritardo.test.mjs
git commit -m "feat(scheda): tab Altri dati (RNDT) con sezioni asincrone e icona nell'header"
```

---

### Task 8: Pannello overlay, cablaggio e stili

**Files:**
- Create: `js/rndt/pannello.js`, `js/rndt/index.js`
- Modify: `index.html`, `js/app.js`, `css/app.css`

**Interfaces:**
- Consumes: `creaHost`, `interrogaTutti`, `segnaposto`, `leggi`/`salva` (archivio), `anelliDaZone`, `BBOX_PALERMO`.
- Produces:
  - `creaPannello(elemento) → { registra(reg) → dispose, apri(), chiudi(), errore(testo), disegnaElenco(host) }`
  - `collegaRndt(map, elementoPannello) → { apri(), segnaposto(), layerAlPunto(lngLat), interroga(layers, lngLat, point, zoom), ripristina() }`
  - `PROXY_RNDT` (indirizzo del Worker; modificabile con `?rndt-proxy=`)

Task di integrazione col DOM: non ha test automatici (Node non ha DOM). La verifica è nel Task 9.

- [ ] **Step 1: `index.html` — overlay e pulsante nella barra strumenti**

Dopo la riga `<aside id="scheda" hidden aria-label="Scheda del luogo"></aside>` aggiungi:

```html
<aside id="rndt-pannello" hidden aria-label="Catalogo RNDT"></aside>
```

Nella `#barra-strumenti`, dopo il pulsante `btn-3d`, aggiungi:

```html
  <button id="btn-rndt" type="button" title="Catalogo RNDT: aggiungi dati alla mappa" aria-label="Catalogo RNDT">RNDT</button>
```

- [ ] **Step 2: `js/rndt/pannello.js`**

```js
// js/rndt/pannello.js
// Pannello del catalogo RNDT: si sovrappone alla scheda del luogo (desktop) o al foglio basso (mobile). Ospita la UI del
// plugin, l'elenco dei layer aggiunti e fa rispettare l'area di Palermo sui controlli del plugin.
import { BBOX_PALERMO } from './area.js';

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}

// Il plugin disegna i suoi controlli quando serve: a ogni cambiamento del DOM si rimettono i limiti d'area.
function limitaArea(radice) {
  const dove = radice.querySelector('select[name="where"]');
  if (dove && !dove.dataset.palermo) {
    dove.dataset.palermo = '1';
    for (const o of [...dove.options]) if (o.value !== 'view' && o.value !== 'box') o.remove(); // niente «Anywhere» né forme disegnate
    dove.value = 'box';
    const box = radice.querySelector('[name="box"]');
    if (box) box.value = BBOX_PALERMO.join(', ');
    dove.dispatchEvent(new Event('change'));
  }
  for (const label of radice.querySelectorAll('label.ordt-check')) {
    if (!/Only features in the current map view/.test(label.textContent)) continue;
    const casella = label.querySelector('input');
    if (!casella || casella.disabled) continue;
    casella.checked = true;
    casella.disabled = true;
    label.title = 'Il download è sempre limitato all’area di Palermo';
  }
}

export function creaPannello(elemento) {
  const testata = el('header', 'rndt-testata');
  const indietro = el('button', 'rndt-indietro', '‹ Scheda');
  indietro.type = 'button';
  indietro.setAttribute('aria-label', 'Chiudi il catalogo e torna alla scheda');
  testata.append(indietro, el('h2', null, 'Catalogo RNDT · Palermo'));
  const elenco = el('details', 'rndt-layer');
  elenco.hidden = true;
  const contenuto = el('div', 'rndt-contenuto');
  contenuto.append(el('p', 'rndt-attesa', 'Caricamento del catalogo…'));
  elemento.append(testata, elenco, contenuto);

  let registrazione = null;
  let montato = false;
  let osservatore = null;

  function monta() {
    if (montato || !registrazione) return;
    montato = true;
    contenuto.replaceChildren();
    registrazione.render(contenuto);
    limitaArea(contenuto);
    osservatore = new MutationObserver(() => limitaArea(contenuto));
    osservatore.observe(contenuto, { childList: true, subtree: true });
  }

  const chiudi = () => { elemento.hidden = true; };
  const apri = () => { elemento.hidden = false; monta(); };
  indietro.addEventListener('click', chiudi);
  // Esc chiude prima il catalogo, poi (al secondo Esc) la scheda: il gestore della scheda sta in fase di bolla
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || elemento.hidden) return;
    e.stopPropagation();
    chiudi();
  }, true);

  return {
    registra(reg) { registrazione = reg; return () => { registrazione = null; }; },
    apri,
    chiudi,
    errore(testo) { contenuto.replaceChildren(el('p', 'rndt-errore', testo)); },
    // elenco dei layer aggiunti: visibilità e rimozione, sempre allineato all'host
    disegnaElenco(host) {
      const lista = host.elenco();
      elenco.hidden = !lista.length;
      const sommario = el('summary', null, `Layer aggiunti (${lista.length})`);
      const voci = lista.map(l => {
        const riga = el('div', 'rndt-layer-riga');
        const etichetta = el('label');
        const casella = el('input');
        casella.type = 'checkbox';
        casella.checked = l.visibile && !l.indisponibile;
        casella.disabled = l.indisponibile;
        casella.addEventListener('change', () => host.mostra(l.id, casella.checked));
        etichetta.append(casella, ' ', l.nome);
        if (l.indisponibile) etichetta.append(' ', el('em', null, '(non disponibile)'));
        else if (!l.salvato) etichetta.append(' ', el('em', null, '(solo questa sessione)'));
        else if (l.errore) etichetta.append(' ', el('em', null, '(errori di caricamento)'));
        const rimuovi = el('button', 'rndt-rimuovi', 'Rimuovi');
        rimuovi.type = 'button';
        rimuovi.addEventListener('click', () => host.elimina(l.id));
        riga.append(etichetta, rimuovi);
        return riga;
      });
      const aperto = elenco.open;
      elenco.replaceChildren(sommario, ...voci);
      elenco.open = aperto;
    },
  };
}
```

- [ ] **Step 3: `js/rndt/index.js`**

```js
// js/rndt/index.js
// Catalogo RNDT: assembla shim, pannello e plugin (caricato solo al primo uso) e offre alla scheda l'interrogazione dei layer.
import { creaHost } from './host.js';
import { creaPannello } from './pannello.js';
import { interrogaTutti, segnaposto } from './info.js';
import { leggi, salva } from './archivio.js';
import { anelliDaZone } from './area.js';
import { urlDati } from '../core/config.js';
import { segnala } from '../core/pannello.js';

// Indirizzo del Worker (vedi docs/RNDT.md); per una prova: ?rndt-proxy=https://...
export const PROXY_RNDT = new URLSearchParams(location.search).get('rndt-proxy') || 'https://rndt-proxy.gbvitrano.workers.dev';
const PLUGIN = 'js/vendor/openrndt-geolibre/index.js';
const STILE = 'js/vendor/openrndt-geolibre/style.css';

export function collegaRndt(map, elementoPannello) {
  const archivio = (() => { try { return window.localStorage; } catch { return null; } })();
  let anelli = [];
  // il confine comunale serve al filtro dei download; è lo stesso file delle zone, già in cache del browser
  const anelliPronti = fetch(urlDati('popolazione/confini_zone.json')).then(r => r.json()).then(z => { anelli = anelliDaZone(z); }).catch(() => {});

  const pannello = creaPannello(elementoPannello);
  const host = creaHost({
    map, proxy: PROXY_RNDT, stato: leggi(archivio), scrivi: s => salva(archivio, s), anelli: () => anelli, notifica: segnala, pannello,
  });
  host.suCambio(() => pannello.disegnaElenco(host));

  let plugin = null;
  async function apri() {
    pannello.apri(); // subito visibile, con «Caricamento…» finché il plugin non è pronto
    if (plugin) return;
    try {
      await anelliPronti;
      document.head.append(Object.assign(document.createElement('link'), { rel: 'stylesheet', href: new URL(STILE, document.baseURI).href }));
      const modulo = await import(new URL(PLUGIN, document.baseURI).href);
      plugin = modulo.default;
      if (plugin.activate(host) === false) throw new Error('il plugin non è compatibile con questa mappa');
    } catch (errore) {
      plugin = null;
      pannello.errore(`Catalogo RNDT non disponibile: ${errore.message}`);
    }
  }

  const dentro = (l, { lng, lat }) => {
    const b = l.sorgente?.bounds;
    return !b || (lng >= b[0] && lng <= b[2] && lat >= b[1] && lat <= b[3]);
  };

  return {
    apri,
    segnaposto,
    layerAlPunto: lngLat => host.elenco().filter(l => l.visibile && !l.indisponibile && dentro(l, lngLat)),
    interroga: (layers, lngLat, point, zoom) => interrogaTutti({
      layers, lngLat: [lngLat.lng, lngLat.lat], zoom,
      leggiTesto: async url => new TextDecoder().decode(await host.fetchArrayBuffer(url)),
      featureAlPunto: l => host.featureAlPunto(l.id, point),
    }),
    async ripristina() { await anelliPronti; await host.ripristina(); },
  };
}
```

- [ ] **Step 4: `js/app.js` — import, cablaggio e errori dei layer RNDT**

Aggiungi l'import dopo `import { collegaScheda } from './core/scheda.js';`:

```js
import { collegaRndt } from './rndt/index.js';
```

Nel gestore `map.on('error', e => { if (!e.sourceId) return; ...`, la prima riga diventa (gli errori dei layer RNDT li segnala lo shim):

```js
  if (!e.sourceId || e.sourceId.startsWith('rndt-')) return;
```

Sostituisci la riga `collegaScheda(map, MODULI, document.getElementById('scheda'));` con:

```js
  const rndt = collegaRndt(map, document.getElementById('rndt-pannello'));
  collegaScheda(map, MODULI, document.getElementById('scheda'), { rndt });
  document.getElementById('btn-rndt').addEventListener('click', rndt.apri);
  rndt.ripristina(); // i layer RNDT della sessione precedente tornano sopra tutti gli altri
```

- [ ] **Step 5: `css/app.css` — stili del pannello**

Aggiungi in fondo al file:

```css
/* Catalogo RNDT: pannello che si sovrappone alla scheda del luogo */
#rndt-pannello { position: fixed; z-index: var(--z-foglio); left: 0; right: 0; bottom: 0; top: 8vh; display: flex; flex-direction: column; background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-sm) var(--r-sm) 0 0; box-shadow: var(--ombra); overflow: hidden; }
#rndt-pannello[hidden] { display: none; }
@media (min-width: 721px) { #rndt-pannello { top: 0; left: auto; width: var(--scheda-w); border-radius: 0; } }
.rndt-testata { flex: none; display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid var(--border); }
.rndt-testata h2 { margin: 0; font-size: var(--fs-md); font-weight: 700; }
.rndt-indietro { flex: none; min-height: 36px; padding: 0 12px; border: 1px solid var(--border-ui); border-radius: var(--r-pill); background: var(--surface); color: var(--text); font: inherit; cursor: pointer; }
.rndt-indietro:hover { background: var(--surface-hover); }
.rndt-layer { flex: none; padding: 8px 12px; border-bottom: 1px solid var(--border); background: var(--surface-alt); font-size: var(--fs-sm, 13px); }
.rndt-layer[hidden] { display: none; }
.rndt-layer summary { cursor: pointer; font-weight: 600; }
.rndt-layer-riga { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 4px 0; }
.rndt-layer-riga label { overflow-wrap: anywhere; }
.rndt-layer-riga em { color: var(--text-muted); }
.rndt-rimuovi { flex: none; border: 0; background: none; color: var(--link); font: inherit; cursor: pointer; }
.rndt-contenuto { flex: 1; min-height: 0; overflow: auto; }
.rndt-attesa, .rndt-errore { margin: 16px; color: var(--text-muted); }
.rndt-errore { color: var(--avviso-scheda-ink); }
```

- [ ] **Step 6: Eseguire la suite JS (nessuna regressione)**

Run: `npm run test:js`
Atteso: tutti i test passano.

- [ ] **Step 7: Commit**

```bash
git add js/rndt/pannello.js js/rndt/index.js index.html js/app.js css/app.css
git commit -m "feat(rndt): pannello sovrapposto alla scheda, cablaggio e stili"
```

---

### Task 9: Verifica nel browser, rifinitura e documentazione

**Files:**
- Modify: eventuali correzioni a `js/rndt/pannello.js` (selettori del plugin), `docs/RNDT.md`

Verifica manuale con chrome-devtools-mcp (Playwright e Chrome non sono disponibili in questo ambiente). Nessuna implementazione nuova, se non i ritocchi che la verifica richiede.

**Interfaces:** nessuna nuova.

- [ ] **Step 1: Avviare l'app e il Worker in locale**

Terminale A: `python3 scripts/serve.py` (annota la porta stampata). Terminale B: `cd worker && npx wrangler dev --port 8787` (usa la `ORIGINI` di `wrangler.toml`, che deve contenere l'origine con la porta di serve.py).

Apri `http://localhost:<porta>/?rndt-proxy=http://localhost:8787`.

- [ ] **Step 2: Verifiche funzionali (una per una, con screenshot o log di rete)**

1. Console senza errori all'avvio; il pulsante RNDT compare nella barra strumenti.
2. Clic sulla mappa: la scheda si apre; nell'header c'è l'icona «cloud» prima dell'ingranaggio. Con il layer RNDT assente **non** compare la tab RNDT.
3. Clic sull'icona: l'overlay copre la scheda; il plugin mostra la ricerca; «Where» contiene solo «Current map view» e «Box», con il bbox di Palermo.
4. Cerca «PAI» (o «catastale»): i risultati compaiono; la rete mostra richieste a `localhost:8787/t/geodati.gov.it/...` con 200.
5. Apri un record con WMS e aggiungi un layer: il layer compare sulla mappa; i tile vengono da `localhost:8787/t/<host>/...`.
6. Con un record WFS: la casella «Only features in the current map view» è spuntata e disabilitata; il download aggiunge un layer GeoJSON; nessuna richiesta `GetFeature` senza `BBOX`.
7. «‹ Scheda» chiude l'overlay e la scheda riappare; Esc con overlay aperto chiude solo l'overlay.
8. Clic sulla mappa sopra il layer WMS: la scheda mostra subito la tab «Altri dati (RNDT)» con «Interrogazione dei servizi in corso…», poi gli attributi (o «nessun dato in questo punto»).
9. Clic veloce su due punti: la scheda finale è quella del secondo punto (Review Focus 6).
10. Ricarica la pagina: il layer WMS e il WFS (se scaricato da URL noto) tornano; l'elenco «Layer aggiunti» li mostra; «Rimuovi» li toglie anche dopo un'altra ricarica.
11. Con `localStorage` bloccato (finestra in incognito con i cookie di terze parti bloccati, o un `Storage.prototype.setItem` che lancia da `evaluate_script`): l'app funziona e compare un solo avviso.

- [ ] **Step 3: Correggere i selettori del plugin se non combaciano**

Se i punti 3 o 6 falliscono, ispeziona il DOM del plugin (`take_snapshot`) e correggi in `js/rndt/pannello.js` i selettori `select[name="where"]`, `[name="box"]`, `label.ordt-check`. Il bundle non si tocca. Ripeti il punto fallito.

- [ ] **Step 4: Aggiornare `docs/RNDT.md` con gli esiti**

Aggiungi in fondo una sezione «Limiti noti» con quanto emerso (esempio: servizi solo `http`, servizi che non supportano `GetFeatureInfo`, CRS diversi da EPSG:3857 rifiutati).

- [ ] **Step 5: Aggiornare il grafo e la suite**

```bash
npm run test:js
graphify update .
```
Atteso: tutti i test passano; il grafo si aggiorna senza errori.

- [ ] **Step 6: Commit**

```bash
git add -A js css index.html docs/RNDT.md graphify-out
git commit -m "docs(rndt): esiti della verifica nel browser e limiti noti"
```

---

## Self-Review

**1. Copertura della spec**

| Requisito della spec | Task |
|---|---|
| Plugin riusato senza modifiche | 1 (copia), 5 (shim) |
| Icona nell'header, overlay sulla scheda, chiusura con ritorno alla scheda | 7 (icona), 8 (overlay, «‹ Scheda», Esc) |
| Layer che restano e si salvano tra le sessioni | 3 (archivio), 5 (`ripristina`), 8 (`ripristina()` all'avvio) |
| Cloudflare Worker come proxy CORS | 6 |
| Tab «Altri dati (RNDT)» con info al clic, in modo asincrono | 4 (info), 7 (`aggiungi`), 8 (cablaggio) |
| Solo Palermo: bbox, WFS sempre limitato, filtro sul confine | 2, 5 (`getViewBounds`, guardia su GetFeature), 8 (UI del plugin) |
| Errori: timeout 8 s, avvisi, localStorage bloccato | 4, 5 |
| Avviso «dati di terzi, senza valore legale» | 4 (`legale: true` → `NOTA_LEGALE`) |
| Pulsante RNDT nella barra strumenti | 8 |
| Licenza del bundle da verificare | 1 |
| Test e verifica nel browser | 2–7 (unit), 9 (browser) |

Il punto della spec «punto senza dati: la scheda si apre comunque se c'è un layer RNDT attivo» è coperto in Task 7 Step 7 (il segnaposto rende non vuote le sezioni).

**2. Segnaposto e riferimenti non definiti**: nessun «TBD». Gli unici valori da sostituire a mano sono nel Task 1 Step 3 (licenza trovata) e nel Task 6 Step 5 (origini di produzione e indirizzo del Worker dopo il deploy), ciascuno con il comando che dà il dato.

**3. Coerenza di tipi e nomi**: `creaHost`, `urlProxy`, `elenco`, `mostra`, `elimina`, `ripristina`, `featureAlPunto`, `suCambio` (Task 5) sono gli stessi usati nei Task 8; `interrogaTutti`, `segnaposto`, `vociDa` (Task 4) sono quelli importati da `index.js`; `sezioniConRitardo` (Task 7) è quella importata da `scheda.js`; `filtraSuConfine`, `anelliDaZone`, `vistaPalermo`, `BBOX_PALERMO` (Task 2) sono usati identici in Task 5 e 8. Le chiavi `rndt:` e il `peso: 100` coincidono tra Task 4 (voci), Task 7 (`tabDi`, prefisso) e Global Constraints.

**4. Review Focus**: ogni riga ha un test: 1 → Task 5 («nessuna feature dentro»), 2 → Task 3 e 5 (storage bloccato), 3 → Task 4 (HTML con script, troncamento), 4 → Task 4 (timeout), 5 → Task 6, 6 → Task 9 punto 9 (richiede il DOM).
