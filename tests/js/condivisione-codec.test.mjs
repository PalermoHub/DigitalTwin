import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { codifica, decodifica, costruisciLink, LIMITE, PARAMETRO } from '../../js/core/condivisione-codec.js';

const base = { c: [13.36123, 38.11571, 12.5, 0, 0], a: ['popolazione', 'edifici'], o: { popolazione: 0.5 }, b: 'positron', t: 1 };
const grezzo = o => 'v1j.' + Buffer.from(JSON.stringify(o)).toString('base64url');

test('round-trip', async () => {
  const { testo, troncato } = await codifica(base);
  assert.equal(troncato, false);
  assert.match(testo, /^v1z\.[\w-]+$/);
  assert.deepEqual(await decodifica(testo), base);
});

test('sopra il limite scarta prima i temi di colore e avvisa', async () => {
  const temi = { x: Array.from({ length: 300 }, () => randomBytes(8).toString('hex')) };
  const { testo, troncato } = await codifica({ ...base, s: { 'dt-temi-strati': temi } });
  assert.equal(troncato, true);
  assert.ok(testo.length <= LIMITE);
  const letto = await decodifica(testo);
  assert.equal(letto.s, undefined);
  assert.deepEqual(letto.a, base.a);
});

test('input corrotto, vuoto o di altra versione → null', async () => {
  for (const x of ['v1z.@@@', 'v2z.abc', 'v1z.AAAA', '', null, undefined, 'v1j.' + Buffer.from('[1]').toString('base64url'), 'v1j.' + Buffer.from('non json').toString('base64url'), 'v1z.' + 'A'.repeat(5000)]) {
    assert.equal(await decodifica(x), null, String(x).slice(0, 20));
  }
});

test('tiene solo i campi ben formati', async () => {
  const letto = await decodifica(grezzo({ a: [1, 'ok'], o: { x: 5, y: 0.3 }, c: [1, 2], b: 7, t: 2, s: { evil: {}, 'dt-ordine-strati': { g: ['a'] }, 'dt-temi-strati': 'testo' }, z: { circ: 'I', quart: 3 }, l: 9, i: { anno: '2020', gravita: 4 } }));
  assert.deepEqual(letto, { a: ['ok'], o: { y: 0.3 }, s: { 'dt-ordine-strati': { g: ['a'] } }, z: { circ: 'I' }, i: { anno: '2020' } });
});

test('costruisciLink mantiene parametri e hash e sostituisce v', () => {
  const l = new URL(costruisciLink('https://x.it/DigitalTwin/?scheda=38.1,13.3&v=vecchio#13/38.1/13.3', 'v1z.abc'));
  assert.equal(l.searchParams.get(PARAMETRO), 'v1z.abc');
  assert.equal(l.searchParams.get('scheda'), '38.1,13.3');
  assert.equal(l.hash, '#13/38.1/13.3');
});
