import test from 'node:test';
import assert from 'node:assert/strict';

// document finto: basta per vedere la struttura prodotta, senza browser
class Nodo {
  constructor(tag) { this.tag = tag; this.className = ''; this.textContent = ''; this.figli = []; this.style = { setProperty: (k, v) => { this.vars = { ...this.vars, [k]: v }; } }; }
  append(...x) { this.figli.push(...x); }
}
globalThis.document = { createElement: tag => new Nodo(tag) };
const { disegnaVoceTooltip } = await import('../../js/core/tooltip.js');
const testi = n => (typeof n === 'string' ? [n] : [n.textContent, ...n.figli.flatMap(testi)].filter(Boolean));

test('senza pallino né badge: titolo e sottotitolo come prima', () => {
  const v = disegnaVoceTooltip({ titolo: 'Via Roma', sottotitolo: 'Strada' });
  assert.deepEqual(testi(v), ['Via Roma', 'Strada']);
  assert.equal(v.figli.length, 2);
});

test('con pallino e badge: pallino nel titolo, badge dopo il titolo', () => {
  const v = disegnaVoceTooltip({ titolo: 'U_16 – Nome', pallino: '#e69f00', badge: { testo: 'Accessibile', colore: '#003' } });
  const titolo = v.figli[0];
  assert.equal(titolo.figli[0].className, 'tooltip-pallino');
  assert.equal(titolo.figli[0].style.background, '#e69f00');
  assert.equal(titolo.figli[1], 'U_16 – Nome');
  assert.equal(v.figli[1].className, 'tooltip-badge');
  assert.equal(v.figli[1].textContent, 'Accessibile');
  assert.equal(v.figli[1].vars['--colore'], '#003');
});
