// Service worker dell'app: visite ripetute immediate e interfaccia disponibile anche senza rete.
// Strategie (decise da `strategia`, provata nei test):
//  - pagina (navigazione): rete prima, con la copia salvata come ripiego;
//  - dati dell'app (cartella dati/): rete prima, copia salvata come ripiego (cambiano: colonnine ogni ora, distributori ogni giorno, incendi, PAI);
//  - file statici dell'app (js, css, immagini, caratteri): copia salvata subito e aggiornamento in secondo piano;
//  - PMTiles letti a intervalli di byte (Range) dai nostri host: ogni intervallo si salva come risposta intera sotto una
//    chiave propria e si rifà 206 al ritorno (la Cache API non salva le 206). Vale 24 ore, così non si riscarica ogni
//    10 minuti come impone GitHub Pages (max-age=600);
//  - tutto il resto (altri siti, POST, file interi pesanti): non si tocca.
// Per rilasciare una versione nuova basta cambiare VERSIONE: le cache vecchie si cancellano all'attivazione.
const VERSIONE = 'dt-v282';
const STATICA = `${VERSIONE}-statica`;
const DATI = `${VERSIONE}-dati`;
const INTERVALLI = `${VERSIONE}-intervalli`;

// Host che pubblicano i nostri PMTiles (oltre al sito stesso). Per un nuovo repo dati basta aggiungerlo qui.
const ORIGINI_INTERVALLI = ['https://gbvitrano.github.io', 'https://palermohub.github.io'];
const VALIDITA_INTERVALLI = 24 * 3600 * 1000; // dopo questo tempo si richiede alla rete (la copia scaduta serve solo offline)
const MAX_INTERVALLI = 1500;                  // voci conservate: oltre, si tolgono le più vecchie

const PRECACHE = [
  './', 'index.html', 'mappa.html', 'manifest.webmanifest', 'css/app.css', 'css/vendor/maplibre-gl.css',
  'js/vendor/maplibre-gl.js', 'js/vendor/pmtiles.js', 'js/app.js', 'js/avvio.js', 'js/i18n-pagina.js', 'js/core/i18n.js', 'js/locales/it.json', 'js/locales/en.json',
  'img/logo-palermo-digital-twin.svg', 'img/logo-palermo-digital-twin-scuro.svg', 'img/favicon.png', 'img/icona-192.png',
];

// Solo «bytes=inizio-fine»: con un intervallo aperto non si sa che parte del file arriverà.
function leggiIntervallo(testo) {
  const m = /^bytes=(\d+)-(\d+)$/.exec(testo ?? '');
  if (!m || Number(m[2]) < Number(m[1])) return null;
  return { inizio: Number(m[1]), fine: Number(m[2]) };
}

