# RNDT: file dal computer e dati in IndexedDB — Piano di implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** L'utente carica nel gruppo «RNDT» file GIS dal proprio computer (GeoJSON, KML, KMZ, GPX, Shapefile zip, CSV); i dati senza URL (file locali o GeoJSON del catalogo senza URL riconosciuto) si salvano in IndexedDB, fino a 5 MB per layer, e tornano alla riapertura.

**Architecture:** `js/rndt/importa.js` (puro, senza DOM né librerie) riconduce ogni formato a una `FeatureCollection` WGS84; le librerie per KML/GPX/KMZ/Shapefile stanno in `js/vendor/` e `js/rndt/librerie.js` le carica solo al primo uso. `js/rndt/dati.js` è un archivio asincrono dei dati (IndexedDB, più una versione in memoria per i test). `host.js` salva i dati dopo l'aggiunta del layer e li rilegge in `ripristina()`; `gruppo.js` ha il pulsante «Carica file dal computer».

**Tech Stack:** JavaScript ES modules senza build, `node --test` (`npm run test:js`), MapLibre GL, `@tmcw/togeojson` 7.1.2, `shpjs` 6.2.0, `fflate` 0.8.3 (vendorizzate in `js/vendor/`), IndexedDB.

**Spec:** `docs/superpowers/specs/2026-10-04-rndt-file-locali-design.md`

## Global Constraints

- Testi per l'utente (avvisi, errori, etichette) in italiano, con gli accenti.
- Tetto dei dati salvati: 5 MB per layer (`TETTO_DATI = 5_000_000`, lunghezza del testo JSON).
- Le librerie si caricano con `import()` solo al primo file di quel formato; l'avvio dell'app non cambia.
- Il tipo di file si decide dall'estensione (minuscole/maiuscole indifferenti), mai dal tipo MIME.
- Coordinate sempre WGS84 in uscita da `importaFile`; GeoJSON/CSV non WGS84 si rifiutano, non si riproiettano.
- Ogni layer da file passa dal filtro sul confine di Palermo di `host` (`filtraSuConfine`).
- Un file non valido non aggiunge nulla e dà un avviso con nome del file e motivo.
- Layer in ordine alfabetico italiano nel gruppo e nella tab Argomenti (già così: non toccare).
- Nessuna dipendenza da Chrome nei test: i test Node usano archivio e librerie finti; le parti nel browser si verificano a mano.

## Review Focus

- File con estensione maiuscola (`PARCHI.KML`): deve essere letto come `.kml` → test in Task 1.
- CSV con BOM, separatore `;`, virgola decimale e campi tra virgolette con a capo → test in Task 1.
- Shapefile zip senza `.prj` con coordinate in metri: errore chiaro, non un layer fuori mappa → test in Task 1.
- File locale caricato entro 30 s da un download del catalogo: deve salvarsi coi suoi dati, non con l'URL del download → test in Task 4.
- Layer rimosso mentre la scrittura dei dati è ancora in corso: non deve restare nulla nell'archivio né nell'elenco → test in Task 4.
- IndexedDB assente o bloccato (archivio `null`, scrittura che fallisce): layer in mappa, solo sessione, avviso, gli altri layer si salvano ancora → test in Task 4.
- Dati salvati spariti da IndexedDB al riavvio: il layer compare «non disponibile», niente errore e niente crash → test in Task 4.
- Layer del vecchio formato (dati dentro `localStorage`): si leggono ancora e passano a IndexedDB → test in Task 4.

## Struttura dei file

| File | Responsabilità |
|---|---|
| `js/rndt/importa.js` (nuovo) | `ESTENSIONI`, `nomeLayer`, `importaFile`: file → `FeatureCollection` WGS84 + avvisi; lettori GeoJSON e CSV interni; riceve KML/GPX/KMZ/Shapefile da `lib`. |
| `js/rndt/librerie.js` (nuovo) | `librerie`: carica a richiesta le librerie vendorizzate e le adatta all'interfaccia di `importaFile`. |
| `js/vendor/togeojson.es.mjs`, `shp.esm.min.js`, `fflate.esm.js` + licenze (nuovi) | Librerie di terzi, copiate così come sono. |
| `js/rndt/dati.js` (nuovo) | `archivioIndexedDB()` e `archivioInMemoria()`: `{ leggi(id), scrivi(id, fc), elimina(id) }` asincroni. |
| `js/rndt/archivio.js` | Accetta `sorgente.dati === true` (nuovo) oltre ai dati inline (vecchio formato). |
| `js/rndt/host.js` | Parametro `archivioDati`, `TETTO_DATI` 5 MB, salvataggio asincrono, `addFileLayer`, `attendi`, ripristino e migrazione, eliminazione dei dati. |
| `js/rndt/gruppo.js` | Due pulsanti: «＋ Dal catalogo RNDT» e «📁 Carica file dal computer». |
| `js/rndt/index.js` | Crea l'archivio dati, la funzione `carica(file)` e le passa a host e gruppo. |
| `css/app.css`, `docs/RNDT.md` | Stili dei due pulsanti, documentazione. |

---

### Task 0: Salvare il lavoro già fatto

Il gruppo RNDT, la tab Argomenti e i dati inline (fino a 1 MB) sono già scritti e con i test verdi, ma non committati. Questo piano li sostituisce in parte (Task 4); un commit di base rende leggibili i passi successivi.

**Files:** nessuna modifica.

- [ ] **Step 1: Verificare che la suite sia verde**

Run: `cd /home/coseerobe/GitHub-Clone/coseerobe/DigitalTwin && npm run test:js 2>&1 | grep -E "^# (tests|pass|fail)"`
Expected: `# fail 0`

- [ ] **Step 2: Commit**

```bash
git add css/app.css docs/RNDT.md js/app.js js/core/icone.js js/rndt tests/js graphify-out
git commit -m "feat(rndt): gruppo RNDT nella barra strati, argomento RNDT e GeoJSON senza URL salvati coi dati

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 1: Importazione (`importa.js`)

**Files:**
- Create: `js/rndt/importa.js`
- Test: `tests/js/rndt-importa.test.mjs`

**Interfaces:**
- Consumes: niente (modulo puro).
- Produces:
  - `ESTENSIONI: string[]` = `['.geojson', '.json', '.kml', '.kmz', '.gpx', '.zip', '.csv']`
  - `nomeLayer(nomeFile: string): string` — nome senza estensione.
  - `importaFile(file: { name: string, text(): Promise<string>, arrayBuffer(): Promise<ArrayBuffer> }, lib: { kml(testo): Promise<FC>, gpx(testo): Promise<FC>, kmz(buffer): Promise<string>, shp(buffer): Promise<FC | FC[]> }): Promise<{ nome: string, fc: FeatureCollection, avvisi: string[] }>` — lancia `Error` con messaggio italiano (senza il nome del file: lo aggiunge chi chiama).

- [ ] **Step 1: Scrivere i test che falliscono**

```js
// tests/js/rndt-importa.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { ESTENSIONI, nomeLayer, importaFile } from '../../js/rndt/importa.js';

