import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GRUPPI, altezze, tipiAccesi, filtroVolumi, filtroNumeri, righeScheda, pianiDa } from '../../js/edificio/modello.js';

const fc = JSON.parse(readFileSync(new URL('../../dati/edificio/crociferi/crociferi.geojson', import.meta.url), 'utf8'));

test('altezze: l\'esploso sposta base e cima dello stesso passo per livello', () => {
  const { base, cima } = altezze(5);
  assert.deepEqual(base[2], ['*', ['coalesce', ['get', 'livello'], 0], 5]);
  assert.deepEqual(cima[2], base[2]);
});

test('filtri: piani e gruppi accesi; i vuoti non sono mai un volume', () => {
  assert.deepEqual(tipiAccesi(['muri', 'solai']), ['muro', 'tamburo', 'solaio']);
  const f = filtroVolumi(['primo'], GRUPPI.map(g => g.id));
  assert.deepEqual(f[2], ['in', ['get', 'piano'], ['literal', ['primo']]]);
  assert.ok(!f[3][2][1].includes('vuoto'));
  assert.deepEqual(filtroNumeri([])[2], ['in', ['get', 'piano'], ['literal', []]]);
});

test('righeScheda: stanza con numero e superficie, muro con le quote', () => {
  assert.deepEqual(righeScheda({ piano: 'primo', nome_piano: 'Piano primo', tipo: 'stanza', numero: '30', area: 49.4, quota: 7.5 }),
    [['Piano', 'Piano primo'], ['Elemento', 'Stanza'], ['Stanza n.', '30'], ['Superficie', '49,4 m²'], ['Quota di calpestio', '7,50 m']]);
  assert.deepEqual(righeScheda({ piano: 'terra', tipo: 'muro', quota: 0, h: 4 }).slice(2),
    [['Da quota', '0,00 m'], ['A quota', '4,00 m']]);
});

test('pianiDa: dai metadati, dal basso verso l\'alto', () => {
  const p = pianiDa(fc);
  assert.deepEqual(p.map(x => x.id), ['terra', 'ammezzato', 'primo', 'secondo', 'terzo', 'copertura']);
  assert.deepEqual(pianiDa({ features: [{ properties: { piano: 'b', livello: 1 } }, { properties: { piano: 'a', livello: 0 } }] })
    .map(x => x.id), ['a', 'b']);
});

test('dati: 39 stanze numerate, ognuna una volta, e nessun testo oltre ai numeri', () => {
  const stanze = fc.features.filter(f => f.properties.tipo === 'stanza' && f.properties.numero);
  const numeri = stanze.map(f => f.properties.numero);
  assert.equal(numeri.length, 39);
  assert.deepEqual([...numeri].sort((a, b) => a - b), Array.from({ length: 39 }, (_, i) => String(i + 1)));
  const ammessi = new Set(['piano', 'nome_piano', 'livello', 'tipo', 'numero', 'area', 'quota', 'h']);
  for (const f of fc.features) {
    for (const k of Object.keys(f.properties)) assert.ok(ammessi.has(k), `proprietà inattesa ${k}`);
    if (f.properties.numero != null) assert.match(f.properties.numero, /^\d+$/);
  }
});

test('dati: tutto attorno al Cortile Crociferi, quote coerenti', () => {
  for (const f of fc.features) {
    const p = f.properties;
    const pts = f.geometry.type === 'Point' ? [f.geometry.coordinates] : f.geometry.coordinates.flat();
    for (const [x, y] of pts) assert.ok(Math.abs(x - 13.3728) < 0.0008 && Math.abs(y - 38.1166) < 0.0008, `${p.tipo} fuori posto`);
    if (p.h != null) assert.ok(p.h >= p.quota, `${p.piano}/${p.tipo}: cima sotto la base`);
  }
});
