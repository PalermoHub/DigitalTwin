// Modello puro della scheda dei «Luoghi quotidiani» da OpenStreetMap: alimentari, cibo e bevande, negozi, salute, parchi.
// Sono i bisogni di Walkably che non hanno un layer nostro; le categorie ricalcano il suo README (scripts/luoghi_osm.py).
// Stesse righe per voce della scheda e popup.
import { righe } from '../core/scheda-util.js';
import { t, tl } from '../core/i18n.js';
import { urlPercorso, urlPercorsoOsm } from './camminabilita-luoghi.js';

export const PESO = 104; // tab «Walkably», con la camminabilità
export const URL_OSM = 'https://www.openstreetmap.org/copyright';
export const FONTE = 'OpenStreetMap, © OpenStreetMap contributors, licenza ODbL 1.0. Estrazione di novembre 2026; le categorie seguono quelle di Walkably.';

// Un'icona e un colore per bisogno (k = campo di Walkably). L'ordine è quello del pannello Layer. Le forme restano distinguibili anche senza il colore.
export const BISOGNI = [
  { k: 0, id: 'alimentari', etichetta: 'Alimentari', icona: 'spesa', colore: '#5c940d' },
  { k: 1, id: 'cibo', etichetta: 'Cibo e bevande', icona: 'tazza', colore: '#e8590c' },
  { k: 3, id: 'salute', etichetta: 'Salute', icona: 'salute', colore: '#e03131', senzaTipo: 'pharmacy' }, // le farmacie hanno il loro strato, in verde
  { k: 3, id: 'farmacie', etichetta: 'Farmacie', icona: 'farmacia', colore: '#0ca678', soloTipo: 'pharmacy' },
  { k: 5, id: 'parchi', etichetta: 'Parchi e giardini', icona: 'parco', colore: '#2b8a3e' },
  { k: 2, id: 'negozi', etichetta: 'Negozi', icona: 'negozio', colore: '#7048e8' },
];
// Il bisogno di un punto: a parità di `k` conta il tipo OSM (la farmacia non è «Salute»).
export const bisogno = (k, tipo) => BISOGNI.find(b => b.k === Number(k) && (b.soloTipo ? b.soloTipo === tipo : b.senzaTipo ? b.senzaTipo !== tipo : true)) ?? null;
// Filtro MapLibre del livello di un bisogno.
export const filtroBisogno = b => ['all', ['==', ['get', 'k'], b.k], ...(b.soloTipo ? [['==', ['get', 'tipo'], b.soloTipo]] : []), ...(b.senzaTipo ? [['!=', ['get', 'tipo'], b.senzaTipo]] : [])];

// Tipo OSM in italiano; i valori non elencati restano come sono (sono etichette tecniche di OpenStreetMap).
const TIPI = {
  supermarket: 'Supermercato', convenience: 'Minimarket', greengrocer: 'Fruttivendolo', bakery: 'Panetteria', pastry: 'Pasticceria', butcher: 'Macelleria',
  deli: 'Gastronomia', seafood: 'Pescheria', cheese: 'Formaggi', dairy: 'Latticini', frozen_food: 'Surgelati', health_food: 'Alimenti biologici', farm: 'Vendita diretta', marketplace: 'Mercato',
  restaurant: 'Ristorante', cafe: 'Caffè', bar: 'Bar', pub: 'Pub', fast_food: 'Fast food', ice_cream: 'Gelateria', food_court: 'Area ristoro', biergarten: 'Birreria all\'aperto',
  pharmacy: 'Farmacia', doctors: 'Medico', clinic: 'Ambulatorio', hospital: 'Ospedale', dentist: 'Dentista', optician: 'Ottico', hearing_aids: 'Apparecchi acustici',
  physiotherapist: 'Fisioterapista', laboratory: 'Laboratorio', blood_donation: 'Donazione sangue', rehabilitation: 'Riabilitazione', centre: 'Centro sanitario',
  park: 'Parco', garden: 'Giardino', playground: 'Area giochi',
  bank: 'Banca', post_office: 'Ufficio postale', clothes: 'Abbigliamento', shoes: 'Calzature', hairdresser: 'Parrucchiere', beauty: 'Estetista', tobacco: 'Tabaccheria',
  newsagent: 'Edicola', kiosk: 'Chiosco', florist: 'Fioraio', furniture: 'Mobili', electronics: 'Elettronica', jewelry: 'Gioielleria', stationery: 'Cartoleria',
  car_repair: 'Officina', car: 'Concessionaria', tyres: 'Gommista', bicycle: 'Biciclette', doityourself: 'Fai da te', books: 'Libreria', mobile_phone: 'Telefonia',
  estate_agent: 'Agenzia immobiliare', laundry: 'Lavanderia', variety_store: 'Bazar', general: 'Negozio generico', department_store: 'Grande magazzino', mall: 'Centro commerciale',
};
export const tipoIt = tipo => TIPI[tipo] ?? tipo ?? '';
export const TIPI_ELENCO = Object.values(TIPI);

