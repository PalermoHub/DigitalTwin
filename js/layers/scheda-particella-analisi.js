// Analisi della particella nella scheda «Particella catastale»: superficie, edifici, coperto, altezze (percorso Urbanistica).
// Legge i tile già caricati (particelle e edifici), il calcolo è in core/particella-analisi.js.
import { analizzaParticella } from '../core/particella-analisi.js';
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
    .map(f => ({ id: f.id, geometry: f.geometry, altezza: f.properties?.altezza, pop: f.properties?.pop_stim == null ? undefined : Number(f.properties.pop_stim) }));
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

// { gruppo, nota } da aggiungere alla voce della particella, oppure null se il percorso Urbanistica non è attivo o la mappa non basta
export function analisiParticella(map, foglio, particella) {
  if (!map || !urbanisticaAttiva()) return null;
  const pezzi = pezziParticella(map, foglio, particella);
  if (!pezzi.length) return null;
  const { geom, pezziUniti } = geometriaParticella(pezzi);
  const a = analizzaParticella(geom, pezziEdifici(map, estremi([geom])), { pezziUniti });
  if (!a) return null;
  const { gruppo, avvisi } = gruppoAnalisi(a, particella);
  return { gruppo, nota: avvisi.join(' ') };
}
