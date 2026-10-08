import { urlDati, pmt } from '../core/config.js';
import { registraTooltipStrati } from '../core/tooltip.js';
import { tutti } from '../core/scheda-util.js';
import { filtroInsieme, voceFiltro } from '../core/legenda.js';
import { chiavePai, modelloPopup, vociPai } from './scheda-pai.js';
import { tl, t } from '../core/i18n.js';
import { registraSorgenti } from '../core/tabella/sorgenti.js';

// Vincoli del PAI (Piano di Assetto Idrogeologico, Regione Siciliana) nel Comune di Palermo: pericolosità e rischio idraulico e geomorfologico,
// dissesti, siti di attenzione, erosione costiera. Un solo PMTiles (zoom 12–18) con uno strato per dataset.
// Dati e simbologia del server stanno in dati/pai/pai.json (workflow «Aggiorna PAI»): i temi, le classi e i colori si leggono da lì,
// ogni feature porta la propria classe (`cls_<tema>`) e i colori (`col_<tema>`, `bor_<tema>`). I temi senza elementi a Palermo non compaiono.
// Il popup è breve; il dettaglio sta nella scheda di destra, anche a strato spento (layer «hit» trasparente, sempre presente).
const SRC = 'pai';
const MINZOOM = 12;
const OPACITA = 0.65; // sul server i riempimenti sono pieni; qui lasciano vedere base ed edifici sotto
const TRASPARENTE = 'rgba(0,0,0,0)'; // valori senza simbolo sul server (es. pericolo 0): il server non li disegna
const MAX_NEL_POPUP = 4;
const MAX_PER_DATASET_IN_SCHEDA = 4;

const el = (tag, classe, testo) => {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = tl(testo);
  return e;
};

// Il manifest decide quali strati esistono: lo si legge subito (modulo ES con await) perché `strati` serve prima dell'avvio della mappa.
async function leggiManifest() {
  try {
    const r = await fetch(urlDati('pai/pai.json'));
    if (!r.ok) throw new Error(r.status);
    return (await r.json()).dataset.filter(d => d.n > 0);
  } catch {
    return [];
  }
}
const DATASET = await leggiManifest();

const idFill = t => `pai-${t.id}-fill`;
const idBordo = t => `pai-${t.id}-bordo`;
const idLinea = t => `pai-${t.id}-linea`;
const idHit = ds => `pai-${ds.id}-hit`;
const TEMI = DATASET.flatMap(ds => ds.temi.map(t => ({ ds, t })));
const layerDelTema = ({ ds, t }) => (ds.geometria === 'linea' ? [idLinea(t)] : [idFill(t), ...(t.classi.some(c => c.bordo) ? [idBordo(t)] : [])]);
// Una scheda della tabella per dataset del manifest: colonne di stile (col_, bor_, pat_) nascoste.
registraSorgenti(DATASET.map(ds => ({
  id: `pai-${ds.id}`, nome: `PAI: ${ds.titolo}`, strati: [idHit(ds)], visibili: ds.temi.flatMap(t => layerDelTema({ ds, t })),
  chiave: p => chiavePai(ds, p), colonne: campi => campi.filter(c => !/^(col|bor|pat)_/.test(c)),
  fonte: t('tabella.fonte.pai'), approssimata: true, esporta: true, colore: ds.temi[0].classi.find(c => c.n > 0)?.colore ?? '#2b8a3e',
})));
const classiConElementi = t => t.classi.filter(c => c.n > 0);
const campioneMatch = (t, f) => {
  const c = classiConElementi(t);
  return c.length === 1 ? f(c[0]) : ['match', ['get', `cls_${t.id}`], ...c.flatMap(k => [k.label, f(k)]), f(c[0])];
};

// Albero del pannello Layer (come nel progetto QGIS): Geomorfologia / Idraulica / Coste, con gli strati nell'ordine del progetto.
// Un tema non elencato (nuovo dataset del manifest) va in coda al suo gruppo, o in «Coste».
const ALBERO = new Map([
  ['geo_rischio', ['Geomorfologia', 0]], ['geo_fascia_p3p4', ['Geomorfologia', 1]], ['dissesti_attivita', ['Geomorfologia', 2]],
  ['dissesti_tipologia', ['Geomorfologia', 3]], ['geo_pericolosita', ['Geomorfologia', 4]], ['geo_siti', ['Geomorfologia', 5]],
  ['idraulica_rischio', ['Idraulica', 0]], ['idraulica_pericolosita', ['Idraulica', 1]], ['idraulica_siti', ['Idraulica', 2]],
  ['idraulica_esondazioni_manovra', ['Idraulica', 3]], ['idraulica_esondazioni_collasso', ['Idraulica', 4]],
]);
const GRUPPI = ['Geomorfologia', 'Idraulica', 'Coste'];
const posizione = ({ t }) => { const [g, i] = ALBERO.get(t.id) ?? ['Coste', 99]; return GRUPPI.indexOf(g) * 100 + i; };
const ordinaPerAlbero = temi => [...temi].sort((a, b) => posizione(a) - posizione(b));

