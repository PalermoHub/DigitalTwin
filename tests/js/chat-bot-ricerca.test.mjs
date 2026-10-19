import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rispondi, domandeIniziali, anteprima, caricaIndice, blocchiTesto, SOGLIA } from '../../js/core/chat-bot-ricerca.js';

const voci = [
  { id: 'a#1', file: 'a.md', titolo: 'Cambiare i colori di uno strato', parole: 'colori, tavolozza, riempimento', domande: ['Come cambio i colori di un layer?'], testo: 'Apri il pannello Colori dello strato.' },
  { id: 'a#2', file: 'a.md', titolo: 'Stampare la mappa', parole: 'stampa, formato, A4', domande: ['Come stampo la mappa?', 'Posso stampare in A0?'], testo: 'Il pulsante stampa apre le opzioni.' },
  { id: 'b#1', file: 'b.md', titolo: 'Pendenza del terreno', parole: 'pendenza, gradi, esposizione', domande: ['Quanto è ripido il terreno?'], testo: 'La pendenza è in gradi.' },
];

test('rispondi trova la sezione dalle parole chiave', () => {
  assert.equal(rispondi(voci, 'tavolozza dei colori').trovate[0].id, 'a#1');
});
test('rispondi ignora accenti e maiuscole', () => {
  assert.equal(rispondi(voci, 'PENDENZA').trovate[0].id, 'b#1');
  assert.equal(rispondi(voci, 'pendènza').trovate[0].id, 'b#1');
});
test('rispondi: domanda vuota -> niente', () => {
  const r = rispondi(voci, '   ');
  assert.deepEqual([r.trovate, r.vicine], [[], []]);
});
test('rispondi: solo parole vuote -> niente risposta', () => {
  assert.deepEqual(rispondi(voci, 'come cosa dove').trovate, []);
});
test('rispondi: fuori tema -> non lo so e al massimo 3 domande vicine', () => {
  const r = rispondi(voci, 'ricetta della pasta al forno');
  assert.deepEqual(r.trovate, []);
  assert.ok(r.vicine.length <= 3);
});
test('rispondi: una sola risposta, la migliore', () => {
  assert.equal(rispondi(voci, 'stampa mappa formato').trovate.length, 1);
});
test('anteprima: testo breve -> nessun «altro»', () => {
  assert.deepEqual(anteprima('Una riga.'), { breve: 'Una riga.', c_e_altro: false });
});
test('anteprima: taglia a 3 blocchi e non spezza un elenco', () => {
  const testo = 'Uno.\n\nDue.\n\n- a\n- b\n- c\n\nQuattro.';
  const r = anteprima(testo, 3);
  assert.equal(r.breve, 'Uno.\n\nDue.\n\n- a\n- b\n- c');
  assert.equal(r.c_e_altro, true);
});
test('domandeIniziali: n domande distinte, ciascuna con ?', () => {
  const d = domandeIniziali(voci, 3);
  assert.equal(d.length, 3);
  assert.equal(new Set(d).size, 3);
  assert.ok(d.every(x => x.endsWith('?')));
});
test('caricaIndice: lancia se la risposta non è ok', async () => {
  await assert.rejects(caricaIndice(async () => ({ ok: false, status: 404 })), /404/);
});
test('caricaIndice: restituisce le voci', async () => {
  assert.deepEqual(await caricaIndice(async () => ({ ok: true, json: async () => voci })), voci);
});

test('indice reale: ogni «domanda tipica» porta alla propria sezione tra le prime 3 candidate (tolleranza 3%: domande senza contesto come «Quanti sono?»)', () => {
  const reali = JSON.parse(readFileSync(new URL('../../guida/indice.json', import.meta.url), 'utf8'));
  const sbagliate = [];
  let totale = 0;
  for (const v of reali) for (const d of v.domande) {
    totale++;
    const r = rispondi(reali, d, 3);
    if (!r.candidate.some(c => c.id === v.id)) sbagliate.push(`${v.id}: ${d}`);
  }
  assert.ok(sbagliate.length <= totale * 0.03, `${sbagliate.length} non trovate:\n${sbagliate.slice(0, 15).join('\n')}`);
});
test('SOGLIA è un numero positivo', () => assert.ok(SOGLIA > 0));

