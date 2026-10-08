import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { PASSI as SOLO_GUIDA, PASSI_RNDT } from '../../js/core/guida-contenuti.js';

const PASSI = [...SOLO_GUIDA, ...PASSI_RNDT]; // i test di contenuto valgono per entrambi

test('i passi nell\'ordine previsto', () => {
  assert.deepEqual(SOLO_GUIDA.map(p => p.id), ['cos-e', 'telefono', 'dati', 'strati', 'ordine-layer', 'mappe-storiche', 'miei-layer', 'colori', 'clic', 'tutto-in-un-punto', 'scheda', 'monumenti', 'uffici', 'pai', 'incendi', 'isole-calore', 'filtri', 'strumenti', 'avvertenze']);
  assert.deepEqual(PASSI_RNDT.map(p => p.id), ['rndt-catalogo', 'rndt-gruppo', 'rndt-info']);
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
    if (!p.statico) assert.ok(p.narrazione.trim().length > 40, `${p.id}: narrazione`);
    assert.match(p.immagine.file, new RegExp(`^img/guida/passi/${p.id === 'tutto-in-un-punto' ? 'intersezione\\.svg' : p.id + '\\.webp'}$`));
    assert.ok(p.immagine.alt.trim() && p.immagine.didascalia.trim(), `${p.id}: alt e didascalia`);
  }
});

test('le narrazioni non contengono cifre né sigle da leggere male', () => {
  for (const p of PASSI.filter(p => !p.statico)) {
    assert.doesNotMatch(p.narrazione, /\d/, `${p.id}: cifre`);
    assert.doesNotMatch(p.narrazione, /\b(PRG|GTFS|DTM|ISTAT|OSM)\b/, `${p.id}: sigle`);
  }
});

test('nessun passo parla di 3D', () => {
  for (const p of PASSI) assert.doesNotMatch(JSON.stringify(p), /3D/i, p.id);
});

test('la scena ha centro dentro Palermo e zoom nel range della mappa', () => {
  for (const p of PASSI.filter(p => !p.statico)) {
    const [lon, lat] = p.scena.centro;
    assert.ok(lon > 13.2 && lon < 13.5 && lat > 38.0 && lat < 38.3, `${p.id}: centro`);
    assert.ok(p.scena.zoom >= 12 && p.scena.zoom <= 18, `${p.id}: zoom`);
  }
});

test('i passi RNDT sono statici (immagine fatta a mano, fuori da video e screenshot automatici) e dicono le cose essenziali', () => {
  const rndt = PASSI_RNDT;
  assert.equal(rndt.length, 3);
  for (const p of rndt) {
    assert.equal(p.statico, true, p.id);
    assert.equal(p.narrazione, undefined, `${p.id}: il video non li racconta`);
    assert.equal(p.scena, undefined, `${p.id}: nessuna scena automatica`);
  }
  const testo = rndt.map(p => p.paragrafi.join(' ')).join(' ');
  for (const parola of ['Repertorio Nazionale', 'Palermo', 'GeoJSON', 'KML', 'KMZ', 'GPX', 'Shapefile', 'CSV', '5 MB', 'Altri dati (RNDT)', 'salvano', 'GetFeatureInfo']) {
    assert.ok(testo.includes(parola), `manca «${parola}»`);
  }
});

test('le immagini dei passi statici esistono (si rigenerano con scripts/guida_screenshot_rndt.py)', () => {
  for (const p of PASSI.filter(p => p.statico)) {
    assert.ok(existsSync(new URL(`../../${p.immagine.file}`, import.meta.url)), `manca ${p.immagine.file}`);
  }
});

import { schedaGuida, passiRndt } from '../../js/core/guida.js';

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
  assert.deepEqual(sezioni.map(s => s.id), SOLO_GUIDA.map(p => `guida-${p.id}`));
  const link = tutti(radice, 'a').map(a => a.href);
  assert.deepEqual(link, SOLO_GUIDA.map(p => `#guida-${p.id}`));
});

test('schedaGuida: ogni immagine è lazy, ha alt e didascalia', () => {
  const imgs = tutti(schedaGuida(doc), 'img');
  assert.equal(imgs.length, SOLO_GUIDA.length);
  imgs.forEach((img, i) => {
    assert.equal(img.loading, 'lazy');
    assert.equal(img.alt, SOLO_GUIDA[i].immagine.alt);
    assert.equal(img.src, SOLO_GUIDA[i].immagine.file);
  });
  assert.equal(tutti(schedaGuida(doc), 'figcaption').length, SOLO_GUIDA.length);
});

test('schedaGuida: i tre video sono pulsanti che aprono una finestra, non iframe incorporati', () => {
  const radice = schedaGuida(doc);
  assert.equal(tutti(radice, 'iframe').length, 0);
  const bottoni = tutti(radice, 'button');
  assert.equal(bottoni.length, 3);
  assert.ok(bottoni.every(b => b.attrs['aria-label'] && b.ev?.click));
  assert.equal(tutti(radice, 'video').length + tutti(radice, 'audio').length, 0);
});

test('schedaGuida: se un\'immagine non carica la sua figura sparisce (niente icona rotta)', () => {
  const radice = schedaGuida(doc);
  const fig = tutti(radice, 'figure')[0];
  let rimossa = false;
  fig.remove = () => { rimossa = true; };
  tutti(fig, 'img')[0].onerror();
  assert.ok(rimossa);
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

test('passiRndt: una sezione per passo RNDT, con id ancora e immagine', () => {
  const sezioni = passiRndt(doc);
  assert.deepEqual(sezioni.map(s => s.id), PASSI_RNDT.map(p => `guida-${p.id}`));
  assert.equal(sezioni.flatMap(s => tutti(s, 'img')).length, PASSI_RNDT.length);
});
