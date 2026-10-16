// Modello puro dei luoghi delle opere pubbliche sulla mappa: le opere nello stesso punto (una scuola, un palazzo, una via) diventano un solo
// marker, con un anello a fette colorate (una per settore) e il numero delle opere al centro, come i progetti PNRR e le sedi degli uffici.
import { fette } from './uffici-fette.js';
import { SETTORI, accorcia, coloreSettore, nomeSettore, nomeSoggetto, titoloOpera } from './scheda-opere.js';
import { righe } from '../core/scheda-util.js';
import { t, tl, tn } from '../core/i18n.js';

export const chiaveLuogo = ([lon, lat]) => `${Number(lon).toFixed(5)},${Number(lat).toFixed(5)}`;

// Proprietà utili del GeoJSON delle opere (una feature per CUP, già con la posizione).
export const opereDa = features => features.filter(f => f.geometry?.type === 'Point').map(f => ({
  cup: f.properties.cup, settore: f.properties.settore ?? null, titolare: f.properties.titolare ?? null, stato: f.properties.stato ?? null,
  fase: f.properties.fase ?? null, precisione: f.properties.precisione ?? null, titolo: f.properties.titolo ?? null,
  indirizzo: f.properties.indirizzo ?? null, coordinates: f.geometry.coordinates,
}));

// filtri = { settori: Set | null (tutti), chiuse: boolean, titolare: string | null (tutti) }
export function ammessa(p, { settori = null, chiuse = true, titolare = null } = {}) {
  if (settori && !settori.has(p.settore)) return false;
  if (!chiuse && p.stato === 'CHIUSO') return false;
  return !titolare || p.titolare === titolare;
}

// Un luogo per posizione, con le opere ammesse dai filtri e le fette per settore (il più numeroso per primo).
export function raggruppa(opere, filtri = {}) {
  const per = new Map();
  for (const p of opere) {
    if (!ammessa(p, filtri)) continue;
    const id = chiaveLuogo(p.coordinates);
    const l = per.get(id) ?? { id, coordinates: p.coordinates, opere: [] };
    l.opere.push(p);
    per.set(id, l);
  }
  return [...per.values()].map(l => ({
    ...l, n: l.opere.length,
    fette: fette(l.opere.map(p => ({ area: p.settore ?? '?', colore: coloreSettore(p.settore) }))),
  }));
}

// Chiave dell'icona: due luoghi con le stesse fette condividono la stessa immagine. Si usa l'indice del settore (i nomi cominciano quasi
// tutti con «INFRASTRUTTURE»: un nome troncato farebbe collidere settori diversi e darebbe loro lo stesso colore); `x` = settore fuori elenco.
const indiceSettore = area => { const i = SETTORI.findIndex(([c]) => c === area); return i < 0 ? 'x' : i; };
export const firma = lista => lista.map(f => `${indiceSettore(f.area)}_${f.n}`).join('-');

// [{ voce, n }] dei titolari delle opere, dal più numeroso.
export function conteggiTitolari(opere) {
  const per = new Map();
  for (const p of opere) if (p.titolare) per.set(p.titolare, (per.get(p.titolare) ?? 0) + 1);
  return [...per].map(([voce, n]) => ({ voce, n })).sort((a, b) => b.n - a.n || a.voce.localeCompare(b.voce, 'it'));
}

const MAX_OPERE_TOOLTIP = 4;

// Etichetta di un'opera nei menu: settore, titolo e, se non ha un punto sulla mappa, lo dice.
export const etichettaOpzione = p => `${nomeSettore(p.settore)} · ${accorcia(titoloOpera(p), 90)}${p.precisione ? '' : ` (${t('opere.senzaPosizione')})`}`;

// Opere del luogo per settore (come l'anello) e poi per titolo: serve all'elenco del popup.
export function elencoLuogo(luogo) {
  const ordine = new Map(luogo.fette.map((f, i) => [f.area, i]));
  return [...luogo.opere].sort((a, b) => (ordine.get(a.settore ?? '?') - ordine.get(b.settore ?? '?')) || titoloOpera(a).localeCompare(titoloOpera(b), 'it'));
}

// Tooltip del marker: un'opera → il suo titolo; più opere → il numero, l'indirizzo e i primi titoli (il resto sta nel popup al clic).
export function modelloTooltipLuogo(luogo) {
  if (luogo.n === 1) {
    const p = luogo.opere[0];
    return {
      titolo: accorcia(titoloOpera(p)), sottotitolo: tl(nomeSettore(p.settore)), pallino: coloreSettore(p.settore),
      righe: righe([['Titolare', nomeSoggetto(p.titolare)], ['Indirizzo', p.indirizzo]]), suggerimento: t('opere.cliccaInfo'),
    };
  }
  const indirizzi = [...new Set(luogo.opere.map(p => p.indirizzo).filter(Boolean))];
  const elenco = elencoLuogo(luogo);
  const voci = elenco.slice(0, MAX_OPERE_TOOLTIP).map(p => [p.settore, accorcia(titoloOpera(p), 70)]);
  const altre = elenco.length - MAX_OPERE_TOOLTIP;
  return {
    titolo: tn('opere.luogo', luogo.n), sottotitolo: indirizzi.length === 1 ? indirizzi[0] : t('opere.luogoVari'),
    righe: righe([...voci.map(([settore, testo]) => [nomeSettore(settore), testo]), ...(altre > 0 ? [['…', t('opere.eAltre', { n: altre })]] : [])]),
    suggerimento: t('opere.cliccaInfo'),
    // il tooltip della mappa disegna `elenco`: un pallino con il colore del settore davanti a ogni opera
    elenco: [...voci.map(([settore, testo]) => ({ testo: `${tl(nomeSettore(settore))} · ${testo}`, pallino: coloreSettore(settore) })), ...(altre > 0 ? [t('opere.eAltre', { n: altre })] : [])],
  };
}
