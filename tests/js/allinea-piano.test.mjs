import test from 'node:test';
import assert from 'node:assert/strict';
import { allineaLayerAlPiano, sollevamento, QUOTA_PX } from '../../js/core/allinea-piano.js';

test('il sollevamento è 0 in 2D e cresce con l\'inclinazione', () => {
  assert.ok(sollevamento(0) === 0);
  assert.ok(sollevamento(30) > sollevamento(60) && sollevamento(30) < 0);
  assert.ok(Math.abs(sollevamento(60) + QUOTA_PX) < 1e-9);
  assert.ok(Math.abs(sollevamento(80) + QUOTA_PX) < 1e-9);
});

test('simboli e cerchi seguono il beccheggio della mappa', () => {
  let pitch = 0, suPitch;
  const scritte = [];
  const map = {
    addLayer() {}, getLayer: () => true, getPitch: () => pitch, on: (e, f) => { if (e === 'pitch') suPitch = f; },
    setPaintProperty: (id, p, v) => scritte.push([id, p, v]),
  };
  allineaLayerAlPiano(map);
  map.addLayer({ id: 's', type: 'symbol' });
  map.addLayer({ id: 'c', type: 'circle' });
  pitch = 60; suPitch();
  const ultime = scritte.slice(-3);
  assert.deepEqual(ultime.map(x => x[1]), ['icon-translate', 'text-translate', 'circle-translate']);
  assert.ok(ultime.every(x => x[2][1] === -QUOTA_PX));
});
