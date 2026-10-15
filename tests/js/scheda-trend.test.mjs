import test from 'node:test';
import assert from 'node:assert/strict';
import { serie, profilo, voceScheda, modelloTooltipTrend, conSegno, coloreVariazione, RAMPA, COLORE_CALO, COLORE_CRESCITA } from '../../js/layers/scheda-trend.js';

const p = {
  livello: 'upl', nome: 'Tribunali o Kalsa', p11: 6662, p21: 8478, p23: 8331, var1121: 27.26, var2123: -1.73,
  p2030_centrale: 9000, p2030_min: 8000, p2030_max: 9500, p2035_centrale: 9400, p2035_min: 7800, p2035_max: 10200,
};

test('serie: tre dati osservati e due proiettati con fascia', () => {
  const s = serie(p);
  assert.deepEqual(s.map(d => d.anno), [2011, 2021, 2023, 2030, 2035]);
  assert.deepEqual(s.map(d => d.osservato), [true, true, true, false, false]);
  assert.deepEqual([s[4].min, s[4].valore, s[4].max], [7800, 9400, 10200]);
});

test('serie: senza proiezione restano i tre dati osservati', () => {
  assert.equal(serie({ p11: 1, p21: 1, p23: 1 }).length, 3);
});

test('segno e colore: viola per il calo, verde per la crescita', () => {
  assert.equal(conSegno(27.26), '+27,3%');
  assert.equal(conSegno(-3.4), '−3,4%');
  assert.equal(conSegno(-3.4, 0), '−3%');
  assert.equal(coloreVariazione(-0.1), COLORE_CALO);
  assert.equal(coloreVariazione(0), COLORE_CRESCITA);
});

test('rampa: soglie crescenti, dal calo alla crescita', () => {
  const soglie = RAMPA.map(([s]) => s);
  assert.deepEqual(soglie, [...soglie].sort((a, b) => a - b));
  assert.equal(RAMPA[0][1], COLORE_CALO);
  assert.equal(RAMPA.at(-1)[1], COLORE_CRESCITA);
});

const upl = p;
const quartiere = { ...p, livello: 'quartiere', nome: 'Tribunali-Castellammare', var1121: 20.95 };
const circ = { ...p, livello: 'circoscrizione', nome: 'I', var1121: 14.79 };

test('voceScheda: una voce con i tre livelli in ordine UPL, quartiere, circoscrizione', () => {
  const v = voceScheda([circ, upl, quartiere], q => ({ n: q.map(x => x.livello) }));
  assert.equal(v.chiave, 'trend-popolazione');
  assert.equal(v.peso, 70);
  assert.deepEqual(v.gruppi[0].righe.map(r => r.etichetta), ['UPL: Tribunali o Kalsa', 'Quartiere: Tribunali-Castellammare', 'Circoscrizione: I']);
  assert.deepEqual(v.gruppi[0].righe.map(r => r.valore), ['+27,3%', '+21,0%', '+14,8%']);
  assert.deepEqual(v.dinamico(), { n: ['upl', 'quartiere', 'circoscrizione'] });
  assert.equal(v.badge, 'Trend +27%'); // il badge della scheda è una stringa, non un oggetto
  assert.ok(v.fonte);
});

test('voceScheda: con un solo livello presente resta quello; senza dati nessuna voce', () => {
  assert.equal(voceScheda([circ], () => null).gruppi[0].righe.length, 1);
  assert.equal(voceScheda([], () => null), null);
});

test('modelloTooltipTrend: titolo, pallino e badge con la variazione', () => {
  const m = modelloTooltipTrend({ nome: 'Noce', var1121: -4.62 });
  assert.equal(m.titolo, 'Noce');
  assert.equal(m.pallino, COLORE_CALO);
  assert.match(m.badge.testo, /−4,6%/);
});

test('profilo: x da 0 (2011) a 1 (2035), y invertita e dentro 0-1, colore dal segno', () => {
  const r = profilo(p);
  assert.equal(r.colore, COLORE_CRESCITA);
  assert.deepEqual(r.punti.map(d => d.osservato), [true, true, true, false, false]);
  assert.equal(r.punti[0].x, 0);
  assert.equal(r.punti.at(-1).x, 1);
  for (const d of r.punti) assert.ok(d.y >= 0 && d.y <= 1 && (d.yMin ?? 1) <= 1 && (d.yMax ?? 0) >= 0);
  // il massimo della serie (fascia alta al 2035) sta in alto (y = 0); il valore 2011, il più basso, in basso
  assert.equal(r.punti.at(-1).yMax, 0);
  assert.ok(r.punti[0].y > r.punti[1].y);
});

test('profilo: valori tutti uguali stanno a metà altezza; calo = viola', () => {
  const piatto = profilo({ livello: 'upl', p11: 100, p21: 100, p23: 100, var1121: 0 });
  assert.ok(piatto.punti.every(d => d.y === 0.5));
  assert.equal(profilo({ p11: 100, p21: 90, p23: 85, var1121: -10 }).colore, COLORE_CALO);
});
