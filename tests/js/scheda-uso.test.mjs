import test from 'node:test';
import assert from 'node:assert/strict';
import { unisci } from '../../js/core/scheda-modello.js';
import { rigaUso, voceUsoEdificio } from '../../js/layers/scheda-uso.js';

const edificio = occupancy => ({
  chiave: 'edificio', peso: 30, titolo: 'Edificio', icona: 'fa-building',
  gruppi: [{ righe: [{ etichetta: 'Altezza', valore: '9.0 m' }, rigaUso(occupancy)].filter(Boolean) }],
});
const uso = sezioni => sezioni.find(s => s.chiave === 'edificio').gruppi.flatMap(g => g.righe).find(r => r.etichetta === 'Uso')?.valore;

test('rigaUso: UNK è un dato debole, un uso vero no, il vuoto non dà riga', () => {
  assert.deepEqual(rigaUso('UNK'), { etichetta: 'Uso', valore: 'UNK', ripiego: 4 });
  assert.deepEqual(rigaUso('RES'), { etichetta: 'Uso', valore: 'RES' });
  assert.equal(rigaUso(null), null);
  assert.equal(rigaUso(''), null);
});

test('UNK diventa Monumento, Scuola o asilo, Sede elettorale; priorità monumento > scuola > seggio', () => {
  for (const [tipo, atteso] of [['monumento', 'Monumento'], ['scuola', 'Scuola o asilo'], ['seggio', 'Sede elettorale']]) {
    assert.equal(uso(unisci([edificio('UNK'), voceUsoEdificio(tipo)]).sezioni), atteso);
    assert.equal(uso(unisci([voceUsoEdificio(tipo), edificio('UNK')]).sezioni), atteso); // l'ordine delle voci non conta
  }
  const tutti = unisci([edificio('UNK'), voceUsoEdificio('seggio'), voceUsoEdificio('scuola'), voceUsoEdificio('monumento')]);
  assert.equal(uso(tutti.sezioni), 'Monumento');
});

test('un uso vero dell\'edificio non viene sostituito', () => {
  assert.equal(uso(unisci([edificio('RES'), voceUsoEdificio('monumento')]).sezioni), 'RES');
});

test('senza edificio la voce porta comunque l\'uso (clic sul poligono del luogo)', () => {
  assert.equal(uso(unisci([voceUsoEdificio('scuola')]).sezioni), 'Scuola o asilo');
});

test('UNK senza monumento/scuola/seggio resta UNK', () => {
  assert.equal(uso(unisci([edificio('UNK')]).sezioni), 'UNK');
});
