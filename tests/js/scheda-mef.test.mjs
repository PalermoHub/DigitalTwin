import test from 'node:test';
import assert from 'node:assert/strict';
import { leggiBeni, righeBene, voceMef, modelloTooltipMef, MAX_BENI } from '../../js/layers/scheda-mef.js';
import { unisci } from '../../js/core/scheda-modello.js';

const BENE = {
  id: '19105', natura: 'Fabbricato', tipologia: 'Abitazione', indirizzo: 'Via Roma 3', superficie_mq: 85.5, cubatura_mc: 250,
  epoca: '1950-1970', catastale: 'F.1 P.2', utilizzo: 'Uso diretto', vincolo: 'No', giuridica: 'Patrimonio disponibile', precisione: 'catastale',
};
const etichette = righe => righe.map(r => r.etichetta);
const valore = (righe, e) => righe.find(r => r.etichetta === e)?.valore;

test('leggiBeni: stringa JSON, array, e dati rotti o assenti', () => {
  assert.deepEqual(leggiBeni({ beni: JSON.stringify([BENE]) }), [BENE]);
  assert.deepEqual(leggiBeni({ beni: [BENE] }), [BENE]);
  assert.deepEqual(leggiBeni({ beni: '{non json' }), []);
  assert.deepEqual(leggiBeni({ beni: '{"a":1}' }), []);
  assert.deepEqual(leggiBeni({}), []);
});

test('righeBene: unità di misura e righe presenti, in ordine', () => {
  const r = righeBene(BENE);
  assert.equal(valore(r, 'Superficie'), '85,5 m²');
  assert.equal(valore(r, 'Cubatura'), '250 m³');
  assert.equal(valore(r, 'Indirizzo'), 'Via Roma 3');
  assert.deepEqual(etichette(r).slice(0, 3), ['Natura', 'Indirizzo', 'Superficie']);
});

test('righeBene: i valori assenti non compaiono', () => {
  const r = righeBene({ id: '1', natura: 'Terreno', precisione: 'catastale' });
  assert.deepEqual(etichette(r), ['Natura', 'Posizione']);
});

test('righeBene: la posizione approssimata è dichiarata come tale', () => {
  assert.match(valore(righeBene({ ...BENE, precisione: 'strada' }), 'Posizione'), /approssimata/);
  assert.match(valore(righeBene({ ...BENE, precisione: 'comune' }), 'Posizione'), /approssimata/);
  assert.doesNotMatch(valore(righeBene({ ...BENE, precisione: 'catastale' }), 'Posizione'), /approssimata/);
});

test('voceMef: un solo bene, nessun titolo di gruppo', () => {
  const v = voceMef({ forma: 'edificio', id_edificio: 42, n_beni: 1, anno: 2023, beni: JSON.stringify([BENE]) });
  assert.equal(v.chiave, 'mef-42');
  assert.equal(v.strato, 'mef-immobili');
  assert.equal(v.titolo, 'Immobili dichiarati al MEF');
  assert.equal(v.peso, 56);
  assert.equal(v.badge, '2023');
  assert.equal(v.gruppi.length, 1);
  assert.equal(v.gruppi[0].titolo, undefined);
  assert.match(v.link.url, /^https:\/\/www\.de\.mef\.gov\.it\//);
  assert.equal(unisci([v]).sezioni.length, 1);
});

test('voceMef: più beni, un gruppo ciascuno con la tipologia', () => {
  const beni = [BENE, { ...BENE, id: '2', tipologia: 'Negozio' }];
  const v = voceMef({ forma: 'edificio', id_edificio: 7, n_beni: 2, anno: 2023, beni: JSON.stringify(beni) });
  assert.deepEqual(v.gruppi.map(g => g.titolo), ['1. Abitazione', '2. Negozio']);
});

test('voceMef: oltre il massimo mostra i primi e il numero degli altri', () => {
  const beni = Array.from({ length: MAX_BENI + 5 }, (_, i) => ({ ...BENE, id: String(i) }));
  const v = voceMef({ forma: 'edificio', id_edificio: 9, n_beni: beni.length, anno: 2023, beni: JSON.stringify(beni) });
  assert.equal(v.gruppi.length, MAX_BENI + 1);
  const ultimo = v.gruppi.at(-1).righe[0];
  assert.deepEqual(ultimo, { etichetta: 'Altri beni dichiarati', valore: '5' });
});

test('voceMef: un punto prende la chiave dal primo bene', () => {
  const v = voceMef({ forma: 'punto', n_beni: 1, posizione: 'terreno', anno: 2023, beni: JSON.stringify([{ id: '55', natura: 'Terreno', precisione: 'catastale' }]) });
  assert.equal(v.chiave, 'mef-p55');
});

test('modelloTooltipMef: titolo, numero di beni e indirizzo', () => {
  const m = modelloTooltipMef({ n_beni: 2, beni: JSON.stringify([BENE, BENE]) });
  assert.equal(m.titolo, 'Immobili dichiarati al MEF');
  assert.equal(valore(m.righe, 'Beni dichiarati'), '2');
  assert.equal(valore(m.righe, 'Indirizzo'), 'Via Roma 3');
});
