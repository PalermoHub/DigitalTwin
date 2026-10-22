// worker/navi-core.js
// Navi nel golfo di Palermo, da AISStream (AIS terrestre). Rotta: /navi
// AISStream si ascolta solo con un WebSocket da un server e vuole una chiave (secret AISSTREAM_KEY): ogni 5 minuti `raccogli`
// resta in ascolto qualche secondo e `unisci` mette le posizioni nel KV (una nave per MMSI, scartate dopo SCADENZA_S senza segnali);
// `gestisciNavi` restituisce il KV come GeoJSON, con cache. Il browser non parla mai con AISStream.

export const RIQUADRO = [[37.85, 12.65], [38.6, 13.9]]; // [lat, lon] sud-ovest e nord-est: il golfo di Palermo e le sue rotte
export const ASCOLTO_MS = 30000;
export const SCADENZA_S = 30 * 60;
export const TTL_SECONDI = 120;
const URL_STREAM = 'https://stream.aisstream.io/v0/stream';
const CHIAVE_KV = 'navi';
const MAX_NAVI = 1500;

// Categoria dal codice tipo AIS (ShipStaticData.Type)
export function categoria(tipo) {
  if (!Number.isFinite(tipo) || tipo <= 0) return 'Altro';
  if (tipo === 30) return 'Pesca';
  if (tipo === 36 || tipo === 37) return 'Diporto';
  if (tipo === 35) return 'Militare';
  if ([31, 32, 33, 34, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59].includes(tipo)) return 'Servizio';
  if (tipo >= 60 && tipo <= 69) return 'Passeggeri';
  if (tipo >= 70 && tipo <= 79) return 'Merci';
  if (tipo >= 80 && tipo <= 89) return 'Cisterne';
  return 'Altro';
}

const STATI_NAV = { 0: 'In navigazione', 1: 'All\'ancora', 2: 'Non governabile', 3: 'Manovrabilità limitata', 4: 'Limitata dal pescaggio', 5: 'Ormeggiata', 6: 'Incagliata', 7: 'Impegnata nella pesca', 8: 'A vela' };
const pulito = s => String(s ?? '').replace(/[@\0]+/g, ' ').trim();
const num = (v, min, max) => (Number.isFinite(v) && v >= min && v <= max ? v : null);

// Un messaggio AISStream → modifica della nave (o null). Posizioni: PositionReport e StandardClassBPositionReport; dati fissi: ShipStaticData.
export function leggiMessaggio(m, adesso) {
  const tipo = m?.MessageType;
  const mmsi = String(m?.MetaData?.MMSI ?? '');
  if (!/^\d{9}$/.test(mmsi)) return null;
  const nome = pulito(m.MetaData.ShipName);
  if (tipo === 'ShipStaticData') {
    const s = m.Message?.ShipStaticData;
    if (!s) return null;
    const d = s.Dimension ?? {};
    const lunghezza = (d.A ?? 0) + (d.B ?? 0);
    return { mmsi, dati: { nome: pulito(s.Name) || nome, tipo: num(s.Type, 0, 99), destinazione: pulito(s.Destination), lunghezza: lunghezza > 0 ? lunghezza : null, visto_dati: adesso } };
  }
  const p = m.Message?.PositionReport ?? m.Message?.StandardClassBPositionReport;
  if (!p || (tipo !== 'PositionReport' && tipo !== 'StandardClassBPositionReport')) return null;
  const lat = num(p.Latitude, -90, 90), lon = num(p.Longitude, -180, 180);
  if (lat == null || lon == null || (lat === 0 && lon === 0)) return null;
  return {
    mmsi,
    dati: {
      ...(nome && { nome }), lat, lon, sog: num(p.Sog, 0, 102.2), cog: num(p.Cog, 0, 359.9), prua: num(p.TrueHeading, 0, 359),
      stato: Number.isInteger(p.NavigationalStatus) ? p.NavigationalStatus : null, visto: adesso,
    },
  };
}

// Stato del KV + modifiche raccolte → nuovo stato: una nave per MMSI, senza quelle scadute e al massimo MAX_NAVI (le più recenti).
export function unisci(stato, modifiche, adesso) {
  const navi = { ...(stato ?? {}) };
  for (const { mmsi, dati } of modifiche) navi[mmsi] = { ...(navi[mmsi] ?? {}), ...dati };
  const vive = Object.entries(navi).filter(([, n]) => Number.isFinite(n.lat) && adesso - (n.visto ?? 0) <= SCADENZA_S);
  return Object.fromEntries(vive.sort((a, b) => b[1].visto - a[1].visto).slice(0, MAX_NAVI));
}

