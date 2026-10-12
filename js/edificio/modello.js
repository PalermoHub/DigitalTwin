// Modello della vista «Edificio in 3D»: espressioni MapLibre per l'esploso dei piani, filtri, colori e scheda.
// Niente DOM né MapLibre qui (vedi tests/js/edificio-modello.test.mjs).
// I dati sono quelli di scripts/edificio/crociferi.py: ogni oggetto ha piano, livello (0 = terra), tipo, quota e h (m).
import { t, localeIntl } from '../core/i18n.js';

// tipi di oggetto raggruppati come interruttori della vista (etichetta: edificio.gruppo.<id>)
export const GRUPPI = [
  { id: 'muri', tipi: ['muro', 'tamburo'] },
  { id: 'aperture', tipi: ['architrave', 'davanzale'] },
  { id: 'solai', tipi: ['solaio'] },
  { id: 'stanze', tipi: ['stanza', 'esterno'] },
  { id: 'copertura', tipi: ['tetto', 'cupola', 'lanterna'] },
];

// un colore per piano: colora le stanze e la tacca dei piani nell'elenco
export const COLORI_PIANI = {
  terra: '#d9a441', ammezzato: '#c97b4a', primo: '#5b8fb9', secondo: '#6aa36f', terzo: '#9a72b5', copertura: '#b0503a',
};
const COLORI_TIPI = {
  muro: '#e6dcc8', tamburo: '#e6dcc8', architrave: '#d8ccb4', davanzale: '#d8ccb4', solaio: '#b9b4ab',
  esterno: '#9cc58a', tetto: '#b4624a', cupola: '#c98a62', lanterna: '#efe6d4',
};

// L'esploso alza ogni piano di `passo` metri per livello: base e cima di un oggetto si spostano insieme.
export function altezze(passo) {
  const spinta = ['*', ['coalesce', ['get', 'livello'], 0], passo];
  const quota = ['to-number', ['get', 'quota'], 0];
  return {
    base: ['+', quota, spinta],
    cima: ['+', ['max', ['to-number', ['get', 'h'], 0], ['+', quota, 0.02]], spinta],
  };
}

export function tipiAccesi(gruppiAccesi) {
  return GRUPPI.filter(g => gruppiAccesi.includes(g.id)).flatMap(g => g.tipi);
}

// Filtro dei volumi: piani e gruppi accesi; i vuoti (la chiesa sopra il piano terra) e i punti dei numeri mai.
export function filtroVolumi(piani, gruppiAccesi) {
  return ['all',
    ['==', ['geometry-type'], 'Polygon'],
    ['in', ['get', 'piano'], ['literal', piani]],
    ['in', ['get', 'tipo'], ['literal', tipiAccesi(gruppiAccesi)]],
  ];
}

export function filtroNumeri(piani) {
  return ['all', ['==', ['get', 'tipo'], 'numero'], ['in', ['get', 'piano'], ['literal', piani]]];
}

// Stanze del colore del loro piano, il resto del colore del tipo; in evidenza (hover) un giallo.
export function coloreVolumi() {
  const perPiano = ['match', ['get', 'piano'], ...Object.entries(COLORI_PIANI).flat(), '#cccccc'];
  const perTipo = ['match', ['get', 'tipo'], ...Object.entries(COLORI_TIPI).flat(), '#cccccc'];
  return ['case',
    ['boolean', ['feature-state', 'evidenza'], false], '#ffcf33',
    ['==', ['get', 'tipo'], 'stanza'], perPiano,
    perTipo];
}

// nome del piano nella lingua corrente; i dati portano quello italiano come riserva
export const nomePiano = (id, nome) => {
  const k = `edificio.piano.${id}`;
  const v = t(k);
  return v === k ? (nome || id) : v;
};

const numero = (v, cifre) => Number(v).toLocaleString(localeIntl(), { minimumFractionDigits: cifre, maximumFractionDigits: cifre });

// Righe della scheda di un oggetto cliccato.
export function righeScheda(p) {
  const righe = [[t('edificio.scheda.piano'), nomePiano(p.piano, p.nome_piano)], [t('edificio.scheda.elemento'), t(`edificio.tipo.${p.tipo}`)]];
  if (p.numero) righe.push([t('edificio.scheda.stanza'), p.numero]);
  if (p.area != null) righe.push([t('edificio.scheda.superficie'), `${numero(p.area, 1)} m²`]);
  if (p.tipo === 'stanza' || p.tipo === 'solaio' || p.tipo === 'esterno') righe.push([t('edificio.scheda.calpestio'), `${numero(p.quota, 2)} m`]);
  else righe.push([t('edificio.scheda.da'), `${numero(p.quota, 2)} m`], [t('edificio.scheda.a'), `${numero(p.h, 2)} m`]);
  return righe;
}

// Piani nell'ordine dal basso, dai metadati del GeoJSON (o dagli oggetti, se mancano).
export function pianiDa(fc) {
  if (fc.metadata?.piani?.length) return [...fc.metadata.piani].sort((a, b) => a.livello - b.livello);
  const visti = new Map();
  for (const f of fc.features) {
    const p = f.properties;
    if (!visti.has(p.piano)) visti.set(p.piano, { id: p.piano, nome: p.nome_piano || p.piano, livello: p.livello ?? 0 });
  }
  return [...visti.values()].sort((a, b) => a.livello - b.livello);
}
