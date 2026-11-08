// Analisi della particella oltre a superficie ed edifici: forma del lotto, confronto con le altre particelle, intorno,
// ripartizione nelle zone PRG e quota vincolata. Legge i tile già disegnati; i calcoli sono in core/particella-*.js.
// Il risultato è diviso per card: `particella` (forma, dimensione, intorno), `zonizzazione` (zone PRG, dimensione per zona, vincoli areali)
// e `dimensioneOmi` (confronto per zona OMI, mostrato nella card Mercato).
import { formaLotto } from '../core/particella-forma.js';
import { dimensioneRispetto } from '../core/particella-percentile.js';
import { intornoParticella, RAGGIO_M } from '../core/particella-intorno.js';
import { urbanisticaParticella } from '../core/particella-urbanistica.js';
import { statisticheParticelle } from '../core/particella-dati.js';
import { areaMq, estremi } from '../core/scheda-pdf-geom.js';
import { unisciPezzi } from '../core/edificio-contorno.js';
import { campioneZona } from './legenda-prg.js';
import { localeIntl, t } from '../core/i18n.js';

const M_PER_GRADO = 111320;
const SOGLIA_NON_ZONIZZATA = 0.01; // sotto l'1% della particella è un residuo tra catasto e PRG
const num = (v, dec = 0) => new Intl.NumberFormat(localeIntl(), { maximumFractionDigits: dec, minimumFractionDigits: dec }).format(v);
const chiaveParticella = p => `${p.Foglio}/${p.Paricella}`;

// Feature disegnate in un riquadro [ovest, sud, est, nord], se lo strato di interrogazione c'è
function nelRiquadro(map, [o, s, e, n], layer) {
  if (!map.getLayer(layer)) return [];
  const a = map.project([o, n]), b = map.project([e, s]);
  return map.queryRenderedFeatures([[Math.min(a.x, b.x), Math.min(a.y, b.y)], [Math.max(a.x, b.x), Math.max(a.y, b.y)]], { layers: [layer] });
}

const allarga = ([o, s, e, n], metri) => {
  const dLat = metri / M_PER_GRADO, dLng = metri / (M_PER_GRADO * Math.cos((s + n) / 2 * Math.PI / 180));
  return [o - dLng, s - dLat, e + dLng, n + dLat];
};

const riga = (etichetta, valore, campione, barra) => ({ etichetta, valore, ...(campione ? { campione } : {}), ...(barra != null ? { barra } : {}) });

function gruppoForma(geom) {
  const f = formaLotto(geom);
  if (!f) return null;
  return { titolo: 'Forma del lotto', esteso: true, righe: [
    riga('Compattezza', num(f.compattezza, 2), null, f.compattezza),
    riga('Rapporto lati', num(f.rapporto, 2), null, f.rapporto),
    riga('Perimetro', `${num(f.perimetro)} m`),
    riga('Rettangolo minimo', `${num(f.lungo)} × ${num(f.corto)} m`),
    riga('Forma', t(`territorio.forma.${f.esito}`)),
  ] };
}

const frasePercentile = (p, n, mediana) => t('territorio.dim.riga', { p: num(Math.round(p)), n: num(n), med: num(mediana) });

function gruppoDimensione(dim) {
  const righe = [];
  if (dim?.foglio) righe.push(riga(t('territorio.dim.foglio', { foglio: dim.foglio.foglio }), frasePercentile(dim.foglio.p, dim.foglio.n, dim.foglio.mediana)));
  if (dim?.palermo) righe.push(riga('Tutta Palermo', t('territorio.dim.palermo', { p: num(Math.round(dim.palermo.p)), med: num(dim.palermo.mediana) })));
  return righe.length ? { titolo: 'Dimensione rispetto alle altre', esteso: true, righe } : null;
}

function gruppoIntorno(intorno) {
  if (!intorno) return null;
  const ids = [...intorno.confinanti].sort((a, b) => parseInt(a) - parseInt(b) || a.localeCompare(b, 'it', { numeric: true }));
  const righe = [
    riga('Confinanti', ids.length ? t('territorio.intorno.confinanti', { n: ids.length, elenco: ids.slice(0, 8).join(', ') + (ids.length > 8 ? '…' : '') }) : '0'),
    riga(t('territorio.intorno.entro', { r: RAGGIO_M, cosa: t('territorio.intorno.particelle') }), String(intorno.vicine)),
    riga(t('territorio.intorno.entro', { r: RAGGIO_M, cosa: t('territorio.intorno.civici') }), String(intorno.civici)),
  ];
  if (intorno.lineare) righe.push(riga('Vincolo lineare più vicino', `${num(intorno.lineare.d)} m${intorno.lineare.tipo ? ` (${intorno.lineare.tipo})` : ''}`));
  return { titolo: 'Intorno', esteso: true, righe };
}

