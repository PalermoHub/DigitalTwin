import test from 'node:test';
import assert from 'node:assert/strict';
import { percorsoLinea } from '../../js/layers/trasporto-percorso.js';

const linee = new Map([
  ['linea-1-0', { id: 'linea-1-0', route_id: '1', numero: '1', colore: '#f00', fermate: ['A', 'B'] }],
  ['linea-1-1', { id: 'linea-1-1', route_id: '1', numero: '1', colore: '#f00', fermate: ['B', 'A'] }],
  ['linea-2-0', { id: 'linea-2-0', route_id: '2', numero: '2', colore: '#0f0', fermate: ['C'] }],
]);
const geometrie = new Map([['linea-1-0', { type: 'LineString', coordinates: [[1, 1], [2, 2]] }], ['linea-1-1', { type: 'LineString', coordinates: [[2, 2], [1, 1]] }]]);
const fermate = new Map([['A', { lon: 1, lat: 1 }], ['B', { lon: 2, lat: 2 }], ['C', { lon: 9, lat: 9 }]]);

test('percorsoLinea: tutte le direzioni e le fermate senza doppioni, solo di quella linea', () => {
  const p = percorsoLinea('1', linee, geometrie, fermate);
  assert.equal(p.colore, '#f00');
  assert.equal(p.features.filter(f => f.geometry.type === 'LineString').length, 2);
  assert.deepEqual(p.features.filter(f => f.geometry.type === 'Point').map(f => f.geometry.coordinates), [[1, 1], [2, 2]]);
});

test('percorsoLinea: linea sconosciuta → null; fermata o tracciato mancanti ignorati', () => {
  assert.equal(percorsoLinea('9', linee, geometrie, fermate), null);
  assert.equal(percorsoLinea('2', linee, geometrie, fermate).features.length, 1);
});
