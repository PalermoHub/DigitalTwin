import test from 'node:test';
import assert from 'node:assert/strict';
import { espressioneColori, coloraEdifici3d, impostaBaseEdifici3d } from '../../js/core/colori-3d.js';
import { EDIFICATO_NEUTRAL } from '../../js/core/palette.js';

const finta = () => {
  const paint = {};
  return { paint, getLayer: id => id === 'edifici-3d', setPaintProperty: (id, k, v) => { paint[`${id}.${k}`] = v; } };
};

test('senza layer registrati il colore resta quello neutro', () => {
  assert.equal(espressioneColori(new Map()), EDIFICATO_NEUTRAL);
});

test('i fid con lo stesso colore si raggruppano in un solo ramo del match', () => {
  const reg = new Map([['a', new Map([[1, '#f00'], [2, '#0f0'], [3, '#f00']])]]);
  assert.deepEqual(espressioneColori(reg), ['match', ['id'], [1, 3], '#f00', [2], '#0f0', EDIFICATO_NEUTRAL]);
});

test('tra due layer vince quello registrato per ultimo e nessun fid compare due volte', () => {
  const reg = new Map([['a', new Map([[1, '#f00'], [2, '#f00']])], ['b', new Map([[2, '#00f']])]]);
  assert.deepEqual(espressioneColori(reg), ['match', ['id'], [1], '#f00', [2], '#00f', EDIFICATO_NEUTRAL]);
});

test('coloraEdifici3d scrive il colore su edifici-3d e lo toglie quando il layer si svuota', () => {
  const map = finta();
  coloraEdifici3d(map, 'prova', new Map([[9, '#123456']]));
  assert.deepEqual(map.paint['edifici-3d.fill-extrusion-color'], ['match', ['id'], [9], '#123456', EDIFICATO_NEUTRAL]);
  coloraEdifici3d(map, 'prova', null);
  assert.equal(map.paint['edifici-3d.fill-extrusion-color'], EDIFICATO_NEUTRAL);
});

test('senza il layer edifici-3d non fa nulla', () => {
  const map = { getLayer: () => false, setPaintProperty: () => { throw new Error('non deve scrivere'); } };
  coloraEdifici3d(map, 'prova2', new Map([[1, '#fff']]));
  coloraEdifici3d(map, 'prova2', null);
});

import { senzaVolume, volumi3dAcceso } from '../../js/core/colori-3d.js';

test('senzaVolume aggiunge «senza fid» al filtro, anche se il filtro non c\'è', () => {
  assert.deepEqual(senzaVolume(null), ['!', ['has', 'fid']]);
  assert.deepEqual(senzaVolume(['in', ['get', 'tipo'], ['literal', ['A']]]), ['all', ['in', ['get', 'tipo'], ['literal', ['A']]], ['!', ['has', 'fid']]]);
});

test('volumi3dAcceso: vero solo se edifici-3d esiste ed è visibile', () => {
  assert.equal(volumi3dAcceso({ getLayer: () => null }), false);
  assert.equal(volumi3dAcceso({ getLayer: () => ({}), getLayoutProperty: () => 'none' }), false);
  assert.equal(volumi3dAcceso({ getLayer: () => ({}), getLayoutProperty: () => 'visible' }), true);
});

test('la base del tema sta sotto i layer: i fid colorati restano, gli altri prendono il tema', () => {
  const map = finta();
  const base = ['case', true, '#111', '#222'];
  impostaBaseEdifici3d(map, base);
  assert.deepEqual(map.paint['edifici-3d.fill-extrusion-color'], base);
  coloraEdifici3d(map, 'prova3', new Map([[5, '#abcdef']]));
  assert.deepEqual(map.paint['edifici-3d.fill-extrusion-color'], ['match', ['id'], [5], '#abcdef', base]);
  impostaBaseEdifici3d(map, null);
  assert.deepEqual(map.paint['edifici-3d.fill-extrusion-color'], ['match', ['id'], [5], '#abcdef', EDIFICATO_NEUTRAL]);
  coloraEdifici3d(map, 'prova3', null);
  assert.equal(map.paint['edifici-3d.fill-extrusion-color'], EDIFICATO_NEUTRAL);
});
