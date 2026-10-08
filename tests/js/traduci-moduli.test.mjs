import test from 'node:test';
import assert from 'node:assert/strict';
import { impostaDizionari } from '../../js/core/i18n.js';
import { traduciModuli } from '../../js/core/traduci-moduli.js';

const IT = { 'lbl.Edifici': 'Edifici', 'lbl.Edificato (da zoom 12)': 'Edificato (da zoom 12)' };
const EN = { 'lbl.Edifici': 'Buildings', 'lbl.Edificato (da zoom 12)': 'Footprints (from zoom 12)', 'lbl.Impronte': 'Footprints', 'lbl.Categorie': 'Categories' };
const modulo = () => ({
  id: 'edifici', titolo: 'Edifici', sezione: 'Edifici',
  argomento: { titolo: 'Edifici', descrizione: 'Impronte' },
  strati: [{ id: 'edificato', etichetta: 'Edificato (da zoom 12)', sezione: 'Edifici', layers: ['edifici-2d'] }, { id: 'altro', etichetta: 'Senza traduzione', sottovoci: [{ titolo: 'Categorie', voci: [{ id: 'x', etichetta: 'Edifici' }] }] }],
});

test('in italiano i moduli non cambiano (stessi oggetti, stessi testi)', () => {
  impostaDizionari('it', IT, IT);
  const m = modulo();
  assert.deepEqual(traduciModuli([m])[0], modulo());
});

test('in inglese traduce titolo, sezione, argomento, etichette e sottovoci; gli id restano', () => {
  impostaDizionari('en', EN, IT);
  const [m] = traduciModuli([modulo()]);
  assert.equal(m.titolo, 'Buildings');
  assert.equal(m.sezione, 'Buildings');
  assert.deepEqual(m.argomento, { titolo: 'Buildings', descrizione: 'Footprints' });
  assert.equal(m.strati[0].etichetta, 'Footprints (from zoom 12)');
  assert.equal(m.strati[0].sezione, 'Buildings');
  assert.deepEqual(m.strati[0].layers, ['edifici-2d']);
  assert.equal(m.strati[1].etichetta, 'Senza traduzione', 'senza voce nel dizionario resta com\'è');
  assert.equal(m.strati[1].sottovoci[0].titolo, 'Categories');
  assert.equal(m.strati[1].sottovoci[0].voci[0].etichetta, 'Buildings');
  assert.equal(m.strati[1].sottovoci[0].voci[0].id, 'x');
  assert.equal(m.id, 'edifici');
});

test('moduli senza argomento, strati o sottovoci non si rompono', () => {
  impostaDizionari('en', EN, IT);
  assert.deepEqual(traduciModuli([{ id: 'vuoto', titolo: 'Edifici' }]), [{ id: 'vuoto', titolo: 'Buildings' }]);
});

test('le sottovoci costruite da un getter (come negli uffici) si traducono alla lettura', () => {
  impostaDizionari('en', EN, IT);
  const m = { id: 'u', titolo: 'Edifici', strati: [{ id: 's', etichetta: 'Edifici', get sottovoci() { return [{ titolo: 'Categorie', voci: [{ id: 'a', etichetta: 'Edifici' }] }]; } }] };
  const [t] = traduciModuli([m]);
  assert.equal(t.strati[0].sottovoci[0].titolo, 'Categories');
  assert.equal(t.strati[0].sottovoci[0].voci[0].etichetta, 'Buildings');
});
