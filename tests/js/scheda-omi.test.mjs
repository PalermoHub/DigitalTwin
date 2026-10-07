import test from 'node:test';
import assert from 'node:assert/strict';
import { vociOmi } from '../../js/layers/scheda-omi.js';

// Zona B12 mostrata dallo screenshot originale: una feature per tipologia
const comune = {
  Zona_OMI: 'B12', Fascia: 'B', Fascia_Descr: "'Centrale'", Zona_Descr: "'MASSIMO-PIGNATELLI V.E.ORLANDO-AMICO ARAGONA-GOETHE-'",
  Microzona: '1', Anno_Semestre: '2025 / 2', Cod_tip_prev: '20', Descr_tip_prev: "'Abitazioni civili'",
};
const tip = (nome, cMin, cMax, lMin, lMax, sup = 'L') =>
  ({ ...comune, Descr_Tipologia: nome, Stato: 'NORMALE', Compr_min: cMin, Compr_max: cMax, Loc_min: lMin, Loc_max: lMax, Sup_NL_compr: sup, Sup_NL_loc: sup });

const P = [tip('Abitazioni civili', '1350', '2000', '4,5', '6,4'), tip('Box', '1100', '1500', '5', '7', 'N')];

test('una voce per zona, con badge e dati di zona una sola volta', () => {
  const v = vociOmi(P);
  assert.equal(v.length, 1);
  assert.equal(v[0].chiave, 'omi-B12');
  assert.equal(v[0].titolo, 'Quotazioni OMI');
  assert.equal(v[0].badge, 'Zona B12');
  assert.deepEqual(v[0].gruppi[0].righe, [
    { etichetta: 'Fascia', valore: 'B – Centrale' },
    { etichetta: 'Descrizione', valore: 'MASSIMO-PIGNATELLI V.E.ORLANDO-AMICO ARAGONA-GOETHE-' },
    { etichetta: 'Microzona', valore: '1' },
  ]);
});

test('tipo prevalente come riassunto e una tipologia per elemento', () => {
  const { accordion } = vociOmi(P)[0];
  assert.equal(accordion.riassunto, 'Tipo prevalente: [20] Abitazioni civili');
  assert.deepEqual(accordion.elementi[0], {
    titolo: 'Abitazioni civili', stato: 'NORMALE', anteprima: '1350–2000 €/m²',
    righe: [
      { etichetta: 'Compravendita', valore: '1350 – 2000 €/m² (sup.lorda)' },
      { etichetta: 'Locazione', valore: '4,5 – 6,4 €/m²/mese (sup.lorda)' },
    ],
  });
  assert.equal(accordion.elementi[1].righe[0].valore, '1100 – 1500 €/m² (sup.netta)');
});

test('suggerisce che le tipologie si aprono al clic', () => {
  assert.equal(vociOmi(P)[0].accordion.suggerimento, 'Seleziona una tipologia per vedere compravendita e locazione');
});

test('fonte con il semestre dai dati', () => {
  assert.equal(vociOmi(P)[0].fonte, 'Fonte: Agenzia delle Entrate — OMI 2025 S2');
});

test('la stessa tipologia ripetuta (tile adiacenti) compare una volta sola', () => {
  assert.equal(vociOmi([...P, P[0]])[0].accordion.elementi.length, 2);
});

test('zone diverse → voci diverse; valori non numerici → trattino; nessuna feature → nessuna voce', () => {
  const altra = { ...tip('Uffici', 'n.d.', null, '', undefined), Zona_OMI: 'C1' };
  const v = vociOmi([...P, altra]);
  assert.deepEqual(v.map(x => x.chiave), ['omi-B12', 'omi-C1']);
  assert.equal(v[1].accordion.elementi[0].righe[0].valore, '—');
  assert.equal(v[1].accordion.elementi[0].anteprima, '');
  assert.deepEqual(vociOmi([]), []);
});