let legenda = null;
const accesi = new Map(); // tema -> classi accese (assente = tutte)

// Un elemento per chiave: i tile spezzano le feature.
function distinti(feature, ds) {
  const visti = new Set();
  return feature.filter(f => {
    const k = chiavePai(ds, f.properties);
    return visti.has(k) ? false : (visti.add(k), true);
  });
}

function contenutoPopup(lista) {
  const radice = el('div', 'monumento-popup pai-popup');
  for (const { f, ds, t } of lista.slice(0, MAX_NEL_POPUP)) {
    const m = modelloPopup(ds, t, f.properties);
    const blocco = el('div', 'pai-popup-voce');
    blocco.append(el('h3', null, m.titolo));
    if (m.sottotitolo && m.sottotitolo !== m.titolo) blocco.append(el('p', 'monumento-cat', m.sottotitolo));
    for (const r of m.righe) blocco.append(el('p', 'monumento-desc', `${r.etichetta}: ${r.valore}`));
    radice.append(blocco);
  }
  if (lista.length > MAX_NEL_POPUP) radice.append(el('p', 'monumento-desc', `… e altri ${lista.length - MAX_NEL_POPUP} vincoli`));
  radice.append(el('p', 'monumento-desc uffici-suggerimento', 'Tutti i dati nella scheda a destra.'));
  return radice;
}

// ---- legenda -------------------------------------------------------------------------------------------------------------------------

function campione(ds, c) {
  const i = el('i', 'pai-campione');
  if (ds.geometria === 'linea') {
    i.classList.add('pai-campione--linea');
    i.style.background = c.colore;
    i.style.height = `${Math.max(2, Math.round((c.spessore ?? 1.5) * 1.3))}px`;
  } else if (c.pattern) {
    i.style.backgroundImage = `url(data:image/png;base64,${c.pattern})`;
    i.style.backgroundColor = '#fff';
  } else {
    i.style.background = c.colore;
    i.style.borderColor = c.bordo ?? c.colore;
    i.style.opacity = String(Math.max(c.opacita * OPACITA, 0.5));
  }
  return i;
}

function applicaFiltro(map, tema) {
  const classi = classiConElementi(tema.t);
  const insieme = accesi.get(tema.t.id);
  const f = insieme ? filtroInsieme(['get', `cls_${tema.t.id}`], insieme, classi.length) : null;
  for (const id of layerDelTema(tema)) map.setFilter(id, f);
}

function creaLegenda() {
  legenda = el('div', 'legenda legenda-monumenti legenda-uffici legenda-pai');
  legenda.hidden = true;
  legenda.append(el('p', 'uffici-nota', 'Simbologia della Regione Siciliana (PAI)'));
  document.getElementById('legende').append(legenda);
}

function riempiLegenda(map) {
  for (const tema of TEMI) {
    const { ds, t } = tema;
    const classi = classiConElementi(t);
    const blocco = el('div', 'pai-legenda-tema');
    blocco.dataset.tema = t.id;
    blocco.hidden = true;
    blocco.append(el('strong', null, t.titolo));
    if (t.campo) {
      for (const c of classi) {
        blocco.append(voceFiltro(campione(ds, c), `${tl(c.label)} (${c.n})`, acceso => {
          const set = accesi.get(t.id) ?? new Set(classi.map(k => k.label));
          acceso ? set.add(c.label) : set.delete(c.label);
          set.size >= classi.length ? accesi.delete(t.id) : accesi.set(t.id, set);
          applicaFiltro(map, tema);
        }));
      }
    } else {
      const riga = el('div', 'monumenti-cat');
      riga.append(campione(ds, classi[0]), `${tl(classi[0].label)} (${classi[0].n})`);
      blocco.append(riga);
    }
    legenda.append(blocco);
  }
}

function aggiornaLegenda() {
  if (!legenda) return;
  let qualcuno = false;
  for (const b of legenda.querySelectorAll('.pai-legenda-tema')) {
    const acceso = document.getElementById(`strato-${b.dataset.tema}`)?.checked ?? false;
    b.hidden = !acceso;
    qualcuno ||= acceso;
  }
  legenda.hidden = !qualcuno;
}

// ---- layer ---------------------------------------------------------------------------------------------------------------------------

// Retini dei dissesti per tipologia: il server li disegna con immagini PNG, qui diventano immagini della mappa.
function registraRetini(map) {
  for (const { t } of TEMI) {
    t.classi.forEach((c, i) => {
      if (!c.pattern || c.n === 0) return;
      map.loadImage(`data:image/png;base64,${c.pattern}`).then(({ data }) => map.addImage(`pai-${t.id}-${i}`, data)).catch(() => {});
    });
  }
}

