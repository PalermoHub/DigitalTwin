// worker/allerte-core.js
// Allerta meteo-idro della Protezione Civile (DPC) per le 9 zone di allerta della Sicilia, come GeoJSON. Rotta: /allerte
// Fonte: repository pcm-dpc/DPC-Bollettini-Criticita-Idrogeologica-Idraulica (CC BY 4.0). Il bollettino esce ogni giorno verso le 16:00 (oggi e domani),
// con aggiornamenti se le Regioni lo correggono. Il nome del file è «AAAAMMGG_HHMM.json»: l'ultimo si trova nell'elenco della cartella `files`.
// I poligoni delle 187 zone d'Italia sono in TopoJSON (1 MB): qui si tengono solo le zone siciliane, con il livello di oggi e di domani.

export const FONTE = 'Dipartimento della Protezione Civile, bollettino di criticità nazionale (CC BY 4.0)';
export const COMUNE = 'Palermo'; // la sua zona porta `palermo: true`
export const TTL_SECONDI = 15 * 60;
export const TTL_ULTIMO_SECONDI = 3 * 24 * 60 * 60;
const BASE = 'https://raw.githubusercontent.com/pcm-dpc/DPC-Bollettini-Criticita-Idrogeologica-Idraulica/master/files';
const URL_ELENCO = 'https://api.github.com/repos/pcm-dpc/DPC-Bollettini-Criticita-Idrogeologica-Idraulica/git/trees/master:files';
const BOLLETTINO = /^(\d{8}_\d{4})\.json$/;
// Il TopoJSON non dice la regione di una zona: è siciliana se tra i suoi Comuni c'è uno di questi (i capoluoghi più Cefalù e Sciacca,
// che coprono le due zone senza capoluogo). La Calabria non va scelta per coordinate: Reggio è alla stessa longitudine di Messina.
export const ANCORE_SICILIA = ['Palermo', 'Messina', 'Catania', 'Siracusa', 'Trapani', 'Agrigento', 'Caltanissetta', 'Enna', 'Ragusa', 'Cefalù', 'Sciacca'];
export const ZONE_SICILIA = 9;

// Livelli di allerta dal testo del DPC («… / ALLERTA GIALLA», «NESSUNA ALLERTA»): 0 verde, 1 gialla, 2 arancione, 3 rossa
export function livello(testo) {
  const s = String(testo ?? '').toUpperCase();
  if (s.includes('ALLERTA ROSSA')) return 3;
  if (s.includes('ALLERTA ARANCIONE')) return 2;
  if (s.includes('ALLERTA GIALLA')) return 1;
  return 0;
}
export const NOMI_LIVELLO = ['Nessuna allerta', 'Allerta gialla', 'Allerta arancione', 'Allerta rossa'];

// Nome dell'ultimo bollettino («20261022_1417») dall'albero della cartella `files`; null se non ce n'è nessuno
export function ultimoBollettino(albero) {
  const nomi = (albero?.tree ?? []).map(n => BOLLETTINO.exec(n?.path ?? '')?.[1]).filter(Boolean).sort();
  return nomi.at(-1) ?? null;
}

// TopoJSON → anelli di coordinate [lon, lat] per la geometria (Polygon o MultiPolygon) → geometria GeoJSON arrotondata a 3 decimali (circa 100 m)
export function geometria(topo, g) {
  const [sx, sy] = topo.transform.scale;
  const [tx, ty] = topo.transform.translate;
  const archi = topo.arcs.map(arco => {
    let x = 0, y = 0;
    return arco.map(([dx, dy]) => { x += dx; y += dy; return [Math.round((x * sx + tx) * 1e3) / 1e3, Math.round((y * sy + ty) * 1e3) / 1e3]; });
  });
  const arco = i => (i >= 0 ? archi[i] : [...archi[~i]].reverse());
  const anello = indici => indici.flatMap((i, k) => (k === 0 ? arco(i) : arco(i).slice(1)));
  if (g.type === 'Polygon') return { type: 'Polygon', coordinates: g.arcs.map(anello) };
  if (g.type === 'MultiPolygon') return { type: 'MultiPolygon', coordinates: g.arcs.map(poligono => poligono.map(anello)) };
  throw new Error(`geometria non prevista: ${g.type}`);
}

// Le zone di allerta siciliane: [{ proprieta, geometria }]
export function zoneSicilia(topo) {
  const oggetto = Object.values(topo?.objects ?? {})[0];
  return (oggetto?.geometries ?? [])
    .filter(g => Array.isArray(g.properties?.Comuni) && g.properties.Comuni.some(c => ANCORE_SICILIA.includes(c)))
    .map(g => ({ proprieta: g.properties, geometria: geometria(topo, g) }));
}

function giorno(proprieta) {
  const mappa = proprieta['Rappresentata nella mappa'];
  return {
    livello: livello(mappa), testo: String(mappa ?? ''),
    idraulico: livello(proprieta['Per rischio idraulico']), temporali: livello(proprieta['Per rischio temporali']), idrogeologico: livello(proprieta['Per rischio idrogeologico']),
  };
}