// Zone PRG (o vincoli areali) che intersecano la particella: m² riportati alla superficie ufficiale `m2`
function zone(geomUnita, pezzi, chiave, m2) {
  const lib = globalThis.polygonClipping;
  if (!lib || !pezzi.length) return null;
  const z = urbanisticaParticella(geomUnita, pezzi.map(f => ({ geometry: f.geometry, properties: f.properties })), chiave, lib);
  if (!z) return null;
  const k = m2 / z.m2;
  return { righe: z.righe.map(r => ({ ...r, m2: r.m2 * k })), fuoriM2: z.fuoriM2 * k };
}

function gruppiZonizzazione(geomUnita, pezziZto, pezziVa, m2, dati, foglio) {
  const gruppi = [];
  const zz = zone(geomUnita, pezziZto, p => p.properties.ZTO, m2);
  let codici = [];
  if (zz?.righe.length) {
    codici = zz.righe.map(r => r.chiave);
    const righe = zz.righe.map(r => riga(`${r.chiave}${r.esempio.properties.DESCRIZION ? ` – ${r.esempio.properties.DESCRIZION}` : ''}`, `${num(r.m2)} m² · ${num(r.quota, r.quota >= 10 ? 0 : 1)}%`, campioneZona(r.chiave)));
    if (zz.fuoriM2 > m2 * SOGLIA_NON_ZONIZZATA) righe.push(riga('Non zonizzata', `${num(zz.fuoriM2)} m² · ${num(zz.fuoriM2 / m2 * 100, 1)}%`));
    gruppi.push({ titolo: 'Particella per zona PRG', righe });
  }
  const dim = dimensioneRispetto(m2, dati, { foglio, zto: codici });
  if (dim?.zto.length) gruppi.push({ titolo: 'Dimensione rispetto alle altre', esteso: true, righe: dim.zto.map(r => riga(t('territorio.dim.zonaPrg', { codice: r.codice }), frasePercentile(r.p, r.n, r.mediana))) });
  const va = zone(geomUnita, pezziVa, p => p.properties.tipo || 'Vincolo areale', m2);
  if (zz) { // senza zone PRG disegnate i tile non sono arrivati: nemmeno per i vincoli si può dire «libera»
    const vincolata = va ? Math.min(m2, m2 - va.fuoriM2) : 0;
    gruppi.push({ titolo: 'Vincoli areali sulla particella', righe: vincolata > m2 * 0.005
      ? [riga('Quota vincolata', `${num(vincolata)} m² · ${num(vincolata / m2 * 100, vincolata / m2 >= 0.1 ? 0 : 1)}%`), riga('Libera da vincoli', `${num(m2 - vincolata)} m²`)]
      : [riga('Quota vincolata', t('territorio.vincoli.nessuno'))] });
  }
  return { gruppi, codici };
}

/* geom: particella (Polygon, o MultiPolygon dei pezzi di tile se `pezziUniti`); m2: superficie ufficiale dell'analisi.
   zoneOmi: codici delle zone OMI sotto il clic. Ritorna { particella: [gruppi], zonizzazione: [gruppi], dimensioneOmi: Map codice → { p, n, mediana }, nota } */
export function analisiExtra(map, { geom, pezziUniti, foglio, particella, m2, zoneOmi = [] }) {
  const dati = statisticheParticelle();
  const geomUnita = pezziUniti ? unisciPezzi(geom.coordinates.map(p => ({ type: 'Polygon', coordinates: p })), globalThis.polygonClipping?.union) ?? geom : geom;
  const riquadro = estremi([geomUnita]);
  const propria = `${foglio}/${particella}`;

  const largo = allarga(riquadro, RAGGIO_M);
  const intorno = intornoParticella(geomUnita, {
    propria,
    vicine: nelRiquadro(map, largo, 'catasto-hit').filter(f => f.properties?.Foglio != null).map(f => ({ id: chiaveParticella(f.properties), geometry: f.geometry })),
    civici: nelRiquadro(map, largo, 'civici-hit'),
    lineari: nelRiquadro(map, largo, 'prg-vl-hit').map(f => ({ tipo: f.properties?.TIPO, geometry: f.geometry })),
  });

  const { gruppi: gz, codici } = gruppiZonizzazione(geomUnita, nelRiquadro(map, riquadro, 'prg-zto-hit'), nelRiquadro(map, riquadro, 'prg-va-hit'), m2, dati, foglio);
  const dim = dimensioneRispetto(m2, dati, { foglio, zto: codici, omi: zoneOmi });

  return {
    particella: [gruppoForma(geomUnita), gruppoDimensione(dim), gruppoIntorno(intorno)].filter(Boolean),
    zonizzazione: gz,
    dimensioneOmi: new Map((dim?.omi ?? []).map(r => [r.codice, r])),
    nota: intorno ? t('territorio.intorno.nota') : '',
  };
}
