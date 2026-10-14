// Un solo tooltip sulla mappa. Confini, trasporto e sicurezza stradale registrano un «fornitore»: a ogni movimento del
// mouse ognuno dice cosa c'è sotto il cursore e il contenuto di tutti finisce in un unico riquadro, una sezione sotto
// l'altra, così i tooltip non si sovrappongono mai.
import { svgIcona } from './icone.js';

const fornitori = [];
let collegato = false;
let popup = null;
let abilitato = true; // interruttore nel pannello Layer: spento, sulla mappa non compare nessun tooltip
let mioCursore = false; // il cursore lo tocchiamo solo se l'abbiamo messo noi: monumenti e scuole hanno il loro «mano»

// fornitore(e) → { contenuto: Node, cursore?: boolean, esclusivo?: boolean } oppure null se sotto il cursore non c'è nulla.
// Le sezioni seguono `priorita` crescente (a parità, l'ordine di registrazione). Una sezione `esclusivo` (un oggetto 3D
// sopra la mappa, es. l'edificio per piani) nasconde le altre: quello che sta sotto il cursore è l'oggetto, non la mappa.
export function registraTooltip(map, fornitore, priorita = 0) {
  fornitori.push({ fornitore, priorita });
  fornitori.sort((a, b) => a.priorita - b.priorita);
  if (!collegato) { collegato = true; collega(map); }
}

export const tooltipAttivi = () => abilitato;
export function impostaTooltipAttivi(valore) {
  abilitato = !!valore;
  if (!abilitato) { popup?.remove(); popup = null; }
}

function nascondi(map) {
  popup?.remove();
  popup = null;
  if (mioCursore) { map.getCanvas().style.cursor = ''; mioCursore = false; }
}

// Il contenuto del tooltip per un punto della mappa ({ point, lngLat }, come un evento del mouse): lo usa anche la vista
// «Strati in 3D», che lo mostra sopra la pila. null se sotto il punto non c'è nulla.
export function contenutoTooltip(e) {
  let sezioni = fornitori.map(({ fornitore }) => fornitore(e)).filter(Boolean);
  if (!sezioni.length) return null;
  if (sezioni.some(s => s.esclusivo)) sezioni = sezioni.filter(s => s.esclusivo);
  const corpo = document.createElement('div');
  corpo.className = 'mappa-tooltip-corpo';
  for (const s of sezioni) {
    const sezione = document.createElement('div');
    sezione.className = 'mappa-tooltip-sezione';
    sezione.append(s.contenuto);
    corpo.append(sezione);
  }
  return { corpo, cursore: sezioni.some(s => s.cursore) };
}

function collega(map) {
  map.on('mousemove', e => {
    if (!abilitato) return;
    const tip = contenutoTooltip(e);
    if (!tip) return nascondi(map);
    if (tip.cursore) { map.getCanvas().style.cursor = 'pointer'; mioCursore = true; }
    else if (mioCursore) { map.getCanvas().style.cursor = ''; mioCursore = false; }
    const { corpo } = tip;
    popup ??= new maplibregl.Popup({ closeButton: false, closeOnClick: false, className: 'mappa-tooltip', anchor: 'top', offset: 14 });
    popup.setLngLat(e.lngLat).setDOMContent(corpo).addTo(map);
  });
  map.on('mouseout', () => nascondi(map));
}

const MAX_VOCI = 3;

// Una voce del tooltip: titolo in grassetto (con il pallino colorato se il modello ne ha uno), badge, poi il sottotitolo.
export function disegnaVoceTooltip(m) {
  const voce = document.createElement('div');
  const titolo = document.createElement('strong');
  if (m.pallino) {
    const pallino = document.createElement('span');
    pallino.className = 'tooltip-pallino';
    pallino.style.background = m.pallino;
    titolo.append(pallino);
  }
  if (m.icona && svgIcona(m.icona)) { // iconcina davanti al titolo, come nella scheda
    const i = document.createElement('span');
    i.className = 'tooltip-icona';
    i.innerHTML = svgIcona(m.icona, 14);
    titolo.append(i);
  }
  titolo.append(m.titolo);
  voce.append(titolo);
  if (m.badge?.testo) {
    const badge = document.createElement('span');
    badge.className = 'tooltip-badge';
    badge.textContent = m.badge.testo;
    badge.style.setProperty('--colore', m.badge.colore);
    voce.append(badge);
  }
  if (m.sottotitolo && m.sottotitolo !== m.titolo) {
    const dettaglio = document.createElement('div');
    dettaglio.textContent = m.sottotitolo;
    voce.append(dettaglio);
  }
  return voce;
}

// Tooltip per i layer con un modello di popup {titolo, sottotitolo, pallino?, badge?: {testo, colore}}: `gruppi` = [{ layers, modello(props), colore?(props, idLayer) }].
// `colore` dà il colore dell'attributo mostrato (lo stesso della legenda) se il modello non ha già un pallino. Si cerca solo
// negli strati accesi (a strato spento sulla mappa non c'è nulla da indicare); nel riquadro di ±4 px cadono anche i punti piccoli.
// i modelli di tooltip registrati, per layer: la vista «Strati in 3D» li riusa per descrivere ogni strato della pila
const modelli = [];
export const modelloTooltipDi = id => modelli.find(g => g.layers.includes(id))?.modello ?? null;

export function registraTooltipStrati(map, gruppi, priorita = 2) {
  modelli.push(...gruppi);
  const acceso = id => map.getLayer(id) && map.getLayoutProperty(id, 'visibility') === 'visible';
  registraTooltip(map, e => {
    const riquadro = [[e.point.x - 4, e.point.y - 4], [e.point.x + 4, e.point.y + 4]];
    const voci = new Map();
    for (const { layers, modello, icona, colore } of gruppi) {
      const attivi = layers.filter(acceso);
      if (!attivi.length) continue;
      for (const f of map.queryRenderedFeatures(riquadro, { layers: attivi })) {
        const m = modello(f.properties);
        if (m && !m.icona && icona) m.icona = icona;
        if (m && !m.pallino && colore) m.pallino = colore(f.properties, f.layer.id) ?? undefined; // il colore dell'attributo, come nella legenda
        if (m?.titolo) voci.set(`${m.titolo}\n${m.sottotitolo ?? ''}`, m);
      }
    }
    if (!voci.size) return null;
    const corpo = document.createElement('div');
    corpo.className = 'strati-tooltip-corpo';
    const mostrate = [...voci.values()];
    for (const m of mostrate.slice(0, MAX_VOCI)) corpo.append(disegnaVoceTooltip(m));
    if (mostrate.length > MAX_VOCI) {
      const altre = document.createElement('div');
      altre.className = 'strati-tooltip-altre';
      altre.textContent = `+ altri ${mostrate.length - MAX_VOCI}`;
      corpo.append(altre);
    }
    return { contenuto: corpo };
  }, priorita);
}