export function geojson(stato, adesso) {
  const features = Object.entries(stato ?? {}).map(([mmsi, n]) => {
    const ferma = n.sog == null || n.sog < 0.5;
    return {
      type: 'Feature', geometry: { type: 'Point', coordinates: [Math.round(n.lon * 1e5) / 1e5, Math.round(n.lat * 1e5) / 1e5] },
      properties: {
        id: mmsi, nome: n.nome ?? '', categoria: categoria(n.tipo), destinazione: n.destinazione ?? '', lunghezza_m: n.lunghezza ?? null,
        velocita_kt: n.sog == null ? null : Math.round(n.sog * 10) / 10, rotta: (v => (v == null ? null : Math.round(v)))(ferma ? (n.prua ?? n.cog ?? null) : (n.cog ?? n.prua ?? null)),
        stato: STATI_NAV[n.stato] ?? (ferma ? 'Ferma' : 'In navigazione'), minuti_fa: Math.max(0, Math.round((adesso - n.visto) / 60)),
      },
    };
  }).sort((a, b) => (a.properties.id < b.properties.id ? -1 : 1));
  return { type: 'FeatureCollection', aggiornato: adesso, fonte: 'AISStream (AIS terrestre)', features };
}

// Ascolta AISStream per `durata` ms e restituisce le modifiche. `apri` apre il WebSocket (in produzione fetch con Upgrade).
export async function raccogli(chiave, apri, adesso = () => Math.floor(Date.now() / 1000), durata = ASCOLTO_MS) {
  const ws = await apri(URL_STREAM);
  if (!ws) throw new Error('WebSocket non aperto');
  const modifiche = [];
  const fine = new Promise(risolvi => {
    let totali = 0;
    ws.addEventListener('message', ev => {
      totali++;
      try {
        const testo = typeof ev.data === 'string' ? ev.data : new TextDecoder().decode(ev.data);
        const m = leggiMessaggio(JSON.parse(testo), adesso());
        if (m) modifiche.push(m);
        else if (totali <= 3) console.log('navi: messaggio non usato', testo.slice(0, 300)); // es. errore di AISStream (chiave, riquadro)
      } catch { /* messaggio non valido: si ignora */ }
    });
    ws.addEventListener('close', ev => { console.log('navi: connessione chiusa', ev?.code, ev?.reason, 'messaggi', totali); risolvi(); });
    ws.addEventListener('error', ev => { console.log('navi: errore', ev?.message ?? ''); risolvi(); });
    setTimeout(risolvi, durata);
  });
  // la sottoscrizione deve arrivare entro 3 secondi dall'apertura
  ws.send(JSON.stringify({ APIKey: chiave, BoundingBoxes: [RIQUADRO], FilterMessageTypes: ['PositionReport', 'StandardClassBPositionReport', 'ShipStaticData'] }));
  await fine;
  try { ws.close(); } catch { /* già chiuso */ }
  return modifiche;
}

export async function aggiorna(env, apri, adesso = () => Math.floor(Date.now() / 1000), durata = ASCOLTO_MS) {
  if (!env?.AISSTREAM_KEY || !env?.NAVI) throw new Error('AISSTREAM_KEY o KV NAVI mancanti');
  const modifiche = await raccogli(env.AISSTREAM_KEY, apri, adesso, durata);
  const stato = unisci(await env.NAVI.get(CHIAVE_KV, 'json'), modifiche, adesso());
  await env.NAVI.put(CHIAVE_KV, JSON.stringify(stato));
  return { ricevuti: modifiche.length, navi: Object.keys(stato).length };
}

const json = (stato, corpo, intestazioni = {}) => new Response(JSON.stringify(corpo), { status: stato, headers: { 'content-type': 'application/json', ...intestazioni } });

export async function gestisciNavi(richiesta, env, cache, adesso = () => Math.floor(Date.now() / 1000)) {
  const ammesse = String(env?.ORIGINI ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const origine = richiesta.headers.get('origin');
  if (ammesse.length && !ammesse.includes(origine)) return json(403, { errore: 'origine non ammessa' }, { 'cache-control': 'no-store' });
  const cors = { 'access-control-allow-origin': origine ?? '*', vary: 'Origin' };
  if (richiesta.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors, 'access-control-allow-methods': 'GET, OPTIONS', 'access-control-max-age': '86400' } });
  if (richiesta.method !== 'GET') return json(405, { errore: 'metodo non ammesso' }, { ...cors, 'cache-control': 'no-store' });
  const chiave = new Request('https://cache.interno/navi');
  const salvata = await cache?.match(chiave);
  if (salvata) return new Response(salvata.body, { status: 200, headers: { ...Object.fromEntries(salvata.headers), ...cors } });
  try {
    const corpo = JSON.stringify(geojson(await env.NAVI.get(CHIAVE_KV, 'json'), adesso()));
    const intestazioni = { 'content-type': 'application/json', 'cache-control': `public, max-age=${TTL_SECONDI}` };
    await cache?.put(chiave, new Response(corpo, { headers: intestazioni }));
    return new Response(corpo, { status: 200, headers: { ...intestazioni, ...cors } });
  } catch {
    return json(502, { errore: 'dati delle navi non disponibili' }, { ...cors, 'cache-control': 'no-store' });
  }
}

// WebSocket in uscita da un Worker: fetch con Upgrade, poi accept()
export async function apriWebSocket(url, fetchFn = fetch) {
  const r = await fetchFn(url, { headers: { Upgrade: 'websocket' } });
  const ws = r.webSocket;
  if (!ws) return null;
  ws.accept();
  return ws;
}
