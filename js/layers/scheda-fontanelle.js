import { righe } from '../core/scheda-util.js';
import { PESO_SERVIZI } from './scheda-colonnine.js';
import { t, tl } from '../core/i18n.js';

// Modello puro della fontanella: stesse righe per la voce della scheda di destra e per il popup sulla mappa.
// Quartiere e circoscrizione sono già nell'intestazione della scheda: restano solo nel popup.

const FONTE = 'AMAP S.p.A. — Fontanelle pubbliche di Palermo';
const LINK = 'https://palermohub.opendatasicilia.it/pa_fontanelle.html';

function righeFontanella(p, completo) {
  return righe([
    ['Indirizzo', p.indirizzo], ['Ubicazione', p.tipo_ubicazione], ['Denominazione', p.denominazione], ['Note', p.note],
    ...(completo ? [['Quartiere', p.quartiere], ['Circoscrizione', p.circoscrizione]] : []),
  ]);
}

export function voceFontanella(p) {
  return {
    chiave: `fontanella-${p.id}`,
    peso: PESO_SERVIZI,
    strato: 'fontanelle',
    titolo: 'Fontanella',
    icona: 'fontanella',
    badge: 'Acqua potabile',
    sempre: true,
    gruppi: [{ righe: righeFontanella(p) }],
    link: { testo: 'Per maggiori dettagli consulta la mappa delle fontanelle', url: LINK, icona: 'esterno', suggerimento: 'Mappa delle fontanelle e copertura a piedi su PalermoHub' },
    fonte: t('layer.fonte', { fonte: tl(FONTE) }),
  };
}

export function modelloPopupFontanella(p) {
  return { titolo: 'Fontanella', sottotitolo: p.upl || p.quartiere || 'Acqua potabile', righe: righeFontanella(p, true), url: LINK, fonte: FONTE };
}
