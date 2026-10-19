import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const leggi = async nome => JSON.parse(await readFile(new URL(`../../js/core/${nome}`, import.meta.url), 'utf8'));

test('home: ogni argomento ha fonte, enti e risorse in italiano e in inglese', async () => {
  const strati = await leggi('home-strati.json');
  for (const lingua of ['it', 'en']) {
    assert.ok(strati[lingua].length > 0);
    for (const a of strati[lingua]) {
      assert.ok(a.fonte, `${lingua}/${a.id}: manca la fonte (js/core/home-fonti.json)`);
      assert.ok(a.enti?.length, `${lingua}/${a.id}: mancano gli enti (js/core/home-fonti.json)`);
    }
  }
});

test('home: stessi argomenti e stessi strati nelle due lingue', async () => {
  const { it, en } = await leggi('home-strati.json');
  const chiavi = l => l.map(a => `${a.id}:${a.strati.map(s => s.id).sort()}`).sort();
  assert.deepEqual(chiavi(it), chiavi(en));
});

test('home: i percorsi guidati usano solo strati che esistono, con titolo e testo nelle due lingue', async () => {
  const { it } = await leggi('home-strati.json');
  const ids = new Set(it.flatMap(a => a.strati.map(s => s.id)));
  for (const p of await leggi('home-percorsi.json')) {
    assert.ok(p.strati.length > 0, `${p.id}: nessuno strato`);
    for (const id of p.strati) assert.ok(ids.has(id), `${p.id}: lo strato «${id}» non esiste`);
    if (p.vista) assert.ok(p.vista.length === 5 && p.vista.every(Number.isFinite), `${p.id}: vista = [lng, lat, zoom, bearing, pitch]`);
    for (const l of ['it', 'en']) assert.ok(p[l]?.titolo && p[l]?.testo, `${p.id}: manca il testo ${l}`);
  }
});

test('home: ogni argomento ha la data di aggiunta (AAAA-MM-GG)', async () => {
  const strati = await leggi('home-strati.json');
  for (const a of strati.it) assert.match(a.data, /^\d{4}-\d{2}-\d{2}$/, `${a.id}: manca la data in js/core/home-fonti.json`);
});
