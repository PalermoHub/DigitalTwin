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

test('unisciTerreno: rilievo ed elevazione in un solo piano, in fondo', async () => {
  const { unisciTerreno } = await import('../../js/core/strati-3d-modello.js');
  const g = unisciTerreno([{ id: 'base', base: true, layers: ['b'] }, { id: 'catasto', layers: ['c'] }, { id: 'rilievo3d', layers: ['h'] }, { id: 'elevazione', layers: ['e'] }]);
  assert.deepEqual(g.map(x => x.id), ['terreno', 'base', 'catasto']);
  assert.deepEqual(g[0].layers, ['h', 'e']);
  assert.deepEqual(unisciTerreno([{ id: 'catasto', layers: ['c'] }]).map(x => x.id), ['catasto']);
  // il limite dei piani non taglia né la base né il terreno
  assert.deepEqual(limitaPiani([g[0], g[1], { id: 'a' }, { id: 'b' }], 3).piani.map(x => x.id), ['terreno', 'base', 'b']);
});

test('terreno: quota Terrarium e zoom dei tile entro il tetto', async () => {
  const { quotaTerrarium, zoomTile } = await import('../../js/core/strati-3d-terreno.js');
  assert.equal(quotaTerrarium(128, 0, 0), 0);
  assert.equal(quotaTerrarium(130, 88, 128), 600.5);
  // una vista di circa 0,0004 unità Mercator (≈ 16 km) a zoom 14: si scende finché i tile sono al più 48
  const z = zoomTile(0.5370, 0.3880, 0.5374, 0.3884, 14);
  const n = 2 ** z;
  assert.ok((Math.floor(0.5374 * n) - Math.floor(0.5370 * n) + 1) * (Math.floor(0.3884 * n) - Math.floor(0.3880 * n) + 1) <= 48);
  assert.ok(z <= 15 && z >= 10);
});

test('etichettaFeature: catasto, campi noti con dettaglio, ripieghi', async () => {
  const { etichettaFeature } = await import('../../js/core/strati-3d-modello.js');
  assert.deepEqual(etichettaFeature({ Foglio: 54, Paricella: '312', fid: 9 }), { foglio: '54', particella: '312' });
  assert.deepEqual(etichettaFeature({ ZTO: 'B2', DESCRIZION: 'Zona residenziale', fid: 1 }), { titolo: 'B2', sotto: 'Zona residenziale' });
  assert.deepEqual(etichettaFeature({ fid: 3, colore: 'rosso' }), { titolo: 'rosso', sotto: '' });
  assert.deepEqual(etichettaFeature({ fid: 3, pop21: 1250 }), { titolo: `pop21: ${(1250).toLocaleString()}`, sotto: '' });
  assert.equal(etichettaFeature({ fid: 3 }), null);
});

test('layerDaInterrogare: i layer di servizio degli strati disegnati come immagini', async () => {
  const { layerDaInterrogare } = await import('../../js/core/strati-3d-modello.js');
  assert.deepEqual(layerDaInterrogare({ id: 'prg', layers: ['prg-zto', 'prg-ppe'] }), ['prg-zto', 'prg-ppe', 'prg-zto-hit', 'prg-ns-hit', 'prg-cs-hit']);
  assert.deepEqual(layerDaInterrogare({ id: 'terreno', strati: ['rilievo3d', 'elevazione'], layers: ['h', 'e'] }), ['h', 'e', 'griglia-hit']);
  assert.deepEqual(layerDaInterrogare({ id: 'altri', layers: ['x'] }), ['x']);
});
