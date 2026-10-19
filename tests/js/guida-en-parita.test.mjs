import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

// Parità tra la guida italiana (guida/*.md) e quella inglese (guida/en/*.md): stessi file, stesse sezioni, stesso ordine,
// così gli id delle voci (NN-nome#k) coincidono e collegamenti/rinvii/pannelli/percorsi valgono per entrambe le lingue.
const IT = new URL('../../guida/', import.meta.url);
const EN = new URL('../../guida/en/', import.meta.url);
const file = existsSync(EN) ? readdirSync(EN).filter(f => f.endsWith('.md')).sort() : [];

const sezioni = testo => testo.split(/\n(?=## )/).filter(s => s.startsWith('## '));
const leggi = (cartella, nome) => readFileSync(new URL(nome, cartella), 'utf8');

test('guida/en/ esiste e contiene almeno un file', () => {
  assert.ok(file.length > 0, 'cartella guida/en/ assente o vuota');
});

test('nessun file orfano: ogni guida/en/<file>.md ha la controparte italiana', () => {
  for (const f of file) assert.ok(existsSync(new URL(f, IT)), `${f}: manca guida/${f}`);
});

test('parità sezioni: stesso numero di sezioni con metadati, stesso ordine', () => {
  for (const f of file) {
    const it = sezioni(leggi(IT, f)).filter(s => /^Parole chiave:/m.test(s));
    const en = sezioni(leggi(EN, f)).filter(s => /^Keywords:/m.test(s));
    assert.equal(en.length, it.length, `${f}: ${en.length} sezioni inglesi contro ${it.length} italiane`);
    assert.equal(sezioni(leggi(EN, f)).length, sezioni(leggi(IT, f)).length, `${f}: numero di sezioni «##» diverso`);
  }
});

test('marcatori inglesi: ogni sezione ha Keywords e Typical questions con almeno una domanda', () => {
  for (const f of file) {
    for (const s of sezioni(leggi(EN, f))) {
      const titolo = s.split('\n')[0];
      assert.match(s, /^Keywords:\s*\S/m, `${f} ${titolo}: manca Keywords:`);
      const dom = /^Typical questions:\s*(.+)$/m.exec(s);
      assert.ok(dom, `${f} ${titolo}: manca Typical questions:`);
      assert.match(dom[1], /\?/, `${f} ${titolo}: nessuna domanda che finisce per «?»`);
    }
  }
});

test('marcatori italiani assenti nei file inglesi', () => {
  for (const f of file) {
    const t = leggi(EN, f);
    assert.doesNotMatch(t, /^Parole chiave:/m, `${f}: «Parole chiave:» rimasto`);
    assert.doesNotMatch(t, /^Domande tipiche:/m, `${f}: «Domande tipiche:» rimasto`);
  }
});

test('stesse righe «---» tra le sezioni', () => {
  for (const f of file) {
    const conta = t => (t.match(/^---\s*$/gm) ?? []).length;
    assert.equal(conta(leggi(EN, f)), conta(leggi(IT, f)), `${f}: righe --- diverse`);
  }
});

test('copertura: ogni file indicizzato di guida/ ha la controparte in guida/en/', () => {
  const esclusi = new Set(['00-leggimi.md', 'RIPRESA.md', 'glossario-en.md']);
  const italiani = readdirSync(IT).filter(f => f.endsWith('.md') && !esclusi.has(f));
  const mancanti = italiani.filter(f => !file.includes(f));
  assert.deepEqual(mancanti, [], `file senza traduzione: ${mancanti.join(', ')}`);
});

test('indice inglese: stesse voci dell\'italiano e nessun titolo rimasto in italiano', () => {
  const it = JSON.parse(readFileSync(new URL('indice.json', IT), 'utf8'));
  const en = JSON.parse(readFileSync(new URL('indice.en.json', IT), 'utf8'));
  assert.deepEqual(en.map(v => v.id), it.map(v => v.id));
  const uguali = en.filter((v, i) => v.titolo === it[i].titolo).map(v => v.id);
  assert.deepEqual(uguali, [], `voci con titolo ancora italiano: ${uguali.join(', ')}`);
});
