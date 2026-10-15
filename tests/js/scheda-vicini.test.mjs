import test from 'node:test';
import assert from 'node:assert/strict';
import { featureVicine, distanzaApprossimataM } from '../../js/core/scheda-util.js';
import { evidenzaVicine } from '../../js/core/evidenza.js';

// mappa finta: 1 pixel = 1 m a est, quindi il riquadro di ricerca è facile da verificare
const LAT = 38.1;
const M = 111320;
const kx = Math.cos(LAT * Math.PI / 180);
const px = ({ lng, lat }) => ({ x: (lng - 13.3) * M * kx, y: -(lat - LAT) * M });
const punto = (layer, id, dxM, dyM) => ({
  layer: { id: layer }, properties: { id }, geometry: { type: 'Point', coordinates: [13.3 + dxM / (M * kx), LAT + dyM / M] },
});
const mappaCon = features => ({
  project: px,
  queryRenderedFeatures: (box, { layers }) => {
    const [[x0, y0], [x1, y1]] = box;
    return features.filter(f => layers.includes(f.layer.id)).filter(f => { const p = px({ lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] }); return p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1; });
  },
});
const CLIC = { lng: 13.3, lat: LAT };

test('distanzaApprossimataM: ~111 m per 0,001° di latitudine', () => {
  assert.ok(Math.abs(distanzaApprossimataM([13.3, 38.1], [13.3, 38.101]) - 111.32) < 0.5);
});

test('featureVicine: entro il raggio, dal più vicino, con la distanza', () => {
  const f = [punto('a', '1', 250, 0), punto('a', '2', 100, 0), punto('a', '3', 400, 0)];
  const r = featureVicine(mappaCon(f), CLIC, ['a'], { raggio: 300 });
  assert.deepEqual(r.map(x => x.properties.id), ['2', '1']);
  assert.ok(Math.abs(r[0].distanzaM - 100) < 1);
});

test('featureVicine: al massimo `max`, escluse le già trovate, solo punti, solo i layer richiesti', () => {
  const poligono = { layer: { id: 'a' }, properties: { id: 'P' }, geometry: { type: 'Polygon', coordinates: [[[13.3, LAT]]] } };
  const f = [punto('a', '1', 50, 0), punto('a', '2', 60, 0), punto('a', '3', 70, 0), punto('b', '4', 10, 0), poligono];
  const m = mappaCon(f);
  assert.deepEqual(featureVicine(m, CLIC, ['a'], { raggio: 300, max: 2 }).map(x => x.properties.id), ['1', '2']);
  assert.deepEqual(featureVicine(m, CLIC, ['a'], { raggio: 300 }, [f[0]]).map(x => x.properties.id), ['2', '3']);
  assert.deepEqual(featureVicine(m, CLIC, [], { raggio: 300 }), []);
});

test('featureVicine: un punto duplicato dai tile compare una volta', () => {
  const f = [punto('a', '1', 50, 0), punto('a', '1', 50, 0)];
  assert.equal(featureVicine(mappaCon(f), CLIC, ['a'], { raggio: 300 }).length, 1);
});

test('evidenzaVicine: una scelta per layer con fonte, nei colori della fonte; layer senza fonte ignorati', () => {
  const v = [punto('fontanelle-hit-punti', '1', 50, 0), punto('fontanelle-hit-punti', '2', 60, 0), punto('sconosciuto', '3', 5, 0)];
  const e = evidenzaVicine(v);
  assert.equal(e.length, 1);
  assert.equal(e[0].id, 'fontanelle-hit-punti-vicini');
  assert.equal(e[0].colore, '#1c7ed6');
  assert.equal(e[0].features.length, 2);
});
