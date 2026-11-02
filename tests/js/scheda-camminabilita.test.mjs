import test from 'node:test';
import assert from 'node:assert/strict';
import { classeStradaPerQualita, tipoStrada, voceStrada, luoghiEntro, tabellaBisogni, classePerPunteggio, dentroParco, stradaIsolataM } from '../../js/layers/scheda-camminabilita.js';

test('luoghiEntro: decodifica 5 e 10 minuti e il tetto', () => {
  assert.deepEqual(luoghiEntro(3 | (12 << 4)), { entro5: 3, entro10: 12, oltre5: false, oltre10: false });
  assert.deepEqual(luoghiEntro(15 | (15 << 4) | 256 | 512), { entro5: 15, entro10: 15, oltre5: true, oltre10: true });
  assert.deepEqual(luoghiEntro(undefined), { entro5: 0, entro10: 0, oltre5: false, oltre10: false });
});

test('tabellaBisogni: otto voci, -1 minuti = nessun luogo entro 22 minuti', () => {
  const p = { r0: 80, m0: 3.2, v0: 2 | (5 << 4), kd0: 'supermercato', n0: 'Conad', r3: 0, m3: -1 };
  const tab = tabellaBisogni(p);
  assert.equal(tab.length, 8);
  assert.deepEqual([tab[0].punteggio, tab[0].minuti, tab[0].entro5, tab[0].entro10, tab[0].tipo, tab[0].nome], [80, 3.2, 2, 5, 'supermercato', 'Conad']);
  assert.equal(tab[3].minuti, null);
  assert.equal(tab[7].punteggio, null);
});

test('classePerPunteggio, parco e strada isolata', () => {
  assert.equal(classePerPunteggio(19.9).id, 0);
  assert.equal(classePerPunteggio(20).id, 1);
  assert.equal(classePerPunteggio(100).id, 4);
  assert.deepEqual(dentroParco({ pc: 'playground|sports pitch' }), ['playground', 'sports pitch']);
  assert.deepEqual(dentroParco({}), []);
  assert.equal(stradaIsolataM({ isl_m: 120 }), 120);
  assert.equal(stradaIsolataM({}), null);
});

test('classi di strada: sotto 45 trafficata, 45–74 mista, 75 e oltre tranquilla', () => {
  assert.equal(classeStradaPerQualita(10).id, 0);
  assert.equal(classeStradaPerQualita(44.9).id, 0);
  assert.equal(classeStradaPerQualita(45).id, 1);
  assert.equal(classeStradaPerQualita(74).id, 1);
  assert.equal(classeStradaPerQualita(75).id, 2);
  assert.equal(classeStradaPerQualita(100).id, 2);
});

test('voceStrada: righe presenti solo con valore, tipo tradotto', () => {
  assert.equal(tipoStrada('residential'), 'Strada residenziale');
  assert.equal(tipoStrada('qualcosa'), 'qualcosa');
  const v = voceStrada({ q: 80, hw: 'pedestrian', name: 'Via Maqueda', sh: 12.5, tr: 3 });
  assert.equal(v.titolo, 'Via Maqueda');
  const et = v.gruppi[0].righe.map(r => r.etichetta);
  assert.ok(et.includes('Tipo di strada') && et.includes('Ombra estiva (stima)') && !et.includes('Rumore') && !et.includes('Pendenza'));
  assert.equal(v.gruppi[0].righe.find(r => r.etichetta === 'Classe').valore, 'Strada tranquilla');
});

import { coloriEdifici, espressioneEdifici2d, CLASSI } from '../../js/layers/scheda-camminabilita.js';

const perClasse = { 0: [1, 2], 1: [3], 2: [], 3: [4], 4: [5, 6] };

test('coloriEdifici: ogni fid prende il colore della sua classe', () => {
  const m = coloriEdifici(perClasse);
  assert.equal(m.size, 6);
  assert.equal(m.get(1), CLASSI[0].colore);
  assert.equal(m.get(6), CLASSI[4].colore);
});

test('coloriEdifici: le classi spente non colorano; senza dati la mappa è vuota', () => {
  const m = coloriEdifici(perClasse, new Set([3, 4]));
  assert.deepEqual([...m.keys()].sort(), [4, 5, 6]);
  assert.equal(coloriEdifici(null).size, 0);
});

test('espressioneEdifici2d: match su id con una coppia per classe non vuota, sfondo trasparente', () => {
  const e = espressioneEdifici2d(perClasse);
  assert.deepEqual(e.slice(0, 2), ['match', ['id']]);
  assert.deepEqual(e[2], [1, 2]);
  assert.equal(e[3], CLASSI[0].colore);
  assert.equal(e.at(-1), 'rgba(0,0,0,0)');
  assert.equal(e.length, 2 + 4 * 2 + 1 + 0); // classi 0,1,3,4 (la 2 è vuota)
});

test('espressioneEdifici2d: nessuna classe accesa → colore trasparente semplice', () => {
  assert.equal(espressioneEdifici2d(perClasse, new Set()), 'rgba(0,0,0,0)');
  assert.equal(espressioneEdifici2d(null), 'rgba(0,0,0,0)');
});
