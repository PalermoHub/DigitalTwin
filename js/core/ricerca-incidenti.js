import { normalizza } from './indirizzi.js';
import { t as tr, tn } from './i18n.js';

// Ricerca degli incidenti nella barra: una riga per via (sempre) e una riga per incidente (solo con «incidente»/«sinistro»).
// Logica pura: i dati arrivano da vie.json e incidenti.geojson (scripts/sicurezza_stradale.py).
const PAROLE_INCIDENTE = new Set(['INCIDENTE', 'INCIDENTI', 'SINISTRO', 'SINISTRI']);
const GRAVITA_PAROLE = {
  MORTALE: 'M', MORTALI: 'M', RISERVATA: 'R', RISERVATO: 'R', FERITO: 'F', FERITI: 'F', FERITE: 'F', COSE: 'C', DANNI: 'C', DANNO: 'C',
};
const ORDINE_GRAVITA = { M: 0, R: 1, F: 2, C: 3 };
const NOME_GRAVITA = { M: tr('incidenti.gravita.M'), R: tr('incidenti.gravita.R'), F: tr('incidenti.gravita.F'), C: tr('incidenti.gravita.C') };

// «incidente mortale roma 2018» → { gravita: 'M', anno: 2018, token: ['ROMA'] }; null se manca la parola «incidente»/«sinistro»
export function leggiQuery(testo) {
  const parole = normalizza(testo).split(' ').filter(Boolean);
  if (!parole.some(p => PAROLE_INCIDENTE.has(p))) return null;
  let gravita = null;
  let anno = null;
  const token = [];
  for (const p of parole) {
    if (PAROLE_INCIDENTE.has(p)) continue;
    if (GRAVITA_PAROLE[p]) gravita = GRAVITA_PAROLE[p];
    else if (/^20\d\d$/.test(p)) anno = Number(p);
    else token.push(p);
  }
  return { gravita, anno, token };
}


// Fino a `max` vie con incidenti che contengono tutte le parole: prima quelle che iniziano con il testo, poi le più colpite.
export function cercaVie(vie, testo, max = 2) {
  const q = normalizza(testo);
  const token = q.split(' ').filter(Boolean);
  if (q.length < 3) return [];
  return vie
    .filter(v => v.incidenti > 0)
    .map(v => ({ v, norm: normalizza(v.nome) }))
    .filter(({ norm }) => token.every(t => norm.includes(t)))
    .sort((a, b) => (b.norm.startsWith(q) - a.norm.startsWith(q)) || b.v.incidenti - a.v.incidenti)
    .slice(0, max)
    .map(({ v }) => ({
      etichetta: v.nome,
      nota: [tn('ricerca.incidenti.n', v.incidenti), v.mortali ? tn('ricerca.incidenti.mortali', v.mortali) : null].filter(Boolean).join(', ')
        + (v.rango ? tr('ricerca.incidenti.rango', { rango: v.rango }) : ''),
      via: v.nome, lon: v.lon, lat: v.lat, bbox: v.bbox,
    }));
}

export function preparaIncidenti(features) {
  return features.filter(f => f.geometry?.coordinates).map(f => {
    const p = f.properties;
    return { etichetta: p.Luogo ?? '', norm: normalizza(p.Luogo ?? ''), anno: p.anno, tip: p.Tipologia, lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] };
  });
}

// Gravità, poi anno più recente. Servono almeno una parola, una gravità o un anno: «incidenti» da solo non elenca tutto.
export function cercaIncidenti(voci, query, max = 6) {
  if (!query || !(query.gravita || query.anno || query.token.length)) return [];
  return voci
    .filter(v => (!query.gravita || v.tip === query.gravita) && (!query.anno || v.anno === query.anno) && query.token.every(t => v.norm.includes(t)))
    .sort((a, b) => (ORDINE_GRAVITA[a.tip] ?? 9) - (ORDINE_GRAVITA[b.tip] ?? 9) || b.anno - a.anno)
    .slice(0, max)
    .map(v => ({ etichetta: v.etichetta, nota: tr('ricerca.incidente', { gravita: NOME_GRAVITA[v.tip] ?? '', anno: v.anno }).replace(/\s+/g, ' '), strato: 'sicurezza-incidenti', zoom: 18, lon: v.lon, lat: v.lat, prefisso: true }));
}
