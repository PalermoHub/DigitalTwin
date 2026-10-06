// Stampa dell'area di mappa visibile: foglio con titolo, immagine della mappa, legende dei layer accesi e attribuzioni.
export function attribuzioniUniche(testi) {
  return [...new Set(testi.map(t => (t ?? '').trim()).filter(Boolean))];
}

const MM_PER_POLLICE = 25.4;
const DPI_CSS = 96;
const CIRCONFERENZA = 40075016.686;
// Area occupata dalla mappa su un foglio A4 orizzontale con margini di 10 mm (il resto serve a titolo, legenda e attribuzioni).
export const AREA_MAPPA_MM = { larghezza: 277, altezza: 125 };
export const SCALE_STAMPA = [1000, 2000, 5000, 10000, 25000];

export const mmInPx = mm => mm / MM_PER_POLLICE * DPI_CSS;

// Metri sul terreno per pixel CSS a un dato zoom MapLibre (mondo = 512 px × 2^zoom) e latitudine.
const metriPerPx = (zoom, lat) => CIRCONFERENZA * Math.cos(lat * Math.PI / 180) / (512 * 2 ** zoom);
// Denominatore di scala di una mappa vista a `zoom` e stampata a 96 dpi CSS: 1 px = 0,2646 mm di carta.
export const scalaDaZoom = (zoom, lat) => metriPerPx(zoom, lat) * DPI_CSS / MM_PER_POLLICE * 1000;
export const zoomPerScala = (lat, scala) => Math.log2(CIRCONFERENZA * Math.cos(lat * Math.PI / 180) * DPI_CSS / (512 * scala * MM_PER_POLLICE / 1000));

const LUNGHEZZE_BARRA = [10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000];
// Barra grafica: la lunghezza tonda più grande che sta in `maxMm` di carta.
export function barraScala(scala, maxMm) {
  const metri = LUNGHEZZE_BARRA.filter(m => m * 1000 / scala <= maxMm).pop() ?? LUNGHEZZE_BARRA[0];
  return { metri, mm: metri * 1000 / scala, etichetta: metri >= 1000 ? `${metri / 1000} km` : `${metri} m` };
}

export function orientamento(larghezza, altezza) {
  return larghezza >= altezza ? 'landscape' : 'portrait';
}

// Il canvas WebGL è leggibile solo durante il render: si forza un ridisegno e si cattura al primo evento «render».
function catturaMappa(map) {
  return new Promise((risolvi, rifiuta) => {
    map.once('render', () => {
      try { risolvi(map.getCanvas().toDataURL('image/png')); } catch (e) { rifiuta(e); }
    });
    map.triggerRepaint();
  });
}

// Cattura a una scala esatta: la mappa reale viene portata (di nascosto) alla dimensione del riquadro di stampa e allo zoom
// corrispondente, poi rimessa com'era. Così restano tutti i layer, senza ricostruire una seconda mappa.
async function catturaInScala(map, scala) {
  const contenitore = map.getContainer();
  const stile = contenitore.style.cssText;
  const vista = { center: map.getCenter(), zoom: map.getZoom(), bearing: map.getBearing(), pitch: map.getPitch() };
  const zoom = zoomPerScala(vista.center.lat, scala);
  try {
    contenitore.style.cssText = `${stile};position:fixed;left:0;top:0;width:${mmInPx(AREA_MAPPA_MM.larghezza)}px;height:${mmInPx(AREA_MAPPA_MM.altezza)}px;visibility:hidden;pointer-events:none`;
    map.resize();
    map.jumpTo({ center: vista.center, zoom, bearing: 0, pitch: 0 });
    await new Promise(risolvi => { // pronta quando i tile richiesti sono arrivati: loaded() e «idle» restano falsi finché esistono sorgenti di layer spenti mai caricate
      const fine = () => { clearTimeout(t); map.off('render', controlla); risolvi(); };
      const controlla = () => { if (map.areTilesLoaded()) fine(); };
      const t = setTimeout(fine, 12000);
      map.on('render', controlla); map.triggerRepaint();
    });
    return { immagine: await catturaMappa(map), centro: map.getCenter() };
  } finally {
    contenitore.style.cssText = stile;
    map.resize();
    map.jumpTo(vista);
  }
}

function el(tag, attr = {}, ...figli) {
  const nodo = Object.assign(document.createElement(tag), attr);
  nodo.append(...figli);
  return nodo;
}

