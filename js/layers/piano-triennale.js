import { urlDati } from '../core/config.js';
import { registraTooltipStrati, campioneTooltip } from '../core/tooltip.js';
import { tutti } from '../core/scheda-util.js';
import { filtroInsieme, voceFiltro } from '../core/legenda.js';
import { t, tl } from '../core/i18n.js';
import { apriPopupScheda } from './popup-traffico.js';
import { ANNUALITA, COLORE_APPROSSIMATO, SETTORI, accorcia, codici, coloreClasse, coloreSettore, euroCompatto, frase, indicePerCodice, modelloTooltip, nomeSettore, voceScheda, voceSintesi, voceTendina } from './scheda-piano-triennale.js';
import { contenutoDinamico, contenutoTendina } from './scheda-piano-triennale-dom.js';

// Programma triennale dei lavori pubblici 2026-2028 del Comune di Palermo (DCC 553/2026), dati in dati/piano-triennale/ (scripts/piano_triennale.py):
// 548 interventi per 4,37 miliardi di euro, di cui 454 con almeno una geometria (punti, linee, poligoni) ricavata dalle tavole del Programma.
// Sulla mappa le geometrie sono colorate per annualità; i dati completi (scheda D, fonti, elenco annuale, CUP) stanno nella tab «Piano triennale»
// della scheda, anche per i 94 interventi senza geometria. Gli strati «hit» trasparenti sono sempre presenti: la scheda funziona a strato spento.
const SRC = 'piano-triennale';
const POLI = 'piano-triennale-poli';
const CONTORNI = 'piano-triennale-contorni';
const LINEE = 'piano-triennale-linee';
const PUNTI = 'piano-triennale-punti';
const HIT_POLI = 'piano-triennale-hit-poli';
const HIT_LINEE = 'piano-triennale-hit-linee';
const HIT_PUNTI = 'piano-triennale-hit-punti';
const DISEGNATI = [POLI, CONTORNI, LINEE, PUNTI];
const HIT = [HIT_POLI, HIT_LINEE, HIT_PUNTI];
const MAX_NELLA_SCHEDA = 40;
const NON_INDICATA = 0; // classe 0 = geometria senza annualità (posizione approssimata)

let legenda = null;
let mappa = null;
let elenco = []; // tutti gli interventi (dati/piano-triennale/elenco.json)
let perCodice = new Map();
let sintesi = null;
const annualita = new Set([1, 2, 3, NON_INDICATA]);
const settori = new Set(SETTORI.map(([c]) => c));

const el = (tag, classe, testo) => {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = tl(testo);
  return e;
};

const classeDi = ['coalesce', ['get', 'classe'], NON_INDICATA];
const coloreMappa = ['match', classeDi, 1, coloreClasse(1), 2, coloreClasse(2), 3, coloreClasse(3), COLORE_APPROSSIMATO];
const eTipo = tipo => ['==', ['get', 'tipo'], tipo];

// Filtri della legenda (annualità e settore), uguali per lo strato disegnato e per quello «hit».
function filtro(tipo) {
  const f = [eTipo(tipo), filtroInsieme(classeDi, annualita, 4), filtroInsieme(['get', 'settore'], settori, SETTORI.length)].filter(Boolean);
  return f.length > 1 ? ['all', ...f] : f[0];
}

function applicaFiltri() {
  if (!mappa?.getLayer(HIT_PUNTI)) return;
  const tipi = { [POLI]: 'poligono', [CONTORNI]: 'poligono', [LINEE]: 'linea', [PUNTI]: 'punto', [HIT_POLI]: 'poligono', [HIT_LINEE]: 'linea', [HIT_PUNTI]: 'punto' };
  for (const [id, tipo] of Object.entries(tipi)) mappa.setFilter(id, filtro(tipo));
}

