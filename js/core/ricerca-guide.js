import { normalizza } from './indirizzi.js';
import { t as tr, tl } from './i18n.js';
import { PASSI, PASSI_RNDT } from './guida-contenuti.js';
import { SEZIONI } from '../geoimage/guida-contenuti.js';

// Ricerca negli argomenti delle tre guide (Guida, Guida Geoimage, Plugin RNDT), nella barra di ricerca della mappa.
// Il titolo pesa di più; le parole dei paragrafi aiutano solo se lunghe abbastanza da essere parole chiave.
const MAX = 3;
const MIN_PAROLA = 3;
const MIN_PAROLA_TESTO = 4; // nei paragrafi le parole corte («via», «con») farebbero rumore
const PAROLE_VUOTE = new Set(['VIA', 'VIE', 'COME', 'COSA', 'DOVE', 'QUANDO', 'PERCHE', 'CHE', 'CON', 'PER', 'DELLA', 'DELLE', 'DELLO', 'DEGLI', 'DEI', 'UNA', 'UNO', 'THE', 'AND', 'FOR', 'HOW', 'WITH', 'WHAT']); // i18n-ok: parole vuote della ricerca

// Voci indicizzabili: dove si apre (scheda e id della sezione) e i testi da cui cercare, in italiano.
export function vociGuide(passi = PASSI, passiRndt = PASSI_RNDT, sezioni = SEZIONI) {
  const voci = [];
  const passo = (scheda, p) => voci.push({ scheda, sezione: `guida-${p.id}`, titolo: p.titolo, testi: [...(p.paragrafi ?? []), p.evidenza].filter(Boolean) });
  passi.forEach(p => passo('guida', p));
  passiRndt.forEach(p => passo('plugin', p));
  for (const s of sezioni) {
    const testi = [...(s.paragrafi ?? []), ...(s.elenco ?? []).map(String)];
    for (const p of s.passi ?? []) testi.push(p.titolo, p.testo, ...(p.elenco ?? []).map(String));
    voci.push({ scheda: 'geoimage', sezione: `guida-geoimage-${s.id}`, titolo: s.titolo, testi });
  }
  return voci;
}

const NOME_SCHEDA = { guida: 'Guida', geoimage: 'Guida Geoimage', plugin: 'Plugin RNDT' };
const contiene = (testo, parola) => ` ${testo} `.includes(` ${parola}`) || testo.includes(parola);

// Voci che rispondono a `testo`, le migliori per prime. `lt` traduce i testi nella lingua della pagina.
export function cercaGuide(voci, testo, lt = tl) {
  const parole = normalizza(testo ?? '').split(' ').filter(p => p.length >= MIN_PAROLA && !PAROLE_VUOTE.has(p));
  if (!parole.length) return [];
  const trovate = [];
  for (const v of voci) {
    const titolo = normalizza(`${lt(v.titolo)} ${v.titolo}`); // si cerca nella lingua della pagina e in italiano
    const nelTitolo = parole.filter(p => contiene(titolo, p)).length;
    let punti = 0;
    if (nelTitolo === parole.length) punti = 100 + (titolo.startsWith(parole[0]) ? 20 : 0);
    else {
      const corpo = normalizza(`${titolo} ${v.testi.map(lt).join(' ')} ${v.testi.join(' ')}`);
      if (!parole.every(p => contiene(corpo, p) && (p.length >= MIN_PAROLA_TESTO || contiene(titolo, p)))) continue;
      punti = 10 + nelTitolo * 20;
    }
    trovate.push({ v, punti });
  }
  return trovate.sort((a, b) => b.punti - a.punti).slice(0, MAX).map(({ v }) => v);
}

// `apri(scheda, idSezione)`: apre la pagina e porta alla sezione. `altra` = ricerca già collegata: i risultati si sommano (in coda).
export function collegaRicercaGuide(apri, altra = null, voci = vociGuide()) {
  return {
    async suggerisci(testo) {
      const base = altra ? await altra.suggerisci(testo) : { inCima: [], inCoda: [] };
      const guide = cercaGuide(voci, testo).map(v => ({
        etichetta: tl(v.titolo),
        nota: tr('ricerca.guidaNota', { guida: tl(NOME_SCHEDA[v.scheda]) }),
        vai: () => apri(v.scheda, v.sezione),
      }));
      return { inCima: base.inCima, inCoda: [...base.inCoda, ...guide] };
    },
  };
}
