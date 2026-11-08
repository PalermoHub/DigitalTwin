// Analisi della particella nella scheda «Particella catastale»: superficie, edifici, coperto, altezze (percorso Urbanistica).
// Legge i tile già caricati (particelle e edifici), il calcolo è in core/particella-analisi.js.
import { analizzaParticella } from '../core/particella-analisi.js';
import { unisciPezzi, caricaUnione } from '../core/edificio-contorno.js';
import { sagomaSvg } from '../core/particella-sagoma.js';
import { statisticheEdifici, CLASSI_ALTEZZA } from '../core/particella-statistiche.js';
import { titoloConInfo } from '../core/info-grafico.js';
import { nomeUso } from '../core/etichette-campi.js';
import { estremi } from '../core/scheda-pdf-geom.js';
import { urbanisticaAttiva } from '../core/scheda-pdf-modello.js';
import { localeIntl, t } from '../core/i18n.js';

const filtro = (foglio, particella) => ['all', ['==', ['to-string', ['get', 'Foglio']], String(foglio)], ['==', ['to-string', ['get', 'Paricella']], String(particella)]];

// Pezzi della particella disegnati ora (un solo livello di zoom: querySourceFeatures mescola copie a zoom diversi)
const pezziParticella = (map, foglio, particella) =>
  map.queryRenderedFeatures({ layers: ['catasto-hit'], filter: filtro(foglio, particella) }).filter(f => /Polygon/.test(f.geometry?.type));

// Un pezzo solo = geometria intera; più pezzi (tagliata dai tile) = MultiPolygon dei pezzi, con area misurata sull'unione
function geometriaParticella(pezzi) {
  const diverse = [...new Map(pezzi.map(f => [JSON.stringify(f.geometry), f.geometry])).values()];
  if (diverse.length === 1) return { geom: diverse[0], pezziUniti: false };
  const poligoni = diverse.flatMap(g => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates));
  return { geom: { type: 'MultiPolygon', coordinates: poligoni }, pezziUniti: true };
}

// Edifici disegnati nel riquadro della particella (layer di interrogazione, sempre presente da zoom 12)
function pezziEdifici(map, [o, s, e, n]) {
  if (!map.getLayer('edifici-hit')) return [];
  const a = map.project([o, n]), b = map.project([e, s]);
  return map.queryRenderedFeatures([[Math.min(a.x, b.x), Math.min(a.y, b.y)], [Math.max(a.x, b.x), Math.max(a.y, b.y)]], { layers: ['edifici-hit'] })
    .map(f => ({ id: f.id, geometry: f.geometry, altezza: f.properties?.altezza, pop: f.properties?.pop_stim == null ? undefined : Number(f.properties.pop_stim), uso: f.properties?.occupancy }));
}

const num = (v, dec = 0) => new Intl.NumberFormat(localeIntl(), { maximumFractionDigits: dec, minimumFractionDigits: dec }).format(v);

// Righe e avvisi dal risultato dell'analisi (puro: si prova senza mappa)
export function gruppoAnalisi(a, particella) {
  const righe = [
    { etichetta: 'Superficie', valore: `${num(a.m2)} m²` },
    { etichetta: 'Edifici', valore: a.nCavallo ? t('territorio.edificiCavallo', { n: num(a.n), c: num(a.nCavallo) }) : num(a.n) },
  ];
  const avvisi = [];
  if (a.n) {
    righe.push(
      { etichetta: 'Coperto (circa)', valore: `${num(a.copertoM2)} m²` },
      { etichetta: 'Rapporto di copertura', valore: `${num(a.copertura)} %` },
    );
    if (a.altezze.med != null) righe.push({ etichetta: 'Altezza edifici', valore: t('territorio.altezze', { min: num(a.altezze.min, 1), med: num(a.altezze.med, 1), max: num(a.altezze.max, 1) }) });
    if (a.volumeM3 != null) righe.push({ etichetta: 'Volume (stima)', valore: `${num(Math.round(a.volumeM3 / 10) * 10)} m³` });
    if (a.residenti != null) righe.push({ etichetta: 'Residenti (stima)', valore: num(Math.round(a.residenti)) });
    if (a.altezze.ignote) avvisi.push(t('territorio.avvisoAltezze', { n: a.altezze.ignote }));
    if (a.nCavallo) avvisi.push(t('territorio.avvisoCavallo'));
  } else avvisi.push(t('territorio.avvisoLibero'));
  if (/^STRADA/i.test(String(particella))) avvisi.push(t('territorio.avvisoStrada'));
  avvisi.push(t('territorio.avvisoStima'));
  return { gruppo: { titolo: 'Analisi della particella', righe }, avvisi };
}