function creaLegenda() {
  legenda = el('div', 'legenda legenda-monumenti lg-piano-triennale');
  legenda.hidden = true;
  legenda.append(el('strong', null, 'Piano triennale lavori pubblici 2026-2028'), el('p', 'uffici-nota', t('piano.legendaNota')));
  legenda.append(el('em', 'peba-legenda-titolo', 'Annualità'));
  for (const [classe, nome, colore] of ANNUALITA) {
    const simbolo = el('i', 'monumenti-pallino');
    simbolo.style.background = colore;
    legenda.append(voceFiltro(simbolo, nome, acceso => { acceso ? annualita.add(classe) : annualita.delete(classe); applicaFiltri(); }, true, false));
  }
  const approssimata = el('i', 'monumenti-pallino');
  approssimata.style.background = COLORE_APPROSSIMATO;
  legenda.append(voceFiltro(approssimata, 'Posizione approssimata', acceso => { acceso ? annualita.add(NON_INDICATA) : annualita.delete(NON_INDICATA); applicaFiltri(); }, true, false));
  legenda.append(el('em', 'peba-legenda-titolo', 'Settore'));
  for (const [codice, nome, colore] of SETTORI) {
    const simbolo = el('i', 'monumenti-pallino');
    simbolo.style.background = colore;
    legenda.append(voceFiltro(simbolo, nome, acceso => { acceso ? settori.add(codice) : settori.delete(codice); applicaFiltri(); }, true, false));
  }
  document.getElementById('legende').append(legenda);
}

// Corpo del popup al clic: titolo dell'intervento, poi settore, importo del triennio e annualità come etichette colorate, e l'invito ad aprire la scheda.
function corpoPopup(p) {
  const corpo = document.createElement('div');
  const titolo = document.createElement('p');
  titolo.className = 'monumento-desc';
  titolo.textContent = tl(accorcia(frase(p.titolo) ?? p.cod ?? ''));
  corpo.append(titolo);
  const etichette = [
    p.settore ? [tl(nomeSettore(p.settore)), coloreSettore(p.settore)] : null,
    euroCompatto(p.importo) ? [euroCompatto(p.importo), '#f08c00'] : null,
    Number(p.classe) ? [String(2025 + Number(p.classe)), coloreClasse(p.classe)] : null,
  ].filter(Boolean);
  const riga = document.createElement('div');
  riga.className = 'traffico-etichette';
  for (const [testo, colore] of etichette) {
    const e = document.createElement('span');
    e.className = 'tooltip-badge';
    e.style.setProperty('--colore', colore);
    e.textContent = testo;
    riga.append(e);
  }
  const invito = document.createElement('p');
  invito.className = 'monumento-desc uffici-suggerimento';
  invito.textContent = t('piano.popupSuggerimento');
  corpo.append(riga, invito);
  return [corpo];
}

