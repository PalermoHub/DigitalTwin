import test from 'node:test';
import assert from 'node:assert/strict';
import { trasformazione, dimensioniSchermo, LATO_MASSIMO } from '../../js/geoimage/overlay.js';
import { proietta } from '../../js/geoimage/omografia.js';

// mappa finta: 1° = 1000 px, nord in alto
const mappa = (f = ([lng, lat]) => ({ x: (lng - 13) * 1000, y: (38 - lat) * 1000 })) => ({ project: f });
const angoli = [{ lat: 38, lng: 13 }, { lat: 38, lng: 13.2 }, { lat: 37.9, lng: 13 }, { lat: 37.9, lng: 13.2 }]; // 200×100 px sullo schermo

const leggiMatrice = css => {
  const n = css.slice(css.indexOf('(') + 1, -1).split(',').map(Number);
  return { A: n[0], D: n[1], G: n[3], B: n[4], E: n[5], H: n[7], C: n[12], F: n[13] };
};

test('trasformazione porta gli angoli dell\'immagine sui punti proiettati dalla mappa', () => {
  const css = trasformazione(mappa(), angoli, 400, 200);
  assert.match(css, /^matrix3d\(/);
  const m = leggiMatrice(css);
  const se = proietta(m, 400, 200);
  assert.ok(Math.abs(se.x - 200) < 1e-6 && Math.abs(se.y - 100) < 1e-6);
  const no = proietta(m, 0, 0);
  assert.ok(Math.abs(no.x) < 1e-6 && Math.abs(no.y) < 1e-6);
});

test('punti non finiti o quadrilatero degenere: nessuna trasformazione', () => {
  assert.equal(trasformazione(mappa(() => ({ x: NaN, y: 0 })), angoli, 400, 200), null);
  assert.equal(trasformazione(mappa(() => ({ x: 5, y: 5 })), angoli, 400, 200), null);
});

test('mappa molto inclinata con un angolo dietro la camera: nessuna trasformazione', () => {
  // la proiezione finta ribalta l'angolo SE oltre il punto di fuga (w negativo)
  const dietro = ([lng, lat]) => ({ x: (lng - 13) * 1000, y: (38 - lat) * 1000 * (lng > 13.1 && lat < 37.95 ? -3 : 1) });
  assert.equal(trasformazione(mappa(dietro), angoli, 400, 200), null);
});

test('dimensioniSchermo: sotto il massimo non tocca, sopra riduce mantenendo le proporzioni', () => {
  assert.deepEqual(dimensioniSchermo(1000, 500), { larghezza: 1000, altezza: 500, ridotta: false });
  const g = dimensioniSchermo(8192, 6144);
  assert.equal(g.ridotta, true);
  assert.equal(g.larghezza, LATO_MASSIMO);
  assert.equal(g.altezza, 3072);
});
