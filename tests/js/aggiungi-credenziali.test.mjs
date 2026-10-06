// tests/js/aggiungi-credenziali.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { creaCredenziali, ospiteDi } from '../../js/aggiungi/credenziali.js';

test('ospiteDi: nome host di un URL, anche con segnaposto XYZ; null se non è un URL', () => {
  assert.equal(ospiteDi('https://a.it/x?y=1'), 'a.it');
  assert.equal(ospiteDi('https://tile.it/{z}/{x}/{y}.png'), 'tile.it');
  assert.equal(ospiteDi('boh'), null);
});

test('imposta e rilegge: intestazione Basic con utente e password', () => {
  const c = creaCredenziali();
  c.imposta('a.it', 'mario', 'segreta');
  assert.equal(c.ha('a.it'), true);
  assert.equal(c.utente('a.it'), 'mario');
  assert.equal(c.intestazione('a.it'), `Basic ${Buffer.from('mario:segreta').toString('base64')}`);
  assert.equal(c.intestazione('altro.it'), null);
  c.togli('a.it');
  assert.equal(c.ha('a.it'), false);
});

test('caratteri non ASCII e spazi: UTF-8, non Latin-1', () => {
  const c = creaCredenziali();
  c.imposta('a.it', 'giovanni', 'pàss wörd é');
  assert.equal(c.intestazione('a.it'), `Basic ${Buffer.from('giovanni:pàss wörd é', 'utf8').toString('base64')}`);
});

test('due punti nel nome utente: rifiutati con un messaggio, nulla si salva', () => {
  const c = creaCredenziali();
  assert.throws(() => c.imposta('a.it', 'a:b', 'x'), /due punti/);
  assert.equal(c.ha('a.it'), false);
});

test('password vuota ammessa; senza utente non si imposta nulla', () => {
  const c = creaCredenziali();
  c.imposta('a.it', 'mario', '');
  assert.equal(c.intestazione('a.it'), `Basic ${Buffer.from('mario:').toString('base64')}`);
  assert.throws(() => c.imposta('b.it', '', 'x'), /nome utente/);
});

test('perUrlProxy: riconosce solo le richieste dirette al proxy per un host con credenziali', () => {
  const c = creaCredenziali();
  c.imposta('a.it', 'u', 'p');
  const h = c.intestazione('a.it');
  assert.equal(c.perUrlProxy('https://proxy.test/', 'https://proxy.test/t/a.it/ows?x=1'), h);
  assert.equal(c.perUrlProxy('https://proxy.test', 'https://proxy.test/t/b.it/ows'), null);
  assert.equal(c.perUrlProxy('https://proxy.test', 'https://a.it/ows'), null); // non passa dal proxy: mai
  assert.equal(c.perUrlProxy('https://proxy.test', 'https://proxy.test.evil.it/t/a.it/x'), null);
});
