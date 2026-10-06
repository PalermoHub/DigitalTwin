# WMTS e ArcGIS REST Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere ai servizi dell'albero «I miei layer» il WMTS e l'ArcGIS REST (MapServer e FeatureServer, come immagini e come dati), con il token ArcGIS incollato nell'indirizzo trattato come credenziale di sessione.

**Architecture:** Due moduli puri nuovi (`wmts.js`, `arcgis.js`) leggono i documenti dei servizi e costruiscono gli URL. Il WMTS e le immagini ArcGIS diventano normali layer raster XYZ (`host.addTileLayer`); i dati ArcGIS riusano `host.addWfsLayer` (GeoJSON da URL). Il token vive in `credenziali.js` (memoria) e si aggiunge alle richieste a runtime: mai negli URL salvati.

**Tech Stack:** JavaScript ES module senza build, MapLibre GL 4.7.1, `node --test` (`npm run test:js`).

**Spec:** `docs/superpowers/specs/2026-10-06-aggiungi-layer-design.md` (Revisione 3). Si appoggia ai piani già eseguiti `2026-10-06-aggiungi-layer.md` e `2026-10-06-aggiungi-layer-albero.md`.

## Global Constraints

- Italiano ovunque (interfaccia, messaggi, commenti), accenti corretti.
- Nessuna libreria nuova, nessun build.
- **Token e password non si scrivono mai** in `localStorage`, IndexedDB, URL salvati, log o messaggi di errore. Nei layer e nei servizi salvati gli URL non contengono `token=`.
- Solo https; limite di Palermo; tetto 5.000 elementi (`TETTO_WFS`); 50 servizi salvati; solo Basic per utente e password (nessuna generazione di token).
- Segnaposto negli URL (`{z}`, `{x}`, `{y}`, `{bbox-epsg-3857}`) mai codificati: gli URL con segnaposto si costruiscono per concatenazione, non con `URLSearchParams`.
- Dati troncati mai in silenzio: un servizio che tronca la risposta dà errore.
- Dopo le modifiche: `graphify update .`.

## Review Focus

- Un layer WMTS con TileMatrixSet non compatibile (altro CRS, identificatori non numerici, tile non 256) compare «non supportato» e non si aggiunge. (Task 2)
- Un `ResourceURL` con dimensioni (`{Time}`) o segnaposto sconosciuti non deve produrre un URL con graffe residue. (Task 2)
- ArcGIS risponde `200` con `{"error":…}` (token mancante o scaduto, servizio non trovato): messaggio in chiaro, non «risposta non valida». (Task 3, Task 5)
- ArcGIS tronca la risposta (`exceededTransferLimit`): errore, mai dati parziali. (Task 4)
- Il token incollato nell'indirizzo non finisce in `localStorage` né negli URL salvati; alla riapertura il servizio ha il lucchetto. (Task 1, Task 5)
- Il token si aggiunge a ogni richiesta dell'host (capabilities, query, tile) e non a richieste verso altri host. (Task 1, Task 6)

---

## File Structure

| File | Azione | Responsabilità |
|---|---|---|
| `js/aggiungi/credenziali.js` | modifica | token in memoria per host; `conToken(url)`; riscrittura degli URL dei tile |
| `js/aggiungi/salvati.js` | modifica | tipi `wmts` e `arcgis`; segno `conToken` |
| `js/aggiungi/servizi.js` | modifica | esporta gli aiutanti XML (`figli`, `primo`, `testoDi`, `erroreDelServizio`) |
| `js/aggiungi/wmts.js` | nuovo | puro: capabilities WMTS → layer con URL XYZ |
| `js/aggiungi/arcgis.js` | nuovo | puro: indirizzo, descrizione JSON e URL (export, tile, query) di ArcGIS REST |
| `js/rndt/host.js` | modifica | `riscrivi(url)`; `exceededTransferLimit` in `addWfsLayer` |
| `js/aggiungi/controllo.js` | modifica | `leggiServizio` per wmts/arcgis; `aggiungiWmts`, `aggiungiArcgis`; token; `riaggiungi` per forma della voce |
| `js/aggiungi/albero.js`, `js/aggiungi/index.js` | modifica | due rami nuovi, «Mostra come» per ArcGIS, token ai tile |
| `docs/AGGIUNGI_LAYER.md`, `js/core/guida-contenuti.js` | modifica | documentazione |
| `tests/js/aggiungi-wmts.test.mjs`, `aggiungi-arcgis.test.mjs` (nuovi); `aggiungi-credenziali`, `aggiungi-salvati`, `aggiungi-host`, `aggiungi-controllo` | test |

---

### Task 1: Token in memoria e nuovi tipi salvati

**Files:**
- Modify: `js/aggiungi/credenziali.js`, `js/aggiungi/salvati.js`
- Test: `tests/js/aggiungi-credenziali.test.mjs`, `tests/js/aggiungi-salvati.test.mjs`

