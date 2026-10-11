import test from 'node:test';
import assert from 'node:assert/strict';
import { gruppiStrati, limitaPiani, puntoDaPiano, quote } from '../../js/core/strati-3d-modello.js';

const L = (id, extra = {}) => ({ id, type: 'fill', source: 'src-' + id.split('-')[0], ...extra });
const nascosto = { layout: { visibility: 'none' } };
const eBase = id => id.startsWith('base-') || id === 'water';

const STILE = [
  { id: 'base-osm', type: 'raster', source: 'osm', ...nascosto },
  L('water', { source: 'openmaptiles' }),
  L('catasto'), L('catasto-hit'), L('catasto-evidenza'),
  L('prg-zto'), L('prg-hit'),
  L('isole', nascosto),
  L('rndt-1', { source: 'rndt-x' }),
  L('edifici'),
];
const STRATI = [
  { id: 'catasto', etichetta: 'Catasto', layers: ['catasto'] },
  { id: 'prg', etichetta: 'PRG', layers: ['prg-zto'] },
  { id: 'isole', etichetta: 'Isole', layers: ['isole'] },
  { id: 'edificato', etichetta: 'Edificato', layers: ['edifici'] },
];

test('gruppiStrati: base in fondo, poi gli strati accesi nell\'ordine di disegno, poi gli altri layer', () => {
  const accesi = new Set(['edificato', 'catasto', 'prg', 'isole']);
  const g = gruppiStrati(STILE, STRATI, id => accesi.has(id), eBase);
  assert.deepEqual(g.map(x => x.id), ['base', 'catasto', 'prg', 'altri', 'edificato']);
  assert.deepEqual(g[0].layers, ['water']); // la base raster nascosta non conta
  assert.deepEqual(g.find(x => x.id === 'altri').layers, ['rndt-1']); // i layer di servizio dei moduli (hit, evidenza) no
});

test('gruppiStrati: uno strato acceso ma con i layer nascosti (o spento) non fa piano', () => {
  const g = gruppiStrati(STILE, STRATI, id => id === 'isole', eBase);
  assert.deepEqual(g.map(x => x.id), ['base', 'altri']);
});

test('limitaPiani: tiene la base e i piani più in alto', () => {
  const gruppi = [{ id: 'base', base: true }, { id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  assert.deepEqual(limitaPiani(gruppi, 3), { piani: [gruppi[0], gruppi[3], gruppi[4]], fuori: 2 });
  assert.deepEqual(limitaPiani(gruppi, 9), { piani: gruppi, fuori: 0 });
});

test('puntoDaPiano: angoli e centro di una vista ruotata', () => {
  const angoli = [[0, 0], [4, 2], [3, 5], [-1, 3]]; // no, ne, se, so
  assert.deepEqual(puntoDaPiano(angoli, 0, 0), [0, 0]);
  assert.deepEqual(puntoDaPiano(angoli, 1, 0), [4, 2]);
  assert.deepEqual(puntoDaPiano(angoli, 1, 1), [3, 5]);
  assert.deepEqual(puntoDaPiano(angoli, 0.5, 0.5), [1.5, 2.5]);
});

test('quote: passo costante dal basso', () => {
  assert.deepEqual(quote(3, 1000), [0, 75, 150]);
});
