// js/geoimage/pannello.js
// Il pannello Geoimage nella barra di destra: solo il markup, nell'ordine delle sezioni di Geoimage.
// Il comportamento sta nei moduli collega* (immagine, posizione, confronto, gcp, sessione, esporta); gli elementi si
// ritrovano per id (`#gi-<nome>`). Le sezioni con data-richiede="immagine" compaiono dopo aver caricato un'immagine.
const el = (tag, classe, testo) => {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
};

function bottone(id, testo, titolo, classe = '') {
  const b = el('button', `gi-btn ${classe}`.trim(), testo);
  b.type = 'button';
  b.id = `gi-${id}`;
  if (titolo) { b.title = titolo; b.setAttribute('aria-label', titolo); }
  return b;
}

const campo = (id, tipo, attributi = {}) => Object.assign(el('input'), { type: tipo, id: `gi-${id}`, ...attributi });
const riga = (...figli) => { const r = el('div', 'gi-riga'); r.append(...figli); return r; };
const nota = testo => el('p', 'gi-nota', testo);
const valore = (id, testo) => Object.assign(el('span', 'gi-valore', testo), { id: `gi-${id}` });

function intervallo(testo, id, min, max, iniziale, unita = '') {
  const l = el('label', 'gi-campo', testo);
  l.append(campo(id, 'range', { min, max, value: iniziale }), valore(`${id}-val`, `${iniziale}${unita}`));
  return l;
}

function selezione(id, titolo, opzioni) {
  const s = Object.assign(el('select'), { id: `gi-${id}` });
  s.setAttribute('aria-label', titolo);
  for (const [v, testo] of opzioni) s.append(Object.assign(el('option', null, testo), { value: v }));
  return s;
}

function sezione(titolo, figli, richiedeImmagine = true) {
  const s = el('section', 'gi-sezione');
  if (richiedeImmagine) { s.dataset.richiede = 'immagine'; s.hidden = true; }
  s.append(el('h3', null, titolo), ...figli);
  return s;
}

function sezioneImmagine() {
  const zona = bottone('zona', '', 'Carica una mappa storica', 'gi-zona');
  zona.append(el('strong', null, 'Carica mappa storica'), el('span', null, 'JPG · PNG · WEBP · BMP — oppure trascina qui'));
  const rimuovi = bottone('rimuovi', 'Rimuovi immagine', 'Toglie l\'immagine dalla mappa', 'gi-pericolo');
  rimuovi.hidden = true;
  return [
    sezione('Immagine storica', [zona, campo('file', 'file', { accept: 'image/*', hidden: true }), Object.assign(el('p', 'gi-info'), { id: 'gi-info' }), rimuovi], false),
    sezione('Opacità', [intervallo('Opacità', 'opacita', 0, 100, 70, '%')]),
  ];
}

function sezioneConfronto() {
  const swipe = bottone('swipe', 'Swipe', 'Linea scorrevole: a sinistra l\'immagine, a destra la mappa di base');
  const spotlight = bottone('spotlight', 'Spotlight', 'Cerchio che scopre la mappa di base sotto l\'immagine');
  const inverti = bottone('inverti', '⇄', 'Inverti lo Spotlight: l\'immagine si vede solo nel cerchio');
  [swipe, spotlight, inverti].forEach(b => b.setAttribute('aria-pressed', 'false'));
  return sezione('Confronto visivo', [riga(swipe, spotlight, inverti), intervallo('Raggio', 'raggio', 80, 600, 250)]);
}

