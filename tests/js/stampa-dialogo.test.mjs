import test from 'node:test';
import assert from 'node:assert/strict';
import { aspetto, riquadroIniziale, dentroVista, adattaProporzione, ridimensiona } from '../../js/core/stampa-dialogo.js';

const vista = { larghezza: 1000, altezza: 600 };
const quasi = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} != ${b}`);

test('aspetto: il poster usa l’area dentro la cornice, quindi più larga che alta ma non quanto la pagina', () => {
  const a = aspetto('A4', 'landscape', 'png');
  assert.ok(a > 1 && a !== 297 / 210);
  assert.equal(aspetto('A4', 'landscape', 'png'), aspetto('A4', 'landscape', 'pdf'));
});
test('aspetto: il foglio stampato ha l’area sopra i testi, più bassa', () => assert.ok(aspetto('A4', 'landscape', 'stampa') > aspetto('A4', 'landscape', 'png')));
test('riquadroIniziale: centrato, dentro la vista, con la proporzione', () => {
  const r = riquadroIniziale(vista, 297 / 210);
  quasi(r.w / r.h, 297 / 210);
  quasi(r.x + r.w / 2, 500); quasi(r.y + r.h / 2, 300);
  assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= vista.larghezza && r.y + r.h <= vista.altezza);
});
test('dentroVista: non esce dai bordi', () => {
  const r = dentroVista({ x: 950, y: -20, w: 200, h: 100 }, vista);
  assert.deepEqual([r.x, r.y], [800, 0]);
});
test('adattaProporzione: da orizzontale a verticale resta dentro la vista, stesso centro', () => {
  const o = riquadroIniziale(vista, 297 / 210);
  const v = adattaProporzione(o, 210 / 297, vista);
  quasi(v.w / v.h, 210 / 297);
  assert.ok(v.y >= 0 && v.y + v.h <= vista.altezza);
});
test('ridimensiona: tiene la proporzione e non esce dalla vista', () => {
  const r = ridimensiona({ x: 100, y: 100, w: 300, h: 200 }, 5000, 1.5, vista);
  quasi(r.w / r.h, 1.5);
  assert.ok(r.x + r.w <= vista.larghezza + 1e-6 && r.y + r.h <= vista.altezza + 1e-6);
});
test('ridimensiona: sotto il minimo no', () => assert.ok(ridimensiona({ x: 0, y: 0, w: 300, h: 200 }, -999, 1.5, vista).w >= 80));

test('vista con pannello in alto (telefono): riquadro iniziale e spostamenti restano sotto il pannello', () => {
  const v = { larghezza: 390, altezza: 780, sinistra: 0, alto: 456 };
  const r = riquadroIniziale(v, 297 / 210);
  assert.ok(r.y >= v.alto && r.y + r.h <= v.altezza && r.x >= 0 && r.x + r.w <= v.larghezza);
  assert.equal(dentroVista({ ...r, y: 0 }, v).y, v.alto);
  const a = adattaProporzione(r, 210 / 297, v);
  assert.ok(a.y >= v.alto && a.y + a.h <= v.altezza);
});