// Punti `[lon, lat, nome, tipo]` del file compatto → feature GeoJSON per la mappa.
export function featureDaLuoghi(bisogni) {
  const feature = [];
  for (const [k, punti] of Object.entries(bisogni ?? {})) {
    punti.forEach(([lon, lat, nome, tipo], i) => feature.push({
      type: 'Feature', geometry: { type: 'Point', coordinates: [lon, lat] }, properties: { id: `osm-${k}-${i}`, k: Number(k), nome, tipo, lon, lat },
    }));
  }
  return { type: 'FeatureCollection', features: feature };
}

const titolo = p => p.nome || tipoIt(p.tipo) || bisogno(p.k, p.tipo)?.etichetta || 'Luogo';

// Il percorso sta in una riga della card (il campo `link` di una voce finisce nella barra in fondo alla scheda, non nella card).
export const conCoordinate = p => Number.isFinite(Number(p.lon)) && Number.isFinite(Number(p.lat));

function righePunto(p) {
  const b = bisogno(p.k, p.tipo);
  const base = righe([['Tipo', p.nome ? tipoIt(p.tipo) : null], ['Bisogno', b?.etichetta]]);
  return conCoordinate(p) ? [...base,
    { etichetta: 'Percorso a piedi', valore: 'Apri in Google Maps', urlValore: urlPercorso(p.lon, p.lat) },
    { etichetta: 'Percorso a piedi (OpenStreetMap)', valore: 'Apri in OpenStreetMap', urlValore: urlPercorsoOsm(p.lon, p.lat) }] : base;
}

export function voceLuogoOsm(p) {
  const b = bisogno(p.k, p.tipo);
  return {
    chiave: `luogo-osm-${p.id}`, peso: PESO, strato: `luoghi-osm-${b?.id ?? 'altro'}`, titolo: titolo(p), icona: b?.icona ?? 'indirizzo',
    badge: b ? tl(b.etichetta) : undefined, sempre: true,
    gruppi: [{ righe: righePunto(p) }, { titolo: 'Fonte e licenza', righe: [
      { etichetta: 'Dati', valore: '© OpenStreetMap contributors', urlValore: URL_OSM },
      { etichetta: 'Licenza', valore: 'ODbL 1.0', urlValore: 'https://opendatacommons.org/licenses/odbl/1-0/' }, // i18n-ok: nome della licenza
    ] }],
    nota: 'Luogo di OpenStreetMap: può mancare un nome, o essere cambiato nel frattempo. Le categorie sono quelle del punteggio di camminabilità di Walkably.',
    fonte: t('layer.fonte', { fonte: tl(FONTE) }),
  };
}

export function modelloPopupLuogoOsm(p) {
  const b = bisogno(p.k, p.tipo);
  return { titolo: titolo(p), sottotitolo: p.nome ? tipoIt(p.tipo) : (b?.etichetta ?? ''), righe: righePunto(p), url: URL_OSM, fonte: FONTE };
}
