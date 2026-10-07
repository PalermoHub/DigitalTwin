import test from 'node:test';
import assert from 'node:assert/strict';
import { scegliProxy, PROXY_PREDEFINITO } from '../../js/rndt/proxy.js';

test('in produzione il parametro ?rndt-proxy= è ignorato', () => {
  assert.equal(scegliProxy('?rndt-proxy=https://evil.example', 'gbvitrano.github.io'), PROXY_PREDEFINITO);
});

test('in locale il parametro vale, ma solo se è un indirizzo http(s)', () => {
  assert.equal(scegliProxy('?rndt-proxy=http://127.0.0.1:8787', 'localhost'), 'http://127.0.0.1:8787');
  assert.equal(scegliProxy('?rndt-proxy=http://127.0.0.1:8787/percorso', '127.0.0.1'), 'http://127.0.0.1:8787');
  assert.equal(scegliProxy('?rndt-proxy=javascript:alert(1)', 'localhost'), PROXY_PREDEFINITO);
  assert.equal(scegliProxy('?rndt-proxy=non-un-url', 'localhost'), PROXY_PREDEFINITO);
});

test('senza parametro vale il proxy predefinito', () => {
  assert.equal(scegliProxy('', 'localhost'), PROXY_PREDEFINITO);
});
