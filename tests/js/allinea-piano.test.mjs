import test from 'node:test';
import assert from 'node:assert/strict';
import { allineaLayerAlPiano, sollevamento, QUOTA_MAX_PX, pixelPerMetro } from '../../js/core/allinea-piano.js';

test('il sollevamento è 0 in 2D, cresce con inclinazione e zoom, ha un tetto', () => {
  assert.ok(sollevamento(0) === 0);
  assert.ok(sollevamento(30) > sollevamento(60) && sollevamento(30) < 0);
  assert.ok(sollevamento(60, 19) < sollevamento(60, 16));
  assert.equal(sollevamento(80, 20), -QUOTA_MAX_PX);
  assert.ok(pixelPerMetro(17.5) > 2 && pixelPerMetro(17.5) < 4);
});

test('simboli e cerchi seguono il beccheggio della mappa', () => {
  let pitch = 0, suPitch;
  const scritte = [];
  const map = {
    addLayer() {}, getLayer: () => true, getPitch: () => pitch, getZoom: () => 17.5, getCenter: () => ({ lat: 38.1 }), on: (e, f) => { if (e === 'pitch') suPitch = f; },
    setPaintProperty: (id, p, v) => scritte.push([id, p, v]),
  };
  allineaLayerAlPiano(map);
  map.addLayer({ id: 's', type: 'symbol' });
  map.addLayer({ id: 'c', type: 'circle' });
  pitch = 60; suPitch();
  const ultime = scritte.slice(-3);
  assert.deepEqual(ultime.map(x => x[1]), ['icon-translate', 'text-translate', 'circle-translate']);
  assert.ok(ultime.every(x => x[2][1] === sollevamento(60)));
  // ancora 'viewport': la rotazione della mappa non sposta il segnaposto
  assert.ok(scritte.some(x => x[1] === 'circle-translate-anchor' && x[2] === 'viewport'));
  assert.ok(scritte.some(x => x[1] === 'icon-translate-anchor' && x[2] === 'viewport'));
});
