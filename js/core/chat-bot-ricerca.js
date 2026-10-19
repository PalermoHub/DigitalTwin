import { normalizza } from './indirizzi.js';

// Ricerca del Chat bot nell'indice della guida (guida/indice.json, generato da scripts/guida_indice.py).
// Una voce = una sezione «##»: { id, file, titolo, parole, domande[], testo }. Nessun testo è generato: si mostra quello della guida.
export const SOGLIA = 3; // punteggio medio per parola sotto cui si risponde «non lo so»
const PESI = { domande: 8, parole: 6, titolo: 5, testo: 1 };
const MIN_PAROLA = 3;
const MIN_PAROLA_TESTO = 4; // nel testo le parole corte farebbero rumore
const PAROLE_VUOTE = new Set(['VIA', 'VIE', 'COME', 'COSA', 'DOVE', 'QUANDO', 'PERCHE', 'CHE', 'CON', 'PER', 'DELLA', 'DELLE', 'DELLO', 'DEGLI', 'DEI', 'UNA', 'UNO', 'THE', 'AND', 'FOR', 'HOW', 'WITH', 'WHAT', 'POSSO', 'FACCIO', 'SONO', 'DEL', 'NEL', 'NELLA', 'NELLE', 'QUAL', 'QUALE', 'QUALI', 'CHI']); // i18n-ok: parole vuote della ricerca
const NUMERO_INIZIALI = 4;

const radice = p => (p.length >= 5 ? p.slice(0, -1) : p); // «colori» trova «colore»
const contiene = (campo, parola) => campo.includes(radice(parola));

function campiNormalizzati(v) {
  return v.__n ??= {
    domande: normalizza(v.domande.join(' ')),
    parole: normalizza(v.parole),
    titolo: normalizza(v.titolo),
    testo: normalizza(v.testo),
  };
}

function punteggio(v, parole) {
  const c = campiNormalizzati(v);
  let somma = 0;
  for (const p of parole) {
    for (const campo of ['domande', 'parole', 'titolo', 'testo']) {
      if (campo === 'testo' && p.length < MIN_PAROLA_TESTO) continue;
      if (contiene(c[campo], p)) { somma += PESI[campo]; break; }
    }
  }
  return somma / parole.length;
}

// `trovate`: al massimo il passaggio migliore, se supera la soglia. `vicine`: domande della guida, se non c'è risposta.
// `candidate`: le migliori `n` voci con un punteggio positivo (serve ai test e alla taratura).
export function rispondi(voci, domanda, n = 3) {
  const parole = normalizza(domanda ?? '').split(' ').filter(p => p.length >= MIN_PAROLA && !PAROLE_VUOTE.has(p));
  if (!parole.length) return { trovate: [], vicine: [], candidate: [] };
  const ordinate = voci.map(v => ({ v, p: punteggio(v, parole) })).filter(x => x.p > 0).sort((a, b) => b.p - a.p);
  const candidate = ordinate.slice(0, n).map(x => x.v);
  if (ordinate.length && ordinate[0].p >= SOGLIA) return { trovate: [ordinate[0].v], vicine: [], candidate };
  const vicine = [...new Set(ordinate.slice(0, 3).flatMap(x => x.v.domande.slice(0, 1)))].slice(0, 3);
  return { trovate: [], vicine, candidate };
}

// Domande da proporre all'apertura: la prima di sezioni diverse, sparse nell'indice.
export function domandeIniziali(voci, n = NUMERO_INIZIALI) {
  const con = voci.filter(v => v.domande.length);
  const passo = Math.max(1, Math.floor(con.length / n));
  const scelte = [];
  for (let i = 0; i < con.length && scelte.length < n; i += passo) {
    const d = con[i].domande[0];
    if (!scelte.includes(d)) scelte.push(d);
  }
  return scelte;
}

// Prime `blocchi` parti del testo (separate da righe vuote): un elenco resta intero.
export function anteprima(testo, blocchi = 3) {
  const parti = testo.split(/\n{2,}/);
  return { breve: parti.slice(0, blocchi).join('\n\n'), c_e_altro: parti.length > blocchi };
}

// Testo di una sezione → blocchi da disegnare: { tipo: 'p', righe } oppure { tipo: 'ul', righe } (voci senza «- »).
export function blocchiTesto(testo) {
  const blocchi = [];
  for (const riga of testo.split('\n')) {
    if (!riga.trim()) { blocchi.push(null); continue; } // riga vuota: chiude il paragrafo
    const voce = /^\s*[-*] (.*)$/.exec(riga);
    const tipo = voce ? 'ul' : 'p';
    const ultimo = blocchi.at(-1);
    if (ultimo && ultimo.tipo === tipo) ultimo.righe.push(voce ? voce[1] : riga.replace(/^#+\s*/, ''));
    else blocchi.push({ tipo, righe: [voce ? voce[1] : riga.replace(/^#+\s*/, '')] });
  }
  return blocchi.filter(Boolean);
}

export async function caricaIndice(fetcher = (...a) => fetch(...a), url = 'guida/indice.json') {
  const r = await fetcher(url);
  if (!r.ok) throw new Error(`Indice della guida non disponibile (${r.status})`); // i18n-ok: la schermata mostra chatbot.errore
  return r.json();
}
