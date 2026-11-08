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
    { etichetta: 'Zona', valore: 'B12', campione: { legenda: 'legenda-omi', colore: '#662933' } },
    { etichetta: 'Fascia', valore: 'B – Centrale', campione: { legenda: 'legenda-omi', colore: '#b3243b' } },
    { etichetta: 'Descrizione', valore: 'MASSIMO-PIGNATELLI V.E.ORLANDO-AMICO ARAGONA-GOETHE-' },
    { etichetta: 'Microzona', valore: '1' },
  ]);
});

test('tipo prevalente come riassunto e una tipologia per elemento', () => {
  const { accordion } = vociOmi(P)[0];
  assert.equal(accordion.riassunto, 'Tipo prevalente: [20] Abitazioni civili');
  const { dinamico, righe, ...resto } = accordion.elementi[0];
  assert.deepEqual(resto, { titolo: 'Abitazioni civili', stato: 'NORMALE', anteprima: '1350–2000 €/m²' });
  assert.deepEqual(righe.slice(0, 2), [
    { etichetta: 'Compravendita', valore: '1350 – 2000 €/m² (sup.lorda)' },
    { etichetta: 'Locazione', valore: '4,5 – 6,4 €/m²/mese (sup.lorda)' },
  ]);
  assert.equal(righe[2].etichetta, 'Rendimento lordo'); // dopo gli intervalli, se i dati bastano
  assert.equal(typeof dinamico, 'function'); // il grafico della tipologia
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

import { rendimentoLordo } from '../../js/layers/scheda-omi.js';
import { datiGraficoOmi } from '../../js/layers/scheda-omi-grafico.js';

test('rendimento lordo: affitto annuo / vendita sui punti medi; null senza dati', () => {
  const y = rendimentoLordo(tip('Box', '1000', '2000', '5', '10'));
  assert.ok(Math.abs(y - (7.5 * 12) / 1500 * 100) < 1e-9);
  assert.equal(rendimentoLordo({ Compr_min: '1000', Compr_max: '2000' }), null);
});

test('dati del grafico: scale distinte, tipologie senza vendita escluse, dimensione e rendimento nelle righe', () => {
  const g = datiGraficoOmi([{ nome: 'A', cMin: 1000, cMax: 2000, lMin: 4, lMax: 6, rendimento: 3 }, { nome: 'B', cMin: 500, cMax: 900, lMin: null, lMax: null, rendimento: null }, { nome: 'C', cMin: null, cMax: null }]);
  assert.equal(g.righe.length, 2); assert.equal(g.maxVendita, 2000); assert.equal(g.maxAffitto, 6);
  assert.equal(datiGraficoOmi([]), null);
  const v = vociOmi(P, { dimensione: new Map([['B12', { p: 40, n: 1200, mediana: 150 }]]) })[0];
  assert.ok(v.gruppi[0].righe.some(r => r.etichetta === 'Particella nella zona'));
  assert.ok(v.accordion.elementi[0].righe.some(r => r.etichetta === 'Rendimento lordo'));
  assert.equal(typeof v.accordion.elementi[0].dinamico, 'function');
  assert.equal(v.dinamico, undefined);
});
