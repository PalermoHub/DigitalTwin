import test from 'node:test';
import assert from 'node:assert/strict';
import { indiceLaterale } from '../../js/core/guida.js';

// DOM finto minimo: solo ciò che serve a indiceLaterale (children, append, insertBefore, createElement).
function nodo(tag) {
  return {
    tagName: tag.toUpperCase(), children: [], className: '', textContent: '', attrs: {},
    append(...f) { this.children.push(...f); },
    insertBefore(n, rif) { this.children.splice(this.children.indexOf(rif), 0, n); },
    addEventListener() {}, setAttribute(k, v) { this.attrs[k] = v; },
  };
}
const doc = { createElement: nodo };
const pagina = (...tag) => { const r = nodo('div'); r.append(...tag.map(nodo)); return r; };
const ordine = r => r.children.map(n => (n.className === 'guida-indice' ? 'INDICE' : n.tagName));

test('indice: sotto titolo e introduzione, prima della prima sezione (su telefono sta in alto)', () => {
  const r = pagina('h2', 'p', 'section', 'section', 'section');
  const voci = [2, 3, 4].map(i => ({ titolo: `Voce ${i}`, sezione: r.children[i] }));
  indiceLaterale(doc, r, voci);
  assert.deepEqual(ordine(r), ['H2', 'P', 'INDICE', 'SECTION', 'SECTION', 'SECTION']);
  assert.equal(r.className, 'guida-pagina');
});

test('indice: senza sezioni va in coda', () => {
  const r = pagina('h2', 'p');
  indiceLaterale(doc, r, []);
  assert.deepEqual(ordine(r), ['H2', 'P', 'INDICE']);
});
