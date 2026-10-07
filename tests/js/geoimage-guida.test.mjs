import test from 'node:test';
import assert from 'node:assert/strict';
import { SEZIONI } from '../../js/geoimage/guida-contenuti.js';
import { schedaGeoimage } from '../../js/geoimage/guida.js';

test('le sezioni hanno id univoci e validi come ancora', () => {
  const ids = SEZIONI.map(s => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^[a-z0-9-]+$/);
});

test('ogni sezione ha titolo e almeno un contenuto, senza testi vuoti', () => {
  for (const s of SEZIONI) {
    assert.ok(s.titolo.trim(), `${s.id}: titolo`);
    assert.ok(s.paragrafi?.length || s.passi?.length || s.elenco?.length, `${s.id}: contenuto`);
    const testi = [...(s.paragrafi ?? []), ...(s.elenco ?? []), ...(s.passi ?? []).flatMap(p => [p.titolo, p.testo, ...(p.elenco ?? [])])];
    assert.ok(testi.every(t => t.trim().length > 3), `${s.id}: testi vuoti`);
  }
});

test('la guida copre le funzioni di Geoimage: GCP, allinea, RMSE, export, swipe, spotlight', () => {
  const tutto = JSON.stringify(SEZIONI);
  for (const parola of ['GCP', 'Allinea', 'RMSE', 'KMZ', 'GeoTIFF', 'World file', 'Swipe', 'Spotlight', 'MapWarper', 'Ctrl+Z']) assert.ok(tutto.includes(parola), parola);
});

// un document finto che conta i nodi
function docFinto() {
  const nodi = [];
  return {
    nodi,
    createElement(tag) {
      const e = { tag, figli: [], testo: '', append(...c) { this.figli.push(...c); }, insertBefore(n, rif) { this.figli.splice(this.figli.indexOf(rif), 0, n); }, setAttribute() {}, addEventListener() {}, set textContent(t) { this.testo = t; }, get textContent() { return this.testo; } };
      nodi.push(e);
      return e;
    },
  };
}

test('schedaGeoimage costruisce un titolo, una sezione per voce e un elenco per ogni passo con punti', () => {
  const doc = docFinto();
  const radice = schedaGeoimage(doc, SEZIONI);
  assert.equal(radice.figli[0].testo, 'Guida Geoimage');
  assert.equal(radice.figli.filter(n => n.tag === 'section').length, SEZIONI.length);
  assert.ok(doc.nodi.filter(n => n.tag === 'ol').length >= 3, 'i passi sono liste numerate');
});

test('gli screenshot dei passi hanno file, testo alternativo e didascalia; la scheda li mostra come figure', async () => {
  const { existsSync } = await import('node:fs');
  const conImmagine = [...SEZIONI, ...SEZIONI.flatMap(s => s.passi ?? [])].filter(x => x.immagine);
  assert.ok(conImmagine.length >= 6);
  for (const { immagine: i } of conImmagine) {
    assert.match(i.file, /^img\/guida\/passi\/geoimage-[a-z]+\.webp$/);
    assert.ok(i.alt.trim() && i.didascalia.trim());
    assert.ok(existsSync(new URL(`../../${i.file}`, import.meta.url)), `manca ${i.file}`);
  }
  const doc = docFinto();
  schedaGeoimage(doc);
  assert.equal(doc.nodi.filter(n => n.tag === 'figure').length, conImmagine.length);
});