function aggiungiTema(map, { ds, t }) {
  const nascosto = { visibility: 'none' };
  const sl = ds.id;
  const classi = classiConElementi(t);
  const op = classi[0].opacita ?? 1;
  if (ds.geometria === 'linea') {
    map.addLayer({
      id: idLinea(t), type: 'line', source: SRC, 'source-layer': sl, minzoom: MINZOOM, layout: { ...nascosto, 'line-cap': 'round' },
      paint: {
        'line-color': ['coalesce', ['get', `col_${t.id}`], TRASPARENTE], 'line-opacity': op,
        'line-width': campioneMatch(t, c => Math.max(2, (c.spessore ?? 1.5) * 1.6)),
      },
    });
    return;
  }
  const retino = classi.some(c => c.pattern);
  map.addLayer({
    id: idFill(t), type: 'fill', source: SRC, 'source-layer': sl, minzoom: MINZOOM, layout: nascosto,
    paint: retino
      ? { 'fill-pattern': ['get', `pat_${t.id}`], 'fill-opacity': 0.85 }
      : { 'fill-color': ['coalesce', ['get', `col_${t.id}`], TRASPARENTE], 'fill-opacity': Math.min(1, op * OPACITA) },
  });
  if (t.classi.some(c => c.bordo)) {
    const spessore = Math.max(0.5, (classi.find(c => c.bordo)?.spessore_bordo ?? 0.4) * 1.3);
    map.addLayer({
      id: idBordo(t), type: 'line', source: SRC, 'source-layer': sl, minzoom: MINZOOM, layout: nascosto,
      paint: { 'line-color': ['coalesce', ['get', `bor_${t.id}`], ['get', `col_${t.id}`], TRASPARENTE], 'line-width': spessore, 'line-opacity': 0.9 },
    });
  }
}

export default {
  id: 'pai',
  titolo: 'Vincoli PAI',
  argomento: { titolo: 'Vincoli PAI', descrizione: 'Piano di Assetto Idrogeologico della Regione Siciliana nel Comune di Palermo: pericolosità e rischio idraulico e geomorfologico, dissesti, siti di attenzione ed erosione costiera, con la simbologia del server.' },
  aggiungiSorgenti(map) {
    if (DATASET.length) map.addSource(SRC, { type: 'vector', url: pmt('pai/pai.pmtiles') });
  },
  aggiungiLayer(map) {
    if (!DATASET.length) return;
    registraRetini(map);
    // sotto: aree (pericolosità, rischio), sopra: dissesti, siti e linee
    for (const tema of TEMI) aggiungiTema(map, tema);
    // elementi trasparenti sempre presenti: la scheda del luogo mostra i vincoli anche a strato spento
    for (const ds of DATASET) {
      map.addLayer(ds.geometria === 'linea'
        ? { id: idHit(ds), type: 'line', source: SRC, 'source-layer': ds.id, minzoom: MINZOOM, paint: { 'line-width': 12, 'line-opacity': 0 } }
        : { id: idHit(ds), type: 'fill', source: SRC, 'source-layer': ds.id, minzoom: MINZOOM, paint: { 'fill-opacity': 0 } });
    }
    let popup = null;
    map.on('click', e => {
      const attivi = TEMI.filter(tema => map.getLayoutProperty(layerDelTema(tema)[0], 'visibility') === 'visible');
      if (!attivi.length) return;
      const lista = [];
      for (const tema of attivi) {
        for (const f of distinti(map.queryRenderedFeatures(e.point, { layers: layerDelTema(tema).slice(0, 1) }), tema.ds)) lista.push({ f, ds: tema.ds, t: tema.t });
      }
      popup?.remove();
      if (!lista.length) return;
      popup = new maplibregl.Popup({ maxWidth: '300px', className: 'monumento-popup-box', offset: 8 })
        .setLngLat(e.lngLat).setDOMContent(contenutoPopup(lista)).addTo(map);
    });
    registraTooltipStrati(map, TEMI.map(tema => ({ layers: layerDelTema(tema).slice(0, 1), modello: p => modelloPopup(tema.ds, tema.t, p) })));
    const tuttiLayer = TEMI.flatMap(layerDelTema);
    for (const id of tuttiLayer) {
      map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
    }
  },
  avvia(map) {
    riempiLegenda(map);
    aggiornaLegenda();
  },
  scheda: {
    layers: DATASET.map(idHit),
    voci: trovati => vociPai(DATASET.flatMap(ds => {
      const visti = new Set();
      return tutti(trovati, idHit(ds)).map(f => f.properties).filter(p => {
        const k = chiavePai(ds, p);
        return visti.has(k) ? false : (visti.add(k), true);
      }).slice(0, MAX_PER_DATASET_IN_SCHEDA).map(p => ({ ds, p }));
    })),
  },
  strati: ordinaPerAlbero(TEMI).map(tema => ({
    id: tema.t.id, etichetta: tema.t.titolo, layers: layerDelTema(tema), attivo: false, sezione: ALBERO.get(tema.t.id)?.[0] ?? 'Coste',
    suCambio: aggiornaLegenda,
  })),
  pannello: creaLegenda,
};
