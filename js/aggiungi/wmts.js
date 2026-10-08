// js/aggiungi/wmts.js
// WMTS: le capabilities diventano layer con un URL XYZ. Si accetta solo la piramide «Google Maps» (EPSG:3857, tile 256,
// origine in alto a sinistra) perché è quella che MapLibre sa disegnare coi suoi tile XYZ.
// Moduli puri, senza DOM né rete.
import { leggiXml, figli, primo, testoDi, erroreDelServizio, urlBase } from './servizi.js';
import { t } from '../core/i18n.js';

const ORIGINE = 20037508.342789244;
const CRS_WEB = /(3857|900913|102100|102113)(?!\d)/;

const numeri = testo => String(testo ?? '').trim().split(/\s+/).map(Number);

// Il prefisso degli identificatori di matrice (es. «», «EPSG:3857:», «wm») se l'insieme è una piramide Web Mercator
// compatibile con lo schema XYZ (identificatore = prefisso + livello, livelli 0, 1, 2… in ordine di scala), altrimenti null.
export function prefissoWebMercator(insieme) {
  if (!insieme || !CRS_WEB.test(testoDi(insieme, 'SupportedCRS'))) return null;
  const matrici = [...figli(insieme, 'TileMatrix')].sort((a, b) => parseFloat(testoDi(b, 'ScaleDenominator')) - parseFloat(testoDi(a, 'ScaleDenominator')));
  if (!matrici.length) return null;
  let prefisso = null;
  for (let i = 0; i < matrici.length; i++) {
    const m = matrici[i];
    const [x, y] = numeri(testoDi(m, 'TopLeftCorner'));
    if (Number(testoDi(m, 'TileWidth')) !== 256 || Number(testoDi(m, 'TileHeight')) !== 256) return null;
    if (Math.abs(x + ORIGINE) > 2 || Math.abs(y - ORIGINE) > 2) return null;
    if (i === 0 && (Number(testoDi(m, 'MatrixWidth')) !== 1 || Number(testoDi(m, 'MatrixHeight')) !== 1)) return null;
    const id = testoDi(m, 'Identifier').match(/^(.*?)(\d+)$/);
    if (!id || id[2] !== String(i)) return null; // «01» o un livello che non coincide con la posizione: non si può scrivere come {z}
    if (prefisso === null) prefisso = id[1];
    else if (prefisso !== id[1]) return null;
  }
  return prefisso;
}

function bboxWgs84(n) {
  if (!n) return null;
  const v = [...numeri(testoDi(n, 'LowerCorner')), ...numeri(testoDi(n, 'UpperCorner'))];
  return v.length === 4 && v.every(Number.isFinite) ? v : null;
}

// l'indirizzo dell'operazione GetTile, se è https e dello stesso host del servizio (altrimenti quello del servizio)
function baseGetTile(radice, urlServizio) {
  const servizio = urlBase(urlServizio);
  const operazione = figli(primo(radice, 'OperationsMetadata'), 'Operation').find(o => o.attr.name === 'GetTile');
  const get = primo(primo(primo(operazione, 'DCP'), 'HTTP'), 'Get');
  try {
    const href = new URL(get?.attr.href);
    if (href.protocol === 'https:' && href.host === new URL(servizio).host) return urlBase(href.href);
  } catch { /* nessun GetTile utilizzabile */ }
  return servizio;
}

const graffe = /\{([^}]+)\}/g;

function descriviLayer(n, insiemi, base) {
  const nome = testoDi(n, 'Identifier');
  if (!nome) return null;
  const titolo = testoDi(n, 'Title') || nome;
  const bbox = bboxWgs84(primo(n, 'WGS84BoundingBox'));
  const nonSupportato = { nome, titolo, bbox, supportato: false, tile: null };

  const formati = figli(n, 'Format').map(f => f.testo.trim()).filter(f => f.startsWith('image/'));
  const formato = formati.includes('image/png') ? 'image/png' : formati[0] ?? 'image/png';
  const stili = figli(n, 'Style');
  const stile = testoDi(stili.find(s => s.attr.isDefault === 'true') ?? stili[0], 'Identifier') || 'default';
  const scelta = figli(n, 'TileMatrixSetLink').map(l => testoDi(l, 'TileMatrixSet'))
    .map(id => ({ id, prefisso: prefissoWebMercator(insiemi.get(id)) })).find(x => x.prefisso !== null);
  if (!scelta) return nonSupportato;
  const matrice = `${scelta.prefisso}{z}`;

  const risorsa = figli(n, 'ResourceURL').find(r => r.attr.resourceType === 'tile' && r.attr.format === formato)
    ?? figli(n, 'ResourceURL').find(r => r.attr.resourceType === 'tile');
  if (risorsa?.attr.template) {
    const dimensioni = new Map(figli(n, 'Dimension').map(d => [testoDi(d, 'Identifier'), testoDi(d, 'Default')]));
    const noti = { Style: stile, TileMatrixSet: scelta.id, TileMatrix: matrice, TileRow: '{y}', TileCol: '{x}' };
    let sconosciuto = false;
    const tile = risorsa.attr.template.replace(graffe, (m, k) => {
      if (k in noti) return noti[k];
      if (dimensioni.get(k)) return dimensioni.get(k);
      sconosciuto = true;
      return m;
    });
    return sconosciuto ? nonSupportato : { nome, titolo, bbox, supportato: true, tile };
  }
  // senza ResourceURL: GetTile in KVP, con i segnaposto scritti a mano (URLSearchParams li codificherebbe)
  const u = new URL(base);
  for (const [k, v] of [['SERVICE', 'WMTS'], ['REQUEST', 'GetTile'], ['VERSION', '1.0.0'], ['LAYER', nome], ['STYLE', stile], ['TILEMATRIXSET', scelta.id], ['FORMAT', formato]]) u.searchParams.set(k, v);
  return { nome, titolo, bbox, supportato: true, tile: `${u}&TILEMATRIX=${encodeURIComponent(scelta.prefisso)}{z}&TILEROW={y}&TILECOL={x}` };
}

export function capabilitiesWmts(testo, urlServizio) {
  const radice = leggiXml(testo);
  const errore = erroreDelServizio(radice);
  if (errore) throw new Error(errore);
  if (radice.nome !== 'Capabilities' || !/WMTS/i.test(testoDi(primo(radice, 'ServiceIdentification'), 'ServiceType'))) throw new Error(t('err.noWmts'));
  const contenuti = primo(radice, 'Contents');
  const insiemi = new Map(figli(contenuti, 'TileMatrixSet').map(s => [testoDi(s, 'Identifier'), s]));
  const base = baseGetTile(radice, urlServizio);
  const layer = figli(contenuti, 'Layer').map(n => descriviLayer(n, insiemi, base)).filter(Boolean);
  if (!layer.length) throw new Error(t('err.nessunLayer'));
  return { versione: radice.attr.version ?? '1.0.0', layer };
}
