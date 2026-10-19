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
