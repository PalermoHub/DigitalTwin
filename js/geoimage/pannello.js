// js/geoimage/pannello.js
// Il pannello Geoimage nella barra di destra: solo il markup, nell'ordine delle sezioni di Geoimage.
// Il comportamento sta nei moduli collega* (immagine, posizione, confronto, gcp, sessione, esporta); gli elementi si
// ritrovano per id (`#gi-<nome>`). Le sezioni con data-richiede="immagine" compaiono dopo aver caricato un'immagine.
import { svgIcona } from '../core/icone.js';
import { t as tr } from '../core/i18n.js';

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
  const zona = bottone('zona', '', tr('gi.zona.tip'), 'gi-zona');
  zona.append(el('strong', null, tr('gi.zona')), el('span', null, tr('gi.zona.formati')));
  const rimuovi = bottone('rimuovi', tr('gi.rimuovi'), tr('gi.rimuovi.tip'), 'gi-pericolo');
  rimuovi.hidden = true;
  return [
    sezione(tr('gi.sez.immagine'), [zona, campo('file', 'file', { accept: 'image/*', hidden: true }), Object.assign(el('p', 'gi-info'), { id: 'gi-info' }), rimuovi], false),
    sezione(tr('pannello.opacita'), [intervallo(tr('pannello.opacita'), 'opacita', 0, 100, 70, '%')]),
  ];
}

function sezioneConfronto() {
  const swipe = bottone('swipe', 'Swipe', tr('gi.swipe.tip'));
  const spotlight = bottone('spotlight', 'Spotlight', tr('gi.spotlight.tip'));
  const inverti = bottone('inverti', '⇄', tr('gi.inverti.tip'));
  [swipe, spotlight, inverti].forEach(b => b.setAttribute('aria-pressed', 'false'));
  return sezione(tr('gi.sez.confronto'), [riga(swipe, spotlight, inverti), intervallo(tr('gi.raggio'), 'raggio', 80, 600, 250)]);
}

function sezionePosizione() {
  const vuoto = () => el('span');
  const frecce = el('div', 'gi-frecce');
  frecce.append(
    vuoto(), bottone('su', '↑', tr('gi.su')), vuoto(),
    bottone('sinistra', '←', tr('gi.sinistra')), bottone('adatta', '⌖', tr('gi.zoomImmagine')), bottone('destra', '→', tr('gi.destra')),
    vuoto(), bottone('giu', '↓', tr('gi.giu')), vuoto(),
  );
  const blocca = bottone('blocca', tr('gi.blocca'), tr('gi.blocca.tip'));
  blocca.setAttribute('aria-pressed', 'false');
  return sezione(tr('gi.sez.posiziona'), [
    nota(tr('gi.nota.maniglie')),
    frecce,
    riga(bottone('ruota-sx', '⟲ 5°', tr('gi.ruotaSx')), bottone('ruota-dx', '⟳ 5°', tr('gi.ruotaDx')), bottone('meno', '− 10%', tr('gi.meno')), bottone('piu', '+ 10%', tr('gi.piu'))),
    riga(bottone('modo', tr('gi.maniglie.scala'), tr('gi.maniglie.tip')), blocca),
    riga(bottone('annulla', tr('gi.annulla'), tr('gi.annulla.tip')), bottone('ripeti', tr('gi.ripeti'), tr('gi.ripeti.tip')), bottone('reset', 'Reset', tr('gi.reset.tip'), 'gi-pericolo')),
  ]);
}

function sezioneGcp() {
  const modo = bottone('gcp-modo', tr('gi.gcp.aggiungi'), tr('gi.gcp.aggiungi.tip'));
  modo.setAttribute('aria-pressed', 'false');
  const anteprima = Object.assign(el('div', 'gi-anteprima'), { id: 'gi-anteprima-box', hidden: true });
  anteprima.append(Object.assign(el('canvas'), { id: 'gi-anteprima' }), nota(tr('gi.gcp.passi')));
  const tabella = el('table', 'gi-tabella');
  const testata = el('tr');
  for (const t of ['#', 'Lat', 'Lon', 'Px', 'Py', 'Res (m)', '']) testata.append(el('th', null, t));
  const thead = el('thead');
  thead.append(testata);
  tabella.append(thead, Object.assign(el('tbody'), { id: 'gi-gcp-corpo' }));
  const rmse = Object.assign(el('p', 'gi-info'), { id: 'gi-rmse', hidden: true });
  rmse.append('RMSE: ', Object.assign(el('strong', null, '—'), { id: 'gi-rmse-val' }), ' m');
  const tipo = el('label', 'gi-campo', tr('gi.trasformazione'));
  tipo.append(selezione('tipo', tr('gi.trasformazione.tipo'), [['poly1', tr('gi.trasformazione.affine')], ['poly2', tr('gi.trasformazione.poly2')]]));
  const scorri = el('div', 'gi-scorri');
  scorri.append(tabella);
  const allinea = Object.assign(bottone('allinea', tr('gi.allinea'), tr('gi.allinea.tip'), 'gi-primario'), { disabled: true });
  const svuota = Object.assign(bottone('gcp-svuota', tr('gi.gcp.svuota'), tr('gi.gcp.svuota.tip'), 'gi-pericolo'), { disabled: true });
  return sezione('Ground Control Points', [modo, anteprima, Object.assign(el('p', 'gi-info', tr('gi.gcp.nessuno')), { id: 'gi-gcp-conteggio' }), scorri, rmse, tipo, allinea, svuota]);
}