**Interfaces:**
- Produces:
  - `credenziali`: `impostaToken(host, valore)` (lancia `Error('manca il token')` se vuoto), `token(host) → string|null`, `ha(host)` (vero con utente **o** token), `togli(host)` (toglie entrambi), `conToken(url) → string` (aggiunge `token=<valore>` per concatenazione se l'host ha un token e l'URL non ne ha già uno), `riscriviPerProxy(proxy, url) → string` (come `conToken`, ma per un URL `<proxy>/t/<host>/…`; l'host è quello del percorso).
  - `salvati`: `TIPI = ['xyz','wms','wfs','wmts','arcgis']`; `aggiungiServizio(stato, { …, conToken })` conserva `conToken: true` (e non lo cancella riaggiungendo senza).

- [ ] **Step 1: Test** — in coda a `tests/js/aggiungi-credenziali.test.mjs`:

```js
test('token: in memoria per host, ha() lo riconosce, togli() lo dimentica', () => {
  const c = creaCredenziali();
  assert.equal(c.token('a.it'), null);
  c.impostaToken('a.it', 'abc123');
  assert.equal(c.token('a.it'), 'abc123');
  assert.equal(c.ha('a.it'), true);
  assert.equal(c.ha('b.it'), false);
  c.togli('a.it');
  assert.equal(c.ha('a.it'), false);
  assert.throws(() => c.impostaToken('a.it', ''), /manca il token/);
});

test('conToken aggiunge token= per concatenazione, senza toccare i segnaposto né altri host', () => {
  const c = creaCredenziali();
  c.impostaToken('a.it', 'a b&c');
  assert.equal(c.conToken('https://a.it/x/MapServer?f=json'), 'https://a.it/x/MapServer?f=json&token=a%20b%26c');
  assert.equal(c.conToken('https://a.it/x/tile/{z}/{y}/{x}'), 'https://a.it/x/tile/{z}/{y}/{x}?token=a%20b%26c');
  assert.equal(c.conToken('https://a.it/x?token=gia'), 'https://a.it/x?token=gia');
  assert.equal(c.conToken('https://b.it/x'), 'https://b.it/x');
});

test('riscriviPerProxy: il token si aggiunge solo alle richieste al proxy per quell’host', () => {
  const c = creaCredenziali();
  c.impostaToken('a.it', 't');
  assert.equal(c.riscriviPerProxy('https://p.test', 'https://p.test/t/a.it/x/{z}/{y}/{x}'), 'https://p.test/t/a.it/x/{z}/{y}/{x}?token=t');
  assert.equal(c.riscriviPerProxy('https://p.test', 'https://p.test/t/b.it/x'), 'https://p.test/t/b.it/x');
  assert.equal(c.riscriviPerProxy('https://p.test', 'https://a.it/x'), 'https://a.it/x');
});
```

- [ ] **Step 2: Verificare che fallisca** — `node --test tests/js/aggiungi-credenziali.test.mjs`. Expected: FAIL (`impostaToken` non esiste).

- [ ] **Step 3: Modificare `js/aggiungi/credenziali.js`**

Dentro `creaCredenziali`, accanto a `mappa`: `const tokens = new Map(); // host → token (ArcGIS)`. Estrarre l'host di un URL del proxy in una funzione e riusarla in `perUrlProxy`:

```js
  // `<proxy>/t/<host>/…` → host, altrimenti null
  const ospiteDaProxy = (proxy, url) => {
    const base = `${String(proxy).replace(/\/$/, '')}/t/`;
    if (!String(url).startsWith(base)) return null;
    try { return decodeURIComponent(String(url).slice(base.length).split(/[/?#]/)[0]); } catch { return null; }
  };
  // il token si aggiunge per concatenazione: i segnaposto {z} {x} {y} devono restare com'erano
  const aggiungiToken = (url, token) => (!token || /[?&]token=/i.test(url) ? url : `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`);
```
Sostituire `ha`, `togli`, `perUrlProxy` e aggiungere i nuovi metodi:

```js
    impostaToken(host, valore) {
      if (!valore) throw new Error('manca il token');
      tokens.set(host, valore);
    },
    token: host => tokens.get(host) ?? null,
    ha: host => mappa.has(host) || tokens.has(host),
    togli: host => { mappa.delete(host); tokens.delete(host); },
    conToken: url => aggiungiToken(url, tokens.get(ospiteDi(url))),
    riscriviPerProxy: (proxy, url) => aggiungiToken(url, tokens.get(ospiteDaProxy(proxy, url))),
    perUrlProxy(proxy, url) {
      const host = ospiteDaProxy(proxy, url);
      return host === null ? null : mappa.get(host)?.intestazione ?? null;
    },
```
(`ospiteDi` e `utente`/`intestazione`/`imposta` restano come sono.)

- [ ] **Step 4: Verificare** — `node --test tests/js/aggiungi-credenziali.test.mjs`. Expected: PASS (anche i test precedenti).

- [ ] **Step 5: Test dei salvati** — in coda a `tests/js/aggiungi-salvati.test.mjs`:

```js
test('i tipi wmts e arcgis sono validi; conToken si conserva e non si perde riaggiungendo', () => {
  const a = { tipo: 'arcgis', nome: 'Strade', url: 'https://x.it/arcgis/rest/services/S/MapServer', conToken: true, voci: [{ chiave: '0', nome: 'L0', tile: 'https://x.it/t/{z}/{y}/{x}' }] };
  const { stato } = aggiungiServizio(vuoto, a);
  assert.equal(stato.servizi[0].conToken, true);
  assert.equal('utente' in stato.servizi[0], false);
  assert.equal(aggiungiServizio(stato, { ...a, conToken: undefined }).stato.servizi[0].conToken, true);
  const s = finto();
  assert.equal(salvaServizi(s, stato), true);
  assert.equal(leggiServizi(s).servizi.length, 1);
  const w = aggiungiServizio(vuoto, { tipo: 'wmts', nome: 'W', url: 'https://w.it/wmts', voci: [] }).stato;
  salvaServizi(s, w);
  assert.equal(leggiServizi(s).servizi[0].tipo, 'wmts');
});
```
(`finto` e `vuoto` esistono nel file.)

- [ ] **Step 6: Modificare `js/aggiungi/salvati.js`** — `const TIPI = ['xyz', 'wms', 'wfs', 'wmts', 'arcgis'];`; in `aggiungiServizio` aggiungere `conToken` ai parametri e al nuovo oggetto:

```js
export function aggiungiServizio(stato, { tipo, nome, url, utente, conToken, voci = [] }) {
  …
  const nomeUtente = utente || presente?.utente;
  const serveToken = conToken || presente?.conToken;
  const nuovo = { id, tipo, nome: presente?.nome ?? nome, url, ...(nomeUtente ? { utente: nomeUtente } : {}), ...(serveToken ? { conToken: true } : {}), voci: [...unite.values()] };
```

- [ ] **Step 7: Verificare** — `npm run test:js`. Expected: tutto passa.

- [ ] **Step 8: Commit**

```bash
git add js/aggiungi/credenziali.js js/aggiungi/salvati.js tests/js/aggiungi-credenziali.test.mjs tests/js/aggiungi-salvati.test.mjs
git commit -m "feat(aggiungi): token in memoria e tipi wmts/arcgis tra i servizi salvati

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Lettura del WMTS (`wmts.js`, puro)

**Files:**
- Modify: `js/aggiungi/servizi.js` (esporta gli aiutanti)
- Create: `js/aggiungi/wmts.js`
- Test: `tests/js/aggiungi-wmts.test.mjs`

**Interfaces:**
- Consumes: `leggiXml`, `urlBase`, `urlCapabilities` e (da esportare) `figli`, `primo`, `testoDi`, `erroreDelServizio` da `servizi.js`.
- Produces: `capabilitiesWmts(testo, urlServizio) → { versione, layer: [{ nome, titolo, bbox: [w,s,e,n]|null, supportato: boolean, tile: string|null }] }` (`tile` = URL XYZ con `{z}`, `{x}`, `{y}`). `prefissoWebMercator(insieme) → string|null` (esportata, per i test).

- [ ] **Step 1: Esportare gli aiutanti** — in `js/aggiungi/servizi.js` cambiare `const figli = …`, `const primo = …`, `const testoDi = …` e `function erroreDelServizio` in `export const figli`, `export const primo`, `export const testoDi`, `export function erroreDelServizio` (nessun'altra modifica).

- [ ] **Step 2: Test**

```js
// tests/js/aggiungi-wmts.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { capabilitiesWmts, prefissoWebMercator } from '../../js/aggiungi/wmts.js';
import { leggiXml, primo, figli } from '../../js/aggiungi/servizi.js';

const MATRICI = (prefisso, n, extra = '') => Array.from({ length: n }, (_, i) =>
  `<TileMatrix><ows:Identifier>${prefisso}${i}</ows:Identifier><ScaleDenominator>${559082264.0287178 / 2 ** i}</ScaleDenominator><TopLeftCorner>-20037508.342789244 20037508.342789244</TopLeftCorner><TileWidth>256</TileWidth><TileHeight>256</TileHeight><MatrixWidth>${2 ** i}</MatrixWidth><MatrixHeight>${2 ** i}</MatrixHeight>${extra}</TileMatrix>`).join('');
const INSIEME = (id, crs, matrici) => `<TileMatrixSet><ows:Identifier>${id}</ows:Identifier><ows:SupportedCRS>${crs}</ows:SupportedCRS>${matrici}</TileMatrixSet>`;
const WMTS_REST = `<?xml version="1.0"?>
<Capabilities xmlns="http://www.opengis.net/wmts/1.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.0.0">
 <ows:ServiceIdentification><ows:ServiceType>OGC WMTS</ows:ServiceType></ows:ServiceIdentification>
 <ows:OperationsMetadata><ows:Operation name="GetTile"><ows:DCP><ows:HTTP><ows:Get xlink:href="https://w.example.org/wmts?"/></ows:HTTP></ows:DCP></ows:Operation></ows:OperationsMetadata>
 <Contents>
  <Layer>
   <ows:Title>Ortofoto &amp; co</ows:Title><ows:Identifier>orto</ows:Identifier>
   <ows:WGS84BoundingBox><ows:LowerCorner>12 37</ows:LowerCorner><ows:UpperCorner>14 39</ows:UpperCorner></ows:WGS84BoundingBox>
   <Style isDefault="true"><ows:Identifier>normale</ows:Identifier></Style>
   <Format>image/jpeg</Format><Format>image/png</Format>
   <TileMatrixSetLink><TileMatrixSet>GoogleMapsCompatible</TileMatrixSet></TileMatrixSetLink>
   <ResourceURL format="image/png" resourceType="tile" template="https://w.example.org/orto/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png"/>
  </Layer>
  <Layer>
   <ows:Title>Solo UTM</ows:Title><ows:Identifier>utm</ows:Identifier>
   <Format>image/png</Format>
   <TileMatrixSetLink><TileMatrixSet>UTM</TileMatrixSet></TileMatrixSetLink>
  </Layer>
  ${INSIEME('GoogleMapsCompatible', 'urn:ogc:def:crs:EPSG:6.18:3:3857', MATRICI('', 4))}
  ${INSIEME('UTM', 'urn:ogc:def:crs:EPSG::32633', MATRICI('UTM:', 4))}
 </Contents>
</Capabilities>`;

const WMTS_KVP = `<Capabilities version="1.0.0"><ServiceIdentification><ServiceType>OGC WMTS</ServiceType></ServiceIdentification>
<Contents><Layer><Title>Base</Title><Identifier>base</Identifier><Format>image/png</Format>
<TileMatrixSetLink><TileMatrixSet>web</TileMatrixSet></TileMatrixSetLink></Layer>
${INSIEME('web', 'EPSG:3857', MATRICI('EPSG:3857:', 3))}</Contents></Capabilities>`;

test('prefissoWebMercator: identificatori numerici o con prefisso, in ordine di scala', () => {
  const nodo = x => primo(leggiXml(`<Contents xmlns:ows="x">${x}</Contents>`), 'TileMatrixSet');
  assert.equal(prefissoWebMercator(nodo(INSIEME('a', 'EPSG:3857', MATRICI('', 3)))), '');
  assert.equal(prefissoWebMercator(nodo(INSIEME('a', 'urn:ogc:def:crs:EPSG::3857', MATRICI('EPSG:3857:', 3)))), 'EPSG:3857:');
  assert.equal(prefissoWebMercator(nodo(INSIEME('a', 'EPSG:900913', MATRICI('wm', 2)))), 'wm');
});

test('prefissoWebMercator: altro CRS, tile non 256, origine diversa, id non coincidenti con il livello → null', () => {
  const nodo = x => primo(leggiXml(`<Contents xmlns:ows="x">${x}</Contents>`), 'TileMatrixSet');
  assert.equal(prefissoWebMercator(nodo(INSIEME('a', 'EPSG:32633', MATRICI('', 3)))), null);
  assert.equal(prefissoWebMercator(nodo(INSIEME('a', 'EPSG:3857', MATRICI('', 3).replaceAll('<TileWidth>256', '<TileWidth>512')))), null);
  assert.equal(prefissoWebMercator(nodo(INSIEME('a', 'EPSG:3857', MATRICI('', 3).replaceAll('-20037508.342789244 20037508', '0 20037508')))), null);
  assert.equal(prefissoWebMercator(nodo(INSIEME('a', 'EPSG:3857', MATRICI('', 3).replace('<ows:Identifier>1<', '<ows:Identifier>7<')))), null);
  assert.equal(prefissoWebMercator(nodo(INSIEME('a', 'EPSG:3857', MATRICI('l', 3).replaceAll('l1', 'l01')))), null);
  assert.equal(prefissoWebMercator(undefined), null);
});

test('WMTS REST: URL XYZ dal ResourceURL, stile e matrici sostituiti, bbox e titolo', () => {
  const c = capabilitiesWmts(WMTS_REST, 'https://w.example.org/wmts');
  assert.equal(c.versione, '1.0.0');
  assert.deepEqual(c.layer[0], {
    nome: 'orto', titolo: 'Ortofoto & co', bbox: [12, 37, 14, 39], supportato: true,
    tile: 'https://w.example.org/orto/normale/GoogleMapsCompatible/{z}/{y}/{x}.png',
  });
});

test('WMTS: un layer con soli insiemi non compatibili è «non supportato» e senza URL', () => {
  const c = capabilitiesWmts(WMTS_REST, 'https://w.example.org/wmts');
  assert.deepEqual(c.layer[1], { nome: 'utm', titolo: 'Solo UTM', bbox: null, supportato: false, tile: null });
});

test('WMTS KVP: GetTile costruito sull’indirizzo del servizio, segnaposto intatti, prefisso nella matrice', () => {
  const c = capabilitiesWmts(WMTS_KVP, 'https://k.example.org/ows?map=a&SERVICE=WMTS&REQUEST=GetCapabilities');
  const t = c.layer[0].tile;
  assert.ok(t.startsWith('https://k.example.org/ows?map=a&SERVICE=WMTS&'), t);
  assert.match(t, /REQUEST=GetTile/);
  assert.match(t, /LAYER=base/);
  assert.match(t, /TILEMATRIXSET=web/);
  assert.match(t, /FORMAT=image%2Fpng/);
  assert.ok(t.endsWith('&TILEMATRIX=EPSG%3A3857%3A{z}&TILEROW={y}&TILECOL={x}'), t);
});

test('WMTS: ResourceURL con dimensione sconosciuta o segnaposto ignoto → non supportato, mai graffe residue', () => {
  const x = WMTS_REST.replace('{TileCol}.png', '{TileCol}.png?t={Time}');
  const c = capabilitiesWmts(x, 'https://w.example.org/wmts');
  assert.equal(c.layer[0].supportato, false);
  assert.equal(c.layer[0].tile, null);
  const conDefault = WMTS_REST.replace('{TileCol}.png', '{TileCol}.png?t={Time}').replace('<Format>image/jpeg</Format>',
    '<Dimension><ows:Identifier>Time</ows:Identifier><Default>2024</Default></Dimension><Format>image/jpeg</Format>');
  assert.match(capabilitiesWmts(conDefault, 'https://w.example.org/wmts').layer[0].tile, /\.png\?t=2024$/);
});

test('WMTS: eccezioni, documenti non WMTS e servizi senza layer → errori in chiaro', () => {
  assert.throws(() => capabilitiesWmts('<ows:ExceptionReport><ows:Exception><ows:ExceptionText>Servizio spento</ows:ExceptionText></ows:Exception></ows:ExceptionReport>', 'https://w.it/x'), /Servizio spento/);
  assert.throws(() => capabilitiesWmts('<html></html>', 'https://w.it/x'), /non è un servizio WMTS/);
  assert.throws(() => capabilitiesWmts('<WMS_Capabilities version="1.3.0"/>', 'https://w.it/x'), /non è un servizio WMTS/);
  assert.throws(() => capabilitiesWmts('<Capabilities><ServiceIdentification><ServiceType>OGC WMTS</ServiceType></ServiceIdentification><Contents/></Capabilities>', 'https://w.it/x'), /nessun layer/);
});
```

- [ ] **Step 3: Verificare che fallisca** — `node --test tests/js/aggiungi-wmts.test.mjs`. Expected: FAIL (modulo mancante).

- [ ] **Step 4: Scrivere `js/aggiungi/wmts.js`**

```js
// js/aggiungi/wmts.js
// WMTS: le capabilities diventano layer con un URL XYZ. Si accetta solo la piramide «Google Maps» (EPSG:3857, tile 256,
// origine in alto a sinistra) perché è quella che MapLibre sa disegnare coi suoi tile XYZ.
// Moduli puri, senza DOM né rete.
import { leggiXml, figli, primo, testoDi, erroreDelServizio, urlBase } from './servizi.js';

const ORIGINE = 20037508.342789244;
const CRS_WEB = /(3857|900913|102100|102113)(?!\d)/;

const numeri = testo => String(testo ?? '').trim().split(/\s+/).map(Number);

// Il prefisso degli identificatori di matrice (es. «», «EPSG:3857:», «wm») se l'insieme è una piramide Web Mercator
// compatibile con lo schema XYZ (identificatore = prefisso + livello, livelli 0, 1, 2… in ordine di scala), altrimenti null.
export function prefissoWebMercator(insieme) {
  if (!insieme || !CRS_WEB.test(testoDi(insieme, 'SupportedCRS'))) return null;
  const matrici = [...figli(insieme, 'TileMatrix')].sort((a, b) => parseFloat(testoDi(b, 'ScaleDenominator')) - parseFloat(testoDi(a, 'ScaleDenominator')));
  if (!matrici.length) return null;
  let prefisso = null;
  for (let i = 0; i < matrici.length; i++) {
    const m = matrici[i];
    const [x, y] = numeri(testoDi(m, 'TopLeftCorner'));
    if (Number(testoDi(m, 'TileWidth')) !== 256 || Number(testoDi(m, 'TileHeight')) !== 256) return null;
    if (Math.abs(x + ORIGINE) > 2 || Math.abs(y - ORIGINE) > 2) return null;
    if (i === 0 && (Number(testoDi(m, 'MatrixWidth')) !== 1 || Number(testoDi(m, 'MatrixHeight')) !== 1)) return null;
    const id = testoDi(m, 'Identifier').match(/^(.*?)(\d+)$/);
    if (!id || id[2] !== String(i)) return null; // «01» o un livello che non coincide con la posizione: non si può scrivere come {z}
    if (prefisso === null) prefisso = id[1];
    else if (prefisso !== id[1]) return null;
  }
  return prefisso;
}

function bboxWgs84(n) {
  if (!n) return null;
  const v = [...numeri(testoDi(n, 'LowerCorner')), ...numeri(testoDi(n, 'UpperCorner'))];
  return v.length === 4 && v.every(Number.isFinite) ? v : null;
}

// l'indirizzo dell'operazione GetTile, se è https e dello stesso host del servizio (altrimenti quello del servizio)
function baseGetTile(radice, urlServizio) {
  const servizio = urlBase(urlServizio);
  const operazione = figli(primo(radice, 'OperationsMetadata'), 'Operation').find(o => o.attr.name === 'GetTile');
  const get = primo(primo(primo(operazione, 'DCP'), 'HTTP'), 'Get');
  try {
    const href = new URL(get?.attr.href);
    if (href.protocol === 'https:' && href.host === new URL(servizio).host) return urlBase(href.href);
  } catch { /* nessun GetTile utilizzabile */ }
  return servizio;
}

const graffe = /\{([^}]+)\}/g;

