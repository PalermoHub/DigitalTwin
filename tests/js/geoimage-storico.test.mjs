import test from 'node:test';
import assert from 'node:assert/strict';
import { creaStorico } from '../../js/geoimage/storico.js';

const pos = n => [{ lat: n, lng: n }, { lat: n, lng: n }, { lat: n, lng: n }, { lat: n, lng: n }];

test('annulla e ripeti ripercorrono le posizioni salvate', () => {
  const s = creaStorico();
  s.salva(pos(1)); s.salva(pos(2)); s.salva(pos(3));
  assert.equal(s.annulla()[0].lat, 2);
  assert.equal(s.annulla()[0].lat, 1);
  assert.equal(s.annulla(), null, 'al primo passo non si torna più indietro');
  assert.equal(s.ripeti()[0].lat, 2);
  assert.equal(s.ripeti(5)[0].lat, 3, 'i passi in eccesso si fermano all\'ultimo');
  assert.equal(s.ripeti(), null);
});

test('una nuova azione dopo un annulla cancella i passi da ripetere', () => {
  const s = creaStorico();
  s.salva(pos(1)); s.salva(pos(2)); s.annulla(); s.salva(pos(9));
  assert.equal(s.puoRipetere(), false);
  assert.equal(s.annulla()[0].lat, 1);
});

test('oltre il massimo scarta i passi più vecchi', () => {
  const s = creaStorico(3);
  for (let n = 1; n <= 5; n++) s.salva(pos(n));
  assert.equal(s.annulla(10)[0].lat, 3, 'restano 3, 4, 5');
  assert.equal(s.puoAnnullare(), false);
});

test('salva una copia: modificare gli angoli dopo non cambia la cronologia', () => {
  const s = creaStorico();
  const a = pos(1);
  s.salva(a); s.salva(pos(2));
  a[0].lat = 99;
  assert.equal(s.annulla()[0].lat, 1);
});

test('azzera svuota tutto', () => {
  const s = creaStorico();
  s.salva(pos(1)); s.salva(pos(2)); s.azzera();
  assert.equal(s.puoAnnullare(), false);
  assert.equal(s.puoRipetere(), false);
});