const file = (name, testo = '', buffer = new ArrayBuffer(0)) => ({ name, text: async () => testo, arrayBuffer: async () => buffer });
const fc = (...features) => ({ type: 'FeatureCollection', features });
const pt = (lon, lat, properties = {}) => ({ type: 'Feature', properties, geometry: { type: 'Point', coordinates: [lon, lat] } });
const libFinta = (extra = {}) => ({
  kml: async testo => fc(pt(13.3, 38.1, { da: `kml:${testo}` })),
  gpx: async testo => fc(pt(13.3, 38.1, { da: `gpx:${testo}` })),
  kmz: async () => '<kml>dentro</kml>',
  shp: async () => fc(pt(13.3, 38.1)),
  ...extra,
});

test('nomeLayer toglie solo l’ultima estensione', () => {
  assert.equal(nomeLayer('Parchi urbani.geojson'), 'Parchi urbani');
  assert.equal(nomeLayer('dati.2024.csv'), 'dati.2024');
  assert.equal(nomeLayer('senza'), 'senza');
});

test('GeoJSON: FeatureCollection, Feature singola e geometria nuda', async () => {
  const a = await importaFile(file('a.geojson', JSON.stringify(fc(pt(13.3, 38.1)))), libFinta());
  assert.equal(a.fc.features.length, 1);
  const b = await importaFile(file('b.json', JSON.stringify(pt(13.3, 38.1))), libFinta());
  assert.equal(b.fc.type, 'FeatureCollection');
  assert.equal(b.fc.features[0].geometry.type, 'Point');
  const c = await importaFile(file('c.geojson', JSON.stringify({ type: 'Point', coordinates: [13.3, 38.1] })), libFinta());
  assert.deepEqual(c.fc.features[0].properties, {});
  assert.equal(a.nome, 'a');
});

test('GeoJSON: BOM iniziale tollerato; JSON rotto o non GeoJSON = errore chiaro', async () => {
  const conBom = '﻿' + JSON.stringify(fc(pt(13.3, 38.1)));
  assert.equal((await importaFile(file('a.geojson', conBom), libFinta())).fc.features.length, 1);
  await assert.rejects(importaFile(file('a.geojson', '{rotto'), libFinta()), /non è un JSON valido/);
  await assert.rejects(importaFile(file('a.geojson', '{"ciao": 1}'), libFinta()), /non è un GeoJSON valido/);
});

test('GeoJSON: sistema di coordinate diverso da WGS84 rifiutato; CRS84 e 4326 accettati', async () => {
  const con = nome => JSON.stringify({ ...fc(pt(13.3, 38.1)), crs: { type: 'name', properties: { name: nome } } });
  await assert.rejects(importaFile(file('a.geojson', con('urn:ogc:def:crs:EPSG::3003')), libFinta()), /EPSG::3003.*non WGS84/);
  assert.ok(await importaFile(file('a.geojson', con('urn:ogc:def:crs:OGC:1.3:CRS84')), libFinta()));
  assert.ok(await importaFile(file('a.geojson', con('EPSG:4326')), libFinta()));
});

test('coordinate fuori dai gradi (per esempio metri senza .prj) = errore chiaro', async () => {
  const metri = JSON.stringify(fc(pt(2411234, 4216789)));
  await assert.rejects(importaFile(file('a.geojson', metri), libFinta()), /non sono in gradi/);
  await assert.rejects(importaFile(file('a.zip', '', new ArrayBuffer(8)), libFinta({ shp: async () => fc(pt(2411234, 4216789)) })), /manca il \.prj/);
});

test('file vuoto o senza elementi = errore', async () => {
  await assert.rejects(importaFile(file('a.geojson', JSON.stringify(fc())), libFinta()), /non contiene elementi/);
});

test('l’estensione decide il lettore, maiuscole comprese', async () => {
  const k = await importaFile(file('Parchi.KML', '<kml/>'), libFinta());
  assert.equal(k.fc.features[0].properties.da, 'kml:<kml/>');
  assert.equal(k.nome, 'Parchi');
  const g = await importaFile(file('traccia.GPX', '<gpx/>'), libFinta());
  assert.equal(g.fc.features[0].properties.da, 'gpx:<gpx/>');
});

test('KMZ: lo zip dà il testo del KML, che passa dal lettore KML', async () => {
  const r = await importaFile(file('a.kmz', '', new ArrayBuffer(4)), libFinta());
  assert.equal(r.fc.features[0].properties.da, 'kml:<kml>dentro</kml>');
});

test('KMZ senza KML: l’errore della libreria arriva a chi chiama', async () => {
  const lib = libFinta({ kmz: async () => { throw new Error('il KMZ non contiene un file KML'); } });
  await assert.rejects(importaFile(file('a.kmz'), lib), /non contiene un file KML/);
});

test('Shapefile zip: più shapefile nello zip si uniscono in un solo layer', async () => {
  const lib = libFinta({ shp: async () => [fc(pt(13.3, 38.1)), fc(pt(13.4, 38.2), pt(13.5, 38.2))] });
  const r = await importaFile(file('a.zip', '', new ArrayBuffer(4)), lib);
  assert.equal(r.fc.features.length, 3);
});

test('formato non supportato: l’elenco dei formati accettati è nel messaggio', async () => {
  await assert.rejects(importaFile(file('a.dwg'), libFinta()), /formato \.dwg non supportato.*\.geojson/);
  await assert.rejects(importaFile(file('senza'), libFinta()), /senza estensione/);
  assert.ok(ESTENSIONI.includes('.csv'));
});

test('CSV: colonne lat/lon per nome, altre colonne come proprietà', async () => {
  const r = await importaFile(file('p.csv', 'nome,lat,lon\nPiazza,38.12,13.36\nParco,38.15,13.35\n'), libFinta());
  assert.equal(r.fc.features.length, 2);
  assert.deepEqual(r.fc.features[0].geometry.coordinates, [13.36, 38.12]);
  assert.deepEqual(r.fc.features[0].properties, { nome: 'Piazza' });
  assert.deepEqual(r.avvisi, []);
});

test('CSV: BOM, separatore ;, virgola decimale e nomi italiani', async () => {
  const testo = '﻿nome;Latitudine;Longitudine\r\nPiazza;38,12;13,36\r\n';
  const r = await importaFile(file('p.csv', testo), libFinta());
  assert.deepEqual(r.fc.features[0].geometry.coordinates, [13.36, 38.12]);
});

test('CSV: campi tra virgolette con virgole, virgolette doppie e a capo', async () => {
  const testo = 'nome,lat,lon\n"Via ""Roma"", 1\nsecondo rigo",38.1,13.3\n';
  const r = await importaFile(file('p.csv', testo), libFinta());
  assert.equal(r.fc.features.length, 1);
  assert.equal(r.fc.features[0].properties.nome, 'Via "Roma", 1\nsecondo rigo');
});

