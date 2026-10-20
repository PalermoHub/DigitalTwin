import { normalizza } from './indirizzi.js';
import { t } from './i18n.js';

// Le ricerche della barra che hanno bisogno della mappa (zone, incendi e vincoli PAI, particelle catastali), per il Chat bot.
// Ogni voce ha un'azione `vai()`: il pulsante di Talia la esegue al posto di aprire una scheda.
const MAX = 4;
const PAROLE_VUOTE = new Set(['DOVE', 'QUALE', 'QUALI', 'COSA', 'COME', 'DELLA', 'DELLO', 'DELLE', 'DEGLI', 'QUARTIERE', 'ZONA', 'UPL']); // i18n-ok: parole d'uso comune ignorate

// «foglio 12 particella 345», «f 12 p 345» o «12/345», anche dentro una frase
const PARTICELLA_IN_FRASE = /(?:\b(?:foglio|f\.?)\s*(\d+)\s*(?:particella|part\.?|p\.?|\/|-)\s*(\d+)|(?:^|\s)(\d+)\s*[/-]\s*(\d+)(?=\s|$))/i;

// gruppi di 1-3 parole consecutive della frase: i nomi di zona si cercano interi, non nella frase intera
function finestre(testo) {
  const parole = normalizza(testo).split(' ').filter(p => p.length > 2 && !PAROLE_VUOTE.has(p));
  const gruppi = [];
  for (let n = Math.min(3, parole.length); n >= 1; n--) {
    for (let i = 0; i + n <= parole.length; i++) gruppi.push(parole.slice(i, i + n).join(' '));
  }
  return gruppi;
}

export function creaRicercaMappa({ zone = null, territorio = null, vaiParticella = null } = {}) {
  function particella(testo) {
    if (!vaiParticella) return [];
    const m = testo.match(PARTICELLA_IN_FRASE);
    if (!m) return [];
    const foglio = String(+(m[1] ?? m[3]));
    const numero = String(+(m[2] ?? m[4]));
    return [{ etichetta: t('evidenza.particella'), nota: t('ricerca.particella.riga', { foglio, numero }), prefisso: true, vai: () => vaiParticella(foglio, numero) }];
  }

  function zona(testo) {
    if (!zone) return [];
    const viste = new Set();
    for (const g of [testo, ...finestre(testo)]) {
      const trovate = zone.suggerisci(g).filter(z => !viste.has(`${z.nota}|${z.etichetta}`) && viste.add(`${z.nota}|${z.etichetta}`));
      // la finestra più lunga che dà un risultato vince: «Borgo Vecchio» prima di «Vecchio»
      if (trovate.length) return trovate.slice(0, MAX);
    }
    return [];
  }

  return async function cercaMappa(testo) {
    const terr = territorio ? await territorio.suggerisci(testo).catch(() => ({ inCima: [], inCoda: [] })) : { inCima: [], inCoda: [] };
    return [...particella(testo), ...terr.inCima, ...zona(testo), ...terr.inCoda].slice(0, MAX);
  };
}
