import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { vociGuide } from '../../js/core/ricerca-guide.js';

const indice = JSON.parse(readFileSync(new URL('../../guida/indice.json', import.meta.url), 'utf8'));
const sezioni = new Set(vociGuide().map(v => `${v.scheda}:${v.sezione}`));
const PAGINE_INTERE = new Set(['fonti']);

test('ogni rinvio del Chat bot punta a una pagina o a una sezione di guida che esiste', () => {
  const rotti = [];
  for (const v of indice) {
    for (const g of v.guide ?? []) {
      const [scheda, id] = g.split(':');
      const chiave = `${scheda}:guida-${scheda === 'geoimage' ? 'geoimage-' : ''}${id}`;
      if (id ? !sezioni.has(chiave) : !PAGINE_INTERE.has(scheda)) rotti.push(`${v.id} → ${g}`);
    }
  }
  assert.deepEqual(rotti, []);
});

test('le voci sulle funzioni dell\'app hanno almeno una pagina di guida', () => {
  const senza = ['38-tema-dell-interfaccia', '41-street-view', '47-mappe-di-base-e-storiche', '50-geoimage'].filter(f => !indice.some(v => v.file === `${f}.md` && v.guide?.length));
  assert.deepEqual(senza, []);
});
