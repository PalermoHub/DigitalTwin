import test from 'node:test';
import assert from 'node:assert/strict';
import { PASSI } from '../../js/core/guida-contenuti.js';

test('undici passi nell\'ordine previsto', () => {
  assert.deepEqual(PASSI.map(p => p.id), ['cos-e', 'dati', 'strati', 'clic', 'scheda', 'monumenti', 'uffici', 'pai', 'incendi', 'filtri', 'avvertenze']);
});

test('id univoci e validi come ancora', () => {
  const ids = PASSI.map(p => p.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^[a-z0-9-]+$/);
});

test('ogni passo ha titolo, paragrafi, narrazione e immagine completa', () => {
  for (const p of PASSI) {
    assert.ok(p.titolo.trim(), `${p.id}: titolo`);
    assert.ok(p.paragrafi.length >= 1 && p.paragrafi.every(t => t.trim()), `${p.id}: paragrafi`);
    assert.ok(p.narrazione.trim().length > 40, `${p.id}: narrazione`);
    assert.equal(p.immagine.file, `img/guida/passi/${p.id}.webp`);
    assert.ok(p.immagine.alt.trim() && p.immagine.didascalia.trim(), `${p.id}: alt e didascalia`);
  }
});

test('le narrazioni non contengono cifre né sigle da leggere male', () => {
  for (const p of PASSI) {
    assert.doesNotMatch(p.narrazione, /\d/, `${p.id}: cifre`);
    assert.doesNotMatch(p.narrazione, /\b(PRG|GTFS|DTM|ISTAT|OSM)\b/, `${p.id}: sigle`);
  }
});

test('nessun passo parla di 3D', () => {
  for (const p of PASSI) assert.doesNotMatch(JSON.stringify(p), /3D/i, p.id);
});

test('la scena ha centro dentro Palermo e zoom nel range della mappa', () => {
  for (const p of PASSI) {
    const [lon, lat] = p.scena.centro;
    assert.ok(lon > 13.2 && lon < 13.5 && lat > 38.0 && lat < 38.3, `${p.id}: centro`);
    assert.ok(p.scena.zoom >= 12 && p.scena.zoom <= 18, `${p.id}: zoom`);
  }
});

import { schedaGuida } from '../../js/core/guida.js';

function elementoFinto(tag) {
  return {
    tag, children: [], attrs: {}, dataset: {}, className: '', textContent: '', hidden: false,
    append(...f) { this.children.push(...f); },
    addEventListener(t, f) { this.ev ??= {}; this.ev[t] = f; },
    setAttribute(k, v) { this.attrs[k] = v; },
    set href(v) { this.attrs.href = v; }, get href() { return this.attrs.href; },
    set src(v) { this.attrs.src = v; }, get src() { return this.attrs.src; },
    set alt(v) { this.attrs.alt = v; }, get alt() { return this.attrs.alt; },
    set loading(v) { this.attrs.loading = v; }, get loading() { return this.attrs.loading; },
    set id(v) { this.attrs.id = v; }, get id() { return this.attrs.id; },
  };
}
const doc = { createElement: elementoFinto };
const tutti = (n, tag, acc = []) => { if (n.tag === tag) acc.push(n); n.children?.forEach(c => tutti(c, tag, acc)); return acc; };

test('schedaGuida: una sezione per passo con id ancora, e un link nell\'indice per ciascuno', () => {
  const radice = schedaGuida(doc);
  const sezioni = tutti(radice, 'section');
  assert.deepEqual(sezioni.map(s => s.id), PASSI.map(p => `guida-${p.id}`));
  const link = tutti(radice, 'a').map(a => a.href);
  assert.deepEqual(link, PASSI.map(p => `#guida-${p.id}`));
});

test('schedaGuida: ogni immagine è lazy, ha alt e didascalia', () => {
  const imgs = tutti(schedaGuida(doc), 'img');
  assert.equal(imgs.length, PASSI.length);
  imgs.forEach((img, i) => {
    assert.equal(img.loading, 'lazy');
    assert.equal(img.alt, PASSI[i].immagine.alt);
    assert.equal(img.src, PASSI[i].immagine.file);
  });
  assert.equal(tutti(schedaGuida(doc), 'figcaption').length, PASSI.length);
});

test('schedaGuida: blocco media con video sottotitolato e audio', () => {
  const radice = schedaGuida(doc);
  const [video] = tutti(radice, 'video');
  assert.equal(video.attrs.preload, 'metadata');
  assert.equal(video.attrs.poster, PASSI[0].immagine.file);
  const [track] = tutti(video, 'track');
  assert.equal(track.attrs.kind, 'captions');
  assert.equal(track.attrs.src, 'media/guida/guida.vtt');
  const [audio] = tutti(radice, 'audio');
  assert.equal(audio.attrs.preload, 'none');
});

test('schedaGuida: se un\'immagine non carica la sua figura sparisce (niente icona rotta)', () => {
  const radice = schedaGuida(doc);
  const fig = tutti(radice, 'figure')[0];
  let rimossa = false;
  fig.remove = () => { rimossa = true; };
  tutti(fig, 'img')[0].onerror();
  assert.ok(rimossa);
});

test('schedaGuida: se il video o l\'audio non caricano il blocco media sparisce', () => {
  for (const tag of ['video', 'audio']) {
    const radice = schedaGuida(doc);
    const media = tutti(radice, 'div').find(d => d.className === 'guida-media');
    let rimosso = false;
    media.remove = () => { rimosso = true; };
    tutti(radice, tag)[0].children.find(c => c.tag === 'source').onerror();
    assert.ok(rimosso, tag);
  }
});

test('schedaGuida: il clic sull\'indice scorre alla sezione senza cambiare l\'hash dell\'URL', () => {
  const radice = schedaGuida(doc);
  const a = tutti(radice, 'a')[2];
  const sez = tutti(radice, 'section')[2];
  let scrollato = false, prevenuto = false;
  sez.scrollIntoView = () => { scrollato = true; };
  a.ev.click({ preventDefault() { prevenuto = true; } });
  assert.ok(scrollato && prevenuto);
});
