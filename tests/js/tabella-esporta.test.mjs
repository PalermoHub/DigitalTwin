import test from 'node:test';
import assert from 'node:assert/strict';
import { csv, geojson, nomeFile } from '../../js/core/tabella/esporta.js';

const riga = (proprieta, geometrie = [{ type: 'Point', coordinates: [13.36, 38.11] }]) => ({ chiave: 'x', layer: 'l', proprieta, geometrie });
const cols = campi => campi.map(campo => ({ campo, visibile: true, esporta: true }));

test('csv: BOM, intestazione con i campi originali, fine riga CRLF', () => {
  const t = csv([riga({ a: 1, b: 'x' })], cols(['a', 'b']));
  assert.equal(t, '﻿a,b\r\n1,x\r\n');
});

test('csv: virgole, virgolette e a capo vanno tra virgolette; vuoti e null restano vuoti', () => {
  const t = csv([riga({ a: 'uno, due', b: 'dice "ciao"', c: 'riga\nnuova', d: null })], cols(['a', 'b', 'c', 'd', 'e']));
  assert.equal(t, '﻿a,b,c,d,e\r\n"uno, due","dice ""ciao""","riga\nnuova",,\r\n');
});

test('csv: array e oggetti diventano testo leggibile', () => {
  const t = csv([riga({ linee: ['104', 'N1'], u: [{ nome: 'x' }] })], cols(['linee', 'u']));
  assert.equal(t, '﻿linee,u\r\n104; N1,"{""nome"":""x""}"\r\n');
});

test('csv: solo le colonne passate, nell’ordine passato, e colonna fonte opzionale', () => {
  const t = csv([riga({ a: 1, b: 2, c: 3 })], cols(['c', 'a']), { fonte: 'Comune, open data' });
  assert.equal(t, '﻿c,a,fonte\r\n3,1,"Comune, open data"\r\n');
});

test('csv: nessuna riga → solo l’intestazione', () => {
  assert.equal(csv([], cols(['a'])), '﻿a\r\n');
});

test('geojson: proprietà ridotte alle colonne, geometria, metadati', () => {
  const t = JSON.parse(geojson([riga({ a: 1, b: 'x', c: ['u', 'v'] })], cols(['a', 'c']), { layer: 'l', fonte: 'F', approssimata: true, data: '2026-10-08' }));
  assert.equal(t.type, 'FeatureCollection');
  assert.deepEqual(t.metadata, { layer: 'l', fonte: 'F', geometria_approssimata: true, data: '2026-10-08' });
  assert.deepEqual(t.features[0].properties, { a: 1, c: 'u; v' });
  assert.deepEqual(t.features[0].geometry, { type: 'Point', coordinates: [13.36, 38.11] });
});

test('geojson: riga senza geometria → geometry null; più pezzi → multipoligono', () => {
  const p = [[0, 0], [1, 0], [1, 1], [0, 0]];
  const t = JSON.parse(geojson([riga({ a: 1 }, []), riga({ a: 2 }, [{ type: 'Polygon', coordinates: [p] }, { type: 'Polygon', coordinates: [p] }])], cols(['a']), { layer: 'l', fonte: 'F', approssimata: false, data: 'd' }));
  assert.equal(t.features[0].geometry, null);
  assert.equal(t.features[1].geometry.type, 'MultiPolygon');
});

test('nomeFile: layer, data e estensione', () => {
  assert.equal(nomeFile('scuole', 'csv', new Date(2026, 9, 8)), 'scuole-2026-10-08.csv');
});

test('geojson: stringhe JSON di array diventano testo leggibile; numeri e booleani restano; null resta null', () => {
  const t = JSON.parse(geojson([riga({ linee: '["104","N1"]', n: 5, v: null })], cols(['linee', 'n', 'v']), { layer: 'l', fonte: 'F', approssimata: false, data: 'd' }));
  assert.equal(t.features[0].properties.linee, '104; N1');
  assert.equal(t.features[0].properties.n, 5);
  assert.equal(t.features[0].properties.v, null);
});
