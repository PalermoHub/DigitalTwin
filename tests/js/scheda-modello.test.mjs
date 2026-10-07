import test from 'node:test';
import assert from 'node:assert/strict';
import { unisci, testoContesto, titoloScheda, separaMancanti, dividiDettaglio, valoreLungo, MANCANTE } from '../../js/core/scheda-modello.js';

const riga = (etichetta, valore, extra = {}) => ({ etichetta, valore, ...extra });
const voce = (chiave, peso, righe, extra = {}) => ({ chiave, peso, titolo: chiave, gruppi: [{ righe }], ...extra });

test('unisce le voci con la stessa chiave in una sola sezione', () => {
  const { sezioni } = unisci([
    voce('zonizzazione', 40, [riga('Zona', 'A2'), riga('Descrizione', 'Tessuti storici')]),
    voce('zonizzazione', 41, [riga('Ambito', 'Netto storico')]),
  ]);
  assert.equal(sezioni.length, 1);
  assert.equal(sezioni[0].peso, 40);
  assert.deepEqual(sezioni[0].gruppi[0].righe.map(r => r.etichetta), ['Zona', 'Descrizione', 'Ambito']);
});

test('non ripete una riga identica (stessa etichetta e stesso valore) nella stessa sezione', () => {
  const { sezioni } = unisci([
    voce('zonizzazione', 40, [riga('Zona', 'A2'), riga('Descrizione', 'Tessuti storici')]),
    voce('zonizzazione', 41, [riga('Zona', 'A2'), riga('Ambito', 'Netto storico')]),
  ]);
  assert.deepEqual(sezioni[0].gruppi[0].righe.map(r => r.etichetta), ['Zona', 'Descrizione', 'Ambito']);
});

test('stessa etichetta con valore diverso resta, se i gruppi hanno titoli diversi', () => {
  const { sezioni } = unisci([{
    chiave: 'vincoli', peso: 50, titolo: 'Vincoli', gruppi: [
      { titolo: 'Vincolo areale', righe: [riga('Tipo', 'Paesaggistico')] },
      { titolo: 'Vincolo lineare', righe: [riga('Tipo', 'Paesaggistico')] },
    ],
  }]);
  assert.equal(sezioni[0].gruppi.length, 2);
  assert.equal(sezioni[0].gruppi[1].righe.length, 1);
});

test('i gruppi con lo stesso titolo di voci diverse si fondono', () => {
  const { sezioni } = unisci([
    { chiave: 'k', peso: 1, titolo: 'K', gruppi: [{ titolo: 'G', righe: [riga('a', '1')] }] },
    { chiave: 'k', peso: 1, titolo: 'K', gruppi: [{ titolo: 'G', righe: [riga('b', '2')] }] },
  ]);
  assert.equal(sezioni[0].gruppi.length, 1);
  assert.deepEqual(sezioni[0].gruppi[0].righe.map(r => r.etichetta), ['a', 'b']);
});

test('il contesto amministrativo va nell\'intestazione, una sola volta, non nelle sezioni', () => {
  const { contesto, sezioni } = unisci([
    voce('indirizzo', 10, [riga('Via', 'VIA ROMA')], { contesto: { circoscrizione: 'I', quartiere: 'Tribunali' } }),
    voce('sezione', 70, [riga('Codice ISTAT', '1')], { contesto: { circoscrizione: 'VII', quartiere: 'Altro', upl: 'Kalsa' } }),
  ]);
  assert.deepEqual(contesto, { circoscrizione: 'I', quartiere: 'Tribunali', upl: 'Kalsa' }); // il primo vince, si completa
  for (const s of sezioni) for (const g of s.gruppi) for (const r of g.righe) {
    assert.ok(!/circoscrizione|quartiere|upl/i.test(r.etichetta), r.etichetta);
  }
  assert.ok(sezioni.every(s => s.contesto === undefined));
});

test('testoContesto: Circoscrizione · Quartiere · UPL, solo quelli presenti', () => {
  assert.equal(testoContesto({ circoscrizione: 'VII', quartiere: 'Tommaso Natale', upl: 'Cardillo' }),
    'Circoscrizione VII · Quartiere Tommaso Natale · UPL Cardillo');
  assert.equal(testoContesto({ quartiere: 'Kalsa' }), 'Quartiere Kalsa');
  assert.equal(testoContesto({}), '');
});

test('ordina per peso (a parità, ordine di arrivo)', () => {
  const { sezioni } = unisci([voce('c', 30, [riga('x', '1')]), voce('a', 10, [riga('x', '1')]),
                              voce('b', 30, [riga('y', '2')]), voce('d', 20, [riga('z', '3')])]);
  assert.deepEqual(sezioni.map(s => s.chiave), ['a', 'd', 'c', 'b']);
});

