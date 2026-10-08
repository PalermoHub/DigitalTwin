import { urlDati } from '../core/config.js';
import { INDICATORI } from '../core/indicatori.js';
import { daColonne } from '../core/compatto.js';
import { EDIFICATO_NEUTRAL, densityLegendStops, densityStops } from '../core/palette.js';
import { segnala } from '../core/pannello.js';
import { voceFiltro } from '../core/legenda.js';
import { primo, righe } from '../core/scheda-util.js';
import { SRC_SEZIONI } from './confini.js';
import { classificaDinamica } from './popolazione-classifica.js';
import { t, localeIntl } from '../core/i18n.js';

const FILE = { 2021: 'popolazione/sezioni_indicatori.compatto.json', 2023: 'popolazione/sezioni_indicatori_2023.compatto.json' };
const fmt = v => v.toLocaleString(localeIntl(), { maximumFractionDigits: 1 });

const promesse = {};
const indici = {};
let stato = { anno: 2021, indicatore: 'densita', nValori: 0, anniDisponibili: [] };
let sequenza = 0;
let legenda = null;
const nascoste = new Set(); // classi spente dalla legenda: -1 = «senza dato», 0… = intervalli della rampa
const TRASPARENTE = 'rgba(0, 0, 0, 0)';

// un solo download per anno anche se richiesto più volte; dopo un errore si può riprovare
function carica(anno) {
  promesse[anno] ??= fetch(urlDati(FILE[anno]))
    .then(r => {
      if (!r.ok) throw new Error(`popolazione ${anno}`);
      return r.json();
    })
    .then(daColonne)
    .then(dati => {
      indici[anno] = new Map(dati.map(rec => [rec.SEZ21_ID, rec]));
      return dati;
    })
    .catch(err => { delete promesse[anno]; throw err; });
  return promesse[anno];
}

// Stessa espressione dell'app originale (vecchiaiaExpression): rampa lineare dalla palette,
// neutro per le sezioni senza valore. Le classi spente dalla legenda diventano trasparenti
// (un filtro non può leggere il feature-state): la classe i copre [stop i, stop i+1), la prima parte da -∞.
function espressione(rampa) {
  const stops = densityStops(rampa, false);
  const v = ['number', ['feature-state', 'v']];
  const ramp = ['interpolate', ['linear'], ['feature-state', 'v'], ...stops.flat()];
  const spente = [];
  stops.forEach(([soglia], i) => {
    if (!nascoste.has(i)) return;
    const sotto = i + 1 < stops.length ? [['<', v, stops[i + 1][0]]] : [];
    spente.push(i === 0 ? sotto[0] : ['all', ['>=', v, soglia], ...sotto], TRASPARENTE);
  });
  return ['case', ['==', ['feature-state', 'v'], null], nascoste.has(-1) ? TRASPARENTE : EDIFICATO_NEUTRAL, ...spente, ramp];
}

// Ogni voce è un filtro: spegnerla rende trasparenti le sezioni di quella classe.
function disegnaLegenda(map, rampa, anno) {
  if (!legenda) return;
  nascoste.clear();
  const voci = [{ value: 'senza dato', color: EDIFICATO_NEUTRAL }, ...densityLegendStops(rampa, false)];
  const righe = voci.map(({ value, color }, k) => {
    const chip = document.createElement('i');
    chip.style.background = color;
    return voceFiltro(chip, value, acceso => {
      const classe = k - 1; // la voce 0 della legenda è «senza dato»
      acceso ? nascoste.delete(classe) : nascoste.add(classe);
      map.setPaintProperty('pop-fill', 'fill-color', espressione(rampa));
    });
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
  nascoste.clear(); // nuovo indicatore o anno: la legenda riparte con tutte le classi accese
  map.setPaintProperty('pop-fill', 'fill-color', espressione(ind.rampa));
  stato = { ...stato, anno, indicatore, nValori, anniDisponibili: Object.keys(indici).map(Number).sort() };
  disegnaLegenda(map, ind.rampa, anno);
}

export default {
  id: 'popolazione',
  titolo: 'Popolazione',
  argomento: { titolo: 'Abitanti', descrizione: 'Popolazione residente per sezione di censimento, dal censimento permanente (stime campionarie).' },
  aggiungiSorgenti() {},
  aggiungiLayer(map) {
    this._map = map; // serve a imposta(), chiamato anche dall'esterno (test, pannello)
    map.addLayer({
      id: 'pop-fill', type: 'fill', source: SRC_SEZIONI, 'source-layer': 'sezioni', layout: { visibility: 'none' },
      paint: { 'fill-color': EDIFICATO_NEUTRAL, 'fill-opacity': 0.55 },
    });
    // sempre presente e invisibile: serve alla scheda del luogo anche con il coropletico spento
    map.addLayer({
      id: 'pop-hit', type: 'fill', source: SRC_SEZIONI, 'source-layer': 'sezioni',
      paint: { 'fill-opacity': 0 },
    });
  },
  strati: [{
    id: 'coropletico', etichetta: 'Popolazione per sezione', layers: ['pop-fill'], attivo: false,
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
    legenda.hidden = true; // il coropletico parte spento
    const cambia = () => this.imposta({ anno: Number(anno.value), indicatore: ind.value }).catch(() => {
      segnala(t('popolazione.annoNd', { anno: anno.value, visibile: stato.anno }));
      anno.value = String(stato.anno);
      ind.value = stato.indicatore;
    });
    anno.addEventListener('change', cambia);
    ind.addEventListener('change', cambia);
    el.append(anno, ind);
    document.getElementById('legende').append(legenda);
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
        strato: 'coropletico',
        titolo: 'Sezione di censimento',
        icona: 'persone',
        // circoscrizione, quartiere e UPL vanno nell'intestazione della scheda, una volta sola
        link: [{ testo: 'Esplorazione demografica', icona: 'esterno', url: 'https://palermohub.opendatasicilia.it/palermo_popolazione.html' }, { testo: 'ANNCUS', icona: 'esterno', url: 'https://palermohub.opendatasicilia.it/anncus.html' },
          { testo: 'Densità pop. × Offerta TPL', icona: 'esterno', url: 'https://palermohub.opendatasicilia.it/bivariate_tpl.html', suggerimento: 'Densità pop. (ab/km²) × Offerta TPL (corse/ab)' },
          { testo: 'Densità civici × popolazione', icona: 'esterno', url: 'https://palermohub.opendatasicilia.it/bivariate_anncus.html', suggerimento: 'Densità Civici × Densità Popolazione · Palermo' },
          { testo: 'Popolazione esposta a rischio idrogeologico', icona: 'esterno', url: 'https://palermohub.opendatasicilia.it/bivariate_pai.html', suggerimento: 'Capire il rischio sul territorio' }],
        contesto: { circoscrizione: p.Circoscrizione, quartiere: p.Quartiere, upl: p.UPL },
        dinamico: () => classificaDinamica({ circoscrizione: p.Circoscrizione, quartiere: p.Quartiere, upl: p.UPL }),
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
