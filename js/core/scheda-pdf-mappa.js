// Mappa della scheda PDF: una seconda mappa fuori schermo, a dimensione fissa (3:2), con gli stessi livelli della mappa visibile,
// inquadrata sulla particella evidenziata (giallo, contorno nero). Non dipende da schermo, pannelli aperti o inclinazione.
import { areaMq, estremi, particellaUnica } from './scheda-pdf-geom.js';

const LARGHEZZA = 1200, ALTEZZA = 800;
const ATTESA_MAX = 20000;

// Le feature della particella nei tile già caricati (a mappa ferma sul punto, quelli del clic)
function pezzi(map, foglio, particella) {
  return map.querySourceFeatures('catasto', {
    sourceLayer: 'particelle',
    filter: ['all', ['==', ['to-string', ['get', 'Foglio']], String(foglio)], ['==', ['to-string', ['get', 'Paricella']], String(particella)]],
  });
}

// Ritorna { immagine (JPEG), ratio, area (m² o null) }, oppure null se la particella non è nei tile caricati
export async function mappaParticella(map, foglio, particella) {
  const trovate = pezzi(map, foglio, particella).filter(f => f.geometry && /Polygon/.test(f.geometry.type));
  if (!trovate.length) return null;
  const geom = particellaUnica(trovate);
  const area = geom ? areaMq(geom) : null;
  const [o, s, e, n] = estremi(trovate.map(f => f.geometry));

  const box = document.createElement('div');
  box.style.cssText = `position:fixed;left:-9999px;top:0;width:${LARGHEZZA}px;height:${ALTEZZA}px`;
  document.body.append(box);
  const stile = structuredClone(map.getStyle());
  delete stile.terrain; delete stile.sky; // il PDF è una pianta: niente rilievo né cielo
  const filtro = ['all', ['==', ['to-string', ['get', 'Foglio']], String(foglio)], ['==', ['to-string', ['get', 'Paricella']], String(particella)]];
  const copia = new globalThis.maplibregl.Map({
    container: box, style: stile, bounds: [[o, s], [e, n]], fitBoundsOptions: { padding: 120, maxZoom: 18.5 },
    interactive: false, attributionControl: false, pixelRatio: 1.5, canvasContextAttributes: { preserveDrawingBuffer: true },
  });
  try {
    // le icone aggiunte a mano alla mappa visibile (non stanno nello stile) si copiano al bisogno
    copia.on('styleimagemissing', ev => { const im = map.getImage(ev.id); if (im && !copia.hasImage(ev.id)) copia.addImage(ev.id, im.data, { pixelRatio: im.pixelRatio, sdf: im.sdf }); });
    const attendi = evento => new Promise(ok => { const t = setTimeout(ok, ATTESA_MAX); copia.once(evento, () => { clearTimeout(t); ok(); }); });
    await attendi('load');
    copia.addLayer({ id: 'pdf-particella', type: 'fill', source: 'catasto', 'source-layer': 'particelle', paint: { 'fill-color': '#ffff00', 'fill-opacity': 0.35 }, filter: filtro });
    copia.addLayer({ id: 'pdf-particella-linea', type: 'line', source: 'catasto', 'source-layer': 'particelle', paint: { 'line-color': '#000000', 'line-width': 4 }, filter: filtro });
    await attendi('idle');
    const src = copia.getCanvas();
    const out = document.createElement('canvas');
    out.width = src.width; out.height = src.height;
    const g = out.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, out.width, out.height);
    g.drawImage(src, 0, 0);
    return { immagine: out.toDataURL('image/jpeg', 0.85), ratio: out.height / out.width, area };
  } finally {
    copia.remove();
    box.remove();
  }
}
