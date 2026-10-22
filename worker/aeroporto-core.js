// worker/aeroporto-core.js
// Arrivi e partenze dell'aeroporto di Palermo con orario programmato, stimato e ritardo, dalla pagina voli di Gesap (aeroportodipalermo.it/voli/). Rotta: /aeroporto
// Gesap non ha un'API: la pagina arriva già compilata dal server, con due tabelle (partenze e arrivi). Il Worker la legge al massimo una volta ogni
// TTL_SECONDI (cache di Cloudflare, condivisa da tutti gli utenti). Se Gesap cambia l'HTML la lettura fallisce a voce alta (errore, non voli vuoti)
// e si servono gli ultimi dati buoni. `arricchisci` aggiunge il volo di linea agli aerei di /voli quando il nominativo radio coincide con il numero di volo.

export const URL_GESAP = 'https://www.aeroportodipalermo.it/voli/';
export const TTL_SECONDI = 300;
export const TTL_ULTIMO_SECONDI = 3600;
export const FONTE = 'Gesap, Aeroporto di Palermo (aeroportodipalermo.it)';
const SOGLIA_MIN = 5; // sotto questa differenza un volo è «in orario»

// codice IATA del numero di volo → prefissi ICAO dei nominativi radio (adsb.lol dà «RYR4342», Gesap «FR 04342»)
export const ICAO_PER_IATA = {
  AZ: ['ITY'], BA: ['BAW'], DS: ['EZS'], DX: ['DTR'], EC: ['EJU'], FR: ['RYR'], LH: ['DLH'], LS: ['EXS'], LX: ['SWR'], TK: ['THY'],
  TO: ['TVF'], U2: ['EZY'], V7: ['VOE'], VY: ['VLG'], W4: ['WMT'], W6: ['WZZ'], XZ: ['AEZ'],
  AF: ['AFR'], KL: ['KLM'], EI: ['EIN'], EW: ['EWG'], HV: ['TRA'], NO: ['NOS'], EN: ['DLA'], IB: ['IBE'], A3: ['AEE'], TP: ['TAP'],
  SN: ['BEL'], OS: ['AUA'], LO: ['LOT'], PC: ['PGT'], RK: ['RUK'], UX: ['AEA'], BT: ['BTI'], '3O': ['MAC'], '4U': ['GWI'],
};

const MESI = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
const testo = html => html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const minuti = (h, m) => Number(h) * 60 + Number(m);
const giorni = (a, m, g) => Math.floor(Date.UTC(a, m - 1, g) / 86400000);

// «TODAY 23 Oct 2026 00:15» → { giorno (numero di giorni), iso locale }
function dataPagina(html) {
  const m = /(\d{1,2}) ([A-Z][a-z]{2}) (\d{4}) (\d{2}):(\d{2})/.exec(html);
  if (!m || !MESI[m[2]]) return null;
  const p = n => String(n).padStart(2, '0');
  return { giorno: giorni(Number(m[3]), MESI[m[2]], Number(m[1])), iso: `${m[3]}-${p(MESI[m[2]])}-${p(m[1])}T${m[4]}:${m[5]}` };
}

// Ritardo in minuti = stimato − programmato; lo stimato può portare la data («24/10/2026 00:06») e cadere dopo la mezzanotte.
export function ritardoMin(programmato, stimato, giornoBase) {
  const p = /^(\d{2}):(\d{2})$/.exec(programmato);
  const s = /^(?:(\d{2})\/(\d{2})\/(\d{4}) )?(\d{2}):(\d{2})$/.exec(stimato ?? '');
  if (!p || !s) return null;
  const spostamento = s[1] && giornoBase != null ? (giorni(Number(s[3]), Number(s[2]), Number(s[1])) - giornoBase) * 1440 : 0;
  let d = spostamento + minuti(s[4], s[5]) - minuti(p[1], p[2]);
  while (d > 720) d -= 1440;
  while (d <= -720) d += 1440;
  return d;
}

