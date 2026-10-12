import { urlDati } from '../core/config.js';
import { aggiorna3D } from '../core/mappa.js';
import { primo } from '../core/scheda-util.js';
import { voceFiltro } from '../core/legenda.js';
import { t, tl } from '../core/i18n.js';
import { GRUPPI, COLORI_PIANI, altezze, filtroVolumi, filtroNumeri, coloreVolumi, righeScheda, pianiDa, nomePiano,
  prospettiVisibili, stanzeDelClic } from '../edificio/modello.js';
import { ID_PROSPETTI, creaLayerProspetti } from '../edificio/prospetti.js';

// Ex Noviziato dei Crociferi (Foro Umberto I 14): le piante DWG del Comune georeferenziate e messe in quota, piano per
// piano (scripts/edificio/crociferi.py). Lo strato estrude murature, aperture, solai, stanze, tetto e cupola; la legenda
// separa i piani (esploso), li accende uno per uno, apre la vista in pianta con i numeri delle stanze e posa i prospetti
// disegnati sulle facciate. La scheda dice piano, elemento e stanza del punto cliccato.
const DATI = 'edificio/crociferi/';
const SRC = 'crociferi';
const VOLUMI = 'crociferi-volumi';
const NUMERI = 'crociferi-numeri';
const STRATO = 'crociferi3d';
const CENTRO = [13.37285, 38.11666];

const stato = { passo: 0, piani: [], gruppi: GRUPPI.map(g => g.id), pianta: null, prima: null, prospetti: true };
let mappa = null;
let dati = null;
let legenda = null;
let prospettiPronti = null;

const el = (tag, classe, testo) => {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
};

function aggiorna() {
  if (!mappa?.getLayer(VOLUMI)) return;
  const { base, cima } = altezze(stato.passo);
  mappa.setPaintProperty(VOLUMI, 'fill-extrusion-base', base);
  mappa.setPaintProperty(VOLUMI, 'fill-extrusion-height', cima);
  mappa.setFilter(VOLUMI, filtroVolumi(stato.piani, stato.gruppi));
  mappa.setFilter(NUMERI, filtroNumeri(stato.pianta ? [stato.pianta] : []));
  const acceso = document.getElementById(`strato-${STRATO}`)?.checked;
  if (mappa.getLayer(ID_PROSPETTI)) {
    mappa.setLayoutProperty(ID_PROSPETTI, 'visibility', acceso && prospettiVisibili({ ...stato, acceso: stato.prospetti }) ? 'visible' : 'none');
  }
  if (!legenda) return;
  const cursore = legenda.querySelector('.cr-esploso input');
  cursore.value = String(stato.passo);
  legenda.querySelector('.cr-esploso output').textContent = `${String(stato.passo).replace('.', ',')} m`;
  for (const c of legenda.querySelectorAll('[data-piano] input')) c.checked = stato.piani.includes(c.closest('[data-piano]').dataset.piano);
  for (const c of legenda.querySelectorAll('[data-gruppo] input')) c.checked = stato.gruppi.includes(c.closest('[data-gruppo]').dataset.gruppo);
  for (const b of legenda.querySelectorAll('button[data-pianta]')) b.setAttribute('aria-pressed', String(stato.pianta === b.dataset.pianta));
}

// Vista in pianta: un solo piano, senza esploso né coperture, dall'alto, con i numeri delle stanze.
function entraPianta(piano) {
  if (!stato.pianta) stato.prima = { piani: stato.piani, gruppi: stato.gruppi, passo: stato.passo, pitch: mappa.getPitch() };
  Object.assign(stato, { pianta: piano, piani: [piano], gruppi: stato.prima.gruppi.filter(g => g !== 'copertura'), passo: 0 });
  mappa.easeTo({ pitch: 0, duration: 600 });
  mappa.setLayoutProperty(NUMERI, 'visibility', 'visible');
  aggiorna();
}

