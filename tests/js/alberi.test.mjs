import test from 'node:test';
import assert from 'node:assert/strict';
import { voceAlbero, modelloPopupAlbero } from '../../js/layers/scheda-alberi.js';
import { unisci } from '../../js/core/scheda-modello.js';

const A = {
  id: 'albero-03', scheda: '03/G273/PA/19', nome: 'Fico magnolioide', specie: 'Ficus macrophylla Desf. ex Pers.', insieme: false,
  localita: 'Villa Garibaldi - Piazza Marina', altitudine: 7, circonferenza: 3600, altezza: 21,
  criteri: ['età e/o dimensioni', 'rarità botanica'], dichiarato: true,
};
const righe = v => Object.fromEntries(v.gruppi.flatMap(g => g.righe).map(r => [r.etichetta, r.valore]));

test('voce della scheda: titolo, badge, righe con unità e fonte MASAF', () => {
  const v = voceAlbero(A);
  assert.equal(v.titolo, 'Fico magnolioide');
  assert.equal(v.badge, 'Albero monumentale');
  assert.equal(v.luogo, undefined); // alberi con la stessa specie non devono fondersi
  const r = righe(v);
  assert.equal(r['Circonferenza fusto'], '3600 cm');
  assert.equal(r['Altezza'], '21 m');
  assert.equal(r['Criteri di monumentalità'], 'età e/o dimensioni, rarità botanica');
  assert.match(v.fonte, /MASAF/);
  assert.equal(unisci([v]).sezioni.length, 1);
});

test('insieme omogeneo: valori massimi e badge dedicato', () => {
  const v = voceAlbero({ ...A, insieme: true });
  assert.equal(v.badge, 'Insieme omogeneo');
  assert.ok('Altezza (max)' in righe(v));
});

test('dati mancanti: righe omesse', () => {
  const r = righe(voceAlbero({ ...A, altitudine: null, criteri: [] }));
  assert.ok(!('Altitudine' in r));
  assert.ok(!('Criteri di monumentalità' in r));
});

test('popup: stesse righe della scheda', () => {
  const m = modelloPopupAlbero(A);
  assert.equal(m.titolo, 'Fico magnolioide');
  assert.ok(m.righe.some(r => r.etichetta === 'Specie'));
});
