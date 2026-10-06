# Pannello ad albero e credenziali Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portare tutto «Aggiungi layer» nel gruppo sinistro «I miei layer», in forma di albero come il Browser di QGIS, e permettere utente e password (solo per la sessione) sui servizi XYZ, WMS e WFS.

**Architecture:** Il gruppo «I miei layer» (`creaGruppo`) riceve un contenuto fisso (ricerca + albero + titolo «Layer in mappa») creato una volta da `albero.js`; le righe dei layer restano quelle di oggi. Le credenziali stanno in una `Map` in memoria (`credenziali.js`) e arrivano al Worker come intestazione `Authorization` (fetch dall'host; tile da `map.setTransformRequest`); il Worker la inoltra solo all'host richiesto.

**Tech Stack:** JavaScript ES module senza build, MapLibre GL 4.7.1, Cloudflare Worker, `node --test` (`npm run test:js`).

**Spec:** `docs/superpowers/specs/2026-10-06-aggiungi-layer-design.md` (Revisione 2). Parte da `docs/superpowers/plans/2026-10-06-aggiungi-layer.md`, già eseguito.

## Global Constraints

- Italiano ovunque (interfaccia, messaggi, commenti), accenti corretti.
- Nessuna libreria nuova, nessun build.
- **Le credenziali non si scrivono mai** in `localStorage`, IndexedDB, URL, log o messaggi di errore. Si salva solo il nome utente nel servizio salvato.
- Il Worker non registra l'intestazione `Authorization`, non la manda a un host diverso da quello richiesto (redirect compresi) e non restituisce `WWW-Authenticate`.
- Solo autenticazione Basic, solo https, limite di Palermo e tetto di 50 servizi invariati.
- Il catalogo RNDT e il suo gruppo restano come sono (salvo l'opzione `intestazione`, che il loro gruppo non usa).
- Dopo le modifiche: `graphify update .`.

## Review Focus

- Password o nome utente con caratteri speciali (`:` nel nome, `é`, spazi): `:` rifiutato con messaggio; il resto codificato in UTF-8 corretto. (Task 2)
- Servizio salvato con utente aperto a pagina nuova: nessuna richiesta parte senza password, il layer risulta «non disponibile» e la riga mostra il lucchetto; inserita la password il layer si ricrea (non resta il segnaposto). (Task 2, Task 3)
- Il Worker non inoltra `Authorization` su un redirect verso un altro host e non lascia passare `WWW-Authenticate` (niente finestra di login del browser). (Task 1)
- Una risposta 401 dà il messaggio «il servizio richiede utente e password», non «HTTP 401». (Task 2)
- Il contenuto fisso del gruppo (rami aperti, testo digitato nei campi) sopravvive ai ridisegni del gruppo. (Task 4, verifica a mano)

---

## File Structure

| File | Azione | Responsabilità |
|---|---|---|
| `worker/proxy-core.js` | modifica | inoltra `Authorization` solo all'host richiesto; CORS esplicito |
| `js/aggiungi/credenziali.js` | nuovo | puro: `Map` in memoria host → intestazione Basic |
| `js/rndt/host.js` | modifica | opzioni `autorizzazione`, `protetto`; 401 in chiaro; ricrea i layer «non disponibili» |
| `js/aggiungi/salvati.js` | modifica | campo `utente` nel servizio; `filtraServizi` |
| `js/aggiungi/controllo.js` | modifica | credenziali, lucchetto, `protetto` |
| `js/rndt/gruppo.js` | modifica | opzioni `intestazione` e `ripiego`; `OPZIONI_MIEI` senza pulsanti |
| `js/aggiungi/albero.js` | nuovo | DOM dell'albero (ricerca, I miei dati, Servizi, moduli, salvati) |
| `js/aggiungi/pannello.js` | **elimina** | sostituito da `albero.js` |
| `js/aggiungi/index.js`, `js/app.js`, `index.html`, `js/core/rail.js`, `css/app.css` | modifica | niente pannello destro; stili dell'albero |
| `docs/AGGIUNGI_LAYER.md`, `js/core/guida-contenuti.js` | modifica | nuova interfaccia e credenziali |
| `tests/js/rndt-proxy.test.mjs`, `aggiungi-credenziali.test.mjs` (nuovo), `aggiungi-host.test.mjs`, `aggiungi-salvati.test.mjs`, `aggiungi-controllo.test.mjs`, `aggiungi-gruppo.test.mjs` | modifica/nuovi | test |

---

### Task 1: Il Worker inoltra l'autenticazione

**Files:**
- Modify: `worker/proxy-core.js`
- Test: `tests/js/rndt-proxy.test.mjs`

**Interfaces:**
- Produces: `gestisci(richiesta, env, fetchFn)` invariata; in più: l'intestazione `Authorization` della richiesta arriva al servizio solo per l'host della destinazione (non sui redirect verso altri host); `access-control-allow-headers: authorization, accept, content-type`.

- [ ] **Step 1: Scrivere i test** — in coda a `tests/js/rndt-proxy.test.mjs` (usa gli helper `rq`, `env`, `ORIGINE`, `upstream` già nel file):

```js
test('Authorization va al servizio richiesto, non a un altro host dopo un redirect', async () => {
  const visti = [];
  const f = async (u, init) => {
    visti.push([u, init.headers.authorization]);
    return visti.length === 1 ? new Response(null, { status: 302, headers: { location: 'https://altro.it/y' } }) : new Response('ok');
  };
  await gestisci(rq('/t/a.it/x', { headers: { origin: ORIGINE, authorization: 'Basic eDp5' } }), env, f);
  assert.deepEqual(visti, [['https://a.it/x', 'Basic eDp5'], ['https://altro.it/y', undefined]]);
});

test('Authorization si mantiene su un redirect nello stesso host', async () => {
  const visti = [];
  const f = async (u, init) => {
    visti.push([u, init.headers.authorization]);
    return visti.length === 1 ? new Response(null, { status: 302, headers: { location: '/y' } }) : new Response('ok');
  };
  await gestisci(rq('/t/a.it/x', { headers: { origin: ORIGINE, authorization: 'Basic eDp5' } }), env, f);
  assert.deepEqual(visti.map(v => v[1]), ['Basic eDp5', 'Basic eDp5']);
});

test('senza Authorization nessuna intestazione viene inventata', async () => {
  let init;
  await gestisci(rq('/t/a.it/x', { headers: { origin: ORIGINE } }), env, async (u, i) => { init = i; return new Response('ok'); });
  assert.equal(init.headers.authorization, undefined);
});

test('preflight: Authorization è tra le intestazioni ammesse (il carattere jolly non la copre)', async () => {
  const pre = await gestisci(rq('/t/a.it/x', { method: 'OPTIONS', headers: { origin: ORIGINE } }), env, upstream());
  assert.match(pre.headers.get('access-control-allow-headers'), /authorization/i);
});

test('un 401 del servizio arriva com’è ma senza WWW-Authenticate (niente finestra di login del browser)', async () => {
  const r = await gestisci(rq('/t/a.it/x', { headers: { origin: ORIGINE, authorization: 'Basic eDp5' } }), env,
    async () => new Response('no', { status: 401, headers: { 'www-authenticate': 'Basic realm="x"' } }));
  assert.equal(r.status, 401);
  assert.equal(r.headers.get('www-authenticate'), null);
});
```

- [ ] **Step 2: Verificare** — `node --test tests/js/rndt-proxy.test.mjs`. Expected: FAIL sui test su `Authorization` (oggi non viene inoltrata) e sul preflight (`*`); gli altri passano.

- [ ] **Step 3: Modificare `worker/proxy-core.js`**

Nel preflight sostituire `'access-control-allow-headers': '*'` con `'access-control-allow-headers': 'authorization, accept, content-type'`.

Nella costruzione delle intestazioni dentro il ciclo (oggi `headers: { accept: …, 'user-agent': … }`), calcolare l'host della destinazione e inoltrare l'autenticazione solo a quello:

```js
  const autenticazione = richiesta.headers.get('authorization');
  const ospiteRichiesto = new URL(destinazione).hostname;
```
(dopo `if (!destinazione) …`), e nel ciclo:

```js
      const intestazioniUpstream = { accept: richiesta.headers.get('accept') ?? '*/*', 'user-agent': 'DigitalTwinPalermo-RNDT-proxy' };
      // le credenziali valgono per l'host richiesto: mai su un redirect verso un altro
      if (autenticazione && new URL(corrente).hostname === ospiteRichiesto) intestazioniUpstream.authorization = autenticazione;
      remota = await fetchFn(corrente, { method: richiesta.method, redirect: 'manual', headers: intestazioniUpstream });
```
Aggiornare il commento in testa al file: «L'intestazione Authorization si inoltra solo all'host richiesto; non si registra».

- [ ] **Step 4: Verificare** — `node --test tests/js/rndt-proxy.test.mjs tests/js/rndt-proxy-scelta.test.mjs`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add worker/proxy-core.js tests/js/rndt-proxy.test.mjs
git commit -m "feat(worker): inoltra Authorization solo all'host richiesto

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Credenziali in memoria, host e servizi salvati

**Files:**
- Create: `js/aggiungi/credenziali.js`
- Modify: `js/rndt/host.js`, `js/aggiungi/salvati.js`
- Test: `tests/js/aggiungi-credenziali.test.mjs` (nuovo), `tests/js/aggiungi-host.test.mjs`, `tests/js/aggiungi-salvati.test.mjs`

**Interfaces:**
- Produces:
  - `credenziali.js`: `ospiteDi(url) → string|null`; `creaCredenziali() → { imposta(host, utente, password), ha(host), utente(host), intestazione(host), togli(host), perUrlProxy(proxy, url) → string|null }`
  - `host.js`: `creaHost({ …, autorizzazione = () => null, protetto = () => false })`. `fetchArrayBuffer(url)`: manda `{ headers: { authorization } }` se `autorizzazione(url)`; su 401 lancia `Error('il servizio richiede utente e password')`. `ripristina()`: un layer con URL per cui `protetto(url)` è vero diventa «non disponibile» senza richieste. `creaWms`/`creaTile`/`addWfsLayer`: se esiste un record «non disponibile» con lo stesso id lo sostituiscono.
  - `salvati.js`: un servizio può avere `utente` (stringa); `aggiungiServizio(stato, { tipo, nome, url, utente?, voci? })` lo conserva; `filtraServizi(servizi, testo) → servizi[]` (nome e URL, senza maiuscole).

- [ ] **Step 1: Test delle credenziali**

```js
// tests/js/aggiungi-credenziali.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { creaCredenziali, ospiteDi } from '../../js/aggiungi/credenziali.js';

test('ospiteDi: nome host di un URL, anche con segnaposto XYZ; null se non è un URL', () => {
  assert.equal(ospiteDi('https://a.it/x?y=1'), 'a.it');
  assert.equal(ospiteDi('https://tile.it/{z}/{x}/{y}.png'), 'tile.it');
  assert.equal(ospiteDi('boh'), null);
});

test('imposta e rilegge: intestazione Basic con utente e password', () => {
  const c = creaCredenziali();
  c.imposta('a.it', 'mario', 'segreta');
  assert.equal(c.ha('a.it'), true);
  assert.equal(c.utente('a.it'), 'mario');
  assert.equal(c.intestazione('a.it'), `Basic ${Buffer.from('mario:segreta').toString('base64')}`);
  assert.equal(c.intestazione('altro.it'), null);
  c.togli('a.it');
  assert.equal(c.ha('a.it'), false);
});

test('caratteri non ASCII e spazi: UTF-8, non Latin-1', () => {
  const c = creaCredenziali();
  c.imposta('a.it', 'giovanni', 'pàss wörd é');
  assert.equal(c.intestazione('a.it'), `Basic ${Buffer.from('giovanni:pàss wörd é', 'utf8').toString('base64')}`);
});

test('due punti nel nome utente: rifiutati con un messaggio, nulla si salva', () => {
  const c = creaCredenziali();
  assert.throws(() => c.imposta('a.it', 'a:b', 'x'), /due punti/);
  assert.equal(c.ha('a.it'), false);
});

test('password vuota ammessa; senza utente non si imposta nulla', () => {
  const c = creaCredenziali();
  c.imposta('a.it', 'mario', '');
  assert.equal(c.intestazione('a.it'), `Basic ${Buffer.from('mario:').toString('base64')}`);
  assert.throws(() => c.imposta('b.it', '', 'x'), /nome utente/);
});

test('perUrlProxy: riconosce solo le richieste dirette al proxy per un host con credenziali', () => {
  const c = creaCredenziali();
  c.imposta('a.it', 'u', 'p');
  const h = c.intestazione('a.it');
  assert.equal(c.perUrlProxy('https://proxy.test/', 'https://proxy.test/t/a.it/ows?x=1'), h);
  assert.equal(c.perUrlProxy('https://proxy.test', 'https://proxy.test/t/b.it/ows'), null);
  assert.equal(c.perUrlProxy('https://proxy.test', 'https://a.it/ows'), null); // non passa dal proxy: mai
  assert.equal(c.perUrlProxy('https://proxy.test', 'https://proxy.test.evil.it/t/a.it/x'), null);
});
```

- [ ] **Step 2: Verificare che fallisca** — `node --test tests/js/aggiungi-credenziali.test.mjs`. Expected: FAIL (modulo mancante).

- [ ] **Step 3: Scrivere `js/aggiungi/credenziali.js`**

```js
// js/aggiungi/credenziali.js
// Utente e password dei servizi protetti: solo in memoria, per la sessione. Mai in localStorage, IndexedDB o URL.
// Ogni host ha la sua intestazione `Authorization: Basic …`.

export function ospiteDi(url) {
  try { return new URL(String(url).replace(/[{}]/g, '')).hostname; } catch { return null; }
}

// btoa lavora in Latin-1: si passa dai byte UTF-8, così «é» o «ö» nella password restano giusti
function base64(testo) {
  let s = '';
  for (const b of new TextEncoder().encode(testo)) s += String.fromCharCode(b);
  return btoa(s);
}

export function creaCredenziali() {
  const mappa = new Map(); // host → { utente, intestazione }
  return {
    imposta(host, utente, password) {
      if (!utente) throw new Error('manca il nome utente');
      if (utente.includes(':')) throw new Error('il nome utente non può contenere due punti');
      mappa.set(host, { utente, intestazione: `Basic ${base64(`${utente}:${password ?? ''}`)}` });
    },
    ha: host => mappa.has(host),
    utente: host => mappa.get(host)?.utente ?? null,
    intestazione: host => mappa.get(host)?.intestazione ?? null,
    togli: host => mappa.delete(host),
    // Una richiesta ai tile: solo se va al nostro proxy (`<proxy>/t/<host>/…`) si dà l'intestazione di quell'host
    perUrlProxy(proxy, url) {
      const base = `${String(proxy).replace(/\/$/, '')}/t/`;
      if (!String(url).startsWith(base)) return null;
      let host;
      try { host = decodeURIComponent(String(url).slice(base.length).split(/[/?#]/)[0]); } catch { return null; }
      return mappa.get(host)?.intestazione ?? null;
    },
  };
}
```

- [ ] **Step 4: Verificare** — `node --test tests/js/aggiungi-credenziali.test.mjs`. Expected: PASS.

- [ ] **Step 5: Test dell'host** — in coda a `tests/js/aggiungi-host.test.mjs` aggiungere (usa `mappaFinta`, `corpo`, `punti`, `RICHIESTA`, `PROXY`, `archivioInMemoria` già nel file):

```js
const costruisciConAuth = (risposta, extra = {}) => {
  const map = mappaFinta(), chiamate = [];
  const host = creaHost({
    map, proxy: PROXY, stato: extra.stato ?? { v: 1, layers: [] }, scrivi: () => true, archivioDati: archivioInMemoria(), prefisso: 'miei',
    autorizzazione: u => (new URL(u).hostname === 'wfs.example.org' ? 'Basic Zm9vOmJhcg==' : null),
    protetto: extra.protetto,
    fetchFn: async (u, init) => { chiamate.push([u, init]); return risposta(); },
  });
  return { host, map, chiamate };
};

test('fetchArrayBuffer manda Authorization solo per gli host con credenziali', async () => {
  const { host, chiamate } = costruisciConAuth(() => corpo('x'));
  await host.fetchArrayBuffer(RICHIESTA);
  await host.fetchArrayBuffer('https://altro.it/ows?bbox=1&request=GetFeature');
  assert.deepEqual(chiamate[0][1], { headers: { authorization: 'Basic Zm9vOmJhcg==' } });
  assert.equal(chiamate[1][1], undefined);
});

test('401: messaggio in chiaro, non «HTTP 401»', async () => {
  const { host } = costruisciConAuth(() => ({ ok: false, status: 401 }));
  await assert.rejects(() => host.fetchArrayBuffer(RICHIESTA), /richiede utente e password/);
});

test('ripristina: un layer di un servizio protetto senza password non fa richieste e resta «non disponibile»', async () => {
  const stato = { v: 1, layers: [{ id: 'miei-xyz', tipo: 'geojson', nome: 'Strade', visibile: true, sorgente: { url: RICHIESTA } }] };
  const { host, chiamate } = costruisciConAuth(() => corpo(punti(2)), { stato, protetto: () => true });
  await host.ripristina();
  assert.equal(chiamate.length, 0);
  assert.equal(host.elenco()[0].indisponibile, true);
});

test('dopo la password il layer «non disponibile» si ricrea al posto del segnaposto', async () => {
  const stato = { v: 1, layers: [{ id: 'miei-xyz', tipo: 'geojson', nome: 'Strade', visibile: true, sorgente: { url: RICHIESTA } }] };
  let protettoOra = true;
  const { host, map } = costruisciConAuth(() => corpo(punti(2)), { stato, protetto: () => protettoOra });
  await host.ripristina();
  protettoOra = false;
  const id = await host.addWfsLayer('Strade', RICHIESTA);
  assert.equal(host.elenco().length, 1);
  assert.equal(host.elenco()[0].indisponibile, false);
  assert.equal(map.sorgenti.get(id).data.features.length, 2);
});

test('un WMS «non disponibile» si ricrea con addWmsLayer', async () => {
  const wms = { url: 'https://wms.example.org/ows', layers: 'a', version: '1.3.0', format: 'image/png', transparent: true };
  const stato = { v: 1, layers: [{ id: 'miei-w', tipo: 'wms', nome: 'A', visibile: true, sorgente: wms }] };
  let protettoOra = true;
  const { host, map } = costruisciConAuth(() => corpo('x'), { stato, protetto: () => protettoOra });
  await host.ripristina();
  assert.equal(host.elenco()[0].indisponibile, true);
  protettoOra = false;
  const id = host.addWmsLayer('A', wms);
  assert.equal(host.elenco().length, 1);
  assert.equal(host.elenco()[0].indisponibile, false);
  assert.ok(map.sorgenti.has(id));
});
```
(`creaHost` va importato già in cima; aggiungere nulla.)

- [ ] **Step 6: Verificare che fallisca** — `node --test tests/js/aggiungi-host.test.mjs`. Expected: FAIL (opzioni `autorizzazione`/`protetto` non esistono).

- [ ] **Step 7: Modificare `js/rndt/host.js`**

1. Firma: `…, prefisso = 'rndt', etichetta = 'RNDT', autorizzazione = () => null, protetto = () => false, fetchFn = …`.
2. In `fetchArrayBuffer`, sostituire la riga `const risposta = await fetchFn(urlProxy(proxy, url));` e il controllo `ok`:

```js
    const auth = autorizzazione(url);
    const risposta = await (auth ? fetchFn(urlProxy(proxy, url), { headers: { authorization: auth } }) : fetchFn(urlProxy(proxy, url)));
    if (risposta.status === 401) throw new Error('il servizio richiede utente e password');
    if (!risposta.ok) throw new Error(`HTTP ${risposta.status}`);
```
(per i test esistenti `fetchFn(url)` senza secondo argomento deve restare così: in Step 5 il test «senza credenziali» si aspetta `init === undefined`.)
3. Aggiungere sopra `creaWms` un aiutante e usarlo:

```js
  // Un layer «non disponibile» (servizio protetto non ancora sbloccato) si sostituisce quando il servizio si riaggiunge
  const liberaSeNonDisponibile = id => { if (layers.get(id)?.indisponibile) layers.delete(id); };
```
   e come prima riga dopo il calcolo dell'`id` in `creaWms` e `creaTile`, e in `addWfsLayer` (prima del `if (layers.has(id)) return id;`): `liberaSeNonDisponibile(id);`.
4. In `ripristina()`, all'inizio del `try` di ogni layer salvato:

```js
          const urlSalvato = salvato.sorgente?.url;
          if (urlSalvato && protetto(urlSalvato)) throw new Error('servono utente e password');
```
   (il `catch` esistente lo segna già `indisponibile`).

- [ ] **Step 8: Verificare** — `node --test tests/js/aggiungi-host.test.mjs tests/js/rndt-host.test.mjs`. Expected: PASS.

- [ ] **Step 9: Test dei salvati** — in coda a `tests/js/aggiungi-salvati.test.mjs` (importare anche `filtraServizi`):

```js
test('il nome utente si conserva e non c’è mai una password', () => {
  const { stato } = aggiungiServizio(vuoto, { ...wms, utente: 'mario' });
  assert.equal(stato.servizi[0].utente, 'mario');
  assert.ok(!JSON.stringify(stato).includes('password'));
  const senza = aggiungiServizio(vuoto, wms).stato;
  assert.equal('utente' in senza.servizi[0], false);
  // riaggiungere senza utente non cancella quello già noto
  assert.equal(aggiungiServizio(stato, wms).stato.servizi[0].utente, 'mario');
});

test('filtraServizi: nome o indirizzo, senza badare alle maiuscole; testo vuoto = tutti', () => {
  const a = { id: '1', tipo: 'wms', nome: 'Piano PAI', url: 'https://x.it/ows', voci: [] };
  const b = { id: '2', tipo: 'wfs', nome: 'Strade', url: 'https://geo.example.org/wfs', voci: [] };
  assert.deepEqual(filtraServizi([a, b], 'pai').map(s => s.id), ['1']);
  assert.deepEqual(filtraServizi([a, b], 'EXAMPLE').map(s => s.id), ['2']);
  assert.deepEqual(filtraServizi([a, b], '  ').map(s => s.id), ['1', '2']);
});
```

- [ ] **Step 10: Modificare `js/aggiungi/salvati.js`** — `aggiungiServizio` accetta `utente`:

```js
export function aggiungiServizio(stato, { tipo, nome, url, utente, voci = [] }) {
  const id = idServizio(tipo, url);
  const presente = stato.servizi.find(s => s.id === id);
  if (!presente && stato.servizi.length >= TETTO_SERVIZI) return { stato, pieno: true };
  const unite = new Map([...(presente?.voci ?? []), ...voci].map(v => [v.chiave, v]));
  const nomeUtente = utente || presente?.utente;
  const nuovo = { id, tipo, nome: presente?.nome ?? nome, url, ...(nomeUtente ? { utente: nomeUtente } : {}), voci: [...unite.values()] };
  return { stato: { ...stato, servizi: [...stato.servizi.filter(s => s.id !== id), nuovo] }, pieno: false };
}

// Ricerca nell'albero: nome o indirizzo, senza maiuscole
export function filtraServizi(servizi, testo) {
  const t = String(testo).trim().toLowerCase();
  return t ? servizi.filter(s => `${s.nome} ${s.url}`.toLowerCase().includes(t)) : servizi;
}
```

- [ ] **Step 11: Verificare** — `npm run test:js`. Expected: tutto passa.

- [ ] **Step 12: Commit**

```bash
git add js/aggiungi/credenziali.js js/aggiungi/salvati.js js/rndt/host.js tests/js/aggiungi-credenziali.test.mjs tests/js/aggiungi-host.test.mjs tests/js/aggiungi-salvati.test.mjs
git commit -m "feat(aggiungi): credenziali in memoria, 401 in chiaro e layer protetti da sbloccare

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Il controllo gestisce le credenziali

**Files:**
- Modify: `js/aggiungi/controllo.js`
- Test: `tests/js/aggiungi-controllo.test.mjs`

**Interfaces:**
- Consumes: `creaCredenziali`, `ospiteDi` (Task 2); `filtraServizi`, `aggiungiServizio` con `utente` (Task 2).
- Produces: `creaControllo({ host, storage, credenziali = creaCredenziali() })` con, in più:
  - `leggiServizio(tipo, url, { utente, password } = {})`
  - `aggiungiXyz({ nome, url, utente, password })`; `aggiungiWms`/`aggiungiWfs` salvano `utente` (le credenziali sono già in memoria dopo `leggiServizio`)
  - `serveCredenziali(id) → boolean`
  - `riaggiungi(id, { password } = {}) → Promise<{ errori, serve? }>`: se serve la password e manca, non fa richieste e risponde `{ errori: [{ nome, messaggio: 'servono utente e password' }], serve: true }`
  - `protetto(url) → boolean` (da passare a `creaHost`)
  - `credenziali` (la stessa istanza, per `setTransformRequest` e per l'`autorizzazione` dell'host)
  - `cerca(testo) → servizi[]` (`filtraServizi` sullo stato)

- [ ] **Step 1: Test** — in `tests/js/aggiungi-controllo.test.mjs` cambiare `costruisci` perché esponga `credenziali` e le passi (`import { creaCredenziali, ospiteDi } from '../../js/aggiungi/credenziali.js'`; `const credenziali = creaCredenziali();` dentro `costruisci`, passato a `creaControllo`, restituito insieme a `c`) e aggiungere:

```js
test('leggiServizio con utente e password: le credenziali valgono per l’host prima della richiesta', async () => {
  const { c, credenziali, chiamate } = costruisci();
  let viste;
  const host = { ...chiamate }; // solo per chiarezza: il fetch finto sotto controlla le credenziali
  const prima = credenziali.intestazione('x.it');
  assert.equal(prima, null);
  await c.leggiServizio('wms', 'https://x.it/ows', { utente: 'mario', password: 'pw' });
  assert.equal(credenziali.utente('x.it'), 'mario');
  assert.ok(credenziali.intestazione('x.it').startsWith('Basic '));
});

test('il servizio salvato ricorda l’utente, mai la password', async () => {
  const { c, storage } = costruisci();
  const servizio = await c.leggiServizio('wms', 'https://x.it/ows', { utente: 'mario', password: 'segretissima' });
  await c.aggiungiWms({ nome: 'S', url: servizio.url, servizio, scelti: [servizio.layer[0]], utente: 'mario' });
  const grezzo = [...storage.m.values()].join('|');
  assert.ok(grezzo.includes('"utente":"mario"'));
  assert.ok(!grezzo.includes('segretissima'));
  assert.ok(!grezzo.includes(Buffer.from('mario:segretissima').toString('base64')));
});

test('aggiungiXyz con credenziali: impostate per l’host e utente salvato', () => {
  const { c, credenziali, storage } = costruisci();
  c.aggiungiXyz({ nome: 'T', url: 'https://t.it/{z}/{x}/{y}.png', utente: 'mario', password: 'pw' });
  assert.equal(credenziali.utente('t.it'), 'mario');
  assert.equal(leggiServizi(storage).servizi[0].utente, 'mario');
});

test('riaggiungi di un servizio protetto: senza password non parte nulla; con la password sì', async () => {
  const storage = finto();
  const primo = costruisci({ storage });
  const servizio = await primo.c.leggiServizio('wms', 'https://x.it/ows', { utente: 'mario', password: 'pw' });
  await primo.c.aggiungiWms({ nome: 'S', url: servizio.url, servizio, scelti: [servizio.layer[0]], utente: 'mario' });
  // nuova «sessione»: stesso storage, nessuna credenziale in memoria
  const secondo = costruisci({ storage });
  const id = leggiServizi(storage).servizi[0].id;
  assert.equal(secondo.c.serveCredenziali(id), true);
  assert.equal(secondo.c.protetto('https://x.it/ows?y=1'), true);
  const senza = await secondo.c.riaggiungi(id);
  assert.equal(senza.serve, true);
  assert.equal(secondo.chiamate.wms.length, 0);
  const con = await secondo.c.riaggiungi(id, { password: 'pw' });
  assert.deepEqual(con, { errori: [] });
  assert.equal(secondo.chiamate.wms.length, 1);
  assert.equal(secondo.c.serveCredenziali(id), false);
  assert.equal(secondo.c.protetto('https://x.it/ows'), false);
});

test('cerca filtra i servizi salvati', () => {
  const { c } = costruisci();
  c.aggiungiXyz({ nome: 'Ortofoto', url: 'https://a.it/{z}/{x}/{y}.png' });
  c.aggiungiXyz({ nome: 'Strade', url: 'https://b.it/{z}/{x}/{y}.png' });
  assert.deepEqual(c.cerca('orto').map(s => s.nome), ['Ortofoto']);
});
```
Adattare `costruisci` perché accetti `{ storage }` già presente e restituisca `{ c, chiamate, storage, credenziali }`. Rimuovere dal primo test le due righe superflue (`let viste;` e `const host = …`).

- [ ] **Step 2: Verificare che fallisca** — `node --test tests/js/aggiungi-controllo.test.mjs`. Expected: FAIL (`serveCredenziali`, `protetto`, `credenziali` non esistono).

- [ ] **Step 3: Modificare `js/aggiungi/controllo.js`**

- Import: `import { creaCredenziali, ospiteDi } from './credenziali.js';` e `filtraServizi` da `./salvati.js`.
- Firma: `creaControllo({ host, storage, credenziali = creaCredenziali() })`.
- `leggiServizio(tipo, urlUtente, { utente, password } = {})`: prima della richiesta `if (utente) credenziali.imposta(ospiteDi(urlUtente), utente, password);` (l'errore di `imposta` risale al chiamante).
- `aggiungiXyz({ nome, url, utente, password })`: dopo `validaXyz`, `if (utente) credenziali.imposta(ospiteDi(valido), utente, password);`; `memorizza({ tipo: 'xyz', nome: titolo, url: valido, utente })`.
- `aggiungiWms`/`aggiungiWfs`: accettano `utente` e lo passano a `memorizza({ …, utente })`.
- Nuove funzioni e ritorno:

```js
  const serveCredenziali = id => {
    const s = stato.servizi.find(x => x.id === id);
    return Boolean(s?.utente) && !credenziali.ha(ospiteDi(s.url));
  };
  // l'host lo chiede al ripristino: un layer di un servizio con utente e senza password in sessione non deve partire
  const protetto = url => {
    const o = ospiteDi(url);
    return !credenziali.ha(o) && stato.servizi.some(s => s.utente && ospiteDi(s.url) === o);
  };
```
  e in `riaggiungi(id, { password } = {})`: dopo aver trovato `s`,

```js
    if (serveCredenziali(id)) {
      if (password === undefined) return { errori: [{ nome: s.nome, messaggio: 'servono utente e password' }], serve: true };
      credenziali.imposta(ospiteDi(s.url), s.utente, password);
    }
```
  Nel `return` finale: `credenziali, serveCredenziali, protetto, cerca: testo => filtraServizi(stato.servizi, testo)`.

- [ ] **Step 4: Verificare** — `node --test tests/js/aggiungi-controllo.test.mjs`, poi `npm run test:js`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/aggiungi/controllo.js tests/js/aggiungi-controllo.test.mjs
git commit -m "feat(aggiungi): il controllo gestisce utente e password dei servizi

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: L'albero nel gruppo sinistro e tolto il pannello destro

**Files:**
- Create: `js/aggiungi/albero.js`
- Delete: `js/aggiungi/pannello.js`
- Modify: `js/rndt/gruppo.js`, `js/aggiungi/index.js`, `js/app.js`, `index.html`, `js/core/rail.js`, `css/app.css`
- Test: `tests/js/aggiungi-gruppo.test.mjs`

**Interfaces:**
- Consumes: `controllo` (Task 3) e `credenziali`; `creaGruppo`.
- Produces:
  - `creaGruppo(opz)` accetta `intestazione` (non più nelle opzioni ma come 4° argomento di `collega(host, apri, carica, intestazione)`), `azioni` può essere `[]`, e `ripiego` (id del controllo su cui torna il focus; default `azioni[0]?.id`). `intestazione()` si chiama una sola volta e il nodo che restituisce si rimette a ogni ridisegno.
  - `OPZIONI_MIEI`: `azioni: []`, `ripiego: 'miei-cerca'`, descrizione senza il riferimento alla barra strumenti.
  - `creaAlbero({ controllo, carica, avvisa }) → HTMLElement` (la radice dell'albero, già con titolo «Layer in mappa»).
  - `collegaAggiungi(map, gruppo) → { ripristina }`.

- [ ] **Step 1: Test del gruppo** — in `tests/js/aggiungi-gruppo.test.mjs` aggiungere:

```js
import { OPZIONI_MIEI } from '../../js/rndt/gruppo.js';

test('«I miei layer» non ha pulsanti d’aggiunta propri: l’albero è il contenuto fisso', () => {
  assert.deepEqual(OPZIONI_MIEI.azioni, []);
  assert.equal(OPZIONI_MIEI.ripiego, 'miei-cerca');
});

test('collega accetta l’intestazione come quarto argomento senza disegnare finché manca il DOM', () => {
  const g = creaGruppo(OPZIONI_MIEI);
  assert.doesNotThrow(() => g.collega(hostFinto([l('miei-a', 'Alfa')]), () => {}, async () => {}, () => ({})));
});
```
(`l` e `hostFinto` esistono già nel file; l'import di `OPZIONI_MIEI` c'è già in cima: non duplicarlo.)

- [ ] **Step 2: Verificare che fallisca** — `node --test tests/js/aggiungi-gruppo.test.mjs`. Expected: FAIL sul primo test (`azioni` ha ancora due voci).

- [ ] **Step 3: Modificare `js/rndt/gruppo.js`**

- `OPZIONI_MIEI`: sostituire con

```js
export const OPZIONI_MIEI = {
  id: 'miei',
  titolo: 'I miei layer',
  argomento: { titolo: 'I miei layer', descrizione: 'File caricati dal computer e servizi XYZ, WMS e WFS aggiunti per indirizzo, anche richiamati dal salvataggio. Si aggiungono dall’albero in cima al gruppo.' },
  vuoto: 'Nessun layer in mappa: carica un file o aggiungi un servizio dall’albero qui sopra.',
  azioni: [],
  ripiego: 'miei-cerca',
};
```
- `creaGruppo({ id, titolo, argomento, vuoto, azioni, ripiego })`: dentro, `let intestazione = null; let fissa = null;`.
- In `disegna()`:
  - `selettore ??= azioni.some(a => a.tipo === 'file') ? creaSelettore() : el('span');` (invariato; senza azioni `file` è uno span vuoto: rimuoverlo dal `replaceChildren` quando non serve non è necessario).
  - `fissa ??= intestazione?.() ?? null;`
  - `radice.replaceChildren(h2, ...(azioni.length ? [gruppoAzioni] : []), selettore, ...(fissa ? [fissa] : []), ...voci);`
  - ripiego del focus: `idDaFocalizzare(idAttivo, […], ripiego ?? azioni[0]?.id)`.
- `collega(hostCollegato, apriPannello, carica = async () => {}, intestazioneDelContenuto = null) { … intestazione = intestazioneDelContenuto; … }`.
- `OPZIONI_RNDT` non cambia.

- [ ] **Step 4: Verificare** — `node --test tests/js/aggiungi-gruppo.test.mjs tests/js/rndt-gruppo.test.mjs`. Expected: PASS.

- [ ] **Step 5: Scrivere `js/aggiungi/albero.js`** (DOM; si prova a mano nello Step 9)

```js
// js/aggiungi/albero.js
// L'albero di «I miei layer», come il Browser di QGIS: ricerca, «I miei dati» (file) e «Servizi» (XYZ, WMS, WFS) con i
// servizi salvati e un modulo per aggiungerne. Si crea una volta sola: il gruppo lo rimette a ogni ridisegno, quindi
// rami aperti e testo digitato restano.
import { ESTENSIONI } from '../rndt/importa.js';
import { TETTO_SERVIZI } from './salvati.js';

const SVG = d => `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg>`;
const ICONE = {
  cartella: SVG('M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z'),
  carica: SVG('M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z'),
  piu: SVG('M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z'),
  cestino: SVG('M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z'),
  lucchetto: SVG('M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z'),
};
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
const bottone = (testo, classe = 'agg-bottone') => Object.assign(el('button', classe, testo), { type: 'button' });
const esito = (p, testo, errore = false) => { p.textContent = testo; p.dataset.errore = String(errore); p.hidden = !testo; };
const nuovoEsito = () => Object.assign(el('p', 'agg-esito'), { hidden: true });
function campo(etichetta, segnaposto, { tipo = 'text', complete = 'off' } = {}) {
  const label = el('label', 'agg-campo');
  label.append(el('span', null, etichetta));
  const input = el('input');
  input.type = tipo;
  input.placeholder = segnaposto;
  input.autocomplete = complete;
  input.spellcheck = false;
  label.append(input);
  return { label, input };
}

// Un nodo dell'albero: <details> con icona, nome, conteggio e (facoltativa) un'azione a destra
function nodo(titolo, { icona, apri = true, azione = null, classe = '' } = {}) {
  const det = el('details', `agg-nodo ${classe}`.trim());
  det.open = apri;
  const sommario = el('summary');
  const ico = el('span', 'agg-ico');
  ico.innerHTML = ICONE[icona] ?? '';
  const conteggio = el('span', 'agg-conteggio');
  sommario.append(ico, el('span', 'agg-nome', titolo), conteggio);
  if (azione) {
    const b = bottone('', 'agg-azione');
    b.innerHTML = ICONE[azione.icona];
    b.title = azione.titolo;
    b.setAttribute('aria-label', azione.titolo);
    b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); azione.suClic(); });
    sommario.append(b);
  }
  const figli = el('div', 'agg-figli');
  det.append(sommario, figli);
  return { det, figli, conteggio };
}

