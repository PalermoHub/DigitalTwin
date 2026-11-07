// Analisi della particella nella scheda «Particella catastale»: superficie, edifici, coperto, altezze (percorso Urbanistica).
// Legge i tile già caricati (particelle e edifici), il calcolo è in core/particella-analisi.js.
import { analizzaParticella } from '../core/particella-analisi.js';
import { sagomaSvg } from '../core/particella-sagoma.js';
import { statisticheEdifici } from '../core/particella-statistiche.js';
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

const NS = 'http://www.w3.org/2000/svg';
const svgEl = (nome, attr = {}) => { const e = document.createElementNS(NS, nome); for (const [k, v] of Object.entries(attr)) e.setAttribute(k, v); return e; };

// Mini-anteprima: contorno della particella con gli edifici nelle posizioni reali (a cavallo: tratteggiati), nord in alto
export function creaSagoma(sagoma) {
  const g = sagomaSvg(sagoma);
  if (!g) return null;
  const svg = svgEl('svg', { viewBox: `0 0 ${g.larghezza} ${g.altezza}`, class: 'scheda-sagoma-svg', role: 'img', 'aria-label': t('territorio.sagomaAlt') });
  svg.append(svgEl('path', { d: g.particella, class: 'scheda-sagoma-lotto' }));
  for (const e of g.edifici) {
    const p = svgEl('path', { d: e.d, class: `scheda-sagoma-ed${e.cavallo ? ' scheda-sagoma-ed--cavallo' : ''}` });
    const titolo = svgEl('title');
    titolo.textContent = [e.altezza ? `${num(e.altezza, 1)} m` : t('territorio.sagomaAltezzaIgnota'), `${num(e.area)} m²`, e.cavallo ? t('territorio.sagomaCavallo') : ''].filter(Boolean).join(' · ');
    p.append(titolo);
    svg.append(p);
  }
  const radice = document.createElement('div');
  radice.className = 'scheda-sagoma';
  radice.append(svg);
  return radice;
}

const COLORI_ALTEZZA = ['#6aa6e8', '#4c78b8', '#3aa981', '#e0b13a', '#e9892e', '#d6453d'];
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
  if (st.altezzaIgnota) classi.push({ ...st.altezzaIgnota, nome: t('territorio.st.cl.ignota'), colore: '#8a8f98' });
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

// { gruppo, nota } da aggiungere alla voce della particella, oppure null se il percorso Urbanistica non è attivo o la mappa non basta
export function analisiParticella(map, foglio, particella) {
  if (!map || !urbanisticaAttiva()) return null;
  const pezzi = pezziParticella(map, foglio, particella);
  if (!pezzi.length) return null;
  const { geom, pezziUniti } = geometriaParticella(pezzi);
  const a = analizzaParticella(geom, pezziEdifici(map, estremi([geom])), { pezziUniti });
  if (!a) return null;
  const { gruppo, avvisi } = gruppoAnalisi(a, particella);
  return { gruppo, nota: avvisi.join(' '), dinamico: a.n || a.sagoma.particella.length ? () => {
      const f = document.createDocumentFragment();
      const s = creaStatistiche(statisticheEdifici(a.edifici)), g = creaSagoma(a.sagoma);
      if (s) f.append(s);
      if (g) f.append(g);
      return f;
    } : null };
}
