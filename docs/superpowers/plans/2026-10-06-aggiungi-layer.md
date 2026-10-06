# Aggiungi layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un pannello «Aggiungi layer» per caricare file dal computer e aggiungere servizi XYZ, WMS, WFS per URL, con un gruppo «I miei layer» nella barra strati e servizi salvati nel browser.

**Architecture:** Seconda istanza di `creaHost` (prefisso `miei`, memoria `dt:miei:v1`) accanto a quella del catalogo RNDT, che non cambia. Logica pura in `js/aggiungi/` (lettura capabilities, servizi salvati, controllo), UI in un pannello della rail destra; `creaGruppoRndt` si generalizza in `creaGruppo(opzioni)`.

**Tech Stack:** JavaScript ES module senza build, MapLibre GL, `node --test` (`npm run test:js`), Cloudflare Worker come proxy CORS (`worker/`).

**Spec:** `docs/superpowers/specs/2026-10-06-aggiungi-layer-design.md`

## Global Constraints

- Lingua dell'interfaccia, dei messaggi e dei commenti: italiano, con gli accenti corretti.
- Nessuna libreria nuova, nessun build: solo moduli ES serviti da `scripts/serve.py`.
- Il catalogo RNDT, il suo host e il suo plugin (`js/vendor/openrndt-geolibre/`) non cambiano, salvo togliere da `js/rndt/index.js` il caricamento dei file.
- Limite di area come RNDT: tile ritagliati su `BBOX_PALERMO`, WFS con `bbox` di Palermo e filtro sul confine comunale.
- Solo `https` verso i servizi (il Worker accetta solo https, GET/HEAD, nomi pubblici, max 10 MB).
- Tetto di 50 servizi salvati; tetto WFS di 5.000 feature; file dal computer fino a 5 MB per layer (`TETTO_DATI`, invariato).
- Layer in ordine alfabetico nei gruppi (`righeGruppo`, invariato).
- Chiavi `localStorage`: `dt:miei:v1` (layer), `dt:miei:servizi:v1` (servizi salvati); `dt:rndt:v1` resta del catalogo.
- Stile del codice: stesso del repo (nomi italiani, commenti brevi che spiegano il perché, `el(tag, classe, testo)` per il DOM). Test con `node:test` e `node:assert/strict` in `tests/js/*.test.mjs`.
- Dopo aver modificato il codice: `graphify update .`.

## Review Focus

- URL non valido (testo qualunque, `http://`, senza `{z}/{x}/{y}`): errore in chiaro accanto al campo; non si aggiunge né si salva nulla. (Task 2, Task 6)
- WMS i cui layer non offrono EPSG:3857: il layer compare disattivato con la nota «non supportato», senza eccezioni. (Task 2, Task 6)
- WFS che risponde con XML d'errore, HTML o più di 5.000 feature: errore, nessun layer in mappa, nessun servizio salvato. (Task 3, Task 6)
- Lo stesso servizio aggiunto due volte: niente layer doppio né voce salvata doppia. (Task 1, Task 3, Task 6)
- `localStorage` bloccato o pieno, o il 51° servizio: il layer entra in mappa, un avviso lo dice, nessuna eccezione. (Task 1, Task 6)
- Migrazione con stato corrotto o scrittura fallita a metà: nessun file perso o duplicato. (Task 4)

---

## File Structure

| File | Azione | Responsabilità |
|---|---|---|
| `js/rndt/archivio.js` | modifica | chiave `localStorage` come parametro; esporta `CHIAVE_MIEI` |
| `js/rndt/host.js` | modifica | opzioni `prefisso` ed `etichetta`; esporta `hash`, `TETTO_WFS`; metodo `addWfsLayer(nome, richiesta)` |
| `js/aggiungi/salvati.js` | nuovo | servizi salvati: lettura, scrittura, aggiunta con tetto, rimozione (puro, riceve lo storage) |
| `js/aggiungi/servizi.js` | nuovo | puro: mini parser XML, capabilities WMS/WFS, `validaXyz`, `urlBase`, `urlCapabilities`, `urlGetFeature` |
| `js/aggiungi/controllo.js` | nuovo | logica del pannello senza DOM: legge i servizi, aggiunge all'host, memorizza |
| `js/aggiungi/migrazione.js` | nuovo | sposta i file dal computer da `dt:rndt:v1` a `dt:miei:v1` |
| `js/aggiungi/pannello.js` | nuovo | DOM del pannello (albero, form, elenco salvati) |
| `js/aggiungi/index.js` | nuovo | `collegaAggiungi`: host, controllo, pannello, caricamento file, ripristino |
| `js/rndt/gruppo.js` | modifica | `creaGruppo(opzioni)`; `creaGruppoRndt()` resta come scorciatoia; il pulsante file esce dal gruppo RNDT |
| `js/rndt/index.js` | modifica | via `carica`, `importaFile`, `librerie` |
| `js/core/pannello.js`, `js/core/icone.js`, `js/core/rail.js` | modifica | tab «I miei layer» (`TAB_DIRETTI`, `ETICHETTE`, icona), icona «aggiungi» nella rail |
| `js/app.js`, `index.html`, `css/*.css` | modifica | cablaggio, pulsante nella barra strumenti, `<aside id="aggiungi-pannello">`, stili |
| `docs/AGGIUNGI_LAYER.md`, `docs/RNDT.md` | nuovo / modifica | documentazione |
| `tests/js/aggiungi-*.test.mjs` | nuovi | test dei moduli sopra |

---

### Task 1: Memoria separata (archivio parametrico e servizi salvati)

**Files:**
- Modify: `js/rndt/archivio.js`
- Create: `js/aggiungi/salvati.js`
- Modify: `js/rndt/host.js` (solo `export` di `hash`)
- Test: `tests/js/aggiungi-archivio.test.mjs`, `tests/js/aggiungi-salvati.test.mjs`

**Interfaces:**
- Produces:
  - `archivio.js`: `leggi(storage, chiave = CHIAVE)`, `salva(storage, stato, chiave = CHIAVE)`, `CHIAVE_MIEI = 'dt:miei:v1'`
  - `host.js`: `export function hash(testo) → string` (invariata, solo esportata)
  - `salvati.js`: `CHIAVE_SERVIZI`, `TETTO_SERVIZI = 50`, `idServizio(tipo, url) → string`, `leggiServizi(storage) → { v:1, servizi:[] }`, `salvaServizi(storage, stato) → boolean`, `aggiungiServizio(stato, { tipo, nome, url, voci? }) → { stato, pieno }`, `rimuoviServizio(stato, id) → stato`
  - Un servizio salvato: `{ id, tipo: 'xyz'|'wms'|'wfs', nome, url, voci: [{ chiave, nome, ... }] }`

- [ ] **Step 1: Baseline** — `npm run test:js`. Expected: tutti i test passano (annota il totale).

- [ ] **Step 2: Scrivere il test dell'archivio**

```js
// tests/js/aggiungi-archivio.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { leggi, salva, CHIAVE, CHIAVE_MIEI } from '../../js/rndt/archivio.js';

const finto = () => {
  const m = new Map();
  return { m, getItem: k => m.get(k) ?? null, setItem: (k, v) => { m.set(k, v); } };
};
const stato = { v: 1, layers: [{ id: 'a', tipo: 'tile', nome: 'A', visibile: true, sorgente: { url: 'https://a.it/{z}/{x}/{y}.png' } }] };

test('senza chiave si usa quella del catalogo RNDT', () => {
  const s = finto();
  assert.equal(salva(s, stato), true);
  assert.deepEqual([...s.m.keys()], [CHIAVE]);
  assert.deepEqual(leggi(s), stato);
});

test('con una chiave propria gli stati non si mescolano', () => {
  const s = finto();
  salva(s, stato, CHIAVE_MIEI);
  assert.deepEqual(leggi(s), { v: 1, layers: [] });
  assert.deepEqual(leggi(s, CHIAVE_MIEI), stato);
  assert.equal(CHIAVE_MIEI, 'dt:miei:v1');
});

test('storage bloccato: leggi dà lo stato vuoto, salva dà false', () => {
  const rotto = { getItem() { throw new Error('bloccato'); }, setItem() { throw new Error('pieno'); } };
  assert.deepEqual(leggi(rotto, CHIAVE_MIEI), { v: 1, layers: [] });
  assert.equal(salva(rotto, stato, CHIAVE_MIEI), false);
  assert.deepEqual(leggi(null, CHIAVE_MIEI), { v: 1, layers: [] });
});
```

- [ ] **Step 3: Verificare che fallisca** — `node --test tests/js/aggiungi-archivio.test.mjs`. Expected: FAIL (`CHIAVE_MIEI` non esportata, e `salva(s, stato, chiave)` ignora la chiave).

- [ ] **Step 4: Modificare `js/rndt/archivio.js`**

Sostituire le due funzioni e aggiungere la costante:

```js
export const CHIAVE = 'dt:rndt:v1';
export const CHIAVE_MIEI = 'dt:miei:v1'; // layer aggiunti dal pannello «Aggiungi layer»
```