const COLORI_ALTEZZA = ['#6aa6e8', '#4c78b8', '#3aa981', '#e0b13a', '#e9892e', '#d6453d'];
const COLORE_ALTEZZA_IGNOTA = '#8a8f98';
const coloreAltezza = h => (h > 0 ? COLORI_ALTEZZA[CLASSI_ALTEZZA.findIndex(c => h <= c.max)] : COLORE_ALTEZZA_IGNOTA);
let contaSagome = 0;
const NS = 'http://www.w3.org/2000/svg';
const svgEl = (nome, attr = {}) => { const e = document.createElementNS(NS, nome); for (const [k, v] of Object.entries(attr)) e.setAttribute(k, v); return e; };

// Mini-anteprima: contorno della particella con gli edifici nelle posizioni reali (a cavallo: tratteggiati), nord in alto
// Passando il mouse su un edificio della sagoma (o dandogli il fuoco da tastiera) `suEdificio(i)` riceve l'indice dell'edificio, `suEdificio(null)` all'uscita
export function creaSagoma(sagoma, suEdificio = null) {
  const g = sagomaSvg(sagoma);
  if (!g) return null;
  const svg = svgEl('svg', { viewBox: `0 0 ${g.larghezza} ${g.altezza}`, class: 'scheda-sagoma-svg', role: 'img', 'aria-label': t('territorio.sagomaAlt') });
  // I tile tagliano particelle ed edifici in pezzi che si toccano e si sovrappongono: il bordo va solo sul contorno esterno.
  // Il tratto è doppio e una maschera toglie ciò che sta dentro i pezzi (giunture e sovrapposizioni spariscono).
  const defs = svgEl('defs');
  const conBordo = (d, classeBordo) => {
    const id = `sagoma-m-${++contaSagome}`;
    const m = svgEl('mask', { id, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: g.larghezza, height: g.altezza });
    m.append(svgEl('rect', { x: 0, y: 0, width: g.larghezza, height: g.altezza, fill: '#fff' }), svgEl('path', { d, fill: '#000' }));
    defs.append(m);
    return svgEl('path', { d, class: classeBordo, mask: `url(#${id})` });
  };
  svg.append(defs, svgEl('path', { d: g.particella, class: 'scheda-sagoma-lotto' }), conBordo(g.particella, 'scheda-sagoma-bordo'));
  for (const e of g.edifici) {
    const gr = svgEl('g', { class: `scheda-sagoma-ed${e.cavallo ? ' scheda-sagoma-ed--cavallo' : ''}` });
    const titolo = svgEl('title');
    titolo.textContent = [e.altezza ? `${num(e.altezza, 1)} m` : t('territorio.sagomaAltezzaIgnota'), `${num(e.area)} m²`, e.cavallo ? t('territorio.sagomaCavallo') : ''].filter(Boolean).join(' · ');
    const fill = svgEl('path', { d: e.d, class: 'scheda-sagoma-ed-fill' });
    fill.style.setProperty('--ed-col', coloreAltezza(e.altezza)); // stessi colori dei grafici per altezza
    gr.append(titolo, fill, conBordo(e.d, 'scheda-sagoma-ed-bordo'));
    if (suEdificio) {
      gr.setAttribute('tabindex', '0');
      gr.addEventListener('mouseenter', () => suEdificio(e.i));
      gr.addEventListener('mouseleave', () => suEdificio(null));
      gr.addEventListener('focus', () => suEdificio(e.i));
      gr.addEventListener('blur', () => suEdificio(null));
    }
    svg.append(gr);
  }
  const radice = document.createElement('div');
  radice.className = 'scheda-sagoma';
  radice.append(svg);
  return radice;
}