function sezioneExport() {
  const kmz = bottone('kmz', 'KMZ', tr('gi.kmz.tip'), 'gi-primario');
  const geotiff = bottone('geotiff', 'GeoTIFF', tr('gi.geotiff.tip'), 'gi-primario');
  const qgis = bottone('qgis', tr('gi.qgis'), tr('gi.qgis.tip'), 'gi-primario');
  const mondo = bottone('mondo', 'World file', tr('gi.mondo.tip'));
  const geojson = bottone('geojson', 'GCP GeoJSON', tr('gi.geojson.tip'));
  const esporta = bottone('json-esporta', tr('tema.esporta'), tr('gi.json.esporta.tip'));
  [kmz, geotiff, qgis, mondo, geojson, esporta].forEach(b => { b.disabled = true; });
  const gtiff = Object.assign(el('fieldset', 'gi-gtiff'), { id: 'gi-gtiff', hidden: true });
  const gruppo = (testo, controllo, id) => { const l = el('label', 'gi-campo gi-campo-colonna', testo); l.append(controllo); if (id) l.id = id; return l; };
  gtiff.append(
    el('legend', null, tr('gi.gtiff.impostazioni')),
    gruppo(tr('gi.gtiff.sr'), selezione('gtiff-sr', tr('gi.gtiff.sr'), [['4326', 'EPSG:4326 — WGS 84'], ['32632', 'EPSG:32632 — UTM 32N'], ['32633', 'EPSG:32633 — UTM 33N'], ['3857', 'EPSG:3857 — Web Mercator']])),
    gruppo(tr('gi.gtiff.ricamp'), selezione('gtiff-ricamp', tr('gi.gtiff.ricamp.metodo'), [['bilinear', tr('gi.gtiff.bilineare')], ['nearest', tr('gi.gtiff.nearest')]]), 'gi-gtiff-ricamp-gruppo'),
    gruppo(tr('gi.gtiff.risoluzione.gruppo'), selezione('gtiff-max', tr('gi.gtiff.risoluzione'), [['2000', '2000 px'], ['4000', '4000 px'], ['8000', '8000 px']])),
    gruppo(tr('gi.gtiff.compressione'), selezione('gtiff-compr', tr('gi.gtiff.compressione'), [['5', tr('gi.gtiff.lzw')], ['1', tr('gi.gtiff.nessuna')]])),
    Object.assign(nota(''), { id: 'gi-gtiff-nota' }),
    riga(bottone('gtiff-annulla', tr('gi.annulla'), tr('gi.gtiff.chiudi')), bottone('gtiff-vai', tr('gi.gtiff.esporta'), tr('gi.gtiff.esporta.tip'), 'gi-primario')),
  );
  gtiff.querySelector('#gi-gtiff-max').value = '4000';
  const importa = bottone('json-importa', tr('tema.importa'), tr('gi.json.importa.tip'));
  const mapwarper = Object.assign(el('a', 'gi-btn gi-link', 'MapWarper ↗'), { href: 'https://mapwarper.net/', target: '_blank', rel: 'noopener', title: tr('gi.mapwarper.tip') });
  return sezione('Export', [riga(kmz, geotiff), qgis, riga(mondo, geojson), gtiff, riga(esporta, importa), campo('json-file', 'file', { accept: '.json,application/json', hidden: true }), mapwarper], false);
}

export function creaPannello(elemento) {
  const testata = el('header', 'gi-testata');
  testata.append(el('h2', null, tr('gi.titolo')));
  const x = Object.assign(el('button', 'pannello-chiudi'), { type: 'button', title: tr('comune.chiudi'), ariaLabel: tr('gi.chiudi') });
  x.innerHTML = svgIcona('chiudi', 18);
  x.addEventListener('click', () => { elemento.hidden = true; });
  testata.append(x);
  const autore = el('p', 'gi-autore', tr('gi.autore'));
  const link = Object.assign(el('a', null, 'Geoimage'), { href: 'https://palermohub.opendatasicilia.it/geoimage.html', target: '_blank', rel: 'noopener' });
  autore.append(link, tr('gi.autore.fine'));
  const stato = Object.assign(el('p', 'gi-stato', tr('gi.stato.iniziale')), { id: 'gi-stato' });
  stato.setAttribute('role', 'status');
  const corpo = el('div', 'gi-corpo');
  corpo.append(...sezioneImmagine(), sezioneConfronto(), sezionePosizione(), sezioneGcp(), sezioneExport());
  elemento.replaceChildren(testata, autore, stato, corpo);
}
