// tests/js/tabella-mappa.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { attiva, leggiVista, righeIn, poligoniArea } from '../../js/core/tabella/mappa.js';
import { riquadro } from '../../js/core/tabella/geom.js';

const sorgente = { id: 'col', strati: ['col-hit'], visibili: ['col-punti'], chiave: p => p.id };
const punto = (x, y, id) => ({ type: 'Feature', properties: { id }, geometry: { type: 'Point', coordinates: [x, y] } });

// mappa finta: strati con visibilità, e risposta fissa per queryRenderedFeatures
function mappaFinta({ strati = {}, risposte = {} } = {}) {
  return {
    getLayer: id => (id in strati ? { id } : undefined),
    getLayoutProperty: (id, p) => (p === 'visibility' ? strati[id] : undefined),
    queryRenderedFeatures: (a, b) => {
      const opzioni = b ?? a;
      return opzioni.layers.flatMap(l => risposte[l] ?? []);
    },
  };
}

test('attiva: serve lo strato hit e almeno uno strato visibile acceso', () => {
  assert.equal(attiva(mappaFinta({ strati: { 'col-hit': 'visible', 'col-punti': 'visible' } }), sorgente), true);
  assert.equal(attiva(mappaFinta({ strati: { 'col-hit': 'visible', 'col-punti': 'none' } }), sorgente), false);
  assert.equal(attiva(mappaFinta({ strati: { 'col-hit': 'visible', 'col-punti': undefined } }), sorgente), true, 'visibilità non impostata = visibile');
  assert.equal(attiva(mappaFinta({ strati: { 'col-punti': 'visible' } }), sorgente), false, 'manca lo strato hit');
});

test('leggiVista: righe deduplicate dalle feature in vista; errori di MapLibre → lista vuota', () => {
  const m = mappaFinta({ strati: { 'col-hit': 'visible', 'col-punti': 'visible' }, risposte: { 'col-hit': [punto(1, 1, 'a'), punto(1, 1, 'a'), punto(2, 2, 'b')] } });
  assert.equal(leggiVista(m, sorgente).length, 2);
  const rotta = { ...m, queryRenderedFeatures: () => { throw new Error('strato non pronto'); } };
  assert.deepEqual(leggiVista(rotta, sorgente), []);
});

test('righeIn: tiene le righe che toccano il criterio, anche solo con uno dei pezzi', () => {
  const righe = [
    { chiave: 'a', geometrie: [{ type: 'Point', coordinates: [5, 5] }] },
    { chiave: 'b', geometrie: [{ type: 'Point', coordinates: [50, 50] }] },
    { chiave: 'c', geometrie: [{ type: 'Point', coordinates: [60, 60] }, { type: 'Point', coordinates: [6, 6] }] },
  ];
  assert.deepEqual(righeIn(righe, [riquadro([0, 0], [10, 10])]).map(r => r.chiave), ['a', 'c']);
  assert.deepEqual(righeIn(righe, []), []);
});

test('poligoniArea: raccoglie tutti i pezzi dell’area con lo stesso valore, per livello', () => {
  const area = (Quartiere, coords) => ({ properties: { Quartiere, UPL: 'u1' }, geometry: { type: 'Polygon', coordinates: coords } });
  const q1a = area('Q1', riquadro([0, 0], [1, 1]));
  const q1b = area('Q1', riquadro([1, 0], [2, 1]));
  const q2 = area('Q2', riquadro([5, 5], [6, 6]));
  const m = mappaFinta({ strati: { 'confini-upl-fill': 'visible' }, risposte: { 'confini-upl-fill': [q1a, q1b, q2] } });
  // sotto il clic c'è q1a: la mappa finta risponde con tutti, quindi il primo trovato è q1a
  const pezzi = poligoniArea(m, { x: 1, y: 1 }, 'quartiere');
  assert.equal(pezzi.length, 2);
  assert.deepEqual(poligoniArea(mappaFinta(), { x: 1, y: 1 }, 'quartiere'), [], 'strato assente');
  assert.deepEqual(poligoniArea(m, { x: 1, y: 1 }, 'inesistente'), []);
});

test('leggiEsterni raggruppa gli strati dei layer aggiunti e legge il nome dai metadati', async () => {
  const { leggiEsterni } = await import('../../js/core/tabella/mappa.js');
  const mappa = { getStyle: () => ({ layers: [
    { id: 'miei-1a2b-fill', metadata: { dtNome: 'Ciclabili' } }, { id: 'miei-1a2b-line' }, { id: 'miei-1a2b-pt' },
    { id: 'rndt-zz-line' }, { id: 'rndt-raster' }, { id: 'colonnine-punti' },
  ] }) };
  const e = leggiEsterni(mappa);
  assert.equal(e.length, 2);
  assert.deepEqual(e[0], { id: 'miei-1a2b', nome: 'Ciclabili', strati: ['miei-1a2b-fill', 'miei-1a2b-line', 'miei-1a2b-pt'] });
  assert.equal(e[1].id, 'rndt-zz');
});
