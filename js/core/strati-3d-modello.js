// Modello della vista «Strati in 3D»: quali piani mostrare e come un punto di un piano torna un punto della mappa.
// Niente DOM né MapLibre qui: le funzioni lavorano su elenchi e numeri (vedi tests/js/strati-3d.test.mjs).

// Piani massimi: oltre, si tengono quelli più in alto nell'ordine di disegno (la base resta sempre).
export const MAX_PIANI = { desktop: 14, telefono: 8 };

const visibile = l => (l.layout?.visibility ?? 'visible') !== 'none';

// Un piano per strato acceso del pannello, nell'ordine di disegno della mappa (il primo sta sotto), più:
// - la base cartografica, sotto a tutto, se ha qualche layer visibile;
// - «altri», i layer visibili che nessuno strato dei moduli possiede (RNDT, I miei layer, mappe aggiunte),
//   esclusi quelli che leggono una sorgente dei moduli (sono i layer di servizio: clic, evidenze).
// stile: map.getStyle().layers · strati: [{ id, etichetta, layers }] · acceso(id) · eBase(idLayer)
export function gruppiStrati(stile, strati, acceso, eBase) {
  const posizione = new Map(stile.map((l, i) => [l.id, i]));
  const perId = new Map(stile.map(l => [l.id, l]));
  const vivi = ids => ids.filter(id => perId.has(id) && visibile(perId.get(id)));
  const gruppi = [];
  const base = stile.filter(l => eBase(l.id) && visibile(l)).map(l => l.id);
  if (base.length) gruppi.push({ id: 'base', base: true, layers: base });
  const posseduti = new Set();
  const sorgentiModuli = new Set();
  for (const s of strati) {
    for (const id of s.layers) { posseduti.add(id); const src = perId.get(id)?.source; if (src) sorgentiModuli.add(src); }
    if (!acceso(s.id)) continue;
    const layers = vivi(s.layers);
    if (layers.length) gruppi.push({ id: s.id, etichetta: s.etichetta, layers });
  }
  const altri = stile.filter(l => visibile(l) && !eBase(l.id) && !posseduti.has(l.id) && l.type !== 'background'
    && !(l.source && sorgentiModuli.has(l.source))).map(l => l.id);
  if (altri.length) gruppi.push({ id: 'altri', altri: true, layers: altri });
  const quota = g => (g.base ? -1 : Math.min(...g.layers.map(id => posizione.get(id))));
  return gruppi.sort((a, b) => quota(a) - quota(b));
}

// Rilievo 3D ed elevazione diventano un solo piano «terreno», in fondo alla pila: l'elevazione colorata va drappeggiata
// sul rilievo (strati-3d-terreno.js), da sola su un piano piatto perderebbe le altezze.
export const STRATI_TERRENO = ['rilievo3d', 'elevazione'];
export function unisciTerreno(gruppi, ids = STRATI_TERRENO) {
  const suoi = gruppi.filter(g => ids.includes(g.id));
  if (!suoi.length) return gruppi;
  const terreno = { id: 'terreno', terreno: true, strati: suoi.map(g => g.id), layers: suoi.flatMap(g => g.layers) };
  return [terreno, ...gruppi.filter(g => !ids.includes(g.id))];
}

// Tiene base e terreno e gli ultimi piani (quelli più in alto) fino a `max`: ritorna anche quanti ne restano fuori.
export function limitaPiani(gruppi, max) {
  if (gruppi.length <= max) return { piani: gruppi, fuori: 0 };
  const fisso = g => g.base || g.terreno;
  const base = gruppi.filter(fisso);
  const resto = gruppi.filter(g => !fisso(g));
  const tenuti = resto.slice(resto.length - (max - base.length));
  return { piani: [...base, ...tenuti], fuori: resto.length - tenuti.length };
}

