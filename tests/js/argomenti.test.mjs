import test from 'node:test';
import assert from 'node:assert/strict';
import { elencoArgomenti } from '../../js/core/argomenti.js';

const moduli = [
  { id: 'base', titolo: 'Base cartografica', argomento: { titolo: 'Mappa', descrizione: 'x' } },
  { id: 'edifici', titolo: 'Edifici', argomento: { titolo: 'Edifici', descrizione: 'Impronte degli edifici.' },
    strati: [{ id: 'edificato', etichetta: 'Edificato' }, { id: 'edifici3d', etichetta: 'Edifici 3D' }] },
  { id: 'territorio', titolo: 'Layer', argomento: { titolo: 'Territorio e vincoli', descrizione: 'Catasto e PRG.' },
    strati: [{ id: 'catasto', etichetta: 'Catasto' }] },
  { id: 'monumenti', titolo: 'Monumenti', gruppo: 'territorio', argomento: { titolo: 'Monumenti', descrizione: 'Luoghi storici.' },
    strati: [{ id: 'monumenti', etichetta: 'Monumenti (Portale)' }] },
  { id: 'senza-testo', titolo: 'Senza testo', strati: [{ id: 's', etichetta: 'S' }] },
];

test('un argomento per modulo con strati, in ordine alfabetico di titolo', () => {
  assert.deepEqual(elencoArgomenti(moduli).map(a => a.id), ['edifici', 'monumenti', 'senza-testo', 'territorio']);
});

test('gli strati di un argomento sono in ordine alfabetico di etichetta', () => {
  const a = elencoArgomenti([{ id: 'm', titolo: 'M', strati: [{ id: 'z', etichetta: 'Zeta' }, { id: 'e', etichetta: 'è Esse' }, { id: 'a', etichetta: 'alfa' }] }])[0];
  assert.deepEqual(a.strati.map(s => s.id), ['a', 'e', 'z']);
});

test('titolo e descrizione vengono da `argomento`; strati con id ed etichetta', () => {
  const a = elencoArgomenti(moduli).find(x => x.id === 'territorio');
  assert.deepEqual(a, { id: 'territorio', titolo: 'Territorio e vincoli', descrizione: 'Catasto e PRG.', strati: [{ id: 'catasto', etichetta: 'Catasto' }] });
});

test('senza `argomento` ripiega sul titolo del modulo e descrizione vuota', () => {
  const a = elencoArgomenti(moduli).find(x => x.id === 'senza-testo');
  assert.equal(a.titolo, 'Senza testo');
  assert.equal(a.descrizione, '');
});

test('i moduli senza strati (la base cartografica) non compaiono', () => {
  assert.ok(!elencoArgomenti(moduli).some(a => a.id === 'base'));
});

test('le sotto-voci di uno strato (es. filtri delle colonnine) passano in elenco', () => {
  const sottovoci = [{ titolo: 'Stato', voci: [{ id: 'stato:Disponibile', etichetta: 'Disponibile' }] }];
  const a = elencoArgomenti([{ id: 'servizi', titolo: 'Servizi', strati: [{ id: 'colonnine', etichetta: 'Colonnine', sottovoci }] }])[0];
  assert.deepEqual(a.strati[0].sottovoci, sottovoci);
  assert.ok(!('sottovoci' in elencoArgomenti(moduli)[0].strati[0]));
});
