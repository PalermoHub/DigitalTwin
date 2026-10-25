// Tooltip dei layer che si interrogano sul servizio (WMS con GetFeatureInfo, ArcGIS a immagine): ogni richiesta è una chiamata al
// server esterno, quindi parte solo quando il mouse si ferma (RITARDO_MS) e il risultato resta valido finché il cursore non si
// allontana (DISTANZA_PX). Il tooltip è sincrono: arrivata la risposta si rilancia un movimento del mouse per ridisegnarlo.
import { registraTooltip, disegnaVoceTooltip } from '../core/tooltip.js';

const COLORE = '#495057';
const RITARDO_MS = 180;
const DISTANZA_PX = 8;
const MAX_VOCI = 3;
const MAX_RIGHE = 3;

const interrogabile = l => l.visibile && !l.indisponibile && ((l.tipo === 'wms' && l.sorgente?.queryable !== false) || l.tipo === 'tile');

// Le voci della scheda (titolo, righe, fonte) che dicono qualcosa: quelle con solo «Esito» o una nota di errore si saltano.
export function vociDaMostrare(voci) {
  return voci.filter(v => !v.nota && v.gruppi?.[0]?.righe?.length && v.gruppi[0].righe[0].etichetta !== 'Esito');
}

function sezione(voci) {
  const corpo = document.createElement('div');
  corpo.className = 'strati-tooltip-corpo';
  for (const v of voci.slice(0, MAX_VOCI)) {
    const [prima, ...altre] = v.gruppi[0].righe;
    const voce = disegnaVoceTooltip({ titolo: v.titolo, icona: 'mappa', sezione: 'Layer aggiunto', colore: COLORE, sottotitolo: `${prima.etichetta}: ${prima.valore}` });
    for (const r of altre.slice(0, MAX_RIGHE - 1)) {
      const riga = document.createElement('div');
      riga.className = 'tooltip-riga';
      const etichetta = document.createElement('span');
      etichetta.textContent = r.etichetta;
      const valore = document.createElement('b');
      valore.textContent = r.valore;
      riga.append(etichetta, valore);
      voce.append(riga);
    }
    if (v.fonte) {
      const origine = document.createElement('small');
      origine.className = 'tooltip-origine';
      origine.textContent = v.fonte;
      voce.append(origine);
    }
    corpo.append(voce);
  }
  return corpo;
}

// interrogazione = creaInterrogazione([...]) di index.js (layerAlPunto, interroga)
export function collegaTooltipRemoto(map, interrogazione) {
  let ultimo = null; // { point, voci }
  let timer = null;
  let numero = 0;
  let sintetico = false;

  registraTooltip(map, e => {
    if (!ultimo || Math.hypot(e.point.x - ultimo.point.x, e.point.y - ultimo.point.y) > DISTANZA_PX) return null;
    return { contenuto: sezione(ultimo.voci), cursore: true, colore: COLORE };
  }, 3);

  map.on('mousemove', e => {
    if (sintetico) return;
    clearTimeout(timer);
    const { point, lngLat } = e;
    if (ultimo && Math.hypot(point.x - ultimo.point.x, point.y - ultimo.point.y) <= DISTANZA_PX) return; // già interrogato qui
    ultimo = null;
    numero += 1;
    const mio = numero;
    timer = setTimeout(async () => {
      const layers = interrogazione.layerAlPunto(lngLat).filter(interrogabile);
      if (!layers.length) return;
      let voci;
      try { voci = vociDaMostrare(await interrogazione.interroga(layers, lngLat, point, map.getZoom())); } catch { return; }
      if (mio !== numero || !voci.length) return; // il mouse si è mosso, o il servizio non dice nulla
      ultimo = { point, voci };
      sintetico = true;
      try { map.fire('mousemove', { point, lngLat, originalEvent: e.originalEvent }); } finally { sintetico = false; }
    }, RITARDO_MS);
  });
  map.on('mouseout', () => { clearTimeout(timer); numero += 1; ultimo = null; });
}