function esciPianta() {
  const p = stato.prima;
  if (p) Object.assign(stato, { piani: p.piani, gruppi: p.gruppi, passo: p.passo });
  stato.pianta = null;
  stato.prima = null;
  mappa.setLayoutProperty(NUMERI, 'visibility', 'none');
  mappa.easeTo({ pitch: p?.pitch || 55, duration: 600 });
  aggiorna();
}

function creaLegenda() {
  legenda = el('div', 'legenda legenda-monumenti legenda-uffici legenda-pai legenda-crociferi');
  legenda.hidden = true;
  document.getElementById('legende').append(legenda);
}

function riempiLegenda() {
  if (!legenda || !dati || legenda.dataset.pronta) return;
  legenda.dataset.pronta = '1';
  legenda.append(el('strong', null, tl('Ex Noviziato dei Crociferi')));

  const esploso = el('label', 'ic-etichetta cr-esploso');
  const cursore = el('input');
  Object.assign(cursore, { type: 'range', min: '0', max: '20', step: '0.5', value: '0' });
  cursore.addEventListener('input', () => { stato.passo = Number(cursore.value); aggiorna(); });
  esploso.append(t('edificio.esploso'), ' ', el('output', null, '0 m'), cursore);
  legenda.append(esploso);

  legenda.append(el('span', 'ic-etichetta', t('edificio.piani')));
  for (const p of [...pianiDa(dati)].reverse()) {
    const simbolo = el('i', 'pai-campione');
    simbolo.style.background = simbolo.style.borderColor = COLORI_PIANI[p.id] ?? '#ccc';
    const riga = voceFiltro(simbolo, nomePiano(p.id, p.nome), acceso => {
      stato.piani = acceso ? [...new Set([...stato.piani, p.id])] : stato.piani.filter(x => x !== p.id);
      aggiorna();
    }, true, false);
    riga.dataset.piano = p.id;
    if (p.id !== 'copertura') {
      const b = el('button', 'cr-pianta', t('edificio.pianta'));
      Object.assign(b, { type: 'button', title: t('edificio.pianta.tip') });
      b.dataset.pianta = p.id;
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', e => {
        e.preventDefault(); // dentro la <label>: il clic non deve spegnere il piano
        if (stato.pianta === p.id) esciPianta(); else entraPianta(p.id);
      });
      riga.append(b);
    }
    legenda.append(riga);
  }

  legenda.append(el('span', 'ic-etichetta', t('edificio.elementi')));
  for (const g of GRUPPI) {
    const riga = voceFiltro(el('i', 'cr-vuoto'), t(`edificio.gruppo.${g.id}`), acceso => {
      stato.gruppi = acceso ? [...new Set([...stato.gruppi, g.id])] : stato.gruppi.filter(x => x !== g.id);
      aggiorna();
    }, true, false);
    riga.dataset.gruppo = g.id;
    legenda.append(riga);
  }
  legenda.append(voceFiltro(el('i', 'cr-vuoto'), t('edificio.prospetti'), acceso => { stato.prospetti = acceso; aggiorna(); }, true, false));

  const tutti = el('button', 'cr-tutti', t('edificio.tutti'));
  tutti.type = 'button';
  tutti.addEventListener('click', () => {
    if (stato.pianta) esciPianta();
    Object.assign(stato, { piani: pianiDa(dati).map(p => p.id), gruppi: GRUPPI.map(g => g.id), passo: 0 });
    aggiorna();
  });
  legenda.append(tutti, el('p', 'uffici-nota', t('edificio.nota')));
}