test('scarta le sezioni senza contenuto, non quelle con link o accordion', () => {
  const { sezioni } = unisci([
    { chiave: 'vuota', peso: 1, titolo: 'Vuota', gruppi: [{ righe: [] }] },
    { chiave: 'solo-link', peso: 2, titolo: 'L', gruppi: [], link: { testo: 'Vai', url: 'https://x.test/' } },
    { chiave: 'acc', peso: 3, titolo: 'A', gruppi: [], accordion: { riassunto: 'r', elementi: [{ titolo: 't', righe: [riga('a', '1')] }] } },
  ]);
  assert.deepEqual(sezioni.map(s => s.chiave), ['solo-link', 'acc']);
});

test('nessuna voce: nessuna sezione e contesto vuoto', () => {
  assert.deepEqual(unisci([]), { contesto: {}, sezioni: [], legale: false });
});

test('l\'icona della sezione resta quella della prima voce', () => {
  const { sezioni } = unisci([
    { chiave: 'z', peso: 1, titolo: 'Z', icona: 'mappa', gruppi: [{ righe: [riga('a', '1')] }] },
    { chiave: 'z', peso: 2, titolo: 'Z', icona: 'altro', gruppi: [{ righe: [riga('b', '2')] }] },
  ]);
  assert.equal(sezioni[0].icona, 'mappa');
});

test('titoloScheda: indirizzo in maiuscole/minuscole, altrimenti titolo generico', () => {
  const ind = voce('indirizzo', 10, [riga('Via', 'VIA TEATRO BIONDO'), riga('Civico', '3/B')]);
  assert.equal(titoloScheda(unisci([ind]).sezioni), 'Via Teatro Biondo, 3/B');
  const dau = voce('indirizzo', 10, [riga('Via', "VIA DI SANT'ANNA E DELLA CROCE"), riga('Civico', '12')]);
  assert.equal(titoloScheda(unisci([dau]).sezioni), "Via di Sant'Anna e della Croce, 12");
  assert.equal(titoloScheda(unisci([voce('zonizzazione', 40, [riga('Zona', 'A2')])]).sezioni), 'Scheda del luogo');
  assert.equal(titoloScheda(unisci([voce('indirizzo', 10, [riga('Via', 'VIA ROMA')])]).sezioni), 'Via Roma');
});

test('separaMancanti: due o più righe senza dato diventano una sola riga di riepilogo', () => {
  const rr = [riga('Residenti 2021', '5'), riga('Residenti 2023', MANCANTE), riga('Densità', MANCANTE), riga('Vecchiaia', MANCANTE)];
  const { presenti, mancanti } = separaMancanti(rr);
  assert.deepEqual(presenti.map(r => r.etichetta), ['Residenti 2021']);
  assert.deepEqual(mancanti, ['Residenti 2023', 'Densità', 'Vecchiaia']);
  // una sola riga mancante resta com'è
  const una = separaMancanti([riga('a', '1'), riga('b', MANCANTE)]);
  assert.equal(una.presenti.length, 2);
  assert.deepEqual(una.mancanti, []);
});

test('dividiDettaglio: separa la soglia tra parentesi dal valore', () => {
  assert.deepEqual(dividiDettaglio('Alta costruibilità (slope<5°, elev<100m)'), { valore: 'Alta costruibilità', dettaglio: 'slope<5°, elev<100m' });
  assert.deepEqual(dividiDettaglio('Stabile (0–5°)'), { valore: 'Stabile', dettaglio: '0–5°' });
  assert.deepEqual(dividiDettaglio('Piano'), { valore: 'Piano', dettaglio: '' });
});

test('valoreLungo: oltre 24 caratteri il valore va sotto l\'etichetta', () => {
  assert.equal(valoreLungo('B – Centrale'), false);
  assert.equal(valoreLungo('VITTORIO EMANUELE-MAQUEDA-ROMA'), true);
});

test('unisci: l\'avviso legale è un solo flag, non una nota per sezione', () => {
  const { legale, sezioni } = unisci([
    voce('particella', 20, [riga('Foglio', '1')], { legale: true }),
    voce('vincoli', 50, [riga('Tipo', 'x')], { legale: true }),
  ]);
  assert.equal(legale, true);
  assert.equal(sezioni.length, 2);
  assert.equal(unisci([voce('a', 1, [riga('x', '1')])]).legale, false);
});

test('unisci: un gruppo senza righe né griglia non lascia il titolo vuoto nella sezione', () => {
  const { sezioni } = unisci([{ chiave: 'vincoli', peso: 50, titolo: 'Vincoli', gruppi: [
    { titolo: 'Vincolo areale 1', righe: [riga('Tipo', 'Paesaggistico')] },
    { titolo: 'Vincolo areale 2', righe: [] },
  ] }]);
  assert.deepEqual(sezioni[0].gruppi.map(g => g.titolo), ['Vincolo areale 1']);
});
