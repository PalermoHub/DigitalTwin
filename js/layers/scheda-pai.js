// Modello puro dei vincoli PAI (Piano di Assetto Idrogeologico, Regione Siciliana, Palermo): popup breve sulla mappa e sezione della scheda.
// Ogni dataset ha i suoi campi (elencati nel manifest dati/pai/pai.json, con etichetta in italiano): qui si leggono da lì, così un campo
// nuovo del server compare in scheda senza toccare il codice. Le righe senza valore non compaiono.
import { righe } from '../core/scheda-util.js';

export const FONTE = 'Fonte: Regione Siciliana, Autorità di Bacino — Piano di Assetto Idrogeologico (PAI), SITR. Vincoli nel Comune di Palermo.';

const num = (v, d = 2) => (v != null && Number.isFinite(Number(v)) ? Number(v).toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: d }) : null);

// «2019-03-05» -> «05/03/2019»
export function dataIt(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : null;
}

const superficie = v => (num(v) == null ? null : `${num(v)} ha`);
const lunghezza = v => (num(v, 0) == null ? null : `${num(v, 0)} m`);

// Campi dei provvedimenti (decreti e Gazzetta Ufficiale): vanno in un gruppo a parte in fondo alla scheda.
const E_PROVVEDIMENTO = k => /^(n_|data_(dpr|dsg|adsg|gurs)|ngurs|dgurs)/.test(k);

const valore = (campo, v) => (campo.data ? dataIt(v) : v);

// Una riga per ogni tema con classi (es. «Pericolosità: P3», «Attività: Attivo»): il valore è già nella feature (`cls_<tema>`).
const righeTemi = (ds, p) => righe(ds.temi.filter(t => t.riga).map(t => [t.riga, p[`cls_${t.id}`]]));

// Il nome del luogo: località o, in mancanza, comune.
export const luogo = p => p.localita ?? p.comune ?? null;

export function titoloPai(ds, tema) {
  return tema?.titolo ?? ds.titolo;
}

// Identifica un elemento (i tile spezzano le feature: servono a deduplicare e come chiave della sezione di scheda).
export function chiavePai(ds, p) {
  return `pai:${ds.id}:${[p.codice, p.sigla ?? p.sigla_p, p.pai_nmr, p.bcn_nmr, p.sup_ha, p.lung_m, ...ds.temi.map(t => p[`cls_${t.id}`])].filter(v => v != null).join('_')}`;
}

// Popup: titolo del tema, classe, e poche righe.
export function modelloPopup(ds, tema, p) {
  return {
    titolo: titoloPai(ds, tema),
    sottotitolo: p[`cls_${tema.id}`] ?? null,
    righe: righe([['Luogo', luogo(p)], ['Elemento a rischio', p.elemento_r], ['Superficie', superficie(p.sup_ha)], ['Lunghezza', lunghezza(p.lung_m)]]),
  };
}

// Sezione della scheda: tutti i campi del dataset che l'elemento ha, in due gruppi (descrizione, provvedimenti).
export function vocePai(ds, p) {
  const campi = ds.campi.filter(c => p[c.k] != null);
  const riga = c => [c.label, valore(c, p[c.k])];
  const descrizione = campi.filter(c => !E_PROVVEDIMENTO(c.k));
  const provvedimenti = campi.filter(c => E_PROVVEDIMENTO(c.k));
  return {
    chiave: chiavePai(ds, p), peso: 6, titolo: ds.titolo, icona: 'pai', sempre: true,
    badge: ds.temi[0].riga ? p[`cls_${ds.temi[0].id}`] : undefined,
    gruppi: [
      { righe: [...righeTemi(ds, p), ...righe([...descrizione.map(riga), ['Superficie', superficie(p.sup_ha)], ['Lunghezza', lunghezza(p.lung_m)]])] },
      { titolo: 'Provvedimenti', righe: righe(provvedimenti.map(riga)) },
    ],
    fonte: FONTE,
  };
}

// Classe più grave tra quelle trovate: il numero della classe (P4 > P3, R4 > R3); le classi senza numero non contano.
const gravita = c => Number(/\d+/.exec(c ?? '')?.[0] ?? -1);

// Vincoli sovrapposti nello stesso punto: con più di uno stanno in una sola sezione a fisarmonica (come le tipologie OMI),
// con uno solo resta la sezione completa. `elementi` = [{ ds, p }].
export function vociPai(elementi) {
  if (elementi.length <= 1) return elementi.map(({ ds, p }) => vocePai(ds, p));
  const voci = elementi.map(({ ds, p }) => ({ ds, p, v: vocePai(ds, p) }));
  const peggiore = voci.reduce((m, x) => (gravita(x.v.badge) > gravita(m.v.badge) ? x : m));
  const riassunto = `${elementi.length} vincoli sovrapposti${gravita(peggiore.v.badge) >= 0 ? ` · più grave: ${peggiore.v.badge} (${peggiore.ds.titolo})` : ''}`;
  return [{
    chiave: 'pai:gruppo', peso: 6, titolo: 'Vincoli PAI', icona: 'pai', badge: `${elementi.length} vincoli`, sempre: true,
    gruppi: [],
    accordion: {
      icona: 'pai', suggerimento: 'Seleziona un vincolo per vedere i dettagli', riassunto,
      elementi: voci.map(({ ds, p, v }) => ({ titolo: ds.titolo, anteprima: v.badge ?? '', righe: v.gruppi.flatMap(g => g.righe) })),
    },
    fonte: FONTE,
  }];
}
