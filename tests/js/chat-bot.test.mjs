import test from 'node:test';
import assert from 'node:assert/strict';
import { creaConversazione } from '../../js/core/chat-bot-conversazione.js';

const voci = [
  { id: 'a#1', file: 'a.md', titolo: 'Cambiare i colori', parole: 'colori, tavolozza', domande: ['Come cambio i colori?'], testo: 'Uno.\n\nDue.\n\nTre.\n\nQuattro.' },
  { id: 'b#1', file: 'b.md', titolo: 'Stampare la mappa', parole: 'stampa, formato', domande: ['Come stampo la mappa?'], testo: 'Il pulsante stampa.' },
];
const carica = async () => voci;

test('avvia: presentazione e domande suggerite', async () => {
  const c = creaConversazione({ carica });
  await c.avvia();
  assert.equal(c.messaggi[0].tipo, 'presentazione');
  assert.deepEqual(c.suggerite, ['Come cambio i colori?', 'Come stampo la mappa?']);
});

test('chiedi: risposta con anteprima, «leggi tutto» e sezione di provenienza', async () => {
  const c = creaConversazione({ carica });
  await c.avvia();
  await c.chiedi('tavolozza colori');
  const [dom, ris] = c.messaggi.slice(-2);
  assert.equal(dom.tipo, 'utente');
  assert.equal(ris.tipo, 'risposta');
  assert.equal(ris.voce.id, 'a#1');
  assert.equal(ris.breve, 'Uno.\n\nDue.\n\nTre.');
  assert.equal(ris.cEAltro, true);
  assert.equal(ris.espansa, false);
});

test('commuta: espande e ripiega il messaggio', async () => {
  const c = creaConversazione({ carica });
  await c.avvia();
  await c.chiedi('colori');
  const ris = c.messaggi.at(-1);
  c.commuta(ris.id);
  assert.equal(c.messaggi.at(-1).espansa, true);
  c.commuta(ris.id);
  assert.equal(c.messaggi.at(-1).espansa, false);
});

test('chiedi: fuori tema -> non lo so con domande vicine', async () => {
  const c = creaConversazione({ carica });
  await c.avvia();
  await c.chiedi('ricetta della pasta');
  assert.equal(c.messaggi.at(-1).tipo, 'nonLoSo');
});

test('chiedi: domanda vuota non aggiunge messaggi', async () => {
  const c = creaConversazione({ carica });
  await c.avvia();
  const n = c.messaggi.length;
  await c.chiedi('   ');
  assert.equal(c.messaggi.length, n);
});

test('indice non caricabile: messaggio d\'errore, poi riprova ricarica', async () => {
  let ok = false;
  const c = creaConversazione({ carica: async () => { if (!ok) throw new Error('offline'); return voci; } });
  await c.avvia();
  await c.chiedi('colori');
  assert.equal(c.messaggi.at(-1).tipo, 'errore');
  ok = true;
  await c.chiedi('colori');
  assert.equal(c.messaggi.at(-1).tipo, 'risposta');
});

test('suCambio è chiamato a ogni cambiamento', async () => {
  let n = 0;
  const c = creaConversazione({ carica, suCambio: () => n++ });
  await c.avvia();
  await c.chiedi('colori');
  assert.ok(n >= 2);
});

test('pulisci: azzera la conversazione e rimette la presentazione con le domande suggerite', async () => {
  const c = creaConversazione({ carica });
  await c.avvia();
  await c.chiedi('colori');
  assert.ok(c.messaggi.length > 1);
  await c.pulisci();
  assert.deepEqual(c.messaggi.map(m => m.tipo), ['presentazione']);
  assert.deepEqual(c.suggerite, ['Come cambio i colori?', 'Come stampo la mappa?']);
});
test('pulisci: dopo aver pulito si può chiedere di nuovo', async () => {
  const c = creaConversazione({ carica });
  await c.avvia();
  await c.pulisci();
  await c.chiedi('stampa');
  assert.equal(c.messaggi.at(-1).tipo, 'risposta');
});

test('chiedi: gli oggetti trovati per nome si aggiungono alla risposta, o la sostituiscono se la guida non sa', async () => {
  const luogo = { etichetta: 'Teatro Massimo', nota: 'Teatri', strato: 'monumenti', lon: 13.35, lat: 38.12 };
  const c = creaConversazione({ carica, cercaOggetti: async testo => (/massimo/.test(testo) ? [luogo] : []) });
  await c.avvia();
  await c.chiedi('tavolozza colori massimo');
  assert.deepEqual(c.messaggi.at(-1).oggetti, [luogo]);
  await c.chiedi('teatro massimo');
  const m = c.messaggi.at(-1);
  assert.equal(m.tipo, 'luoghi');
  assert.deepEqual(m.oggetti, [luogo]);
  await c.chiedi('zzz');
  assert.equal(c.messaggi.at(-1).tipo, 'nonLoSo');
});

test('chiedi: se la ricerca degli oggetti fallisce la risposta resta', async () => {
  const c = creaConversazione({ carica, cercaOggetti: async () => { throw new Error('rete'); } });
  await c.avvia();
  await c.chiedi('tavolozza colori');
  assert.equal(c.messaggi.at(-1).tipo, 'risposta');
  assert.deepEqual(c.messaggi.at(-1).oggetti, []);
});
