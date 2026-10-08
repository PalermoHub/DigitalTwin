import test from 'node:test';
import assert from 'node:assert/strict';
import { calcolaHeading, urlStreetView, urlIncorporato, settoreVisuale, SOGLIA_TRASCINAMENTO } from '../../js/core/streetview.js';

test('calcolaHeading: gradi da nord in senso orario sugli assi schermo', () => {
  const o = { x: 100, y: 100 };
  assert.equal(calcolaHeading(o, { x: 100, y: 50 }), 0);    // su = nord
  assert.equal(calcolaHeading(o, { x: 150, y: 100 }), 90);  // destra = est
  assert.equal(calcolaHeading(o, { x: 100, y: 150 }), 180); // giù = sud
  assert.equal(calcolaHeading(o, { x: 50, y: 100 }), 270);  // sinistra = ovest
});

test('calcolaHeading: la rotazione della mappa si somma e il risultato resta in 0-360', () => {
  const o = { x: 0, y: 0 };
  assert.equal(calcolaHeading(o, { x: 10, y: 0 }, 90), 180);
  assert.equal(calcolaHeading(o, { x: 0, y: -10 }, -30), 330);
});

test('urlStreetView: con heading arrotondato e parametri fissi', () => {
  const u = urlStreetView({ lat: 38.1157, lng: 13.3615 }, 123.6);
  assert.equal(u, 'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=38.1157,13.3615&heading=124&pitch=0&fov=90');
});

test('urlStreetView: senza heading (clic semplice) il parametro manca', () => {
  const u = urlStreetView({ lat: 38.1, lng: 13.3 });
  assert.ok(!u.includes('heading'));
  assert.ok(u.includes('viewpoint=38.1,13.3'));
});

test('settoreVisuale: poligono chiuso che parte dal centro', () => {
  const p = settoreVisuale({ lat: 38.1, lng: 13.3 }, 90, 100, 90);
  const anello = p.geometry.coordinates[0];
  assert.deepEqual(anello[0], [13.3, 38.1]);
  assert.deepEqual(anello.at(-1), anello[0]);
  // raggio verso est: il punto centrale del settore ha lat ~ uguale e lng maggiore
  const medio = anello[Math.floor(anello.length / 2)];
  assert.ok(medio[0] > 13.3);
});

test('soglia di trascinamento positiva', () => {
  assert.ok(SOGLIA_TRASCINAMENTO > 0);
});

test('urlIncorporato: panoramica incorporabile con heading nel parametro cbp', () => {
  const u = urlIncorporato({ lat: 38.1, lng: 13.3 }, 200.4);
  assert.ok(u.includes('output=svembed') && u.includes('cbll=38.1,13.3') && u.includes('cbp=11,200,0,0,0'));
});
