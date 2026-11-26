import test from 'node:test';
import assert from 'node:assert/strict';

const elemento = () => { const classi = new Set(); return { style: {}, hidden: false, setAttribute() {}, classList: { add: c => classi.add(c), remove: c => classi.delete(c), contains: c => classi.has(c), toggle: (c, on) => (on ? classi.add(c) : classi.delete(c)) } }; };

function scena(salvato = null) {
  globalThis.document = Object.assign(new EventTarget(), { createElement: elemento });
  const assi = [], gestori = {}, tela = elemento();
  const contenitore = { append: e => assi.push(e), addEventListener: (t, f) => { gestori[t] = f; } };
  const map = { getContainer: () => contenitore, getCanvas: () => tela, getPadding: () => ({ top: 0, right: 400, bottom: 0, left: 40 }), on: (t, f) => { gestori[t] = f; } };
  return { map, assi, gestori, tela, storage: { getItem: () => salvato, setItem() {} } };
}

test('mirino CAD: gli assi seguono il mouse nell\'area libera e al pan lasciano il posto al cursore', async () => {
  const { collegaMirino } = await import('../../js/core/mirino-cad.js');
  const s = scena();
  collegaMirino(s.map, s.storage);
  const [x, y] = s.assi;
  s.gestori.mousemove({ point: { x: 200, y: 100 }, originalEvent: {} });
  assert.deepEqual([x.style.top, y.style.left, x.style.left, x.style.right, x.hidden], ['100px', '200px', '40px', '400px', false]);
  s.map.getPadding = () => ({ top: 0, right: 484, bottom: 0, left: 40 });
  s.gestori.moveend({});
  assert.equal(x.style.right, '484px', 'a scheda aperta e mouse fermo gli assi non passano sopra il pannello');
  s.gestori.dragstart({});
  assert.ok(x.hidden && y.hidden && s.tela.classList.contains('cad-pan'));
  s.gestori.mousemove({ point: { x: 210, y: 100 }, originalEvent: {} });
  assert.ok(x.hidden, 'durante il pan gli assi restano nascosti');
  s.gestori.dragend({});
  assert.ok(!s.tela.classList.contains('cad-pan'));
  s.gestori.rotatestart({ originalEvent: {} });
  assert.ok(s.tela.classList.contains('cad-pan'), 'anche la rotazione col mouse mostra il cursore');
  s.gestori.rotateend({ originalEvent: {} });
  assert.ok(!s.tela.classList.contains('cad-pan'));
});

test('mirino CAD: acceso di default, spento se l\'utente lo ha spento; col dito non compare', async () => {
  const { collegaMirino, mirinoAttivo } = await import('../../js/core/mirino-cad.js');
  const acceso = scena();
  collegaMirino(acceso.map, acceso.storage);
  assert.equal(mirinoAttivo(), true);
  acceso.gestori.mousemove({ point: { x: 1, y: 1 }, originalEvent: { pointerType: 'touch' } });
  assert.equal(acceso.assi[0].hidden, true);
  const spento = scena('0');
  collegaMirino(spento.map, spento.storage);
  assert.equal(mirinoAttivo(), false);
  assert.ok(!spento.tela.classList.contains('con-cad'));
});
