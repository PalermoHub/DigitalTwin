import test from 'node:test';
import assert from 'node:assert/strict';
import { calcolaAffine, calcolaPoly2, calcolaTrasformazione, applica, inversa, residui, rmse, minimoGcp } from '../../js/geoimage/trasformazioni.js';

// una trasformazione nota, a scala di pixel realistica (immagine 3000×2000)
const veraAffine = (px, py) => ({ lng: 13.36 + 1.2e-5 * px + 3e-6 * py, lat: 38.12 - 1.1e-5 * py + 2e-6 * px });
const veraPoly2 = (px, py) => ({
  lng: 13.36 + 1.2e-5 * px + 3e-6 * py + 1e-10 * px * px - 2e-10 * px * py + 4e-11 * py * py,
  lat: 38.12 - 1.1e-5 * py + 2e-6 * px + 5e-11 * px * px + 1e-10 * py * py,
});
const gcpDa = (vera, punti) => punti.map(([px, py]) => ({ px, py, ...vera(px, py) }));

test('i minimi: 3 GCP per l\'affine, 6 per la poly2', () => {
  assert.equal(minimoGcp('poly1'), 3);
  assert.equal(minimoGcp('poly2'), 6);
});

test('affine: ritrova i coefficienti e l\'errore è zero su dati esatti', () => {
  const gcp = gcpDa(veraAffine, [[0, 0], [3000, 0], [0, 2000], [3000, 2000], [1500, 1000]]);
  const t = calcolaAffine(gcp);
  assert.ok(Math.abs(t.a - 1.2e-5) < 1e-12 && Math.abs(t.e + 1.1e-5) < 1e-12);
  assert.ok(rmse(residui(t, gcp)) < 1e-6);
});

test('affine: l\'inversa riporta alle coordinate pixel', () => {
  const gcp = gcpDa(veraAffine, [[0, 0], [3000, 0], [0, 2000]]);
  const t = calcolaAffine(gcp);
  const p = inversa(t, gcp[1].lng, gcp[1].lat);
  assert.ok(Math.abs(p.px - 3000) < 1e-4 && Math.abs(p.py) < 1e-4);
});

test('con meno GCP del minimo, o tutti allineati, non c\'è trasformazione', () => {
  assert.equal(calcolaAffine(gcpDa(veraAffine, [[0, 0], [10, 10]])), null);
  assert.equal(calcolaAffine(gcpDa(veraAffine, [[0, 0], [10, 10], [20, 20]])), null, 'collineari');
  assert.equal(calcolaPoly2(gcpDa(veraPoly2, [[0, 0], [3000, 0], [0, 2000], [3000, 2000], [1500, 1000]])), null);
});

test('poly2: errore trascurabile su dati esatti e inversa con Newton', () => {
  const gcp = gcpDa(veraPoly2, [[0, 0], [3000, 0], [0, 2000], [3000, 2000], [1500, 1000], [700, 1500], [2200, 300], [400, 300]]);
  const t = calcolaPoly2(gcp);
  assert.ok(rmse(residui(t, gcp)) < 1e-3, `rmse ${rmse(residui(t, gcp))} m`);
  const p = inversa(t, gcp[6].lng, gcp[6].lat);
  assert.ok(Math.abs(p.px - 2200) < 1e-3 && Math.abs(p.py - 300) < 1e-3);
});

test('applica ricostruisce la posizione di un punto', () => {
  const gcp = gcpDa(veraAffine, [[0, 0], [3000, 0], [0, 2000]]);
  const g = applica(calcolaTrasformazione('poly1', gcp), 1500, 1000);
  assert.ok(Math.abs(g.lng - veraAffine(1500, 1000).lng) < 1e-9);
});

test('i residui sono in metri: un GCP spostato di 0,001° in latitudine pesa circa 111 m', () => {
  const gcp = gcpDa(veraAffine, [[0, 0], [3000, 0], [0, 2000], [3000, 2000]]);
  const t = calcolaAffine(gcp);
  const spostato = gcp.map((g, i) => (i === 0 ? { ...g, lat: g.lat + 0.001 } : g));
  assert.ok(residui(t, spostato)[0] > 100 && residui(t, spostato)[0] < 120);
});
