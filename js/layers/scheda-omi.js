// Voci «Quotazioni OMI» della scheda: una per zona, con le tipologie in fisarmonica. Logica e
// formati di buildOMIPopup (pmtiles/js/catasto_script.js). Il tile ha una feature per tipologia.
import { t, localeIntl } from '../core/i18n.js';

const pulisci = s => String(s ?? '').replace(/^'|'$/g, '').trim();
const SUPERFICIE = { L: 'sup.lorda', N: 'sup.netta' };

// valori salvati anche come stringa con virgola decimale (es. "1,4")
const numero = v => {
  if (v == null || v === '') return null;
  const n = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : Number(v);
  return Number.isNaN(n) ? null : n;
};
const it = n => n.toLocaleString(localeIntl());

function intervallo(min, max, unita, sup) {
  const a = numero(min), b = numero(max);
  if (a == null || b == null) return '—';
  return `${it(a)} – ${it(b)} ${unita}${sup ? ` (${sup})` : ''}`;
}

function voceZona(features) {
  const p0 = features[0];
  const fascia = p0.Fascia || p0.Fasce || '—';
  const fasciaDescr = pulisci(p0.Fascia_Descr);
  const descrizione = pulisci(p0.Zona_Descr);
  const righe = [{ etichetta: 'Fascia', valore: fasciaDescr ? `${fascia} – ${fasciaDescr}` : fascia }];
  if (descrizione) righe.push({ etichetta: 'Descrizione', valore: descrizione });
  if (p0.Microzona != null && p0.Microzona !== '') righe.push({ etichetta: 'Microzona', valore: String(p0.Microzona) });

  const visti = new Set();
  const elementi = [];
  for (const p of features) {
    const titolo = pulisci(p.Descr_Tipologia) || '—';
    if (visti.has(titolo)) continue; // la stessa feature può arrivare da più tile
    visti.add(titolo);
    const cMin = numero(p.Compr_min), cMax = numero(p.Compr_max);
    elementi.push({
      titolo,
      stato: p.Stato || '',
      anteprima: cMin != null && cMax != null ? `${it(cMin)}–${it(cMax)} €/m²` : '',
      righe: [
        { etichetta: 'Compravendita', valore: intervallo(p.Compr_min, p.Compr_max, '€/m²', SUPERFICIE[p.Sup_NL_compr]) },
        { etichetta: 'Locazione', valore: intervallo(p.Loc_min, p.Loc_max, '€/m²/mese', SUPERFICIE[p.Sup_NL_loc]) },
      ],
    });
  }

  const zona = p0.Zona_OMI || p0.Zona || '—';
  const codice = p0.Cod_tip_prev || '';
  const semestre = p0.Anno_Semestre ? `OMI ${p0.Anno_Semestre.replace(' / ', ' S')}` : 'OMI 2025 S2';
  return {
    chiave: `omi-${zona}`,
    peso: 60,
    strato: 'omi',
    titolo: 'Quotazioni OMI',
    icona: 'euro',
    badge: `Zona ${zona}`,
    gruppi: [{ righe }],
    accordion: { aperto: true, icona: 'casa', suggerimento: 'Seleziona una tipologia per vedere compravendita e locazione', riassunto: t('omi.tipoPrevalente', { tipo: `${codice ? `[${codice}] ` : ''}${pulisci(p0.Descr_tip_prev) || '—'}` }), elementi },
    link: { testo: 'Catasto e PRG su mappa', icona: 'esterno', url: 'https://palermohub.opendatasicilia.it/prg_part_catastali.html' },
    fonte: t('omi.fonte', { semestre }),
  };
}

// proprieta: le properties delle feature OMI trovate nel punto
export function vociOmi(proprieta) {
  const perZona = new Map();
  for (const p of proprieta) {
    const z = p.Zona_OMI || p.Zona || 'unknown';
    if (!perZona.has(z)) perZona.set(z, []);
    perZona.get(z).push(p);
  }
  return [...perZona.values()].map(voceZona);
}
