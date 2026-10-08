import { urlDati, CENTRO } from '../core/config.js';
import { normalizza } from '../core/indirizzi.js';
import { t as tr } from '../core/i18n.js';

// Ricerca di incendi e vincoli PAI nella barra. I due dati sono PMTiles senza elenco: la ricerca usa i manifest
// (incedi/anni.json, pai/pai.json) per anni, temi e classi, e i tile già caricati per località degli incendi.
const PAROLE_INCENDIO = new Set(['INCENDIO', 'INCENDI', 'FUOCO', 'ROGO', 'ROGHI']); // i18n-ok: vocabolario di ricerca (parole digitate)
const MAX = 4;
// parole d'uso comune → termine dei titoli PAI (normalizzato, maiuscolo)
const SINONIMI_PAI = { FRANA: 'GEOMORFOLOG', FRANE: 'GEOMORFOLOG', DISSESTO: 'DISSEST', ALLUVIONE: 'IDRAULIC', ALLUVIONI: 'IDRAULIC',
  ESONDAZIONE: 'ESONDAZION', ALLAGAMENTO: 'IDRAULIC', FIUME: 'IDRAULIC', EROSIONE: 'COST', COSTA: 'COST', COSTE: 'COST' };

function caricaUna(file) {
  let promessa = null;
  return () => (promessa ??= fetch(urlDati(file)).then(r => {
    if (!r.ok) throw new Error(file);
    return r.json();
  }).catch(() => { promessa = null; return null; })); // dato assente: la ricerca lo salta senza errori
}

function accendi(id) {
  const casella = document.getElementById(`strato-${id}`);
  if (casella && !casella.checked && !casella.disabled) { casella.checked = true; casella.dispatchEvent(new Event('change')); }
}

function centro(geom) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const giro = c => {
    if (typeof c[0] === 'number') { x0 = Math.min(x0, c[0]); x1 = Math.max(x1, c[0]); y0 = Math.min(y0, c[1]); y1 = Math.max(y1, c[1]); } else c.forEach(giro);
  };
  giro(geom.coordinates);
  return Number.isFinite(x0) ? { lon: (x0 + x1) / 2, lat: (y0 + y1) / 2 } : null;
}

// `altra` = ricerca già collegata (incidenti): i risultati si sommano.
export function collegaRicercaTerritorio(map, altra = null) {
  const anni = caricaUna('incedi/anni.json');
  const pai = caricaUna('pai/pai.json');

  function filtraAnno(anno) {
    const f = anno ? ['==', ['get', 'anno'], anno] : null;
    for (const id of ['incendi-fill', 'incendi-bordo']) if (map.getLayer(id)) map.setFilter(id, f);
  }

  async function incendi(parole) {
    const altri = parole.filter(p => !PAROLE_INCENDIO.has(p));
    const anno = altri.find(p => /^20\d\d$/.test(p));
    const token = altri.filter(p => p !== anno);
    if (!token.length) {
      const dati = await anni();
      const lista = (dati?.anni ?? []).filter(a => a.n > 0).sort((a, b) => b.anno - a.anno);
      if (!lista.length) return [];
      const vai = (an) => () => { accendi('incendi'); filtraAnno(an); map.flyTo({ center: CENTRO, zoom: 12 }); };
      if (anno) return lista.filter(a => String(a.anno) === anno).map(a => ({ etichetta: `Incendi ${a.anno}`, nota: `${a.n} aree percorse dal fuoco`, vai: vai(a.anno), prefisso: true }));
      const tot = lista.reduce((s, a) => s + a.n, 0);
      return [{ etichetta: tr('ricerca.incendiTutti'), nota: tr('ricerca.incendiNota', { n: tot, anno: lista[lista.length - 1].anno }), vai: vai(null), prefisso: true },
        ...lista.slice(0, 3).map(a => ({ etichetta: `Incendi ${a.anno}`, nota: `${a.n} aree percorse dal fuoco`, vai: vai(a.anno), prefisso: true }))];
    }
    // per località o luogo di inizio, tra i tile già caricati (area visibile, zoom 12 o più)
    if (!map.getSource('incendi')) return [];
    const viste = new Set();
    const trovati = [];
    for (const f of map.querySourceFeatures('incendi', { sourceLayer: 'incendi' })) {
      const p = f.properties;
      const k = `${p.anno}-${p.id}`;
      if (viste.has(k) || (anno && String(p.anno) !== anno)) continue;
      const nome = normalizza(`${p.localita ?? ''} ${p.luogo_inizio ?? ''}`);
      if (!token.every(t => nome.includes(t))) continue;
      viste.add(k);
      const c = centro(f.geometry);
      if (c) trovati.push({ p, ...c });
    }
    return trovati.sort((a, b) => b.p.anno - a.p.anno).slice(0, MAX).map(({ p, lon, lat }) => ({
      etichetta: p.localita || p.luogo_inizio || `Incendio ${p.anno}`,
      nota: `Incendio ${p.anno}${p.tipo_evento ? `, ${p.tipo_evento}` : ''}`, strato: 'incendi', zoom: 16, lon, lat, prefisso: true,
    }));
  }

  async function vincoliPai(parole) {
    const dati = await pai();
    if (!dati) return [];
    const token = parole.filter(p => p !== 'PAI').map(p => SINONIMI_PAI[p] ?? p);
    const tutti = !token.length; // «pai» da solo: elenca tutti i temi
    const righe = [];
    for (const ds of dati.dataset.filter(d => d.n > 0)) {
      for (const t of ds.temi) {
        const classi = (t.classi ?? []).filter(c => c.n > 0);
        const base = normalizza(`PAI ${ds.titolo} ${t.titolo}`);
        const conClassi = normalizza(classi.map(c => c.label).join(' '));
        if (!tutti && !token.every(x => (base + ' ' + conClassi).includes(x))) continue;
        const dallaClasse = tutti ? [] : classi.filter(c => token.some(x => normalizza(c.label).includes(x) && !base.includes(x))).map(c => c.label);
        righe.push({ etichetta: t.titolo, nota: `Vincolo PAI${dallaClasse.length ? ` · ${dallaClasse.join(', ')}` : ` · ${ds.titolo}`}`, strato: t.id, zoom: 13, lon: CENTRO[0], lat: CENTRO[1], prefisso: tutti || base.startsWith(token[0]) });
      }
    }
    return righe.slice(0, tutti ? 12 : MAX);
  }

  return {
    async suggerisci(testo) {
      const q = normalizza(testo);
      const base = altra ? altra.suggerisci(testo) : Promise.resolve({ inCima: [], inCoda: [] });
      if (q.length < 3) return base;
      const parole = q.split(' ').filter(Boolean);
      const esplIncendi = parole.some(p => PAROLE_INCENDIO.has(p));
      const esplPai = parole.includes('PAI') || parole.some(p => p in SINONIMI_PAI);
      const [a, inc, vin] = await Promise.all([
        base,
        esplIncendi ? incendi(parole).catch(() => []) : [],
        vincoliPai(parole).catch(() => []),
      ]);
      return { inCima: [...inc, ...(esplPai ? vin : []), ...a.inCima], inCoda: [...a.inCoda, ...(esplPai ? [] : vin)] };
    },
  };
}
