import test from 'node:test';
import assert from 'node:assert/strict';
import { voceFontanella, modelloPopupFontanella } from '../../js/layers/scheda-fontanelle.js';
import { unisci } from '../../js/core/scheda-modello.js';

const F = { id: '1', tipo_ubicazione: '', denominazione: '', civico: '', note: '', indirizzo: 'Piazza Danisinni, 22', upl: 'Cuba - Calatafimi', quartiere: 'Cuba - Calatafimi', circoscrizione: 'IV' };

test('scheda: solo l\'indirizzo (quartiere e circoscrizione sono nel contesto), link PalermoHub, tab Servizi', () => {
  const v = voceFontanella(F);
  assert.deepEqual(v.gruppi[0].righe, [{ etichetta: 'Indirizzo', valore: 'Piazza Danisinni, 22' }]);
  assert.equal(v.peso, 90);
  assert.equal(v.link.url, 'https://palermohub.opendatasicilia.it/pa_fontanelle.html');
  assert.equal(unisci([v]).sezioni.length, 1);
});

test('popup: aggiunge quartiere e circoscrizione', () => {
  const m = modelloPopupFontanella(F);
  assert.deepEqual(m.righe.map(r => r.etichetta), ['Indirizzo', 'Quartiere', 'Circoscrizione']);
});
