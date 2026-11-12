// Pin tondo dei pronto soccorso, come nell'app d'origine «palermo-ps»: anello esterno del colore dell'affollamento, ciambella divisa nei
// codici colore in proporzione ai pazienti in attesa, al centro il totale in attesa. Un'immagine per ogni combinazione, disegnata a richiesta.
import { COLORE_CODICE, COLORE_LIVELLO } from './scheda-pronto-soccorso.js';

const CODICI = Object.keys(COLORE_CODICE); // rosso, arancione, azzurro, verde, bianco: l'ordine dell'app d'origine
const COLORE_VUOTO = '#bdbab4';
export const LATO_PIN = 52; // punti a icon-size 1
export const PR_PIN = 2;
const PREFISSO = 'ps-pin';

const attesa = v => (v != null && Number.isFinite(Number(v)) ? Math.max(0, Number(v)) : null);

// Identificatore dell'immagine: `ps-pin|livello|totale|r,a,z,v,b` (totale vuoto se il dato manca).
export function idPin(p, liv) {
  const n = attesa(p.inAttesa);
  const parti = CODICI.map(c => attesa(p.codici?.[c]?.attesa) ?? 0);
  return `${PREFISSO}|${liv}|${n ?? ''}|${parti.join(',')}`;
}

export function leggiIdPin(id) {
  const [pre, livello, n, parti] = String(id).split('|');
  if (pre !== PREFISSO || !(livello in COLORE_LIVELLO)) return null;
  return { livello, totale: n === '' ? null : Number(n), parti: (parti ?? '').split(',').map(Number) };
}

// Spicchi della ciambella: [{ colore, da, a }] in radianti, dalle 12 in senso orario (come un conic-gradient); vuoto se nessuno è in attesa.
export function spicchi(parti) {
  const tot = parti.reduce((s, n) => s + n, 0);
  if (!(tot > 0)) return [];
  let acc = 0;
  return parti.flatMap((n, i) => {
    if (!(n > 0)) return [];
    const da = -Math.PI / 2 + (acc / tot) * 2 * Math.PI;
    acc += n;
    return [{ colore: COLORE_CODICE[CODICI[i]], da, a: -Math.PI / 2 + (acc / tot) * 2 * Math.PI }];
  });
}

export function disegnaPin(id) {
  const d = leggiIdPin(id);
  if (!d) return null;
  const c = document.createElement('canvas');
  c.width = c.height = LATO_PIN * PR_PIN;
  const g = c.getContext('2d');
  g.scale(PR_PIN, PR_PIN);
  const m = LATO_PIN / 2, anello = 4;
  const disco = (r, colore) => { g.beginPath(); g.arc(m, m, r, 0, 2 * Math.PI); g.fillStyle = colore; g.fill(); };
  g.shadowColor = 'rgba(11,42,63,.5)'; g.shadowBlur = 4; g.shadowOffsetY = 1;
  disco(m - 2, COLORE_LIVELLO[d.livello]); // anello del livello (con un po' di ombra)
  g.shadowColor = 'transparent';
  const r = m - 2 - anello;
  const sp = spicchi(d.parti);
  if (!sp.length) disco(r, COLORE_VUOTO);
  for (const s of sp) {
    g.beginPath(); g.moveTo(m, m); g.arc(m, m, r, s.da, s.a); g.closePath();
    g.fillStyle = s.colore; g.fill();
  }
  disco(15, '#fff');
  g.font = '900 16px Montserrat, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#0b2a3f';
  g.fillText(d.totale == null ? '–' : String(d.totale), m, m + 1);
  return g.getImageData(0, 0, c.width, c.height);
}

// Fa disegnare alla mappa i pin richiesti dai punti (`styleimagemissing`).
export function registraPin(map) {
  map.on('styleimagemissing', e => {
    if (!e.id.startsWith(`${PREFISSO}|`) || map.hasImage(e.id)) return;
    const img = disegnaPin(e.id);
    if (img) map.addImage(e.id, img, { pixelRatio: PR_PIN });
  });
}
