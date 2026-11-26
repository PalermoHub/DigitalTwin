import test from 'node:test';
import assert from 'node:assert/strict';
import { collegaTastoDestro } from '../../js/core/ripristino.js';

function prova(originalEvent) {
  let gestore, tolte = 0, annullato = 0;
  const map = { on: (tipo, f) => { if (tipo === 'contextmenu') gestore = f; } };
  collegaTastoDestro(map, () => { tolte++; return true; });
  gestore({ originalEvent: { preventDefault: () => annullato++, ...originalEvent } });
  return { tolte, annullato };
}

test('tasto destro sulla mappa: toglie la selezione e non apre il menu del browser', () => {
  assert.deepEqual(prova({ pointerType: 'mouse' }), { tolte: 1, annullato: 1 });
  assert.deepEqual(prova({}), { tolte: 1, annullato: 1 });
});

test('pressione lunga col dito: non è un tasto destro, la scheda resta', () => {
  assert.equal(prova({ pointerType: 'touch' }).tolte, 0);
});

test('trascinando col tasto destro (anche in 2D, dove la mappa non ruota) la selezione resta', () => {
  const gestori = {};
  let tolte = 0;
  collegaTastoDestro({ on: (tipo, f) => { gestori[tipo] = f; } }, () => { tolte++; });
  const destro = { button: 2, preventDefault() {} };
  gestori.mousedown({ point: { x: 100, y: 100 }, originalEvent: destro });
  gestori.mousemove({ point: { x: 260, y: 100 }, originalEvent: {} });
  gestori.contextmenu({ point: { x: 100, y: 100 }, originalEvent: destro });
  assert.equal(tolte, 0);
  gestori.mousedown({ point: { x: 100, y: 100 }, originalEvent: destro });
  gestori.contextmenu({ point: { x: 102, y: 101 }, originalEvent: destro });
  assert.equal(tolte, 1);
});
