// Grafico delle quotazioni OMI di una zona: per ogni tipologia l'intervallo min–max di vendita (€/m²) e di affitto (€/m²·mese),
// con il rendimento lordo. Come «omiChart» di palermohub/pmtiles/js/grafici.js. I dati (puri) li prepara datiGraficoOmi.
import { titoloConInfo } from '../core/info-grafico.js';
import { localeIntl, t } from '../core/i18n.js';

const COLORE_VENDITA = '#2f7fb8';
const COLORE_AFFITTO = '#e07b00';
const it = n => n.toLocaleString(localeIntl());

/* tipologie: [{ nome, cMin, cMax, lMin, lMax, rendimento }] (numeri o null). Tiene le tipologie con vendita nota;
   scala vendita e scala affitto sono distinte (massimo di ciascuna). */
export function datiGraficoOmi(tipologie) {
  const righe = (tipologie ?? []).filter(r => r.nome && r.cMin != null && r.cMax != null);
  if (!righe.length) return null;
  return { righe, maxVendita: Math.max(...righe.map(r => r.cMax)), maxAffitto: Math.max(0, ...righe.map(r => r.lMax ?? 0)) };
}

const el = (tag, classe, testo) => { const e = document.createElement(tag); if (classe) e.className = classe; if (testo != null) e.textContent = testo; return e; };

function intervallo(da, a, max, colore) {
  const traccia = el('span', 'omi-gr-traccia'), barra = el('i');
  barra.style.left = `${da / max * 100}%`;
  barra.style.width = `${Math.max((a - da) / max * 100, 1.5)}%`;
  barra.style.background = colore;
  traccia.append(barra);
  return traccia;
}

/* Grafico di UNA tipologia (va dentro la sua voce nell'accordion): barre vendita/affitto sulle scale comuni della zona. */
export function creaGraficoTipologia(r, dati) {
  const box = el('div', 'omi-gr');
  const testa = el('div', 'omi-gr-testa');
  testa.append(titoloConInfo('h5', 'omi-gr-titolo', t('omi.grafico.titolo'), 'omi-quotazioni'));
  if (r.rendimento != null) {
    const y = el('b', null, `${r.rendimento.toLocaleString(localeIntl(), { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%`);
    y.title = t('omi.grafico.rendimentoTitolo');
    testa.append(y);
  }
  box.append(testa);
  if (r.cMin != null && r.cMax != null) {
    const vendita = el('div', 'omi-gr-riga');
    vendita.append(el('em', null, t('omi.grafico.vendita')), intervallo(r.cMin, r.cMax, dati.maxVendita, COLORE_VENDITA), el('small', null, `${it(r.cMin)}–${it(r.cMax)} €/m²`));
    box.append(vendita);
  }
  if (r.lMin != null && r.lMax != null && dati.maxAffitto > 0) {
    const affitto = el('div', 'omi-gr-riga');
    affitto.append(el('em', null, t('omi.grafico.affitto')), intervallo(r.lMin, r.lMax, dati.maxAffitto, COLORE_AFFITTO), el('small', null, `${it(r.lMin)}–${it(r.lMax)} €/m²·${t('omi.grafico.mese')}`));
    box.append(affitto);
  }
  box.append(el('p', 'omi-gr-nota', t('omi.grafico.nota')));
  return box;
}
