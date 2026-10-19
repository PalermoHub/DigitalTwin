import test from 'node:test';
import assert from 'node:assert/strict';
import { suntoScheda } from '../../js/core/chat-bot-sunto.js';
import { tabScheda, MANCANTE } from '../../js/core/scheda-modello.js';

const sez = (chiave, peso, titolo, righe = [], extra = {}) => ({ chiave, peso, titolo, gruppi: righe.length ? [{ righe }] : [], ...extra });
const r = (etichetta, valore) => ({ etichetta, valore });

test('tabScheda: il tab dal peso e dalla chiave', () => {
  assert.equal(tabScheda(70), 'popolazione');
  assert.equal(tabScheda(10), 'luogo');
  assert.equal(tabScheda(5, 'pai:1'), 'strumenti');
  assert.equal(tabScheda(95), 'pnrr');
});

test('un tab per gruppo di sezioni, nell\'ordine della scheda', () => {
  const s = suntoScheda([sez('c', 70, 'Sezione di censimento', [r('Residenti 2021', '84')]), sez('a', 10, 'Luogo A', [r('Nome', 'X')])]);
  assert.deepEqual(s.map(x => x.tab), ['luogo', 'popolazione']);
});

test('dati: etichetta e valore delle prime tre righe utili', () => {
  const [{ voci }] = suntoScheda([sez('c', 70, 'Sezione di censimento', [
    r('Codice ISTAT', '820530000063'), r('Residenti 2021', '84'), r('Famiglie 2021', '42'), r('Senza', MANCANTE), r('Abitazioni 2021', '64'), r('Densità', '72,4'),
  ])]);
  assert.equal(voci[0].titolo, 'Sezione di censimento');
  assert.deepEqual(voci[0].dati, [r('Residenti 2021', '84'), r('Famiglie 2021', '42'), r('Abitazioni 2021', '64')]);
});

test('badge portati con la voce; accordion: conteggio degli elementi', () => {
  const [{ voci }] = suntoScheda([sez('p', 50, 'Vincoli PAI', [], { badges: ['2 vincoli'], accordion: { riassunto: 'x', elementi: [{ titolo: 'a', righe: [] }, { titolo: 'b', righe: [] }] } })]);
  assert.deepEqual(voci[0].badges, ['2 vincoli']);
  assert.equal(voci[0].conteggio, 2);
});

test('oltre quattro sezioni per tab: le altre diventano solo un elenco di titoli', () => {
  const sezioni = ['A', 'B', 'C', 'D', 'E', 'F'].map((n, i) => sez('k' + i, 10, 'Titolo ' + n, [r('Nome', n)]));
  const [{ voci, altre }] = suntoScheda(sezioni);
  assert.equal(voci.length, 4);
  assert.deepEqual(altre, ['Titolo E', 'Titolo F']);
});

test('il tab RNDT (risposte dei servizi, in arrivo dopo) non compare', () => {
  assert.deepEqual(suntoScheda([sez('rndt:x', 100, 'Servizio', [r('a', 'b')])]), []);
});

test('nessuna sezione: nessun tab', () => {
  assert.deepEqual(suntoScheda([]), []);
});

test('collegaSunto: ricorda l\'ultima scheda e la dimentica alla chiusura', async () => {
  const { collegaSunto, suntoRicordato } = await import('../../js/core/chat-bot-sunto.js');
  const bersaglio = new EventTarget();
  collegaSunto(bersaglio);
  assert.deepEqual(suntoRicordato(), []);
  bersaglio.dispatchEvent(new CustomEvent('scheda:sunto', { detail: { sezioni: [sez('c', 70, 'Sezione', [r('Residenti 2021', '84')])] } }));
  assert.equal(suntoRicordato()[0].tab, 'popolazione');
  bersaglio.dispatchEvent(new CustomEvent('scheda:chiusa'));
  assert.deepEqual(suntoRicordato(), []);
});
