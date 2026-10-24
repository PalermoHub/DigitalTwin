// tests/js/condivisione-corto.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { accorcia } from '../../js/core/condivisione-corto.js';

const LUNGO = 'https://dt.example/mappa.html?v=v1z.AAAA#15/38/13';
const risposta = (corpo, stato = 200) => async () => new Response(JSON.stringify(corpo), { status: stato });
const prova = (fetchFn, extra = {}) => accorcia(LUNGO, { fetchFn, proxy: 'https://api.test', hostname: 'dt.example', ...extra });

test('chiede il link corto con POST /corto e il link lungo nel corpo', async () => {
  let visto;
  const url = await prova(async (u, o) => { visto = { u, o }; return new Response(JSON.stringify({ url: 'https://corto.test/a7Kd9xQ' })); });
  assert.equal(url, 'https://corto.test/a7Kd9xQ');
  assert.equal(visto.u, 'https://api.test/corto');
  assert.equal(visto.o.method, 'POST');
  assert.deepEqual(JSON.parse(visto.o.body), { url: LUNGO });
});

test('errore del servizio, rete assente o risposta strana: null', async () => {
  assert.equal(await prova(risposta({ errore: 'x' }, 400)), null);
  assert.equal(await prova(async () => { throw new TypeError('rete'); }), null);
  assert.equal(await prova(risposta({ url: 'javascript:alert(1)' })), null);
  assert.equal(await prova(risposta({ url: 42 })), null);
  assert.equal(await prova(risposta({})), null);
});

test('in locale non chiama il servizio', async () => {
  let chiamato = false;
  const url = await prova(async () => { chiamato = true; return new Response('{}'); }, { hostname: 'localhost' });
  assert.equal(url, null);
  assert.equal(chiamato, false);
});

test('Worker che non risponde: scade e restituisce null', async () => {
  const lento = (u, o) => new Promise((_, rifiuta) => o.signal.addEventListener('abort', () => rifiuta(new Error('annullata'))));
  assert.equal(await prova(lento, { attesaMs: 20 }), null);
});
