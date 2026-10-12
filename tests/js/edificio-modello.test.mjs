import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GRUPPI, altezze, tipiAccesi, filtroVolumi, filtroNumeri, righeScheda, pianiDa, prospettiVisibili,
  stanzeDelClic, poligonoContiene } from '../../js/edificio/modello.js';
import { verticiFacciata } from '../../js/edificio/prospetti.js';

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
  const ammessi = new Set(['piano', 'nome_piano', 'livello', 'tipo', 'nome', 'numero', 'area', 'quota', 'h']);
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

test('prospettiVisibili: solo a piani riuniti, fuori dalla pianta, con le murature', () => {
  const base = { acceso: true, passo: 0, pianta: null, gruppi: ['muri'], piani: ['terra', 'primo'] };
  assert.equal(prospettiVisibili(base), true);
  assert.equal(prospettiVisibili({ ...base, acceso: false }), false);
  assert.equal(prospettiVisibili({ ...base, passo: 4 }), false);
  assert.equal(prospettiVisibili({ ...base, pianta: 'primo' }), false);
  assert.equal(prospettiVisibili({ ...base, gruppi: ['solai'] }), false);
});

test('verticiFacciata: terra e cima sugli stessi spigoli, relativi all\'origine', () => {
  const mercator = ([x, y], z) => ({ x, y, z: z / 10 });
  const v = verticiFacciata([1, 2], [3, 2], 20, { x: 1, y: 2, z: 0 }, mercator);
  assert.deepEqual(v, [[0, 0, 0], [2, 0, 0], [2, 0, 2], [0, 0, 2]]);
});

test('prospetti.json: tre facciate con immagine e spigoli vicini all\'edificio', () => {
  const p = JSON.parse(readFileSync(new URL('../../dati/edificio/crociferi/prospetti.json', import.meta.url), 'utf8'));
  assert.deepEqual(p.map(f => f.lato), ['sud', 'ovest', 'est']);
  for (const f of p) {
    assert.ok(f.altezza > 15 && f.altezza < 30);
    for (const [x, y] of [f.da, f.a]) assert.ok(Math.abs(x - 13.3728) < 0.0005 && Math.abs(y - 38.1166) < 0.0005);
  }
});

test('stanzeDelClic: il numero c\'è anche cliccando solaio o muro', () => {
  const q = (x0, y0, x1, y1) => ({ type: 'Polygon', coordinates: [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]] });
  const st = (n, g) => ({ properties: { tipo: 'stanza', piano: 'primo', numero: n }, geometry: g });
  const features = [st('23', q(0, 0, 1, 1)), st('24', q(1.1, 0, 2, 1)), { properties: { tipo: 'stanza', piano: 'secondo', numero: '13' }, geometry: q(0, 0, 1, 1) }];
  const muro = { properties: { tipo: 'muro', piano: 'primo' }, geometry: q(1, 0, 1.1, 1) };
  const solaio = { properties: { tipo: 'solaio', piano: 'primo' }, geometry: q(0, 0, 2, 1) };
  assert.deepEqual(stanzeDelClic(features[0], [0.5, 0.5], features), { stanza: '23' });
  assert.deepEqual(stanzeDelClic(solaio, [1.5, 0.5], features), { stanza: '24' });
  assert.deepEqual(stanzeDelClic(solaio, [5, 5], features), {});
  assert.deepEqual(stanzeDelClic(muro, [1.05, 0.5], features), { adiacenti: ['23', '24'] });
  // un muro lungo tocca molte stanze: restano le più vicine al clic
  const spina = { properties: { tipo: 'muro', piano: 'primo' }, geometry: q(0, 1, 2, 1.000003) };
  assert.deepEqual(stanzeDelClic(spina, [0.2, 1.000001], features), { adiacenti: ['23'] });
  assert.deepEqual(righeScheda({ ...muro.properties, quota: 6.3, h: 11.5 }, { adiacenti: ['23', '24'] })[2], ['Stanze adiacenti', '23, 24']);
  assert.deepEqual(righeScheda({ ...solaio.properties, quota: 6.3 }, { stanza: '24' })[2], ['Stanza n.', '24']);
});

test('poligonoContiene: esclude i fori', () => {
  const ciambella = [[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]], [[1, 1], [3, 1], [3, 3], [1, 3], [1, 1]]];
  assert.equal(poligonoContiene(ciambella, [0.5, 0.5]), true);
  assert.equal(poligonoContiene(ciambella, [2, 2]), false);
});

test('il corpo della chiesa al piano terra ha il suo nome (aula, servizi, magazzini), anche nella scheda', () => {
  const nominate = fc.features.filter(f => f.properties.nome);
  assert.ok(nominate.length > 1);
  for (const f of nominate) {
    assert.equal(f.properties.nome, 'Ex Chiesa di San Mattia dei Crociferi');
    assert.equal(f.properties.piano, 'terra');
  }
  const aula = nominate.find(f => f.properties.area > 300).properties;
  assert.deepEqual(righeScheda(aula)[1], ['Elemento', 'Ex Chiesa di San Mattia dei Crociferi']);
  // le stanze dell'ala sud oltre il passaggio no
  assert.ok(!nominate.some(f => f.properties.numero === '39'));
});
