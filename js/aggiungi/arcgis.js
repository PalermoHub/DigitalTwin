// js/aggiungi/arcgis.js
// ArcGIS REST (MapServer e FeatureServer): indirizzo, descrizione del servizio e URL di immagini, tile e query.
// Moduli puri, senza DOM né rete. Il token non entra mai negli URL costruiti qui: si aggiunge alla richiesta a runtime.
import { t as tr } from '../core/i18n.js';

const ORIGINE = 20037508.342787;
const WEB = [3857, 102100, 102113, 900913];

export function leggiUrlArcgis(testo) {
  let u;
  try { u = new URL(String(testo).trim()); } catch { throw new Error(tr('err.indirizzo')); }
  if (u.protocol !== 'https:') throw new Error('serve un indirizzo https');
  const m = u.pathname.match(/^(.*\/(MapServer|FeatureServer))(?:\/(\d+))?\/?$/i);
  if (!m) throw new Error(tr('err.arcgisFinire'));
  return {
    base: `${u.origin}${m[1]}`,
    tipo: m[2].toLowerCase() === 'mapserver' ? 'MapServer' : 'FeatureServer',
    layerId: m[3] === undefined ? null : Number(m[3]),
    token: u.searchParams.get('token') || null,
  };
}

export const urlInfo = ({ base, layerId }) => `${base}${layerId === null ? '' : `/${layerId}`}?f=json`;

// una cache a tile si usa come XYZ solo se ha la piramide Web Mercator standard che parte dal livello 0
function cacheUtilizzabile(j) {
  const t = j.tileInfo;
  if (!j.singleFusedMapCache || !t) return false;
  const wkid = t.spatialReference?.latestWkid ?? t.spatialReference?.wkid;
  return WEB.includes(wkid) && t.rows === 256 && t.cols === 256
    && Math.abs((t.origin?.x ?? 0) + ORIGINE) < 2 && Math.abs((t.origin?.y ?? 0) - ORIGINE) < 2
    && Array.isArray(t.lods) && t.lods.length > 0 && t.lods.every((l, i) => l.level === i);
}

export function descriviArcgis(json, { tipo, layerId }) {
  if (json?.error) {
    const e = json.error;
    if (e.code === 498 || e.code === 499) throw new Error('il servizio richiede un token valido: aggiungilo all’indirizzo (…?token=…)');
    throw new Error(e.message || tr('err.risposta'));
  }
  if (layerId !== null) {
    if (json?.id === undefined || !json.name) throw new Error(tr('err.noArcgis'));
    return { tipo, cache: false, layer: [{ id: json.id, nome: json.name, vettoriale: Boolean(json.geometryType) }] };
  }
  if (!Array.isArray(json?.layers)) throw new Error(tr('err.noArcgis'));
  // i gruppi (con sotto-layer) non si interrogano: contano solo le foglie
  const layer = json.layers.filter(l => !l.subLayerIds?.length).map(l => ({ id: l.id, nome: l.name, vettoriale: true })); // le foglie di un MapServer (tabelle escluse) e i layer di un FeatureServer si interrogano con query
  if (!layer.length) throw new Error(tr('err.nessunLayer'));
  return { tipo, cache: tipo === 'MapServer' && cacheUtilizzabile(json), layer };
}

// i segnaposto {bbox-epsg-3857}, {z}, {y}, {x} li sostituisce MapLibre: URL scritti a mano, non con URLSearchParams
export const urlExport = (base, id) => `${base}/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png32&transparent=true&dpi=96&layers=${encodeURIComponent(`show:${id}`)}&f=image`;
export const urlTileCache = base => `${base}/tile/{z}/{y}/{x}`;

// bbox = [ovest, sud, est, nord] in WGS84; i dati arrivano come GeoJSON in WGS84
export function urlQuery(base, id, bbox, max) {
  const u = new URL(`${base}/${id}/query`);
  for (const [k, v] of [['where', '1=1'], ['geometry', bbox.join(',')], ['geometryType', 'esriGeometryEnvelope'], ['inSR', '4326'], ['spatialRel', 'esriSpatialRelIntersects'],
    ['outFields', '*'], ['outSR', '4326'], ['returnGeometry', 'true'], ['f', 'geojson'], ['resultRecordCount', String(max)]]) u.searchParams.set(k, v);
  return u.toString();
}
