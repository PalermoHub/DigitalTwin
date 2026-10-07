import test from 'node:test';
import assert from 'node:assert/strict';
import { RETI, TESTO_CONDIVISIONE } from '../../js/core/condivisione-reti.js';

const link = 'https://x.it/?v=v1z.ab-_&a=1';

test('ci sono tutte le reti, nell\'ordine previsto', () => {
  assert.deepEqual(RETI.map(r => r.id), ['whatsapp', 'telegram', 'facebook', 'x', 'linkedin', 'email']);
});

test('il link è sempre codificato e compare una sola volta come indirizzo', () => {
  const enc = encodeURIComponent(link);
  const url = Object.fromEntries(RETI.map(r => [r.id, r.url(link, TESTO_CONDIVISIONE)]));
  assert.ok(url.whatsapp.startsWith('https://wa.me/?text=') && url.whatsapp.includes(encodeURIComponent(link)));
  assert.equal(url.telegram, `https://t.me/share/url?url=${enc}&text=${encodeURIComponent(TESTO_CONDIVISIONE)}`);
  assert.equal(url.facebook, `https://www.facebook.com/sharer/sharer.php?u=${enc}`);
  assert.equal(url.x, `https://twitter.com/intent/tweet?url=${enc}&text=${encodeURIComponent(TESTO_CONDIVISIONE)}`);
  assert.equal(url.linkedin, `https://www.linkedin.com/sharing/share-offsite/?url=${enc}`);
  assert.ok(url.email.startsWith('mailto:?subject=') && url.email.includes(enc));
});

test('ogni rete ha il suo logo (percorso SVG) e il colore del marchio', () => {
  for (const r of RETI) {
    assert.match(r.icona, /^M[\d. a-zA-Z,-]+$/, r.id);
    assert.match(r.colore, /^#[0-9a-f]{6}$/i, r.id);
  }
});