function riga(celle, partenza, giornoBase) {
  const [, compagnia, volo, citta, programmato, stimato] = celle;
  const stato = celle[partenza ? 7 : 6] ?? '';
  if (!/^[A-Z0-9]{2} ?\d{1,5}[A-Z]?$/i.test(volo) || !/^\d{2}:\d{2}$/.test(programmato)) return null;
  const ora = /(\d{2}:\d{2})$/.exec(stimato ?? '')?.[1] ?? '';
  const cancellato = /CANCELL/i.test(stato);
  const ritardo = cancellato ? null : ritardoMin(programmato, stimato, giornoBase);
  return {
    compagnia, volo, citta, programmato, stimato: ora, stimato_giorno_dopo: ritardo != null && minuti(...programmato.split(':')) + ritardo >= 1440,
    ritardo_min: ritardo,
    gate: partenza ? (celle[6] ?? '').replace(/^GATE\s*/i, '') : '', stato, cancellato,
  };
}

// Le tabelle si riconoscono dall'intestazione (Destinazione = partenze, Provenienza = arrivi), non dagli id della pagina.
export function leggiGesap(html) {
  if (typeof html !== 'string') throw new Error('pagina di Gesap non valida');
  const data = dataPagina(html);
  const risultato = { aggiornato: data?.iso ?? null, partenze: [], arrivi: [] };
  let tabelle = 0;
  for (const tabella of html.split(/<table/i).slice(1)) {
    const fine = tabella.search(/<\/thead>/i);
    if (fine < 0) continue;
    const testa = testo(tabella.slice(0, fine)); // solo il testo: le classi CSS delle colonne si chiamano «destinazione» anche negli arrivi
    const partenza = /Destinazione/i.test(testa);
    if (!partenza && !/Provenienza/i.test(testa)) continue;
    tabelle++;
    const voli = risultato[partenza ? 'partenze' : 'arrivi'];
    for (const tr of tabella.slice(fine).split(/<tr/i).slice(1)) {
      const v = riga([...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m => testo(m[1])), partenza, data?.giorno ?? null);
      if (v) voli.push(v);
    }
  }
  // Una tabella senza nessun volo riconoscibile può essere una notte vuota, ma più probabilmente un HTML cambiato: meglio un errore.
  if (tabelle < 2 || !(risultato.partenze.length + risultato.arrivi.length)) throw new Error('pagina di Gesap cambiata (tabelle o righe non riconosciute)');
  return risultato;
}

const SOGLIA_RITARDO = SOGLIA_MIN;
export const inRitardo = v => !v.cancellato && v.ritardo_min != null && v.ritardo_min >= SOGLIA_RITARDO;

export function riepilogo(voli) {
  const ritardati = voli.filter(inRitardo);
  const somma = ritardati.reduce((s, v) => s + v.ritardo_min, 0);
  return {
    voli: voli.length, ritardati: ritardati.length, cancellati: voli.filter(v => v.cancellato).length,
    ritardo_medio_min: ritardati.length ? Math.round(somma / ritardati.length) : 0,
  };
}

export function costruisci(pagina, ora = Date.now()) {
  return {
    aggiornato: pagina.aggiornato, letto: Math.floor(ora / 1000), fonte: FONTE,
    arrivi: pagina.arrivi, partenze: pagina.partenze, riepilogo: riepilogo([...pagina.arrivi, ...pagina.partenze]),
  };
}

// «FR 04342» → { iata: 'FR', numero: '4342' }
function numeroVolo(volo) {
  const m = /^([A-Z0-9]{2}) ?0*(\d{1,4})[A-Z]?$/i.exec(volo);
  return m ? { iata: m[1].toUpperCase(), numero: m[2] } : null;
}

// Cerca il volo di linea di un nominativo radio («RYR4342»). Se il nominativo non corrisponde, o corrisponde a più voli, nessun abbinamento.
// `stato` è quello dedotto da /voli: «In arrivo» cerca tra gli arrivi, «In partenza» tra le partenze, gli altri tra tutti.
export function abbina(nominativo, stato, aeroporto) {
  const m = /^([A-Z]{3})0*(\d{1,4})[A-Z]?$/.exec(String(nominativo ?? '').trim().toUpperCase());
  if (!m) return null;
  const elenchi = stato === 'In arrivo' ? [['arrivo', aeroporto.arrivi]] : stato === 'In partenza' ? [['partenza', aeroporto.partenze]]
    : [['arrivo', aeroporto.arrivi], ['partenza', aeroporto.partenze]];
  const trovati = [];
  for (const [direzione, voli] of elenchi) {
    for (const v of voli) {
      const n = numeroVolo(v.volo);
      if (n && n.numero === m[2] && (ICAO_PER_IATA[n.iata] ?? []).includes(m[1])) trovati.push({ direzione, volo: v });
    }
  }
  return trovati.length === 1 ? trovati[0] : null;
}