const CLASSI_ALTEZZA_CHIAVI = ['a3', 'a6', 'a12', 'a18', 'a30', 'oltre'];
const el = (tag, classe, testo) => { const e = document.createElement(tag); if (classe) e.className = classe; if (testo != null) e.textContent = testo; return e; };
const pct = (v, tot) => `${num(tot ? v / tot * 100 : 0, 1)}%`;

function tessera(titolo, valore, nota) {
  const c = el('div', 'part-st-tessera');
  c.append(el('p', 'part-st-titolo', titolo), el('p', 'part-st-valore', valore), el('p', 'part-st-nota', nota));
  return c;
}

function barre(titolo, id, righe) {
  const box = el('section', 'part-st-box');
  box.append(titoloConInfo('h4', 'part-st-h', titolo, id));
  const max = Math.max(...righe.map(r => r.v), 1);
  for (const r of righe) {
    const riga = el('div', 'part-st-barra');
    const traccia = el('span', 'part-st-traccia'), riempi = el('i');
    riempi.style.width = `${r.v / max * 100}%`; riempi.style.background = r.colore;
    traccia.append(riempi);
    riga.append(el('span', 'part-st-nome', r.nome), traccia, el('span', 'part-st-val', r.testo));
    box.append(riga);
  }
  return box;
}

// Tessere, grafici per altezza e classifica degli edifici più grandi (puro sul risultato di statisticheEdifici)
export function creaStatistiche(st) {
  if (!st) return null;
  const radice = el('div', 'part-st');
  const griglia = el('div', 'part-st-griglia');
  const tuttiAlt = st.conQuota === st.n;
  griglia.append(
    tessera(t('territorio.st.edifici'), num(st.n), t('territorio.st.edificiNota')),
    tessera(t('territorio.st.impronta'), `${num(st.impronta)} m²`, t('territorio.st.improntaNota', { m: num(st.mediaM2) })),
    tessera(t('territorio.st.mediana'), `${num(st.medianaM2)} m²`, t('territorio.st.medianaNota')),
    tessera(t('territorio.st.altMediana'), st.altezzaMediana != null ? `${num(st.altezzaMediana, 1)} m` : t('territorio.st.nd'), tuttiAlt ? t('territorio.st.quotaTutti') : t('territorio.st.quotaN', { n: num(st.conQuota) })),
    tessera(t('territorio.st.altMax'), st.altezzaMax != null ? `${num(st.altezzaMax, 1)} m` : t('territorio.st.nd'), t('territorio.st.altMaxNota')),
    tessera(t('territorio.st.uso'), st.usoPrevalente ? nomeUso(st.usoPrevalente) : t('territorio.st.nd'), st.usoPrevalente ? t('territorio.st.usoNota', { c: num(st.conUso), n: num(st.n) }) : t('territorio.st.usoNessuno')),
  );
  radice.append(griglia);

  const classi = st.classiAltezza.map(c => ({ ...c, nome: t(`territorio.st.cl.${c.chiave}`), colore: COLORI_ALTEZZA[CLASSI_ALTEZZA_CHIAVI.indexOf(c.chiave)] }));
  if (st.altezzaIgnota) classi.push({ ...st.altezzaIgnota, nome: t('territorio.st.cl.ignota'), colore: COLORE_ALTEZZA_IGNOTA });
  radice.append(
    barre(t('territorio.st.perAltezza'), 'particella-edifici-altezza', classi.map(c => ({ nome: c.nome, colore: c.colore, v: c.n, testo: `${num(c.n)} · ${pct(c.n, st.n)}` }))),
    barre(t('territorio.st.improntaAltezza'), 'particella-impronta-altezza', classi.map(c => ({ nome: c.nome, colore: c.colore, v: c.m2, testo: `${num(c.m2)} m² · ${pct(c.m2, st.impronta)}` }))),
  );

  const grandi = el('section', 'part-st-box');
  grandi.append(titoloConInfo('h4', 'part-st-h', t('territorio.st.piuGrandi'), 'particella-edifici-grandi'));
  const max = Math.max(...st.piuGrandi.map(e => e.area), 1);
  st.piuGrandi.forEach((e, i) => {
    const riga = el('div', 'part-st-barra part-st-barra--rank');
    const nome = `${e.uso && !String(e.uso).startsWith('UNK') ? nomeUso(e.uso) : t('territorio.st.nonClassificato')}${e.altezza != null ? ` · ${num(e.altezza, 1)} m` : ''}`;
    const traccia = el('span', 'part-st-traccia'), riempi = el('i');
    riempi.style.width = `${e.area / max * 100}%`; riempi.style.background = '#e9a23a';
    traccia.append(riempi);
    riga.append(el('span', 'part-st-pos', String(i + 1)), el('span', 'part-st-nome', nome), traccia, el('span', 'part-st-val', `${num(e.area)} m²`));
    grandi.append(riga);
  });
  radice.append(grandi);
  return radice;
}