test('CSV: righe senza coordinate valide saltate e contate nell’avviso; nessuna riga valida = errore', async () => {
  const r = await importaFile(file('p.csv', 'lat,lon\n38.1,13.3\n,\nabc,13.3\n'), libFinta());
  assert.equal(r.fc.features.length, 1);
  assert.match(r.avvisi[0], /2 righe senza coordinate valide/);
  await assert.rejects(importaFile(file('p.csv', 'lat,lon\n,\n'), libFinta()), /nessuna riga con coordinate valide/);
});

test('CSV senza colonne di coordinate, o vuoto = errore', async () => {
  await assert.rejects(importaFile(file('p.csv', 'nome,valore\na,1\n'), libFinta()), /nessuna colonna di latitudine e longitudine/);
  await assert.rejects(importaFile(file('p.csv', ''), libFinta()), /vuoto/);
});
```

- [ ] **Step 2: Verificare che falliscano**

Run: `node --test tests/js/rndt-importa.test.mjs 2>&1 | grep -E "^# (pass|fail)|Cannot find"`
Expected: fallisce con «Cannot find module» (`importa.js` non esiste).

- [ ] **Step 3: Scrivere `js/rndt/importa.js`**

```js
// js/rndt/importa.js
// Dai file GIS dell'utente a una FeatureCollection WGS84. Il modulo non tocca DOM né librerie: KML, GPX, KMZ e Shapefile
// arrivano da `lib` (vedi librerie.js), così si prova in Node. Il tipo di file si decide dall'estensione.

export const ESTENSIONI = ['.geojson', '.json', '.kml', '.kmz', '.gpx', '.zip', '.csv'];

const estensione = nome => (nome.match(/\.[^./\\]+$/)?.[0] ?? '').toLowerCase();
export const nomeLayer = nome => nome.replace(/\.[^./\\]+$/, '');

const GEOMETRIE = ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon', 'GeometryCollection'];
const CRS_WGS84 = /(CRS84|4326)$/i;

function daGeoJson(o) {
  const crs = o?.crs?.properties?.name;
  if (typeof crs === 'string' && !CRS_WGS84.test(crs)) throw new Error(`il file usa il sistema di coordinate ${crs}, non WGS84`);
  if (o?.type === 'FeatureCollection' && Array.isArray(o.features)) return o;
  if (o?.type === 'Feature') return { type: 'FeatureCollection', features: [o] };
  if (GEOMETRIE.includes(o?.type)) return { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: o }] };
  throw new Error('non è un GeoJSON valido');
}

// Il primo punto trovato basta per capire se le coordinate sono gradi o metri
const primaPosizione = c => {
  if (!Array.isArray(c)) return null;
  if (typeof c[0] === 'number') return c;
  for (const x of c) { const p = primaPosizione(x); if (p) return p; }
  return null;
};
const primoPunto = g => (!g ? null : g.type === 'GeometryCollection' ? g.geometries.map(primoPunto).find(Boolean) ?? null : primaPosizione(g.coordinates));

function controllaGradi(fc) {
  for (const f of fc.features) {
    const p = primoPunto(f.geometry);
    if (!p) continue;
    if (Math.abs(p[0]) > 180 || Math.abs(p[1]) > 90) {
      throw new Error('le coordinate non sono in gradi (longitudine e latitudine WGS84); se è uno shapefile manca il .prj');
    }
    return;
  }
}

function righeCsv(testo) {
  const t = testo.replace(/^﻿/, '');
  const prima = t.split(/\r?\n/, 1)[0];
  const conta = c => prima.split(c).length - 1;
  const sep = [';', '\t'].reduce((m, c) => (conta(c) > conta(m) ? c : m), ',');
  const righe = [];
  let riga = [];
  let campo = '';
  let tra = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (tra) {
      if (c !== '"') campo += c;
      else if (t[i + 1] === '"') { campo += '"'; i++; } else tra = false;
    } else if (c === '"') tra = true;
    else if (c === sep) { riga.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      riga.push(campo); campo = ''; righe.push(riga); riga = [];
    } else campo += c;
  }
  if (campo !== '' || riga.length) { riga.push(campo); righe.push(riga); }
  return righe.filter(r => r.some(x => x.trim() !== ''));
}

const NOMI_LAT = ['lat', 'latitude', 'latitudine', 'y'];
const NOMI_LON = ['lon', 'lng', 'long', 'longitude', 'longitudine', 'x'];

function daCsv(testo) {
  const [intestazione, ...righe] = righeCsv(testo);
  if (!intestazione) throw new Error('il file è vuoto');
  const nomi = intestazione.map(n => n.trim());
  const cerca = elenco => nomi.findIndex(n => elenco.includes(n.toLowerCase()));
  const iLat = cerca(NOMI_LAT);
  const iLon = cerca(NOMI_LON);
  if (iLat < 0 || iLon < 0) throw new Error('nessuna colonna di latitudine e longitudine (per esempio lat e lon)');
  const numero = v => (String(v ?? '').trim() === '' ? NaN : Number(String(v).trim().replace(',', '.')));
  const features = [];
  let saltate = 0;
  for (const r of righe) {
    const lat = numero(r[iLat]);
    const lon = numero(r[iLon]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) { saltate++; continue; }
    const properties = {};
    nomi.forEach((n, i) => { if (n && i !== iLat && i !== iLon) properties[n] = r[i] ?? ''; });
    features.push({ type: 'Feature', properties, geometry: { type: 'Point', coordinates: [lon, lat] } });
  }
  if (!features.length) throw new Error('nessuna riga con coordinate valide');
  return { fc: { type: 'FeatureCollection', features }, saltate };
}

const unisci = r => (Array.isArray(r) ? { type: 'FeatureCollection', features: r.flatMap(x => x.features) } : r);

export async function importaFile(file, lib) {
  const ext = estensione(file.name);
  const avvisi = [];
  let fc;
  if (ext === '.geojson' || ext === '.json') {
    let o;
    try { o = JSON.parse((await file.text()).replace(/^﻿/, '')); } catch { throw new Error('il file non è un JSON valido'); }
    fc = daGeoJson(o);
  } else if (ext === '.csv') {
    const r = daCsv(await file.text());
    fc = r.fc;
    if (r.saltate) avvisi.push(`${r.saltate} righe senza coordinate valide sono state saltate`);
  } else if (ext === '.kml') fc = await lib.kml(await file.text());
  else if (ext === '.gpx') fc = await lib.gpx(await file.text());
  else if (ext === '.kmz') fc = await lib.kml(await lib.kmz(await file.arrayBuffer()));
  else if (ext === '.zip') fc = unisci(await lib.shp(await file.arrayBuffer()));
  else throw new Error(`formato ${ext || 'senza estensione'} non supportato (accettati: ${ESTENSIONI.join(', ')})`);
  if (!fc?.features?.length) throw new Error('il file non contiene elementi');
  controllaGradi(fc);
  return { nome: nomeLayer(file.name), fc, avvisi };
}
```

- [ ] **Step 4: Verificare che passino**

Run: `node --test tests/js/rndt-importa.test.mjs 2>&1 | grep -E "^# (pass|fail)|^not ok"`
Expected: `# fail 0`