function descriviLayer(n, insiemi, base) {
  const nome = testoDi(n, 'Identifier');
  if (!nome) return null;
  const titolo = testoDi(n, 'Title') || nome;
  const bbox = bboxWgs84(primo(n, 'WGS84BoundingBox'));
  const nonSupportato = { nome, titolo, bbox, supportato: false, tile: null };

  const formati = figli(n, 'Format').map(f => f.testo.trim()).filter(f => f.startsWith('image/'));
  const formato = formati.includes('image/png') ? 'image/png' : formati[0] ?? 'image/png';
  const stili = figli(n, 'Style');
  const stile = testoDi(stili.find(s => s.attr.isDefault === 'true') ?? stili[0], 'Identifier') || 'default';
  const scelta = figli(n, 'TileMatrixSetLink').map(l => testoDi(l, 'TileMatrixSet'))
    .map(id => ({ id, prefisso: prefissoWebMercator(insiemi.get(id)) })).find(x => x.prefisso !== null);
  if (!scelta) return nonSupportato;
  const matrice = `${scelta.prefisso}{z}`;

  const risorsa = figli(n, 'ResourceURL').find(r => r.attr.resourceType === 'tile' && r.attr.format === formato)
    ?? figli(n, 'ResourceURL').find(r => r.attr.resourceType === 'tile');
  if (risorsa?.attr.template) {
    const dimensioni = new Map(figli(n, 'Dimension').map(d => [testoDi(d, 'Identifier'), testoDi(d, 'Default')]));
    const noti = { Style: stile, TileMatrixSet: scelta.id, TileMatrix: matrice, TileRow: '{y}', TileCol: '{x}' };
    let sconosciuto = false;
    const tile = risorsa.attr.template.replace(graffe, (m, k) => {
      if (k in noti) return noti[k];
      if (dimensioni.get(k)) return dimensioni.get(k);
      sconosciuto = true;
      return m;
    });
    return sconosciuto ? nonSupportato : { nome, titolo, bbox, supportato: true, tile };
  }
  // senza ResourceURL: GetTile in KVP, con i segnaposto scritti a mano (URLSearchParams li codificherebbe)
  const u = new URL(base);
  for (const [k, v] of [['SERVICE', 'WMTS'], ['REQUEST', 'GetTile'], ['VERSION', '1.0.0'], ['LAYER', nome], ['STYLE', stile], ['TILEMATRIXSET', scelta.id], ['FORMAT', formato]]) u.searchParams.set(k, v);
  return { nome, titolo, bbox, supportato: true, tile: `${u}&TILEMATRIX=${encodeURIComponent(scelta.prefisso)}{z}&TILEROW={y}&TILECOL={x}` };
}