```js
export function leggi(storage, chiave = CHIAVE) {
  try {
    const grezzo = storage?.getItem(chiave);
    if (!grezzo) return vuoto();
    const s = JSON.parse(grezzo);
    if (s?.v !== 1 || !Array.isArray(s.layers)) return vuoto();
    return { v: 1, layers: s.layers.filter(l => l && typeof l.id === 'string' && TIPI.includes(l.tipo) && sorgenteValida(l)) };
  } catch {
    return vuoto();
  }
}

export function salva(storage, stato, chiave = CHIAVE) {
  try {
    storage.setItem(chiave, JSON.stringify(stato));
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 5: Esportare `hash`** — in `js/rndt/host.js` cambiare `function hash(testo) {` in `export function hash(testo) {`.

- [ ] **Step 6: Verificare** — `node --test tests/js/aggiungi-archivio.test.mjs tests/js/rndt-archivio.test.mjs`. Expected: PASS (i test del catalogo non cambiano).

- [ ] **Step 7: Scrivere il test dei servizi salvati**

```js
// tests/js/aggiungi-salvati.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHIAVE_SERVIZI, TETTO_SERVIZI, idServizio, leggiServizi, salvaServizi, aggiungiServizio, rimuoviServizio,
} from '../../js/aggiungi/salvati.js';

const finto = () => {
  const m = new Map();
  return { m, getItem: k => m.get(k) ?? null, setItem: (k, v) => { m.set(k, v); } };
};
const vuoto = { v: 1, servizi: [] };
const wms = { tipo: 'wms', nome: 'PAI', url: 'https://wms.example.org/ows', voci: [{ chiave: 'pai', nome: 'Piano PAI', opz: { layers: 'pai' } }] };

test('l’id dipende da tipo e URL', () => {
  assert.equal(idServizio('wms', 'https://a.it/'), idServizio('wms', 'https://a.it/'));
  assert.notEqual(idServizio('wms', 'https://a.it/'), idServizio('wfs', 'https://a.it/'));
});

test('aggiungi, rileggi, rimuovi', () => {
  const s = finto();
  const { stato, pieno } = aggiungiServizio(vuoto, wms);
  assert.equal(pieno, false);
  assert.equal(salvaServizi(s, stato), true);
  assert.deepEqual([...s.m.keys()], [CHIAVE_SERVIZI]);
  const letto = leggiServizi(s);
  assert.equal(letto.servizi.length, 1);
  assert.equal(letto.servizi[0].nome, 'PAI');
  assert.deepEqual(rimuoviServizio(letto, letto.servizi[0].id), vuoto);
});

test('lo stesso servizio due volte non si duplica e unisce le voci', () => {
  const a = aggiungiServizio(vuoto, wms).stato;
  const b = aggiungiServizio(a, { ...wms, voci: [{ chiave: 'altro', nome: 'Altro', opz: { layers: 'altro' } }, wms.voci[0]] }).stato;
  assert.equal(b.servizi.length, 1);
  assert.deepEqual(b.servizi[0].voci.map(v => v.chiave).sort(), ['altro', 'pai']);
});

test('oltre il tetto non si salva e si segnala', () => {
  let stato = vuoto;
  for (let i = 0; i < TETTO_SERVIZI; i++) stato = aggiungiServizio(stato, { tipo: 'xyz', nome: `T${i}`, url: `https://t${i}.it/{z}/{x}/{y}.png` }).stato;
  assert.equal(stato.servizi.length, TETTO_SERVIZI);
  const r = aggiungiServizio(stato, { tipo: 'xyz', nome: 'Uno di troppo', url: 'https://troppo.it/{z}/{x}/{y}.png' });
  assert.equal(r.pieno, true);
  assert.equal(r.stato.servizi.length, TETTO_SERVIZI);
  // un servizio già presente si può aggiornare anche a tetto raggiunto
  assert.equal(aggiungiServizio(stato, { tipo: 'xyz', nome: 'T0', url: 'https://t0.it/{z}/{x}/{y}.png' }).pieno, false);
});

test('stato corrotto o voci non valide: elenco vuoto o filtrato; storage bloccato senza eccezioni', () => {
  const s = finto();
  s.m.set(CHIAVE_SERVIZI, '{non json');
  assert.deepEqual(leggiServizi(s), vuoto);
  s.m.set(CHIAVE_SERVIZI, JSON.stringify({ v: 1, servizi: [{ id: 'x' }, { id: 'y', tipo: 'xyz', nome: 'Y', url: 'https://y.it/{z}/{x}/{y}.png', voci: [] }] }));
  assert.deepEqual(leggiServizi(s).servizi.map(x => x.id), ['y']);
  const rotto = { getItem() { throw new Error('x'); }, setItem() { throw new Error('y'); } };
  assert.deepEqual(leggiServizi(rotto), vuoto);
  assert.equal(salvaServizi(rotto, vuoto), false);
});
```

- [ ] **Step 8: Verificare che fallisca** — `node --test tests/js/aggiungi-salvati.test.mjs`. Expected: FAIL (modulo mancante).

- [ ] **Step 9: Scrivere `js/aggiungi/salvati.js`**

```js
// js/aggiungi/salvati.js
// Servizi (XYZ, WMS, WFS) incollati dall'utente e salvati nel browser: solo URL e scelte, nessun dato.
// Lo storage arriva dal chiamante; se è bloccato o pieno l'app funziona lo stesso, senza memoria.
import { hash } from '../rndt/host.js';

export const CHIAVE_SERVIZI = 'dt:miei:servizi:v1';
export const TETTO_SERVIZI = 50;
const TIPI = ['xyz', 'wms', 'wfs'];
const vuoto = () => ({ v: 1, servizi: [] });

export const idServizio = (tipo, url) => `srv-${hash(`${tipo}|${url}`)}`;

const valido = s => s && typeof s.id === 'string' && TIPI.includes(s.tipo) && typeof s.nome === 'string'
  && typeof s.url === 'string' && Array.isArray(s.voci);

export function leggiServizi(storage) {
  try {
    const grezzo = storage?.getItem(CHIAVE_SERVIZI);
    if (!grezzo) return vuoto();
    const s = JSON.parse(grezzo);
    if (s?.v !== 1 || !Array.isArray(s.servizi)) return vuoto();
    return { v: 1, servizi: s.servizi.filter(valido) };
  } catch {
    return vuoto();
  }
}

export function salvaServizi(storage, stato) {
  try {
    storage.setItem(CHIAVE_SERVIZI, JSON.stringify(stato));
    return true;
  } catch {
    return false;
  }
}

// Aggiunge o aggiorna (stesso tipo e URL → stesso servizio, voci unite per `chiave`). A tetto raggiunto un servizio nuovo non entra.
export function aggiungiServizio(stato, { tipo, nome, url, voci = [] }) {
  const id = idServizio(tipo, url);
  const presente = stato.servizi.find(s => s.id === id);
  if (!presente && stato.servizi.length >= TETTO_SERVIZI) return { stato, pieno: true };
  const unite = new Map([...(presente?.voci ?? []), ...voci].map(v => [v.chiave, v]));
  const nuovo = { id, tipo, nome: presente?.nome ?? nome, url, voci: [...unite.values()] };
  return { stato: { ...stato, servizi: [...stato.servizi.filter(s => s.id !== id), nuovo] }, pieno: false };
}

export const rimuoviServizio = (stato, id) => ({ ...stato, servizi: stato.servizi.filter(s => s.id !== id) });
```

- [ ] **Step 10: Verificare** — `node --test tests/js/aggiungi-*.test.mjs`. Expected: PASS. Poi `npm run test:js`: stesso totale della baseline più i nuovi.

- [ ] **Step 11: Commit**

```bash
git add js/rndt/archivio.js js/rndt/host.js js/aggiungi/salvati.js tests/js/aggiungi-archivio.test.mjs tests/js/aggiungi-salvati.test.mjs
git commit -m "feat(aggiungi): chiave dell'archivio parametrica e servizi salvati

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Lettura dei servizi (`servizi.js`, puro)

**Files:**
- Create: `js/aggiungi/servizi.js`
- Test: `tests/js/aggiungi-servizi.test.mjs`

**Interfaces:**
- Consumes: `BBOX_PALERMO` non serve qui (il bbox lo passa il chiamante).
- Produces:
  - `leggiXml(testo) → nodo` radice `{ nome, attr, figli, testo }` (nomi senza prefisso di namespace); lancia `Error('XML non valido')`
  - `capabilitiesWms(testo) → { versione, formato, layer: [{ nome, titolo, bbox: [w,s,e,n]|null, supportato: boolean }] }`
  - `capabilitiesWfs(testo) → { versione, tipi: [{ nome, titolo }] }`
  - `validaXyz(url) → string` (lancia `Error` in italiano)
  - `urlBase(url) → string` (https; senza `service`/`request`/`version`, qualunque maiuscola)
  - `urlCapabilities(url, servizio: 'wms'|'wfs') → string`
  - `urlGetFeature(url, { tipo, versione, bbox, max }) → string`

- [ ] **Step 1: Scrivere i test**

```js
// tests/js/aggiungi-servizi.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  leggiXml, capabilitiesWms, capabilitiesWfs, validaXyz, urlBase, urlCapabilities, urlGetFeature,
} from '../../js/aggiungi/servizi.js';

const WMS_130 = `<?xml version="1.0"?>
<WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms">
 <Capability>
  <Request><GetMap><Format>image/jpeg</Format><Format>image/png</Format></GetMap></Request>
  <Layer>
   <Title>Radice</Title>
   <CRS>EPSG:4326</CRS><CRS>EPSG:3857</CRS>
   <EX_GeographicBoundingBox><westBoundLongitude>12</westBoundLongitude><eastBoundLongitude>14</eastBoundLongitude><southBoundLatitude>37</southBoundLatitude><northBoundLatitude>39</northBoundLatitude></EX_GeographicBoundingBox>
   <Layer><Name>pai</Name><Title>Piano &amp; PAI</Title></Layer>
   <Layer><Title>Gruppo senza nome</Title><Layer><Name>annidato</Name><Title>Annidato</Title></Layer></Layer>
  </Layer>
 </Capability>
</WMS_Capabilities>`;

const WMS_SOLO_4326 = `<WMS_Capabilities version="1.3.0"><Capability><Request><GetMap><Format>image/png</Format></GetMap></Request>
<Layer><CRS>EPSG:4326</CRS><Layer><Name>a</Name><Title>A</Title></Layer></Layer></Capability></WMS_Capabilities>`;

const WMS_111 = `<?xml version="1.0"?>
<!DOCTYPE WMT_MS_Capabilities SYSTEM "http://schemas.opengis.net/wms/1.1.1/WMS_MS_Capabilities.dtd" [ <!ELEMENT VendorSpecificCapabilities EMPTY> ]>
<WMT_MS_Capabilities version="1.1.1"><Capability><Request><GetMap><Format>image/gif</Format></GetMap></Request>
<Layer><Title>R</Title><SRS>EPSG:4326 EPSG:900913</SRS><LatLonBoundingBox minx="12" miny="37" maxx="14" maxy="39"/>
<Layer><Name>a</Name><Title>A</Title></Layer></Layer></Capability></WMT_MS_Capabilities>`;

const WFS_200 = `<wfs:WFS_Capabilities version="2.0.0" xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:ows="http://www.opengis.net/ows/1.1">
<wfs:FeatureTypeList>
 <wfs:FeatureType><wfs:Name>ns:strade</wfs:Name><wfs:Title>Strade</wfs:Title></wfs:FeatureType>
 <wfs:FeatureType><wfs:Name>ns:civici</wfs:Name></wfs:FeatureType>
</wfs:FeatureTypeList></wfs:WFS_Capabilities>`;

test('leggiXml: prefissi tolti, entità, CDATA, commenti, auto-chiusi', () => {
  const r = leggiXml('<?xml version="1.0"?><!-- c --><a:r x:k="1 &amp; 2"><b>t&lt;</b><c/><d><![CDATA[<z>]]></d></a:r>');
  assert.equal(r.nome, 'r');
  assert.equal(r.attr.k, '1 & 2');
  assert.deepEqual(r.figli.map(f => f.nome), ['b', 'c', 'd']);
  assert.equal(r.figli[0].testo, 't<');
  assert.equal(r.figli[2].testo, '<z>');
});

test('leggiXml: XML non bilanciato, vuoto o HTML sciatto → errore', () => {
  assert.throws(() => leggiXml('<a><b></a>'), /XML non valido/);
  assert.throws(() => leggiXml('<a>'), /XML non valido/);
  assert.throws(() => leggiXml('solo testo'), /XML non valido/);
});

test('WMS 1.3.0: layer richiedibili, titolo decodificato, bbox ereditato, formato png preferito', () => {
  const c = capabilitiesWms(WMS_130);
  assert.equal(c.versione, '1.3.0');
  assert.equal(c.formato, 'image/png');
  assert.deepEqual(c.layer.map(l => l.nome), ['pai', 'annidato']);
  assert.equal(c.layer[0].titolo, 'Piano & PAI');
  assert.deepEqual(c.layer[0].bbox, [12, 37, 14, 39]);
  assert.deepEqual(c.layer[1].bbox, [12, 37, 14, 39]);
  assert.equal(c.layer[0].supportato, true);
});

test('WMS senza EPSG:3857: il layer c’è ma non è supportato', () => {
  const c = capabilitiesWms(WMS_SOLO_4326);
  assert.deepEqual(c.layer.map(l => [l.nome, l.supportato]), [['a', false]]);
});

test('WMS 1.1.1: DOCTYPE con sottoinsieme, SRS in elenco, LatLonBoundingBox, primo formato se manca png', () => {
  const c = capabilitiesWms(WMS_111);
  assert.equal(c.versione, '1.1.1');
  assert.equal(c.formato, 'image/gif');
  assert.deepEqual(c.layer, [{ nome: 'a', titolo: 'A', bbox: [12, 37, 14, 39], supportato: true }]);
});

test('WMS: eccezioni del servizio, pagina HTML e XML non WMS danno errori in chiaro', () => {
  assert.throws(() => capabilitiesWms('<ServiceExceptionReport><ServiceException>Boom</ServiceException></ServiceExceptionReport>'), /Boom/);
  assert.throws(() => capabilitiesWms('<html><body>Accesso negato</body></html>'), /non è un servizio WMS/);
  assert.throws(() => capabilitiesWms('<WMS_Capabilities version="1.3.0"><Capability></Capability></WMS_Capabilities>'), /nessun layer/);
});

test('WFS 2.0.0: tipi con nome e titolo (senza titolo vale il nome)', () => {
  const c = capabilitiesWfs(WFS_200);
  assert.equal(c.versione, '2.0.0');
  assert.deepEqual(c.tipi, [{ nome: 'ns:strade', titolo: 'Strade' }, { nome: 'ns:civici', titolo: 'ns:civici' }]);
});

test('WFS: eccezione OWS e documento non WFS → errore', () => {
  assert.throws(() => capabilitiesWfs('<ows:ExceptionReport><ows:Exception><ows:ExceptionText>Servizio spento</ows:ExceptionText></ows:Exception></ows:ExceptionReport>'), /Servizio spento/);
  assert.throws(() => capabilitiesWfs('<html></html>'), /non è un servizio WFS/);
  assert.throws(() => capabilitiesWfs('<WFS_Capabilities version="2.0.0"><FeatureTypeList/></WFS_Capabilities>'), /nessun tipo/);
});

test('validaXyz: https con {z} {x} {y}', () => {
  assert.equal(validaXyz('  https://a.it/{z}/{x}/{y}.png '), 'https://a.it/{z}/{x}/{y}.png');
  assert.throws(() => validaXyz('http://a.it/{z}/{x}/{y}.png'), /https/);
  assert.throws(() => validaXyz('https://a.it/tile.png'), /\{z\}/);
  assert.throws(() => validaXyz('ciao'), /non valido/);
  assert.throws(() => validaXyz(''), /non valido/);
});

test('urlBase e urlCapabilities: tolgono service/request/version in ogni maiuscola e tengono il resto', () => {
  const dato = 'https://x.it/ows?map=a&SERVICE=WMS&request=GetCapabilities&Version=1.1.1';
  assert.equal(urlBase(dato), 'https://x.it/ows?map=a');
  const u = new URL(urlCapabilities(dato, 'wms'));
  assert.equal(u.searchParams.get('map'), 'a');
  assert.equal(u.searchParams.get('SERVICE'), 'WMS');
  assert.equal(u.searchParams.get('REQUEST'), 'GetCapabilities');
  assert.equal([...u.searchParams.keys()].filter(k => k.toLowerCase() === 'request').length, 1);
  assert.equal(new URL(urlCapabilities('https://x.it/wfs', 'wfs')).searchParams.get('SERVICE'), 'WFS');
  assert.throws(() => urlBase('http://x.it/ows'), /https/);
  assert.throws(() => urlBase('non è un indirizzo'), /non valido/);
});

test('urlGetFeature 2.0.0: typeNames, count, bbox con asse lat/lon e urn', () => {
  const u = new URL(urlGetFeature('https://x.it/wfs?map=a', { tipo: 'ns:strade', versione: '2.0.0', bbox: [13.1, 37.9785, 13.55, 38.2919], max: 5001 }));
  const p = u.searchParams;
  assert.equal(p.get('map'), 'a');
  assert.equal(p.get('SERVICE'), 'WFS');
  assert.equal(p.get('REQUEST'), 'GetFeature');
  assert.equal(p.get('VERSION'), '2.0.0');
  assert.equal(p.get('typeNames'), 'ns:strade');
  assert.equal(p.get('count'), '5001');
  assert.equal(p.get('outputFormat'), 'application/json');
  assert.equal(p.get('srsName'), 'EPSG:4326');
  assert.equal(p.get('bbox'), '37.9785,13.1,38.2919,13.55,urn:ogc:def:crs:EPSG::4326');
});

test('urlGetFeature 1.0.0: typeName, maxFeatures, bbox lon/lat', () => {
  const p = new URL(urlGetFeature('https://x.it/wfs', { tipo: 'a', versione: '1.0.0', bbox: [13.1, 37.9785, 13.55, 38.2919], max: 5001 })).searchParams;
  assert.equal(p.get('typeName'), 'a');
  assert.equal(p.get('maxFeatures'), '5001');
  assert.equal(p.get('bbox'), '13.1,37.9785,13.55,38.2919,EPSG:4326');
  assert.equal(p.get('typeNames'), null);
});
```

- [ ] **Step 2: Verificare che fallisca** — `node --test tests/js/aggiungi-servizi.test.mjs`. Expected: FAIL (modulo mancante).

- [ ] **Step 3: Scrivere `js/aggiungi/servizi.js`**

```js
// js/aggiungi/servizi.js
// Servizi geografici incollati per URL (XYZ, WMS, WFS): lettura delle capabilities e costruzione delle richieste.
// Moduli puri, senza DOM né rete (il browser ha DOMParser, Node no: un piccolo lettore XML basta e si prova nei test).

const ENTITA = { amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'' };
const decodifica = t => t.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (m, e) => (e[0] === '#'
  ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10))
  : ENTITA[e.toLowerCase()]));
const senzaPrefisso = nome => nome.replace(/^[^:]+:/, '');

// commenti, CDATA (1), istruzioni, DOCTYPE (anche con sottoinsieme tra [ ]), tag (2 = chiusura, 3 = nome, 4 = attributi, 5 = auto-chiuso), testo (6)
const TOKEN = /<!--[\s\S]*?-->|<!\[CDATA\[([\s\S]*?)\]\]>|<\?[\s\S]*?\?>|<!DOCTYPE[^[>]*(?:\[[\s\S]*?\])?\s*>|<(\/)?([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/)?>|([^<]+)/g;
const ATTRIBUTO = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

// Nodo radice { nome, attr, figli, testo }; i nomi e gli attributi perdono il prefisso di namespace.
export function leggiXml(testo) {
  const radice = { nome: '#radice', attr: {}, figli: [], testo: '' };
  const pila = [radice];
  for (const m of String(testo).matchAll(TOKEN)) {
    const cima = pila.at(-1);
    if (m[1] !== undefined) cima.testo += m[1];
    else if (m[6] !== undefined) cima.testo += decodifica(m[6]);
    else if (m[3]) {
      const nome = senzaPrefisso(m[3]);
      if (m[2]) {
        if (pila.length < 2 || cima.nome !== nome) throw new Error('XML non valido');
        pila.pop();
      } else {
        const attr = {};
        for (const a of m[4].matchAll(ATTRIBUTO)) attr[senzaPrefisso(a[1])] = decodifica(a[2] ?? a[3]);
        const nodo = { nome, attr, figli: [], testo: '' };
        cima.figli.push(nodo);
        if (!m[5]) pila.push(nodo);
      }
    }
  }
  if (pila.length !== 1 || radice.figli.length !== 1) throw new Error('XML non valido');
  return radice.figli[0];
}

const figli = (n, nome) => (n?.figli ?? []).filter(f => f.nome === nome);
const primo = (n, nome) => figli(n, nome)[0];
const testoDi = (n, nome) => primo(n, nome)?.testo.trim() ?? '';

// Il servizio può rispondere con un'eccezione al posto delle capabilities: il suo testo è il motivo da mostrare.
function erroreDelServizio(radice) {
  if (!/Exception/.test(radice.nome)) return null;
  const nodi = [];
  const raccogli = n => { if (/^(ServiceException|ExceptionText)$/.test(n.nome)) nodi.push(n.testo.trim()); n.figli.forEach(raccogli); };
  raccogli(radice);
  return nodi.find(Boolean) ?? 'il servizio ha risposto con un errore';
}

const CRS_WEB = new Set(['EPSG:3857', 'EPSG:900913', 'EPSG:102100', 'EPSG:102113']);
const crsDi = n => [...figli(n, 'CRS'), ...figli(n, 'SRS')].flatMap(c => c.testo.trim().split(/\s+/)).filter(Boolean).map(s => s.toUpperCase());
function bboxDi(n) {
  const g = primo(n, 'EX_GeographicBoundingBox');
  const l = primo(n, 'LatLonBoundingBox');
  const v = g
    ? ['westBoundLongitude', 'southBoundLatitude', 'eastBoundLongitude', 'northBoundLatitude'].map(k => parseFloat(testoDi(g, k)))
    : l ? ['minx', 'miny', 'maxx', 'maxy'].map(k => parseFloat(l.attr[k])) : null;
  return v && v.every(Number.isFinite) ? v : null;
}

export function capabilitiesWms(testo) {
  const radice = leggiXml(testo);
  const errore = erroreDelServizio(radice);
  if (errore) throw new Error(errore);
  if (!/^(WMS_Capabilities|WMT_MS_Capabilities)$/.test(radice.nome)) throw new Error('l’indirizzo non è un servizio WMS');
  const cap = primo(radice, 'Capability');
  const formati = figli(primo(primo(cap, 'Request'), 'GetMap'), 'Format').map(f => f.testo.trim()).filter(Boolean);
  const layer = [];
  // Name = layer richiedibile; CRS e riquadro si ereditano dal gruppo che lo contiene
  const visita = (n, padre) => {
    const crs = new Set([...padre.crs, ...crsDi(n)]);
    const bbox = bboxDi(n) ?? padre.bbox;
    const nome = testoDi(n, 'Name');
    if (nome) layer.push({ nome, titolo: testoDi(n, 'Title') || nome, bbox, supportato: [...crs].some(c => CRS_WEB.has(c)) });
    for (const f of figli(n, 'Layer')) visita(f, { crs, bbox });
  };
  for (const l of figli(cap, 'Layer')) visita(l, { crs: new Set(), bbox: null });
  if (!layer.length) throw new Error('il servizio non ha nessun layer richiedibile');
  return { versione: radice.attr.version ?? '1.1.1', formato: formati.includes('image/png') ? 'image/png' : formati[0] ?? 'image/png', layer };
}

export function capabilitiesWfs(testo) {
  const radice = leggiXml(testo);
  const errore = erroreDelServizio(radice);
  if (errore) throw new Error(errore);
  if (radice.nome !== 'WFS_Capabilities') throw new Error('l’indirizzo non è un servizio WFS');
  const tipi = figli(primo(radice, 'FeatureTypeList'), 'FeatureType')
    .map(t => ({ nome: testoDi(t, 'Name'), titolo: testoDi(t, 'Title') }))
    .filter(t => t.nome)
    .map(t => ({ nome: t.nome, titolo: t.titolo || t.nome }));
  if (!tipi.length) throw new Error('il servizio non ha nessun tipo di dati');
  return { versione: radice.attr.version ?? '1.1.0', tipi };
}

// Il Worker accetta solo https: si rifiuta subito, con un messaggio che dice perché.
function url(testo) {
  let u;
  try { u = new URL(String(testo).trim()); } catch { throw new Error('indirizzo non valido'); }
  if (u.protocol !== 'https:') throw new Error('serve un indirizzo https');
  return u;
}

export function validaXyz(testo) {
  const u = String(testo).trim();
  url(u);
  for (const k of ['{z}', '{x}', '{y}']) if (!u.includes(k)) throw new Error(`l’indirizzo deve contenere ${k}`);
  return u;
}

const SENZA = ['service', 'request', 'version'];
function pulito(testo) {
  const u = url(testo);
  for (const k of [...u.searchParams.keys()]) if (SENZA.includes(k.toLowerCase())) u.searchParams.delete(k);
  return u;
}

export const urlBase = testo => pulito(testo).toString();

export function urlCapabilities(testo, servizio) {
  const u = pulito(testo);
  u.searchParams.set('SERVICE', servizio.toUpperCase());
  u.searchParams.set('REQUEST', 'GetCapabilities');
  return u.toString();
}

// bbox = [ovest, sud, est, nord] in WGS84. WFS 1.0.0 vuole lon/lat; dalla 1.1.0 l'asse di EPSG:4326 è lat/lon, e lo dice l'urn.
export function urlGetFeature(testo, { tipo, versione, bbox, max }) {
  const u = pulito(testo);
  const [w, s, e, n] = bbox;
  const v2 = versione.startsWith('2');
  const v10 = versione.startsWith('1.0');
  const imposta = (k, v) => u.searchParams.set(k, v);
  imposta('SERVICE', 'WFS');
  imposta('VERSION', versione);
  imposta('REQUEST', 'GetFeature');
  imposta(v2 ? 'typeNames' : 'typeName', tipo);
  imposta('outputFormat', 'application/json');
  imposta('srsName', 'EPSG:4326');
  imposta(v2 ? 'count' : 'maxFeatures', String(max));
  imposta('bbox', v10 ? `${w},${s},${e},${n},EPSG:4326` : `${s},${w},${n},${e},urn:ogc:def:crs:EPSG::4326`);
  return u.toString();
}
```

- [ ] **Step 4: Verificare** — `node --test tests/js/aggiungi-servizi.test.mjs`. Expected: PASS. Se «XML non bilanciato» non lancia per `'<a>'`, controllare che `pila.length !== 1` sia raggiunto; se «solo testo» non lancia, controllare `radice.figli.length !== 1`.

- [ ] **Step 5: Commit**

```bash
git add js/aggiungi/servizi.js tests/js/aggiungi-servizi.test.mjs
git commit -m "feat(aggiungi): lettura capabilities WMS/WFS e richieste dei servizi

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Host — prefisso, etichetta e `addWfsLayer`

**Files:**
- Modify: `js/rndt/host.js`
- Test: `tests/js/aggiungi-host.test.mjs`

**Interfaces:**
- Consumes: `creaHost` esistente.
- Produces: `creaHost({ …, prefisso = 'rndt', etichetta = 'RNDT' })`; `export const TETTO_WFS = 5000`; `host.addWfsLayer(nome, richiesta) → Promise<string>` (id del layer).

- [ ] **Step 1: Scrivere i test**

```js
// tests/js/aggiungi-host.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { creaHost, TETTO_WFS } from '../../js/rndt/host.js';
import { archivioInMemoria } from '../../js/rndt/dati.js';

const PROXY = 'https://proxy.test';
const RICHIESTA = 'https://wfs.example.org/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&typeNames=ns%3Astrade&outputFormat=application%2Fjson&count=5001&bbox=37.9785%2C13.1%2C38.2919%2C13.55%2Curn%3Aogc%3Adef%3Acrs%3AEPSG%3A%3A4326';

function mappaFinta() {
  const sorgenti = new Map(), strati = new Map();
  return {
    sorgenti, strati,
    addSource: (id, s) => sorgenti.set(id, s), removeSource: id => sorgenti.delete(id), getSource: id => sorgenti.get(id),
    addLayer: l => strati.set(l.id, l), removeLayer: id => strati.delete(id), getLayer: id => strati.get(id),
    setLayoutProperty() {}, getBounds: () => ({ getWest: () => 13, getSouth: () => 38, getEast: () => 13.4, getNorth: () => 38.2 }),
    fitBounds() {}, queryRenderedFeatures: () => [], on() {},
  };
}
const corpo = testo => ({ ok: true, status: 200, arrayBuffer: async () => new TextEncoder().encode(testo).buffer });
const punti = n => JSON.stringify({ type: 'FeatureCollection', features: Array.from({ length: n }, () => ({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [13.36, 38.11] } })) });
const costruisci = (testoRisposta, extra = {}) => {
  const map = mappaFinta(), scritti = [], chiamate = [], avvisi = [];
  const host = creaHost({
    map, proxy: PROXY, stato: extra.stato ?? { v: 1, layers: [] }, scrivi: s => { scritti.push(s); return true; },
    notifica: m => avvisi.push(m), archivioDati: archivioInMemoria(), prefisso: 'miei', etichetta: 'aggiunti',
    fetchFn: async u => { chiamate.push(u); return corpo(testoRisposta); },
  });
  return { host, map, scritti, chiamate, avvisi };
};

