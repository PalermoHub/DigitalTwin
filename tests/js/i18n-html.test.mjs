import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const radice = new URL('../../', import.meta.url);
const it = JSON.parse(readFileSync(new URL('js/locales/it.json', radice), 'utf8'));
const en = JSON.parse(readFileSync(new URL('js/locales/en.json', radice), 'utf8'));

const ACCENTATE = /[àèéìòùÀÈÉÌÒÙ]/;
const PAROLE = /\b(il|lo|la|le|gli|dei|del|della|delle|nel|nella|per|con|non|che|una|uno|di|da|sul|sulla|più|solo|tutti|nessun[oa]?|cerca|strati|mappa|apri|vai|guida|fonti|scheda)\b/i;

export function chiaviUsate(html) {
  return [...html.matchAll(/data-i18n(?:-[a-z]+)?="([^"]+)"/g)].map(m => m[1]);
}

// testo visibile non marcato: toglie script/style, gli elementi con data-i18n(-html) e i tag, poi cerca italiano
export function testoNonMarcato(html) {
  return html
    .replace(/<(script|style|svg)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<([a-z0-9]+)\b[^>]*\sdata-i18n(?:-html)?="[^"]*"[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .split(/\s{2,}|\n/).map(s => s.trim()).filter(s => s && (ACCENTATE.test(s) || PAROLE.test(s)));
}

// attributi italiani non marcati: title, aria-label, placeholder, alt, content di meta senza il corrispondente data-i18n-*
export function attributiNonMarcati(html) {
  const trovati = [];
  for (const tag of html.match(/<[a-z][^>]*>/gi) || []) {
    for (const [attr, marca] of [['title', 'data-i18n-title'], ['aria-label', 'data-i18n-aria'], ['placeholder', 'data-i18n-placeholder'], ['alt', 'data-i18n-alt']]) {
      const m = tag.match(new RegExp(`\\s${attr}="([^"]*)"`));
      if (m && m[1].trim() && !tag.includes(marca) && (ACCENTATE.test(m[1]) || PAROLE.test(m[1]))) trovati.push(`${attr}="${m[1]}"`);
    }
  }
  return trovati;
}

for (const pagina of ['index.html', 'presentazione.html']) {
  const html = () => readFileSync(new URL(pagina, radice), 'utf8');
  test(`${pagina}: ogni chiave data-i18n esiste in it.json e en.json`, () => {
    for (const k of chiaviUsate(html())) {
      assert.ok(k in it, `manca in it.json: ${k}`);
      assert.ok(k in en, `manca in en.json: ${k}`);
    }
  });
  test(`${pagina}: nessun testo italiano fuori dagli elementi marcati`, () => {
    assert.deepEqual(testoNonMarcato(html()), []);
  });
  test(`${pagina}: nessun attributo italiano senza marcatura`, () => {
    assert.deepEqual(attributiNonMarcati(html()), []);
  });
}
