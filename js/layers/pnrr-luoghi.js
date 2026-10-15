// Modello puro dei luoghi PNRR sulla mappa: i progetti nello stesso punto (una scuola, un palazzo, una via) diventano un solo marker,
// con un anello a fette colorate (una per missione) e il numero dei progetti al centro, come le sedi degli uffici.
import { fette } from './uffici-fette.js';
import { coloreMissione, nomeSoggetto, titoloProgetto } from './scheda-pnrr.js';
import { righe } from '../core/scheda-util.js';
import { t, tn } from '../core/i18n.js';

export const chiaveLuogo = ([lon, lat]) => `${Number(lon).toFixed(5)},${Number(lat).toFixed(5)}`;

// Proprietà utili del GeoJSON dei progetti (una feature per CUP, già con la posizione).
export const progettiDa = features => features.filter(f => f.geometry?.type === 'Point').map(f => ({
  cup: f.properties.cup, missione: f.properties.missione ?? '?', attuatore: f.properties.attuatore ?? null, precisione: f.properties.precisione ?? null,
  titolo: f.properties.titolo ?? null, submisura_nome: f.properties.submisura_nome ?? null, indirizzo: f.properties.indirizzo ?? null, coordinates: f.geometry.coordinates,
}));

// filtri = { missioni: Set | null (tutte), conSede: boolean, attuatore: string | null (tutti) }
export function ammesso(p, { missioni = null, conSede = true, attuatore = null } = {}) {
  if (missioni && !missioni.has(p.missione)) return false;
  if (!conSede && p.precisione === 'sede') return false;
  return !attuatore || p.attuatore === attuatore;
}

// Un luogo per posizione, con i progetti ammessi dai filtri e le fette per missione (la più numerosa per prima).
export function raggruppa(progetti, filtri = {}) {
  const per = new Map();
  for (const p of progetti) {
    if (!ammesso(p, filtri)) continue;
    const id = chiaveLuogo(p.coordinates);
    const l = per.get(id) ?? { id, coordinates: p.coordinates, progetti: [] };
    l.progetti.push(p);
    per.set(id, l);
  }
  return [...per.values()].map(l => ({
    ...l, n: l.progetti.length,
    fette: fette(l.progetti.map(p => ({ area: p.missione, colore: coloreMissione(p.missione) }))),
  }));
}

// Chiave dell'icona: due luoghi con le stesse fette condividono la stessa immagine.
export const firma = lista => lista.map(f => `${f.area}${f.n}`).join('-');

// [{ voce, n }] dei soggetti attuatori dei progetti, dal più numeroso.
export function conteggiAttuatori(progetti) {
  const per = new Map();
  for (const p of progetti) if (p.attuatore) per.set(p.attuatore, (per.get(p.attuatore) ?? 0) + 1);
  return [...per].map(([voce, n]) => ({ voce, n })).sort((a, b) => b.n - a.n || a.voce.localeCompare(b.voce, 'it'));
}

const MAX_PROGETTI_TOOLTIP = 4;

// Come si chiama un progetto nell'elenco: il titolo, o la misura del PNRR quando il titolo è solo un codice («p3», «1.2c_g273…»).
export function nomeProgetto(p) {
  const titolo = titoloProgetto(p);
  return (p.titolo ?? '').length < 12 && p.submisura_nome ? `${p.submisura_nome} (${titolo})` : titolo;
}

const accorcia = (s, max) => (s.length > max ? `${s.slice(0, max).replace(/\s+\S*$/, '')}…` : s);

// Progetti del luogo per missione (come l'anello) e poi per titolo: serve all'elenco del popup.
export function elencoLuogo(luogo) {
  const ordine = new Map(luogo.fette.map((f, i) => [f.area, i]));
  return [...luogo.progetti].sort((a, b) => (ordine.get(a.missione) - ordine.get(b.missione)) || nomeProgetto(a).localeCompare(nomeProgetto(b), 'it'));
}

// Tooltip del marker: un progetto → il suo titolo; più progetti → il numero, l'indirizzo e i primi titoli (il resto sta nel popup al clic).
export function modelloTooltipLuogo(luogo) {
  if (luogo.n === 1) {
    const p = luogo.progetti[0];
    return { titolo: titoloProgetto(p), sottotitolo: p.missione, righe: righe([['Soggetto attuatore', nomeSoggetto(p.attuatore)], ['Indirizzo', p.indirizzo]]) };
  }
  const indirizzi = [...new Set(luogo.progetti.map(p => p.indirizzo).filter(Boolean))];
  const elenco = elencoLuogo(luogo);
  const voci = elenco.slice(0, MAX_PROGETTI_TOOLTIP).map(p => [p.missione, accorcia(nomeProgetto(p), 70)]);
  if (elenco.length > MAX_PROGETTI_TOOLTIP) voci.push(['…', t('pnrr.eAltri', { n: elenco.length - MAX_PROGETTI_TOOLTIP })]);
  return { titolo: tn('pnrr.luogo', luogo.n), sottotitolo: indirizzi.length === 1 ? indirizzi[0] : t('pnrr.luogoVari'), righe: righe(voci) };
}