async function aggiungiProspetti() {
  prospettiPronti ??= fetch(urlDati(`${DATI}prospetti.json`))
    .then(r => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
    .then(p => creaLayerProspetti(urlDati(DATI), p, dati.metadata?.centro ?? CENTRO))
    .then(layer => { mappa.addLayer(layer, NUMERI); aggiorna(); })
    .catch(err => console.warn('prospetti non disponibili', err)); // i18n-ok: messaggio solo per la console
  return prospettiPronti;
}

export default {
  id: 'crociferi',
  titolo: 'Ex Noviziato dei Crociferi in 3D',
  argomento: { titolo: 'Ex Noviziato dei Crociferi in 3D', descrizione: 'Le piante dell\'ex Noviziato dei Crociferi messe in quota piano per piano: esploso dei livelli, vista in pianta con i numeri delle stanze e prospetti sulle facciate.' },
  gruppo: 'edifici',
  aggiungiSorgenti(map) {
    map.addSource(SRC, { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, generateId: true });
  },
  aggiungiLayer(map) {
    mappa = map;
    const nascosto = { visibility: 'none' };
    map.addLayer({
      id: VOLUMI, type: 'fill-extrusion', source: SRC, minzoom: 15, layout: nascosto,
      filter: filtroVolumi([], []),
      paint: { 'fill-extrusion-color': coloreVolumi(), 'fill-extrusion-opacity': 1, 'fill-extrusion-vertical-gradient': true },
    });
    map.addLayer({
      id: NUMERI, type: 'symbol', source: SRC, minzoom: 16, filter: filtroNumeri([]),
      layout: { visibility: 'none', 'text-field': ['get', 'numero'], 'text-font': ['Noto Sans Bold'], 'text-size': 14, 'text-allow-overlap': true },
      paint: { 'text-color': '#1f2328', 'text-halo-color': '#ffffff', 'text-halo-width': 2 },
    });
    let evidenziato = null;
    const spegni = () => {
      if (evidenziato != null) map.setFeatureState({ source: SRC, id: evidenziato }, { evidenza: false });
      evidenziato = null;
    };
    map.on('mousemove', VOLUMI, e => {
      const f = e.features?.[0];
      if (!f || f.id === evidenziato) return;
      spegni();
      evidenziato = f.id;
      map.setFeatureState({ source: SRC, id: f.id }, { evidenza: true });
    });
    map.on('mouseleave', VOLUMI, spegni);
  },
  async avvia(map) {
    dati = await (await fetch(urlDati(`${DATI}crociferi.geojson`))).json();
    map.getSource(SRC).setData(dati);
    stato.piani = pianiDa(dati).map(p => p.id);
    riempiLegenda();
    aggiorna();
  },
  scheda: {
    layers: [VOLUMI],
    voci(trovati, lngLat) {
      const scelto = primo(trovati, VOLUMI);
      if (!scelto || !dati) return [];
      const f = dati.features[scelto.id] ?? scelto; // con generateId l'id è l'indice nel GeoJSON: lì la geometria è intera
      const stanze = stanzeDelClic(f, [lngLat.lng, lngLat.lat], dati.features);
      return [{
        chiave: 'crociferi',
        peso: 3, // subito dopo l'edificio, che la scheda mette sempre in testa
        badge: nomePiano(f.properties.piano, f.properties.nome_piano),
        sempre: true,
        strato: STRATO,
        titolo: tl('Ex Noviziato dei Crociferi'),
        icona: 'edificio',
        gruppi: [{ righe: righeScheda(f.properties, stanze).map(([etichetta, valore]) => ({ etichetta, valore: String(valore) })) }],
        fonte: tl('Piante: Comune di Palermo, Settore Centro Storico'),
      }];
    },
  },
  strati: [{
    id: STRATO, etichetta: 'Ex Noviziato dei Crociferi in 3D (in sviluppo)', layers: [VOLUMI], attivo: false, legendaIntegrata: '.legenda-crociferi',
    suCambio(attivo, map) {
      if (legenda) legenda.hidden = !attivo;
      if (!attivo && stato.pianta) esciPianta();
      aggiorna3D(map); // prima: la sua animazione (inclinazione) interromperebbe il volo verso l'edificio
      if (attivo) {
        aggiungiProspetti();
        // da sud-ovest: si vedono il fronte su via Torremuzza e la facciata lunga, quelle con i prospetti
        map.flyTo({ center: dati?.metadata?.centro ?? CENTRO, zoom: Math.max(map.getZoom(), 18.3), pitch: 55,
          bearing: 45 - (dati?.metadata?.rotazione ?? 31.5), duration: 1600 });
      }
      aggiorna();
    },
  }],
  pannello: creaLegenda,
};
