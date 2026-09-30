import test from 'node:test';
import assert from 'node:assert/strict';
import { voceTerreno } from '../../js/layers/scheda-terreno.js';

// Punto reale mostrato dallo screenshot della scheda originale (Tommaso Natale - Sferracavallo)
const P = {
  quota: 217, slope_deg: 39.2, slope_pct: 81.5, aspetto_nome: 'NE', geomorf_nome: 'Mezzacosta',
  stabilita: 5, stabilita_nome: 'Molto instabile (>35°)', costruibilita: 5, costr_nome: 'Non edificabile',
  tri: 9.95, tpi: 0.01, sri: 0.14, hillshade: 147, twi: 4.9, spi: 4.5, flow_acc: 0.37,
  svf: 0.92, fv: 0.10, ombra_est: 74, ombra_inv: 235, frost: 0, tobler: 0.3, viewshed: 2, rusle: 8.74,
};

const gruppo = (v, titolo) => v.gruppi.find(g => g.titolo === titolo);
const valori = g => Object.fromEntries(g.righe.map(r => [r.etichetta, r.valore]));

test('intestazione: quota in evidenza e titolo', () => {
  const v = voceTerreno(P);
  assert.equal(v.chiave, 'terreno');
  assert.equal(v.titolo, 'Terreno (DTM 5 m)');
  assert.equal(v.badge, '217 m s.l.m.');
  assert.equal(v.peso, 80);
});

test('gruppi nell\'ordine e con le etichette della scheda originale', () => {
  assert.deepEqual(voceTerreno(P).gruppi.map(g => g.titolo),
    ['Pendenza', 'Morfologia', 'Rischio versanti', 'Indici morfometrici', 'Idrologia', 'Energia e clima', 'Accessibilità ed erosione']);
});

test('valori formattati come nell\'originale', () => {
  const v = voceTerreno(P);
  assert.deepEqual(valori(gruppo(v, 'Pendenza')), { Gradi: '39.2°', Percentuale: '81.5 %' });
  assert.deepEqual(valori(gruppo(v, 'Morfologia')), { Esposizione: 'NE', 'Forma terreno': 'Mezzacosta' });
  assert.deepEqual(valori(gruppo(v, 'Idrologia')),
    { 'TWI — Umidità topografica': '4.9', 'SPI — Stream Power': '4.50', 'Flow Acc. (log)': '0.37' });
  assert.deepEqual(valori(gruppo(v, 'Energia e clima')), {
    'SVF — Cielo visibile': '92 %', 'Potenziale FV': '10 %', 'Ombra estiva': '29 %',
    'Ombra invernale': '92 %', 'Rischio gelata': '0.000',
  });
  assert.deepEqual(valori(gruppo(v, 'Accessibilità ed erosione')),
    { 'Velocità Tobler': '0.3 km/h', 'Visibilità cumulativa': '2/6 punti', 'Erosione RUSLE LS': '8.74' });
});

test('indici morfometrici come griglia TRI/TPI/SRI/HS', () => {
  assert.deepEqual(gruppo(voceTerreno(P), 'Indici morfometrici').griglia,
    [{ valore: '9.95', chiave: 'TRI' }, { valore: '0.01', chiave: 'TPI' }, { valore: '0.14', chiave: 'SRI' }, { valore: '147', chiave: 'HS' }]);
});

test('stabilità e costruibilità con la classe 1–5 per il colore del badge', () => {
  const righe = gruppo(voceTerreno(P), 'Rischio versanti').righe;
  assert.deepEqual(righe, [
    { etichetta: 'Stabilità', valore: 'Molto instabile (>35°)', classe: 5 },
    { etichetta: 'Costruibilità', valore: 'Non edificabile', classe: 5 },
  ]);
  const senza = gruppo(voceTerreno({ ...P, stabilita: 0, costruibilita: 9 }), 'Rischio versanti').righe;
  assert.equal(senza[0].classe, undefined); // 0 = non disponibile
  assert.equal(senza[1].classe, undefined); // fuori da 1–5
});

test('campi mancanti: niente gruppi vuoti e trattino al posto di NaN', () => {
  const v = voceTerreno({ quota: 10, slope_deg: null, aspetto_nome: null });
  assert.equal(v.badge, '10 m s.l.m.');
  assert.deepEqual(valori(gruppo(v, 'Pendenza')), { Gradi: '—', Percentuale: '—' }); // senza unità quando manca il dato
  assert.ok(!v.gruppi.some(g => g.titolo === 'Energia e clima'));
  assert.ok(!v.gruppi.some(g => g.titolo === 'Accessibilità ed erosione'));
  assert.ok(!JSON.stringify(v).includes('NaN'));
});

test('rimanda all\'analisi morfologica interattiva', () => {
  assert.equal(voceTerreno(P).link.url, 'https://palermohub.opendatasicilia.it/palermo_dtm5m.html');
});
