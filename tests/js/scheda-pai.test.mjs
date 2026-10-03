import test from 'node:test';
import assert from 'node:assert/strict';
import { dataIt, modelloPopup, vocePai, vociPai, chiavePai } from '../../js/layers/scheda-pai.js';

const campi = [
  { k: 'bcn_nmr', label: 'Numero bacino' }, { k: 'comune', label: 'Comune' }, { k: 'localita', label: 'Località' },
  { k: 'n_dpr', label: 'Decreto del Presidente della Regione n.' }, { k: 'data_dpr', label: 'Data del decreto', data: true },
];
const idr = { id: 'idraulica_pericolosita', titolo: 'Pericolosità idraulica', geometria: 'poligono', campi, temi: [{ id: 'idraulica_pericolosita', titolo: 'Pericolosità idraulica', riga: 'Pericolosità' }] };
const siti = { id: 'geo_siti', titolo: 'Siti di attenzione geomorfologica', geometria: 'poligono', campi, temi: [{ id: 'geo_siti', titolo: 'Siti di attenzione geomorfologica', riga: null }] };
const dissesti = { id: 'dissesti', titolo: 'Dissesti', geometria: 'poligono', campi, temi: [
  { id: 'dissesti_attivita', titolo: 'Dissesti per attività', riga: 'Attività' }, { id: 'dissesti_tipologia', titolo: 'Dissesti per tipologia', riga: 'Tipologia' }] };
const p = { cls_idraulica_pericolosita: 'P3', bcn_nmr: '038', comune: 'Palermo', localita: 'Oreto', n_dpr: '2', data_dpr: '2019-03-05', sup_ha: 1.2345 };
const righeDi = v => Object.fromEntries(v.gruppi.flatMap(g => g.righe).map(r => [r.etichetta, r.valore]));

test('data in italiano', () => {
  assert.equal(dataIt('2019-03-05'), '05/03/2019');
  assert.equal(dataIt(undefined), null);
});

test('popup: titolo del tema, classe e righe presenti', () => {
  const m = modelloPopup(idr, idr.temi[0], p);
  assert.equal(m.titolo, 'Pericolosità idraulica');
  assert.equal(m.sottotitolo, 'P3');
  assert.deepEqual(m.righe.map(r => r.etichetta), ['Luogo', 'Superficie']);
  assert.equal(m.righe[0].valore, 'Oreto');
  assert.equal(modelloPopup(idr, idr.temi[0], { cls_idraulica_pericolosita: 'P1' }).righe.length, 0);
});

test('scheda: sempre presente, badge con la classe, righe e provvedimenti in gruppi a parte', () => {
  const v = vocePai(idr, p);
  assert.equal(v.sempre, true);
  assert.equal(v.badge, 'P3');
  assert.ok(v.chiave.startsWith('pai:idraulica_pericolosita:'));
  const r = righeDi(v);
  assert.equal(r['Pericolosità'], 'P3');
  assert.equal(r['Località'], 'Oreto');
  assert.equal(r['Superficie'], '1,23 ha');
  assert.equal(r['Data del decreto'], '05/03/2019');
  assert.equal(v.gruppi[1].titolo, 'Provvedimenti');
  assert.deepEqual(v.gruppi[1].righe.map(x => x.etichetta), ['Decreto del Presidente della Regione n.', 'Data del decreto']);
});

test('scheda: un tema senza classi non ha badge né riga di classe; i campi assenti non compaiono', () => {
  const v = vocePai(siti, { cls_geo_siti: 'Siti di attenzione geomorfologica', comune: 'Palermo' });
  assert.equal(v.badge, undefined);
  assert.deepEqual(Object.keys(righeDi(v)), ['Comune']);
});

test('scheda: i dissesti mostrano attività e tipologia', () => {
  const r = righeDi(vocePai(dissesti, { cls_dissesti_attivita: 'Attivo', cls_dissesti_tipologia: 'Crollo e/o ribaltamento' }));
  assert.equal(r['Attività'], 'Attivo');
  assert.equal(r['Tipologia'], 'Crollo e/o ribaltamento');
});

test('la chiave distingue elementi diversi dello stesso dataset', () => {
  assert.notEqual(chiavePai(idr, p), chiavePai(idr, { ...p, sup_ha: 9 }));
  assert.equal(chiavePai(idr, p), chiavePai(idr, { ...p }));
});

test('vincoli sovrapposti: una sola sezione a fisarmonica con il più grave nel riassunto; uno solo resta completo', () => {
  assert.equal(vociPai([{ ds: idr, p }])[0].chiave, vocePai(idr, p).chiave);
  const geo = { ...idr, id: 'geo_rischio', titolo: 'Rischio geomorfologico', temi: [{ id: 'geo_rischio', titolo: 'Rischio geomorfologico', riga: 'Rischio' }] };
  const voci = vociPai([{ ds: idr, p }, { ds: geo, p: { cls_geo_rischio: 'R4', comune: 'Palermo' } }]);
  assert.equal(voci.length, 1);
  assert.equal(voci[0].chiave, 'pai:gruppo');
  assert.equal(voci[0].accordion.riassunto, '2 vincoli sovrapposti · più grave: R4 (Rischio geomorfologico)');
  assert.deepEqual(voci[0].accordion.elementi.map(e => e.anteprima), ['P3', 'R4']);
  assert.ok(voci[0].accordion.elementi[0].righe.some(r => r.etichetta === 'Località'));
  assert.equal(voci[0].sempre, true);
});
