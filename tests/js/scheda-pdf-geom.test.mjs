import test from 'node:test';
import assert from 'node:assert/strict';
import { areaMq, estremi, particellaUnica } from '../../js/core/scheda-pdf-geom.js';

// quadrato ~100 m x 100 m a Palermo (1° lat ≈ 111,2 km; 1° lng ≈ 87,4 km a 38,1°)
const quadrato = (x, y, w = 0.001144, h = 0.0009) => ({ type: 'Polygon', coordinates: [[[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]]] });

test('areaMq: un quadrato di circa 100 m di lato vale circa 10.000 m²; un buco si sottrae', () => {
  const a = areaMq(quadrato(13.36, 38.11));
  assert.ok(a > 9500 && a < 10500, `area ${a}`);
  const conBuco = { type: 'Polygon', coordinates: [...quadrato(13.36, 38.11).coordinates, [[13.3603, 38.1102], [13.3603, 38.1105], [13.3607, 38.1105], [13.3607, 38.1102], [13.3603, 38.1102]]] };
  assert.ok(areaMq(conBuco) < a);
  assert.equal(areaMq({ type: 'Point', coordinates: [0, 0] }), 0);
});

test('estremi: riquadro [ovest, sud, est, nord] di una o più geometrie', () => {
  const e = estremi([quadrato(13.36, 38.11, 0.002, 0.001), quadrato(13.37, 38.12, 0.001, 0.001)]);
  [13.36, 38.11, 13.371, 38.121].forEach((v, i) => assert.ok(Math.abs(e[i] - v) < 1e-9));
});

test('particellaUnica: un solo pezzo dà la geometria; pezzi uguali (stesso tile letto due volte) si contano una volta; pezzi diversi no', () => {
  const g = quadrato(13.36, 38.11);
  assert.deepEqual(particellaUnica([{ geometry: g }, { geometry: structuredClone(g) }]), g);
  assert.equal(particellaUnica([{ geometry: g }, { geometry: quadrato(13.361, 38.11) }]), null); // tagliata dai tile: area non affidabile
  assert.equal(particellaUnica([]), null);
});
