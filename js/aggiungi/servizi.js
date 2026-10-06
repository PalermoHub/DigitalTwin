// js/aggiungi/servizi.js
// Servizi geografici incollati per URL (XYZ, WMS, WFS): lettura delle capabilities e costruzione delle richieste.
// Moduli puri, senza DOM né rete (il browser ha DOMParser, Node no: un piccolo lettore XML basta e si prova nei test).

const ENTITA = { amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'' };
const decodifica = t => t.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (m, e) => (e[0] === '#'
  ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10))
  : ENTITA[e.toLowerCase()]));
const senzaPrefisso = nome => nome.replace(/^[^:]+:/, '');

// commenti, CDATA (1), istruzioni, DOCTYPE (anche con sottoinsieme tra [ ]), tag (2 = chiusura, 3 = nome, 4 = attributi, 5 = auto-chiuso), testo (6)
const TOKEN = /<!--[\s\S]*?-->|<!\[CDATA\[([\s\S]*?)\]\]>|<\?[\s\S]*?\?>|<!DOCTYPE[^[>]*(?:\[[\s\S]*?\])?\s*>|<(\/)?([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/)?>|([^<]+)/g;
const ATTRIBUTO = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

// Nodo radice { nome, attr, figli, testo }; i nomi e gli attributi perdono il prefisso di namespace.
export function leggiXml(testo) {
  const radice = { nome: '#radice', attr: {}, figli: [], testo: '' };
  const pila = [radice];
  for (const m of String(testo).matchAll(TOKEN)) {
    const cima = pila.at(-1);
    if (m[1] !== undefined) cima.testo += m[1];
    else if (m[6] !== undefined) cima.testo += decodifica(m[6]);
    else if (m[3]) {
      const nome = senzaPrefisso(m[3]);
      if (m[2]) {
        if (pila.length < 2 || cima.nome !== nome) throw new Error('XML non valido');
        pila.pop();
      } else {
        const attr = {};
        for (const a of m[4].matchAll(ATTRIBUTO)) attr[senzaPrefisso(a[1])] = decodifica(a[2] ?? a[3]);
        const nodo = { nome, attr, figli: [], testo: '' };
        cima.figli.push(nodo);
        if (!m[5]) pila.push(nodo);
      }
    }
  }
  if (pila.length !== 1 || radice.figli.length !== 1) throw new Error('XML non valido');
  return radice.figli[0];
}

const figli = (n, nome) => (n?.figli ?? []).filter(f => f.nome === nome);
const primo = (n, nome) => figli(n, nome)[0];
const testoDi = (n, nome) => primo(n, nome)?.testo.trim() ?? '';

// Il servizio può rispondere con un'eccezione al posto delle capabilities: il suo testo è il motivo da mostrare.
function erroreDelServizio(radice) {
  if (!/Exception/.test(radice.nome)) return null;
  const nodi = [];
  const raccogli = n => { if (/^(ServiceException|ExceptionText)$/.test(n.nome)) nodi.push(n.testo.trim()); n.figli.forEach(raccogli); };
  raccogli(radice);
  return nodi.find(Boolean) ?? 'il servizio ha risposto con un errore';
}

const CRS_WEB = new Set(['EPSG:3857', 'EPSG:900913', 'EPSG:102100', 'EPSG:102113']);
const crsDi = n => [...figli(n, 'CRS'), ...figli(n, 'SRS')].flatMap(c => c.testo.trim().split(/\s+/)).filter(Boolean).map(s => s.toUpperCase());
function bboxDi(n) {
  const g = primo(n, 'EX_GeographicBoundingBox');
  const l = primo(n, 'LatLonBoundingBox');
  const v = g
    ? ['westBoundLongitude', 'southBoundLatitude', 'eastBoundLongitude', 'northBoundLatitude'].map(k => parseFloat(testoDi(g, k)))
    : l ? ['minx', 'miny', 'maxx', 'maxy'].map(k => parseFloat(l.attr[k])) : null;
  return v && v.every(Number.isFinite) ? v : null;
}

export function capabilitiesWms(testo) {
  const radice = leggiXml(testo);
  const errore = erroreDelServizio(radice);
  if (errore) throw new Error(errore);
  if (!/^(WMS_Capabilities|WMT_MS_Capabilities)$/.test(radice.nome)) throw new Error('l’indirizzo non è un servizio WMS');
  const cap = primo(radice, 'Capability');
  const formati = figli(primo(primo(cap, 'Request'), 'GetMap'), 'Format').map(f => f.testo.trim()).filter(Boolean);
  const layer = [];
  // Name = layer richiedibile; CRS e riquadro si ereditano dal gruppo che lo contiene
  const visita = (n, padre) => {
    const crs = new Set([...padre.crs, ...crsDi(n)]);
    const bbox = bboxDi(n) ?? padre.bbox;
    const nome = testoDi(n, 'Name');
    if (nome) layer.push({ nome, titolo: testoDi(n, 'Title') || nome, bbox, supportato: [...crs].some(c => CRS_WEB.has(c)) });
    for (const f of figli(n, 'Layer')) visita(f, { crs, bbox });
  };
  for (const l of figli(cap, 'Layer')) visita(l, { crs: new Set(), bbox: null });
  if (!layer.length) throw new Error('il servizio non ha nessun layer richiedibile');
  return { versione: radice.attr.version ?? '1.1.1', formato: formati.includes('image/png') ? 'image/png' : formati[0] ?? 'image/png', layer };
}

export function capabilitiesWfs(testo) {
  const radice = leggiXml(testo);
  const errore = erroreDelServizio(radice);
  if (errore) throw new Error(errore);
  if (radice.nome !== 'WFS_Capabilities') throw new Error('l’indirizzo non è un servizio WFS');
  const tipi = figli(primo(radice, 'FeatureTypeList'), 'FeatureType')
    .map(t => ({ nome: testoDi(t, 'Name'), titolo: testoDi(t, 'Title') }))
    .filter(t => t.nome)
    .map(t => ({ nome: t.nome, titolo: t.titolo || t.nome }));
  if (!tipi.length) throw new Error('il servizio non ha nessun tipo di dati');
  return { versione: radice.attr.version ?? '1.1.0', tipi };
}

// Il Worker accetta solo https: si rifiuta subito, con un messaggio che dice perché.
function url(testo) {
  let u;
  try { u = new URL(String(testo).trim()); } catch { throw new Error('indirizzo non valido'); }
  if (u.protocol !== 'https:') throw new Error('serve un indirizzo https');
  return u;
}

export function validaXyz(testo) {
  const u = String(testo).trim();
  url(u);
  for (const k of ['{z}', '{x}', '{y}']) if (!u.includes(k)) throw new Error(`l’indirizzo deve contenere ${k}`);
  return u;
}

const SENZA = ['service', 'request', 'version'];
function pulito(testo) {
  const u = url(testo);
  for (const k of [...u.searchParams.keys()]) if (SENZA.includes(k.toLowerCase())) u.searchParams.delete(k);
  return u;
}

export const urlBase = testo => pulito(testo).toString();

export function urlCapabilities(testo, servizio) {
  const u = pulito(testo);
  u.searchParams.set('SERVICE', servizio.toUpperCase());
  u.searchParams.set('REQUEST', 'GetCapabilities');
  return u.toString();
}

// bbox = [ovest, sud, est, nord] in WGS84. WFS 1.0.0 vuole lon/lat; dalla 1.1.0 l'asse di EPSG:4326 è lat/lon, e lo dice l'urn.
export function urlGetFeature(testo, { tipo, versione, bbox, max }) {
  const u = pulito(testo);
  const [w, s, e, n] = bbox;
  const v2 = versione.startsWith('2');
  const v10 = versione.startsWith('1.0');
  const imposta = (k, v) => u.searchParams.set(k, v);
  imposta('SERVICE', 'WFS');
  imposta('VERSION', versione);
  imposta('REQUEST', 'GetFeature');
  imposta(v2 ? 'typeNames' : 'typeName', tipo);
  imposta('outputFormat', 'application/json');
  imposta('srsName', 'EPSG:4326');
  imposta(v2 ? 'count' : 'maxFeatures', String(max));
  imposta('bbox', v10 ? `${w},${s},${e},${n},EPSG:4326` : `${s},${w},${n},${e},urn:ogc:def:crs:EPSG::4326`);
  return u.toString();
}