export function creaAlbero({ controllo, carica, avvisa }) {
  const radice = el('div', 'agg-albero');

  const cerca = el('input', 'agg-cerca');
  cerca.id = 'miei-cerca';
  cerca.type = 'search';
  cerca.placeholder = 'Cerca sorgenti dati…';
  cerca.setAttribute('aria-label', 'Cerca tra i servizi salvati');

  // file dal computer
  const selettore = Object.assign(el('input'), { type: 'file', multiple: true, accept: ESTENSIONI.join(','), hidden: true });
  selettore.addEventListener('change', async () => {
    const files = [...selettore.files];
    selettore.value = ''; // permette di riscegliere lo stesso file
    for (const file of files) await carica(file);
  });
  const dati = nodo('I miei dati', { icona: 'cartella', azione: { icona: 'carica', titolo: 'Carica file dal computer', suClic: () => selettore.click() } });
  dati.figli.append(el('p', 'agg-nota', 'GeoJSON, KML/KMZ, GPX, Shapefile (.zip) e CSV con latitudine e longitudine.'), selettore);

  const servizi = nodo('Servizi', { icona: 'cartella' });
  const rami = new Map();

  function riferisci(p, { pieno = false, errori = [] }, totale) {
    const ok = totale - errori.length;
    const parti = [];
    if (ok) parti.push(`${ok} ${ok === 1 ? 'layer aggiunto' : 'layer aggiunti'} alla mappa.`);
    if (pieno) parti.push(`Limite di ${TETTO_SERVIZI} servizi salvati raggiunto: questo non si salva.`);
    for (const e of errori) parti.push(`«${e.nome}»: ${e.messaggio}.`);
    esito(p, parti.join(' '), errori.length > 0 && !ok);
  }

  function mostraScelta(tipo, scelta, servizio, dati, esitoForm) {
    const voci = tipo === 'wms' ? servizio.layer : servizio.tipi;
    const righe = voci.map(v => {
      const label = el('label', 'agg-voce');
      const casella = el('input');
      casella.type = 'checkbox';
      casella.disabled = v.supportato === false;
      label.append(casella, ' ', v.titolo);
      if (v.supportato === false) label.append(' ', el('em', null, '(non supportato: serve EPSG:3857)'));
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
      const r = await (tipo === 'wms' ? controllo.aggiungiWms({ ...dati, servizio, scelti }) : controllo.aggiungiWfs({ ...dati, servizio, scelti }));
      vai.disabled = false;
      riferisci(esitoForm, r, scelti.length);
    });
  }

  function creaModulo(tipo) {
    const form = el('form', 'agg-modulo');
    form.noValidate = true;
    form.hidden = true;
    const nome = campo('Nome (facoltativo)', 'Come lo chiami');
    const url = campo(tipo.id === 'xyz' ? 'Indirizzo con {z}/{x}/{y}' : 'Indirizzo del servizio', tipo.esempio, { tipo: 'url' });
    const utente = campo('Utente (se serve)', 'Nome utente', { complete: 'off' });
    const password = campo('Password (se serve)', 'Resta solo finché la pagina è aperta', { tipo: 'password', complete: 'new-password' });
    const esitoForm = nuovoEsito();
    const credenziali = () => ({ utente: utente.input.value.trim() || undefined, password: password.input.value });
    form.append(nome.label, url.label, utente.label, password.label);
    if (tipo.id === 'xyz') {
      const vai = bottone('Aggiungi', 'agg-bottone agg-primario');
      vai.type = 'submit';
      form.append(vai, esitoForm);
      form.addEventListener('submit', e => {
        e.preventDefault();
        try {
          const { pieno } = controllo.aggiungiXyz({ nome: nome.input.value, url: url.input.value, ...credenziali() });
          esito(esitoForm, pieno ? `Aggiunto alla mappa. Hai raggiunto il limite di ${TETTO_SERVIZI} servizi salvati: questo non si salva.` : 'Aggiunto alla mappa.');
          password.input.value = '';
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
        const { utente: u, password: p } = credenziali();
        const servizio = await controllo.leggiServizio(tipo.id, url.input.value, { utente: u, password: p });
        password.input.value = ''; // la password è già in memoria nel controllo: non resta nel campo
        esito(esitoForm, '');
        mostraScelta(tipo.id, scelta, servizio, { nome: nome.input.value, url: servizio.url, utente: u }, esitoForm);
      } catch (errore) { esito(esitoForm, `Non riesco a leggere il servizio: ${errore.message}`, true); } finally { leggi.disabled = false; }
    });
    return form;
  }

  for (const tipo of TIPI) {
    const modulo = creaModulo(tipo);
    const ramo = nodo(tipo.titolo, {
      icona: 'cartella', apri: false, classe: 'agg-tipo',
      azione: { icona: 'piu', titolo: `Aggiungi un servizio ${tipo.titolo}`, suClic: () => { ramo.det.open = true; modulo.hidden = !modulo.hidden; if (!modulo.hidden) modulo.querySelector('input')?.focus(); } },
    });
    const elenco = el('div', 'agg-elenco');
    ramo.figli.append(modulo, elenco);
    rami.set(tipo.id, { ramo, elenco });
    servizi.figli.append(ramo.det);
  }

  // un servizio salvato: clic = in mappa; con il lucchetto chiede prima la password
  function rigaServizio(s) {
    const riga = el('div', 'agg-salvato');
    const serve = controllo.serveCredenziali(s.id);
    const apri = bottone('', 'agg-salvato-nome');
    if (serve) { const l = el('span', 'agg-ico'); l.innerHTML = ICONE.lucchetto; apri.append(l); }
    apri.append(el('span', null, s.nome));
    apri.title = serve ? `Serve la password di «${s.utente}» — ${s.url}` : `Metti in mappa — ${s.url}`;
    const togli = bottone('', 'agg-azione');
    togli.innerHTML = ICONE.cestino;
    togli.title = `Togli «${s.nome}» dai servizi salvati`;
    togli.setAttribute('aria-label', togli.title);
    togli.addEventListener('click', () => controllo.rimuovi(s.id));
    const esitoRiga = nuovoEsito();
    riga.append(apri, togli, esitoRiga);
    const fatto = ({ errori }) => (errori.length
      ? esito(esitoRiga, errori.map(e => `«${e.nome}»: ${e.messaggio}.`).join(' '), true)
      : avvisa(`«${s.nome}» è in mappa.`));
    apri.addEventListener('click', async () => {
      if (!serve) { apri.disabled = true; fatto(await controllo.riaggiungi(s.id)); apri.disabled = false; return; }
      if (riga.querySelector('form')) return;
      const form = el('form', 'agg-modulo');
      const pw = campo(`Password di ${s.utente}`, 'Resta solo finché la pagina è aperta', { tipo: 'password', complete: 'new-password' });
      const entra = bottone('Entra', 'agg-bottone agg-primario');
      entra.type = 'submit';
      form.append(pw.label, entra);
      form.addEventListener('submit', async e => {
        e.preventDefault();
        entra.disabled = true;
        const r = await controllo.riaggiungi(s.id, { password: pw.input.value });
        pw.input.value = '';
        entra.disabled = false;
        if (!r.errori.length) form.remove();
        fatto(r);
      });
      riga.append(form);
      pw.input.focus();
    });
    return riga;
  }

  function disegna() {
    const testo = cerca.value;
    const tutti = controllo.stato().servizi;
    const visibili = controllo.cerca(testo);
    for (const tipo of TIPI) {
      const { ramo, elenco } = rami.get(tipo.id);
      const suoi = tutti.filter(s => s.tipo === tipo.id);
      const mostrati = visibili.filter(s => s.tipo === tipo.id);
      ramo.conteggio.textContent = suoi.length ? String(suoi.length) : '';
      elenco.replaceChildren(...mostrati.map(rigaServizio));
      if (testo.trim() && mostrati.length) ramo.det.open = true;
    }
  }
  cerca.addEventListener('input', disegna);
  controllo.suCambio(disegna);
  disegna();

  const titoloLayer = el('p', 'agg-titolo-layer', 'Layer in mappa');
  radice.append(cerca, dati.det, servizi.det, titoloLayer);
  return radice;
}
```

- [ ] **Step 6: Riscrivere `js/aggiungi/index.js`**

```js
// js/aggiungi/index.js
// «I miei layer»: assembla host (prefisso «miei», memoria propria), controllo, credenziali in memoria e albero.
import { creaHost } from '../rndt/host.js';
import { creaControllo } from './controllo.js';
import { creaCredenziali, ospiteDi } from './credenziali.js';
import { creaAlbero } from './albero.js';
import { leggi, salva, CHIAVE_MIEI } from '../rndt/archivio.js';
import { anelliDaZone } from '../rndt/area.js';
import { importaFile } from '../rndt/importa.js';
import { librerie } from '../rndt/librerie.js';
import { archivioIndexedDB } from '../rndt/dati.js';
import { PROXY_RNDT } from '../rndt/index.js';
import { urlDati } from '../core/config.js';
import { segnala } from '../core/pannello.js';

export function collegaAggiungi(map, gruppo) {
  const storage = (() => { try { return window.localStorage; } catch { return null; } })();
  let anelli = [];
  // il confine comunale serve al filtro sui file e sui WFS; è lo stesso file delle zone, già in cache del browser
  const anelliPronti = fetch(urlDati('popolazione/confini_zone.json')).then(r => r.json()).then(z => { anelli = anelliDaZone(z); }).catch(() => {});

  const credenziali = creaCredenziali(); // solo in memoria: spariscono con la pagina
  let controllo = null;
  const host = creaHost({
    map, proxy: PROXY_RNDT, prefisso: 'miei', etichetta: 'aggiunti', stato: leggi(storage, CHIAVE_MIEI),
    scrivi: s => salva(storage, s, CHIAVE_MIEI), anelli: () => anelli, notifica: segnala, archivioDati: archivioIndexedDB(),
    autorizzazione: url => credenziali.intestazione(ospiteDi(url)),
    protetto: url => controllo?.protetto(url) ?? false,
  });
  controllo = creaControllo({ host, storage, credenziali });
  // i tile (WMS, XYZ) li chiede MapLibre: l'intestazione si aggiunge solo alle richieste dirette al nostro proxy
  map.setTransformRequest((url, tipo) => {
    const auth = credenziali.perUrlProxy(PROXY_RNDT, url);
    return auth ? { url, headers: { authorization: auth } } : { url };
  });

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

  gruppo.collega(host, () => {}, carica, () => creaAlbero({ controllo, carica, avvisa: segnala }));

  return {
    async ripristina() { await anelliPronti; await host.ripristina(); },
  };
}
```

- [ ] **Step 7: Togliere il pannello destro** — cancellare `js/aggiungi/pannello.js` (`git rm`). Poi:
  - `index.html`: eliminare `<aside id="aggiungi-pannello" …></aside>` e il pulsante `btn-aggiungi`.
  - `js/core/rail.js`: eliminare la voce `aggiungi:` di `ICONE`.
  - `js/app.js`: `const aggiungi = collegaAggiungi(map, gruppoMiei);` (senza il secondo argomento), eliminare la voce `aggiungi` dell'array della rail e la riga `document.getElementById('btn-aggiungi')…`.
  - `css/app.css`: rimettere i selettori com'erano prima del Task 6 del piano precedente (togliere `#aggiungi-pannello` dalle cinque regole: `body:has(…)`, posizione, `[hidden]`, media query, `.collassato`) e **sostituire** il blocco `/* Pannello «Aggiungi layer» */` con gli stili dell'albero:

```css
/* Albero di «I miei layer» (stile Browser di QGIS) */
.agg-albero { margin: 0 0 8px; }
.agg-cerca { width: 100%; margin: 0 0 8px; box-sizing: border-box; }
.agg-nodo > summary { display: flex; align-items: center; gap: 6px; padding: 4px 2px; cursor: pointer; font-weight: 600; list-style: none; }
.agg-nodo > summary::-webkit-details-marker { display: none; }
.agg-nodo > summary::before { content: '▸'; flex: none; width: 10px; color: var(--text-muted); font-size: 10px; }
.agg-nodo[open] > summary::before { content: '▾'; }
.agg-ico { flex: none; display: inline-grid; place-items: center; color: var(--text-muted); }
.agg-nome { flex: 1; min-width: 0; }
.agg-conteggio { flex: none; color: var(--text-muted); font-weight: 400; font-size: var(--fs-sm, 12px); }
.agg-azione { flex: none; width: 26px; height: 26px; border: 0; border-radius: var(--r-pill); background: none; color: var(--text-muted); display: inline-grid; place-items: center; cursor: pointer; }
.agg-azione:hover { background: var(--surface-hover); color: var(--text); }
.agg-figli { padding-left: 16px; }
.agg-tipo > summary { font-weight: 500; }
.agg-nota { margin: 2px 0 6px; color: var(--text-muted); font-size: var(--fs-sm, 12px); }
.agg-modulo { display: grid; gap: 6px; padding: 6px 0 8px; }
.agg-campo { display: grid; gap: 2px; font-size: var(--fs-sm, 13px); }
.agg-campo input { width: 100%; box-sizing: border-box; }
.agg-bottone { padding: 6px 10px; border: 1px solid var(--border-ui); border-radius: var(--r-sm); background: var(--surface); color: inherit; font: inherit; cursor: pointer; }
.agg-primario { background: var(--accent); color: var(--accent-ink); border-color: transparent; font-weight: 600; }
.agg-bottone:disabled { opacity: .6; cursor: progress; }
.agg-esito { margin: 0; font-size: var(--fs-sm, 13px); }
.agg-esito[data-errore="true"] { color: var(--avviso-scheda-ink); }
.agg-scelta { display: grid; gap: 4px; max-height: 240px; overflow: auto; }
.agg-voce em { color: var(--text-muted); }
.agg-salvato { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; padding: 1px 0; }
.agg-salvato-nome { flex: 1; min-width: 0; display: flex; align-items: center; gap: 6px; text-align: left; border: 0; background: none; color: var(--link); font: inherit; cursor: pointer; overflow-wrap: anywhere; }
.agg-salvato > .agg-esito, .agg-salvato > .agg-modulo { flex-basis: 100%; }
.agg-titolo-layer { margin: 10px 0 4px; font-weight: 700; font-size: var(--fs-sm, 12px); text-transform: uppercase; letter-spacing: .04em; color: var(--text-muted); }
```

- [ ] **Step 8: Verifica automatica** — `node --check js/aggiungi/albero.js js/aggiungi/index.js js/app.js` e `npm run test:js`. Expected: nessun errore di sintassi, tutti i test verdi.

- [ ] **Step 9: Verifica a mano nel browser** (server `python3 scripts/serve.py 8000`, proxy `cd worker && npx wrangler dev --port 8787`, app su `http://localhost:8000/?rndt-proxy=http://127.0.0.1:8787`; si può usare Playwright Node da `/tmp/pwtest`). Controllare, con la console senza errori:
  1. Il tab «I miei layer» a sinistra mostra ricerca, «I miei dati» (icona di caricamento), «Servizi» con XYZ/WMS/WFS (conteggio e «＋»), poi «Layer in mappa». Non c'è più un pannello destro «Aggiungi layer» né il pulsante nella barra strumenti.
  2. L'icona di caricamento di «I miei dati» apre il selettore; un GeoJSON compare tra i layer.
  3. XYZ (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`): aggiunto, il conteggio diventa 1, il servizio compare sotto XYZ; un clic lo rimette in mappa; il cestino lo toglie.
  4. WMS `https://ows.terrestris.de/osm/service`: «Leggi il servizio» elenca i layer, uno si aggiunge.
  5. Digitare in un modulo (ad es. nome e URL XYZ) e accendere/spegnere un layer: i campi non si svuotano e i rami restano aperti (il ridisegno non distrugge l'albero).
  6. Ricaricare la pagina: layer e servizi tornano.
  7. Credenziali con servizio reale protetto: `https://httpbin.org/basic-auth/user/pass` come XYZ-like non si può; provare via `curl -H "Origin: http://localhost:8000" -H "Authorization: Basic dXNlcjpwYXNz" http://127.0.0.1:8787/t/httpbin.org/basic-auth/user/pass` (Expected: 200 `{"authenticated": true…}`) e senza intestazione (Expected: 401, nessun `www-authenticate` nella risposta).
  8. Un servizio salvato con utente (creare uno XYZ con utente `u` e password `p`, poi ricaricare): la riga mostra il lucchetto, un clic chiede la password, «Entra» lo rimette in mappa; in `localStorage` (`dt:miei:servizi:v1`) c'è `"utente":"u"` e **nessuna** password.
  9. Finestra stretta (390 px): l'albero si usa dal tab sinistro.

- [ ] **Step 10: Commit**

```bash
git add -A js css index.html tests
git commit -m "feat(aggiungi): albero nel gruppo «I miei layer» e pannello destro eliminato

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Documentazione e chiusura

**Files:**
- Modify: `docs/AGGIUNGI_LAYER.md`, `js/core/guida-contenuti.js`, `docs/RNDT.md` (il Worker inoltra `Authorization`)

- [ ] **Step 1: `docs/AGGIUNGI_LAYER.md`** — riscrivere l'intestazione e la sezione sul pannello: tutto sta nel gruppo «I miei layer» della barra sinistra (albero: ricerca, I miei dati, Servizi XYZ/WMS/WFS con «＋», servizi salvati con 🔒 e cestino, «Layer in mappa»); aggiungere la sezione **Utente e password**: facoltativi nel modulo di ogni servizio; solo autenticazione Basic; restano in memoria finché la pagina è aperta, non si salvano mai (si salva solo il nome utente); alla riapertura un servizio con utente mostra il lucchetto e chiede la password; le credenziali passano dal nostro Worker, che le inoltra solo al servizio e non le registra; il Worker va ripubblicato (`npx wrangler deploy`); un token nell'URL si incolla nell'indirizzo.

- [ ] **Step 2: Guida e RNDT** — in `js/core/guida-contenuti.js`, nel passo `rndt-gruppo`, sostituire il riferimento al «pannello «Aggiungi layer» (pulsante nella barra strumenti)» con «dall'albero del gruppo «I miei layer»». In `docs/RNDT.md`, nella sezione sul proxy, una riga: «Il Worker inoltra l'intestazione `Authorization` al servizio richiesto (solo a quell'host), per i servizi che chiedono utente e password; non la registra».

- [ ] **Step 3: Chiusura** — `graphify update .`; `npm run test:js`; `git add -A docs js graphify-out && git commit -m "docs(aggiungi): albero e credenziali"`.

---

## Self-review (spec ↔ piano)

- **Pannello unico a sinistra, ad albero, con ricerca, I miei dati, XYZ/WMS/WFS con «＋», servizi salvati, «Layer in mappa»:** Task 4 (Step 5, 7).
- **Pannello destro, tab, pulsante eliminati:** Task 4 Step 7.
- **Credenziali solo in sessione, solo il nome utente salvato:** Task 2 (`credenziali.js`, `salvati.js`), Task 3 (test «mai la password»).
- **Lucchetto e richiesta della password alla riapertura; nessuna richiesta senza password; layer che si ricrea:** Task 2 (host), Task 3 (`serveCredenziali`, `protetto`, `riaggiungi`), Task 4 (riga del servizio).
- **401 in chiaro:** Task 2 Step 5/7.
- **Authorization verso il Worker per fetch e tile; Worker inoltra solo all'host richiesto, CORS esplicito, niente `WWW-Authenticate`:** Task 1, Task 2 (`autorizzazione`), Task 4 (`setTransformRequest`).
- **Stato dell'albero conservato nei ridisegni:** `intestazione()` chiamata una volta (Task 4 Step 3), verifica Step 9.5.
- **Coerenza dei nomi:** `creaCredenziali`/`ospiteDi`/`perUrlProxy` (Task 2) usati in Task 3 e 4; `controllo.protetto/serveCredenziali/cerca/credenziali/riaggiungi(id,{password})` (Task 3) usati in Task 4; `collega(host, apri, carica, intestazione)` (Task 4 Step 3) usato in `index.js`.
- **Rischio:** il tile `transformRequest` si prova solo a mano con un servizio protetto reale: si copre in Step 9.7–9.8 con `curl` e con il comportamento del Worker; un tile protetto reale resta da provare con un servizio vero dell'utente.