function sezionePosizione() {
  const vuoto = () => el('span');
  const frecce = el('div', 'gi-frecce');
  frecce.append(
    vuoto(), bottone('su', '↑', 'Sposta su'), vuoto(),
    bottone('sinistra', '←', 'Sposta a sinistra'), bottone('adatta', '⌖', 'Zoom sull\'immagine'), bottone('destra', '→', 'Sposta a destra'),
    vuoto(), bottone('giu', '↓', 'Sposta giù'), vuoto(),
  );
  const blocca = bottone('blocca', 'Blocca (L)', 'Blocca o sblocca le maniglie');
  blocca.setAttribute('aria-pressed', 'false');
  return sezione('Posiziona overlay', [
    nota('Trascina le maniglie sulla mappa: il centro sposta, il punto in alto ruota, gli angoli scalano o deformano.'),
    frecce,
    riga(bottone('ruota-sx', '⟲ 5°', 'Ruota di 5° a sinistra'), bottone('ruota-dx', '⟳ 5°', 'Ruota di 5° a destra'), bottone('meno', '− 10%', 'Rimpicciolisci del 10%'), bottone('piu', '+ 10%', 'Ingrandisci del 10%')),
    riga(bottone('modo', 'Maniglie: scala', 'Cambia il comportamento degli angoli: scala proporzionale o deformazione libera'), blocca),
    riga(bottone('annulla', 'Annulla', 'Annulla (Ctrl+Z). Maiusc+clic: 10 passi'), bottone('ripeti', 'Ripeti', 'Ripeti (Ctrl+Y). Maiusc+clic: 10 passi'), bottone('reset', 'Reset', 'Riporta l\'immagine alla posizione iniziale', 'gi-pericolo')),
  ]);
}

function sezioneGcp() {
  const modo = bottone('gcp-modo', 'Aggiungi GCP (G)', 'Aggiungi un punto di controllo: un clic sull\'immagine, uno sulla mappa');
  modo.setAttribute('aria-pressed', 'false');
  const anteprima = Object.assign(el('div', 'gi-anteprima'), { id: 'gi-anteprima-box', hidden: true });
  anteprima.append(Object.assign(el('canvas'), { id: 'gi-anteprima' }), nota('Passo 1: clicca sull\'immagine sulla mappa · Passo 2: clicca la posizione reale sulla mappa'));
  const tabella = el('table', 'gi-tabella');
  const testata = el('tr');
  for (const t of ['#', 'Lat', 'Lon', 'Px', 'Py', 'Res (m)', '']) testata.append(el('th', null, t));
  const thead = el('thead');
  thead.append(testata);
  tabella.append(thead, Object.assign(el('tbody'), { id: 'gi-gcp-corpo' }));
  const rmse = Object.assign(el('p', 'gi-info'), { id: 'gi-rmse', hidden: true });
  rmse.append('RMSE: ', Object.assign(el('strong', null, '—'), { id: 'gi-rmse-val' }), ' m');
  const tipo = el('label', 'gi-campo', 'Trasformazione');
  tipo.append(selezione('tipo', 'Tipo di trasformazione', [['poly1', 'Affine (≥3 GCP)'], ['poly2', 'Polinomiale 2 (≥6 GCP)']]));
  const scorri = el('div', 'gi-scorri');
  scorri.append(tabella);
  const allinea = Object.assign(bottone('allinea', 'Allinea immagine ai GCP', 'Sposta l\'immagine nelle coordinate calcolate dai GCP', 'gi-primario'), { disabled: true });
  const svuota = Object.assign(bottone('gcp-svuota', 'Cancella tutti i GCP', 'Rimuove tutti i punti di controllo', 'gi-pericolo'), { disabled: true });
  return sezione('Ground Control Points', [modo, anteprima, Object.assign(el('p', 'gi-info', 'Nessun GCP inserito'), { id: 'gi-gcp-conteggio' }), scorri, rmse, tipo, allinea, svuota]);
}

