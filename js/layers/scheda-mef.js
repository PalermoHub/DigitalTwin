// Modello puro degli immobili dichiarati al MEF (Censimento degli immobili pubblici, beni dei comuni): sezione della scheda di
// destra e tooltip. I beni di un edificio viaggiano nella proprietà `beni` (JSON): MapLibre non conserva gli array nelle feature.
import { righe } from '../core/scheda-util.js';
import { localeIntl, t, tl, tn } from '../core/i18n.js';

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
    ['Tipologia', b.tipologia], ['Natura', b.natura], ['Indirizzo', b.indirizzo], ['Superficie', misura(b.superficie_mq, 'm²')], ['Cubatura', misura(b.cubatura_mc, 'm³')],
    ['Epoca di costruzione', b.epoca], ['Identificativo catastale', b.catastale], ['Utilizzo', b.utilizzo], ['Finalità', b.finalita],
    ['Vincolo culturale o paesaggistico', b.vincolo], ['Natura giuridica', b.giuridica],
    ['Posizione', PRECISIONE[b.precisione] ? tl(PRECISIONE[b.precisione]) : null],
  ]);
}

// Un solo bene: righe in un gruppo. Più beni: un accordion con un elemento per bene (come uffici e incendi): le righe di beni
// diversi hanno le stesse etichette e in un gruppo solo `unisci` scarterebbe quelle con valore diverso.
export function voceMef(p) {
  const tutti = leggiBeni(p);
  const beni = tutti.slice(0, MAX_BENI);
  const voce = {
    chiave: p.id_edificio != null ? `mef-${p.id_edificio}` : `mef-p${tutti[0]?.id ?? ''}`,
    peso: 56,
    strato: 'mef-immobili',
    titolo: 'Immobili dichiarati al MEF',
    icona: 'monumento',
    badge: p.anno != null ? String(p.anno) : undefined,
    gruppi: [],
    link: { testo: 'Open data del censimento degli immobili pubblici', icona: 'esterno', url: LINK },
    fonte: t('layer.fonte', { fonte: tl(FONTE) }),
  };
  if (tutti.length <= 1) {
    voce.gruppi = beni.map(b => ({ righe: righeBene(b) }));
    return voce;
  }
  voce.sempre = true;
  voce.accordion = {
    icona: 'monumento',
    suggerimento: 'Seleziona un bene per vedere i dettagli',
    riassunto: tn('mef.beni', tutti.length),
    elementi: beni.map(b => ({ titolo: b.tipologia ?? b.natura ?? '', anteprima: b.indirizzo, righe: righeBene(b) })),
  };
  if (tutti.length > beni.length) voce.gruppi.push({ righe: righe([['Altri beni dichiarati', String(tutti.length - beni.length)]]) });
  return voce;
}

export function modelloTooltipMef(p) {
  const beni = leggiBeni(p);
  return {
    titolo: 'Immobili dichiarati al MEF',
    sottotitolo: beni[0]?.tipologia ?? beni[0]?.natura ?? '',
    righe: righe([['Beni dichiarati', String(p.n_beni ?? beni.length)], ['Indirizzo', beni[0]?.indirizzo]]),
  };
}
