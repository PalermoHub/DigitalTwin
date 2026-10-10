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
  assert.deepEqual(etichette(r).slice(0, 4), ['Tipologia', 'Natura', 'Indirizzo', 'Superficie']);
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

test('voceMef: un solo bene, righe in un gruppo senza titolo e con la tipologia', () => {
  const v = voceMef({ forma: 'edificio', id_edificio: 42, n_beni: 1, anno: 2023, beni: JSON.stringify([BENE]) });
  assert.equal(v.chiave, 'mef-42');
  assert.equal(v.strato, 'mef-immobili');
  assert.equal(v.titolo, 'Immobile dichiarato al MEF');
  assert.equal(v.peso, 56);
  assert.equal(v.badge, '2023');
  assert.equal(v.gruppi.length, 1);
  assert.equal(v.gruppi[0].titolo, undefined);
  assert.equal(valore(v.gruppi[0].righe, 'Tipologia'), 'Abitazione');
  assert.equal(v.accordion, undefined);
  assert.match(v.link.url, /^https:\/\/www\.de\.mef\.gov\.it\//);
  assert.equal(unisci([v]).sezioni.length, 1);
});

test('voceMef: più beni, un elemento di accordion ciascuno con tutte le sue righe (anche dopo unisci)', () => {
  const secondo = { ...BENE, id: '2', tipologia: 'Negozio', indirizzo: 'Via Roma 5', superficie_mq: 40, catastale: 'F.1 P.2 S.2', utilizzo: 'Locato a terzi' };
  const v = voceMef({ forma: 'edificio', id_edificio: 7, n_beni: 2, anno: 2023, beni: JSON.stringify([BENE, secondo]) });
  assert.deepEqual(v.accordion.elementi.map(e => e.titolo), ['Abitazione', 'Negozio']);
  assert.deepEqual(v.accordion.elementi.map(e => e.anteprima), ['Via Roma 3', 'Via Roma 5']);
  const sezione = unisci([v]).sezioni[0];
  const negozio = sezione.accordion.elementi[1].righe;
  assert.equal(valore(negozio, 'Indirizzo'), 'Via Roma 5');
  assert.equal(valore(negozio, 'Superficie'), '40 m²');
  assert.equal(valore(negozio, 'Identificativo catastale'), 'F.1 P.2 S.2');
  assert.equal(valore(negozio, 'Utilizzo'), 'Locato a terzi');
  assert.equal(valore(negozio, 'Tipologia'), 'Negozio');
  assert.match(sezione.accordion.riassunto, /^2 /);
});

test('voceMef: oltre il massimo mostra i primi e il numero degli altri', () => {
  const beni = Array.from({ length: MAX_BENI + 5 }, (_, i) => ({ ...BENE, id: String(i), indirizzo: `Via Roma ${i}` }));
  const v = voceMef({ forma: 'edificio', id_edificio: 9, n_beni: beni.length, anno: 2023, beni: JSON.stringify(beni) });
  assert.equal(v.accordion.elementi.length, MAX_BENI);
  assert.match(v.accordion.riassunto, new RegExp(`^${MAX_BENI + 5} `));
  assert.deepEqual(v.gruppi.at(-1).righe, [{ etichetta: 'Altri beni dichiarati', valore: '5' }]);
  assert.equal(unisci([v]).sezioni[0].accordion.elementi.length, MAX_BENI);
});

test('voceMef: un punto prende la chiave dal primo bene', () => {
  const v = voceMef({ forma: 'punto', n_beni: 1, posizione: 'terreno', anno: 2023, beni: JSON.stringify([{ id: '55', natura: 'Terreno', precisione: 'catastale' }]) });
  assert.equal(v.chiave, 'mef-p55');
});

test('modelloTooltipMef: titolo, numero di beni e indirizzo', () => {
  const m = modelloTooltipMef({ n_beni: 2, beni: JSON.stringify([BENE, BENE]) });
  assert.equal(m.titolo, 'Immobile dichiarato al MEF');
  assert.equal(valore(m.righe, 'Beni dichiarati'), '2');
  assert.equal(valore(m.righe, 'Indirizzo'), 'Via Roma 3');
});

import { etichettaLocalizzazione } from '../../js/layers/scheda-mef.js';

test('etichettaLocalizzazione: fonte e, se corretta, la posizione MEF corretta', () => {
  assert.equal(etichettaLocalizzazione({ localizzazione: 'catasto', verifica: 'concorde' }), 'Catasto');
  assert.equal(etichettaLocalizzazione({ localizzazione: 'catasto', verifica: 'corretto' }), 'Catasto (posizione MEF corretta)');
  assert.equal(etichettaLocalizzazione({ localizzazione: 'immobili-comunali', verifica: 'concorde' }), 'Immobili comunali');
  assert.equal(etichettaLocalizzazione({ localizzazione: 'scuole', verifica: 'corretto' }), 'Scuole (posizione MEF corretta)');
  assert.equal(etichettaLocalizzazione({ localizzazione: 'posizione', verifica: 'non verificabile' }), 'Posizione dichiarata');
  assert.equal(etichettaLocalizzazione({}), null);
  assert.equal(etichettaLocalizzazione({ localizzazione: 'sconosciuta' }), null);
});

test('righeBene: riga Localizzazione dopo la posizione', () => {
  const r = righeBene({ ...BENE, localizzazione: 'catasto', verifica: 'corretto' });
  assert.equal(valore(r, 'Localizzazione'), 'Catasto (posizione MEF corretta)');
  assert.ok(!etichette(righeBene(BENE)).includes('Localizzazione'));
});

test('voceMef: la chiave usa id_poligono (e id_edificio per i dati vecchi)', () => {
  assert.equal(voceMef({ forma: 'terreno', id_poligono: 't55-1704', n_beni: 1, beni: JSON.stringify([BENE]) }).chiave, 'mef-t55-1704');
  assert.equal(voceMef({ forma: 'edificio', id_edificio: 5, n_beni: 1, beni: JSON.stringify([BENE]) }).chiave, 'mef-5');
});