export function capabilitiesWmts(testo, urlServizio) {
  const radice = leggiXml(testo);
  const errore = erroreDelServizio(radice);
  if (errore) throw new Error(errore);
  if (radice.nome !== 'Capabilities' || !/WMTS/i.test(testoDi(primo(radice, 'ServiceIdentification'), 'ServiceType'))) throw new Error('l’indirizzo non è un servizio WMTS');
  const contenuti = primo(radice, 'Contents');
  const insiemi = new Map(figli(contenuti, 'TileMatrixSet').map(s => [testoDi(s, 'Identifier'), s]));
  const base = baseGetTile(radice, urlServizio);
  const layer = figli(contenuti, 'Layer').map(n => descriviLayer(n, insiemi, base)).filter(Boolean);
  if (!layer.length) throw new Error('il servizio non ha nessun layer');
  return { versione: radice.attr.version ?? '1.0.0', layer };
}
```
- [ ] **Step 5: Verificare** — `node --test tests/js/aggiungi-wmts.test.mjs tests/js/aggiungi-servizi.test.mjs`. Expected: PASS. Punti da controllare se un test fallisce: `urlBase` rimuove `service/request/version` dall'indirizzo del GetTile (voluto: il KVP li reimposta); nel caso KVP del test l'indirizzo `https://k.example.org/ows?map=a&SERVICE=WMTS&REQUEST=GetCapabilities` deve diventare `https://k.example.org/ows?map=a&SERVICE=WMTS&REQUEST=GetTile&…` (l'ordine dei parametri: `map` resta, gli altri sono impostati in coda nell'ordine del ciclo).

- [ ] **Step 6: Commit**

```bash
git add js/aggiungi/servizi.js js/aggiungi/wmts.js tests/js/aggiungi-wmts.test.mjs
git commit -m "feat(aggiungi): lettura delle capabilities WMTS

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Lettura di ArcGIS REST (`arcgis.js`, puro)

**Files:**
- Create: `js/aggiungi/arcgis.js`
- Test: `tests/js/aggiungi-arcgis.test.mjs`

**Interfaces:**
- Produces:
  - `leggiUrlArcgis(testo) → { base, tipo: 'MapServer'|'FeatureServer', layerId: number|null, token: string|null }` (`base` senza query, `token`/`f` tolti; lancia `Error` in italiano)
  - `urlInfo(p) → string` (`<base>[/<id>]?f=json`)
  - `descriviArcgis(json, p) → { tipo, cache: boolean, layer: [{ id, nome, vettoriale }] }`; lancia con il messaggio del servizio se `json.error`
  - `urlExport(base, id) → string`, `urlTileCache(base) → string`, `urlQuery(base, id, bbox, max) → string`

- [ ] **Step 1: Test**

```js
// tests/js/aggiungi-arcgis.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { leggiUrlArcgis, urlInfo, descriviArcgis, urlExport, urlTileCache, urlQuery } from '../../js/aggiungi/arcgis.js';

const MAP = 'https://x.it/arcgis/rest/services/Cat/Strade/MapServer';

test('leggiUrlArcgis: servizio, layer singolo, token e f tolti dall’indirizzo', () => {
  assert.deepEqual(leggiUrlArcgis(MAP), { base: MAP, tipo: 'MapServer', layerId: null, token: null });
  assert.deepEqual(leggiUrlArcgis(`${MAP}/`), { base: MAP, tipo: 'MapServer', layerId: null, token: null });
  assert.deepEqual(leggiUrlArcgis(`${MAP}/3?f=html&token=a%20b`), { base: MAP, tipo: 'MapServer', layerId: 3, token: 'a b' });
  assert.deepEqual(leggiUrlArcgis('https://x.it/a/rest/services/F/FeatureServer?token=t'), { base: 'https://x.it/a/rest/services/F/FeatureServer', tipo: 'FeatureServer', layerId: null, token: 't' });
});

test('leggiUrlArcgis: non https, non ArcGIS, ImageServer → errori in chiaro', () => {
  assert.throws(() => leggiUrlArcgis('http://x.it/a/MapServer'), /https/);
  assert.throws(() => leggiUrlArcgis('https://x.it/ows'), /MapServer o FeatureServer/);
  assert.throws(() => leggiUrlArcgis('https://x.it/a/ImageServer'), /MapServer o FeatureServer/);
  assert.throws(() => leggiUrlArcgis('ciao'), /non valido/);
});

test('urlInfo: del servizio o del layer', () => {
  assert.equal(urlInfo({ base: MAP, layerId: null }), `${MAP}?f=json`);
  assert.equal(urlInfo({ base: MAP, layerId: 3 }), `${MAP}/3?f=json`);
});

const CACHE = { singleFusedMapCache: true, tileInfo: { rows: 256, cols: 256, origin: { x: -20037508.342787, y: 20037508.342787 }, spatialReference: { wkid: 102100, latestWkid: 3857 }, lods: [{ level: 0 }, { level: 1 }, { level: 2 }] } };

test('MapServer dinamico: solo i layer foglia, con vettoriale a seconda della geometria', () => {
  const d = descriviArcgis({
    layers: [{ id: 0, name: 'Gruppo', subLayerIds: [1, 2] }, { id: 1, name: 'Strade', subLayerIds: null, geometryType: 'esriGeometryPolyline' }, { id: 2, name: 'Etichette', subLayerIds: null }],
    singleFusedMapCache: false,
  }, { tipo: 'MapServer', layerId: null });
  assert.equal(d.cache, false);
  assert.deepEqual(d.layer, [{ id: 1, nome: 'Strade', vettoriale: true }, { id: 2, nome: 'Etichette', vettoriale: true }]);
});

test('MapServer con cache a tile Web Mercator da livello 0: cache true', () => {
  assert.equal(descriviArcgis({ layers: [{ id: 0, name: 'A', subLayerIds: null }], ...CACHE }, { tipo: 'MapServer', layerId: null }).cache, true);
});

test('cache non utilizzabile (origine diversa, tile 512, livelli che non partono da 0, altro CRS) → cache false', () => {
  const con = patch => descriviArcgis({ layers: [], ...CACHE, tileInfo: { ...CACHE.tileInfo, ...patch } }, { tipo: 'MapServer', layerId: null }).cache;
  assert.equal(con({ origin: { x: -180, y: 90 } }), false);
  assert.equal(con({ rows: 512, cols: 512 }), false);
  assert.equal(con({ lods: [{ level: 3 }, { level: 4 }] }), false);
  assert.equal(con({ spatialReference: { wkid: 4326 } }), false);
});

test('FeatureServer: i layer sono vettoriali e non c’è cache', () => {
  const d = descriviArcgis({ layers: [{ id: 0, name: 'Punti', geometryType: 'esriGeometryPoint' }], tables: [{ id: 5, name: 'Tabella' }] }, { tipo: 'FeatureServer', layerId: null });
  assert.deepEqual(d, { tipo: 'FeatureServer', cache: false, layer: [{ id: 0, nome: 'Punti', vettoriale: true }] });
});

test('layer singolo: il JSON è quello del layer', () => {
  const d = descriviArcgis({ id: 3, name: 'Edifici', type: 'Feature Layer', geometryType: 'esriGeometryPolygon' }, { tipo: 'MapServer', layerId: 3 });
  assert.deepEqual(d, { tipo: 'MapServer', cache: false, layer: [{ id: 3, nome: 'Edifici', vettoriale: true }] });
});

