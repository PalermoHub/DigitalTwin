// Ricerca per via e civico su un indice {VIA: {civico: [lon, lat]}}. Logica pura.
// I civici possono avere la lettera ("4A": 21% dell'indice reale) e alcune vie finiscono con un numero.
import { t as tr } from './i18n.js';

export function normalizza(s) {
  return s
    .toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9' ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function preparaIndice(indice) {
  return Object.entries(indice).map(([via, civici]) => ({ via, norm: normalizza(via), civici }));
}

// Indice leggero {VIA: [lon, lat]}: ogni via col suo primo punto; i civici (`civici`) arrivano dopo, solo per le vie cercate con un numero.
export function preparaIndiceVie(vie) {
  return Object.entries(vie).map(([via, primo]) => ({ via, norm: normalizza(via), primo, civici: null }));
}

const primoPunto = v => (v.civici ? Object.values(v.civici)[0] : v.primo);

// vie che contengono tutte le parole, prima quelle che iniziano con il testo
function vieCorrispondenti(voci, testoVia) {
  const token = testoVia.split(' ').filter(Boolean);
  if (!token.length) return [];
  return voci
    .filter(v => token.every(t => v.norm.includes(t)))
    .sort((a, b) =>
      (b.norm.startsWith(testoVia) - a.norm.startsWith(testoVia)) || (a.norm.length - b.norm.length));
}

const punto = (via, chiave) => ({ etichetta: `${via.via} ${chiave}`, lon: via.civici[chiave][0], lat: via.civici[chiave][1] });

function soloVia(voci, testoVia, max) {
  return vieCorrispondenti(voci, testoVia).slice(0, max).map(v => {
    const [lon, lat] = primoPunto(v);
    return { etichetta: v.via, lon, lat };
  });
}

function conCivico(voci, testoVia, numero, lettera, max) {
  const chiave = `${numero}${lettera}`;
  const risultati = [];
  for (const v of vieCorrispondenti(voci, testoVia)) {
    if (v.civici[chiave]) {
      risultati.push(punto(v, chiave));
      continue;
    }
    if (!lettera) {
      // «4» quando esistono solo 4A, 4B…: le propone
      const varianti = Object.keys(v.civici).filter(k => /^\d+/.exec(k)[0] === numero);
      if (varianti.length) {
        risultati.push(...varianti.map(k => punto(v, k)));
        continue;
      }
    }
    const [lon, lat] = primoPunto(v);
    risultati.push({ etichetta: v.via, lon, lat, nota: tr('indirizzi.civicoNonTrovato', { chiave }) });
  }
  return risultati.slice(0, max);
}

// Le vie di cui `cerca` ha bisogno dei civici: quelle del testo «via + numero». Vuoto se basta il solo nome della via.
export function vieConCivico(voci, testo) {
  const norm = normalizza(testo);
  if (!norm || /^\d+$/.test(norm)) return [];
  const m = norm.match(/^(.*?)\s+(\d+)\s?([A-Z])?$/);
  return m && m[1] ? vieCorrispondenti(voci, m[1]) : [];
}

const TOPONIMI = 'VIA|VIALE|PIAZZA|PIAZZALE|CORSO|LARGO|VICOLO|SALITA|STRADA|LUNGOMARE|CORTILE'; // i18n-ok: toponimi delle vie
// dal toponimo al civico (con lettera solo se attaccata: «12A», «12/A»), o fino alla fine se il civico manca
const CON_CIVICO = new RegExp(`\\b(?:${TOPONIMI})\\s.*?\\d+(?:\\s?\\/\\s?[A-Za-z]|[A-Za-z])?(?![\\w\\u00C0-\\u00FF])`, 'i');
const SENZA_CIVICO = new RegExp(`\\b(?:${TOPONIMI})\\s.*$`, 'i');

// L'indirizzo dentro una frase («dimmi cosa c'è in via Dante 50» → «VIA DANTE 50»), o null se il testo non ne ha l'aspetto:
// serve il toponimo, oppure il testo intero è «nome + civico».
const PREPOSIZIONI = /\s(?:IN|A|SU|PRESSO|VICINO A|INTORNO A|ATTORNO A|NEI PRESSI DI)\s(.+\s\d+\s?[A-Z]?)$/;

export function estraiIndirizzo(testo) {
  const norm = normalizza(testo);
  if (!norm || /^\d+$/.test(norm)) return null;
  const m = testo.match(CON_CIVICO) ?? testo.match(SENZA_CIVICO);
  if (m) return normalizza(m[0]);
  if (!/^.+\s\d+\s?[A-Z]?$/.test(norm)) return null;
  // senza toponimo: «cosa c'è a dante 50», «che c'è vicino a dante 50» → il nome comincia dopo la preposizione
  const dopo = norm.match(PREPOSIZIONI);
  return dopo ? dopo[1] : norm;
}

export const sembraIndirizzo = testo => estraiIndirizzo(testo) !== null;

export function cerca(voci, testo, max = 8) {
  const norm = normalizza(testo);
  if (!norm || /^\d+$/.test(norm)) return [];
  // civico in coda: «4», «4A», «4/A» (normalizzato in «4 A»); il resto è il nome della via
  const m = norm.match(/^(.*?)\s+(\d+)\s?([A-Z])?$/);
  if (m && m[1]) {
    const risultati = conCivico(voci, m[1], m[2], m[3] ?? '', max);
    if (risultati.length) return risultati;
  }
  // altrimenti il testo intero può essere il nome di una via che finisce con un numero («LARGO V 21»)
  return soloVia(voci, norm, max);
}
