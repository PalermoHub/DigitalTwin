// js/geoimage/maniglie.js
// Maniglie per posizionare l'immagine direttamente sulla mappa, come in Geoimage ma con i marker di MapLibre:
//   centro → sposta · punto sopra il lato nord → ruota · angoli → scala (proporzionale) o deforma (libera).
// Non conoscono l'overlay: leggono e scrivono i 4 angoli tramite `leggi`, `scrivi` e `alFine`, che le collegano allo stato.
import { centro, sposta, ruota, scalaDaAngolo, postoRotazione } from './geometria.js';
import { t } from '../core/i18n.js';

const copia = a => a.map(p => ({ lat: p.lat, lng: p.lng }));
const lngLat = p => [p.lng, p.lat];
const crea = classe => Object.assign(document.createElement('div'), { className: `gi-maniglia ${classe}` });
// angolo in gradi, orario a partire dal nord, di un punto dello schermo visto da `c`
const rotta = (c, p) => Math.atan2(p.x - c.x, -(p.y - c.y)) * 180 / Math.PI;
const normalizza = g => ((g + 540) % 360) - 180;

export function creaManiglie(map, { leggi, scrivi, alFine }) {
  let modo = 'scala'; // 'scala' | 'deforma'
  let attive = false; // il pannello è aperto
  let bloccate = false;
  let marcatori = [];

  function nuovo(elemento, punto) {
    // il clic su una maniglia non deve arrivare alla mappa (aprirebbe la Scheda)
    elemento.addEventListener('click', e => e.stopPropagation());
    const k = new maplibregl.Marker({ element: elemento, draggable: true }).setLngLat(lngLat(punto)).addTo(map);
    marcatori.push(k);
    return k;
  }

  function costruisci() {
    const a = leggi();
    // angoli
    a.forEach((p, i) => {
      const k = nuovo(crea(modo === 'scala' ? 'gi-angolo gi-scala' : 'gi-angolo gi-deforma'), p);
      let inizio = null;
      k.on('dragstart', () => { inizio = copia(leggi()); });
      k.on('drag', () => {
        if (!inizio) return;
        const { lat, lng } = k.getLngLat();
        scrivi(modo === 'scala' ? scalaDaAngolo(inizio, i, { lat, lng }) : inizio.map((q, j) => (j === i ? { lat, lng } : q)));
        riposiziona(k);
      });
      k.on('dragend', () => { inizio = null; riposiziona(); alFine(); });
    });
    // centro: sposta
    const kc = nuovo(Object.assign(crea('gi-centro'), { title: t('gi.maniglia.sposta') }), centro(a));
    let base = null, da = null;
    // MapLibre emette dragstart dopo il primo movimento: il punto di partenza è dove stava la maniglia, non dove si trova ora
    kc.on('dragstart', () => { base = copia(leggi()); da = centro(base); });
    kc.on('drag', () => {
      if (!base) return;
      const q = kc.getLngLat();
      scrivi(sposta(base, q.lat - da.lat, q.lng - da.lng));
      riposiziona(kc);
    });
    kc.on('dragend', () => { base = null; riposiziona(); alFine(); });
    // rotazione: l'angolo si misura sullo schermo, quindi funziona anche con la mappa ruotata o inclinata
    const kr = nuovo(Object.assign(crea('gi-rota'), { title: t('gi.maniglia.ruota') }), postoRotazione(a));
    let inizioRot = null, cs = null, a0 = 0;
    kr.on('dragstart', () => {
      inizioRot = copia(leggi());
      const c = centro(inizioRot);
      cs = map.project(lngLat(c));
      a0 = rotta(cs, map.project(lngLat(postoRotazione(inizioRot))));
    });
    kr.on('drag', () => {
      if (!inizioRot) return;
      scrivi(ruota(inizioRot, normalizza(rotta(cs, map.project(kr.getLngLat())) - a0)));
      riposiziona(kr);
    });
    kr.on('dragend', () => { inizioRot = null; riposiziona(); alFine(); });
  }

  // le maniglie seguono gli angoli; quella che si sta trascinando resta sotto il puntatore
  function riposiziona(tranne = null) {
    const a = leggi();
    if (!a || marcatori.length !== 6) return;
    const [k0, k1, k2, k3, kc, kr] = marcatori;
    [k0, k1, k2, k3].forEach((k, i) => { if (k !== tranne) k.setLngLat(lngLat(a[i])); });
    if (kc !== tranne) kc.setLngLat(lngLat(centro(a)));
    if (kr !== tranne) kr.setLngLat(lngLat(postoRotazione(a)));
  }

  function rimuovi() {
    marcatori.forEach(k => k.remove());
    marcatori = [];
  }

  function ricostruisci() {
    rimuovi();
    if (attive && !bloccate && leggi()) costruisci();
  }

  return {
    mostra() { attive = true; ricostruisci(); },
    nascondi() { attive = false; rimuovi(); },
    aggiorna: () => riposiziona(),
    ricostruisci,
    modo: () => modo,
    cambiaModo(nuovoModo) { modo = nuovoModo; ricostruisci(); },
    bloccate: () => bloccate,
    blocca(valore) { bloccate = valore; ricostruisci(); },
  };
}
