import test from 'node:test';
import assert from 'node:assert/strict';
import { nascosti, aggiornaSottogruppi } from '../../js/core/sottogruppi.js';

// nodi finti: { t: 'titolo' | 'strato', chiuso?: bool }
const titolo = (chiuso = false) => ({ t: 'titolo', chiuso });
const strato = nome => ({ t: 'strato', nome });
const eTitolo = n => n.t === 'titolo';
const chiuso = n => n.chiuso;

test('nascosti: gli strati di un sottogruppo chiuso, fino al titolo successivo', () => {
  const a = strato('a'), b = strato('b'), c = strato('c');
  const nodi = [titolo(true), a, b, titolo(false), c];
  assert.deepEqual(nascosti(nodi, eTitolo, chiuso), [a, b]);
});

test('nascosti: tutti aperti, nessun nodo nascosto', () => {
  const nodi = [titolo(), strato('a'), titolo(), strato('b')];
  assert.deepEqual(nascosti(nodi, eTitolo, chiuso), []);
});

test('nascosti: i nodi prima del primo titolo non si nascondono mai', () => {
  const x = strato('x');
  assert.deepEqual(nascosti([x, titolo(true), strato('a')], eTitolo, chiuso).includes(x), false);
});

test('nascosti: l\'ultimo sottogruppo chiuso nasconde tutto ciò che lo segue', () => {
  const a = strato('a'), b = strato('b');
  assert.deepEqual(nascosti([titolo(false), strato('c'), titolo(true), a, b], eTitolo, chiuso), [a, b]);
});

test('nascosti: i titoli non si nascondono', () => {
  const t2 = titolo(false);
  assert.equal(nascosti([titolo(true), strato('a'), t2], eTitolo, chiuso).includes(t2), false);
});

// gruppo finto: figli con matches/classList/attributi, quanto serve ad aggiornaSottogruppi
const nodo = (tipo, aperto = true) => {
  const classi = new Set();
  const attr = { 'aria-expanded': String(aperto) };
  return { tipo, classi, attr,
    matches: sel => (sel === 'h3.gruppo-sezione' ? tipo === 'titolo' : false),
    getAttribute: k => attr[k] ?? null, setAttribute: (k, v) => { attr[k] = v; },
    classList: { toggle: (c, on) => (on ? classi.add(c) : classi.delete(c)), contains: c => classi.has(c) } };
};
const gruppoDi = figli => ({ children: figli });
const chiusoCls = n => n.classi.has('sotto-chiuso');

test('aggiornaSottogruppi: nasconde gli strati sotto un titolo chiuso e li riporta quando si riapre', () => {
  const t = nodo('titolo', false), a = nodo('strato'), t2 = nodo('titolo'), b = nodo('strato');
  const g = gruppoDi([t, a, t2, b]);
  aggiornaSottogruppi(g);
  assert.deepEqual([chiusoCls(a), chiusoCls(b), chiusoCls(t)], [true, false, false]);
  t.setAttribute('aria-expanded', 'true');
  aggiornaSottogruppi(g);
  assert.equal(chiusoCls(a), false);
});

test('aggiornaSottogruppi con ignora (ricerca in corso): nessuno strato resta nascosto', () => {
  const t = nodo('titolo', false), a = nodo('strato');
  aggiornaSottogruppi(gruppoDi([t, a]));
  assert.equal(chiusoCls(a), true);
  aggiornaSottogruppi(gruppoDi([t, a]), { ignora: true });
  assert.equal(chiusoCls(a), false);
  aggiornaSottogruppi(gruppoDi([t, a]));
  assert.equal(chiusoCls(a), true);
});

test('aggiornaSottogruppi con riapri (dopo un riordino): lo strato spostato sotto un titolo chiuso lo riapre, gli altri restano nascosti', () => {
  const t1 = nodo('titolo', false), vecchio = nodo('strato');
  const g = gruppoDi([t1, vecchio]);
  aggiornaSottogruppi(g); // vecchio è nascosto
  const t2 = nodo('titolo'), mosso = nodo('strato');
  const g2 = gruppoDi([t1, vecchio, mosso, t2]); // «mosso» è finito sotto il titolo chiuso
  aggiornaSottogruppi(g2, { riapri: true });
  assert.equal(t1.getAttribute('aria-expanded'), 'true');
  assert.equal(chiusoCls(mosso), false);
});

test('aggiornaSottogruppi con riapri: se nulla di nuovo finisce sotto un titolo chiuso, resta chiuso', () => {
  const t1 = nodo('titolo', false), a = nodo('strato');
  const g = gruppoDi([t1, a]);
  aggiornaSottogruppi(g);
  aggiornaSottogruppi(g, { riapri: true });
  assert.equal(t1.getAttribute('aria-expanded'), 'false');
  assert.equal(chiusoCls(a), true);
});

// titoli di secondo livello (es. «Colonnine di ricarica» dentro «Servizi su strada»)
const sotto = (chiuso = false) => ({ t: 'sotto', chiuso });
const eSotto = n => n.t === 'sotto';

test('nascosti: un titolo di secondo livello chiuso nasconde i suoi strati fino al titolo successivo, non gli altri', () => {
  const a = strato('a'), b = strato('b'), c = strato('c');
  assert.deepEqual(nascosti([titolo(), sotto(true), a, sotto(false), b, titolo(), c], eTitolo, chiuso, eSotto), [a]);
});

test('nascosti: una sezione chiusa nasconde anche i titoli di secondo livello e i loro strati', () => {
  const s1 = sotto(false), a = strato('a'), s2 = sotto(true), b = strato('b'), t2 = titolo(false), c = strato('c');
  assert.deepEqual(nascosti([titolo(true), s1, a, s2, b, t2, c], eTitolo, chiuso, eSotto), [s1, a, s2, b]);
});

test('nascosti: una nuova sezione azzera lo stato del titolo di secondo livello chiuso', () => {
  const a = strato('a'), c = strato('c');
  assert.deepEqual(nascosti([titolo(), sotto(true), a, titolo(false), c], eTitolo, chiuso, eSotto), [a]);
});
