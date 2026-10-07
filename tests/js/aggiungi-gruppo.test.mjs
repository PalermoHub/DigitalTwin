// tests/js/aggiungi-gruppo.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { creaGruppo, creaGruppoRndt, OPZIONI_MIEI } from '../../js/rndt/gruppo.js';
import { elencoArgomenti } from '../../js/core/argomenti.js';

const l = (id, nome) => ({ id, nome, visibile: true, indisponibile: false, errore: false, salvato: true, idMappa: [] });
const hostFinto = elenco => ({ elenco: () => elenco, suCambio() {}, getMap: () => ({}), mostra() {}, elimina() {} });

test('il gruppo «I miei layer» ha il suo id, il suo titolo e strati vuoti finché non c’è l’host', () => {
  const g = creaGruppo(OPZIONI_MIEI);
  assert.equal(g.modulo.id, 'miei');
  assert.equal(g.modulo.titolo, 'I miei layer');
  assert.deepEqual(g.modulo.strati, []);
  g.collega(hostFinto([l('miei-b', 'Beta'), l('miei-a', 'Alfa')]), () => {}, async () => {});
  assert.deepEqual(g.modulo.strati.map(s => s.etichetta), ['Alfa', 'Beta']);
});

test('il gruppo RNDT resta quello di prima: id «rndt», titolo «RNDT»', () => {
  const g = creaGruppoRndt();
  assert.equal(g.modulo.id, 'rndt');
  assert.equal(g.modulo.titolo, 'RNDT');
});

test('«I miei layer» compare nella tab Argomenti', () => {
  const g = creaGruppo(OPZIONI_MIEI);
  g.collega(hostFinto([l('miei-a', 'Alfa')]), () => {}, async () => {});
  const [argomento] = elencoArgomenti([g.modulo]);
  assert.equal(argomento.titolo, 'I miei layer');
  assert.deepEqual(argomento.strati.map(s => s.id), ['miei-a']);
});

test('«I miei layer» non ha pulsanti d’aggiunta propri: l’albero è il contenuto fisso', () => {
  assert.deepEqual(OPZIONI_MIEI.azioni, []);
  assert.equal(OPZIONI_MIEI.ripiego, 'miei-cerca');
});

test('collega accetta l’intestazione come quarto argomento senza disegnare finché manca il DOM', () => {
  const g = creaGruppo(OPZIONI_MIEI);
  assert.doesNotThrow(() => g.collega(hostFinto([l('miei-a', 'Alfa')]), () => {}, async () => {}, () => ({})));
});

test('gli strati del gruppo portano i loro layer di mappa: serve all’ordine globale dei layer', () => {
  const g = creaGruppo(OPZIONI_MIEI);
  g.collega(hostFinto([{ ...l('miei-a', 'Alfa'), idMappa: ['miei-a-fill', 'miei-a-line'] }]), () => {}, async () => {});
  assert.deepEqual(g.modulo.strati, [{ id: 'miei-a', etichetta: 'Alfa', layers: ['miei-a-fill', 'miei-a-line'] }]);
});
