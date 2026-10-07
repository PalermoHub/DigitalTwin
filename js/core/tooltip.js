// Un solo tooltip sulla mappa. Confini, trasporto e sicurezza stradale registrano un «fornitore»: a ogni movimento del
// mouse ognuno dice cosa c'è sotto il cursore e il contenuto di tutti finisce in un unico riquadro, una sezione sotto
// l'altra, così i tooltip non si sovrappongono mai.
const fornitori = [];
let collegato = false;
let popup = null;
let mioCursore = false; // il cursore lo tocchiamo solo se l'abbiamo messo noi: monumenti e scuole hanno il loro «mano»

// fornitore(e) → { contenuto: Node, cursore?: boolean } oppure null se sotto il cursore non c'è nulla.
// Le sezioni seguono `priorita` crescente (a parità, l'ordine di registrazione).
export function registraTooltip(map, fornitore, priorita = 0) {
  fornitori.push({ fornitore, priorita });
  fornitori.sort((a, b) => a.priorita - b.priorita);
  if (!collegato) { collegato = true; collega(map); }
}

function nascondi(map) {
  popup?.remove();
  popup = null;
  if (mioCursore) { map.getCanvas().style.cursor = ''; mioCursore = false; }
}

function collega(map) {
  map.on('mousemove', e => {
    const sezioni = fornitori.map(({ fornitore }) => fornitore(e)).filter(Boolean);
    if (!sezioni.length) return nascondi(map);
    if (sezioni.some(s => s.cursore)) { map.getCanvas().style.cursor = 'pointer'; mioCursore = true; }
    else if (mioCursore) { map.getCanvas().style.cursor = ''; mioCursore = false; }
    const corpo = document.createElement('div');
    corpo.className = 'mappa-tooltip-corpo';
    for (const s of sezioni) {
      const sezione = document.createElement('div');
      sezione.className = 'mappa-tooltip-sezione';
      sezione.append(s.contenuto);
      corpo.append(sezione);
    }
    popup ??= new maplibregl.Popup({ closeButton: false, closeOnClick: false, className: 'mappa-tooltip', anchor: 'top', offset: 14 });
    popup.setLngLat(e.lngLat).setDOMContent(corpo).addTo(map);
  });
  map.on('mouseout', () => nascondi(map));
}

const MAX_VOCI = 3;

// Tooltip per i layer con un modello di popup {titolo, sottotitolo}: `gruppi` = [{ layers, modello(props) }]. Si cerca solo
// negli strati accesi (a strato spento sulla mappa non c'è nulla da indicare); nel riquadro di ±4 px cadono anche i punti piccoli.
export function registraTooltipStrati(map, gruppi, priorita = 2) {
  const acceso = id => map.getLayer(id) && map.getLayoutProperty(id, 'visibility') === 'visible';
  registraTooltip(map, e => {
    const riquadro = [[e.point.x - 4, e.point.y - 4], [e.point.x + 4, e.point.y + 4]];
    const voci = new Map();
    for (const { layers, modello } of gruppi) {
      const attivi = layers.filter(acceso);
      if (!attivi.length) continue;
      for (const f of map.queryRenderedFeatures(riquadro, { layers: attivi })) {
        const m = modello(f.properties);
        if (m?.titolo) voci.set(`${m.titolo}\n${m.sottotitolo ?? ''}`, m);
      }
    }
    if (!voci.size) return null;
    const corpo = document.createElement('div');
    corpo.className = 'strati-tooltip-corpo';
    const mostrate = [...voci.values()];
    for (const m of mostrate.slice(0, MAX_VOCI)) {
      const voce = document.createElement('div');
      const titolo = document.createElement('strong');
      titolo.textContent = m.titolo;
      voce.append(titolo);
      if (m.sottotitolo && m.sottotitolo !== m.titolo) {
        const dettaglio = document.createElement('div');
        dettaglio.textContent = m.sottotitolo;
        voce.append(dettaglio);
      }
      corpo.append(voce);
    }
    if (mostrate.length > MAX_VOCI) {
      const altre = document.createElement('div');
      altre.className = 'strati-tooltip-altre';
      altre.textContent = `+ altri ${mostrate.length - MAX_VOCI}`;
      corpo.append(altre);
    }
    return { contenuto: corpo };
  }, priorita);
}