function sezioneExport() {
  const kmz = bottone('kmz', 'KMZ', 'Per Google Earth, QGIS, ArcGIS: immagine incorporata', 'gi-primario');
  const geotiff = bottone('geotiff', 'GeoTIFF', 'Raster georeferenziato per QGIS, ArcGIS, GDAL', 'gi-primario');
  const qgis = bottone('qgis', 'GCP per QGIS (.points)', 'File dei GCP per il Georeferenziatore di QGIS', 'gi-primario');
  const mondo = bottone('mondo', 'World file', 'World file affine (richiede almeno 3 GCP)');
  const geojson = bottone('geojson', 'GCP GeoJSON', 'I punti di controllo in GeoJSON');
  const esporta = bottone('json-esporta', 'Esporta JSON', 'Salva immagine, posizione e GCP in un file');
  [kmz, geotiff, qgis, mondo, geojson, esporta].forEach(b => { b.disabled = true; });
  const gtiff = Object.assign(el('fieldset', 'gi-gtiff'), { id: 'gi-gtiff', hidden: true });
  const gruppo = (testo, controllo, id) => { const l = el('label', 'gi-campo gi-campo-colonna', testo); l.append(controllo); if (id) l.id = id; return l; };
  gtiff.append(
    el('legend', null, 'Impostazioni GeoTIFF'),
    gruppo('Sistema di riferimento', selezione('gtiff-sr', 'Sistema di riferimento', [['4326', 'EPSG:4326 — WGS 84'], ['32632', 'EPSG:32632 — UTM 32N'], ['32633', 'EPSG:32633 — UTM 33N'], ['3857', 'EPSG:3857 — Web Mercator']])),
    gruppo('Ricampionamento', selezione('gtiff-ricamp', 'Metodo di ricampionamento', [['bilinear', 'Bilineare (2×2)'], ['nearest', 'Vicino più prossimo']]), 'gi-gtiff-ricamp-gruppo'),
    gruppo('Risoluzione massima (lato lungo)', selezione('gtiff-max', 'Risoluzione massima', [['2000', '2000 px'], ['4000', '4000 px'], ['8000', '8000 px']])),
    gruppo('Compressione', selezione('gtiff-compr', 'Compressione', [['5', 'LZW (consigliata)'], ['1', 'Nessuna']])),
    Object.assign(nota(''), { id: 'gi-gtiff-nota' }),
    riga(bottone('gtiff-annulla', 'Annulla', 'Chiudi le impostazioni'), bottone('gtiff-vai', 'Esporta GeoTIFF', 'Crea il file GeoTIFF', 'gi-primario')),
  );
  gtiff.querySelector('#gi-gtiff-max').value = '4000';
  const importa = bottone('json-importa', 'Importa JSON', 'Apre un progetto salvato (anche quelli di Geoimage)');
  const mapwarper = Object.assign(el('a', 'gi-btn gi-link', 'MapWarper ↗'), { href: 'https://mapwarper.net/', target: '_blank', rel: 'noopener', title: 'Per georeferenziazioni più precise usa mapwarper.net' });
  return sezione('Export', [riga(kmz, geotiff), qgis, riga(mondo, geojson), gtiff, riga(esporta, importa), campo('json-file', 'file', { accept: '.json,application/json', hidden: true }), mapwarper], false);
}

export function creaPannello(elemento) {
  const testata = el('header', 'gi-testata');
  testata.append(el('h2', null, 'Geoimage · mappe storiche'));
  const autore = el('p', 'gi-autore', 'Georeferenzia una mappa storica sulla base di Palermo. Da ');
  const link = Object.assign(el('a', null, 'Geoimage'), { href: 'https://github.com/gbvitrano/Geoimage', target: '_blank', rel: 'noopener' });
  autore.append(link, ' di @gbvitrano.');
  const stato = Object.assign(el('p', 'gi-stato', 'Carica un\'immagine storica per iniziare.'), { id: 'gi-stato' });
  stato.setAttribute('role', 'status');
  const corpo = el('div', 'gi-corpo');
  corpo.append(...sezioneImmagine(), sezioneConfronto(), sezionePosizione(), sezioneGcp(), sezioneExport());
  elemento.replaceChildren(testata, autore, stato, corpo);
}
