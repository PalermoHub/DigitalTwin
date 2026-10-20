import test from 'node:test';
import assert from 'node:assert/strict';
import { riconosci, creaAzioni, distanza } from '../../js/core/chat-bot-azioni.js';

const voci = [
  { etichetta: 'Colonnina lontana', nota: 'libera', strato: 'colonnine', zoom: 17, lon: 13.40, lat: 38.15 },
  { etichetta: 'Colonnina vicina', nota: 'occupata', strato: 'colonnine', zoom: 17, lon: 13.3601, lat: 38.1101 },
  { etichetta: 'Fontanella A', strato: 'fontanelle', lon: 13.36, lat: 38.11 },
  { etichetta: 'Fontanella B', strato: 'fontanelle', lon: 13.37, lat: 38.12 },
];
const classifica = { 2021: { quartieri: [['Vecchio', 10, 0]] }, 2023: { quartieri: [['Zisa', 32704, 0], ['Resuttana - S.Lorenzo', 40171, 0], ['Libertà', 40186, 0]], circoscrizioni: [['VIII', 116713, 0]], upl: [] } };
const azioni = (extra = {}) => creaAzioni({ voci: async () => voci, classifica: async () => classifica, posizione: async () => ({ lat: 38.11, lon: 13.36 }), attivi: () => [], ...extra });

test('riconosce le frasi e lascia stare le domande della guida', () => {
  assert.equal(riconosci('cosa vedo ora sulla mappa?').tipo, 'attivi');
  assert.equal(riconosci("qual è la colonnina più vicina a me?").tipo, 'vicino');
  assert.equal(riconosci('quante fontanelle ci sono').tipo, 'conteggio');
  assert.equal(riconosci('dove trovo le colonnine di ricarica?'), null);
  assert.equal(riconosci('come funziona la scheda'), null);
});

test('il punto più vicino viene prima, con la distanza', async () => {
  const r = await azioni()('colonnina più vicina a me');
  assert.equal(r.oggetti[0].etichetta, 'Colonnina vicina');
  assert.match(r.oggetti[0].nota, /^\d+ m · occupata$/);
  assert.equal(r.oggetti[0].strato, 'colonnine');
});

test('senza posizione lo dice', async () => {
  const r = await azioni({ posizione: async () => { throw new Error('no'); } })('fontanella più vicina a me');
  assert.match(r.testo, /posizione/);
});

test('conteggio totale; con una zona nella frase passa alla guida', async () => {
  assert.match((await azioni()('quante fontanelle ci sono?')).testo, /2 fontanelle/);
  assert.equal(await azioni()('quante fontanelle ci sono alla Zisa?'), null);
});

test('classifica e residenti di una zona (ultimo anno)', async () => {
  assert.match((await azioni()('qual è il quartiere più popoloso?')).testo, /Libertà \(40\.186\)/);
  assert.match((await azioni()('quanti abitanti ha la Zisa?')).testo, /Zisa.*32\.704.*2023/);
  assert.match((await azioni()('abitanti di Resuttana')).testo, /Resuttana - S\.Lorenzo/);
  assert.equal(await azioni()('quanti abitanti ha Gotham'), null);
});

test('i layer accesi', async () => {
  assert.deepEqual((await azioni({ attivi: () => [{ id: 'scuole', nome: 'Scuole' }] })('layer accesi')).strati, ['scuole']);
  assert.match((await azioni()('cosa vedo')).testo, /Nessun layer/);
});

test('distanza in metri', () => assert.ok(Math.abs(distanza({ lat: 38, lon: 13 }, { lat: 38.01, lon: 13 }) - 1112) < 5));

test('le stesse frasi in inglese', async () => {
  assert.equal(riconosci('what am I looking at?').tipo, 'attivi');
  assert.equal(riconosci('which layers are on').tipo, 'attivi');
  assert.equal(riconosci('closest charging point to me').tipo, 'vicino');
  assert.equal(riconosci('how many drinking fountains are there?').tipo, 'conteggio');
  assert.equal(riconosci('most populous district').livello, 'quartieri');
  assert.equal(riconosci('where can I find charging points?'), null);
  assert.match((await azioni()('how many residents does Zisa have?')).testo, /Zisa.*32\.704/);
});