export default {
  id: 'piano-triennale',
  titolo: 'Piano triennale lavori pubblici 2026-2028',
  argomento: {
    titolo: 'Piano triennale lavori pubblici 2026-2028',
    descrizione: 'Programma triennale dei lavori pubblici 2026-2028 del Comune di Palermo (DCC 553/2026): 548 interventi per 4,37 miliardi di euro, di cui 454 localizzati sulla mappa (punti, linee, poligoni colorati per annualità). Nella scheda, tab Piano triennale: importi per anno, fonti di finanziamento, elenco annuale, CUP e grafici sull’intero Programma, anche per gli interventi senza geometria.',
  },
  gruppo: 'territorio',
  sezione: '', // nessun titolo proprio: lo strato sta sotto «Opere pubbliche», creato dal modulo opere (che lo precede in MODULI)
  aggiungiSorgenti(map) {
    map.addSource(SRC, { type: 'geojson', data: urlDati('piano-triennale/interventi.geojson') });
  },
  aggiungiLayer(map) {
    mappa = map;
    const nascosto = { visibility: 'none' };
    map.addLayer({ id: POLI, type: 'fill', source: SRC, filter: filtro('poligono'), layout: nascosto, paint: { 'fill-color': coloreMappa, 'fill-opacity': 0.43 } });
    map.addLayer({
      id: CONTORNI, type: 'line', source: SRC, filter: filtro('poligono'), layout: nascosto,
      paint: { 'line-color': coloreMappa, 'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.6, 17, 1.6] },
    });
    map.addLayer({
      id: LINEE, type: 'line', source: SRC, filter: filtro('linea'), layout: { ...nascosto, 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': coloreMappa, 'line-width': ['interpolate', ['linear'], ['zoom'], 11, 1.2, 14, 2.6, 17, 5] },
    });
    map.addLayer({
      id: PUNTI, type: 'circle', source: SRC, filter: filtro('punto'), layout: nascosto,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 2.5, 14, 4.5, 17, 8], 'circle-color': coloreMappa,
        'circle-stroke-color': '#282828', 'circle-stroke-width': 0.8,
      },
    });
    // trasparenti e sempre presenti: la scheda mostra gli interventi anche a strato spento
    map.addLayer({ id: HIT_POLI, type: 'fill', source: SRC, filter: filtro('poligono'), paint: { 'fill-color': '#000', 'fill-opacity': 0 } });
    map.addLayer({ id: HIT_LINEE, type: 'line', source: SRC, filter: filtro('linea'), paint: { 'line-color': '#000', 'line-opacity': 0, 'line-width': 14 } });
    map.addLayer({ id: HIT_PUNTI, type: 'circle', source: SRC, filter: filtro('punto'), paint: { 'circle-radius': 10, 'circle-opacity': 0 } });
    registraTooltipStrati(map, [{
      layers: [PUNTI, LINEE, POLI], icona: 'piano', modello: modelloTooltip,
      campione: p => campioneTooltip('legenda-monumenti', ['monumenti-pallino', { background: coloreSettore(p.settore) }]),
    }]);
    let popup = null;
    map.on('click', e => {
      const attivi = [PUNTI, LINEE, POLI].filter(id => map.getLayoutProperty(id, 'visibility') === 'visible');
      const f = attivi.length ? map.queryRenderedFeatures([[e.point.x - 4, e.point.y - 4], [e.point.x + 4, e.point.y + 4]], { layers: attivi })[0] : null;
      if (!f) { popup?.remove(); return; }
      const p = f.properties;
      popup = apriPopupScheda(map, {
        precedente: popup, sezione: 'Piano triennale LL.PP.', icona: 'piano', colore: coloreSettore(p.settore),
        modello: { titolo: p.cod ?? '', sottotitolo: null }, corpo: corpoPopup(p), punto: e.point, lngLat: e.lngLat,
      });
    });
    for (const id of [PUNTI, LINEE, POLI]) {
      map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
    }
  },
  async avvia() {
    const leggi = nome => fetch(urlDati(`piano-triennale/${nome}`)).then(r => r.json());
    [elenco, sintesi] = await Promise.all([leggi('elenco.json'), leggi('sintesi.json')]);
    perCodice = indicePerCodice(elenco);
  },
  legendaPannello: '.lg-piano-triennale', // legenda sotto lo strato nel pannello (core/legenda-pannello.js)
  strati: [{
    id: 'piano-triennale', etichetta: 'Piano triennale lavori pubblici 2026-2028', layers: DISEGNATI, attivo: false,
    suCambio(attivo) { if (legenda) legenda.hidden = !attivo; },
  }],
  pannello: creaLegenda,
  scheda: {
    vicini: { max: 5 }, // anche i punti nei dintorni del clic (vedi docs/NUOVO_LAYER.md)
    layers: HIT,
    // nella tab Piano triennale: la ricerca in testa, gli interventi cliccati e, sempre, la sintesi con i grafici dell'intero Programma
    voci(trovati) {
      const visti = new Set();
      const dellaScheda = HIT.flatMap(id => tutti(trovati, id))
        .flatMap(f => codici(f.properties.cod))
        .map(cod => perCodice.get(cod))
        .filter(o => o && !visti.has(o.cod) && visti.add(o.cod))
        .slice(0, MAX_NELLA_SCHEDA)
        .map(voceScheda);
      return [...(elenco.length ? [voceTendina(elenco, contenutoTendina)] : []), ...dellaScheda, ...(sintesi ? [voceSintesi(sintesi, contenutoDinamico)] : [])];
    },
  },
};
