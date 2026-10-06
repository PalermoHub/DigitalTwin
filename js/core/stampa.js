// Stampa dell'area di mappa visibile: foglio con titolo, immagine della mappa, legende dei layer accesi e attribuzioni.
export function attribuzioniUniche(testi) {
  return [...new Set(testi.map(t => (t ?? '').trim()).filter(Boolean))];
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

function el(tag, attr = {}, ...figli) {
  const nodo = Object.assign(document.createElement(tag), attr);
  nodo.append(...figli);
  return nodo;
}

function costruisciFoglio(map, immagine) {
  const canvas = map.getCanvas();
  const attribuzioni = attribuzioniUniche(
    [...document.querySelectorAll('#mappa .maplibregl-ctrl-attrib-inner')].map(a => a.textContent));
  const legende = document.getElementById('legende');
  const data = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  const c = map.getCenter();
  const foglio = el('div', { id: 'foglio-stampa' },
    el('style', { textContent: `@page { size: A4 ${orientamento(canvas.clientWidth, canvas.clientHeight)}; margin: 10mm; }` }),
    el('header', {}, el('h1', { textContent: 'Palermo Digital Twin' }),
      el('p', { textContent: `Stampa del ${data} · centro ${c.lat.toFixed(4)}, ${c.lng.toFixed(4)} · zoom ${map.getZoom().toFixed(1)}` })),
    el('img', { className: 'stampa-mappa', src: immagine, alt: 'Area di mappa visualizzata' }));
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

export function collegaStampa(map, bottone) {
  bottone.addEventListener('click', async () => {
    let immagine;
    try { immagine = await catturaMappa(map); } catch { return; }
    const foglio = costruisciFoglio(map, immagine);
    const pulisci = () => { foglio.remove(); document.body.classList.remove('stampa-mappa'); window.removeEventListener('afterprint', pulisci); };
    document.body.append(foglio);
    document.body.classList.add('stampa-mappa');
    window.addEventListener('afterprint', pulisci);
    window.print();
  });
}
