import test from 'node:test';
import assert from 'node:assert/strict';
import { sceltePerLayer, collezione, soloCliccato } from '../../js/core/evidenza.js';

const poly = { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] };
const f = (id, properties, geometry = poly) => ({ layer: { id }, properties, geometry });

test('tiene la feature e i suoi frammenti, non i vicini', () => {
  const s = sceltePerLayer([f('catasto-hit', { a: 1 }), f('catasto-hit', { a: 1 }), f('catasto-hit', { a: 2 })], { lng: 0, lat: 0 });
  assert.equal(s.length, 1);
  assert.equal(s[0].features.length, 2);
});

test('ignora layer senza fonte e usa il punto di griglia più vicino', () => {
  const p = (x, n) => f('griglia-hit', { n }, { type: 'Point', coordinates: [x, 0] });
  const s = sceltePerLayer([f('altro', {}), p(5, 'lontano'), p(1, 'vicino')], { lng: 0, lat: 0 });
  assert.equal(s.length, 1);
  assert.equal(s[0].features[0].properties.n, 'vicino');
});

test('collezione colora per fonte', () => {
  const s = sceltePerLayer([f('prg-zto-hit', {}), f('prg-cs-hit', {}), f('pop-hit', {})], { lng: 0, lat: 0 });
  assert.equal(collezione(s).features.length, 3);
  assert.equal(collezione(s).features[2].properties.colore, '#1c7ed6');
});

test('clic fuori dagli edifici evidenzia solo il punto, su un edificio il poligono', () => {
  const pt = { type: 'Point', coordinates: [0, 0] };
  const s = sceltePerLayer([f('edifici-hit', {}), f('scuole-hit-punti', {}, pt), f('catasto-hit', {})], { lng: 0, lat: 0 });
  assert.deepEqual(soloCliccato(s.filter(x => x.id !== 'edifici-hit')).map(x => x.id), ['scuole-hit-punti']);
  const dentro = sceltePerLayer([f('edifici-hit', {}), f('scuole-hit-poli', {}), f('scuole-hit-punti', {}, pt)], { lng: 0, lat: 0 });
  assert.deepEqual(soloCliccato(dentro).map(x => x.id), ['scuole-hit-poli']);
  const g = sceltePerLayer([f('edifici-hit', {}), f('griglia-hit', {}, pt)], { lng: 0, lat: 0 });
  assert.deepEqual(soloCliccato(g).map(x => x.id), ['edifici-hit']);
});

test('trasporto: fermata e linea hanno etichetta e colore; la fermata è la cosa evidenziata', async () => {
  const { FONTI } = await import('../../js/core/evidenza.js');
  assert.equal(FONTI['trasporto-hit-fermate'].etichetta, 'Fermata');
  assert.equal(FONTI['trasporto-hit-linee'].etichetta, 'Linea');
  const punto = { type: 'Point', coordinates: [0, 0] };
  const linea = { type: 'LineString', coordinates: [[0, 0], [1, 1]] };
  const s = sceltePerLayer([f('trasporto-hit-linee', { id: 'l' }, linea), f('trasporto-hit-fermate', { id: 'S1' }, punto)], { lng: 0, lat: 0 });
  assert.deepEqual(soloCliccato(s).map(x => x.id), ['trasporto-hit-fermate']);
});
