import test from 'node:test';
import assert from 'node:assert/strict';
import { vociDistributori, modelloPopupDistributore, distributoriVicini } from '../../js/layers/scheda-distributori.js';

const P = {
  id: '54872', bandiera: 'Agip Eni', gestore: 'G P S.R.L.', indirizzo: 'RESURREZIONE 87 90146', marchio: 'Agip Eni',
  prezzi: [['Benzina', 0, 2.388, '14/10/2026 07:12:55'], ['Benzina', 1, 1.988, '14/10/2026 07:12:55'], ['Gasolio', 1, 2.19, '14/10/2026 07:12:55'],
    ['HVOlution', 0, 2.29, '14/10/2026 07:12:55'], ['HVOlution', 1, 2.19, '14/10/2026 07:12:55']],
  prezzi_del: '14/10/2026 07:12:55',
};
const el = (v, i = 0) => v.accordion.elementi[i];
const riga = (e, k) => e.righe.find(r => r.etichetta === k)?.valore;
const uno = (p = P, distanza = 187, coordinate = [13.3, 38.1]) => vociDistributori([{ p, distanza, coordinate }])[0];

test('sezione unica nel tab «Luogo» (peso 8), a fisarmonica, una card per distributore', () => {
  const [v, ...resto] = vociDistributori([{ p: P, distanza: 187, coordinate: [13.3, 38.1] }, { p: { ...P, id: '2', bandiera: 'Esso' }, distanza: 250, coordinate: null }]);
  assert.equal(resto.length, 0);
  assert.equal(v.chiave, 'distributori:gruppo');
  assert.equal(v.peso, 8);
  assert.equal(v.badge, '2 distributori');
  assert.equal(v.accordion.elementi.length, 2);
  assert.match(v.fonte, /MIMIT/);
});

test('nessun distributore: nessuna sezione', () => {
  assert.deepEqual(vociDistributori([]), []);
});

test('card: bandiera come titolo, distanza a destra arrotondata a 10 m, strato distributori', () => {
  const e = el(uno());
  assert.equal(e.titolo, 'Agip Eni');
  assert.equal(e.anteprima, '190 m');
  assert.equal(e.strato, 'distributori');
  assert.equal(el(uno(P, null)).anteprima, '');
});

test('prezzi: self e servito per carburante, 3 decimali; carburanti non venduti senza riga', () => {
  const e = el(uno());
  assert.equal(riga(e, 'Benzina'), '1,988 € self · 2,388 € servito');
  assert.equal(riga(e, 'Gasolio'), '2,190 € self');
  assert.equal(riga(e, 'GPL'), undefined);
  assert.equal(riga(e, 'Metano'), undefined);
});

test('altri carburanti col prezzo più basso; data dei prezzi', () => {
  const e = el(uno());
  assert.equal(riga(e, 'Altri carburanti'), 'HVOlution 2,190 €');
  assert.equal(riga(e, 'Prezzi del'), '14/10/2026');
});

test('impianto senza prezzi: restano gestore e indirizzo', () => {
  const e = el(uno({ id: '1', bandiera: 'Esso', gestore: 'X', indirizzo: 'Via Y', prezzi: [] }));
  assert.deepEqual(e.righe.map(r => r.etichetta), ['Gestore', 'Indirizzo']);
});

test('evidenza: un punto per distributore con coordinate', () => {
  const v = uno();
  assert.deepEqual(v.evidenza[0].features.map(f => f.geometry.coordinates), [[13.3, 38.1]]);
  assert.equal(uno(P, 187, null).evidenza[0].features.length, 0);
});

test('popup: bandiera, indirizzo, solo prezzi', () => {
  const m = modelloPopupDistributore(P);
  assert.equal(m.titolo, 'Agip Eni');
  assert.equal(m.sottotitolo, 'RESURREZIONE 87 90146');
  assert.deepEqual(m.righe.map(r => r.etichetta), ['Benzina', 'Gasolio', 'Prezzi del']);
});

test('senza bandiera il titolo è il gestore', () => {
  assert.equal(modelloPopupDistributore({ id: '2', gestore: 'Rossi', prezzi: [] }).titolo, 'Rossi');
});

const A = { id: 'A' }, B = { id: 'B' }, C = { id: 'C' }, D = { id: 'D' };
const proprieta = new Map([['A', A], ['B', B], ['C', C], ['D', D]]);
// ~111 m per 0,001° di latitudine
const coordinate = new Map([['A', [13.3, 38.1005]], ['B', [13.3, 38.102]], ['C', [13.3, 38.11]], ['D', [13.3, 38.1015]]]);
const PUNTO = [13.3, 38.1];

test('vicini: entro il raggio, dal più vicino, al massimo `max`', () => {
  assert.deepEqual(distributoriVicini(PUNTO, proprieta, coordinate, 400, 5).map(x => x.p.id), ['A', 'D', 'B']); // C è a ~1,1 km
  assert.deepEqual(distributoriVicini(PUNTO, proprieta, coordinate, 400, 2).map(x => x.p.id), ['A', 'D']);
});

test('vicini: i distributori cliccati restano anche oltre raggio e massimo', () => {
  assert.deepEqual(distributoriVicini(PUNTO, proprieta, coordinate, 400, 1, new Set(['C'])).map(x => x.p.id), ['A', 'C']);
});

test('vicini: senza coordinate o fuori raggio, nessun risultato', () => {
  assert.deepEqual(distributoriVicini(PUNTO, proprieta, new Map(), 400, 5), []);
  assert.deepEqual(distributoriVicini([14, 39], proprieta, coordinate, 400, 5), []);
});
