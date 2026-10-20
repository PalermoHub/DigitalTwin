import test from 'node:test';
import assert from 'node:assert/strict';
import { paroleScheda } from '../../js/core/scheda-parole.js';

// peso → tab: 60 mercato, 70 popolazione, 80 terreno (scheda-modello.js)
const sezione = (peso, chiave, grezzi) => ({ peso, chiave, grezzi, gruppi: [] });

test('terreno: pendenza, stabilità, sole e falda con la regola che le ha fatte scattare', () => {
  const [b] = paroleScheda([sezione(80, 'terreno', { slope_pct: 28, slope_deg: 15.6, stabilita: 4, fv: 0.74, ombra_est: 31, dtw: 2.1 })]);
  assert.equal(b.tab, 'terreno');
  assert.equal(b.frasi.length, 4);
  assert.match(b.frasi[0].testo, /ripido.*28/);
  assert.match(b.frasi[0].regola, /≥ 20/);
  assert.match(b.frasi[1].testo, /classe 4 su 5.*PAI/);
  assert.match(b.frasi[2].testo, /fotovoltaico 74 %.*ombra estiva solo 12 %/);
  assert.match(b.frasi[3].testo, /2,1 m/);
});

test('un dato vicino al normale non produce frasi e il motivo resta tra le saltate', () => {
  const [b] = paroleScheda([sezione(80, 'terreno', { slope_pct: 9.2, stabilita: 3, fv: 0.66, ombra_est: 44, dtw: 3.4 })]);
  assert.equal(b.frasi.length, 0);
  assert.equal(b.saltate.length, 4);
});

test('mercato OMI: zona, compravendita e affitto a 80 m²', () => {
  const [b] = paroleScheda([sezione(60, 'omi-D2', { zona: 'D2', fascia: 'Periferica', cMin: 1150, cMax: 1650, lMin: 4.2, lMax: 6, sup: 'sup.lorda' })]);
  assert.equal(b.tab, 'mercato');
  assert.match(b.frasi[0].testo, /Zona D2.*periferica.*non il prezzo/);
  assert.match(b.frasi[1].testo, /1150–1650/); // l'italiano non raggruppa i numeri a quattro cifre
  assert.match(b.frasi[2].testo, /80 m².*336–480/);
});

test('popolazione: confronto con la mediana, solo se la scheda la porta', () => {
  const [b] = paroleScheda([sezione(70, 'sezione', { densita: 214, vecchiaia: 171, mediane: { densita: 96, vecchiaia: 148 } })]);
  assert.match(b.frasi[0].testo, /molto abitata.*214.*96/);
  assert.match(b.frasi[1].testo, /più anziana.*171.*148/); // 171 / 148 = 1,16, appena sopra la soglia di 1,15
  const [vicino] = paroleScheda([sezione(70, 'sezione', { densita: 100, vecchiaia: 150, mediane: { densita: 96, vecchiaia: 148 } })]);
  assert.equal(vicino.frasi.length, 0);
  assert.equal(vicino.saltate.length, 2);
  assert.deepEqual(paroleScheda([sezione(70, 'sezione', { densita: 214, vecchiaia: 171 })]), []);
});

test('sezioni senza dati grezzi o di altri tab si ignorano; l\'ordine è mercato, popolazione, terreno', () => {
  const r = paroleScheda([sezione(80, 'terreno', { slope_pct: 30, stabilita: 1 }), sezione(10, 'x', null), sezione(60, 'omi-B', { zona: 'B1', fascia: 'Centrale' })]);
  assert.deepEqual(r.map(b => b.tab), ['mercato', 'terreno']);
});