test('errori del servizio: messaggio in chiaro, token mancante spiegato; JSON senza layer → errore', () => {
  assert.throws(() => descriviArcgis({ error: { code: 400, message: 'Service not found' } }, { tipo: 'MapServer', layerId: null }), /Service not found/);
  assert.throws(() => descriviArcgis({ error: { code: 499, message: 'Token Required' } }, { tipo: 'MapServer', layerId: null }), /token/i);
  assert.throws(() => descriviArcgis({ error: { code: 498, message: 'Invalid token.' } }, { tipo: 'MapServer', layerId: null }), /token/i);
  assert.throws(() => descriviArcgis({ pippo: 1 }, { tipo: 'MapServer', layerId: null }), /non è un servizio ArcGIS/);
  assert.throws(() => descriviArcgis({ layers: [] }, { tipo: 'MapServer', layerId: null }), /nessun layer/);
});

test('urlExport: segnaposto del riquadro intatti, un layer per volta', () => {
  assert.equal(urlExport(MAP, 4), `${MAP}/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png32&transparent=true&dpi=96&layers=show%3A4&f=image`);
});

test('urlTileCache: ordine z/y/x di ArcGIS', () => {
  assert.equal(urlTileCache(MAP), `${MAP}/tile/{z}/{y}/{x}`);
});

test('urlQuery: riquadro di Palermo in WGS84, GeoJSON, tetto richiesto', () => {
  const u = new URL(urlQuery(MAP, 1, [13.1, 37.9785, 13.55, 38.2919], 5001));
  assert.equal(u.pathname, '/arcgis/rest/services/Cat/Strade/MapServer/1/query');
  const p = u.searchParams;
  assert.equal(p.get('where'), '1=1');
  assert.equal(p.get('geometry'), '13.1,37.9785,13.55,38.2919');
  assert.equal(p.get('geometryType'), 'esriGeometryEnvelope');
  assert.equal(p.get('inSR'), '4326');
  assert.equal(p.get('outSR'), '4326');
  assert.equal(p.get('spatialRel'), 'esriSpatialRelIntersects');
  assert.equal(p.get('outFields'), '*');
  assert.equal(p.get('returnGeometry'), 'true');
  assert.equal(p.get('f'), 'geojson');
  assert.equal(p.get('resultRecordCount'), '5001');
});
```

- [ ] **Step 2: Verificare che fallisca** — `node --test tests/js/aggiungi-arcgis.test.mjs`. Expected: FAIL (modulo mancante).

- [ ] **Step 3: Scrivere `js/aggiungi/arcgis.js`**

```js
// js/aggiungi/arcgis.js
// ArcGIS REST (MapServer e FeatureServer): indirizzo, descrizione del servizio e URL di immagini, tile e query.
// Moduli puri, senza DOM né rete. Il token non entra mai negli URL costruiti qui: si aggiunge alla richiesta a runtime.

const ORIGINE = 20037508.342787;
const WEB = [3857, 102100, 102113, 900913];

export function leggiUrlArcgis(testo) {
  let u;
  try { u = new URL(String(testo).trim()); } catch { throw new Error('indirizzo non valido'); }
  if (u.protocol !== 'https:') throw new Error('serve un indirizzo https');
  const m = u.pathname.match(/^(.*\/(MapServer|FeatureServer))(?:\/(\d+))?\/?$/i);
  if (!m) throw new Error('l’indirizzo deve finire con MapServer o FeatureServer (o con il numero di un layer)');
  return {
    base: `${u.origin}${m[1]}`,
    tipo: m[2].toLowerCase() === 'mapserver' ? 'MapServer' : 'FeatureServer',
    layerId: m[3] === undefined ? null : Number(m[3]),
    token: u.searchParams.get('token') || null,
  };
}

export const urlInfo = ({ base, layerId }) => `${base}${layerId === null ? '' : `/${layerId}`}?f=json`;

// una cache a tile si usa come XYZ solo se ha la piramide Web Mercator standard che parte dal livello 0
function cacheUtilizzabile(j) {
  const t = j.tileInfo;
  if (!j.singleFusedMapCache || !t) return false;
  const wkid = t.spatialReference?.latestWkid ?? t.spatialReference?.wkid;
  return WEB.includes(wkid) && t.rows === 256 && t.cols === 256
    && Math.abs((t.origin?.x ?? 0) + ORIGINE) < 2 && Math.abs((t.origin?.y ?? 0) - ORIGINE) < 2
    && Array.isArray(t.lods) && t.lods.length > 0 && t.lods.every((l, i) => l.level === i);
}

export function descriviArcgis(json, { tipo, layerId }) {
  if (json?.error) {
    const e = json.error;
    if (e.code === 498 || e.code === 499) throw new Error('il servizio richiede un token valido: aggiungilo all’indirizzo (…?token=…)');
    throw new Error(e.message || 'il servizio ha risposto con un errore');
  }
  if (layerId !== null) {
    if (json?.id === undefined || !json.name) throw new Error('l’indirizzo non è un servizio ArcGIS REST');
    return { tipo, cache: false, layer: [{ id: json.id, nome: json.name, vettoriale: Boolean(json.geometryType) }] };
  }
  if (!Array.isArray(json?.layers)) throw new Error('l’indirizzo non è un servizio ArcGIS REST');
  // i gruppi (con sotto-layer) non si interrogano: contano solo le foglie
  const layer = json.layers.filter(l => !l.subLayerIds?.length).map(l => ({ id: l.id, nome: l.name, vettoriale: true })); // le foglie di un MapServer (tabelle escluse) e i layer di un FeatureServer si interrogano con query
  if (!layer.length) throw new Error('il servizio non ha nessun layer');
  return { tipo, cache: tipo === 'MapServer' && cacheUtilizzabile(json), layer };
}

// i segnaposto {bbox-epsg-3857}, {z}, {y}, {x} li sostituisce MapLibre: URL scritti a mano, non con URLSearchParams
export const urlExport = (base, id) => `${base}/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png32&transparent=true&dpi=96&layers=${encodeURIComponent(`show:${id}`)}&f=image`;
export const urlTileCache = base => `${base}/tile/{z}/{y}/{x}`;

// bbox = [ovest, sud, est, nord] in WGS84; i dati arrivano come GeoJSON in WGS84
export function urlQuery(base, id, bbox, max) {
  const u = new URL(`${base}/${id}/query`);
  for (const [k, v] of [['where', '1=1'], ['geometry', bbox.join(',')], ['geometryType', 'esriGeometryEnvelope'], ['inSR', '4326'], ['spatialRel', 'esriSpatialRelIntersects'],
    ['outFields', '*'], ['outSR', '4326'], ['returnGeometry', 'true'], ['f', 'geojson'], ['resultRecordCount', String(max)]]) u.searchParams.set(k, v);
  return u.toString();
}
```
- [ ] **Step 4: Verificare** — `node --test tests/js/aggiungi-arcgis.test.mjs`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/aggiungi/arcgis.js tests/js/aggiungi-arcgis.test.mjs
git commit -m "feat(aggiungi): lettura dei servizi ArcGIS REST

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Host — token alle richieste e risposte troncate

**Files:**
- Modify: `js/rndt/host.js`
- Test: `tests/js/aggiungi-host.test.mjs`

**Interfaces:**
- Produces: `creaHost({ …, riscrivi = url => url })`: `fetchArrayBuffer(url)` scarica `riscrivi(url)` (l'URL originale, senza token, resta quello usato per salvataggio e guardie). `addWfsLayer`: se `fc.exceededTransferLimit` lancia `Error('il servizio ha troncato la risposta: troppi elementi nell’area di Palermo')`.

- [ ] **Step 1: Test** — in coda a `tests/js/aggiungi-host.test.mjs`:

```js
test('riscrivi: la richiesta parte con l’URL riscritto (token), il layer si salva con l’URL senza token', async () => {
  const map = mappaFinta(), chiamate = [], scritti = [];
  const host = creaHost({
    map, proxy: PROXY, stato: { v: 1, layers: [] }, scrivi: s => { scritti.push(s); return true; }, archivioDati: archivioInMemoria(), prefisso: 'miei',
    riscrivi: u => `${u}&token=SEGRETO`,
    fetchFn: async u => { chiamate.push(u); return corpo(punti(2)); },
  });
  await host.addWfsLayer('A', RICHIESTA);
  assert.ok(chiamate[0].endsWith('&token=SEGRETO'));
  assert.ok(!JSON.stringify(scritti).includes('SEGRETO'));
  assert.equal(scritti.at(-1).layers[0].sorgente.url, RICHIESTA);
});

