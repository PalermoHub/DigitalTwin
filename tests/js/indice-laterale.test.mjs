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

test('indice: le voci {gruppo} diventano intestazioni e l\'indice sta prima della prima sezione, non prima dell\'intestazione', () => {
  const r = pagina('h2', 'p', 'h2', 'section', 'section', 'h2', 'section');
  const voci = [{ gruppo: 'Plugin' }, { titolo: 'A', sezione: r.children[3] }, { titolo: 'B', sezione: r.children[4] }, { gruppo: 'Casi d\'uso' }, { titolo: 'C', sezione: r.children[6] }];
  const nav = indiceLaterale(doc, r, voci);
  assert.deepEqual(ordine(r), ['H2', 'P', 'H2', 'INDICE', 'SECTION', 'SECTION', 'H2', 'SECTION']);
  const righe = nav.children[0].children;
  assert.deepEqual(righe.map(li => li.className), ['guida-indice-gruppo', '', '', 'guida-indice-gruppo', '']);
  assert.deepEqual(righe.map(li => li.textContent || li.children[0].textContent), ['Plugin', 'A', 'B', 'Casi d\'uso', 'C']);
});
