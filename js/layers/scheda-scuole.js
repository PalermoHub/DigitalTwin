import { chiaveLuogo } from '../core/scheda-modello.js';

// Modello puro di scuole/asili e sedi delle sezioni elettorali: stesse righe per la scheda di destra e per il popup.

const righe = coppie => coppie.filter(([, valore]) => valore).map(([etichetta, valore]) => ({ etichetta, valore }));

// Nella scheda del luogo quartiere e circoscrizione (circoscrizione) sono già nell'intestazione e l'indirizzo ha la sua sezione (`voceIndirizzo`):
// restano solo nel popup (`completo`), che non ha altro contesto.
function righeScuola(p, completo) {
  return righe([
    ...(completo ? [['Indirizzo', p.indirizzo], ['Quartiere', p.quartiere]] : []), ['Istituto', p.categoria],
    ['Sede', p.sede && (p.sede_indirizzo ? `${p.sede} — ${p.sede_indirizzo}` : p.sede)],
  ]);
}

function righeSeggio(p, completo) {
  return righe([
    ...(completo ? [['Indirizzo', p.indirizzo], ['Circoscrizione', p.circoscrizione]] : []),
    [`Sezioni (${p.n_sezioni})`, p.sezioni],
  ]);
}

// La scuola che è anche sede elettorale porta i dati del seggio (campi seggio_*): un solo luogo, due gruppi di informazioni.
function righeSeggioInScuola(p, completo) {
  if (!p.seggio_sezioni) return [];
  return righeSeggio({ circoscrizione: p.seggio_circoscrizione, n_sezioni: p.seggio_n_sezioni, sezioni: p.seggio_sezioni }, completo);
}

// «Via civico» → { Via, Civico }; senza numero finale resta solo la via.
export function viaCivico(indirizzo) {
  const m = String(indirizzo ?? '').trim().match(/^(.*?)[,\s]+(\d+(?:\s*[/-]\s*\w+|\s*[A-Za-z*]?)?)$/);
  return m ? { via: m[1].trim(), civico: m[2].replace(/\s+/g, '') } : { via: String(indirizzo ?? '').trim(), civico: '' };
}

// Stessa sezione «Indirizzo» (Via, Civico) del civico ANNCSU; in ripiego: se c'è il civico vero vale quello,
// poi quello della scuola (livello 1), infine quello del seggio (livello 2).
export function voceIndirizzo(p, livello) {
  const { via, civico } = viaCivico(p.indirizzo);
  const gruppi = [{ righe: righe([['Via', via], ['Civico', civico]]).map(r => ({ ...r, ripiego: livello })) }];
  return { chiave: 'indirizzo', peso: 10, titolo: 'Indirizzo', icona: 'indirizzo', gruppi };
}

export function voceScuola(p) {
  const gruppi = [{ righe: righeScuola(p) }];
  if (p.seggio_sezioni) gruppi.push({ titolo: 'Sede elettorale', righe: righeSeggioInScuola(p) });
  return { chiave: p.id, peso: 4, luogo: chiaveLuogo(p.nome), titolo: p.nome, icona: 'scuola', badge: p.tipo, sempre: true, gruppi };
}

export function voceSeggio(p) {
  return {
    chiave: p.id, peso: 5, luogo: chiaveLuogo(p.nome), titolo: p.nome, icona: 'seggio', badge: p.tipo,
    gruppi: [{ titolo: 'Sede elettorale', righe: righeSeggio(p) }],
  };
}

export function modelloPopupScuola(p) {
  return { titolo: p.nome, sottotitolo: p.tipo, righe: p.n_sezioni != null ? righeSeggio(p, true) : [...righeScuola(p, true), ...righeSeggioInScuola(p, true)] };
}