test('il prefisso dà gli id di sorgenti e layer in mappa', () => {
  const { host, map } = costruisci('{}');
  const id = host.addTileLayer('XYZ', 'https://a.it/{z}/{x}/{y}.png', {});
  assert.ok(id.startsWith('miei-'));
  assert.ok(map.sorgenti.has(id) && map.strati.has(id));
});

test('addWfsLayer: scarica dal proxy, mette il layer in mappa e lo salva con l’URL', async () => {
  const { host, map, scritti, chiamate } = costruisci(punti(3));
  const id = await host.addWfsLayer('Strade', RICHIESTA);
  assert.ok(id.startsWith('miei-'));
  assert.ok(chiamate[0].startsWith('https://proxy.test/t/wfs.example.org/ows?'));
  assert.equal(map.sorgenti.get(id).data.features.length, 3);
  const salvato = scritti.at(-1).layers[0];
  assert.deepEqual([salvato.tipo, salvato.nome, salvato.sorgente.url], ['geojson', 'Strade', RICHIESTA]);
});

test('addWfsLayer: lo stesso servizio due volte non scarica né duplica', async () => {
  const { host, map, chiamate } = costruisci(punti(2));
  const a = await host.addWfsLayer('Strade', RICHIESTA);
  const b = await host.addWfsLayer('Strade', RICHIESTA);
  assert.equal(a, b);
  assert.equal(chiamate.length, 1);
  assert.equal(host.elenco().length, 1);
  assert.equal(map.sorgenti.size, 1);
});

