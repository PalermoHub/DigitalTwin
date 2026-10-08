// Modello puro della sicurezza stradale (studio «Rete stradale»): le righe fisse della scheda di destra.
import { righe } from '../core/scheda-util.js';
import { localeIntl, t, tn } from '../core/i18n.js';

export const NOTA_DATI = t('sicurezza.notaDati');

export const NOTA_CLASSIFICA = t('sicurezza.notaClassifica');

export const TOP_VIE = 20;

export const GRAVITA = {
  M: { nome: 'Mortale', colore: '#7f0000' },
  R: { nome: 'Feriti con prognosi riservata', colore: '#d7301f' },
  F: { nome: 'Con feriti', colore: '#fc8d59' },
  C: { nome: 'Solo danni a cose', colore: '#9e9e9e' },
};

const num = (v, d = 1) => Number(v).toLocaleString(localeIntl(), { minimumFractionDigits: 0, maximumFractionDigits: d });
const ha = v => v != null && Number.isFinite(Number(v));
const senzaIncidenti = p => !ha(p.n_incidenti) || Number(p.n_incidenti) === 0;
const NESSUN = /^nessun/i;
const pai = v => (v && !NESSUN.test(v) ? v : null);

function rigaIncidenti(p) {
  return ['Incidenti 2015–2023', senzaIncidenti(p) ? 'nessun incidente registrato' : num(p.n_incidenti, 0)];
}

function rigaTasso(p) {
  if (senzaIncidenti(p)) return ['Incidenti per km', null];
  return ['Incidenti per km', p.tasso_affidabile ? num(p.tasso_km) : 'non significativo (tratto < 20 m)'];
}

function gruppoVia(p) {
  if (!ha(p.via_rango)) return [];
  return [{ titolo: 'Via tra le più pericolose', righe: righe([
    ['Classifica vie pericolose', t('sicurezza.rango', { rango: p.via_rango, n: TOP_VIE })],
    ['Gravità per km (via)', ha(p.via_gravita_km) ? num(p.via_gravita_km) : null],
    ['Incidenti sulla via', ha(p.via_incidenti) ? t('sicurezza.incidentiSuKm', { n: num(p.via_incidenti, 0), km: num(p.via_km) }) : null],
    ['Mortali sulla via', ha(p.via_mortali) ? num(p.via_mortali, 0) : null],
  ]) }];
}

export function voceArco(p) {
  return {
    chiave: `arco-${p.arco_id}`, peso: 8, strato: 'sicurezza-archi', titolo: p.nome || 'Strada senza nome', icona: 'strada', badge: 'Tratto stradale', sempre: true,
    contesto: { Quartiere: p.Quartiere, Circoscrizione: p.Circoscrizione, UPL: p.UPL },
    gruppi: [
      ...gruppoVia(p),
      { titolo: 'Sicurezza', righe: righe([rigaIncidenti(p), rigaTasso(p)]) },
      { titolo: 'Tratto', righe: righe([
        ['Lunghezza', ha(p.lunghezza_m) ? `${num(p.lunghezza_m, 0)} m` : null],
        ['Pendenza media', ha(p.pendenza_media_pct) ? `${num(p.pendenza_media_pct)}%` : null],
        ['Accessibilità per pendenza', p.accessibilita],
      ]) },
      { titolo: 'Rischio idrogeologico', righe: righe([
        ['Rischio frane', pai(p.rischio_geomorf_label)], ['Priorità frane', pai(p.priorita_geomorf)],
        ['Rischio alluvioni', pai(p.rischio_idraul_label)], ['Priorità alluvioni', pai(p.priorita_idraul)],
      ]) },
    ],
    nota: ha(p.via_rango) ? `${NOTA_CLASSIFICA} ${NOTA_DATI}` : NOTA_DATI,
  };
}

export function voceHotspot(p) {
  return {
    chiave: `hotspot-${p.cell_id}`, peso: 7, strato: 'sicurezza-hotspot', titolo: 'Zona a incidenti concentrati', icona: 'strada', badge: 'Hotspot incidenti', sempre: true,
    gruppi: [{ righe: righe([
      ['Confidenza (gravità)', ha(p.livello_gravita) ? `${p.livello_gravita}%` : null],
      ['Confidenza (conteggio)', ha(p.livello_conteggio) ? `${p.livello_conteggio}%` : null],
      ['Incidenti nella cella', ha(p.n_incidenti) ? num(p.n_incidenti, 0) : null],
      ['Gravità pesata', ha(p.gravita_tot) ? num(p.gravita_tot) : null],
    ]) }],
    nota: 'Celle di 250 m, statistica Getis-Ord Gi* (contiguità Queen, 999 permutazioni). La gravità pesa mortali 5, prognosi riservata 3, feriti 1, solo cose 0,2.',
  };
}

export function voceIncidente(p) {
  return {
    chiave: `incidente-${p.arco_id}-${p.anno}-${p.Luogo}`, peso: 6, strato: 'sicurezza-incidenti', titolo: p.Luogo || 'Incidente', icona: 'strada', badge: 'Incidente', sempre: true,
    gruppi: [{ righe: righe([
      ['Anno', p.anno], ['Gravità', GRAVITA[p.Tipologia]?.nome], ['Feriti', ha(p.feriti_n) ? num(p.feriti_n, 0) : null],
    ]) }],
  };
}

export function tooltipArco(p) {
  const nome = p.nome || 'Strada senza nome';
  const titolo = ha(p.via_rango) ? `#${p.via_rango} · ${nome}` : nome;
  if (senzaIncidenti(p)) return { titolo, dettaglio: 'Nessun incidente registrato' };
  const n = Number(p.n_incidenti);
  const inc = tn('ricerca.incidenti.n', n, { n: num(n, 0) });
  return { titolo, dettaglio: p.tasso_affidabile ? t('sicurezza.perKm', { inc, tasso: num(p.tasso_km) }) : inc };
}