// Aggiunge a ogni aereo abbinato i campi del volo di linea (prefisso «linea_»); gli altri restano come sono.
export function arricchisci(fc, aeroporto) {
  for (const f of fc.features) {
    const a = abbina(f.properties.volo, f.properties.stato, aeroporto);
    if (!a) continue;
    const v = a.volo;
    Object.assign(f.properties, {
      linea_direzione: a.direzione, linea_volo: v.volo, linea_compagnia: v.compagnia, linea_citta: v.citta,
      linea_programmato: v.programmato, linea_stimato: v.stimato, linea_stimato_giorno_dopo: v.stimato_giorno_dopo, linea_ritardo_min: v.ritardo_min,
      linea_cancellato: v.cancellato, linea_gate: v.gate, linea_stato: v.stato,
    });
  }
  return fc;
}

const json = (stato, corpo, intestazioni = {}) => new Response(JSON.stringify(corpo), {
  status: stato, headers: { 'content-type': 'application/json', ...intestazioni },
});
const INTESTAZIONI = { headers: { accept: 'text/html', 'user-agent': 'DigitalTwinPalermo/1.0 (+https://palermodigitaltwin.opendatasicilia.it)' } };

// Dati di Gesap con cache (chiave fissa: tutti gli utenti e /voli condividono una sola richiesta ogni TTL_SECONDI).
// Se Gesap non risponde, gli ultimi dati buoni (fino a TTL_ULTIMO_SECONDI) con `precedenti: true`; altrimenti l'errore.
export async function leggiAeroporto(fetchFn, cache) {
  const chiave = new Request('https://cache.interno/aeroporto');
  const ultimoChiave = new Request('https://cache.interno/aeroporto-ultimo');
  const salvata = await cache?.match(chiave);
  if (salvata) return { dati: await salvata.json(), precedenti: false };
  try {
    const r = await fetchFn(URL_GESAP, INTESTAZIONI);
    if (!r.ok) throw new Error(`Gesap ${r.status}`);
    const dati = costruisci(leggiGesap(await r.text()));
    const corpo = JSON.stringify(dati);
    await cache?.put(chiave, new Response(corpo, { headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${TTL_SECONDI}` } }));
    await cache?.put(ultimoChiave, new Response(corpo, { headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${TTL_ULTIMO_SECONDI}` } }));
    return { dati, precedenti: false };
  } catch (e) {
    const ultimo = await cache?.match(ultimoChiave);
    if (ultimo) return { dati: await ultimo.json(), precedenti: true };
    throw e;
  }
}

export async function gestisciAeroporto(richiesta, env, fetchFn, cache) {
  const ammesse = String(env?.ORIGINI ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const origine = richiesta.headers.get('origin');
  if (ammesse.length && !ammesse.includes(origine)) return json(403, { errore: 'origine non ammessa' }, { 'cache-control': 'no-store' });
  const cors = { 'access-control-allow-origin': origine ?? '*', vary: 'Origin' };
  if (richiesta.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors, 'access-control-allow-methods': 'GET, OPTIONS', 'access-control-max-age': '86400' } });
  if (richiesta.method !== 'GET') return json(405, { errore: 'metodo non ammesso' }, { ...cors, 'cache-control': 'no-store' });
  try {
    const { dati, precedenti } = await leggiAeroporto(fetchFn, cache);
    return json(200, dati, { ...cors, 'cache-control': `public, max-age=${precedenti ? 30 : TTL_SECONDI}`, ...(precedenti ? { 'x-dati': 'precedenti' } : {}) });
  } catch (e) {
    return json(502, { errore: 'Gesap non raggiungibile o pagina cambiata', dettaglio: String(e?.message ?? e).slice(0, 120) }, { ...cors, 'cache-control': 'no-store' });
  }
}