- [ ] **Step 5: Commit**

```bash
git add js/rndt/importa.js tests/js/rndt-importa.test.mjs
git commit -m "feat(rndt): importazione di GeoJSON, CSV, KML, KMZ, GPX e Shapefile in FeatureCollection

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Librerie vendorizzate e loader (`librerie.js`)

**Files:**
- Create: `js/vendor/togeojson.es.mjs`, `js/vendor/shp.esm.min.js`, `js/vendor/fflate.esm.js`, `js/vendor/LICENSE-togeojson.txt`, `js/vendor/LICENSE-shpjs.txt`, `js/vendor/LICENSE-fflate.txt`
- Create: `js/rndt/librerie.js`

**Interfaces:**
- Consumes: niente.
- Produces: `librerie: { kml(testo): Promise<FC>, gpx(testo): Promise<FC>, kmz(buffer: ArrayBuffer): Promise<string>, shp(buffer: ArrayBuffer): Promise<FC | FC[]> }` — la forma che `importaFile` si aspetta in `lib`.

- [ ] **Step 1: Scaricare e copiare le librerie**

```bash
cd /home/coseerobe/GitHub-Clone/coseerobe/DigitalTwin
T=$(mktemp -d) && cd "$T" && npm pack @tmcw/togeojson@7.1.2 shpjs@6.2.0 fflate@0.8.3 >/dev/null 2>&1
for f in *.tgz; do mkdir "x-$f" && tar xzf "$f" -C "x-$f"; done
cd /home/coseerobe/GitHub-Clone/coseerobe/DigitalTwin
cp "$T"/x-tmcw-togeojson-7.1.2.tgz/package/dist/togeojson.es.mjs js/vendor/togeojson.es.mjs
cp "$T"/x-shpjs-6.2.0.tgz/package/dist/shp.esm.min.js js/vendor/shp.esm.min.js
cp "$T"/x-fflate-0.8.3.tgz/package/esm/browser.js js/vendor/fflate.esm.js
cp "$T"/x-tmcw-togeojson-7.1.2.tgz/package/LICENSE* js/vendor/LICENSE-togeojson.txt
cp "$T"/x-shpjs-6.2.0.tgz/package/LICENSE* js/vendor/LICENSE-shpjs.txt
cp "$T"/x-fflate-0.8.3.tgz/package/LICENSE* js/vendor/LICENSE-fflate.txt
ls -la js/vendor
```
Expected: i sei file presenti, ciascuno non vuoto. Se un `LICENSE*` non esiste, `cp` fallisce: cerca il file di licenza del pacchetto (`ls "$T"/x-*/package`) e copialo con lo stesso nome di destinazione.

- [ ] **Step 2: Verificare che i moduli si importino e abbiano le funzioni attese**

Run:
```bash
node -e "
Promise.all([import('./js/vendor/togeojson.es.mjs'), import('./js/vendor/shp.esm.min.js'), import('./js/vendor/fflate.esm.js')]).then(([t, s, f]) => {
  console.log(typeof t.kml, typeof t.gpx, typeof s.default, typeof f.unzipSync);
})"
```
Expected: `function function function function`

- [ ] **Step 3: Scrivere `js/rndt/librerie.js`**

```js
// js/rndt/librerie.js
// Le librerie per KML, GPX, KMZ e Shapefile (js/vendor/) si caricano solo quando serve il formato: l'avvio dell'app non cambia.
// Adatta le loro interfacce a quella che importaFile si aspetta in `lib`.
const carica = nome => import(new URL(`../vendor/${nome}`, import.meta.url).href);
const xml = testo => new DOMParser().parseFromString(testo, 'text/xml');

export const librerie = {
  async kml(testo) { return (await carica('togeojson.es.mjs')).kml(xml(testo)); },
  async gpx(testo) { return (await carica('togeojson.es.mjs')).gpx(xml(testo)); },
  // un KMZ è uno zip con un KML dentro: restituisce il testo del KML
  async kmz(buffer) {
    const { unzipSync } = await carica('fflate.esm.js');
    const file = unzipSync(new Uint8Array(buffer));
    const nome = Object.keys(file).find(n => /\.kml$/i.test(n));
    if (!nome) throw new Error('il KMZ non contiene un file KML');
    return new TextDecoder().decode(file[nome]);
  },
  // shpjs legge shp, dbf e prj dallo zip e riproietta in WGS84; con più shapefile nello zip restituisce un array
  async shp(buffer) { return (await carica('shp.esm.min.js')).default(buffer); },
};
```

- [ ] **Step 4: Controllo di sintassi e suite**

Run: `node --check js/rndt/librerie.js && npm run test:js 2>&1 | grep -E "^# (tests|pass|fail)"`
Expected: `# fail 0`. (Il comportamento con KML/GPX/KMZ/Shapefile reali si prova nel browser nel Task 5: in Node manca `DOMParser`.)

- [ ] **Step 5: Commit**

```bash
git add js/vendor js/rndt/librerie.js
git commit -m "feat(rndt): librerie per KML, GPX, KMZ e Shapefile caricate al primo uso

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Archivio dei dati (`dati.js`)

**Files:**
- Create: `js/rndt/dati.js`
- Test: `tests/js/rndt-dati.test.mjs`

**Interfaces:**
- Consumes: niente.
- Produces:
  - `archivioInMemoria(): { m: Map<string, FC>, leggi(id): Promise<FC|null>, scrivi(id, fc): Promise<void>, elimina(id): Promise<void> }` — per i test; `m` è esposto per ispezionarlo.
  - `archivioIndexedDB(idb = globalThis.indexedDB): { leggi, scrivi, elimina } | null` — `null` se IndexedDB non esiste. Le operazioni rifiutano (reject) se il browser blocca o l'archivio è pieno.

- [ ] **Step 1: Scrivere i test che falliscono**

```js
// tests/js/rndt-dati.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { archivioInMemoria, archivioIndexedDB } from '../../js/rndt/dati.js';

const fc = { type: 'FeatureCollection', features: [] };

test('archivio in memoria: scrive, legge, elimina; un id sconosciuto dà null', async () => {
  const a = archivioInMemoria();
  assert.equal(await a.leggi('x'), null);
  await a.scrivi('x', fc);
  assert.deepEqual(await a.leggi('x'), fc);
  await a.elimina('x');
  assert.equal(await a.leggi('x'), null);
  await a.elimina('x'); // eliminare un id assente non è un errore
});

