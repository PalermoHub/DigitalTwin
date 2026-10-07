// tests/js/aggiungi-da-url.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizzaUrl, urlViaProxy, scaricaComeFile } from '../../js/aggiungi/da-url.js';

const PROXY = 'https://proxy.example.workers.dev';
const risposta = (corpo, { stato = 200, tipo = 'text/csv' } = {}) =>
  new Response(corpo, { status: stato, headers: { 'content-type': tipo } });

test('normalizzaUrl: Google Sheets diventa export CSV, con gid se presente', () => {
  assert.deepEqual(
    normalizzaUrl('https://docs.google.com/spreadsheets/d/ABC_123-x/edit?usp=sharing'),
    { url: 'https://docs.google.com/spreadsheets/d/ABC_123-x/export?format=csv', nome: 'foglio-ABC_123-x.csv', foglio: true });
  assert.equal(
    normalizzaUrl('https://docs.google.com/spreadsheets/d/ABC/edit#gid=456').url,
    'https://docs.google.com/spreadsheets/d/ABC/export?format=csv&gid=456');
  assert.equal(
    normalizzaUrl('https://docs.google.com/spreadsheets/d/ABC/edit?gid=7&usp=sharing').url,
    'https://docs.google.com/spreadsheets/d/ABC/export?format=csv&gid=7');
});

test('normalizzaUrl: Google Drive file diventa download diretto', () => {
  const r = normalizzaUrl('https://drive.google.com/file/d/XYZ-9/view?usp=sharing');
  assert.equal(r.url, 'https://drive.google.com/uc?export=download&id=XYZ-9');
  assert.equal(r.foglio, false);
});

test('normalizzaUrl: altri indirizzi https restano invariati, il nome viene dal percorso', () => {
  const r = normalizzaUrl('  https://dati.example.org/open/punti%20cari.geojson?v=2 ');
  assert.equal(r.url, 'https://dati.example.org/open/punti%20cari.geojson?v=2');
  assert.equal(r.nome, 'punti cari.geojson');
});

test('normalizzaUrl: rifiuta ciò che non è https', () => {
  assert.throws(() => normalizzaUrl('http://example.org/a.csv'), /https/);
  assert.throws(() => normalizzaUrl('ftp://example.org/a.csv'), /https/);
  assert.throws(() => normalizzaUrl('non un indirizzo'), /non valido/);
  assert.throws(() => normalizzaUrl(''), /non valido/);
});

test('urlViaProxy: host e percorso passano dal Worker', () => {
  assert.equal(
    urlViaProxy(PROXY + '/', 'https://docs.google.com/spreadsheets/d/A/export?format=csv&gid=1'),
    `${PROXY}/t/docs.google.com/spreadsheets/d/A/export?format=csv&gid=1`);
});

test('scaricaComeFile: CSV di un foglio → oggetto simile a File', async () => {
  let richiesto;
  const f = await scaricaComeFile('https://docs.google.com/spreadsheets/d/A/edit', PROXY, async u => { richiesto = u; return risposta('lat,lon\n38,13\n'); });
  assert.equal(richiesto, `${PROXY}/t/docs.google.com/spreadsheets/d/A/export?format=csv`);
  assert.equal(f.name, 'foglio-A.csv');
  assert.equal(await f.text(), 'lat,lon\n38,13\n');
  assert.ok((await f.arrayBuffer()) instanceof ArrayBuffer);
});

test('scaricaComeFile: senza estensione nel nome si ricava dal Content-Type', async () => {
  const f = await scaricaComeFile('https://dati.example.org/api/punti', PROXY, async () => risposta('{}', { tipo: 'application/geo+json; charset=utf-8' }));
  assert.equal(f.name, 'punti.geojson');
  const k = await scaricaComeFile('https://dati.example.org/dl', PROXY, async () => risposta('x', { tipo: 'application/vnd.google-earth.kml+xml' }));
  assert.equal(k.name, 'dl.kml');
});

test('scaricaComeFile: foglio privato (pagina HTML di login) → messaggio sulla condivisione', async () => {
  await assert.rejects(
    scaricaComeFile('https://docs.google.com/spreadsheets/d/A/edit', PROXY, async () => risposta('<!doctype html><html>', { tipo: 'text/html; charset=utf-8' })),
    /chiunque abbia il link/);
});

test('scaricaComeFile: errori del proxy e della rete', async () => {
  await assert.rejects(scaricaComeFile('https://a.example.org/x.csv', PROXY, async () => risposta('{"errore":"risposta troppo grande"}', { stato: 413, tipo: 'application/json' })), /10 MB/);
  await assert.rejects(scaricaComeFile('https://a.example.org/x.csv', PROXY, async () => risposta('', { stato: 404 })), /404/);
  await assert.rejects(scaricaComeFile('https://a.example.org/x.csv', PROXY, async () => { throw new TypeError('fetch failed'); }), /raggiungere/);
});

test('scaricaComeFile: foglio inesistente o privato (404/403) → messaggio sulla condivisione', async () => {
  for (const stato of [401, 403, 404]) {
    await assert.rejects(scaricaComeFile('https://docs.google.com/spreadsheets/d/A/edit', PROXY, async () => risposta('', { stato })), /non trovato o non condiviso/);
  }
});

test('scaricaComeFile: pagina HTML su un indirizzo qualunque → non è un file di dati', async () => {
  await assert.rejects(
    scaricaComeFile('https://a.example.org/pagina', PROXY, async () => risposta('<html>', { tipo: 'text/html' })),
    /pagina web/);
});
