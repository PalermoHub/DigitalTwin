// tests/js/rndt-gruppo.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { elencoArgomenti } from '../../js/core/argomenti.js';
import { righeGruppo, creaGruppoRndt } from '../../js/rndt/gruppo.js';

const l = (id, nome, extra = {}) => ({ id, nome, visibile: true, indisponibile: false, errore: false, salvato: true, ...extra });

test('le righe sono in ordine alfabetico italiano, senza badare a maiuscole e accenti', () => {
  const righe = righeGruppo([l('3', 'Zone'), l('1', 'àrea PAI'), l('2', 'Boschi')]);
  assert.deepEqual(righe.map(r => r.id), ['1', '2', '3']);
});

test('una riga è accesa se il layer è visibile e disponibile', () => {
  const [a, b, c] = righeGruppo([l('a', 'A'), l('b', 'B', { visibile: false }), l('c', 'C', { indisponibile: true })]);
  assert.deepEqual([a.acceso, b.acceso, c.acceso], [true, false, false]);
  assert.equal(c.disabilitato, true);
  assert.equal(a.disabilitato, false);
});

test('la nota dice perché un layer è particolare', () => {
  const [a, b, c, d] = righeGruppo([
    l('a', 'A', { indisponibile: true }),
    l('b', 'B', { salvato: false }),
    l('c', 'C', { errore: true }),
    l('d', 'D'),
  ]);
  assert.equal(a.nota, 'non disponibile');
  assert.equal(b.nota, 'solo questa sessione');
  assert.equal(c.nota, 'errori di caricamento');
  assert.equal(d.nota, '');
});

test('senza layer l’elenco è vuoto', () => {
  assert.deepEqual(righeGruppo([]), []);
});

test('nella tab Argomenti il gruppo RNDT compare coi layer, in ordine alfabetico, solo dopo il collegamento all’host', () => {
  const gruppo = creaGruppoRndt();
  assert.deepEqual(elencoArgomenti([gruppo.modulo]), []); // senza layer non è un argomento
  const host = { elenco: () => [l('b', 'Zone'), l('a', 'Boschi')], suCambio() {} };
  gruppo.collega(host, () => {});
  const [argomento] = elencoArgomenti([gruppo.modulo]);
  assert.equal(argomento.titolo, 'RNDT');
  assert.deepEqual(argomento.strati.map(s => s.id), ['a', 'b']);
});