// `scala` = denominatore (es. 5000) per la stampa in scala, null per la vista attuale.
function costruisciFoglio(map, immagine, { scala = null, centro = map.getCenter() } = {}) {
  const canvas = map.getCanvas();
  const attribuzioni = attribuzioniUniche(
    [...document.querySelectorAll('#mappa .maplibregl-ctrl-attrib-inner')].map(a => a.textContent));
  const legende = document.getElementById('legende');
  const data = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  const dettaglio = scala ? `scala 1:${scala.toLocaleString('it-IT')}` : `zoom ${map.getZoom().toFixed(1)}`;
  const direzione = scala ? 'landscape' : orientamento(canvas.clientWidth, canvas.clientHeight);
  const foglio = el('div', { id: 'foglio-stampa', className: scala ? 'in-scala' : '' },
    el('style', { textContent: `@page { size: A4 ${direzione}; margin: 10mm; }` }),
    el('header', {}, el('h1', { textContent: 'Palermo Digital Twin' }),
      el('p', { textContent: `Stampa del ${data} · centro ${centro.lat.toFixed(4)}, ${centro.lng.toFixed(4)} · ${dettaglio}` })),
    el('img', { className: 'stampa-mappa', src: immagine, alt: 'Area di mappa visualizzata' }));
  if (scala) {
    const barra = barraScala(scala, 60);
    foglio.append(el('div', { className: 'stampa-scala' },
      el('span', { className: 'stampa-scala-barra', style: `width:${barra.mm}mm` }),
      el('span', { textContent: `${barra.etichetta} · scala 1:${scala.toLocaleString('it-IT')} (stampare al 100%, senza adattare alla pagina)` })));
  }
  const copia = legende?.cloneNode(true);
  copia?.querySelectorAll('[hidden]').forEach(n => n.remove()); // restano solo le legende dei layer accesi
  if (copia?.textContent.trim()) {
    copia.removeAttribute('id');
    foglio.append(el('section', { className: 'stampa-legende' }, el('h2', { textContent: 'Legenda' }), copia));
  }
  if (attribuzioni.length) {
    foglio.append(el('footer', { className: 'stampa-attribuzioni' }, el('h2', { textContent: 'Fonti e attribuzioni' }), el('p', { textContent: attribuzioni.join(' · ') })));
  }
  return foglio;
}

// Il pulsante apre un piccolo menu: «Vista attuale» o una scala fissa. `menu` contiene il select #stampa-scala e il pulsante #stampa-vai.
export function collegaStampa(map, bottone, menu) {
  const scelta = menu.querySelector('#stampa-scala');
  const vai = menu.querySelector('#stampa-vai');
  scelta.replaceChildren(el('option', { value: '', textContent: 'Vista attuale (senza scala)' }),
    ...SCALE_STAMPA.map(n => el('option', { value: String(n), textContent: `Scala 1:${n.toLocaleString('it-IT')}` })));
  const chiudi = () => { menu.hidden = true; bottone.setAttribute('aria-expanded', 'false'); };
  bottone.setAttribute('aria-expanded', 'false');
  bottone.addEventListener('click', () => {
    menu.hidden = !menu.hidden;
    bottone.setAttribute('aria-expanded', String(!menu.hidden));
    if (!menu.hidden) scelta.focus();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { chiudi(); bottone.focus(); } });
  document.addEventListener('pointerdown', e => { if (!menu.hidden && !menu.contains(e.target) && !bottone.contains(e.target)) chiudi(); });

  vai.addEventListener('click', async () => {
    const scala = +scelta.value || null;
    vai.disabled = true;
    try {
      let esito;
      try { esito = scala ? await catturaInScala(map, scala) : { immagine: await catturaMappa(map), centro: map.getCenter() }; } catch (e) { console.error('Stampa: cattura della mappa non riuscita', e); return; }
      chiudi();
      const foglio = costruisciFoglio(map, esito.immagine, { scala, centro: esito.centro });
      const pulisci = () => { foglio.remove(); document.body.classList.remove('stampa-mappa'); window.removeEventListener('afterprint', pulisci); };
      document.body.append(foglio);
      document.body.classList.add('stampa-mappa');
      window.addEventListener('afterprint', pulisci);
      // il data URL va decodificato prima della stampa, altrimenti l'anteprima parte con l'immagine ancora vuota
      try { await foglio.querySelector('img').decode(); } catch { /* si stampa comunque */ }
      window.print();
    } finally { vai.disabled = false; }
  });
}
