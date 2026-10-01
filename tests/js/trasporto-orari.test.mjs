import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatoOra, oggiISO, minutoAdesso, giornoIniziale, serviziAttivi, partenzeFermata, prossime, riepilogoLinea, colorePerTesto,
} from '../../js/layers/trasporto-orari.js';

const orari = {
  validita: { da: '2026-08-25', a: '2026-10-31' },
  servizi: { 0: ['2026-09-01', '2026-09-02'], 1: ['2026-09-02'] },
  fermate: { S1: { 100: [{ d: 0, s: 0, t: [420, 1530] }, { d: 1, s: 1, t: [600] }], 200: [{ d: 0, s: 0, t: [480] }] } },
};

test('formatoOra: orari normali e dopo la mezzanotte', () => {
  assert.equal(formatoOra(0), '00:00');
  assert.equal(formatoOra(435), '07:15');
  assert.equal(formatoOra(1530), '01:30 (+1)');
});

test('data e minuto locali', () => {
  assert.equal(oggiISO(new Date(2026, 8, 1, 23, 59)), '2026-09-01');
  assert.equal(minutoAdesso(new Date(2026, 8, 1, 7, 15)), 435);
});

test('giornoIniziale: oggi se nel feed, altrimenti il primo giorno valido con avviso', () => {
  assert.deepEqual(giornoIniziale(orari, '2026-10-01'), { data: '2026-10-01', fuori: false });
  assert.deepEqual(giornoIniziale(orari, '2026-11-15'), { data: '2026-08-25', fuori: true });
  assert.deepEqual(giornoIniziale(orari, '2026-08-01'), { data: '2026-08-25', fuori: true });
});

test('serviziAttivi: solo quelli che hanno la data', () => {
  assert.deepEqual([...serviziAttivi(orari, '2026-09-01')], [0]);
  assert.deepEqual([...serviziAttivi(orari, '2026-09-02')].sort(), [0, 1]);
  assert.equal(serviziAttivi(orari, '2026-12-25').size, 0);
});

test('partenzeFermata: ordinate, con le corse dopo la mezzanotte alla fine del giorno', () => {
  assert.deepEqual(partenzeFermata(orari, 'S1', '2026-09-01'), [
    { route: '100', dir: 0, t: 420 }, { route: '200', dir: 0, t: 480 }, { route: '100', dir: 0, t: 1530 },
  ]);
});

test('partenzeFermata: la corsa di ieri dopo la mezzanotte compare al mattino di oggi', () => {
  const p = partenzeFermata(orari, 'S1', '2026-09-02');
  assert.deepEqual(p[0], { route: '100', dir: 0, t: 90 }); // 25:30 di ieri = 01:30 di oggi
  assert.deepEqual(p.map(x => x.t), [90, 420, 480, 600, 1530]);
});

test('partenzeFermata: data senza servizio o fermata sconosciuta → lista vuota', () => {
  assert.deepEqual(partenzeFermata(orari, 'S1', '2026-12-25'), []);
  assert.deepEqual(partenzeFermata(orari, 'S999', '2026-09-01'), []);
});

test('prossime: dal minuto indicato in poi, al massimo n', () => {
  const p = partenzeFermata(orari, 'S1', '2026-09-02');
  assert.deepEqual(prossime(p, 450, 2).map(x => x.t), [480, 600]);
  assert.deepEqual(prossime(p, 2000), []);
});

test('riepilogoLinea: corse, primo, ultimo e frequenza media al capolinea', () => {
  const linea = { route_id: '100', direzione: 0, fermate: ['S1', 'S2'] };
  assert.deepEqual(riepilogoLinea(orari, linea, '2026-09-01'), { n: 2, primo: 420, ultimo: 1530, frequenza: 1110 });
  assert.equal(riepilogoLinea(orari, linea, '2026-12-25'), null);
  assert.deepEqual(riepilogoLinea(orari, { ...linea, direzione: 1 }, '2026-09-02'), { n: 1, primo: 600, ultimo: 600, frequenza: null });
});

test('colorePerTesto: testo scuro sui colori chiari e viceversa', () => {
  assert.equal(colorePerTesto('#FACE2F'), '#000000');
  assert.equal(colorePerTesto('#7B263E'), '#ffffff');
});
