import test from 'node:test';
import assert from 'node:assert/strict';
import { unisci } from '../../js/core/scheda-modello.js';
import { voceFermata, raggruppaLinee, voceLinee, tooltipFermata, tooltipLinee } from '../../js/layers/scheda-trasporto.js';

const dinamico = () => 'nodo';
const fermata = { id: 'S1', nome: 'Piazza Indipendenza', linee: ['100', 'TRAM1'], accessibile: 'Sì' };
const linea = (route_id, direzione, tipo = 'bus') => ({
  id: `linea-${route_id}-${direzione}`, route_id, numero: route_id, nome: `Nome ${route_id}`, tipo, direzione, da: 'A', a: 'B', fermate: ['S1', 'S2'],
});

test('fermata: titolo, badge, righe e hook dinamico', () => {
  const v = voceFermata(fermata, dinamico);
  assert.equal(v.titolo, 'Piazza Indipendenza');
  assert.equal(v.badge, 'Fermata');
  assert.deepEqual(v.gruppi[0].righe, [
    { etichetta: 'Linee', valore: '100, TRAM1' },
    { etichetta: 'Accessibile in carrozzina', valore: 'Sì' },
  ]);
  assert.equal(v.dinamico, dinamico);
});

test('fermata senza linee né accessibilità: nessuna riga vuota', () => {
  const v = voceFermata({ id: 'S4', nome: 'Fermata orfana', linee: [], accessibile: '' }, dinamico);
  assert.deepEqual(v.gruppi[0].righe, []);
  assert.equal(v.sempre, true);
});

test('raggruppaLinee: una voce per linea con le due direzioni in ordine, senza duplicati', () => {
  const g = raggruppaLinee([linea('101', 1), linea('100', 1), linea('100', 0), linea('100', 0)]);
  assert.deepEqual(g.map(x => x.route_id), ['101', '100']); // ordine di comparsa
  assert.deepEqual(g[1].direzioni.map(d => d.direzione), [0, 1]);
  assert.equal(g[1].numero, '100');
});

test('voceLinee: una sola linea → titolo con numero e badge del tipo', () => {
  const v = voceLinee([linea('100', 0), linea('100', 1)], gruppi => gruppi);
  assert.equal(v.titolo, 'Linea 100');
  assert.equal(v.badge, 'Bus');
  assert.equal(voceLinee([linea('TRAM1', 0, 'tram')], gruppi => gruppi).badge, 'Tram');
});

test('voceLinee: tante linee sotto il clic → una sola voce «Linee (N)», senza badge, che raggruppa quando si disegna', () => {
  const tutte = ['100', '101', '102', '103'].flatMap(r => [linea(r, 0), linea(r, 1)]); // 8 tracciati sulla stessa strada
  const v = voceLinee(tutte, gruppi => gruppi.length);
  assert.equal(v.titolo, 'Linee (4)');
  assert.equal(v.badge, undefined);
  assert.equal(v.chiave, 'linee');
  assert.equal(v.dinamico(), 4);
});

test('unisci: le sezioni senza righe restano e conservano il hook dinamico', () => {
  const { sezioni } = unisci([voceFermata({ id: 'S4', nome: 'Fermata orfana', linee: [], accessibile: '' }, dinamico), voceLinee([linea('100', 0)], () => 'nodo')]);
  assert.equal(sezioni.length, 2);
  assert.equal(sezioni[0].dinamico, dinamico);
  assert.equal(sezioni[1].dinamico(), 'nodo');
  assert.deepEqual(sezioni.map(s => s.badges[0]), ['Fermata', 'Bus']);
});

test('tooltip fermata: nome e linee; senza linee lo dice', () => {
  assert.deepEqual(tooltipFermata(fermata), { titolo: 'Piazza Indipendenza', dettaglio: 'Linee 100, TRAM1' });
  assert.equal(tooltipFermata({ ...fermata, linee: [] }).dettaglio, 'Nessuna corsa nel feed');
});

test('tooltip linee: una per linea (le due direzioni insieme), al massimo `max`, con il conteggio delle altre', () => {
  const tutte = ['100', '101', '102'].flatMap(r => [{ ...linea(r, 0), colore: '#111111' }, { ...linea(r, 1), colore: '#111111' }]);
  assert.deepEqual(tooltipLinee(tutte.slice(0, 2)), { linee: [{ numero: '100', nome: 'Nome 100', colore: '#111111' }], altre: 0 });
  const t = tooltipLinee(tutte, 2);
  assert.deepEqual(t.linee.map(l => l.numero), ['100', '101']);
  assert.equal(t.altre, 1);
});

test('stazione ferroviaria: strato, icona e badge della ferrovia', () => {
  const v = voceFermata({ id: 'f830012002', nome: 'Palermo Centrale', linee: ['M1'], accessibile: 'Sì', tipo: 'ferrovia' }, dinamico);
  assert.equal(v.strato, 'trasporto-stazioni');
  assert.equal(v.icona, 'treno');
  assert.equal(v.badge, 'Stazione');
});

test('fermata AMAT: strato, icona e badge invariati', () => {
  const v = voceFermata(fermata, dinamico);
  assert.equal(v.strato, 'trasporto-fermate');
  assert.equal(v.icona, 'bus');
  assert.equal(v.badge, 'Fermata');
});

test('una sola linea ferroviaria: icona treno e badge Metro', () => {
  const v = voceLinee([linea('ferrovia-1', 0, 'ferrovia')], () => 'nodo');
  assert.equal(v.icona, 'treno');
  assert.equal(v.badge, 'Metro');
});
