import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RADICE = new URL('../../', import.meta.url).pathname;
const leggi = f => JSON.parse(readFileSync(join(RADICE, 'js/locales', f), 'utf8'));
const it = leggi('it.json');
const en = leggi('en.json');
const segnaposto = s => [...String(s).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',');

test('it.json e en.json hanno le stesse chiavi', () => {
  const soloIt = Object.keys(it).filter(k => !(k in en));
  const soloEn = Object.keys(en).filter(k => !(k in it));
  assert.deepEqual(soloIt, [], `chiavi senza traduzione inglese: ${soloIt.slice(0, 10).join(', ')}`);
  assert.deepEqual(soloEn, [], `chiavi inglesi senza italiano: ${soloEn.slice(0, 10).join(', ')}`);
});

test('ogni chiave ha gli stessi segnaposto {x} in italiano e in inglese', () => {
  for (const k of Object.keys(it)) {
    if (k in en) assert.equal(segnaposto(en[k]), segnaposto(it[k]), `segnaposto diversi in «${k}»`);
  }
});

test('nessun valore vuoto', () => {
  for (const [nome, d] of [['it', it], ['en', en]]) {
    for (const [k, v] of Object.entries(d)) assert.ok(String(v).trim() !== '', `${nome}: «${k}» è vuota`);
  }
});

function file(dir, out = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (n === 'vendor' || n === 'locales') continue;
    if (statSync(p).isDirectory()) file(p, out); else if (n.endsWith('.js')) out.push(p);
  }
  return out;
}

test('ogni t(\'chiave\') / tn(\'base\') usato nel codice esiste nei dizionari', () => {
  const mancanti = [];
  for (const f of file(join(RADICE, 'js'))) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/\btr?\(\s*'([\w.-]+)'/g)) if (!(m[1] in it)) mancanti.push(`${f.replace(RADICE, '')}: ${m[1]}`);
    for (const m of src.matchAll(/\btn\(\s*'([\w.-]+)'/g)) {
      for (const suf of ['uno', 'altri']) if (!(`${m[1]}.${suf}` in it)) mancanti.push(`${f.replace(RADICE, '')}: ${m[1]}.${suf}`);
    }
  }
  assert.deepEqual(mancanti, []);
});
