// Modello puro degli incendi (Censimento Incendi della Regione Siciliana, Palermo 2007–): popup breve sulla mappa e sezione della scheda di destra.
// Superfici in ettari. I campi variano da un anno all'altro (dal 2024 in poi ce ne sono di più): le righe senza valore non compaiono.
import { righe } from '../core/scheda-util.js';

export const FONTE = 'Fonte: Regione Siciliana, Corpo Forestale — Censimento Incendi (SIF). Perimetri delle aree percorse dal fuoco nel Comune di Palermo.';

const num = (v, d = 2) => (v != null && Number.isFinite(Number(v)) ? Number(v).toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: d }) : null);
const ettari = v => (num(v) == null ? null : `${num(v)} ha`);

// «2025-05-23» -> «23/05/2025»
export function dataIt(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : null;
}

export function durata(minuti) {
  const m = Number(minuti);
  if (!Number.isFinite(m) || m <= 0) return null;
  const h = Math.floor(m / 60);
  return h ? `${h} h ${m % 60} min` : `${m} min`;
}

const euro = v => (Number(v) > 0 ? `${num(v, 0)} €` : null);
const positivo = v => (Number(v) > 0 ? num(v, 0) : null);

export function titoloIncendio(p) {
  return p.localita ? `Incendio a ${p.localita}` : `Incendio ${p.anno}`;
}

// Popup: poche righe, il resto sta nella scheda.
export function modelloPopup(p) {
  return {
    titolo: titoloIncendio(p),
    sottotitolo: dataIt(p.data) ?? String(p.anno),
    righe: righe([['Superficie', ettari(p.sup_ha)], ['Boscata', ettari(p.sup_boscata_ha)], ['Non boscata', ettari(p.sup_non_boscata_ha)]]),
  };
}

export function voceIncendio(p) {
  return {
    chiave: `incendio-${p.anno}-${p.id}`, peso: 7, strato: 'incendi', titolo: titoloIncendio(p), icona: 'incendio', badge: `Incendio ${p.anno}`, sempre: true,
    gruppi: [
      { righe: righe([['Data', dataIt(p.data)], ['Località', p.localita], ['Luogo di inizio', p.luogo_inizio], ['Tipo di evento', p.tipo_evento]]) },
      { titolo: 'Superfici', righe: righe([
        ['Superficie totale', ettari(p.sup_ha)], ['Superficie boscata', ettari(p.sup_boscata_ha)], ['Superficie non boscata', ettari(p.sup_non_boscata_ha)],
        ['Altre superfici forestali', ettari(p.altre_sup_forestali_ha)], ['Uso del suolo', p.uso], ['Altezza scottatura', p.altezza_scottatura],
      ]) },
      { titolo: 'Intervento', righe: righe([
        ['Fine intervento', dataIt(p.fine_intervento)], ['Durata intervento', durata(p.durata_min)], ['Squadre AIB', positivo(p.squadre_aib)],
        ['Costo di spegnimento', euro(p.costo_spegnimento_eur)], ['Feriti', positivo(p.feriti)], ['Periti', positivo(p.periti)],
      ]) },
    ],
    fonte: FONTE,
  };
}

// Più incendi sovrapposti nello stesso punto: una sola sezione a fisarmonica, dal più recente; con uno solo resta la sezione completa.
export function vociIncendi(lista) {
  if (lista.length <= 1) return lista.map(voceIncendio);
  const anni = [...new Set(lista.map(p => p.anno))];
  return [{
    chiave: 'incendio:gruppo', peso: 7, strato: 'incendi', titolo: 'Incendi', icona: 'incendio', badge: `${lista.length} incendi`, sempre: true,
    gruppi: [],
    accordion: {
      icona: 'incendio', suggerimento: 'Seleziona un incendio per vedere i dettagli',
      riassunto: `${lista.length} incendi sovrapposti · ${anni.length > 1 ? `dal ${Math.min(...anni)} al ${Math.max(...anni)}` : anni[0]}`,
      elementi: lista.map(p => ({ titolo: titoloIncendio(p), anteprima: dataIt(p.data) ?? String(p.anno), righe: voceIncendio(p).gruppi.flatMap(g => g.righe) })),
    },
    fonte: FONTE,
  }];
}
