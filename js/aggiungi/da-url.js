// js/aggiungi/da-url.js
// Un file da un indirizzo https (anche un foglio Google condiviso): si riscrive l'indirizzo, si scarica dal proxy CORS e si
// restituisce un oggetto simile a File, che importaFile() legge come uno scelto dal computer. Nessun DOM, la rete è iniettata.
import { ESTENSIONI } from '../rndt/importa.js';
import { t } from '../core/i18n.js';

const DA_TIPO = [
  [/geo\+json/i, '.geojson'], [/json/i, '.json'], [/csv/i, '.csv'], [/kmz/i, '.kmz'], [/kml/i, '.kml'],
  [/gpx/i, '.gpx'], [/zip/i, '.zip'],
];
const estensione = nome => (nome.match(/\.[^./\\]+$/)?.[0] ?? '').toLowerCase();

// Indirizzo incollato → indirizzo da scaricare. `foglio` dice che ci si aspetta un CSV da Google Sheets.
export function normalizzaUrl(testo) {
  let u;
  try { u = new URL(String(testo).trim()); } catch { throw new Error(t('err.indirizzo')); }
  if (u.protocol !== 'https:') throw new Error('serve un indirizzo https');
  const sheets = u.hostname === 'docs.google.com' && u.pathname.match(/^\/spreadsheets\/d\/([\w-]+)/);
  if (sheets && sheets[1] === 'e') return { url: u.href, nome: 'foglio-pubblicato.csv', foglio: true }; // «Pubblica sul web»: è già un CSV
  if (sheets) {
    const gid = u.searchParams.get('gid') ?? u.hash.match(/gid=(\d+)/)?.[1];
    const url = `https://docs.google.com/spreadsheets/d/${sheets[1]}/export?format=csv${gid ? `&gid=${gid}` : ''}`;
    return { url, nome: `foglio-${sheets[1]}.csv`, foglio: true };
  }
  const drive = u.hostname === 'drive.google.com' && u.pathname.match(/^\/file\/d\/([\w-]+)/);
  if (drive) return { url: `https://drive.google.com/uc?export=download&id=${drive[1]}`, nome: `file-${drive[1]}`, foglio: false };
  let ultimo = u.pathname.split('/').filter(Boolean).pop() ?? u.hostname;
  try { ultimo = decodeURIComponent(ultimo); } catch { /* resta com'è */ }
  return { url: u.href, nome: ultimo, foglio: false };
}

// `<proxy>/t/<host>/<percorso>?<query>`: la forma che il Worker si aspetta
export function urlViaProxy(proxy, url) {
  const u = new URL(url);
  return `${String(proxy).replace(/\/$/, '')}/t/${u.host}${u.pathname}${u.search}`;
}

export async function scaricaComeFile(testo, proxy, fetchFn = fetch) {
  const { url, nome, foglio } = normalizzaUrl(testo);
  let r;
  try { r = await fetchFn(urlViaProxy(proxy, url), { headers: { accept: '*/*' } }); } catch { throw new Error(t('err.raggiungere')); }
  if (r.status === 413) throw new Error(t('err.supera10'));
  if (foglio && [401, 403, 404].includes(r.status)) throw new Error('foglio non trovato o non condiviso: condividilo con «chiunque abbia il link»');
  if (!r.ok) throw new Error(`il server ha risposto ${r.status}`);
  const tipo = r.headers.get('content-type') ?? '';
  if (/text\/html/i.test(tipo)) {
    throw new Error(foglio ? t('err.foglioNonLeggibile') : t('err.paginaWeb'));
  }
  const buffer = await r.arrayBuffer();
  const daTipo = DA_TIPO.find(([re]) => re.test(tipo))?.[1];
  const name = ESTENSIONI.includes(estensione(nome)) || !daTipo ? nome : nome + daTipo;
  return { name, arrayBuffer: async () => buffer, text: async () => new TextDecoder().decode(buffer) };
}
