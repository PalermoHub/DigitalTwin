import { urlDati } from '../core/config.js';
import { INDICATORI, quantili } from '../core/indicatori.js';
import { SRC_SEZIONI } from './confini.js';

const FILE = { 2021: 'popolazione/sezioni_indicatori.json', 2023: 'popolazione/sezioni_indicatori_2023.json' };
const PALETTE = ['#fff5eb', '#fdd0a2', '#fdae6b', '#e6550d', '#a63603'];
const GRIGIO = '#d9d9d9';
const fmt = v => v.toLocaleString('it-IT', { maximumFractionDigits: 1 });

const cache = {};
const indici = {};
let stato = { anno: 2021, indicatore: 'residenti', nValori: 0, breaks: [] };
let sequenza = 0;
let legenda = null;

async function carica(anno) {
  if (!cache[anno]) {
    const r = await fetch(urlDati(FILE[anno]));
    if (!r.ok) throw new Error(`popolazione ${anno}`);
    cache[anno] = await r.json();
    indici[anno] = new Map(cache[anno].map(rec => [rec.SEZ21_ID, rec]));
  }
  return cache[anno];
}

function espressione(breaks) {
  const e = ['step', ['coalesce', ['feature-state', 'v'], -1], GRIGIO, 0, PALETTE[0]];
  breaks.forEach((b, i) => e.push(b, PALETTE[i + 1]));
  return e;
}

function disegnaLegenda(breaks) {
  if (!legenda) return;
  const unita = INDICATORI[stato.indicatore].unita;
  const voci = [[GRIGIO, 'senza dato']];
  const limiti = [0, ...breaks];
  limiti.forEach((b, i) => {
    const prossimo = limiti[i + 1];
    voci.push([PALETTE[i], prossimo === undefined ? `≥ ${fmt(b)} ${unita}` : `${fmt(b)} – ${fmt(prossimo)} ${unita}`]);
  });
  legenda.replaceChildren(...voci.map(([c, t]) => {
    const riga = document.createElement('div');
    const chip = document.createElement('i');
    chip.style.background = c;
    riga.append(chip, t);
    return riga;
  }));
}

async function applica(map) {
  const mia = ++sequenza;
  const { anno, indicatore } = stato;
  const dati = await carica(anno);
  if (mia !== sequenza) return; // è partita una richiesta più recente
  const ind = INDICATORI[indicatore];
  const src = { source: SRC_SEZIONI, sourceLayer: 'sezioni' };
  map.removeFeatureState(src);
  const valori = [];
  for (const rec of dati) {
    const v = ind.calcola(rec);
    if (v === null) continue;
    valori.push(v);
    map.setFeatureState({ ...src, id: rec.SEZ21_ID }, { v });
  }
  const breaks = quantili(valori, 5).filter(b => b > 0);
  map.setPaintProperty('pop-fill', 'fill-color', espressione(breaks));
  stato = { anno, indicatore, nValori: valori.length, breaks };
  disegnaLegenda(breaks);
}

export default {
  id: 'popolazione',
  titolo: 'Popolazione',
  aggiungiSorgenti() {},
  aggiungiLayer(map) {
    this._map = map; // serve a imposta(), chiamato anche dall'esterno (test, pannello)
    map.addLayer({
      id: 'pop-fill', type: 'fill', source: SRC_SEZIONI, 'source-layer': 'sezioni',
      paint: { 'fill-color': GRIGIO, 'fill-opacity': 0.65 },
    });
    // sempre presente e invisibile: serve alla scheda del luogo anche con il coropletico spento
    map.addLayer({
      id: 'pop-hit', type: 'fill', source: SRC_SEZIONI, 'source-layer': 'sezioni',
      paint: { 'fill-opacity': 0 },
    });
  },
  strati: [{
    id: 'coropletico', etichetta: 'Popolazione per sezione', layers: ['pop-fill'], attivo: true,
    suCambio(attivo) { if (legenda) legenda.hidden = !attivo; },
  }],
  pannello(el, map) {
    const anno = document.createElement('select');
    anno.id = 'pop-anno';
    anno.setAttribute('aria-label', 'Anno');
    anno.innerHTML = '<option value="2021">Censimento 2021</option><option value="2023">Censimento permanente 2023 (stime)</option>';
    const ind = document.createElement('select');
    ind.id = 'pop-indicatore';
    ind.setAttribute('aria-label', 'Indicatore');
    for (const [k, v] of Object.entries(INDICATORI)) ind.add(new Option(`${v.etichetta} (${v.unita})`, k));
    legenda = document.createElement('div');
    legenda.className = 'legenda';
    const cambia = () => this.imposta({ anno: Number(anno.value), indicatore: ind.value }).catch(() => {});
    anno.addEventListener('change', cambia);
    ind.addEventListener('change', cambia);
    el.append(anno, ind, legenda);
  },
  avvia(map) {
    return applica(map);
  },
  async imposta({ anno, indicatore } = {}) {
    stato = { ...stato, anno: anno ?? stato.anno, indicatore: indicatore ?? stato.indicatore };
    return applica(this._map);
  },
  stato: () => stato,
  scheda: {
    layers: ['pop-hit'],
    voce(f) {
      const p = f.properties;
      const righe = [
        ['Sezione', String(p.SEZ21_ID)],
        ['Quartiere', p.Quartiere ?? '—'],
        ['UPL', p.UPL ?? '—'],
        ['Circoscrizione', p.Circoscrizione ?? '—'],
        ['Residenti 2021', p.POP21 != null ? fmt(p.POP21) : '—'],
        ['Famiglie 2021', p.FAM21 != null ? fmt(p.FAM21) : '—'],
        ['Abitazioni 2021', p.ABI21 != null ? fmt(p.ABI21) : '—'],
      ];
      const r23 = indici[2023]?.get(p.SEZ21_ID);
      if (r23 && r23.P1 != null) righe.push(['Residenti 2023 (stima)', fmt(Number(r23.P1))]);
      return { peso: 30, titolo: 'Sezione di censimento', righe };
    },
  },
};