test('exceededTransferLimit: il servizio ha troncato la risposta → errore, mai dati parziali', async () => {
  const troncata = JSON.stringify({ type: 'FeatureCollection', exceededTransferLimit: true, features: JSON.parse(punti(3)).features });
  const { host, map, scritti } = costruisci(troncata);
  await assert.rejects(() => host.addWfsLayer('T', RICHIESTA), /troncato la risposta/);
  assert.equal(map.sorgenti.size, 0);
  assert.equal(scritti.length, 0);
});
```

- [ ] **Step 2: Verificare che fallisca** — `node --test tests/js/aggiungi-host.test.mjs`. Expected: FAIL.

- [ ] **Step 3: Modificare `js/rndt/host.js`** — firma: aggiungere `riscrivi = url => url,` accanto a `autorizzazione`; in `fetchArrayBuffer` sostituire le due occorrenze di `urlProxy(proxy, url)` con `urlProxy(proxy, riscrivi(url))`; in `addWfsLayer`, subito dopo il controllo `fc?.type !== 'FeatureCollection'`:

```js
      if (fc.exceededTransferLimit) throw new Error('il servizio ha troncato la risposta: troppi elementi nell’area di Palermo');
```

- [ ] **Step 4: Verificare** — `npm run test:js`. Expected: tutto passa.

- [ ] **Step 5: Commit**

```bash
git add js/rndt/host.js tests/js/aggiungi-host.test.mjs
git commit -m "feat(aggiungi): host con richieste riscritte (token) e risposte troncate come errore

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Il controllo gestisce WMTS, ArcGIS e token

**Files:**
- Modify: `js/aggiungi/controllo.js`
- Test: `tests/js/aggiungi-controllo.test.mjs`

**Interfaces:**
- Consumes: `capabilitiesWmts` (Task 2); `leggiUrlArcgis`, `urlInfo`, `descriviArcgis`, `urlExport`, `urlTileCache`, `urlQuery` (Task 3); `impostaToken`/`conToken` (Task 1); `TETTO_WFS`, `BBOX_PALERMO`.
- Produces:
  - `leggiServizio('wmts', url, cred)` → `{ url (base), versione, layer }`; `leggiServizio('arcgis', url, cred)` → `{ url (base), conToken, tipo, cache, layer }`
  - `aggiungiWmts({ nome, url, servizio, scelti, utente }) → { pieno, errori }`
  - `aggiungiArcgis({ nome, url, servizio, scelti, modo: 'immagini'|'dati', utente }) → { pieno, errori }`
  - `riaggiungi(id, { password })`: una voce con `opz` → `addWmsLayer`, con `richiesta` → `addWfsLayer`, con `tile` → `addTileLayer`; per un servizio `conToken` la «password» è il token (`impostaToken`).
  - `serveCredenziali`/`protetto`: valgono anche per `conToken`.

