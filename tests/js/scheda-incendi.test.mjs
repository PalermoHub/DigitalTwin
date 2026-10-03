import test from 'node:test';
import assert from 'node:assert/strict';
import { dataIt, durata, modelloPopup, voceIncendio, vociIncendi } from '../../js/layers/scheda-incendi.js';

const recente = {
  anno: 2025, id: 33540, data: '2025-05-23', localita: 'Monte Pellegrino', sup_ha: 0.1868, sup_boscata_ha: 0.0196, sup_non_boscata_ha: 0,
  altre_sup_forestali_ha: 0.1672, durata_min: 916, tipo_evento: 'Incendio di vegetazione', costo_spegnimento_eur: 5886.06, feriti: 0, periti: 0, squadre_aib: 5,
};
const antico = { anno: 2007, id: 162, data: '2007-06-14', localita: 'PURTIDUZZI MONTE GRIFONE', sup_ha: 2.37 };
const righeDi = v => Object.fromEntries(v.gruppi.flatMap(g => g.righe).map(r => [r.etichetta, r.valore]));

test('data e durata in italiano', () => {
  assert.equal(dataIt('2025-05-23'), '23/05/2025');
  assert.equal(dataIt(undefined), null);
  assert.equal(durata(916), '15 h 16 min');
  assert.equal(durata(45), '45 min');
  assert.equal(durata(0), null);
});

test('popup: titolo, data e superfici (le assenti non compaiono)', () => {
  const m = modelloPopup(recente);
  assert.equal(m.titolo, 'Incendio a Monte Pellegrino');
  assert.equal(m.sottotitolo, '23/05/2025');
  assert.deepEqual(m.righe.map(r => r.etichetta), ['Superficie', 'Boscata', 'Non boscata']);
  assert.equal(modelloPopup(antico).righe.length, 1);
});

test('scheda: sempre presente, chiave per anno e id, righe complete', () => {
  const v = voceIncendio(recente);
  assert.equal(v.chiave, 'incendio-2025-33540');
  assert.equal(v.sempre, true);
  assert.equal(v.badge, 'Incendio 2025');
  const r = righeDi(v);
  assert.equal(r['Data'], '23/05/2025');
  assert.equal(r['Durata intervento'], '15 h 16 min');
  assert.equal(r['Costo di spegnimento'], '5886 €');
  assert.equal(r['Squadre AIB'], '5');
  assert.equal(r['Feriti'], undefined); // zero feriti: nessuna riga
});

test('scheda: un anno vecchio con pochi campi mostra solo quelli che ha', () => {
  const r = righeDi(voceIncendio(antico));
  assert.deepEqual(Object.keys(r), ['Data', 'Località', 'Superficie totale']);
  assert.equal(voceIncendio({ anno: 2008, id: 1 }).titolo, 'Incendio 2008');
});

test('incendi sovrapposti: una sola sezione a fisarmonica; uno solo resta completo', () => {
  assert.equal(vociIncendi([recente])[0].chiave, 'incendio-2025-33540');
  const v = vociIncendi([recente, antico]);
  assert.equal(v.length, 1);
  assert.equal(v[0].chiave, 'incendio:gruppo');
  assert.equal(v[0].accordion.riassunto, '2 incendi sovrapposti · dal 2007 al 2025');
  assert.equal(v[0].accordion.elementi[0].titolo, 'Incendio a Monte Pellegrino');
  assert.equal(v[0].accordion.elementi[0].anteprima, '23/05/2025');
  assert.ok(v[0].accordion.elementi[0].righe.length > 3);
});