test('addWfsLayer: oltre il tetto, risposta non JSON o vuota → errore e niente in mappa né salvato', async () => {
  const grande = costruisci(punti(TETTO_WFS + 1));
  await assert.rejects(() => grande.host.addWfsLayer('G', RICHIESTA), /più di 5000/);
  const xml = costruisci('<ows:ExceptionReport/>');
  await assert.rejects(() => xml.host.addWfsLayer('X', RICHIESTA), /non produce GeoJSON/);
  const vuoto = costruisci(punti(0));
  await assert.rejects(() => vuoto.host.addWfsLayer('V', RICHIESTA), /nessun elemento/);
  for (const c of [grande, xml, vuoto]) {
    assert.equal(c.map.sorgenti.size, 0);
    assert.equal(c.scritti.length, 0);
    assert.equal(c.host.elenco().length, 0);
  }
});

test('un WFS salvato torna con ripristina, riscaricando dall’URL', async () => {
  const stato = { v: 1, layers: [{ id: 'miei-xyz', tipo: 'geojson', nome: 'Strade', visibile: true, sorgente: { url: RICHIESTA } }] };
  const { host, map, chiamate } = costruisci(punti(4), { stato });
  await host.ripristina();
  assert.equal(chiamate.length, 1);
  assert.equal(host.elenco().length, 1);
  assert.equal(host.elenco()[0].indisponibile, false);
  assert.equal([...map.sorgenti.values()][0].data.features.length, 4);
});

test('un WFS che non risponde più resta nell’elenco come non disponibile', async () => {
  const stato = { v: 1, layers: [{ id: 'miei-xyz', tipo: 'geojson', nome: 'Strade', visibile: true, sorgente: { url: RICHIESTA } }] };
  const map = mappaFinta();
  const host = creaHost({ map, proxy: PROXY, stato, scrivi: () => true, prefisso: 'miei', archivioDati: archivioInMemoria(), fetchFn: async () => ({ ok: false, status: 502 }) });
  await host.ripristina();
  assert.equal(host.elenco()[0].indisponibile, true);
});
```

- [ ] **Step 2: Verificare che fallisca** — `node --test tests/js/aggiungi-host.test.mjs`. Expected: FAIL (`TETTO_WFS` non esportato, `addWfsLayer` mancante, id con prefisso `rndt-`).

- [ ] **Step 3: Modificare `js/rndt/host.js`**

1. Sotto `TETTO_DATI`: `export const TETTO_WFS = 5000; // oltre questo numero di feature il WFS è troppo grande per il browser`.
2. Firma: `creaHost({ map, proxy, stato: iniziale, scrivi, anelli = () => [], notifica = () => {}, pannello = {}, archivioDati = null, prefisso = 'rndt', etichetta = 'RNDT', fetchFn = (...a) => fetch(...a) })`.
3. Sostituire i tre id con il prefisso:
   - in `creaWms`: `const id = \`${prefisso}-${hash(\`wms|${opz.url}|${opz.layers}\`)}\`;`
   - in `creaTile`: `const id = \`${prefisso}-${hash(\`tile|${url}\`)}\`;`
   - in `creaGeoJson`: `const id = idSalvato ?? \`${prefisso}-${hash(url ? \`geojson|${url}\` : \`geojson|${nome}|${testo}\`)}\`;`
4. Messaggi: `'Non riesco a salvare i layer RNDT: restano finché la pagina è aperta.'` → `` `Non riesco a salvare i layer ${etichetta}: restano finché la pagina è aperta.` `` e `` `Layer RNDT con errori di caricamento: ${rec.nome}` `` → `` `Layer ${etichetta} con errori di caricamento: ${rec.nome}` ``. Il default `RNDT` lascia i testi identici.
5. Nell'oggetto restituito, dopo `addFileLayer`:

```js
    // WFS da un servizio dell'utente: `richiesta` è il GetFeature già completo (con bbox di Palermo). Si salva con l'URL.
    async addWfsLayer(nome, richiesta) {
      const id = `${prefisso}-${hash(`geojson|${richiesta}`)}`;
      if (layers.has(id)) return id;
      let fc;
      try { fc = JSON.parse(new TextDecoder().decode(await fetchArrayBuffer(richiesta))); } catch (errore) {
        if (errore instanceof SyntaxError) throw new Error('il servizio non produce GeoJSON');
        throw errore;
      }
      if (fc?.type !== 'FeatureCollection' || !Array.isArray(fc.features)) throw new Error('il servizio non produce GeoJSON');
      if (fc.features.length > TETTO_WFS) throw new Error(`più di ${TETTO_WFS} elementi nell’area di Palermo: il servizio è troppo grande`);
      if (!fc.features.length) throw new Error('nessun elemento nell’area di Palermo');
      return creaGeoJson(nome, fc, richiesta, true);
    },
```

- [ ] **Step 4: Verificare** — `node --test tests/js/aggiungi-host.test.mjs tests/js/rndt-host.test.mjs`. Expected: PASS (il catalogo mantiene id `rndt-` e testi invariati).

- [ ] **Step 5: Commit**

```bash
git add js/rndt/host.js tests/js/aggiungi-host.test.mjs
git commit -m "feat(aggiungi): host con prefisso e WFS da servizio dell'utente

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Migrazione dei file dal computer

**Files:**
- Create: `js/aggiungi/migrazione.js`
- Test: `tests/js/aggiungi-migrazione.test.mjs`

**Interfaces:**
- Consumes: `leggi`, `salva`, `CHIAVE`, `CHIAVE_MIEI` da `js/rndt/archivio.js`.
- Produces: `migraFileLocali(storage) → number` (quanti file spostati).

- [ ] **Step 1: Scrivere i test**

```js
// tests/js/aggiungi-migrazione.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { migraFileLocali } from '../../js/aggiungi/migrazione.js';
import { leggi, salva, CHIAVE, CHIAVE_MIEI } from '../../js/rndt/archivio.js';

const finto = (rifiuta = []) => {
  const m = new Map();
  return { m, getItem: k => m.get(k) ?? null, setItem: (k, v) => { if (rifiuta.includes(k)) throw new Error('pieno'); m.set(k, v); } };
};
const file = { id: 'rndt-f1', tipo: 'geojson', nome: 'Mio file', visibile: true, sorgente: { dati: true } };
const fileVecchio = { id: 'rndt-f2', tipo: 'geojson', nome: 'Vecchio', visibile: true, sorgente: { dati: { type: 'FeatureCollection', features: [] } } };
const wfs = { id: 'rndt-w', tipo: 'geojson', nome: 'WFS catalogo', visibile: true, sorgente: { url: 'https://a.it/wfs?bbox=1' } };
const wms = { id: 'rndt-m', tipo: 'wms', nome: 'WMS', visibile: true, sorgente: { url: 'https://a.it/ows', layers: 'x' } };
const prepara = (s, layers) => salva(s, { v: 1, layers }, CHIAVE);

test('sposta solo i file dal computer (anche nel vecchio formato) e lascia il catalogo', () => {
  const s = finto();
  prepara(s, [file, wfs, fileVecchio, wms]);
  assert.equal(migraFileLocali(s), 2);
  assert.deepEqual(leggi(s, CHIAVE).layers.map(l => l.id), ['rndt-w', 'rndt-m']);
  assert.deepEqual(leggi(s, CHIAVE_MIEI).layers.map(l => l.id).sort(), ['rndt-f1', 'rndt-f2']);
});

test('è idempotente: la seconda volta non c’è più nulla da spostare', () => {
  const s = finto();
  prepara(s, [file]);
  assert.equal(migraFileLocali(s), 1);
  assert.equal(migraFileLocali(s), 0);
  assert.equal(leggi(s, CHIAVE_MIEI).layers.length, 1);
});

test('non duplica un file già presente tra i «miei»', () => {
  const s = finto();
  prepara(s, [file]);
  salva(s, { v: 1, layers: [file] }, CHIAVE_MIEI);
  migraFileLocali(s);
  assert.equal(leggi(s, CHIAVE_MIEI).layers.length, 1);
});

test('se la scrittura del catalogo fallisce si torna indietro: niente persi, niente doppi', () => {
  const s = finto();
  prepara(s, [file, wms]);
  s.m.set(CHIAVE_MIEI, JSON.stringify({ v: 1, layers: [] }));
  const bloccato = finto([CHIAVE]);
  for (const [k, v] of s.m) bloccato.m.set(k, v);
  assert.equal(migraFileLocali(bloccato), 0);
  assert.deepEqual(leggi(bloccato, CHIAVE).layers.map(l => l.id), ['rndt-f1', 'rndt-m']);
  assert.deepEqual(leggi(bloccato, CHIAVE_MIEI).layers, []);
});

test('se non si riesce a scrivere i «miei» non si tocca nulla; storage assente o corrotto → 0', () => {
  const s = finto([CHIAVE_MIEI]);
  prepara(s, [file]);
  assert.equal(migraFileLocali(s), 0);
  assert.deepEqual(leggi(s, CHIAVE).layers.map(l => l.id), ['rndt-f1']);
  assert.equal(migraFileLocali(null), 0);
  const c = finto();
  c.m.set(CHIAVE, '{rotto');
  assert.equal(migraFileLocali(c), 0);
});
```

- [ ] **Step 2: Verificare che fallisca** — `node --test tests/js/aggiungi-migrazione.test.mjs`. Expected: FAIL (modulo mancante).

- [ ] **Step 3: Scrivere `js/aggiungi/migrazione.js`**

```js
// js/aggiungi/migrazione.js
// I file caricati dal computer stavano nel gruppo RNDT (dt:rndt:v1); ora sono di «I miei layer» (dt:miei:v1).
// Si sposta l'elenco; i dati restano in IndexedDB con lo stesso id. Si fa prima di creare gli host.
import { leggi, salva, CHIAVE, CHIAVE_MIEI } from '../rndt/archivio.js';

