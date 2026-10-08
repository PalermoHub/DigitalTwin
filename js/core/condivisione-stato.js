// Legge lo stato visibile dell'app (DOM e mappa) e lo riapplica simulando i gesti dell'utente:
// così ogni modulo reagisce come se l'utente avesse cliccato, senza che i moduli sappiano della condivisione.
import { CHIAVI_STORAGE } from './condivisione-codec.js';
import { condivisibili } from './condivisione-esterni.js';
import { t as tr } from './i18n.js';

// layer aggiunti dall'utente: la loro casella nasce solo quando l'archivio viene ripristinato
export const ESTERNO = /^(rndt|miei|srv)-/;

const ZONE = [['circ', 'f-circ'], ['quart', 'f-quart'], ['upl', 'f-upl']];
const evento = (el, tipo) => el.dispatchEvent(new Event(tipo, { bubbles: true }));
const valore = (doc, id) => doc.getElementById(id)?.value ?? '';

function leggiStorage(storage) {
  const s = {};
  let scartati = 0;
  for (const chiave of CHIAVI_STORAGE) {
    let grezzo = null;
    try { grezzo = JSON.parse(storage?.getItem(chiave)); } catch { /* valore illeggibile: non si condivide */ }
    if (!grezzo || typeof grezzo !== 'object') continue;
    const r = condivisibili(chiave, grezzo);
    scartati += r.scartati;
    if (r.valore && Object.keys(r.valore).length) s[chiave] = r.valore;
  }
  return { s, scartati };
}

export function raccogli(doc, map, storage) {
  const c = map.getCenter();
  const stato = {
    c: [+c.lng.toFixed(5), +c.lat.toFixed(5), +map.getZoom().toFixed(2), Math.round(map.getBearing()), Math.round(map.getPitch())],
    a: [...doc.querySelectorAll('input[id^="strato-"]')].filter(x => x.checked).map(x => x.id.slice(7)),
    t: doc.documentElement.dataset.tema === 'scuro' ? 1 : 0,
  };
  const o = {};
  for (const r of doc.querySelectorAll('input[data-opacita]')) if (Number(r.value) < 1) o[r.dataset.opacita] = Number(r.value);
  if (Object.keys(o).length) stato.o = o;
  const base = doc.querySelector('input[name="base"]:checked');
  if (base) stato.b = base.id.slice(5);
  const z = Object.fromEntries(ZONE.filter(([, id]) => valore(doc, id)).map(([k, id]) => [k, valore(doc, id)]));
  if (Object.keys(z).length) stato.z = z;
  if (valore(doc, 'f-linea')) stato.l = valore(doc, 'f-linea');
  const i = {};
  if (valore(doc, 'sicurezza-anno')) i.anno = valore(doc, 'sicurezza-anno');
  if (valore(doc, 'sicurezza-gravita')) i.gravita = valore(doc, 'sicurezza-gravita');
  if (Object.keys(i).length) stato.i = i;
  const { s, scartati } = leggiStorage(storage);
  if (Object.keys(s).length) stato.s = s;
  return { stato, scartati };
}

function impostaSelect(doc, id, v) {
  const sel = doc.getElementById(id);
  if (!sel || ![...sel.options].some(o => o.value === v)) return false;
  sel.value = v;
  evento(sel, 'change');
  return true;
}

// Restituisce le cose che non si sono potute applicare (strati o sfondi sconosciuti), per un unico avviso.
export function applica(stato, doc, map) {
  const ignorati = [];
  if (stato.b) {
    const r = doc.getElementById(`base-${stato.b}`);
    if (r?.name === 'base') { r.checked = true; evento(r, 'change'); } else ignorati.push(`sfondo ${stato.b}`);
  }
  // i filtri vanno prima degli strati: accendono da soli gli strati che filtrano, e lo stato degli strati ha l'ultima parola
  const zona = [...ZONE].reverse().find(([k]) => stato.z?.[k]);
  if (zona && !impostaSelect(doc, zona[1], stato.z[zona[0]])) ignorati.push(`zona ${stato.z[zona[0]]}`);
  if (stato.l && !impostaSelect(doc, 'f-linea', stato.l)) ignorati.push(`linea ${stato.l}`);
  if (stato.i?.anno) impostaSelect(doc, 'sicurezza-anno', stato.i.anno);
  if (stato.i?.gravita) impostaSelect(doc, 'sicurezza-gravita', stato.i.gravita);
  if (stato.a) {
    const accesi = new Set(stato.a);
    for (const id of accesi) if (!doc.getElementById(`strato-${id}`) && !ESTERNO.test(id)) ignorati.push(tr('condividi.ignorato.strato', { id }));
    for (const x of doc.querySelectorAll('input[id^="strato-"]')) {
      const voluto = accesi.has(x.id.slice(7));
      if (x.checked !== voluto && !x.disabled) { x.checked = voluto; evento(x, 'change'); }
    }
  }
  for (const [id, v] of Object.entries(stato.o ?? {})) {
    const r = doc.querySelector(`input[data-opacita="${CSS.escape(id)}"]`);
    if (r) { r.value = String(v); evento(r, 'input'); }
  }
  if (stato.t === 0 || stato.t === 1) {
    if ((stato.t === 1) !== (doc.documentElement.dataset.tema === 'scuro')) doc.getElementById('btn-tema')?.click();
  }
  // per ultima la vista: filtri e strati 3D possono aver spostato la camera
  if (stato.c) {
    const [lng, lat, zoom, bearing, pitch] = stato.c;
    map.jumpTo({ center: [lng, lat], zoom, bearing, pitch });
  }
  return ignorati;
}
