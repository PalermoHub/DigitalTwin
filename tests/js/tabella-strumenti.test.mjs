// tests/js/tabella-strumenti.test.mjs
globalThis.document = { createElement: () => ({ style: {}, className: '', remove() {} }), addEventListener() {}, removeEventListener() {} };
import test from 'node:test';
import assert from 'node:assert/strict';
import { collegaStrumenti } from '../../js/core/tabella/strumenti.js';

function mappaFinta() {
  const gestori = {};
  const canvas = { style: {} };
  return {
    gestori,
    on: (e, f) => { (gestori[e] ??= new Set()).add(f); },
    off: (e, f) => gestori[e]?.delete(f),
    emetti: (e, ev) => [...(gestori[e] ?? [])].forEach(f => f(ev)),
    unproject: ([x, y]) => ({ lng: x / 100, lat: y / 100 }),
    getCanvas: () => canvas,
    getCanvasContainer: () => ({ append() {}, contains: () => false }),
    getLayer: () => undefined,
    queryRenderedFeatures: () => [],
    dragPan: { enable() {}, disable() {} },
    doubleClickZoom: { enable() {}, disable() {} },
    getSource: () => undefined,
  };
}
const evento = (x, y, extra = {}) => ({ point: { x, y }, lngLat: { lng: x / 100, lat: y / 100 }, originalEvent: { ctrlKey: false, metaKey: false, ...extra }, preventDefault() {} });

test('modo click: un clic dà un piccolo riquadro attorno al punto; Ctrl chiede di aggiungere', () => {
  const m = mappaFinta();
  const criteri = [];
  const s = collegaStrumenti(m, { suCriterio: (p, o) => criteri.push([p, o]), suMessaggio: () => {} });
  s.imposta('click');
  m.emetti('click', evento(500, 500));
  assert.equal(criteri.length, 1);
  assert.equal(criteri[0][0].length, 1);
  assert.equal(criteri[0][1].aggiungi, false);
  m.emetti('click', evento(500, 500, { ctrlKey: true }));
  assert.equal(criteri[1][1].aggiungi, true);
});

test('senza modo attivo i clic non fanno nulla; imposta(null) stacca i gestori', () => {
  const m = mappaFinta();
  let n = 0;
  const s = collegaStrumenti(m, { suCriterio: () => n++, suMessaggio: () => {} });
  m.emetti('click', evento(1, 1));
  s.imposta('click');
  s.imposta(null);
  m.emetti('click', evento(1, 1));
  assert.equal(n, 0);
  assert.equal(s.modo(), null);
});

test('modo riquadro: trascinamento oltre 3 px → criterio; trascinamento minimo ignorato', () => {
  const m = mappaFinta();
  const criteri = [];
  const s = collegaStrumenti(m, { suCriterio: p => criteri.push(p), suMessaggio: () => {} });
  s.imposta('riquadro');
  m.emetti('mousedown', evento(100, 100));
  m.emetti('mousemove', evento(300, 300));
  m.emetti('mouseup', evento(300, 300));
  assert.equal(criteri.length, 1);
  assert.deepEqual(criteri[0][0][0][0], [1, 1], 'primo vertice del primo anello del primo poligono');
  m.emetti('mousedown', evento(100, 100));
  m.emetti('mouseup', evento(101, 101));
  assert.equal(criteri.length, 1);
});

test('modo poligono: clic aggiungono vertici, doppio clic chiude; con meno di 3 vertici avvisa', () => {
  const m = mappaFinta();
  const criteri = [];
  const messaggi = [];
  const s = collegaStrumenti(m, { suCriterio: p => criteri.push(p), suMessaggio: t => messaggi.push(t) });
  s.imposta('poligono');
  m.emetti('click', evento(0, 0));
  m.emetti('click', evento(400, 0));
  m.emetti('dblclick', evento(400, 0));
  assert.equal(criteri.length, 0);
  assert.equal(messaggi.length, 1);
  m.emetti('click', evento(0, 0));
  m.emetti('click', evento(400, 0));
  m.emetti('click', evento(400, 400));
  m.emetti('dblclick', evento(400, 400));
  assert.equal(criteri.length, 1);
  assert.equal(criteri[0][0][0].length, 4, 'tre vertici + chiusura');
});

test('annulla: butta via il poligono in corso', () => {
  const m = mappaFinta();
  const criteri = [];
  const s = collegaStrumenti(m, { suCriterio: p => criteri.push(p), suMessaggio: () => {} });
  s.imposta('poligono');
  m.emetti('click', evento(0, 0));
  m.emetti('click', evento(400, 0));
  m.emetti('click', evento(400, 400));
  s.annulla();
  m.emetti('dblclick', evento(400, 400));
  assert.equal(criteri.length, 0);
});

test('modo area: nessuna area sotto il clic → messaggio', () => {
  const m = mappaFinta();
  const messaggi = [];
  const s = collegaStrumenti(m, { suCriterio: () => assert.fail('non deve chiamarlo'), suMessaggio: t => messaggi.push(t) });
  s.imposta('area');
  m.emetti('click', evento(10, 10));
  assert.equal(messaggi.length, 1);
});