// un file dal computer è un GeoJSON senza URL: `dati: true` (archivio dati) o, nel vecchio formato, i dati dentro l'elenco
const eFile = l => l.tipo === 'geojson' && Boolean(l.sorgente?.dati);

// Quanti file ha spostato. Una scrittura che fallisce lascia tutto com'era: si riprova al prossimo avvio.
export function migraFileLocali(storage) {
  const rndt = leggi(storage, CHIAVE);
  const spostati = rndt.layers.filter(eFile);
  if (!spostati.length) return 0;
  const miei = leggi(storage, CHIAVE_MIEI);
  const nuovi = { ...miei, layers: [...miei.layers.filter(l => !spostati.some(f => f.id === l.id)), ...spostati] };
  if (!salva(storage, nuovi, CHIAVE_MIEI)) return 0;
  if (!salva(storage, { ...rndt, layers: rndt.layers.filter(l => !eFile(l)) }, CHIAVE)) {
    salva(storage, miei, CHIAVE_MIEI); // indietro: altrimenti il file starebbe in due elenchi
    return 0;
  }
  return spostati.length;
}
```

- [ ] **Step 4: Verificare** — `node --test tests/js/aggiungi-migrazione.test.mjs`. Expected: PASS. (Con `storage` nullo `leggi` dà lo stato vuoto → 0.)

- [ ] **Step 5: Commit**

```bash
git add js/aggiungi/migrazione.js tests/js/aggiungi-migrazione.test.mjs
git commit -m "feat(aggiungi): migrazione dei file dal gruppo RNDT a «I miei layer»

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Gruppo parametrizzato e tab «I miei layer»

**Files:**
- Modify: `js/rndt/gruppo.js`, `js/rndt/index.js`, `js/core/pannello.js`, `js/core/icone.js`
- Test: `tests/js/rndt-gruppo.test.mjs` (adattare) e `tests/js/aggiungi-gruppo.test.mjs`

**Interfaces:**
- Produces:
  - `creaGruppo({ id, titolo, argomento: { titolo, descrizione }, vuoto, azioni: [{ id, testo, tipo: 'apri'|'file', titolo? }] }) → { modulo, collega(host, apri, carica) }`
  - `creaGruppoRndt() = creaGruppo(OPZIONI_RNDT)` (compatibilità)
  - `OPZIONI_MIEI` (id `miei`, titolo «I miei layer»)
  - `modulo.id` = `id`; i controlli del gruppo hanno id `${id}-togli-<layer>`; il pulsante file ha id `<azione.id>`.
- Il gruppo RNDT ha una sola azione («＋ Dal catalogo RNDT»): il pulsante file esce da lì.

- [ ] **Step 1: Leggere il test esistente** — `tests/js/rndt-gruppo.test.mjs` verifica righe, stato del pulsante, focus e `creaGruppoRndt().modulo`. Dopo la modifica `rndt-carica-file` non esiste più nel gruppo RNDT: se un test lo usa come ripiego del focus, passare un altro id.

- [ ] **Step 2: Scrivere il test del nuovo gruppo**

```js
// tests/js/aggiungi-gruppo.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { creaGruppo, creaGruppoRndt, OPZIONI_MIEI } from '../../js/rndt/gruppo.js';
import { elencoArgomenti } from '../../js/core/argomenti.js';

const hostFinto = elenco => ({ elenco: () => elenco, suCambio() {}, getMap: () => ({}), mostra() {}, elimina() {} });

test('il gruppo «I miei layer» ha il suo id, il suo titolo e strati vuoti finché non c’è l’host', () => {
  const g = creaGruppo(OPZIONI_MIEI);
  assert.equal(g.modulo.id, 'miei');
  assert.equal(g.modulo.titolo, 'I miei layer');
  assert.deepEqual(g.modulo.strati, []);
  g.collega(hostFinto([{ id: 'miei-b', nome: 'Beta', visibile: true, indisponibile: false, errore: false, salvato: true, idMappa: [] }, { id: 'miei-a', nome: 'Alfa', visibile: true, indisponibile: false, errore: false, salvato: true, idMappa: [] }]), () => {}, async () => {});
  assert.deepEqual(g.modulo.strati.map(s => s.etichetta), ['Alfa', 'Beta']);
});

test('il gruppo RNDT resta quello di prima: id «rndt», niente pulsante per i file', () => {
  const g = creaGruppoRndt();
  assert.equal(g.modulo.id, 'rndt');
  assert.equal(g.modulo.titolo, 'RNDT');
});

test('«I miei layer» compare nella tab Argomenti', () => {
  const g = creaGruppo(OPZIONI_MIEI);
  g.collega(hostFinto([{ id: 'miei-a', nome: 'Alfa', visibile: true, indisponibile: false, errore: false, salvato: true, idMappa: [] }]), () => {}, async () => {});
  const voci = elencoArgomenti([g.modulo]);
  assert.ok(JSON.stringify(voci).includes('I miei layer'));
});
```
Se `elencoArgomenti` ha un'altra firma, adattare l'ultimo test guardando `tests/js/argomenti.test.mjs`; il suo scopo è solo verificare che il modulo si legga come gli altri gruppi.

- [ ] **Step 3: Verificare che fallisca** — `node --test tests/js/aggiungi-gruppo.test.mjs`. Expected: FAIL (`creaGruppo` non esportato).

- [ ] **Step 4: Generalizzare `js/rndt/gruppo.js`**

Sopra `creaGruppoRndt` aggiungere:

```js
export const OPZIONI_RNDT = {
  id: 'rndt',
  titolo: 'RNDT',
  argomento: { titolo: 'RNDT', descrizione: 'Dati aggiunti dal catalogo RNDT, anche richiamati dal salvataggio. Si aggiungono dal pulsante del catalogo nella barra strumenti.' },
  vuoto: 'Nessun layer RNDT: cercalo nel catalogo.',
  azioni: [{ id: 'rndt-catalogo-apri', testo: '＋ Dal catalogo RNDT', tipo: 'apri' }],
};

export const OPZIONI_MIEI = {
  id: 'miei',
  titolo: 'I miei layer',
  argomento: { titolo: 'I miei layer', descrizione: 'File caricati dal computer e servizi XYZ, WMS e WFS aggiunti per indirizzo, anche richiamati dal salvataggio. Si aggiungono dal pulsante «Aggiungi layer» nella barra strumenti.' },
  vuoto: 'Nessun layer aggiunto: carica un file o aggiungi un servizio.',
  azioni: [
    { id: 'miei-aggiungi-apri', testo: '＋ Aggiungi servizio o file…', tipo: 'apri' },
    { id: 'miei-carica-file', testo: '📁 Carica file dal computer', tipo: 'file', titolo: `Formati: ${ESTENSIONI.join(' ')}` },
  ],
};
```

Rinominare `export function creaGruppoRndt() {` in `export function creaGruppo({ id, titolo, argomento, vuoto, azioni }) {` e rinominare la variabile `apriCatalogo` in `apri`. Nel corpo:

- `disegna()`: sostituire la costruzione dei due pulsanti con:

```js
    const bottoni = azioni.map(a => {
      const b = el('button', 'rndt-gruppo-aggiungi', a.testo);
      b.type = 'button';
      b.id = a.id;
      if (a.titolo) b.title = a.titolo;
      b.addEventListener('click', () => (a.tipo === 'file' ? selettore.click() : apri()));
      return b;
    });
    const gruppoAzioni = el('div', 'rndt-gruppo-azioni');
    gruppoAzioni.append(...bottoni);
```
  (e usare `gruppoAzioni` al posto di `azioni` in `radice.replaceChildren(titolo, gruppoAzioni, selettore, ...voci)`; la variabile `titolo` del `h2` resta com'è: rinominare il parametro del gruppo per evitare l'ombra, vedi sotto).
- `selettore` si crea solo se c'è un'azione `file`: `selettore ??= azioni.some(a => a.tipo === 'file') ? creaSelettore() : el('span')` e `radice.replaceChildren(h2, gruppoAzioni, selettore, ...voci)` (nel codice esistente la variabile del titolo si chiama `titolo`: rinominarla `h2` per non confliggere col parametro).
- id del pulsante di rimozione: `` togli.id = `${id}-togli-${r.id}`; ``
- ripiego del focus: `idDaFocalizzare(idAttivo, [...], azioni[0].id)`.
- messaggio vuoto: `el('p', 'rndt-gruppo-vuoto', vuoto)`.
- `modulo`: `id`, `titolo`, `argomento` dai parametri (`argomento: { ...argomento }`).
- `collega(hostRndt, apriPannello, carica = async () => {})`: `apri = apriPannello`.

In fondo al file: `export const creaGruppoRndt = () => creaGruppo(OPZIONI_RNDT);`.

- [ ] **Step 5: Togliere il caricamento dei file da `js/rndt/index.js`**

Eliminare gli import di `importaFile` e `librerie`, la funzione `carica` e il commento che la precede, e cambiare la chiamata in `gruppo?.collega(host, apri); // gruppo «RNDT» della barra strati`.

- [ ] **Step 6: Tab nella barra sinistra (`js/core/pannello.js`, `js/core/icone.js`)**

- `ETICHETTE`: aggiungere `miei: 'I miei layer'`.
- `TAB_DIRETTI = new Set(['base', 'rndt', 'miei'])`.
- `js/core/icone.js`: in `ICONE` aggiungere `miei: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z', // «I miei layer» (library_add)`.

- [ ] **Step 7: Verificare** — `npm run test:js`. Expected: tutto passa. Correggere i test esistenti di `rndt-gruppo.test.mjs` solo dove citano `rndt-carica-file`.

- [ ] **Step 8: Commit**

