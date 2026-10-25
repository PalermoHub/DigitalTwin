import { GERARCHIA } from './gerarchia.js';
import { normalizza } from './indirizzi.js';
import { t } from './i18n.js';

export const MASCHERA = 'filtro-maschera';

const NOMI_CIRC = {
  I: 'I · Centro Storico', II: 'II · Brancaccio', III: 'III · Oreto', IV: 'IV · Mezzomonreale',
  V: 'V · Noce', VI: 'VI · Resuttana', VII: 'VII · Mondello', VIII: 'VIII · Libertà',
};
const CAMPI = ['Circoscrizione', 'Quartiere', 'UPL'];
const LIVELLI = ['circ', 'quart', 'upl'];
const TIPI = { circ: 'Circoscrizione', quart: 'Quartiere', upl: 'UPL' };

const parti = chiave => chiave.split('|');
const nomeBreve = (livello, chiave) => (livello === 'circ' ? NOMI_CIRC[chiave] ?? chiave : parti(chiave)[LIVELLI.indexOf(livello)]);
const figliDi = (livello, chiave) => Object.keys(GERARCHIA[livello]).filter(k => !chiave || k.startsWith(chiave + '|'));

const ROMANI = Object.keys(NOMI_CIRC);

// Zone il cui nome contiene il testo, senza bisogno della mappa (la usano la barra della mappa e quella della home).
// Da sole bastano il numero della circoscrizione («1», «I», «circ 1»); per quartieri e UPL servono 3 lettere.
export function trovaZone(testo, max = 6) {
  const q = normalizza(testo);
  const nome = q.replace(/^CIRC(OSCRIZIONE)? /, '');
  const romano = /^\d+$/.test(nome) ? ROMANI[+nome - 1] : nome;
  const voce = (livello, chiave, prefisso) => ({
    livello, chiave, prefisso, etichetta: nomeBreve(livello, chiave),
    nota: livello === 'circ' ? TIPI.circ : `${TIPI[livello]} · ${parti(chiave)[0]}`, // quartieri e UPL: con la circoscrizione a cui appartengono
  });
  if (/^[IVX]+$/.test(romano) || /^\d+$/.test(nome)) return NOMI_CIRC[romano] ? [voce('circ', romano, true)] : [];
  if (q.length < 3) return [];
  if ('CIRCOSCRIZIONE'.startsWith(q) || 'CIRCOSCRIZIONI'.startsWith(q)) return ROMANI.map(k => voce('circ', k, true)).slice(0, max);
  const trovate = [];
  for (const l of LIVELLI) {
    for (const k of Object.keys(GERARCHIA[l])) {
      const n = normalizza(nomeBreve(l, k));
      if (n.includes(q)) trovate.push(voce(l, k, n.startsWith(q)));
    }
  }
  return trovate.sort((x, y) => y.prefisso - x.prefisso).slice(0, max);
}

// Filtri a scalare circoscrizione > quartiere > UPL: ogni scelta restringe l'elenco del livello
// successivo, e scegliere un livello basso imposta anche i suoi genitori. Fuori dalla zona scelta
// la mappa viene schiarita da una maschera (vale per tutti gli strati).
export function collegaZone(map, { selezioni, chips }) {
  const sel = { circ: '', quart: '', upl: '' };

  function riempi(livello) {
    const s = selezioni[livello];
    const genitore = livello === 'upl' ? (sel.quart || sel.circ) : livello === 'quart' ? sel.circ : '';
    const chiavi = figliDi(livello, genitore);
    s.replaceChildren(new Option(t('filtro.tutte'), ''));
    for (const k of chiavi) s.add(new Option(nomeBreve(livello, k), k));
    s.value = sel[livello];
  }

  function applica(zoom = true) {
    LIVELLI.forEach(riempi);
    const attivi = LIVELLI.filter(l => sel[l]);
    if (map.getLayer(MASCHERA)) {
      if (attivi.length) {
        const cond = parti(sel[attivi.at(-1)]).map((v, i) => ['==', ['get', CAMPI[i]], v]);
        map.setFilter(MASCHERA, ['!', ['all', ...cond]]);
      }
      map.setLayoutProperty(MASCHERA, 'visibility', attivi.length ? 'visible' : 'none');
    }
    if (zoom && attivi.length) {
      const [o, s, e, n] = GERARCHIA[attivi.at(-1)][sel[attivi.at(-1)]];
      map.fitBounds([[o, s], [e, n]], { padding: 60, maxZoom: 16 });
    }
    disegnaChips(attivi);
  }

  function scegli(livello, chiave, zoom = true) {
    const i = LIVELLI.indexOf(livello);
    sel[livello] = chiave;
    LIVELLI.slice(i + 1).forEach(l => { sel[l] = ''; }); // i livelli sotto si azzerano
    if (chiave) { // quelli sopra seguono la scelta
      const p = parti(chiave);
      LIVELLI.slice(0, i).forEach((l, j) => { sel[l] = p.slice(0, j + 1).join('|'); });
    }
    applica(zoom);
  }

  function disegnaChips(attivi) {
    chips.hidden = !attivi.length;
    chips.replaceChildren(...attivi.map(l => {
      const c = document.createElement('span');
      c.className = 'chip-zona';
      c.append(`${TIPI[l]}: ${nomeBreve(l, sel[l])} `);
      const x = document.createElement('button');
      x.type = 'button';
      x.textContent = '✕';
      x.setAttribute('aria-label', `Rimuovi filtro ${TIPI[l]}`);
      // togliere un livello toglie anche quelli sotto; il genitore resta
      x.addEventListener('click', () => scegli(l, '', false));
      c.append(x);
      return c;
    }));
  }

  LIVELLI.forEach(l => selezioni[l].addEventListener('change', () => scegli(l, selezioni[l].value)));
  applica(false);

  return {
    reimposta() { scegli('circ', '', false); },
    // zone il cui nome contiene il testo digitato, per la barra di ricerca
    suggerisci(testo, max = 6) {
      return trovaZone(testo, max).map(z => ({ etichetta: z.etichetta, nota: TIPI[z.livello], prefisso: z.prefisso, vai: () => scegli(z.livello, z.chiave) }));
    },
  };
}
