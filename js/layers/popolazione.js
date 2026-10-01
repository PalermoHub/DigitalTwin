import { urlDati } from '../core/config.js';
import { INDICATORI } from '../core/indicatori.js';
import { EDIFICATO_NEUTRAL, densityLegendStops, densityStops } from '../core/palette.js';
import { segnala } from '../core/pannello.js';
import { primo, righe } from '../core/scheda-util.js';
import { SRC_SEZIONI } from './confini.js';

const FILE = { 2021: 'popolazione/sezioni_indicatori.json', 2023: 'popolazione/sezioni_indicatori_2023.json' };
const fmt = v => v.toLocaleString('it-IT', { maximumFractionDigits: 1 });

const promesse = {};
const indici = {};
let stato = { anno: 2021, indicatore: 'densita', nValori: 0, anniDisponibili: [] };
let sequenza = 0;
let legenda = null;

// un solo download per anno anche se richiesto più volte; dopo un errore si può riprovare
function carica(anno) {
  promesse[anno] ??= fetch(urlDati(FILE[anno]))
    .then(r => {
      if (!r.ok) throw new Error(`popolazione ${anno}`);
      return r.json();
    })
    .then(dati => {
      indici[anno] = new Map(dati.map(rec => [rec.SEZ21_ID, rec]));
      return dati;
    })
    .catch(err => { delete promesse[anno]; throw err; });
  return promesse[anno];
}

// Stessa espressione dell'app originale (vecchiaiaExpression): rampa lineare dalla palette,
// neutro per le sezioni senza valore.
function espressione(rampa) {
  const ramp = ['interpolate', ['linear'], ['feature-state', 'v'], ...densityStops(rampa, false).flat()];
  return ['case', ['==', ['feature-state', 'v'], null], EDIFICATO_NEUTRAL, ramp];
}

function disegnaLegenda(rampa, anno) {
  if (!legenda) return;
  const voci = [{ value: 'senza dato', color: EDIFICATO_NEUTRAL }, ...densityLegendStops(rampa, false)];
  const righe = voci.map(({ value, color }) => {
    const riga = document.createElement('div');
    const chip = document.createElement('i');
    chip.style.background = color;
    riga.append(chip, value);
    return riga;
  });
  if (anno === 2023) {
    const nota = document.createElement('div');
    nota.className = 'nota-stime';
    nota.textContent = 'Censimento permanente 2023: stime campionarie';
    righe.push(nota);
  }
  legenda.replaceChildren(...righe);
}

// Applica anno e indicatore richiesti. Lo stato cambia solo se il caricamento riesce: se il
// file dell'anno non arriva, la mappa resta com'era e l'errore risale a chi ha chiesto.
async function applica(map, { anno, indicatore }) {
  const mia = ++sequenza;
  const dati = await carica(anno);
  if (mia !== sequenza) return; // è partita una richiesta più recente
  const ind = INDICATORI[indicatore];
  const src = { source: SRC_SEZIONI, sourceLayer: 'sezioni' };
  map.removeFeatureState(src);
  let nValori = 0;
  for (const rec of dati) {
    const v = ind.calcola(rec);
    if (v === null) continue;
    nValori++;
    map.setFeatureState({ ...src, id: rec.SEZ21_ID }, { v });
  }
  map.setPaintProperty('pop-fill', 'fill-color', espressione(ind.rampa));
  stato = { ...stato, anno, indicatore, nValori, anniDisponibili: Object.keys(indici).map(Number).sort() };
  disegnaLegenda(ind.rampa, anno);
}

export default {
  id: 'popolazione',
  titolo: 'Popolazione',
  aggiungiSorgenti() {},
  aggiungiLayer(map) {
    this._map = map; // serve a imposta(), chiamato anche dall'esterno (test, pannello)
    map.addLayer({
      id: 'pop-fill', type: 'fill', source: SRC_SEZIONI, 'source-layer': 'sezioni',
      paint: { 'fill-color': EDIFICATO_NEUTRAL, 'fill-opacity': 0.55 },
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
  pannello(el) {
    const anno = document.createElement('select');
    anno.id = 'pop-anno';
    anno.setAttribute('aria-label', 'Anno');
    anno.innerHTML = '<option value="2021">Censimento 2021</option><option value="2023">Censimento permanente 2023 (stime)</option>';
    const ind = document.createElement('select');
    ind.id = 'pop-indicatore';
    ind.setAttribute('aria-label', 'Indicatore');
    for (const [k, v] of Object.entries(INDICATORI)) ind.add(new Option(v.unita ? `${v.etichetta} (${v.unita})` : v.etichetta, k));
    legenda = document.createElement('div');
    legenda.className = 'legenda';
    const cambia = () => this.imposta({ anno: Number(anno.value), indicatore: ind.value }).catch(() => {
      segnala(`Popolazione ${anno.value} non disponibile: resta visibile ${stato.anno}`);
      anno.value = String(stato.anno);
      ind.value = stato.indicatore;
    });
    anno.addEventListener('change', cambia);
    ind.addEventListener('change', cambia);
    el.append(anno, ind, legenda);
  },
  async avvia(map) {
    await applica(map, stato);
    // l'altro anno si scarica in background: la scheda non dipende da cosa si è già selezionato
    const altro = stato.anno === 2021 ? 2023 : 2021;
    carica(altro).then(() => { stato = { ...stato, anniDisponibili: Object.keys(indici).map(Number).sort() }; }).catch(() => {});
  },
  async imposta({ anno, indicatore } = {}) {
    return applica(this._map, { anno: anno ?? stato.anno, indicatore: indicatore ?? stato.indicatore });
  },
  stato: () => stato,
  scheda: {
    layers: ['pop-hit'],
    voci(trovati) {
      const f = primo(trovati, 'pop-hit');
      if (!f) return [];
      const p = f.properties;
      const dellAnno = indici[stato.anno]?.get(p.SEZ21_ID);
      const r23 = indici[2023]?.get(p.SEZ21_ID);
      const senza = 'senza dato';
      const indicatori = Object.values(INDICATORI).map(ind => {
        const v = dellAnno ? ind.calcola(dellAnno) : null;
        return [`${ind.etichetta} ${stato.anno}${ind.unita ? ` (${ind.unita})` : ''}`, v === null ? senza : fmt(v)];
      });
      return [{
        chiave: 'sezione',
        peso: 70,
        titolo: 'Sezione di censimento',
        icona: 'fa-users',
        // circoscrizione, quartiere e UPL vanno nell'intestazione della scheda, una volta sola
        contesto: { circoscrizione: p.Circoscrizione, quartiere: p.Quartiere, upl: p.UPL },
        gruppi: [{ righe: righe([
          ['Codice ISTAT', p.SEZ21_ID],
          ['Residenti 2021', p.POP21 != null ? fmt(p.POP21) : null],
          ['Famiglie 2021', p.FAM21 != null ? fmt(p.FAM21) : null],
          ['Abitazioni 2021', p.ABI21 != null ? fmt(p.ABI21) : null],
          ...(indici[2023] ? [['Residenti 2023 (stima)', r23 && r23.P1 != null ? fmt(Number(r23.P1)) : senza]] : []),
          ...indicatori,
        ]) }],
      }];
    },
  },
};