```bash
git add js/rndt/gruppo.js js/rndt/index.js js/core/pannello.js js/core/icone.js tests/js/aggiungi-gruppo.test.mjs tests/js/rndt-gruppo.test.mjs
git commit -m "feat(aggiungi): gruppo «I miei layer» e pulsante file fuori dal gruppo RNDT

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Controllo e pannello (UI) e cablaggio

**Files:**
- Create: `js/aggiungi/controllo.js`, `js/aggiungi/pannello.js`, `js/aggiungi/index.js`
- Modify: `js/app.js`, `index.html`, `js/core/rail.js`, `css/*.css` (il file che contiene `#rndt-pannello`)
- Test: `tests/js/aggiungi-controllo.test.mjs`

**Interfaces:**
- Consumes: `creaHost`, `TETTO_WFS`; `capabilitiesWms`, `capabilitiesWfs`, `validaXyz`, `urlBase`, `urlCapabilities`, `urlGetFeature`; `leggiServizi`, `salvaServizi`, `aggiungiServizio`, `rimuoviServizio`; `BBOX_PALERMO` da `js/rndt/area.js`.
- Produces:
  - `creaControllo({ host, storage }) → { stato(), suCambio(fn), leggiServizio(tipo, url), aggiungiXyz({ nome, url }), aggiungiWms({ nome, url, servizio, scelti }), aggiungiWfs({ nome, url, servizio, scelti }), riaggiungi(id), rimuovi(id) }`
    - `leggiServizio('wms'|'wfs', urlUtente) → Promise<{ url, versione, formato?, layer?|tipi? }>` (`url` è l'URL base pulito)
    - `aggiungiXyz` → `{ pieno }`; `aggiungiWms`/`aggiungiWfs` → `Promise<{ pieno, errori: [{ nome, messaggio }] }>`; `scelti` = elenco di layer WMS (`{nome,titolo,bbox}`) o tipi WFS (`{nome,titolo}`)
    - `riaggiungi(id) → Promise<{ errori }>`
  - `collegaAggiungi(map, elementoPannello, { gruppo }) → { apri, chiudi, ripristina }`

- [ ] **Step 1: Scrivere i test del controllo**

```js
// tests/js/aggiungi-controllo.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { creaControllo } from '../../js/aggiungi/controllo.js';
import { leggiServizi, TETTO_SERVIZI } from '../../js/aggiungi/salvati.js';

const WMS = `<WMS_Capabilities version="1.3.0"><Capability><Request><GetMap><Format>image/png</Format></GetMap></Request>
<Layer><CRS>EPSG:3857</CRS><Layer><Name>pai</Name><Title>Piano PAI</Title></Layer><Layer><Name>rischio</Name><Title>Rischio</Title></Layer></Layer></Capability></WMS_Capabilities>`;
const WFS = '<WFS_Capabilities version="2.0.0"><FeatureTypeList><FeatureType><Name>ns:strade</Name><Title>Strade</Title></FeatureType></FeatureTypeList></WFS_Capabilities>';

const finto = () => { const m = new Map(); return { m, getItem: k => m.get(k) ?? null, setItem: (k, v) => { m.set(k, v); } }; };
function costruisci({ testo = WMS, wfsEsito = async () => 'miei-id', storage = finto() } = {}) {
  const chiamate = { tile: [], wms: [], wfs: [], fetch: [] };
  const host = {
    fetchArrayBuffer: async u => { chiamate.fetch.push(u); return new TextEncoder().encode(testo).buffer; },
    addTileLayer: (n, u) => { chiamate.tile.push([n, u]); return 'miei-t'; },
    addWmsLayer: (n, o) => { chiamate.wms.push([n, o]); return 'miei-w'; },
    addWfsLayer: async (n, r) => { chiamate.wfs.push([n, r]); return wfsEsito(n, r); },
  };
  return { c: creaControllo({ host, storage }), chiamate, storage };
}

test('leggiServizio WMS: chiede le capabilities e dà layer, versione e URL pulito', async () => {
  const { c, chiamate } = costruisci();
  const r = await c.leggiServizio('wms', 'https://x.it/ows?map=a&request=GetCapabilities');
  assert.equal(r.url, 'https://x.it/ows?map=a');
  assert.equal(r.versione, '1.3.0');
  assert.deepEqual(r.layer.map(l => l.nome), ['pai', 'rischio']);
  assert.match(chiamate.fetch[0], /REQUEST=GetCapabilities/);
  await assert.rejects(() => c.leggiServizio('wms', 'http://x.it/ows'), /https/);
});

test('aggiungiXyz: layer in mappa e servizio salvato; URL non valido → errore e niente salvato', () => {
  const { c, chiamate, storage } = costruisci();
  assert.deepEqual(c.aggiungiXyz({ nome: 'Ortofoto', url: 'https://t.it/{z}/{x}/{y}.png' }), { pieno: false });
  assert.deepEqual(chiamate.tile, [['Ortofoto', 'https://t.it/{z}/{x}/{y}.png']]);
  assert.equal(leggiServizi(storage).servizi[0].tipo, 'xyz');
  assert.throws(() => c.aggiungiXyz({ nome: 'X', url: 'https://t.it/tile.png' }), /\{z\}/);
  assert.equal(chiamate.tile.length, 1);
  assert.equal(leggiServizi(storage).servizi.length, 1);
});

test('aggiungiXyz senza nome: vale il nome dell’host', () => {
  const { c, chiamate } = costruisci();
  c.aggiungiXyz({ nome: '  ', url: 'https://t.it/{z}/{x}/{y}.png' });
  assert.equal(chiamate.tile[0][0], 't.it');
});

test('aggiungiWms: un layer per scelta, con le opzioni del servizio; salvato con le voci', async () => {
  const { c, chiamate, storage } = costruisci();
  const servizio = await c.leggiServizio('wms', 'https://x.it/ows');
  const r = await c.aggiungiWms({ nome: 'Servizio PAI', url: servizio.url, servizio, scelti: [servizio.layer[0]] });
  assert.deepEqual(r, { pieno: false, errori: [] });
  assert.equal(chiamate.wms.length, 1);
  assert.deepEqual([chiamate.wms[0][0], chiamate.wms[0][1].layers, chiamate.wms[0][1].version, chiamate.wms[0][1].format], ['Piano PAI', 'pai', '1.3.0', 'image/png']);
  const salvato = leggiServizi(storage).servizi[0];
  assert.deepEqual([salvato.tipo, salvato.nome, salvato.voci.length], ['wms', 'Servizio PAI', 1]);
});

test('aggiungiWms: un layer non supportato (niente EPSG:3857) non si aggiunge ma non rompe gli altri', async () => {
  const { c, chiamate } = costruisci();
  const servizio = await c.leggiServizio('wms', 'https://x.it/ows');
  const scelti = [{ ...servizio.layer[0], supportato: false }, servizio.layer[1]];
  const r = await c.aggiungiWms({ nome: '', url: servizio.url, servizio, scelti });
  assert.equal(chiamate.wms.length, 1);
  assert.equal(r.errori.length, 1);
  assert.match(r.errori[0].messaggio, /3857/);
});

test('aggiungiWfs: costruisce il GetFeature con bbox di Palermo e tetto, salva le voci riuscite; un errore non ferma gli altri', async () => {
  const esito = async n => { if (n === 'Rotto') throw new Error('il servizio non produce GeoJSON'); return 'miei-ok'; };
  const { c, chiamate, storage } = costruisci({ testo: WFS, wfsEsito: esito });
  const servizio = await c.leggiServizio('wfs', 'https://x.it/wfs');
  const r = await c.aggiungiWfs({ nome: 'Strade', url: servizio.url, servizio, scelti: [servizio.tipi[0], { nome: 'ns:rotto', titolo: 'Rotto' }] });
  assert.equal(chiamate.wfs.length, 2);
  assert.match(chiamate.wfs[0][1], /typeNames=ns%3Astrade/);
  assert.match(chiamate.wfs[0][1], /count=5001/);
  assert.deepEqual(r.errori, [{ nome: 'Rotto', messaggio: 'il servizio non produce GeoJSON' }]);
  assert.equal(leggiServizi(storage).servizi[0].voci.length, 1);
});

test('aggiungiWfs: se tutto fallisce non si salva alcun servizio', async () => {
  const { c, storage } = costruisci({ testo: WFS, wfsEsito: async () => { throw new Error('più di 5000 elementi'); } });
  const servizio = await c.leggiServizio('wfs', 'https://x.it/wfs');
  const r = await c.aggiungiWfs({ nome: 'S', url: servizio.url, servizio, scelti: servizio.tipi });
  assert.equal(r.errori.length, 1);
  assert.equal(leggiServizi(storage).servizi.length, 0);
});

test('riaggiungi: rimette in mappa le voci salvate senza rileggere il servizio; due volte non duplica il servizio', async () => {
  const { c, chiamate, storage } = costruisci();
  const servizio = await c.leggiServizio('wms', 'https://x.it/ows');
  await c.aggiungiWms({ nome: 'S', url: servizio.url, servizio, scelti: servizio.layer });
  await c.aggiungiWms({ nome: 'S', url: servizio.url, servizio, scelti: servizio.layer });
  assert.equal(leggiServizi(storage).servizi.length, 1);
  assert.equal(leggiServizi(storage).servizi[0].voci.length, 2);
  const fetchPrima = chiamate.fetch.length;
  const id = leggiServizi(storage).servizi[0].id;
  const r = await c.riaggiungi(id);
  assert.deepEqual(r, { errori: [] });
  assert.equal(chiamate.fetch.length, fetchPrima);
  assert.equal(chiamate.wms.length, 2 + 2 + 2);
});

test('rimuovi toglie il servizio dai salvati e avvisa chi ascolta', () => {
  const { c, storage } = costruisci();
  let avvisi = 0;
  c.suCambio(() => { avvisi++; });
  c.aggiungiXyz({ nome: 'A', url: 'https://t.it/{z}/{x}/{y}.png' });
  c.rimuovi(c.stato().servizi[0].id);
  assert.equal(leggiServizi(storage).servizi.length, 0);
  assert.equal(avvisi, 2);
});

test('al 51° servizio il layer entra in mappa ma il servizio non si salva: pieno true', () => {
  const { c, chiamate } = costruisci();
  for (let i = 0; i < TETTO_SERVIZI; i++) c.aggiungiXyz({ nome: `T${i}`, url: `https://t${i}.it/{z}/{x}/{y}.png` });
  assert.deepEqual(c.aggiungiXyz({ nome: 'Extra', url: 'https://extra.it/{z}/{x}/{y}.png' }), { pieno: true });
  assert.equal(chiamate.tile.length, TETTO_SERVIZI + 1);
  assert.equal(c.stato().servizi.length, TETTO_SERVIZI);
});

test('storage bloccato: tutto funziona per la sessione senza eccezioni', () => {
  const rotto = { getItem() { throw new Error('x'); }, setItem() { throw new Error('y'); } };
  const { c, chiamate } = costruisci({ storage: rotto });
  assert.doesNotThrow(() => c.aggiungiXyz({ nome: 'A', url: 'https://t.it/{z}/{x}/{y}.png' }));
  assert.equal(chiamate.tile.length, 1);
  assert.equal(c.stato().servizi.length, 1);
});
```

- [ ] **Step 2: Verificare che fallisca** — `node --test tests/js/aggiungi-controllo.test.mjs`. Expected: FAIL (modulo mancante).

- [ ] **Step 3: Scrivere `js/aggiungi/controllo.js`**

```js
// js/aggiungi/controllo.js
// Logica del pannello «Aggiungi layer», senza DOM: legge i servizi, li aggiunge all'host e li ricorda.
import { BBOX_PALERMO } from '../rndt/area.js';
import { TETTO_WFS } from '../rndt/host.js';
import {
  capabilitiesWms, capabilitiesWfs, validaXyz, urlBase, urlCapabilities, urlGetFeature,
} from './servizi.js';
import { leggiServizi, salvaServizi, aggiungiServizio, rimuoviServizio } from './salvati.js';

const nomeDaUrl = url => new URL(url.replace(/[{}]/g, '')).hostname;
const messaggio = e => (e instanceof Error ? e.message : String(e));

export function creaControllo({ host, storage }) {
  let stato = leggiServizi(storage);
  const ascoltatori = new Set();
  const cambio = () => { for (const f of ascoltatori) f(); };

  // Ricorda il servizio; a tetto raggiunto (o storage bloccato) il layer resta in mappa e `pieno` lo dice.
  function memorizza(servizio) {
    const r = aggiungiServizio(stato, servizio);
    if (r.pieno) return { pieno: true };
    stato = r.stato;
    salvaServizi(storage, stato);
    cambio();
    return { pieno: false };
  }

  async function leggiServizio(tipo, urlUtente) {
    const url = urlBase(urlUtente);
    const testo = new TextDecoder().decode(await host.fetchArrayBuffer(urlCapabilities(urlUtente, tipo)));
    return { url, ...(tipo === 'wms' ? capabilitiesWms(testo) : capabilitiesWfs(testo)) };
  }

  function aggiungiXyz({ nome, url }) {
    const valido = validaXyz(url);
    const titolo = nome.trim() || nomeDaUrl(valido);
    host.addTileLayer(titolo, valido, {});
    return memorizza({ tipo: 'xyz', nome: titolo, url: valido });
  }

  function opzioniWms(servizio, layer) {
    return { url: servizio.url, layers: layer.nome, version: servizio.versione, format: servizio.formato, transparent: true, bounds: layer.bbox ?? undefined };
  }
  const richiestaWfs = (servizio, tipo) => urlGetFeature(servizio.url, { tipo: tipo.nome, versione: servizio.versione, bbox: BBOX_PALERMO, max: TETTO_WFS + 1 });

  async function aggiungiWms({ nome, url, servizio, scelti }) {
    const errori = [];
    const voci = [];
    for (const l of scelti) {
      if (l.supportato === false) { errori.push({ nome: l.titolo, messaggio: 'non offre EPSG:3857, la proiezione della mappa' }); continue; }
      try {
        const opz = opzioniWms(servizio, l);
        host.addWmsLayer(l.titolo, opz);
        voci.push({ chiave: l.nome, nome: l.titolo, opz });
      } catch (e) { errori.push({ nome: l.titolo, messaggio: messaggio(e) }); }
    }
    const r = voci.length ? memorizza({ tipo: 'wms', nome: nome.trim() || nomeDaUrl(url), url, voci }) : { pieno: false };
    return { ...r, errori };
  }

  async function aggiungiWfs({ nome, url, servizio, scelti }) {
    const errori = [];
    const voci = [];
    for (const t of scelti) {
      try {
        const richiesta = richiestaWfs(servizio, t);
        await host.addWfsLayer(t.titolo, richiesta);
        voci.push({ chiave: t.nome, nome: t.titolo, richiesta });
      } catch (e) { errori.push({ nome: t.titolo, messaggio: messaggio(e) }); }
    }
    const r = voci.length ? memorizza({ tipo: 'wfs', nome: nome.trim() || nomeDaUrl(url), url, voci }) : { pieno: false };
    return { ...r, errori };
  }

  // Un servizio salvato torna in mappa com'era, senza rileggere le capabilities.
  async function riaggiungi(id) {
    const s = stato.servizi.find(x => x.id === id);
    const errori = [];
    if (!s) return { errori };
    if (s.tipo === 'xyz') { host.addTileLayer(s.nome, s.url, {}); return { errori }; }
    for (const v of s.voci) {
      try {
        if (s.tipo === 'wms') host.addWmsLayer(v.nome, v.opz);
        else await host.addWfsLayer(v.nome, v.richiesta);
      } catch (e) { errori.push({ nome: v.nome, messaggio: messaggio(e) }); }
    }
    return { errori };
  }

  function rimuovi(id) {
    stato = rimuoviServizio(stato, id);
    salvaServizi(storage, stato);
    cambio();
  }

  return {
    stato: () => stato,
    suCambio(fn) { ascoltatori.add(fn); return () => ascoltatori.delete(fn); },
    leggiServizio, aggiungiXyz, aggiungiWms, aggiungiWfs, riaggiungi, rimuovi,
  };
}
```

- [ ] **Step 4: Verificare** — `node --test tests/js/aggiungi-controllo.test.mjs`. Expected: PASS. Se il test «aggiungiWms due volte» conta male le chiamate, ricordare che `host.addWmsLayer` finto non è idempotente (lo è quello vero): il conteggio atteso nel test è già quello del finto.

- [ ] **Step 5: Scrivere `js/aggiungi/pannello.js`** (DOM; si prova a mano nello Step 9)

```js
// js/aggiungi/pannello.js
// Pannello «Aggiungi layer»: albero con «I miei dati» (file) e «Servizi» (XYZ, WMS, WFS), ognuno col suo «＋» e l'elenco dei servizi salvati.
import { ESTENSIONI } from '../rndt/importa.js';
import { TETTO_SERVIZI } from './salvati.js';

const TIPI = [
  { id: 'xyz', titolo: 'XYZ', esempio: 'https://tile.example.org/{z}/{x}/{y}.png' },
  { id: 'wms', titolo: 'WMS', esempio: 'https://servizio.example.org/geoserver/ows' },
  { id: 'wfs', titolo: 'WFS', esempio: 'https://servizio.example.org/geoserver/ows' },
];

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}
function campo(etichetta, segnaposto, tipo = 'text') {
  const label = el('label', 'agg-campo');
  label.append(el('span', null, etichetta));
  const input = el('input');
  input.type = tipo;
  input.placeholder = segnaposto;
  input.autocomplete = 'off';
  input.spellcheck = false;
  label.append(input);
  return { label, input };
}
const bottone = (testo, classe = 'agg-bottone') => Object.assign(el('button', classe, testo), { type: 'button' });

export function creaPannello(elemento, controllo, { selezionaFile, avvisa }) {
  const testata = el('header', 'rndt-testata');
  testata.append(el('h2', null, 'Aggiungi layer'));
  const contenuto = el('div', 'rndt-contenuto agg-contenuto');
  elemento.append(testata, contenuto);

  const esito = (p, testo, errore = false) => { p.textContent = testo; p.dataset.errore = String(errore); p.hidden = !testo; };
  const nuovoEsito = () => Object.assign(el('p', 'agg-esito'), { hidden: true, role: 'status' });

  // «I miei dati»
  const dati = el('details', 'agg-sezione');
  dati.open = true;
  dati.append(el('summary', null, 'I miei dati'));
  const file = bottone('📁 Carica file dal computer', 'rndt-gruppo-aggiungi');
  file.title = `Formati: ${ESTENSIONI.join(' ')}`;
  file.addEventListener('click', selezionaFile);
  dati.append(file, el('p', 'agg-nota', 'GeoJSON, KML/KMZ, GPX, Shapefile (.zip) e CSV con latitudine e longitudine.'));

  // «Servizi»
  const servizi = el('details', 'agg-sezione');
  servizi.open = true;
  servizi.append(el('summary', null, 'Servizi'));
  const cerca = el('input', 'agg-cerca');
  cerca.type = 'search';
  cerca.placeholder = 'Cerca tra i servizi salvati…';
  cerca.setAttribute('aria-label', 'Cerca tra i servizi salvati');
  servizi.append(cerca);

  const rami = new Map();
  for (const tipo of TIPI) {
    const ramo = el('details', 'agg-ramo');
    const sommario = el('summary');
    const etichetta = el('span', null, tipo.titolo);
    const conteggio = el('span', 'agg-conteggio');
    const piu = bottone('＋', 'agg-piu');
    piu.title = `Aggiungi un servizio ${tipo.titolo}`;
    piu.setAttribute('aria-label', piu.title);
    sommario.append(etichetta, conteggio, piu);
    const modulo = creaModulo(tipo);
    modulo.hidden = true;
    const elenco = el('div', 'agg-elenco');
    ramo.append(sommario, modulo, elenco);
    piu.addEventListener('click', e => { e.preventDefault(); ramo.open = true; modulo.hidden = !modulo.hidden; if (!modulo.hidden) modulo.querySelector('input')?.focus(); });
    rami.set(tipo.id, { conteggio, elenco, ramo });
    servizi.append(ramo);
  }
  contenuto.append(dati, servizi);

  function creaModulo(tipo) {
    const form = el('form', 'agg-modulo');
    form.noValidate = true;
    const nome = campo('Nome (facoltativo)', 'Come lo chiami');
    const url = campo(tipo.id === 'xyz' ? 'Indirizzo con {z}/{x}/{y}' : 'Indirizzo del servizio', tipo.esempio, 'url');
    const esitoForm = nuovoEsito();
    form.append(nome.label, url.label);
    if (tipo.id === 'xyz') {
      const vai = bottone('Aggiungi', 'agg-bottone agg-primario');
      vai.type = 'submit';
      form.append(vai, esitoForm);
      form.addEventListener('submit', e => {
        e.preventDefault();
        try {
          const { pieno } = controllo.aggiungiXyz({ nome: nome.input.value, url: url.input.value });
          esito(esitoForm, pieno ? `Aggiunto alla mappa. Hai raggiunto il limite di ${TETTO_SERVIZI} servizi salvati: questo non si salva.` : 'Aggiunto alla mappa.');
          if (!pieno) { url.input.value = ''; nome.input.value = ''; }
        } catch (errore) { esito(esitoForm, errore.message, true); }
      });
      return form;
    }
    const leggi = bottone('Leggi il servizio', 'agg-bottone agg-primario');
    leggi.type = 'submit';
    const scelta = el('div', 'agg-scelta');
    scelta.hidden = true;
    form.append(leggi, esitoForm, scelta);
    form.addEventListener('submit', async e => {
      e.preventDefault();
      scelta.hidden = true;
      scelta.replaceChildren();
      esito(esitoForm, 'Leggo il servizio…');
      leggi.disabled = true;
      try {
        const servizio = await controllo.leggiServizio(tipo.id, url.input.value);
        esito(esitoForm, '');
        mostraScelta(tipo.id, scelta, servizio, nome.input, esitoForm);
      } catch (errore) { esito(esitoForm, `Non riesco a leggere il servizio: ${errore.message}`, true); } finally { leggi.disabled = false; }
    });
    return form;
  }

  function mostraScelta(tipo, scelta, servizio, nome, esitoForm) {
    const voci = tipo === 'wms' ? servizio.layer : servizio.tipi;
    const righe = voci.map(v => {
      const label = el('label', 'agg-voce');
      const casella = el('input');
      casella.type = 'checkbox';
      const nonSupportato = v.supportato === false;
      casella.disabled = nonSupportato;
      label.append(casella, ' ', v.titolo);
      if (nonSupportato) label.append(' ', el('em', null, '(non supportato: serve EPSG:3857)'));
      return { v, casella, label };
    });
    const vai = bottone('Aggiungi selezionati', 'agg-bottone agg-primario');
    scelta.append(...righe.map(r => r.label), vai);
    scelta.hidden = false;
    vai.addEventListener('click', async () => {
      const scelti = righe.filter(r => r.casella.checked).map(r => r.v);
      if (!scelti.length) return esito(esitoForm, 'Scegli almeno un elemento.', true);
      vai.disabled = true;
      esito(esitoForm, 'Aggiungo alla mappa…');
      const dati = { nome: nome.value, url: servizio.url, servizio, scelti };
      const r = await (tipo === 'wms' ? controllo.aggiungiWms(dati) : controllo.aggiungiWfs(dati));
      vai.disabled = false;
      riferisci(esitoForm, r, scelti.length);
    });
  }

  function riferisci(p, { pieno = false, errori = [] }, totale) {
    const ok = totale - errori.length;
    const parti = [];
    if (ok) parti.push(`${ok} ${ok === 1 ? 'layer aggiunto' : 'layer aggiunti'} alla mappa.`);
    if (pieno) parti.push(`Limite di ${TETTO_SERVIZI} servizi salvati raggiunto: questo non si salva.`);
    for (const e of errori) parti.push(`«${e.nome}»: ${e.messaggio}.`);
    esito(p, parti.join(' '), errori.length > 0 && !ok);
  }

  // elenco dei servizi salvati, filtrato dalla ricerca
  function disegna() {
    const testo = cerca.value.trim().toLowerCase();
    const { servizi: salvati } = controllo.stato();
    for (const tipo of TIPI) {
      const { conteggio, elenco } = rami.get(tipo.id);
      const suoi = salvati.filter(s => s.tipo === tipo.id);
      conteggio.textContent = suoi.length ? `(${suoi.length})` : '';
      const visibili = suoi.filter(s => !testo || `${s.nome} ${s.url}`.toLowerCase().includes(testo));
      elenco.replaceChildren(...visibili.map(s => {
        const riga = el('div', 'agg-salvato');
        const apri = bottone(s.nome, 'agg-salvato-nome');
        apri.title = `Rimetti in mappa — ${s.url}`;
        const esitoRiga = nuovoEsito();
        apri.addEventListener('click', async () => {
          apri.disabled = true;
          const { errori } = await controllo.riaggiungi(s.id);
          apri.disabled = false;
          if (errori.length) esito(esitoRiga, errori.map(e => `«${e.nome}»: ${e.messaggio}.`).join(' '), true);
          else avvisa(`«${s.nome}» è in mappa.`);
        });
        const togli = bottone('Rimuovi', 'rndt-rimuovi');
        togli.title = `Togli «${s.nome}» dai servizi salvati`;
        togli.addEventListener('click', () => controllo.rimuovi(s.id));
        riga.append(apri, togli, esitoRiga);
        return riga;
      }));
      if (testo && visibili.length) rami.get(tipo.id).ramo.open = true;
    }
  }
  cerca.addEventListener('input', disegna);
  controllo.suCambio(disegna);
  disegna();

  return {
    apri() { elemento.hidden = false; },
    chiudi() { elemento.hidden = true; },
  };
}
```

- [ ] **Step 6: Scrivere `js/aggiungi/index.js`**

```js
// js/aggiungi/index.js
// «Aggiungi layer»: assembla host (prefisso «miei», memoria propria), controllo, pannello e caricamento dei file.
import { creaHost } from '../rndt/host.js';
import { creaControllo } from './controllo.js';
import { creaPannello } from './pannello.js';
import { leggi, salva, CHIAVE_MIEI } from '../rndt/archivio.js';
import { anelliDaZone } from '../rndt/area.js';
import { importaFile, ESTENSIONI } from '../rndt/importa.js';
import { librerie } from '../rndt/librerie.js';
import { archivioIndexedDB } from '../rndt/dati.js';
import { PROXY_RNDT } from '../rndt/index.js';
import { urlDati } from '../core/config.js';
import { segnala } from '../core/pannello.js';

export function collegaAggiungi(map, elementoPannello, gruppo) {
  const storage = (() => { try { return window.localStorage; } catch { return null; } })();
  let anelli = [];
  // il confine comunale serve al filtro sui file e sui WFS; è lo stesso file delle zone, già in cache del browser
  const anelliPronti = fetch(urlDati('popolazione/confini_zone.json')).then(r => r.json()).then(z => { anelli = anelliDaZone(z); }).catch(() => {});

  const host = creaHost({
    map, proxy: PROXY_RNDT, prefisso: 'miei', etichetta: 'aggiunti', stato: leggi(storage, CHIAVE_MIEI),
    scrivi: s => salva(storage, s, CHIAVE_MIEI), anelli: () => anelli, notifica: segnala, archivioDati: archivioIndexedDB(),
  });
  const controllo = creaControllo({ host, storage });

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

  const selettore = Object.assign(document.createElement('input'), { type: 'file', multiple: true, accept: ESTENSIONI.join(','), hidden: true });
  selettore.addEventListener('change', async () => {
    const files = [...selettore.files];
    selettore.value = ''; // permette di riscegliere lo stesso file
    for (const file of files) await carica(file);
  });
  document.body.append(selettore);

  const pannello = creaPannello(elementoPannello, controllo, { selezionaFile: () => selettore.click(), avvisa: segnala });
  gruppo?.collega(host, pannello.apri, carica);

  return {
    apri: pannello.apri,
    chiudi: pannello.chiudi,
    async ripristina() { await anelliPronti; await host.ripristina(); },
  };
}
```
- [ ] **Step 7: Cablare `index.html`, `js/core/rail.js`, `js/app.js`**

- `index.html`: dopo `<aside id="rndt-pannello" …>` aggiungere `<aside id="aggiungi-pannello" hidden aria-label="Aggiungi layer"></aside>`; nella barra strumenti, subito dopo `btn-rndt`, un pulsante `btn-aggiungi` con `title="Aggiungi layer: file e servizi XYZ, WMS, WFS"`, `aria-label="Aggiungi layer"` e l'icona `library_add` (stesso markup SVG di `btn-rndt`, `path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"` con `fill="currentColor"`).
- `js/core/rail.js`: in `ICONE` aggiungere `aggiungi:` con lo stesso SVG di `library_add` (16×16, `fill="currentColor"`, come `scheda`).
- `js/app.js`:
  - import: `import { collegaAggiungi } from './aggiungi/index.js';`, `import { creaGruppo, creaGruppoRndt, OPZIONI_MIEI } from './rndt/gruppo.js';` (sostituisce l'import di `creaGruppoRndt`), `import { migraFileLocali } from './aggiungi/migrazione.js';`
  - riga 61: `if (!e.sourceId || /^(rndt|miei)-/.test(e.sourceId)) return; // gli errori dei layer RNDT e dei «miei layer» li segnalano gli host`
  - prima di creare i gruppi: `try { migraFileLocali(window.localStorage); } catch { /* storage bloccato: niente da spostare */ }`
  - gruppi: `const gruppoRndt = creaGruppoRndt(); const gruppoMiei = creaGruppo(OPZIONI_MIEI);` e `costruisciPannello(map, [...MODULI, gruppoRndt.modulo, gruppoMiei.modulo], …)`; stessa lista in `commutaCrediti(foglio, catalogo, [...])`.
  - dopo `const rndt = collegaRndt(...)`: `const aggiungi = collegaAggiungi(map, document.getElementById('aggiungi-pannello'), gruppoMiei);`
  - rail: nuova voce `{ id: 'aggiungi', etichetta: 'Aggiungi layer', pannello: document.getElementById('aggiungi-pannello'), apri: aggiungi.apri, chiudi: aggiungi.chiudi }` dopo quella di RNDT.
  - `document.getElementById('btn-aggiungi').addEventListener('click', () => rail.commuta('aggiungi'));`
  - ripristino: `aggiungi.ripristina();` **prima** di `rndt.ripristina();` (i layer del catalogo restano sopra).

- [ ] **Step 8: CSS** — `grep -n "rndt-pannello" css/*.css`; in ogni regola che cita `#rndt-pannello` (riga ~454 `body:has(…)`, righe ~807–809 posizione e `[hidden]`, e ogni `.collassato`) aggiungere lo stesso selettore per `#aggiungi-pannello` (stesso comportamento: fisso a destra, largo `--scheda-w`). Poi aggiungere in fondo allo stesso file:

```css
.agg-contenuto { padding: 8px 12px 16px; }
.agg-sezione { margin: 0 0 10px; }
.agg-sezione > summary, .agg-ramo > summary { cursor: pointer; font-weight: 700; display: flex; align-items: center; gap: 6px; }
.agg-ramo > summary span:first-child { flex: 1; }
.agg-conteggio { color: var(--text-muted); font-weight: 400; }
.agg-piu { flex: none; width: 28px; height: 28px; border: 1px solid var(--border-ui); border-radius: var(--r-pill); background: var(--surface); color: var(--link); font: inherit; font-weight: 700; cursor: pointer; }
.agg-piu:hover { background: var(--surface-hover); }
.agg-nota { margin: 6px 0 0; color: var(--text-muted); font-size: var(--fs-sm, 12px); }
.agg-cerca { width: 100%; margin: 6px 0; box-sizing: border-box; }
.agg-modulo { display: grid; gap: 8px; padding: 8px 0; }
.agg-campo { display: grid; gap: 2px; font-size: var(--fs-sm, 13px); }
.agg-campo input { width: 100%; box-sizing: border-box; }
.agg-bottone { padding: 6px 10px; border: 1px solid var(--border-ui); border-radius: var(--r-sm); background: var(--surface); color: inherit; font: inherit; cursor: pointer; }
.agg-primario { background: var(--link); color: #fff; border-color: transparent; font-weight: 600; }
.agg-bottone:disabled { opacity: .6; cursor: progress; }
.agg-esito { margin: 0; font-size: var(--fs-sm, 13px); }
.agg-esito[data-errore="true"] { color: var(--avviso-scheda-ink); }
.agg-scelta { display: grid; gap: 4px; max-height: 260px; overflow: auto; }
.agg-voce em { color: var(--text-muted); }
.agg-salvato { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px; padding: 3px 0; }
.agg-salvato-nome { flex: 1; min-width: 0; text-align: left; border: 0; background: none; color: var(--link); font: inherit; cursor: pointer; overflow-wrap: anywhere; }
.agg-salvato .agg-esito { flex-basis: 100%; }
```

- [ ] **Step 9: Verifica a mano nel browser** (server e proxy di sviluppo: `python3 scripts/serve.py 8000` e `cd worker && npx wrangler dev --port 8787`; app su `http://localhost:8000/?rndt-proxy=http://127.0.0.1:8787`). Usare Playwright/Chrome DevTools se disponibili, altrimenti a mano. Controllare, con la console aperta (nessun errore):
  1. Il pulsante «Aggiungi layer» apre il pannello a destra; il tab compare nella rail; «RNDT» e «Aggiungi layer» si alternano.
  2. XYZ: `https://tile.openstreetmap.org/{z}/{x}/{y}.png` → «Aggiunto alla mappa», layer nel gruppo «I miei layer»; un indirizzo senza `{z}` → errore in rosso, niente in mappa.
  3. WMS: un servizio pubblico con EPSG:3857 (es. `https://wms.pcn.minambiente.it/ogc?map=/ms_ogc/WMS_v1.3/raster/ortofoto_colore_12.map`) → elenco dei layer, spunta e aggiungi; i tile arrivano dal proxy (scheda Rete).
  4. WFS: un servizio pubblico con GeoJSON (GeoServer); se i dati risultano fuori posto (coordinate scambiate → «nessuna feature dentro il Comune di Palermo»), regolare `srsName`/asse del `bbox` in `urlGetFeature` per quella versione e aggiornare i test di `urlGetFeature`.
  5. Ricaricare la pagina: i layer tornano nel gruppo e i servizi nell'elenco; cliccando un servizio salvato torna in mappa; «Rimuovi» lo toglie dall'elenco.
  6. Carica un file GeoJSON dal pannello: appare in «I miei layer»; il gruppo RNDT non ha più il pulsante file; un file caricato prima (se presente in `dt:rndt:v1`) è passato a «I miei layer».
  7. Mobile (finestra stretta): il pannello è un foglio basso come RNDT.
  Annotare gli esiti nel messaggio di commit o nel report finale.

- [ ] **Step 10: Test completi** — `npm run test:js`. Expected: tutti passano.

- [ ] **Step 11: Commit**

```bash
git add js/aggiungi js/app.js js/core/rail.js index.html css tests/js/aggiungi-controllo.test.mjs
git commit -m "feat(aggiungi): pannello «Aggiungi layer» con file e servizi XYZ, WMS, WFS

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Documentazione e chiusura

**Files:**
- Create: `docs/AGGIUNGI_LAYER.md`
- Modify: `docs/RNDT.md`, `js/core/guida-contenuti.js` (solo se cita il pulsante file del gruppo RNDT), `README.md` (una riga nell'elenco dei documenti, se esiste)
- Test: `tests/js/guida.test.mjs` (deve restare verde: i passi con id `rndt-*` sono 3)

- [ ] **Step 1: `docs/AGGIUNGI_LAYER.md`** — scrivere: a cosa serve; come si apre (pulsante nella barra strumenti, tab nella rail destra); «I miei dati» (formati, tetto 5 MB per file, IndexedDB `dt-rndt`); servizi XYZ, WMS (solo EPSG:3857), WFS (GeoJSON, area di Palermo, massimo 5.000 elementi); servizi salvati (`dt:miei:servizi:v1`, tetto 50, clic per riaggiungere, «Rimuovi»); gruppo «I miei layer» (`dt:miei:v1`); limiti: Palermo, 100.000 richieste al giorno del Worker, i layer di questo pannello non si interrogano con il clic sulla mappa (lo fa solo il catalogo RNDT); il Worker va pubblicato prima dell'uso in produzione (rimando a `docs/RNDT.md`).

- [ ] **Step 2: `docs/RNDT.md`** — nel punto «Carica file dal computer (gruppo RNDT)» scrivere che ora sta nel pannello «Aggiungi layer» e nel gruppo «I miei layer», con rimando a `docs/AGGIUNGI_LAYER.md`; nel punto sui layer aggiunti precisare che i file dal computer non stanno più nel gruppo RNDT.

- [ ] **Step 3: Guida** — `grep -n "file\|computer" js/core/guida-contenuti.js`: se un passo `rndt-*` dice che i file si caricano dal gruppo RNDT, correggere il testo (senza cambiare id né numero di passi).

- [ ] **Step 4: Aggiornare il grafo e verificare tutto** — `graphify update .`; `npm run test:js`; `python3 -m pytest -q` (la suite Python non dovrebbe essere toccata).

- [ ] **Step 5: Commit**

```bash
git add docs README.md js/core/guida-contenuti.js graphify-out
git commit -m "docs(aggiungi): guida al pannello Aggiungi layer

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Self-review (spec ↔ piano)

- **Pannello con I miei dati / Servizi / XYZ, WMS, WFS con «＋», ricerca, salvati con clic, rimozione, nessun Recenti:** Task 6 (`pannello.js`, `controllo.js`).
- **Tab nella rail destra e pulsante nella barra strumenti:** Task 6 Step 7.
- **Secondo host con memoria separata, prefisso, etichetta:** Task 1 (chiave), Task 3 (host), Task 6 (`collegaAggiungi`).
- **Gruppo «I miei layer» e «Carica file» fuori da RNDT:** Task 5.
- **`addWfsLayer` con URL completo, tetto, bbox, filtro sul confine, salvataggio con URL:** Task 3 + Task 2 (`urlGetFeature`) + Task 6 (`controllo`).
- **Limite di Palermo per XYZ/WMS (bounds) e WFS (bbox + confine):** riuso di `creaTile`/`creaWms`/`creaGeoJson`; `urlGetFeature` con `BBOX_PALERMO`.
- **Tetto 50 servizi, `localStorage` bloccato:** Task 1, Task 6 (test «51° servizio», «storage bloccato»).
- **Migrazione senza marcatore, reversibile:** Task 4.
- **Errori in chiaro, test, documentazione:** Task 2, 3, 6, 7.
- **Tipi e firme coerenti:** `voci` con `chiave`; WMS `{ chiave, nome, opz }`, WFS `{ chiave, nome, richiesta }` — usati allo stesso modo in `controllo.js` e nei test; `creaGruppo(opzioni)`/`OPZIONI_MIEI` in Task 5 e Task 6; `creaHost({ prefisso, etichetta })` in Task 3 e Task 6.
- **Rischio noto:** ordine degli assi del `bbox` WFS ≥ 1.1.0 e `srsName`; si verifica nello Step 9.4 del Task 6 con un servizio reale.
