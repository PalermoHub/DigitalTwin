// Stato condiviso ⇄ testo del parametro `?v=`. Puro: niente DOM, niente mappa (si prova in Node).
// Formato: «v1z.» + deflate-raw in base64url, oppure «v1j.» + JSON se il browser non ha CompressionStream.

export const PARAMETRO = 'v';
export const LIMITE = 1800;
const MAX_INGRESSO = 4000; // un payload più lungo non viene nemmeno decompresso

// Chiavi di localStorage che viaggiano nel link (preferenze che cambiano ciò che si vede).
export const CHIAVI_STORAGE = ['dt-temi-strati', 'dt-ordine-strati', 'dt-ordine-disegno', 'dt:rndt:v1', 'dt:miei:v1', 'dt:miei:servizi:v1'];
// Oltre il limite si rinuncia a queste, nell'ordine: prima le meno importanti per riconoscere la vista.
const DA_SCARTARE = ['dt-temi-strati', 'dt:miei:servizi:v1', 'dt:miei:v1', 'dt:rndt:v1', 'dt-ordine-strati', 'dt-ordine-disegno'];

const aBase64Url = byte => {
  let s = '';
  for (const b of byte) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const daBase64Url = t => Uint8Array.from(atob(t.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

async function flusso(byte, trasformazione) {
  return new Uint8Array(await new Response(new Blob([byte]).stream().pipeThrough(trasformazione)).arrayBuffer());
}

async function impacchetta(stato) {
  const byte = new TextEncoder().encode(JSON.stringify(stato));
  if (typeof CompressionStream === 'function') return 'v1z.' + aBase64Url(await flusso(byte, new CompressionStream('deflate-raw')));
  return 'v1j.' + aBase64Url(byte);
}

export async function codifica(stato) {
  const corrente = { ...stato };
  if (stato.s) corrente.s = { ...stato.s };
  let testo = await impacchetta(corrente);
  let troncato = false;
  for (const chiave of DA_SCARTARE) {
    if (testo.length <= LIMITE) break;
    if (!corrente.s || !(chiave in corrente.s)) continue;
    delete corrente.s[chiave];
    if (!Object.keys(corrente.s).length) delete corrente.s;
    troncato = true;
    testo = await impacchetta(corrente);
  }
  return { testo, troncato: troncato || testo.length > LIMITE };
}

const stringa = (v, max) => typeof v === 'string' && v.length <= max;

// Tiene solo campi ben formati: il link arriva da fuori e non è fidato.
function pulisci(o) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
  const r = {};
  if (Array.isArray(o.c) && o.c.length === 5 && o.c.every(Number.isFinite)) r.c = o.c;
  if (Array.isArray(o.a)) r.a = o.a.filter(x => stringa(x, 60)).slice(0, 300);
  if (o.o && typeof o.o === 'object') {
    const ok = Object.entries(o.o).filter(([k, v]) => k.length <= 60 && Number.isFinite(v) && v >= 0 && v <= 1).slice(0, 300);
    if (ok.length) r.o = Object.fromEntries(ok);
  }
  if (stringa(o.b, 40)) r.b = o.b;
  if (o.t === 0 || o.t === 1) r.t = o.t;
  if (o.z && typeof o.z === 'object') {
    const z = Object.fromEntries(['circ', 'quart', 'upl'].filter(k => stringa(o.z[k], 200) && o.z[k]).map(k => [k, o.z[k]]));
    if (Object.keys(z).length) r.z = z;
  }
  if (stringa(o.l, 100) && o.l) r.l = o.l;
  if (o.i && typeof o.i === 'object') {
    const i = {};
    if (stringa(o.i.anno, 4) && o.i.anno) i.anno = o.i.anno;
    if (stringa(o.i.gravita, 20) && o.i.gravita) i.gravita = o.i.gravita;
    if (Object.keys(i).length) r.i = i;
  }
  if (o.s && typeof o.s === 'object') {
    const s = Object.fromEntries(CHIAVI_STORAGE.filter(k => o.s[k] && typeof o.s[k] === 'object').map(k => [k, o.s[k]]));
    if (Object.keys(s).length) r.s = s;
  }
  return r;
}

export async function decodifica(testo) {
  const m = /^v1([zj])\.([\w-]+)$/.exec(String(testo ?? ''));
  if (!m || testo.length > MAX_INGRESSO) return null;
  try {
    const byte = daBase64Url(m[2]);
    const json = new TextDecoder().decode(m[1] === 'z' ? await flusso(byte, new DecompressionStream('deflate-raw')) : byte);
    return pulisci(JSON.parse(json));
  } catch {
    return null;
  }
}

// Stesso indirizzo della pagina (compreso l'hash con la vista della mappa) più il parametro `v`.
export function costruisciLink(href, testo) {
  const u = new URL(href);
  u.searchParams.set(PARAMETRO, testo);
  return u.href;
}
