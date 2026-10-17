import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizzaRaggio, caricaRaggio, impostaRaggio, raggioVicini, CHIAVE_RAGGIO, RAGGIO_INIZIALE } from '../../js/core/raggio-vicini.js';

const deposito = (valore = null) => { const d = { valore, scritto: null }; return Object.assign(d, { getItem: () => d.valore, setItem: (k, v) => { d.scritto = [k, v]; } }); };

test('normalizzaRaggio: limiti, passi da 50 m, valori non validi → iniziale', () => {
  assert.equal(normalizzaRaggio(10), 100);
  assert.equal(normalizzaRaggio(9999), 500);
  assert.equal(normalizzaRaggio('270'), 250);
  assert.equal(normalizzaRaggio('abc'), RAGGIO_INIZIALE);
  assert.equal(normalizzaRaggio(null), RAGGIO_INIZIALE);
});

test('impostaRaggio salva e raggioVicini lo restituisce; caricaRaggio lo rilegge', () => {
  const d = deposito();
  assert.equal(impostaRaggio(420, d), 400);
  assert.deepEqual(d.scritto, [CHIAVE_RAGGIO, '400']);
  assert.equal(raggioVicini(), 400);
  assert.equal(caricaRaggio(deposito('150')), 150);
  assert.equal(caricaRaggio({ getItem() { throw new Error('bloccato'); } }), RAGGIO_INIZIALE);
});

test('cerchioRaggio: anello chiuso, ogni vertice a `raggio` metri dal centro', async () => {
  const { cerchioRaggio } = await import('../../js/core/cerchio-raggio.js');
  const { distanzaApprossimataM } = await import('../../js/core/scheda-util.js');
  const centro = { lng: 13.36, lat: 38.12 };
  const { coordinates } = cerchioRaggio(centro, 300).geometry;
  assert.deepEqual(coordinates[0], coordinates.at(-1));
  for (const c of coordinates) assert.ok(Math.abs(distanzaApprossimataM([centro.lng, centro.lat], c) - 300) < 1);
});

test('cerchio: acceso all\'inizio, impostaCerchio salva, caricaCerchio rilegge', async () => {
  const { caricaCerchio, impostaCerchio, cerchioVisibile, CHIAVE_CERCHIO } = await import('../../js/core/raggio-vicini.js');
  assert.equal(caricaCerchio(deposito()), true);
  const d = deposito();
  assert.equal(impostaCerchio(false, d), false);
  assert.deepEqual(d.scritto, [CHIAVE_CERCHIO, '0']);
  assert.equal(cerchioVisibile(), false);
  assert.equal(caricaCerchio(deposito('0')), false);
  assert.equal(caricaCerchio(deposito('1')), true);
});
