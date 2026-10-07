import test from 'node:test';
import assert from 'node:assert/strict';
import { urlSicuro, collegamento } from '../../js/core/url-sicuro.js';

test('urlSicuro: accetta http e https, anche relativi', () => {
  assert.equal(urlSicuro('https://turismo.comune.palermo.it/x?a=1'), 'https://turismo.comune.palermo.it/x?a=1');
  assert.equal(urlSicuro('http://esempio.it'), 'http://esempio.it');
  assert.equal(urlSicuro('docs/guida.html'), 'docs/guida.html');
  assert.equal(urlSicuro('  https://a.it  '), 'https://a.it');
});

test('urlSicuro: rifiuta schemi pericolosi e valori non validi', () => {
  for (const x of ['javascript:alert(1)', ' JavaScript:alert(1)', 'data:text/html,<b>x</b>', 'vbscript:x', 'file:///etc/passwd', '', '   ', null, undefined, 42, {}]) {
    assert.equal(urlSicuro(x), null, String(x));
  }
});

test('collegamento: senza indirizzo valido il link non ha href', () => {
  const finto = () => ({ href: undefined, target: undefined, rel: undefined });
  const ok = collegamento(finto(), 'https://a.it');
  assert.deepEqual([ok.href, ok.target, ok.rel], ['https://a.it', '_blank', 'noopener noreferrer']);
  const no = collegamento(finto(), 'javascript:alert(1)');
  assert.equal(no.href, undefined);
});
