import test from 'node:test';
import assert from 'node:assert/strict';
import { costruisciGrafico, costruisciGrafici } from '../../js/layers/trend-geometria.js';

const p = {
  livello: 'upl', nome: 'Kalsa', p11: 6662, p21: 8478, p23: 8331, var1121: 27.26,
  p2030_centrale: 9000, p2030_min: 8000, p2030_max: 9500, p2035_centrale: 9400, p2035_min: 7800, p2035_max: 10200,
  gx: 13.365, gy: 38.115, gw: 800, // riquadro: centro e larghezza in metri
};
const per = (fs, tipo) => fs.find(f => f.properties.tipo === tipo);

test('costruisciGrafico: quattro elementi, tutti con livello, nome e colore', () => {
  const fs = costruisciGrafico(p);
  assert.deepEqual(fs.map(f => f.properties.tipo), ['linea', 'proiezione', 'punta', 'nome']);
  assert.ok(fs.every(f => f.properties.livello === 'upl' && f.properties.nome === 'Kalsa'));
  assert.equal(fs[0].properties.colore, '#1b5e1b'); // crescita = verde scuro, così la linea si stacca dal fondo
  assert.ok(!fs.some(f => f.properties.tipo === 'sotto')); // nessuna area sotto la curva: coprirebbe il colore della mappa
});

test('linea: tre dati osservati da sinistra a destra, il 2011 a sinistra del centro e la proiezione parte dal 2023', () => {
  const fs = costruisciGrafico(p);
  const linea = per(fs, 'linea').geometry.coordinates;
  const proiez = per(fs, 'proiezione').geometry.coordinates;
  assert.equal(linea.length, 3);
  assert.equal(proiez.length, 3); // 2023, 2030, 2035
  assert.ok(linea[0][0] < p.gx && linea.at(-1)[0] > linea[0][0]);
  assert.deepEqual(proiez[0], linea.at(-1));
  assert.ok(proiez.at(-1)[0] > proiez[0][0]);
});

const M_LON = 111320 * Math.cos((38.115 * Math.PI) / 180);
const M_LAT = 110574;
const metri = ([lon, lat]) => [(lon - p.gx) * M_LON, (lat - p.gy) * M_LAT];

test('dentro il riquadro: tutti i punti del grafico stanno nel riquadro largo gw e alto gw/2, centrato su gx, gy', () => {
  const fs = costruisciGrafico(p);
  const punti = fs.flatMap(f => (f.geometry.type === 'Point' ? [f.geometry.coordinates] : f.geometry.type === 'Polygon' ? f.geometry.coordinates[0] : f.geometry.coordinates));
  for (const q of punti.map(metri)) {
    assert.ok(Math.abs(q[0]) <= p.gw / 2 + 0.01, `x fuori: ${q[0]}`);
    assert.ok(Math.abs(q[1]) <= p.gw / 4 + 0.01, `y fuori: ${q[1]}`);
  }
});

test('la linea (dati e scenario) occupa il 90% della larghezza del riquadro', () => {
  const xs = [...per(costruisciGrafico(p), 'linea').geometry.coordinates, ...per(costruisciGrafico(p), 'proiezione').geometry.coordinates].map(c => metri(c)[0]);
  assert.ok(Math.abs(Math.max(...xs) - Math.min(...xs) - p.gw * 0.9) < 0.5);
});

test('riquadri piccoli danno grafici piccoli, in proporzione', () => {
  const xs = q => per(costruisciGrafico({ ...p, gw: q }), 'proiezione').geometry.coordinates.map(c => c[0]);
  const larg = q => Math.max(...xs(q)) - Math.min(...xs(q));
  assert.ok(Math.abs(larg(400) * 2 - larg(800)) < 1e-9);
});

test('la punta è un triangolo chiuso', () => {
  const fs = costruisciGrafico(p);
  const a = per(fs, 'punta').geometry.coordinates[0];
  assert.deepEqual(a[0], a.at(-1));
  assert.equal(per(fs, 'punta').geometry.coordinates[0].length, 4);
});

test('costruisciGrafici: un disegno per ogni punto con rettangolo, gli altri elementi si ignorano', () => {
  const collezione = { features: [
    { properties: { ...p, tipo: 'punto' } },
    { properties: { ...p, tipo: 'area' } },
    { properties: { livello: 'upl', nome: 'X', tipo: 'punto', p11: 1, p21: 1, p23: 1, var1121: 0 } }, // senza riquadro
  ] };
  assert.equal(costruisciGrafici(collezione).features.length, 4);
});
