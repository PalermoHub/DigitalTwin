import test from 'node:test';
import assert from 'node:assert/strict';
import { ANNI, filtroIncidenti, zoomMinimo, etichetteChip, ZOOM_BASE, ZOOM_FILTRATO } from '../../js/layers/sicurezza-filtro.js';

test('anni: il 2019 non è nel dataset pulito', () => {
  assert.deepEqual(ANNI, [2015, 2016, 2017, 2018, 2020, 2021, 2022, 2023]);
});

test('filtroIncidenti: nessun filtro → null', () => {
  assert.equal(filtroIncidenti({}), null);
  assert.equal(filtroIncidenti({ anno: null, gravita: '', via: undefined }), null);
});

test('filtroIncidenti: una sola condizione resta semplice', () => {
  assert.deepEqual(filtroIncidenti({ anno: 2018 }), ['==', ['get', 'anno'], 2018]);
  assert.deepEqual(filtroIncidenti({ gravita: 'M' }), ['==', ['get', 'Tipologia'], 'M']);
  assert.deepEqual(filtroIncidenti({ via: 'Via Roma' }), ['==', ['get', 'via'], 'Via Roma']);
});

test('filtroIncidenti: più condizioni in AND, anno come numero anche se arriva come testo', () => {
  assert.deepEqual(filtroIncidenti({ anno: '2018', gravita: 'M', via: 'Via Roma' }),
    ['all', ['==', ['get', 'anno'], 2018], ['==', ['get', 'Tipologia'], 'M'], ['==', ['get', 'via'], 'Via Roma']]);
});

test('zoomMinimo: con un filtro attivo gli incidenti si vedono da più lontano', () => {
  assert.equal(zoomMinimo(null), ZOOM_BASE);
  assert.equal(zoomMinimo(['==', ['get', 'anno'], 2018]), ZOOM_FILTRATO);
  assert.ok(ZOOM_FILTRATO < ZOOM_BASE);
});

test('etichetteChip: una per filtro attivo, con la gravità in parole', () => {
  assert.deepEqual(etichetteChip({}), []);
  assert.deepEqual(etichetteChip({ anno: 2018, gravita: 'R', via: 'Via della Libertà' }),
    [{ chiave: 'anno', testo: 'Incidenti 2018' }, { chiave: 'gravita', testo: 'Incidenti con prognosi riservata' }, { chiave: 'via', testo: 'Incidenti: Via della Libertà' }]);
});