// 'ignora' | 'pagina' | 'dati' | 'statico' | 'intervalli'
function strategia(richiesta, origine) {
  if (richiesta.method !== 'GET') return 'ignora';
  const url = new URL(richiesta.url);
  const range = richiesta.headers.get('range');
  if (range) { // la Cache API non salva le 206: solo i PMTiles dei nostri host hanno un percorso a parte
    const nostro = url.origin === origine || ORIGINI_INTERVALLI.includes(url.origin);
    return nostro && /\.pmtiles$/.test(url.pathname) && leggiIntervallo(range) ? 'intervalli' : 'ignora';
  }
  if (url.origin !== origine) return 'ignora';
  if (richiesta.mode === 'navigate') return 'pagina';
  if (/\.pmtiles$|\.(mp4|webm|vtt)$/.test(url.pathname)) return 'ignora'; // file pesanti: sempre dalla rete, anche se dentro dati/
  if (/\/dati\//.test(url.pathname)) return 'dati';
  if (/\/locales\/[a-z]+\.json$/.test(url.pathname)) return 'dati'; // dizionari IT/EN: rete prima, devono andare di pari passo con il codice
  return 'statico';
}

async function salva(nomeCache, richiesta, risposta) {
  // solo risposte complete e riuscite: niente 206, niente errori
  if (!risposta || risposta.status !== 200 || risposta.type === 'opaque') return;
  const cache = await caches.open(nomeCache);
  await cache.put(richiesta, risposta);
}

async function reteProma(richiesta, nomeCache, ripiego) {
  try {
    const risposta = await fetch(richiesta);
    salva(nomeCache, richiesta, risposta.clone());
    return risposta;
  } catch (errore) {
    const copia = await caches.match(richiesta, { ignoreSearch: false });
    if (copia) return copia;
    if (ripiego) { const r = await caches.match(ripiego); if (r) return r; }
    throw errore;
  }
}

async function copiaPoiRete(richiesta, evento) {
  const copia = await caches.match(richiesta);
  const aggiorna = fetch(richiesta).then(risposta => { salva(STATICA, richiesta, risposta.clone()); return risposta; });
  if (copia) { evento.waitUntil(aggiorna.catch(() => {})); return copia; }
  return aggiorna;
}

// Chiave sintetica di una copia: stesso indirizzo del file + intervallo (la parte dopo # la Cache API la ignorerebbe)
const prefissoIntervalli = url => `${url}${url.includes('?') ? '&' : '?'}__intervallo=`;

async function rifaParziale(salvata, inizio) {
  const corpo = await salvata.arrayBuffer();
  const intestazioni = new Headers({
    'content-range': `bytes ${inizio}-${inizio + corpo.byteLength - 1}/${salvata.headers.get('x-sw-totale') || '*'}`,
    'content-length': String(corpo.byteLength), 'accept-ranges': 'bytes',
  });
  for (const k of ['content-type', 'etag']) if (salvata.headers.get(k)) intestazioni.set(k, salvata.headers.get(k));
  return new Response(corpo, { status: 206, headers: intestazioni });
}

async function salvaIntervallo(cache, url, chiave, risposta, ora, max) {
  const prefisso = prefissoIntervalli(url);
  const chiaveEtag = `${prefisso}etag`;
  const etag = risposta.headers.get('etag') || '';
  const prima = await cache.match(chiaveEtag);
  // il file è cambiato: le posizioni delle copie vecchie non valgono più
  if (prima && (await prima.text()) !== etag) for (const k of await cache.keys()) if (k.url.startsWith(prefisso)) await cache.delete(k);
  await cache.put(chiaveEtag, new Response(etag));
  const intestazioni = { 'x-sw-salvato': String(ora), 'x-sw-totale': (/\/(\d+)$/.exec(risposta.headers.get('content-range') ?? '') || [])[1] || '' };
  for (const k of ['content-type', 'etag']) if (risposta.headers.get(k)) intestazioni[k] = risposta.headers.get(k);
  await cache.put(chiave, new Response(await risposta.arrayBuffer(), { headers: intestazioni }));
  // le voci dell'ETag non si tolgono mai: servono a riconoscere un file cambiato
  const voci = (await cache.keys()).filter(k => !k.url.endsWith('__intervallo=etag'));
  for (const k of voci.slice(0, Math.max(0, voci.length - max))) await cache.delete(k);
}

async function intervalliPoiRete(richiesta, { ora = Date.now(), evento = null, max = MAX_INTERVALLI } = {}) {
  const { inizio, fine } = leggiIntervallo(richiesta.headers.get('range'));
  const cache = await caches.open(INTERVALLI);
  const chiave = `${prefissoIntervalli(richiesta.url)}${inizio}-${fine}`;
  const salvata = await cache.match(chiave);
  if (salvata && ora - Number(salvata.headers.get('x-sw-salvato')) < VALIDITA_INTERVALLI) return rifaParziale(salvata, inizio);
  let risposta;
  try { risposta = await fetch(richiesta); } catch (errore) {
    if (salvata) return rifaParziale(salvata, inizio); // offline: meglio una copia vecchia che niente
    throw errore;
  }
  if (risposta.status === 206) {
    const lavoro = salvaIntervallo(cache, richiesta.url, chiave, risposta.clone(), ora, max).catch(() => {}); // quota piena o simili: si prosegue senza copia
    if (evento) evento.waitUntil(lavoro); else await lavoro;
  }
  return risposta;
}

if (typeof self !== 'undefined' && self.addEventListener) {
  self.addEventListener('install', evento => {
    evento.waitUntil((async () => {
      const cache = await caches.open(STATICA);
      // un file mancante non deve impedire l'installazione
      await Promise.all(PRECACHE.map(u => cache.add(u).catch(() => {})));
      await self.skipWaiting();
    })());
  });

  self.addEventListener('activate', evento => {
    evento.waitUntil((async () => {
      for (const nome of await caches.keys()) if (!nome.startsWith(VERSIONE)) await caches.delete(nome);
      await self.clients.claim();
    })());
  });

  self.addEventListener('fetch', evento => {
    const tipo = strategia(evento.request, self.location.origin);
    if (tipo === 'ignora') return;
    if (tipo === 'pagina') evento.respondWith(reteProma(evento.request, STATICA, 'mappa.html'));
    else if (tipo === 'dati') evento.respondWith(reteProma(evento.request, DATI));
    else if (tipo === 'intervalli') evento.respondWith(intervalliPoiRete(evento.request, { evento }));
    else evento.respondWith(copiaPoiRete(evento.request, evento));
  });
}

if (typeof module !== 'undefined') module.exports = { strategia, VERSIONE, PRECACHE, leggiIntervallo, intervalliPoiRete };
