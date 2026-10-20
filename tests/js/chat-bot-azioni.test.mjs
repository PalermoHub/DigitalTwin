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

test('filtri a parole: importo per PNRR e opere, anno e gravità per gli incidenti', async () => {
  const { leggiFiltro, ammessoImporto, espressioneImporto } = await import('../../js/core/filtri-parole.js');
  assert.deepEqual(leggiFiltro('PNRR sopra 1 milione'), { strato: 'pnrr', min: 1e6, max: null });
  assert.deepEqual(leggiFiltro('opere pubbliche oltre 1,5 milioni di euro'), { strato: 'opere', min: 1.5e6, max: null });
  assert.deepEqual(leggiFiltro('progetti PNRR sotto 500 mila euro'), { strato: 'pnrr', min: null, max: 5e5 });
  assert.deepEqual(leggiFiltro('pnrr over 2.000.000'), { strato: 'pnrr', min: 2e6, max: null });
  assert.deepEqual(leggiFiltro('pnrr more than 100k'), { strato: 'pnrr', min: 1e5, max: null });
  assert.deepEqual(leggiFiltro('incidenti 2022'), { strato: 'incidenti', anno: 2022, gravita: null });
  assert.deepEqual(leggiFiltro('incidenti mortali del 2019 e 2021'), { strato: 'incidenti', anno: 2021, gravita: 'M' });
  assert.equal(leggiFiltro('incidenti'), null);
  assert.equal(leggiFiltro('cos è il PNRR?'), null);
  assert.equal(ammessoImporto(2e6, { min: 1e6 }), true);
  assert.equal(ammessoImporto(5e5, { min: 1e6 }), false);
  assert.equal(ammessoImporto(null, { min: 1e6 }), false);
  assert.equal(ammessoImporto(null, {}), true);
  assert.equal(espressioneImporto('pnrr', {}), null);
  assert.equal(espressioneImporto('pnrr', { min: 10 })[0], 'all');
});

test('il filtro viene applicato e si può togliere dal messaggio', async () => {
  let applicato = null;
  const r = await azioni({ filtra: f => { applicato = f; return () => { applicato = null; }; } })('PNRR sopra 1 milione');
  assert.equal(applicato.min, 1e6);
  assert.match(r.testo, /PNRR/);
  assert.match(r.testo, /sopra 1\.000\.000 €/);
  r.annulla();
  assert.equal(applicato, null);
  const i = await azioni({ filtra: () => () => {} })('incidenti mortali 2022');
  assert.match(i.testo, /anno 2022.*Mortale|anno 2022.*mortali/i);
});

test('«Come chiedere»: ogni esempio proposto è riconosciuto da Talia', async () => {
  const { vociAiuto, esempioCasuale } = await import('../../js/core/chat-bot-aiuto.js');
  const { t } = await import('../../js/core/i18n.js');
  const voci = vociAiuto(t);
  assert.ok(voci.every(g => g.titolo && g.esempi.every(Boolean)));
  const dellAzione = ['vicino', 'numeri', 'filtri'].flatMap(id => voci.find(g => g.id === id).esempi);
  const mancanti = dellAzione.filter(e => !riconosci(e));
  assert.deepEqual(mancanti, [], 'esempi che le azioni non riconoscono');
  assert.ok(esempioCasuale(voci, () => 0) === voci[0].esempi[0]);
});