test('archivioIndexedDB senza IndexedDB nel browser dà null', () => {
  assert.equal(archivioIndexedDB(undefined), null);
});
```

- [ ] **Step 2: Verificare che falliscano**

Run: `node --test tests/js/rndt-dati.test.mjs 2>&1 | grep -E "^# (pass|fail)|Cannot find"`
Expected: «Cannot find module».

- [ ] **Step 3: Scrivere `js/rndt/dati.js`**

```js
// js/rndt/dati.js
// Dati dei layer senza URL (file dal computer): localStorage tiene solo l'elenco, i dati stanno qui, in IndexedDB,
// che regge molto più dei 5 MB di localStorage. Interfaccia asincrona { leggi, scrivi, elimina }.

export function archivioInMemoria() {
  const m = new Map();
  return {
    m,
    leggi: async id => m.get(id) ?? null,
    scrivi: async (id, fc) => { m.set(id, fc); },
    elimina: async id => { m.delete(id); },
  };
}

// null se il browser non ha IndexedDB: chi lo usa tratta i layer come «solo questa sessione»
export function archivioIndexedDB(idb = globalThis.indexedDB) {
  if (!idb) return null;
  const apri = () => new Promise((ok, ko) => {
    const r = idb.open('dt-rndt', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('dati');
    r.onsuccess = () => ok(r.result);
    r.onerror = () => ko(r.error);
  });
  // una transazione per operazione; si chiude il db a fine lavoro
  const transazione = async (modo, operazione) => {
    const db = await apri();
    return new Promise((ok, ko) => {
      const t = db.transaction('dati', modo);
      const richiesta = operazione(t.objectStore('dati'));
      t.oncomplete = () => { db.close(); ok(richiesta.result); };
      t.onerror = t.onabort = () => { db.close(); ko(t.error); };
    });
  };
  return {
    leggi: async id => (await transazione('readonly', s => s.get(id))) ?? null,
    scrivi: async (id, fc) => { await transazione('readwrite', s => s.put(fc, id)); },
    elimina: async id => { await transazione('readwrite', s => s.delete(id)); },
  };
}
```

- [ ] **Step 4: Verificare che passino**

Run: `node --test tests/js/rndt-dati.test.mjs 2>&1 | grep -E "^# (pass|fail)|^not ok"`
Expected: `# fail 0`. (L'implementazione IndexedDB reale si prova nel browser nel Task 5.)

- [ ] **Step 5: Commit**

```bash
git add js/rndt/dati.js tests/js/rndt-dati.test.mjs
git commit -m "feat(rndt): archivio dei dati dei layer in IndexedDB

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Host: salvataggio asincrono dei dati, ripristino, migrazione

**Files:**
- Modify: `js/rndt/archivio.js` (`sorgenteValida`)
- Modify: `js/rndt/host.js` (`TETTO_DATI`, parametro `archivioDati`, `creaGeoJson`, `ripristina`, `elimina`, nuovi `addFileLayer` e `attendi`)
- Test: `tests/js/rndt-host.test.mjs`, `tests/js/rndt-archivio.test.mjs`

**Interfaces:**
- Consumes: `archivioInMemoria` da `dati.js` (solo nei test); interfaccia `{ leggi, scrivi, elimina }` del Task 3.
- Produces:
  - `TETTO_DATI = 5_000_000` (export di `host.js`).
  - `creaHost({ ..., archivioDati = null })`: `archivioDati` è l'archivio del Task 3 o `null`.
  - `host.addFileLayer(nome: string, fc: FeatureCollection): string` — id del layer; non usa mai l'URL di un download recente; i dati si salvano in `archivioDati`.
  - `host.attendi(): Promise<void>` — si risolve quando tutte le scritture in corso sono finite.
  - Nello stato salvato, un GeoJSON senza URL ha `sorgente: { dati: true }`.

- [ ] **Step 1: Aggiornare i test dell'archivio**

In `tests/js/rndt-archivio.test.mjs` sostituire il test «un GeoJSON si legge se ha URL o dati» con:

```js
test('un GeoJSON si legge se ha URL, dati nell’archivio dati o dati inline (vecchio formato); altrimenti si scarta', () => {
  const g = (id, sorgente) => ({ id, tipo: 'geojson', nome: id, visibile: true, sorgente });
  const dati = { type: 'FeatureCollection', features: [] };
  const stato = { v: 1, layers: [g('a', { url: 'https://x.it/a' }), g('b', { dati }), g('c', {}), g('d', { dati: { type: 'Feature' } }), g('e', { dati: true })] };
  assert.deepEqual(leggi(finto({ [CHIAVE]: JSON.stringify(stato) })).layers.map(l => l.id), ['a', 'b', 'e']);
});
```

- [ ] **Step 2: Sostituire nel test dell'host i quattro test sui dati inline**

In `tests/js/rndt-host.test.mjs`:

1. Aggiungere agli import: `import { archivioInMemoria } from '../../js/rndt/dati.js';` e cambiare `TETTO_DATI` resta importato da `host.js`.
2. Nella funzione `costruisci`, aggiungere il parametro e il ritorno:

```js
const costruisci = (extra = {}) => {
  const map = mappaFinta(), scritti = [], avvisi = [], chiamate = [];
  const archivioDati = 'archivioDati' in extra ? extra.archivioDati : archivioInMemoria();
  const host = creaHost({
    map, proxy: PROXY, stato: extra.stato ?? { v: 1, layers: [] }, scrivi: s => { scritti.push(s); return extra.scrivi?.(s) ?? true; },
    anelli: () => extra.anelli ?? [], notifica: m => avvisi.push(m), archivioDati,
    fetchFn: extra.fetchFn ?? (async u => { chiamate.push(u); return corpo(extra.corpo ?? '{}'); }),
  });
  return { host, map, scritti, avvisi, chiamate, archivioDati };
};
```

3. Eliminare i test intitolati «addGeoJsonLayer senza download (file locale) salva i dati già filtrati», «GeoJSON oltre il tetto: …», «scrittura fallita di un GeoJSON: …» e «ripristina un GeoJSON salvato coi dati: …» e aggiungere questi:

```js
const url = 'https://wfs.example.org/ows?SERVICE=WFS&REQUEST=GetFeature&TYPENAMES=x&BBOX=13.1,37.9,13.5,38.3';

test('addFileLayer: i dati filtrati vanno nell’archivio dati, poi il layer entra nell’elenco salvato', async () => {
  const { host, scritti, archivioDati } = costruisci({ anelli: [quadrato] });
  const id = host.addFileLayer('Zone', fc([pt([13.35, 38.15]), pt([14, 39])]));
  assert.equal(host.elenco().find(l => l.id === id).salvato, false); // finché la scrittura non è finita
  assert.equal(scritti.length, 0);
  await host.attendi();
  assert.equal(archivioDati.m.get(id).features.length, 1); // solo la feature dentro Palermo
  assert.deepEqual(scritti.at(-1).layers[0].sorgente, { dati: true });
  assert.equal(host.elenco().find(l => l.id === id).salvato, true);
});

test('addGeoJsonLayer senza download riconosciuto salva i dati allo stesso modo', async () => {
  const { host, archivioDati } = costruisci();
  const id = host.addGeoJsonLayer('Zone', fc([pt([13.35, 38.15])]));
  await host.attendi();
  assert.equal(archivioDati.m.has(id), true);
});

test('addFileLayer entro 30 s da un download del catalogo non prende l’URL del download', async () => {
  const { host, scritti } = costruisci();
  await host.fetchArrayBuffer(url);
  host.addFileLayer('Mio file', fc([pt([13.35, 38.15])]));
  await host.attendi();
  assert.deepEqual(scritti.at(-1).layers[0].sorgente, { dati: true });
});

test('dati oltre il tetto di 5 MB: layer in mappa solo per la sessione, con avviso', async () => {
  const grosso = fc([{ type: 'Feature', properties: { x: 'a'.repeat(TETTO_DATI) }, geometry: { type: 'Point', coordinates: [13.35, 38.15] } }]);
  const { host, map, scritti, avvisi, archivioDati } = costruisci();
  const id = host.addFileLayer('Grosso', grosso);
  await host.attendi();
  assert.equal(map.sorgenti.size, 1);
  assert.equal(scritti.length, 0);
  assert.equal(archivioDati.m.size, 0);
  assert.equal(host.elenco().find(l => l.id === id).salvato, false);
  assert.match(avvisi[0], /troppo grande/);
});

test('senza IndexedDB (archivio null) o con scrittura fallita: solo sessione, un avviso, gli altri layer si salvano', async () => {
  const rotto = archivioInMemoria();
  rotto.scrivi = async () => { throw new Error('quota'); };
  for (const archivioDati of [null, rotto]) {
    const { host, scritti, avvisi } = costruisci({ archivioDati });
    const id = host.addFileLayer('Zone', fc([pt([13.35, 38.15])]));
    await host.attendi();
    assert.equal(host.elenco().find(l => l.id === id).salvato, false);
    assert.equal(avvisi.length, 1);
    assert.match(avvisi[0], /Non riesco a salvare «Zone»/);
    host.addWmsLayer('PAI', wmsOpz);
    assert.deepEqual(scritti.at(-1).layers.map(l => l.tipo), ['wms']);
  }
});

test('layer rimosso mentre la scrittura è in corso: non resta nulla né nell’archivio né nell’elenco', async () => {
  const lento = archivioInMemoria();
  const vera = lento.scrivi;
  let sblocca;
  lento.scrivi = (id, f) => new Promise(ok => { sblocca = () => ok(vera(id, f)); });
  const { host, scritti } = costruisci({ archivioDati: lento });
  const id = host.addFileLayer('Zone', fc([pt([13.35, 38.15])]));
  host.elimina(id);
  sblocca();
  await host.attendi();
  assert.equal(lento.m.size, 0);
  assert.equal(scritti.length, 0);
  assert.deepEqual(host.getLayers(), []);
});

test('elimina rimuove anche i dati salvati', async () => {
  const { host, archivioDati } = costruisci();
  const id = host.addFileLayer('Zone', fc([pt([13.35, 38.15])]));
  await host.attendi();
  host.elimina(id);
  await host.attendi();
  assert.equal(archivioDati.m.has(id), false);
});

test('ripristina un layer coi dati nell’archivio dati: stesso id, nessuna rete, accensione salvata', async () => {
  const stato = { v: 1, layers: [{ id: 'rndt-x1', tipo: 'geojson', nome: 'Zone', visibile: true, sorgente: { dati: true } }] };
  const archivioDati = archivioInMemoria();
  await archivioDati.scrivi('rndt-x1', fc([pt([13.35, 38.15])]));
  const { host, map, chiamate, scritti } = costruisci({ stato, archivioDati, fetchFn: async () => { throw new Error('rete'); } });
  await host.ripristina();
  assert.equal(chiamate.length, 0);
  assert.ok(map.sorgenti.has('rndt-x1'));
  assert.equal(host.elenco()[0].salvato, true);
  assert.equal(host.elenco()[0].indisponibile, false);
  assert.equal(scritti.length, 0);
  host.mostra('rndt-x1', false);
  assert.equal(scritti.at(-1).layers[0].visibile, false);
});

test('dati spariti dall’archivio al riavvio: il layer resta in elenco come non disponibile', async () => {
  const stato = { v: 1, layers: [{ id: 'rndt-x1', tipo: 'geojson', nome: 'Zone', visibile: true, sorgente: { dati: true } }] };
  const { host, map } = costruisci({ stato });
  await host.ripristina();
  assert.equal(host.elenco()[0].indisponibile, true);
  assert.equal(map.sorgenti.size, 0);
  const senza = costruisci({ stato, archivioDati: null });
  await senza.host.ripristina();
  assert.equal(senza.host.elenco()[0].indisponibile, true);
});

test('vecchio formato (dati dentro l’elenco in localStorage): si legge e passa all’archivio dati', async () => {
  const dati = fc([pt([13.35, 38.15])]);
  const stato = { v: 1, layers: [{ id: 'rndt-v1', tipo: 'geojson', nome: 'Zone', visibile: true, sorgente: { dati } }] };
  const { host, map, scritti, archivioDati } = costruisci({ stato });
  await host.ripristina();
  assert.ok(map.sorgenti.has('rndt-v1'));
  assert.deepEqual(archivioDati.m.get('rndt-v1'), dati);
  assert.deepEqual(scritti.at(-1).layers[0].sorgente, { dati: true });
});
```

Nota: il test esistente «addGeoJsonLayer salva l’URL del download recente» dichiara già una `const url` locale: lasciarlo com'è, la `const url` di modulo sopra va definita dopo di esso oppure rinominata `urlWfs` nei test nuovi se il linter/Node segnala il conflitto (è in un altro scope di funzione, quindi non dovrebbe).

- [ ] **Step 3: Verificare che falliscano**

Run: `node --test tests/js/rndt-host.test.mjs tests/js/rndt-archivio.test.mjs 2>&1 | grep -E "^# (pass|fail)"`
Expected: vari fallimenti (`addFileLayer is not a function`, ecc.).

- [ ] **Step 4: Aggiornare `js/rndt/archivio.js`**

Sostituire la riga di `sorgenteValida` con:

```js
// un GeoJSON si richiama dall'URL, dai dati nell'archivio dati (`dati: true`) o, nel vecchio formato, dai dati dentro l'elenco
const sorgenteValida = l => l.tipo !== 'geojson'
  || typeof l.sorgente?.url === 'string'
  || l.sorgente?.dati === true
  || l.sorgente?.dati?.type === 'FeatureCollection';
```

- [ ] **Step 5: Aggiornare `js/rndt/host.js`**

a) Tetto e firma. Sostituire le righe del tetto e la firma di `creaHost`:

```js
// Un GeoJSON senza URL si salva coi suoi dati nell'archivio dati (IndexedDB); oltre questo tetto resta solo in sessione
export const TETTO_DATI = 5_000_000;
```
```js
export function creaHost({ map, proxy, stato: iniziale, scrivi, anelli = () => [], notifica = () => {}, pannello = {}, archivioDati = null, fetchFn = (...a) => fetch(...a) }) {
```

b) Sotto `let contatore = 0;` aggiungere:

```js
  const scritture = new Set(); // scritture dei dati in corso: attendi() le aspetta
  const inAttesa = promessa => { scritture.add(promessa); promessa.finally(() => scritture.delete(promessa)); return promessa; };
```

c) Sostituire per intero la parte finale di `creaGeoJson` (da `const rec = {` fino alla fine della funzione, quindi anche il blocco `if (!url) { … }` scritto prima) con:

```js
    for (const s of strati) map.addLayer(s);
    const rec = { id, tipo: 'geojson', nome, visibile: true, sorgente: url ? { url } : {}, idMappa: strati.map(s => s.id), idSorgente: id, salvato: Boolean(url) };
    if (url) return registra(rec, { salva });
    // senza URL: i dati si salvano a parte, dopo che il layer è in mappa
    rec.sorgente = { dati: true };
    if (!salva) rec.salvato = true; // ripristino: i dati vengono dall'archivio
    else if (testo.length > TETTO_DATI) notifica(`«${nome}» è troppo grande per essere salvato: resta finché la pagina è aperta.`);
    else inAttesa(salvaDati(rec, dati));
    return registra(rec, { salva: false });
  }

  // Scrive i dati, poi mette il layer nell'elenco salvato: un layer non entra mai nell'elenco senza i suoi dati
  async function salvaDati(rec, fc) {
    const nonSalvato = () => notifica(`Non riesco a salvare «${rec.nome}»: resta finché la pagina è aperta.`);
    try {
      if (!archivioDati) throw new Error('archivio dei dati non disponibile');
      await archivioDati.scrivi(rec.id, fc);
    } catch {
      return nonSalvato();
    }
    const togli = () => archivioDati.elimina(rec.id).catch(() => {});
    if (layers.get(rec.id) !== rec) return togli(); // rimosso nel frattempo
    const nuovo = salvaAggiungi(stato, daSalvare(rec));
    if (!scrivi(nuovo)) { nonSalvato(); return togli(); }
    stato = nuovo;
    rec.salvato = true;
    cambio();
  }
```

d) Nel ritorno dell'oggetto host, accanto ad `addGeoJsonLayer`, aggiungere:

```js
    // File dal computer: mai l'URL di un download recente del catalogo
    addFileLayer: (nome, fc) => creaGeoJson(nome, fc, null, true),
    attendi: async () => { while (scritture.size) await Promise.allSettled([...scritture]); },
```

e) In `elimina(id)`, dopo `layers.delete(id);` aggiungere:

```js
      if (rec.tipo === 'geojson') archivioDati?.elimina(id).catch(() => {});
```

f) In `ripristina()` sostituire il ramo dei dati inline (la riga `else if (salvato.sorgente.dati) id = …`) con:

```js
          else if (salvato.sorgente.dati === true) {
            const fc = await archivioDati?.leggi(salvato.id);
            if (!fc) throw new Error('dati non trovati');
            id = creaGeoJson(salvato.nome, fc, undefined, false, salvato.id);
          } else if (salvato.sorgente.dati) {
            // vecchio formato: i dati stavano nell'elenco in localStorage; passano all'archivio dati
            id = creaGeoJson(salvato.nome, salvato.sorgente.dati, undefined, false, salvato.id);
            try {
              await archivioDati.scrivi(id, salvato.sorgente.dati);
              stato = salvaAggiorna(stato, id, { sorgente: { dati: true } });
              persisti();
            } catch { /* resta nel vecchio formato: si riprova al prossimo avvio */ }
          }
```

- [ ] **Step 6: Verificare che passino**

Run: `npm run test:js 2>&1 | grep -E "^# (tests|pass|fail)|^not ok"`
Expected: `# fail 0`

- [ ] **Step 7: Commit**

```bash
git add js/rndt/archivio.js js/rndt/host.js tests/js/rndt-host.test.mjs tests/js/rndt-archivio.test.mjs
git commit -m "feat(rndt): dati dei GeoJSON senza URL in IndexedDB, fino a 5 MB, con ripristino e migrazione

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Pulsante «Carica file dal computer», collegamento, documenti e verifica

**Files:**
- Modify: `js/rndt/gruppo.js` (due pulsanti, selettore file)
- Modify: `js/rndt/index.js` (archivio dati, `carica`)
- Modify: `css/app.css`
- Modify: `docs/RNDT.md`

**Interfaces:**
- Consumes: `ESTENSIONI`, `importaFile` (Task 1); `librerie` (Task 2); `archivioIndexedDB` (Task 3); `host.addFileLayer`, `creaHost({ archivioDati })` (Task 4).
- Produces: `gruppo.collega(host, apriCatalogo, caricaFile)` con `caricaFile(file: File): Promise<void>` (non lancia: segnala gli errori in pagina).

- [ ] **Step 1: `js/rndt/gruppo.js` — import e pulsanti**

In cima al file, dopo il commento iniziale, aggiungere: `import { ESTENSIONI } from './importa.js';`

Nella factory `creaGruppoRndt`, accanto a `let apriCatalogo = () => {};` aggiungere `let caricaFile = async () => {};` e creare il selettore una sola volta (si sposta nel DOM a ogni ridisegno):

```js
  const selettore = el('input');
  selettore.type = 'file';
  selettore.multiple = true;
  selettore.accept = ESTENSIONI.join(',');
  selettore.hidden = true;
  selettore.addEventListener('change', async () => {
    const files = [...selettore.files];
    selettore.value = ''; // permette di riscegliere lo stesso file
    for (const file of files) await caricaFile(file);
  });
```

In `disegna()` sostituire le tre righe del pulsante singolo (`const aggiungi = …` / `aggiungi.type = 'button';` / `aggiungi.addEventListener(…)`) con:

```js
    const azioni = el('div', 'rndt-gruppo-azioni');
    const catalogo = el('button', 'rndt-gruppo-aggiungi', '＋ Dal catalogo RNDT');
    const file = el('button', 'rndt-gruppo-aggiungi', '📁 Carica file dal computer');
    file.title = `Formati: ${ESTENSIONI.join(' ')}`;
    for (const b of [catalogo, file]) b.type = 'button';
    catalogo.addEventListener('click', () => apriCatalogo());
    file.addEventListener('click', () => selettore.click());
    azioni.append(catalogo, file);
```

e `radice.replaceChildren(titolo, aggiungi, ...voci);` con `radice.replaceChildren(titolo, azioni, selettore, ...voci);`.

Cambiare `collega` in:

```js
    collega(hostRndt, apri, carica = async () => {}) {
      host = hostRndt;
      apriCatalogo = apri;
      caricaFile = carica;
      host.suCambio(disegna);
      disegna();
    },
```

- [ ] **Step 2: `js/rndt/index.js` — archivio dati e `carica`**

Aggiungere gli import:

```js
import { importaFile } from './importa.js';
import { librerie } from './librerie.js';
import { archivioIndexedDB } from './dati.js';
```

In `collegaRndt`, creare l'archivio e passarlo a `creaHost` (aggiungere `archivioDati` ai parametri esistenti):

```js
  const archivioDati = archivioIndexedDB();
```
```js
  const host = creaHost({
    map, proxy: PROXY_RNDT, stato: leggi(archivio), scrivi: s => salva(archivio, s), anelli: () => anelli, notifica: segnala, pannello, archivioDati,
  });
```

Aggiungere sopra `let plugin = null;` la funzione e cambiare il collegamento del gruppo (la riga `gruppo?.collega(host, apri);` si sposta dopo la definizione di `carica`, perché `apri` e `carica` sono dichiarate nella stessa funzione):

```js
  // Un file dal computer: legge, riconduce a GeoJSON WGS84 e lo aggiunge come layer. Gli errori si mostrano, non si lanciano.
  async function carica(file) {
    try {
      await anelliPronti; // il filtro sul confine di Palermo ha bisogno del confine
      const { nome, fc, avvisi } = await importaFile(file, librerie);
      for (const a of avvisi) segnala(`${file.name}: ${a}`);
      host.addFileLayer(nome, fc);
    } catch (errore) {
      segnala(`Non carico «${file.name}»: ${errore.message}`);
    }
  }
  gruppo?.collega(host, apri, carica); // gruppo «RNDT» della barra strati
```

(e rimuovere la vecchia riga `gruppo?.collega(host, apri);`).

- [ ] **Step 3: `css/app.css`**

Aggiungere in fondo, dopo il blocco del gruppo RNDT:

```css
.rndt-gruppo-azioni { display: grid; gap: 6px; margin: 0 0 6px; }
.rndt-gruppo-azioni .rndt-gruppo-aggiungi { margin: 0; }
```

- [ ] **Step 4: `docs/RNDT.md`**

Sostituire la frase sul salvataggio (punto 6 della prima lista) con:

```
- I layer aggiunti restano nell'elenco «Layer aggiunti» del pannello, nel gruppo «RNDT» della barra strati e nella tab Argomenti, e tornano alla riapertura dell'app. I WFS scaricati da un URL noto si salvano con l'URL. I dati senza URL (file caricati dal computer, o GeoJSON del catalogo il cui URL non è riconosciuto) si salvano in IndexedDB (nome `dt-rndt`), fino a 5 MB per layer: oltre, o se il browser blocca IndexedDB, valgono per la sessione e un avviso lo dice.
- «Carica file dal computer» (gruppo RNDT) accetta GeoJSON/JSON, KML, KMZ, GPX, Shapefile in `.zip` (con `.prj`, riproiettato in WGS84) e CSV con colonne di latitudine e longitudine (`lat`/`lon`, `latitudine`/`longitudine`, `x`/`y`, separatore `,` o `;`). I GeoJSON e i CSV devono essere in WGS84. Le librerie di conversione (`js/vendor/`) si caricano solo al primo file di quel formato; il filtro sul confine di Palermo vale anche per i file.
```

e nella riga «Limiti noti» (la seconda occorrenza di «il layer si salva coi dati …») sostituire con: «il layer si salva coi dati (se entrano nel tetto di 5 MB) oppure vale solo per la sessione (l'elenco lo segnala).»

- [ ] **Step 5: Suite completa e controllo di sintassi**

Run: `node --check js/rndt/gruppo.js && node --check js/rndt/index.js && npm run test:js 2>&1 | grep -E "^# (tests|pass|fail)|^not ok"`
Expected: `# fail 0`

- [ ] **Step 6: Verifica nel browser (a mano: qui non c'è Chrome)**

Server locale: `cd /home/coseerobe/GitHub-Clone/coseerobe/DigitalTwin && python3 -m http.server 8000`, poi `http://localhost:8000/`. Controllare:
  1. Gruppo «RNDT»: compaiono «＋ Dal catalogo RNDT» e «📁 Carica file dal computer»; il primo apre il catalogo.
  2. Il secondo apre il selettore del sistema; un file per formato (`.geojson`, `.csv` con `;` e virgola decimale, `.kml`, `.kmz`, `.gpx`, `.zip` shapefile con `.prj` non in WGS84) compare in mappa e nel gruppo, nel «Strati · N» e nel tab Argomenti.
  3. Ricarica la pagina: i layer tornano; in DevTools → Application → IndexedDB → `dt-rndt` → `dati` ci sono i dati, e `localStorage['dt:rndt:v1']` non li contiene.
  4. File non valido (`.txt`, JSON rotto, CSV senza coordinate): avviso col nome del file, nessun layer.
  5. File con dati tutti fuori da Palermo: avviso «nessuna feature dentro il Comune di Palermo».
  6. File oltre 5 MB: in mappa, avviso «troppo grande», dopo la ricarica non c'è.
  7. Rimuovi un layer con ×: sparisce dal gruppo e da IndexedDB.

- [ ] **Step 7: Grafo e commit**

```bash
graphify update . 2>&1 | tail -1
git add css/app.css docs/RNDT.md js/rndt graphify-out
git commit -m "feat(rndt): carica file dal computer nel gruppo RNDT, con dati in IndexedDB

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Self-review (spec ↔ piano)

- Spec §1 Importazione, tutti i formati e gli errori → Task 1 (lettori, errori, avvisi) e Task 2 (librerie). Nome del layer = nome file → `nomeLayer`. File multipli, uno alla volta con un avviso per errore → `selettore` in Task 5 (ciclo `for … await caricaFile`).
- Spec §2 Selettore e due pulsanti → Task 5, step 1.
- Spec §3 IndexedDB: interfaccia → Task 3; tetto 5 MB, scrittura fallita/assente, salvataggio dopo la scrittura, ripristino, eliminazione, compatibilità col vecchio formato → Task 4.
- Spec «Errori e casi limite» → coperti da test del Task 1 (estensione sconosciuta, vuoto, senza `.prj`, righe CSV saltate) e del Task 4 (file oltre 5 MB).
- Review Focus: tutti gli otto punti hanno un test nel task proprietario.
- Nomi coerenti: `importaFile`, `ESTENSIONI`, `nomeLayer`, `librerie`, `archivioDati`, `addFileLayer`, `attendi`, `TETTO_DATI`, `sorgente: { dati: true }`.
- `host.addFileLayer` ignora l'URL del download recente (rischio individuato: `addGeoJsonLayer` lo userebbe entro 30 s).