// Contorno dell'edificio sotto il mouse nella sagoma, evidenziato in mappa finché il mouse resta sopra (spento all'uscita)
const SRC_ED = 'scheda-edificio-hover';
let ultimaRichiesta = 0;
function evidenziaEdificio(map, geoms) {
  if (!map?.getStyle?.()) return;
  const mia = ++ultimaRichiesta;
  if (geoms?.length > 1 && !globalThis.polygonClipping) { // prima volta: il mouse può essere già uscito quando la libreria arriva
    caricaUnione().then(() => { if (mia === ultimaRichiesta) evidenziaEdificio(map, geoms); });
    return;
  }
  const unita = geoms?.length ? unisciPezzi(geoms, globalThis.polygonClipping?.union) : null;
  const dati = { type: 'FeatureCollection', features: unita ? [{ type: 'Feature', properties: {}, geometry: unita }] : [] };
  const src = map.getSource(SRC_ED);
  if (src) src.setData(dati);
  else if (unita) {
    map.addSource(SRC_ED, { type: 'geojson', data: dati });
    map.addLayer({ id: `${SRC_ED}-riempi`, type: 'fill', source: SRC_ED, paint: { 'fill-color': '#12b5cb', 'fill-opacity': 0.35 } });
    map.addLayer({ id: `${SRC_ED}-linea`, type: 'line', source: SRC_ED, layout: { 'line-join': 'round' }, paint: { 'line-color': '#0a7f90', 'line-width': 3 } });
  }
  if (unita && map.getLayer(`${SRC_ED}-riempi`)) { map.moveLayer(`${SRC_ED}-riempi`); map.moveLayer(`${SRC_ED}-linea`); } // sempre in cima
}

// { gruppo, nota } da aggiungere alla voce della particella, oppure null se il percorso Urbanistica non è attivo o la mappa non basta
export function analisiParticella(map, foglio, particella) {
  if (!map || !urbanisticaAttiva()) return null;
  const pezzi = pezziParticella(map, foglio, particella);
  if (!pezzi.length) return null;
  const { geom, pezziUniti } = geometriaParticella(pezzi);
  const a = analizzaParticella(geom, pezziEdifici(map, estremi([geom])), { pezziUniti, supMq: pezzi.find(f => Number(f.properties?.sup_mq) > 0)?.properties.sup_mq });
  if (!a) return null;
  const { gruppo, avvisi } = gruppoAnalisi(a, particella);
  return { gruppo, nota: avvisi.join(' '), dinamico: a.n || a.sagoma.particella.length ? () => {
      const f = document.createDocumentFragment();
      const s = creaStatistiche(statisticheEdifici(a.edifici)), g = creaSagoma(a.sagoma, i => evidenziaEdificio(map, i == null ? null : a.sagoma.edifici[i].geoms));
      if (s) f.append(s);
      if (g) f.append(g);
      return f;
    } : null };
}
