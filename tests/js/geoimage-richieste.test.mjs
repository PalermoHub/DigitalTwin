import test from 'node:test';
import assert from 'node:assert/strict';
import { creaRichieste } from '../../js/geoimage/richieste.js';

test('solo l\'ultima richiesta prenotata è attuale', () => {
  const r = creaRichieste();
  const a = r.prenota();
  assert.equal(r.attuale(a), true);
  const b = r.prenota();
  assert.equal(r.attuale(a), false, 'una richiesta più recente scavalca la precedente');
  assert.equal(r.attuale(b), true);
});

test('prenotare di nuovo (rimozione dell\'immagine) annulla quelle in corso', () => {
  const r = creaRichieste();
  const ripristino = r.prenota();
  r.prenota();
  assert.equal(r.attuale(ripristino), false);
});
