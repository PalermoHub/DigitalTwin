import test from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../../js/geoimage/geometria.js';

const vicino = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} ≠ ${b}`);
// quadrato centrato all'equatore (cos lat = 1): NO, NE, SO, SE
const q = [{ lat: 1, lng: -1 }, { lat: 1, lng: 1 }, { lat: -1, lng: -1 }, { lat: -1, lng: 1 }];

test('centro e passo (5 % del lato più corto)', () => {
  const c = G.centro(q);
  vicino(c.lat, 0); vicino(c.lng, 0);
  vicino(G.passo(q), 0.1);
});

test('sposta trasla tutti gli angoli', () => {
  const s = G.sposta(q, 1, 2);
  vicino(s[0].lat, 2); vicino(s[0].lng, 1);
});

test('ruota in senso orario: 90° porta il nord-ovest sul nord-est', () => {
  const quadrato = [{ lat: 0.5, lng: -0.5 }, { lat: 0.5, lng: 0.5 }, { lat: -0.5, lng: -0.5 }, { lat: -0.5, lng: 0.5 }];
  const r = G.ruota(quadrato, 90);
  vicino(r[0].lat, 0.5, 1e-3); vicino(r[0].lng, 0.5, 1e-3);
});

test('ruotare di 360° riporta gli angoli dove erano', () => {
  const r = G.ruota(q, 360);
  q.forEach((p, i) => { vicino(r[i].lat, p.lat); vicino(r[i].lng, p.lng); });
});

test('scala ingrandisce rispetto al centro', () => {
  const s = G.scala(q, 2);
  vicino(s[1].lat, 2); vicino(s[1].lng, 2);
});

test('scalaDaAngolo tiene fermo l\'angolo opposto e non deforma', () => {
  const s = G.scalaDaAngolo(q, 0, { lat: 3, lng: -3 });
  vicino(s[3].lat, -1); vicino(s[3].lng, 1);
  vicino(s[0].lat, 3); vicino(s[0].lng, -3);
  vicino(s[1].lat, 3); vicino(s[1].lng, 1);
});

test('scalaDaAngolo con l\'angolo sull\'ancora (trascinamento degenere) non cambia nulla', () => {
  const nulla = q.map(() => ({ lat: 0, lng: 0 }));
  assert.deepEqual(G.scalaDaAngolo(nulla, 0, { lat: 1, lng: 1 }), nulla);
});

test('geoAPixel: il centro è a metà immagine, un punto lontano non è valido', () => {
  const p = G.geoAPixel(q, 200, 100, 0, 0);
  assert.equal(p.px, 100); assert.equal(p.py, 50); assert.equal(p.valido, true);
  assert.equal(G.geoAPixel(q, 200, 100, 5, 5).valido, false);
});

test('limiti in formato [[ovest, sud], [est, nord]]', () => {
  assert.deepEqual(G.limiti(q), [[-1, -1], [1, 1]]);
});

test('angoliIniziali conserva le proporzioni e sta nel 38 % della vista', () => {
  const a = G.angoliIniziali({ centro: { lat: 38, lng: 13 }, nord: 38.1, sud: 37.9, est: 13.2, ovest: 12.8 }, 200, 100);
  vicino((a[1].lng - a[0].lng) / (a[0].lat - a[2].lat), 2);
  assert.ok(a[1].lng - a[0].lng <= (13.2 - 12.8) * 0.38 + 1e-12);
});

test('postoRotazione sta oltre il lato nord', () => {
  const p = G.postoRotazione(q);
  vicino(p.lat, 1.3); vicino(p.lng, 0);
});