// Dalla posizione su un piano (u, v in 0..1, origine in alto a sinistra) alle coordinate Mercator della mappa:
// a beccheggio zero la vista è un'affinità, quindi basta interpolare i quattro angoli catturati [no, ne, se, so].
export function puntoDaPiano(angoli, u, v) {
  const [no, ne, se, so] = angoli;
  const lerp = (a, b, k) => a + (b - a) * k;
  const su = [lerp(no[0], ne[0], u), lerp(no[1], ne[1], u)];
  const giu = [lerp(so[0], se[0], u), lerp(so[1], se[1], u)];
  return [lerp(su[0], giu[0], v), lerp(su[1], giu[1], v)];
}

// Quote dei piani esplosi: passo uguale, proporzionale al lato della cattura.
export const quote = (n, lato) => Array.from({ length: n }, (_, i) => i * lato * 0.075);

// Un'etichetta per una feature qualsiasi, dalle sue proprietà (per gli strati senza un modello di tooltip):
// il catasto come foglio e particella, altrimenti il campo più parlante tra quelli noti e, se c'è, un secondo campo
// come dettaglio; in mancanza, il primo testo o il primo numero che non sia un identificativo.
const CHIAVI = ['nome', 'name', 'denominazione', 'denominaz', 'titolo', 'title', 'route_long_name', 'route_short_name', 'linea',
  'zto', 'zona', 'descrizion', 'descrizione', 'descrizone', 'tipo', 'categoria', 'indirizzo', 'quartiere', 'circoscriz', 'circoscrizione', 'sezione', 'classe'];
const IDENTIFICATIVO = /^(fid|id|id1|ogc_fid|objectid|gid|cod_istat|cod_cat)$/i;
export function etichettaFeature(p) {
  if (!p) return null;
  const chiavi = Object.keys(p);
  const trova = n => chiavi.find(k => k.toLowerCase() === n);
  const vale = k => k != null && p[k] != null && typeof p[k] !== 'object' && String(p[k]).trim() !== '';
  const foglio = trova('foglio'), particella = trova('paricella') ?? trova('particella');
  if (vale(foglio) && vale(particella)) return { foglio: String(p[foglio]), particella: String(p[particella]) };
  const trovate = CHIAVI.map(trova).filter(vale);
  if (trovate.length) {
    const titolo = String(p[trovate[0]]);
    const sotto = trovate.slice(1).map(k => String(p[k])).find(v => v !== titolo && v.length <= 80) ?? '';
    return { titolo, sotto };
  }
  const testo = chiavi.find(k => !IDENTIFICATIVO.test(k) && typeof p[k] === 'string' && p[k].trim());
  if (testo) return { titolo: p[testo], sotto: '' };
  const numero = chiavi.find(k => !IDENTIFICATIVO.test(k) && typeof p[k] === 'number');
  return numero ? { titolo: `${numero}: ${p[numero].toLocaleString()}`, sotto: '' } : null;
}

// Strati disegnati come immagini (PRG e vincoli) o con dati altrove: per il tooltip si interrogano i layer invisibili
// che l'app usa per la scheda. Le chiavi sono gli id degli strati del pannello.
export const LAYER_DA_INTERROGARE = {
  prg: ['prg-zto-hit', 'prg-ns-hit', 'prg-cs-hit'],
  vincoli: ['prg-va-hit', 'prg-vl-hit'],
  catasto: ['catasto-hit'],
  omi: ['omi-hit'],
  immobili: ['immobili-hit'],
  edificato: ['edifici-hit'],
  edifici3d: ['edifici-hit'],
  coropletico: ['pop-hit'],
  rilievo3d: ['griglia-hit'],
  elevazione: ['griglia-hit'],
};
// i layer da interrogare per un piano della pila (il terreno riunisce più strati)
export const layerDaInterrogare = g => [...new Set([...g.layers, ...(g.strati ?? [g.id]).flatMap(id => LAYER_DA_INTERROGARE[id] ?? [])])];
