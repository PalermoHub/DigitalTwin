// Service worker dell'app: visite ripetute immediate e interfaccia disponibile anche senza rete.
// Strategie (decise da `strategia`, provata nei test):
//  - pagina (navigazione): rete prima, con la copia salvata come ripiego;
//  - dati dell'app (cartella dati/): rete prima, copia salvata come ripiego (cambiano: colonnine ogni ora, incendi, PAI);
//  - file statici dell'app (js, css, immagini, caratteri): copia salvata subito e aggiornamento in secondo piano;
//  - tutto il resto (altri siti, tile con richieste a intervalli di byte, POST): non si tocca.
// Per rilasciare una versione nuova basta cambiare VERSIONE: le cache vecchie si cancellano all'attivazione.
const VERSIONE = 'dt-v66';
const STATICA = `${VERSIONE}-statica`;
const DATI = `${VERSIONE}-dati`;

const PRECACHE = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css', 'css/vendor/maplibre-gl.css',
  'js/vendor/maplibre-gl.js', 'js/vendor/pmtiles.js', 'js/app.js', 'js/avvio.js', 'js/i18n-pagina.js', 'js/core/i18n.js', 'js/locales/it.json', 'js/locales/en.json',
  'img/logo-palermo-digital-twin.svg', 'img/logo-palermo-digital-twin-scuro.svg', 'img/favicon.png', 'img/icona-192.png',
];

// 'ignora' | 'pagina' | 'dati' | 'statico'
function strategia(richiesta, origine) {
  if (richiesta.method !== 'GET') return 'ignora';
  if (richiesta.headers.get('range')) return 'ignora'; // PMTiles e video: la Cache API non salva le risposte parziali
  const url = new URL(richiesta.url);
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
    if (tipo === 'pagina') evento.respondWith(reteProma(evento.request, STATICA, 'index.html'));
    else if (tipo === 'dati') evento.respondWith(reteProma(evento.request, DATI));
    else evento.respondWith(copiaPoiRete(evento.request, evento));
  });
}

if (typeof module !== 'undefined') module.exports = { strategia, VERSIONE, PRECACHE };
