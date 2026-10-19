import test from 'node:test';
import assert from 'node:assert/strict';
import { vociNominate, vocePremuta } from '../../js/core/filtri-chat.js';

const d = {
  gruppi: [{ tipo: 'stato', titolo: 'Stato', voci: [
    { chiave: 'Disponibile', nome: 'Disponibile', sinonimi: ['libere'] },
    { chiave: 'In ricarica', nome: 'In ricarica', sinonimi: ['occupate', 'in uso'] },
    { chiave: 'Non attiva', nome: 'Non attiva', sinonimi: ['fuori servizio'] },
  ] }],
  accese: () => new Set(['stato:Disponibile']),
};

test('vociNominate: per nome, per sinonimo e per frase', () => {
  assert.deepEqual(vociNominate(d, 'colonnine Disponibile'), ['stato:Disponibile']);
  assert.deepEqual(vociNominate(d, 'Quali sono libere?'), ['stato:Disponibile']);
  assert.deepEqual(vociNominate(d, 'quelle in uso adesso'), ['stato:In ricarica']);
  assert.deepEqual(vociNominate(d, 'colonnine fuori servizio o occupate'), ['stato:In ricarica', 'stato:Non attiva']);
});
test('vociNominate: nessuna voce nominata, nessun descrittore', () => {
  assert.deepEqual(vociNominate(d, 'dove sono le colonnine'), []);
  assert.deepEqual(vociNominate(null, 'libere'), []);
});
test('vocePremuta: accesa mentre un\'altra del gruppo è spenta', () => {
  assert.equal(vocePremuta(d, 'stato', 'Disponibile'), true);
  assert.equal(vocePremuta(d, 'stato', 'In ricarica'), false);
  const tutte = { ...d, accese: () => new Set(['stato:Disponibile', 'stato:In ricarica', 'stato:Non attiva']) };
  assert.equal(vocePremuta(tutte, 'stato', 'Disponibile'), false);
});

// Legenda finta: righe con la stessa forma di voceFiltro (casella + _filtro), e il comportamento «solo questa» di dopoClic.
import { daLegenda } from '../../js/core/filtri-chat.js';
import { dopoClic } from '../../js/core/legenda.js';

function legendaFinta(gruppi) {
  const righe = [];
  const contenitori = gruppi.map(nomi => ({ nomi, righe: [] }));
  for (const c of contenitori) {
    c.righe = c.nomi.map(testo => {
      const r = { textContent: ` ${testo} `, parentElement: c, _filtro: { esclusivo: true, casella: { checked: true } } };
      r._filtro.casella.click = () => {
        r._filtro.casella.checked = !r._filtro.casella.checked;
        const gruppo = c.righe, k = gruppo.indexOf(r);
        const prima = gruppo.map((x, i) => (i === k ? !r._filtro.casella.checked : x._filtro.casella.checked));
        dopoClic(prima, k).forEach((v, i) => { gruppo[i]._filtro.casella.checked = v; });
      };
      righe.push(r);
      return r;
    });
  }
  return { querySelectorAll: () => righe };
}
const docCon = legenda => ({ querySelector: sel => (sel === '.lg-x' ? legenda : null) });

test('daLegenda: nessuna legenda o gruppi di una riga sola -> null', () => {
  assert.equal(daLegenda(docCon(null), 'x'), null);
  assert.equal(daLegenda(docCon(legendaFinta([['Solo']])), 'x'), null);
});
test('daLegenda: gruppi dalle righe, nomi senza conteggio, sinonimi, solo e tutte', () => {
  const d = daLegenda(docCon(legendaFinta([['2019 (12)', '2020 (3)'], ['A', 'B']])), 'x');
  assert.deepEqual(d.gruppi.map(g => g.voci.map(v => v.chiave)), [['2019 (12)', '2020 (3)'], ['A', 'B']]);
  assert.deepEqual(vociNominate(d, 'incendi del 2020'), ['g0:2020 (3)']);
  d.solo('g0', '2020 (3)');
  assert.deepEqual([...d.accese()].sort(), ['g0:2020 (3)', 'g1:A', 'g1:B']);
  assert.equal(vocePremuta(d, 'g0', '2020 (3)'), true);
  d.solo('g0', '2020 (3)'); // già sola: resta così
  assert.equal(vocePremuta(d, 'g0', '2020 (3)'), true);
  d.solo('g0', '2019 (12)');
  assert.equal(vocePremuta(d, 'g0', '2019 (12)'), true);
  assert.equal(vocePremuta(d, 'g0', '2020 (3)'), false);
  d.tutte();
  assert.equal(d.accese().size, 4);
});
