import test from 'node:test';
import assert from 'node:assert/strict';
import { STRATI_URBANISTICA, urbanisticaAttiva, sezioniPdf, bloccoPdf, nomeFilePdf } from '../../js/core/scheda-pdf-modello.js';

// documento minimo: input#strato-<id> con checked
const doc = accesi => ({ querySelector: sel => { const id = sel.replace('#strato-', ''); return STRATI_URBANISTICA.includes(id) || id === 'scuole' ? { checked: accesi.includes(id) } : null; } });

test('percorso Urbanistica: visibile se almeno uno dei suoi cinque strati è acceso', () => {
  assert.deepEqual(STRATI_URBANISTICA, ['prg', 'vincoli', 'catasto', 'omi', 'civici']);
  assert.equal(urbanisticaAttiva(doc(['catasto'])), true);
  assert.equal(urbanisticaAttiva(doc(['omi', 'prg'])), true);
  assert.equal(urbanisticaAttiva(doc([])), false);
  assert.equal(urbanisticaAttiva(doc(['scuole'])), false); // uno strato di un altro percorso non basta
});

const sez = (chiave, peso, strato, extra = {}) => ({ chiave, peso, strato, titolo: chiave, gruppi: [{ righe: [{ etichetta: 'X', valore: '1' }] }], ...extra });

test('sezioniPdf tiene solo gli strati dell\'urbanistica, in ordine di lettura del lotto', () => {
  const tutte = [sez('omi-B12', 60, 'omi'), sez('scuola', 90, 'scuole'), sez('vincoli', 50, 'vincoli'), sez('indirizzo', 10, 'civici'), sez('particella', 20, 'catasto'), sez('zonizzazione', 40, 'prg'), sez('pai:1', 80, 'pai')];
  assert.deepEqual(sezioniPdf(tutte).map(s => s.chiave), ['indirizzo', 'particella', 'zonizzazione', 'vincoli', 'omi-B12']);
  assert.deepEqual(sezioniPdf([sez('scuola', 90, 'scuole')]), []);
});

test('bloccoPdf: righe, gruppi e accordion in una forma piatta, senza righe «senza dato»', () => {
  const b = bloccoPdf({
    titolo: 'Quotazioni OMI', badge: 'Zona B12', fonte: 'Fonte OMI 2026 S1', nota: 'Una nota',
    gruppi: [{ righe: [{ etichetta: 'Zona', valore: 'B12' }, { etichetta: 'Microzona', valore: 'senza dato' }] }, { titolo: 'Vincolo areale 1', righe: [{ etichetta: 'Tipo', valore: 'Bosco' }] }],
    accordion: { elementi: [{ titolo: 'Abitazioni civili', stato: 'NORMALE', righe: [{ etichetta: 'Compravendita', valore: '1.350–2.000 €/m²' }] }] },
  });
  assert.equal(b.titolo, 'Quotazioni OMI');
  assert.equal(b.badge, 'Zona B12');
  assert.deepEqual(b.gruppi, [
    { titolo: '', righe: [['Zona', 'B12']] },
    { titolo: 'Vincolo areale 1', righe: [['Tipo', 'Bosco']] },
    { titolo: 'Abitazioni civili (NORMALE)', righe: [['Compravendita', '1.350–2.000 €/m²']] },
  ]);
  assert.deepEqual(b.note, ['Fonte OMI 2026 S1', 'Una nota']);
});

test('bloccoPdf: una sezione senza dati non produce gruppi vuoti', () => {
  const b = bloccoPdf({ titolo: 'Vincoli', gruppi: [{ righe: [{ etichetta: 'Tipo', valore: 'senza dato' }] }] });
  assert.deepEqual(b.gruppi, []);
});

test('nomeFilePdf: foglio e particella se ci sono, altrimenti le coordinate', () => {
  const part = sez('particella', 20, 'catasto', { gruppi: [{ righe: [{ etichetta: 'Foglio', valore: '45' }, { etichetta: 'Particella', valore: '1234' }] }] });
  assert.equal(nomeFilePdf([part], '13.36130,38.11570'), 'particella_45_1234.pdf');
  assert.equal(nomeFilePdf([], '13.3613,38.1157'), 'urbanistica_38.1157_13.3613.pdf');
  assert.equal(nomeFilePdf([], undefined), 'urbanistica.pdf');
});
