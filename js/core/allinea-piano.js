// Vista 3D: cerchi, icone ed etichette restano dritti e «galleggiano» sulla verticale del punto 2D,
// come i segnaposto di un videogioco. Il sollevamento cresce con
// l'inclinazione (0 in 2D) ed è una traslazione dello schermo, quindi segue la mappa a ogni fotogramma.
// Le proprietà scritte dallo strato hanno la precedenza.
export const QUOTA_PX = 30; // altezza del galleggiamento a inclinazione 60°
const TRASLAZIONI = { circle: ['circle-translate'], symbol: ['icon-translate', 'text-translate'] };

export function sollevamento(pitch) {
  return -QUOTA_PX * Math.sin(Math.min(Math.max(pitch, 0), 60) * Math.PI / 180) / Math.sin(Math.PI / 3);
}

export function allineaLayerAlPiano(map) {
  const aggiungi = map.addLayer.bind(map);
  const layers = new Map();
  const solleva = (id, tipo) => {
    const y = sollevamento(map.getPitch());
    try { for (const p of TRASLAZIONI[tipo]) map.setPaintProperty(id, p, [0, y]); } catch { /* strato non pronto: il prossimo beccheggio lo sistema */ }
  };
  map.addLayer = (layer, prima) => {
    const r = aggiungi(layer, prima);
    const props = TRASLAZIONI[layer?.type];
    if (props && layer.id && !props.some(p => layer.paint?.[p])) {
      layers.set(layer.id, layer.type);
      if (map.getPitch() > 0) solleva(layer.id, layer.type);
    }
    return r;
  };
  map.on('pitch', () => { for (const [id, tipo] of layers) if (map.getLayer(id)) solleva(id, tipo); });
  return map;
}