- [ ] **Step 1: Test** — in `tests/js/aggiungi-controllo.test.mjs`. Il `costruisci` esistente accetta già `testo`; per ArcGIS (due risposte) aggiungere un parametro `risposte`:

  1. Nell'oggetto `host` di `costruisci`, sostituire `fetchArrayBuffer` con `fetchArrayBuffer: async u => { chiamate.fetch.push(u); const t = risposte ? risposte(u) : testo; return new TextEncoder().encode(t).buffer; }` e dichiarare `risposte` nei parametri destrutturati (`{ testo = WMS, risposte = null, wfsEsito…, storage = finto() } = {}`). Se non c'è già, aggiungere a `host` anche `riscrivi`-equivalente: il fetch finto registra l'URL **così com'è** (il controllo non aggiunge il token: lo fa l'host reale).
  2. Aggiungere i test:

```js
const WMTS = `<Capabilities version="1.0.0"><ServiceIdentification><ServiceType>OGC WMTS</ServiceType></ServiceIdentification>
<Contents><Layer><Title>Base</Title><Identifier>base</Identifier><Format>image/png</Format>
<TileMatrixSetLink><TileMatrixSet>web</TileMatrixSet></TileMatrixSetLink>
<ResourceURL format="image/png" resourceType="tile" template="https://w.it/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png"/></Layer>
<TileMatrixSet><Identifier>web</Identifier><SupportedCRS>EPSG:3857</SupportedCRS>
<TileMatrix><Identifier>0</Identifier><ScaleDenominator>559082264</ScaleDenominator><TopLeftCorner>-20037508.342789244 20037508.342789244</TopLeftCorner><TileWidth>256</TileWidth><TileHeight>256</TileHeight><MatrixWidth>1</MatrixWidth><MatrixHeight>1</MatrixHeight></TileMatrix></TileMatrixSet>
</Contents></Capabilities>`;
const ARC_URL = 'https://x.it/arcgis/rest/services/S/MapServer';
const ARC_DINAMICO = JSON.stringify({ layers: [{ id: 1, name: 'Strade', subLayerIds: null }, { id: 2, name: 'Edifici', subLayerIds: null }] });
const ARC_CACHE = JSON.stringify({ layers: [{ id: 1, name: 'Strade', subLayerIds: null }], singleFusedMapCache: true,
  tileInfo: { rows: 256, cols: 256, origin: { x: -20037508.342787, y: 20037508.342787 }, spatialReference: { wkid: 3857 }, lods: [{ level: 0 }, { level: 1 }] } });

test('WMTS: legge, aggiunge i layer come tile XYZ e salva le voci con l’URL calcolato', async () => {
  const { c, chiamate, storage } = costruisci({ testo: WMTS });
  const servizio = await c.leggiServizio('wmts', 'https://w.it/wmts');
  assert.equal(servizio.layer[0].tile, 'https://w.it/web/{z}/{y}/{x}.png');
  const r = await c.aggiungiWmts({ nome: 'W', url: servizio.url, servizio, scelti: servizio.layer });
  assert.deepEqual(r, { pieno: false, errori: [] });
  assert.deepEqual(chiamate.tile, [['Base', 'https://w.it/web/{z}/{y}/{x}.png']]);
  assert.deepEqual(leggiServizi(storage).servizi[0].voci, [{ chiave: 'base', nome: 'Base', tile: 'https://w.it/web/{z}/{y}/{x}.png' }]);
});

test('WMTS: un layer non supportato non si aggiunge e dà l’errore in chiaro', async () => {
  const { c, chiamate } = costruisci({ testo: WMTS });
  const servizio = await c.leggiServizio('wmts', 'https://w.it/wmts');
  const r = await c.aggiungiWmts({ nome: '', url: servizio.url, servizio, scelti: [{ ...servizio.layer[0], supportato: false, tile: null }] });
  assert.equal(chiamate.tile.length, 0);
  assert.match(r.errori[0].messaggio, /compatibile/);
});

test('ArcGIS dinamico, immagini: un layer raster export per layer scelto', async () => {
  const { c, chiamate, storage } = costruisci({ risposte: () => ARC_DINAMICO });
  const servizio = await c.leggiServizio('arcgis', ARC_URL);
  assert.equal(servizio.cache, false);
  assert.match(chiamate.fetch[0], /MapServer\?f=json$/);
  const r = await c.aggiungiArcgis({ nome: 'S', url: servizio.url, servizio, scelti: [servizio.layer[0]], modo: 'immagini' });
  assert.deepEqual(r, { pieno: false, errori: [] });
  assert.equal(chiamate.tile.length, 1);
  assert.equal(chiamate.tile[0][0], 'Strade');
  assert.match(chiamate.tile[0][1], /\/export\?bbox=\{bbox-epsg-3857\}.*layers=show%3A1&f=image$/);
  assert.equal(leggiServizi(storage).servizi[0].tipo, 'arcgis');
});

test('ArcGIS con cache: un solo layer con i tile z/y/x, qualunque sia la scelta', async () => {
  const { c, chiamate } = costruisci({ risposte: () => ARC_CACHE });
  const servizio = await c.leggiServizio('arcgis', ARC_URL);
  assert.equal(servizio.cache, true);
  await c.aggiungiArcgis({ nome: 'Strade', url: servizio.url, servizio, scelti: servizio.layer, modo: 'immagini' });
  assert.deepEqual(chiamate.tile, [['Strade', `${ARC_URL}/tile/{z}/{y}/{x}`]]);
});

test('ArcGIS, dati: ogni layer scaricato come GeoJSON con la query sul riquadro di Palermo; un errore non ferma gli altri', async () => {
  const esito = async n => { if (n === 'Edifici') throw new Error('più di 5000 elementi'); return 'miei-ok'; };
  const { c, chiamate, storage } = costruisci({ risposte: () => ARC_DINAMICO, wfsEsito: esito });
  const servizio = await c.leggiServizio('arcgis', ARC_URL);
  const r = await c.aggiungiArcgis({ nome: 'S', url: servizio.url, servizio, scelti: servizio.layer, modo: 'dati' });
  assert.equal(chiamate.wfs.length, 2);
  assert.match(chiamate.wfs[0][1], /\/1\/query\?/);
  assert.match(chiamate.wfs[0][1], /resultRecordCount=5001/);
  assert.deepEqual(r.errori, [{ nome: 'Edifici', messaggio: 'più di 5000 elementi' }]);
  assert.equal(leggiServizi(storage).servizi[0].voci.length, 1);
});

test('ArcGIS: errore nel JSON (token richiesto) → messaggio in chiaro; non ArcGIS → errore', async () => {
  const a = costruisci({ risposte: () => JSON.stringify({ error: { code: 499, message: 'Token Required' } }) });
  await assert.rejects(() => a.c.leggiServizio('arcgis', ARC_URL), /richiede un token/);
  const b = costruisci({ risposte: () => '<html>no</html>' });
  await assert.rejects(() => b.c.leggiServizio('arcgis', ARC_URL), /non è un servizio ArcGIS/);
});

test('token nell’indirizzo: in memoria, tolto dall’URL e mai salvato; il servizio resta con conToken', async () => {
  const { c, credenziali, storage } = costruisci({ risposte: () => ARC_DINAMICO });
  const servizio = await c.leggiServizio('arcgis', `${ARC_URL}?token=SEGRETISSIMO`);
  assert.equal(servizio.url, ARC_URL);
  assert.equal(servizio.conToken, true);
  assert.equal(credenziali.token('x.it'), 'SEGRETISSIMO');
  await c.aggiungiArcgis({ nome: 'S', url: servizio.url, servizio, scelti: servizio.layer, modo: 'immagini', conToken: true });
  const grezzo = [...storage.m.values()].join('|');
  assert.ok(!grezzo.includes('SEGRETISSIMO'));
  assert.ok(grezzo.includes('"conToken":true'));
});

test('servizio ArcGIS con token: alla riapertura serve il lucchetto; col token si rimette in mappa; token sbagliato → il lucchetto resta', async () => {
  const storage = finto();
  const primo = costruisci({ risposte: () => ARC_DINAMICO, storage });
  const servizio = await primo.c.leggiServizio('arcgis', `${ARC_URL}?token=t1`);
  await primo.c.aggiungiArcgis({ nome: 'S', url: servizio.url, servizio, scelti: servizio.layer, modo: 'immagini', conToken: servizio.conToken });
  const secondo = costruisci({ risposte: () => ARC_DINAMICO, storage });
  const id = leggiServizi(storage).servizi[0].id;
  assert.equal(secondo.c.serveCredenziali(id), true);
  assert.equal(secondo.c.protetto(`${ARC_URL}/export?x=1`), true);
  assert.equal((await secondo.c.riaggiungi(id)).serve, true);
  assert.equal(secondo.chiamate.tile.length, 0);
  const con = await secondo.c.riaggiungi(id, { password: 't2' });
  assert.deepEqual(con, { errori: [] });
  assert.equal(secondo.credenziali.token('x.it'), 't2');
  assert.equal(secondo.chiamate.tile.length, 2);
  assert.equal(secondo.c.serveCredenziali(id), false);
});

test('riaggiungi ricostruisce dalle voci: tile, richiesta e opz', async () => {
  const { c, chiamate, storage } = costruisci({ testo: WMTS });
  const servizio = await c.leggiServizio('wmts', 'https://w.it/wmts');
  await c.aggiungiWmts({ nome: 'W', url: servizio.url, servizio, scelti: servizio.layer });
  chiamate.tile.length = 0;
  await c.riaggiungi(leggiServizi(storage).servizi[0].id);
  assert.deepEqual(chiamate.tile, [['Base', 'https://w.it/web/{z}/{y}/{x}.png']]);
});
```
  (`finto`, `leggiServizi` e `credenziali` ritornato da `costruisci` esistono già.)

- [ ] **Step 2: Verificare che fallisca** — `node --test tests/js/aggiungi-controllo.test.mjs`. Expected: FAIL (funzioni mancanti).

- [ ] **Step 3: Modificare `js/aggiungi/controllo.js`**

- Import: `import { capabilitiesWmts } from './wmts.js';` e `import { leggiUrlArcgis, urlInfo, descriviArcgis, urlExport, urlTileCache, urlQuery } from './arcgis.js';`
- `leggiServizio(tipo, urlUtente, { utente, password } = {})`: dopo l'eventuale `credenziali.imposta(...)`, gestire i due tipi nuovi **prima** del ramo wms/wfs:

```js
    if (tipo === 'arcgis') {
      const p = leggiUrlArcgis(urlUtente);
      if (p.token) credenziali.impostaToken(ospiteDi(p.base), p.token);
      const grezzo = new TextDecoder().decode(await host.fetchArrayBuffer(urlInfo(p)));
      let json;
      try { json = JSON.parse(grezzo); } catch { throw new Error('l’indirizzo non è un servizio ArcGIS REST'); }
      return { url: p.base, conToken: Boolean(p.token) || credenziali.token(ospiteDi(p.base)) !== null, ...descriviArcgis(json, p) };
    }
```
  e, nel ramo con il testo delle capabilities, `tipo === 'wmts' ? { url, ...capabilitiesWmts(testo, urlUtente) } : …` (l'URL delle capabilities si costruisce con `urlCapabilities(urlUtente, tipo)`, che per `wmts` imposta `SERVICE=WMTS`).
- Aggiungere:

```js
  async function aggiungiWmts({ nome, url, servizio, scelti, utente }) {
    const errori = [];
    const voci = [];
    for (const l of scelti) {
      if (!l.supportato || !l.tile) { errori.push({ nome: l.titolo, messaggio: 'non ha una piramide di tile compatibile con la mappa (serve EPSG:3857, tile 256)' }); continue; }
      try {
        host.addTileLayer(l.titolo, l.tile, {});
        voci.push({ chiave: l.nome, nome: l.titolo, tile: l.tile });
      } catch (e) { errori.push({ nome: l.titolo, messaggio: messaggio(e) }); }
    }
    const r = voci.length ? memorizza({ tipo: 'wmts', nome: nome.trim() || nomeDaUrl(url), url, utente, voci }) : { pieno: false };
    return { ...r, errori };
  }

  async function aggiungiArcgis({ nome, url, servizio, scelti, modo, utente, conToken }) {
    const errori = [];
    const voci = [];
    const aggiungiRaster = (titolo, chiave, tile) => {
      try { host.addTileLayer(titolo, tile, {}); voci.push({ chiave, nome: titolo, tile }); } catch (e) { errori.push({ nome: titolo, messaggio: messaggio(e) }); }
    };
    if (modo === 'dati') {
      for (const l of scelti) {
        try {
          const richiesta = urlQuery(url, l.id, BBOX_PALERMO, TETTO_WFS + 1);
          await host.addWfsLayer(l.nome, richiesta);
          voci.push({ chiave: `dati:${l.id}`, nome: l.nome, richiesta });
        } catch (e) { errori.push({ nome: l.nome, messaggio: messaggio(e) }); }
      }
    } else if (servizio.cache) {
      aggiungiRaster(nome.trim() || nomeDaUrl(url), 'cache', urlTileCache(url));
    } else {
      for (const l of scelti) aggiungiRaster(l.nome, `immagine:${l.id}`, urlExport(url, l.id));
    }
    const r = voci.length ? memorizza({ tipo: 'arcgis', nome: nome.trim() || nomeDaUrl(url), url, utente, conToken, voci }) : { pieno: false };
    return { ...r, errori };
  }
```
- `serveCredenziali` e `protetto`: sostituire `Boolean(s?.utente)` con `Boolean(s?.utente || s?.conToken)` e `s.utente &&` con `(s.utente || s.conToken) &&`.
- `riaggiungi(id, { password } = {})`: nel blocco `if (serveCredenziali(id)) { … }` sostituire `credenziali.imposta(ospiteDi(s.url), s.utente, password)` con `if (s.conToken) credenziali.impostaToken(ospiteDi(s.url), password); else credenziali.imposta(ospiteDi(s.url), s.utente, password);` (un token vuoto lancia «manca il token»: lasciare risalire l'errore al chiamante); e riscrivere il ciclo sulle voci **per forma**:

```js
    for (const v of s.voci) {
      try {
        if (v.opz) host.addWmsLayer(v.nome, v.opz);
        else if (v.richiesta) await host.addWfsLayer(v.nome, v.richiesta);
        else if (v.tile) host.addTileLayer(v.nome, v.tile, {});
      } catch (e) { errori.push({ nome: v.nome, messaggio: messaggio(e) }); }
    }
```
  (il ramo `s.tipo === 'xyz'` che chiama `addTileLayer(s.nome, s.url, {})` resta prima del ciclo.) L'oggetto restituito aggiunge `aggiungiWmts, aggiungiArcgis`.
- Il messaggio «password sbagliata» (`/utente e password/`) copre anche il token: per ArcGIS il servizio risponde `200` con `error` 498/499; nel ciclo di `riaggiungi` l'errore di `host.addWfsLayer` per un token sbagliato arriva come messaggio ArcGIS; estendere la condizione che dimentica le credenziali a `/utente e password|token/i`.

- [ ] **Step 4: Verificare** — `node --test tests/js/aggiungi-controllo.test.mjs`, poi `npm run test:js`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/aggiungi/controllo.js tests/js/aggiungi-controllo.test.mjs
git commit -m "feat(aggiungi): il controllo aggiunge servizi WMTS e ArcGIS REST, con token di sessione

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Albero, token ai tile, documentazione e verifica

**Files:**
- Modify: `js/aggiungi/albero.js`, `js/aggiungi/index.js`, `docs/AGGIUNGI_LAYER.md`, `js/core/guida-contenuti.js`

**Interfaces:**
- Consumes: `controllo.leggiServizio('wmts'|'arcgis', …)`, `aggiungiWmts`, `aggiungiArcgis`, `credenziali.conToken`, `credenziali.riscriviPerProxy`, `serveCredenziali` con `conToken`.

- [ ] **Step 1: `js/aggiungi/index.js`** — passare il token a ogni richiesta dell'host e dei tile:
  - nel `creaHost({…})` aggiungere `riscrivi: url => credenziali.conToken(url),`
  - nel `setTransformRequest` sostituire il corpo con:

```js
  map.setTransformRequest(url => {
    const auth = credenziali.perUrlProxy(PROXY_RNDT, url);
    const finale = credenziali.riscriviPerProxy(PROXY_RNDT, url);
    return auth ? { url: finale, headers: { authorization: auth } } : { url: finale };
  });
```

- [ ] **Step 2: `js/aggiungi/albero.js`**
  - `TIPI`: aggiungere `{ id: 'wmts', titolo: 'WMTS', esempio: 'https://servizio.example.org/wmts' }` e `{ id: 'arcgis', titolo: 'ArcGIS REST', esempio: 'https://server.example.org/arcgis/rest/services/Cartella/Servizio/MapServer' }` (l'ordine: XYZ, WMS, WMTS, WFS, ArcGIS REST).
  - `creaModulo`: per `arcgis` il campo indirizzo ha l'etichetta «Indirizzo del servizio (MapServer o FeatureServer, anche con ?token=…)»; per `wmts` quella degli altri servizi. Il ramo `else` che oggi gestisce wms/wfs (il modulo con «Leggi il servizio») vale anche per wmts e arcgis.
  - `mostraScelta(tipo, scelta, servizio, dati, esitoForm)`: calcolare le voci così:

```js
    const voci = tipo === 'wms' || tipo === 'wmts' ? servizio.layer : tipo === 'wfs' ? servizio.tipi : servizio.layer.map(l => ({ ...l, titolo: l.nome }));
```
    (ArcGIS: `layer` ha `{ id, nome, vettoriale }`; `titolo` serve all'etichetta della casella). Per `arcgis`, prima della lista, un selettore «Mostra come»:

```js
    let modo = null;
    if (tipo === 'arcgis') {
      modo = el('select', 'agg-modo');
      for (const [v, t] of [['immagini', 'Immagini (come una mappa)'], ['dati', 'Dati (elementi che si possono interrogare)']]) modo.append(Object.assign(el('option', null, t), { value: v }));
      if (servizio.tipo === 'FeatureServer') { modo.value = 'dati'; modo.querySelector('[value=immagini]').disabled = true; }
      scelta.append(Object.assign(el('label', 'agg-campo'), {}), modo);
      if (servizio.cache) scelta.append(el('p', 'agg-nota', 'Il servizio ha una cache a tile: in modalità «Immagini» si aggiunge un solo layer con tutti i livelli.'));
    }
```
    (il `label` con testo «Mostra come» va creato con `el('span', null, 'Mostra come')` dentro un `label.agg-campo` insieme al `select`). Al clic su «Aggiungi selezionati» la funzione da chiamare è: `wmts` → `controllo.aggiungiWmts`, `arcgis` → `controllo.aggiungiArcgis({ …dati, servizio, scelti, modo: modo.value })`; in modalità `immagini` con `servizio.cache` basta che sia spuntato **un** layer (il controllo ne usa uno solo). Per `arcgis` il `dati` passato dal modulo deve contenere anche `conToken: servizio.conToken`.
  - `rigaServizio`: per un servizio con `conToken` il campo di «Password di …» diventa «Token ArcGIS» (testo: `Token del servizio`), perché `serveCredenziali` è vero anche per `conToken`; l'etichetta sul lucchetto (`title`) usa «serve il token» al posto di «serve la password di <utente>».

- [ ] **Step 3: Verifica automatica** — `node --check js/aggiungi/albero.js js/aggiungi/index.js && npm run test:js`. Expected: tutto verde.

- [ ] **Step 4: Verifica a mano nel browser** (server `python3 scripts/serve.py 8000`, proxy `cd worker && npx wrangler dev --port 8787`; app su `http://localhost:8000/?rndt-proxy=http://127.0.0.1:8787`; Playwright Node da `/tmp/pwtest`). Con la console senza errori:
  1. L'albero mostra XYZ, WMS, WMTS, WFS, ArcGIS REST, ciascuno col suo «＋».
  2. **WMTS** reale (provarne uno pubblico con EPSG:3857, es. un servizio `GoogleMapsCompatible` raggiungibile dal Worker): «Leggi il servizio» elenca i layer; uno compatibile si aggiunge e **compare nella mappa** (controllare `window.dt.map.getLayer('miei-…')` e che i tile arrivino dal proxy, non solo la riga nel gruppo); un layer con altra piramide è «non supportato».
  3. **ArcGIS REST** pubblico (es. un `…/rest/services/…/MapServer` aperto): «Leggi» elenca i layer; «Immagini» aggiunge un raster che compare (verificare `getLayer`), «Dati» scarica i GeoJSON nell'area di Palermo oppure dà «nessun elemento»/«troncato» con il messaggio giusto.
  4. Token: un indirizzo `…/MapServer?token=xxx` (anche finto): la richiesta `?f=json&token=xxx` parte (vedi rete); in `localStorage` (`dt:miei:servizi:v1`, `dt:miei:v1`) il token **non** compare; dopo il ricaricamento la riga ha il lucchetto e il layer risulta «non disponibile».
  5. Se non si trova un servizio WMTS/ArcGIS pubblico raggiungibile, annotarlo: i moduli puri sono comunque coperti dai test con documenti di esempio, ma la compatibilità reale resta da provare con un servizio dell'utente.

- [ ] **Step 5: Documentazione** — in `docs/AGGIUNGI_LAYER.md`: nella sezione Servizi aggiungere **WMTS** (solo piramide EPSG:3857 «Google Maps», tile 256; gli altri layer «non supportato») e **ArcGIS REST** (indirizzo `…/MapServer` o `…/FeatureServer`, anche con `/N`; «Mostra come» immagini o dati; la cache a tile si usa se è Web Mercator standard; dati nell'area di Palermo, massimo 5.000 elementi, mai troncati; `ImageServer` non supportato) e, in «Utente e password», il **token ArcGIS** (incollato nell'indirizzo come `?token=…`, tenuto solo in memoria, tolto dall'URL e mai salvato; alla riapertura il lucchetto lo richiede; non si genera nessun token). In `js/core/guida-contenuti.js`, nel passo `rndt-gruppo`, citare i servizi «XYZ, WMS, WMTS, WFS e ArcGIS REST» (stare attenti agli apostrofi dentro le stringhe a virgolette singole: usare `’`).

- [ ] **Step 6: Chiusura** — `graphify update .`; `npm run test:js`; commit:

```bash
git add -A js docs graphify-out
git commit -m "feat(aggiungi): rami WMTS e ArcGIS REST nell'albero, token ai tile, documentazione

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Self-review (spec ↔ piano)

- **WMTS: capabilities, piramide compatibile, URL XYZ (REST e KVP), non supportato:** Task 2; aggiunta e voci salvate: Task 5; albero: Task 6.
- **ArcGIS immagini (export e cache) e dati (query GeoJSON, tetto, troncamento):** Task 3 (URL e descrizione), Task 4 (troncamento), Task 5 (aggiunta); «Mostra come»: Task 6.
- **Token di sessione, mai negli URL salvati, lucchetto alla riapertura, richieste dell'host e tile:** Task 1, Task 4 (`riscrivi`), Task 5 (`conToken`), Task 6 (`setTransformRequest`).
- **ImageServer fuori ambito; nessuna generazione di token:** dichiarato nei Global Constraints e in `leggiUrlArcgis`.
- **Coerenza dei nomi:** `prefissoWebMercator`, `capabilitiesWmts` (Task 2) usati in Task 5; `leggiUrlArcgis/urlInfo/descriviArcgis/urlExport/urlTileCache/urlQuery` (Task 3) usati in Task 5; `impostaToken/token/conToken/riscriviPerProxy` (Task 1) usati in Task 5 e Task 6; `riscrivi` (Task 4) usato in Task 6; voci `{ chiave, nome, tile|richiesta|opz }` coerenti tra Task 5 e `riaggiungi`.
- **Rischio:** i servizi WMTS e ArcGIS reali variano molto (identificatori di matrice, dimensioni, `exceededTransferLimit` assente sui GeoJSON di alcune versioni): i test coprono i casi noti con documenti di esempio; la compatibilità vera si prova con servizi reali nello Step 4 del Task 6.
