// worker/pronto-soccorso-core.js
// Pronto soccorso di Palermo (attese in tempo reale): il Worker legge l'API pubblica dell'app «palermo-ps» (stessi dati degli ospedali, già normalizzati)
// e la rilancia con CORS e cache. Rotta: /pronto-soccorso
// Regola dei dati dell'app d'origine: valore non pubblicato = null, mai 0 inventato; lo manteniamo.
export const URL_FONTE = 'https://palermo-ps.coseerobe.workers.dev/api/palermo';
export const TTL_SECONDI = 60; // l'app d'origine rilegge le fonti ogni 2 minuti
export const TTL_ULTIMO_SECONDI = 6 * 3600; // ripiego: ultimo dato buono
const CODICI = ['rosso', 'arancione', 'azzurro', 'verde', 'bianco'];

const json = (stato, corpo, intestazioni = {}) =>
  new Response(JSON.stringify(corpo), { status: stato, headers: { 'content-type': 'application/json', ...intestazioni } });

const numero = v => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const testo = (v, max = 300) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
const sito = v => (typeof v === 'string' && /^https?:\/\//.test(v) ? v.slice(0, 500) : null);

// Tiene solo i campi che la scheda usa e ripulisce i tipi: un valore inatteso diventa null.
export function normalizzaPs(p) {
  const lat = numero(p?.coords?.lat);
  const lng = numero(p?.coords?.lng);
  if (!testo(p?.id, 80) || lat == null || lng == null) return null;
  const l = p.lettura ?? null;
  const codici = {};
  for (const c of CODICI) {
    const v = l?.codici?.[c];
    if (v) codici[c] = { attesa: numero(v.attesa), trattamento: numero(v.trattamento), osservazione: numero(v.osservazione), totale: numero(v.totale) };
  }
  const perm = l?.permanenza;
  const tempi = {};
  for (const c of CODICI) if (numero(l?.tempiMediAttesaMin?.[c]) != null) tempi[c] = l.tempiMediAttesaMin[c];
  return {
    id: testo(p.id, 80), nome: testo(p.nome, 120), struttura: testo(p.struttura, 160), tipo: p.tipo === 'pediatrico' ? 'pediatrico' : 'adulti',
    indirizzo: testo(p.indirizzo), lat, lng, sito: sito(p.sito), fonteUrl: sito(p.fonteUrl), telefono: testo(p.telefono, 40),
    rilevataAlle: testo(l?.rilevataAlle, 40), acquisitaAlle: testo(p.acquisitaAlle, 40), ultimoErrore: testo(p.ultimoErrore, 200),
    pazientiTotali: numero(l?.pazientiTotali), inAttesa: numero(l?.inAttesa), sovraffollamentoPct: numero(l?.sovraffollamentoPct),
    sovraffollamentoCalcolato: l?.sovraffollamentoCalcolato === true, postiTecnici: numero(l?.postiTecnici),
    codici, tempiMediAttesaMin: Object.keys(tempi).length ? tempi : null,
    permanenza: perm ? { meno24h: numero(perm.meno24h), da24a48h: numero(perm.da24a48h), oltre48h: numero(perm.oltre48h) } : null,
    stato: ['ok', 'vecchio', 'ferma', 'errore'].includes(p.affidabilita?.stato) ? p.affidabilita.stato : (l ? 'ok' : 'assente'),
    etaFonteMin: numero(p.affidabilita?.etaFonteMin),
  };
}

export function costruisci(fonte) {
  const ps = (Array.isArray(fonte?.ps) ? fonte.ps : []).map(normalizzaPs).filter(Boolean);
  if (!ps.length) throw new Error('nessun pronto soccorso nella risposta');
  return { aggiornato: testo(fonte.aggiornatoAlle, 40), ps };
}

export async function gestisciProntoSoccorso(richiesta, env, fetchFn, cache) {
  const ammesse = String(env?.ORIGINI ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const origine = richiesta.headers.get('origin');
  if (ammesse.length && !ammesse.includes(origine)) return json(403, { errore: 'origine non ammessa' }, { 'cache-control': 'no-store' });
  const cors = { 'access-control-allow-origin': origine ?? '*', vary: 'Origin' };
  if (richiesta.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors, 'access-control-allow-methods': 'GET, OPTIONS', 'access-control-max-age': '86400' } });
  if (richiesta.method !== 'GET') return json(405, { errore: 'metodo non ammesso' }, { ...cors, 'cache-control': 'no-store' });

  const chiave = new Request('https://cache.interno/pronto-soccorso');
  const CHIAVE_ULTIMO = new Request('https://cache.interno/pronto-soccorso-ultimo');
  const salvata = await cache?.match(chiave);
  if (salvata) return new Response(salvata.body, { status: 200, headers: { ...Object.fromEntries(salvata.headers), ...cors } });
  try {
    const r = await fetchFn(URL_FONTE, { headers: { accept: 'application/json', 'user-agent': 'DigitalTwinPalermo/1.0 (+https://palermodigitaltwin.opendatasicilia.it)' } });
    if (!r.ok) throw new Error(`palermo-ps ${r.status}`);
    const corpo = JSON.stringify(costruisci(await r.json()));
    const intestazioni = { 'content-type': 'application/json', 'cache-control': `public, max-age=${TTL_SECONDI}` };
    await cache?.put(chiave, new Response(corpo, { headers: intestazioni }));
    await cache?.put(CHIAVE_ULTIMO, new Response(corpo, { headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${TTL_ULTIMO_SECONDI}` } }));
    return new Response(corpo, { status: 200, headers: { ...intestazioni, ...cors } });
  } catch (e) {
    // meglio l'ultimo dato buono, segnalato come precedente, che nessun dato
    const ultimo = await cache?.match(CHIAVE_ULTIMO);
    if (ultimo) return new Response(ultimo.body, { status: 200, headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=30', 'x-dati': 'precedenti', ...cors } });
    return json(502, { errore: 'pronto soccorso non raggiungibile', dettaglio: String(e?.message ?? e).slice(0, 120) }, { ...cors, 'cache-control': 'no-store' });
  }
}

// ---- Storico: pazienti in attesa nelle ultime 24 ore, un valore ogni 30 minuti per presidio (rotta /pronto-soccorso-storico) ----
export const URL_STORICO = 'https://palermo-ps.coseerobe.workers.dev/api/storico';
export const TTL_STORICO_SECONDI = 300; // l'app d'origine lo rinfresca ogni 5 minuti

// Tiene solo la serie delle 24 ore: ogni valore è un numero oppure null (nessuna lettura).
export function costruisciStorico(fonte) {
  const da = numero(fonte?.spark?.da);
  const passo = numero(fonte?.passo);
  if (da == null || !passo || typeof fonte?.spark?.ps !== 'object') throw new Error('storico non valido');
  const ps = {};
  for (const [id, serie] of Object.entries(fonte.spark.ps)) if (Array.isArray(serie)) ps[id.slice(0, 80)] = serie.slice(0, 96).map(numero);
  return { da, passo, ps };
}

export async function gestisciProntoSoccorsoStorico(richiesta, env, fetchFn, cache) {
  const ammesse = String(env?.ORIGINI ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const origine = richiesta.headers.get('origin');
  if (ammesse.length && !ammesse.includes(origine)) return json(403, { errore: 'origine non ammessa' }, { 'cache-control': 'no-store' });
  const cors = { 'access-control-allow-origin': origine ?? '*', vary: 'Origin' };
  if (richiesta.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors, 'access-control-allow-methods': 'GET, OPTIONS', 'access-control-max-age': '86400' } });
  if (richiesta.method !== 'GET') return json(405, { errore: 'metodo non ammesso' }, { ...cors, 'cache-control': 'no-store' });

  const chiave = new Request('https://cache.interno/pronto-soccorso-storico');
  const salvata = await cache?.match(chiave);
  if (salvata) return new Response(salvata.body, { status: 200, headers: { ...Object.fromEntries(salvata.headers), ...cors } });
  try {
    const r = await fetchFn(URL_STORICO, { headers: { accept: 'application/json', 'user-agent': 'DigitalTwinPalermo/1.0 (+https://palermodigitaltwin.opendatasicilia.it)' } });
    if (!r.ok) throw new Error(`palermo-ps storico ${r.status}`);
    const corpo = JSON.stringify(costruisciStorico(await r.json()));
    const intestazioni = { 'content-type': 'application/json', 'cache-control': `public, max-age=${TTL_STORICO_SECONDI}` };
    await cache?.put(chiave, new Response(corpo, { headers: intestazioni }));
    return new Response(corpo, { status: 200, headers: { ...intestazioni, ...cors } });
  } catch (e) {
    return json(502, { errore: 'storico non raggiungibile', dettaglio: String(e?.message ?? e).slice(0, 120) }, { ...cors, 'cache-control': 'no-store' });
  }
}