test('blocchiTesto: un elenco subito dopo una riga diventa un blocco a sé', () => {
  assert.deepEqual(blocchiTesto('Contiene:\n- uno\n- due\n\nFine.'), [
    { tipo: 'p', righe: ['Contiene:'] },
    { tipo: 'ul', righe: ['uno', 'due'] },
    { tipo: 'p', righe: ['Fine.'] },
  ]);
});
test('blocchiTesto: righe consecutive di testo restano un solo paragrafo; i titoli # perdono il cancelletto', () => {
  assert.deepEqual(blocchiTesto('### Titolo\nriga a\nriga b'), [{ tipo: 'p', righe: ['Titolo', 'riga a', 'riga b'] }]);
});

test('rispondi: le parole si confrontano dall\'inizio, non come pezzi di altre parole («bus» non è «abusi»)', () => {
  const v = [
    { id: 'x#1', file: 'x.md', titolo: 'Abusi edilizi e condono', parole: 'abusi, sanatoria', domande: ['Cosa sono gli abusi?'], testo: 'Testo sugli abusi.' },
    { id: 'x#2', file: 'x.md', titolo: 'Linee degli autobus', parole: 'bus, autobus, linee', domande: ['Dove passa il bus?'], testo: 'Le linee.' },
  ];
  assert.deepEqual(rispondi(v, 'bus').trovate.map(x => x.id), ['x#2']);
});
test('rispondi: «bus» sull\'indice reale non porta alla sezione sulle domande senza risposta', () => {
  const reali = JSON.parse(readFileSync(new URL('../../guida/indice.json', import.meta.url), 'utf8'));
  const r = rispondi(reali, 'bus');
  assert.ok(r.trovate.length === 1 && !/non risponde/.test(r.trovate[0].titolo), r.trovate[0]?.titolo);
});

const vociEn = [
  { id: 'a#1', file: 'a.md', titolo: 'Changing the colors of a layer', parole: 'colors, palette, fill, layer', domande: ['How do I change the colors of a layer?'], testo: 'Open the Colors panel of the layer.' },
  { id: 'a#2', file: 'a.md', titolo: 'Printing the map', parole: 'print, format, A4', domande: ['How do I print the map?'], testo: 'The print button opens the options.' },
];
const finto = (risposte) => { const url = []; const f = async (u) => { url.push(u); return risposte[url.length - 1] ?? risposte.at(-1); }; return { f, url }; };

test('caricaIndice: in inglese scarica indice.en.json', async () => {
  const { f, url } = finto([{ ok: true, json: async () => vociEn }]);
  assert.deepEqual(await caricaIndice(f, null, 'en'), vociEn);
  assert.deepEqual(url, ['guida/indice.en.json']);
});
test('caricaIndice: in italiano scarica indice.json', async () => {
  const { f, url } = finto([{ ok: true, json: async () => voci }]);
  assert.deepEqual(await caricaIndice(f, null, 'it'), voci);
  assert.deepEqual(url, ['guida/indice.json']);
});
test('caricaIndice: indice inglese non disponibile → ripiega sull\'italiano', async () => {
  const { f, url } = finto([{ ok: false, status: 404 }, { ok: true, json: async () => voci }]);
  assert.deepEqual(await caricaIndice(f, null, 'en'), voci);
  assert.deepEqual(url, ['guida/indice.en.json', 'guida/indice.json']);
});
test('caricaIndice: indice inglese che lancia → ripiega sull\'italiano', async () => {
  let n = 0;
  const f = async () => { if (n++ === 0) throw new Error('offline'); return { ok: true, json: async () => voci }; };
  assert.deepEqual(await caricaIndice(f, null, 'en'), voci);
});
test('caricaIndice: falliscono entrambi → errore', async () => {
  const { f, url } = finto([{ ok: false, status: 404 }, { ok: false, status: 500 }]);
  await assert.rejects(caricaIndice(f, null, 'en'), /500/);
  assert.equal(url.length, 2);
});
test('caricaIndice: con url esplicito nessun ripiego', async () => {
  const { f, url } = finto([{ ok: false, status: 404 }, { ok: true, json: async () => voci }]);
  await assert.rejects(caricaIndice(f, 'x/y.json', 'en'), /404/);
  assert.deepEqual(url, ['x/y.json']);
});
test('rispondi: «what is the pendulum» non risponde per le sole parole vuote', () => {
  assert.deepEqual(rispondi(vociEn, 'what is the pendulum').trovate, []);
  assert.deepEqual(rispondi(vociEn, 'where can you show this about that').trovate, []);
});
test('rispondi: «layers» trova la voce che dice «layer»', () => {
  assert.equal(rispondi(vociEn, 'layers').trovate[0].id, 'a#1');
  assert.equal(rispondi(vociEn, 'change the colors').trovate[0].id, 'a#1');
});
