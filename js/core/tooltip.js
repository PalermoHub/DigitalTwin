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
