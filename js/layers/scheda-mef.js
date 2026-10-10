// Modello puro degli immobili dichiarati al MEF (Censimento degli immobili pubblici, beni dei comuni): sezione della scheda di
// destra e tooltip. I beni di un edificio viaggiano nella proprietà `beni` (JSON): MapLibre non conserva gli array nelle feature.
import { righe } from '../core/scheda-util.js';
import { localeIntl, t, tl } from '../core/i18n.js';

export const FONTE = 'Ministero dell’economia e delle finanze, Dipartimento del Tesoro — Censimento degli immobili pubblici (CC BY 4.0)';
const LINK = 'https://www.de.mef.gov.it/it/attivita_istituzionali/patrimonio_pubblico/censimento_immobili_pubblici/open_data_immobili/';
export const MAX_BENI = 12;

const PRECISIONE = {
  catastale: 'Dati catastali',
  civico: 'Indirizzo (civico)',
  strada: 'Solo la strada: posizione approssimata',
  comune: 'Solo il comune: posizione approssimata',
};

const num = (v, d) => (v != null && Number.isFinite(Number(v)) ? Number(v).toLocaleString(localeIntl(), { maximumFractionDigits: d }) : null);
const misura = (v, unita, d = 1) => (num(v, d) == null ? null : `${num(v, d)} ${unita}`);

export function leggiBeni(p) {
  try {
    const b = typeof p.beni === 'string' ? JSON.parse(p.beni) : p.beni;
    return Array.isArray(b) ? b : [];
  } catch {
    return [];
  }
}

export function righeBene(b) {
  return righe([
    ['Natura', b.natura], ['Indirizzo', b.indirizzo], ['Superficie', misura(b.superficie_mq, 'm²')], ['Cubatura', misura(b.cubatura_mc, 'm³')],
    ['Epoca di costruzione', b.epoca], ['Identificativo catastale', b.catastale], ['Utilizzo', b.utilizzo], ['Finalità', b.finalita],
    ['Vincolo culturale o paesaggistico', b.vincolo], ['Natura giuridica', b.giuridica],
    ['Posizione', PRECISIONE[b.precisione] ? tl(PRECISIONE[b.precisione]) : null],
  ]);
}

export function voceMef(p) {
  const tutti = leggiBeni(p);
  const beni = tutti.slice(0, MAX_BENI);
  const gruppi = beni.map((b, i) => ({
    titolo: tutti.length > 1 ? `${i + 1}. ${b.tipologia ?? b.natura ?? ''}`.trim() : undefined,
    righe: righeBene(b),
  }));
  if (tutti.length > beni.length) gruppi.push({ righe: righe([['Altri beni dichiarati', String(tutti.length - beni.length)]]) });
  return {
    chiave: p.id_edificio != null ? `mef-${p.id_edificio}` : `mef-p${tutti[0]?.id ?? ''}`,
    peso: 56,
    strato: 'mef-immobili',
    titolo: 'Immobili dichiarati al MEF',
    icona: 'monumento',
    badge: p.anno != null ? String(p.anno) : undefined,
    gruppi,
    link: { testo: 'Open data del censimento degli immobili pubblici', icona: 'esterno', url: LINK },
    fonte: t('layer.fonte', { fonte: tl(FONTE) }),
  };
}

export function modelloTooltipMef(p) {
  const beni = leggiBeni(p);
  return {
    titolo: 'Immobili dichiarati al MEF',
    sottotitolo: beni[0]?.tipologia ?? beni[0]?.natura ?? '',
    righe: righe([['Beni dichiarati', String(p.n_beni ?? beni.length)], ['Indirizzo', beni[0]?.indirizzo]]),
  };
}