// bollettino = JSON del bollettino; topo = { today, tomorrow } già scaricati
export function costruisci(nome, bollettino, topo) {
  const oggi = zoneSicilia(topo.today);
  const domani = new Map(zoneSicilia(topo.tomorrow).map(z => [z.proprieta['Nome zona'], z]));
  if (oggi.length !== ZONE_SICILIA || oggi.some(z => !domani.has(z.proprieta['Nome zona']))) throw new Error(`zone siciliane non trovate nel bollettino ${nome} (${oggi.length} su ${ZONE_SICILIA})`);
  const [, aaaa, mm, gg, hh, mi] = /^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})$/.exec(nome);
  const titolo = String(bollettino?.name ?? `Bollettino ${gg}/${mm}/${aaaa} ore ${hh}:${mi}`);
  return {
    type: 'FeatureCollection', fonte: FONTE, aggiornato: Number.isFinite(Date.parse(bollettino?.date)) ? Math.floor(Date.parse(bollettino.date) / 1000) : null,
    legenda: bollettino?.global_legend ?? null,
    features: oggi.map(z => {
      const nomeZona = z.proprieta['Nome zona'];
      const g1 = giorno(z.proprieta);
      const g2 = giorno(domani.get(nomeZona).proprieta);
      return {
        type: 'Feature', geometry: z.geometria,
        properties: { zona: nomeZona, palermo: z.proprieta.Comuni.includes(COMUNE), bollettino: titolo, oggi: g1, domani: g2, livello: Math.max(g1.livello, g2.livello) },
      };
    }),
  };
}

const json = (stato, corpo, intestazioni = {}) => new Response(JSON.stringify(corpo), { status: stato, headers: { 'content-type': 'application/json', ...intestazioni } });

async function prendi(fetchFn, url, opzioni) {
  const r = await fetchFn(url, opzioni);
  if (!r.ok) throw new Error(`${new URL(url).hostname} ${r.status}`);
  return r.json();
}

export async function gestisciAllerte(richiesta, env, fetchFn, cache) {
  const ammesse = String(env?.ORIGINI ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const origine = richiesta.headers.get('origin');
  if (ammesse.length && !ammesse.includes(origine)) return json(403, { errore: 'origine non ammessa' }, { 'cache-control': 'no-store' });
  const cors = { 'access-control-allow-origin': origine ?? '*', vary: 'Origin' };
  if (richiesta.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors, 'access-control-allow-methods': 'GET, OPTIONS', 'access-control-max-age': '86400' } });
  if (richiesta.method !== 'GET') return json(405, { errore: 'metodo non ammesso' }, { ...cors, 'cache-control': 'no-store' });

  const chiave = new Request('https://cache.interno/allerte');
  const CHIAVE_ULTIMO = new Request('https://cache.interno/allerte-ultimo');
  const salvata = await cache?.match(chiave);
  if (salvata) return new Response(salvata.body, { status: 200, headers: { ...Object.fromEntries(salvata.headers), ...cors } });
  try {
    const opzioni = { headers: { accept: 'application/json', 'user-agent': 'DigitalTwinPalermo/1.0 (+https://palermodigitaltwin.opendatasicilia.it)' } };
    const nome = ultimoBollettino(await prendi(fetchFn, URL_ELENCO, opzioni));
    if (!nome) throw new Error('nessun bollettino nell\'elenco');
    const bollettino = await prendi(fetchFn, `${BASE}/${nome}.json`, opzioni);
    const [today, tomorrow] = await Promise.all([bollettino.today?.topo_json, bollettino.tomorrow?.topo_json].map(u => {
      if (typeof u !== 'string' || !u.startsWith(`${BASE}/`)) throw new Error('indirizzo del TopoJSON non previsto');
      return prendi(fetchFn, u, opzioni);
    }));
    const corpo = JSON.stringify(costruisci(nome, bollettino, { today, tomorrow }));
    const intestazioni = { 'content-type': 'application/json', 'cache-control': `public, max-age=${TTL_SECONDI}` };
    await cache?.put(chiave, new Response(corpo, { headers: intestazioni }));
    await cache?.put(CHIAVE_ULTIMO, new Response(corpo, { headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${TTL_ULTIMO_SECONDI}` } }));
    return new Response(corpo, { status: 200, headers: { ...intestazioni, ...cors } });
  } catch (e) {
    // meglio l'ultimo bollettino buono, vecchio di poco, che nessun dato
    const ultimo = await cache?.match(CHIAVE_ULTIMO);
    if (ultimo) return new Response(ultimo.body, { status: 200, headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=60', 'x-dati': 'precedenti', ...cors } });
    return json(502, { errore: 'bollettino DPC non raggiungibile', dettaglio: String(e?.message ?? e).slice(0, 120) }, { ...cors, 'cache-control': 'no-store' });
  }
}
