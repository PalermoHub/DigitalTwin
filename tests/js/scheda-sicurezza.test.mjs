import test from 'node:test';
import assert from 'node:assert/strict';
import { unisci } from '../../js/core/scheda-modello.js';
import { voceArco, voceHotspot, voceIncidente, tooltipArco, GRAVITA, NOTA_DATI } from '../../js/layers/scheda-sicurezza.js';

const arco = {
  arco_id: 1, nome: 'Viale Croce Rossa', highway: 'tertiary', lunghezza_m: 216.1, n_incidenti: 5, tasso_km: 23.137,
  tasso_affidabile: true, pendenza_media_pct: 1.69, accessibilita: 'agevole', Quartiere: 'Libertà', Circoscrizione: 'VIII',
  UPL: 'Vittorio Veneto', priorita_geomorf: 'nessun rischio PAI', priorita_idraul: 'nessun rischio idraulico',
};
const valori = v => Object.fromEntries(v.gruppi.flatMap(g => g.righe).map(r => [r.etichetta, r.valore]));

test('arco: titolo, incidenti e tasso arrotondato', () => {
  const v = voceArco(arco);
  assert.equal(v.titolo, 'Viale Croce Rossa');
  assert.equal(v.badge, 'Tratto stradale');
  const r = valori(v);
  assert.equal(r['Incidenti 2015–2023'], '5');
  assert.equal(r['Incidenti per km'], '23,1');
  assert.equal(r['Pendenza media'], '1,7%');
});

test('arco senza incidenti: lo dice, niente tasso', () => {
  const r = valori(voceArco({ ...arco, n_incidenti: 0, tasso_km: 0 }));
  assert.equal(r['Incidenti 2015–2023'], 'nessun incidente registrato');
  assert.equal(r['Incidenti per km'], undefined);
});

test('arco non affidabile (<20 m): conteggio sì, tasso «non significativo»', () => {
  const r = valori(voceArco({ ...arco, lunghezza_m: 12, tasso_affidabile: false, tasso_km: 400 }));
  assert.equal(r['Incidenti 2015–2023'], '5');
  assert.equal(r['Incidenti per km'], 'non significativo (tratto < 20 m)');
});

test('arco: PAI nulli o «nessun rischio» non producono righe', () => {
  const v = voceArco({ ...arco, rischio_geomorf_label: null, rischio_idraul_label: undefined });
  const et = v.gruppi.flatMap(g => g.righe).map(r => r.etichetta);
  assert.ok(!et.includes('Rischio frane') && !et.includes('Rischio alluvioni'));
  assert.ok(!et.includes('Priorità frane') && !et.includes('Priorità alluvioni'));
  assert.ok(!JSON.stringify(v).includes('null') && !JSON.stringify(v).includes('undefined'));
});

test('arco: rischio e priorità PAI compaiono se presenti', () => {
  const r = valori(voceArco({ ...arco, rischio_geomorf_label: 'R4 - molto elevato', priorita_geomorf: "priorita' massima" }));
  assert.equal(r['Rischio frane'], 'R4 - molto elevato');
  assert.equal(r['Priorità frane'], "priorita' massima");
});

test('hotspot: livello di confidenza e gravità', () => {
  const v = voceHotspot({ cell_id: 3, n_incidenti: 40, gravita_tot: 55.4, livello_gravita: 99, livello_conteggio: 95 });
  assert.equal(v.badge, 'Hotspot incidenti');
  const r = valori(v);
  assert.equal(r['Confidenza (gravità)'], '99%');
  assert.equal(r['Incidenti nella cella'], '40');
});

test('incidente: gravità decodificata, feriti', () => {
  const v = voceIncidente({ anno: 2018, Tipologia: 'M', feriti_n: 0, Luogo: 'VIA ROMA' });
  assert.equal(v.titolo, 'VIA ROMA');
  assert.equal(valori(v)['Gravità'], 'Mortale');
  assert.equal(valori(v)['Anno'], '2018');
  assert.equal(GRAVITA.F.nome, 'Con feriti');
});

test('tooltip arco: via e dato sintetico, anche senza incidenti', () => {
  assert.deepEqual(tooltipArco(arco), { titolo: 'Viale Croce Rossa', dettaglio: '5 incidenti · 23,1 per km' });
  assert.equal(tooltipArco({ ...arco, n_incidenti: 0 }).dettaglio, 'Nessun incidente registrato');
  assert.equal(tooltipArco({ ...arco, nome: undefined }).titolo, 'Strada senza nome');
});

test('unisci: la nota sui limiti dei dati è nella voce arco', () => {
  const { sezioni } = unisci([voceArco(arco)]);
  assert.ok(JSON.stringify(sezioni).includes(NOTA_DATI.slice(0, 30)));
});

const via = { via_rango: 3, via_gravita_km: 53.5, via_incidenti: 425, via_mortali: 4, via_km: 6.9 };

test('arco di una via in classifica: posizione, gravità per km, mortali e lunghezza della via', () => {
  const r = valori(voceArco({ ...arco, ...via }));
  assert.equal(r['Classifica vie pericolose'], '3° su 20');
  assert.equal(r['Gravità per km (via)'], '53,5');
  assert.equal(r['Incidenti sulla via'], '425 su 6,9 km');
  assert.equal(r['Mortali sulla via'], '4');
});

test('arco di una via fuori classifica: nessuna riga di classifica', () => {
  const et = voceArco(arco).gruppi.flatMap(g => g.righe).map(r => r.etichetta);
  assert.ok(!et.some(e => /classifica|via\)/i.test(e)));
});

test('via in classifica senza mortali: la riga dei mortali dice 0, non sparisce', () => {
  const r = valori(voceArco({ ...arco, ...via, via_mortali: 0 }));
  assert.equal(r['Mortali sulla via'], '0');
});

test('tooltip arco: il posto in classifica compare davanti al nome', () => {
  assert.equal(tooltipArco({ ...arco, ...via }).titolo, '#3 · Viale Croce Rossa');
  assert.equal(tooltipArco(arco).titolo, 'Viale Croce Rossa');
});

test('nota della classifica nella scheda: criterio e limite delle strade senza nome', () => {
  const v = voceArco({ ...arco, ...via });
  assert.match(v.nota, /gravità/i);
  assert.match(v.nota, /senza nome/i);
});
