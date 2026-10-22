import { normalizza } from './indirizzi.js';
import { lingua as linguaApp } from './i18n.js';

// Ricerca del Chat bot nell'indice della guida (guida/indice.json, generato da scripts/guida_indice.py).
// Una voce = una sezione «##»: { id, file, titolo, parole, domande[], testo }. Nessun testo è generato: si mostra quello della guida.
export const SOGLIA = 3; // punteggio medio per parola sotto cui si risponde «non lo so»
const PESI = { domande: 8, parole: 6, titolo: 5, testo: 1 };
const MIN_PAROLA = 3;
const MIN_PAROLA_TESTO = 4; // nel testo le parole corte farebbero rumore
const PAROLE_VUOTE = new Set(['VIA', 'VIE', 'COME', 'COSA', 'DOVE', 'QUANDO', 'PERCHE', 'CHE', 'CON', 'PER', 'DELLA', 'DELLE', 'DELLO', 'DEGLI', 'DEI', 'UNA', 'UNO', 'THE', 'AND', 'FOR', 'HOW', 'WITH', 'WHAT', 'POSSO', 'FACCIO', 'SONO', 'DEL', 'NEL', 'NELLA', 'NELLE', 'QUAL', 'QUALE', 'QUALI', 'CHI', 'WHERE', 'WHEN', 'WHY', 'WHO', 'WHICH', 'CAN', 'COULD', 'SHOULD', 'DOES', 'DOING', 'YOU', 'YOUR', 'ARE', 'THIS', 'THAT', 'FROM', 'INTO', 'ABOUT', 'SHOW', 'TELL']); // i18n-ok: parole vuote della ricerca
const NUMERO_INIZIALI = 4;

const radice = p => (p.length >= 5 ? p.slice(0, -1) : p); // «colori» trova «colore»
const contiene = (campo, parola) => { const r = radice(parola); return campo.some(w => w.startsWith(r)); }; // dall'inizio di una parola: «bus» non è in «abusi»

function campiNormalizzati(v) {
  return v.__n ??= {
    domande: normalizza(v.domande.join(' ')).split(' '),
    parole: normalizza(v.parole).split(' '),
    titolo: normalizza(v.titolo).split(' '),
    testo: normalizza(v.testo).split(' '),
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

// Refusi: una parola che non compare in nessun campo della guida («arei») si sostituisce con quella più vicina (una lettera
// in più, in meno, diversa o scambiata, stessa iniziale): si prova solo se la ricerca esatta non trova nulla.
// Tipo di refuso (più basso = più probabile) o null se la distanza è maggiore di uno: 0 lettere scambiate, 1 lettera mancante, 2 lettera in più, 3 lettera diversa.
const refuso = (a, b) => {
  if (a === b || Math.abs(a.length - b.length) > 1 || a[0] !== b[0]) return null;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  const [x, y] = [a.slice(i), b.slice(i)];
  if (x.length === y.length) {
    if (x.length > 1 && x[0] === y[1] && x[1] === y[0] && x.slice(2) === y.slice(2)) return 0;
    return x.slice(1) === y.slice(1) ? 3 : null;
  }
  if (x.length < y.length) return y.slice(1) === x ? 1 : null;
  return x.slice(1) === y ? 2 : null;
};

const vocabolari = new WeakMap();
function vocabolario(voci) {
  if (!vocabolari.has(voci)) {
    const conta = new Map();
    for (const v of voci) { const c = campiNormalizzati(v); for (const campo of ['domande', 'parole', 'titolo']) for (const w of c[campo]) if (w.length >= MIN_PAROLA) conta.set(w, (conta.get(w) ?? 0) + 1); }
    vocabolari.set(voci, conta);
  }
  return vocabolari.get(voci);
}

function correggi(voci, parole) {
  const noti = vocabolario(voci);
  const migliore = p => {
    let scelta = null;
    for (const [w, n] of noti) {
      const tipo = refuso(p, w);
      if (tipo != null && (!scelta || tipo < scelta.tipo || (tipo === scelta.tipo && n > scelta.n))) scelta = { w, tipo, n };
    }
    return scelta?.w ?? p;
  };
  return parole.map(p => (voci.some(v => { const c = campiNormalizzati(v); return ['domande', 'parole', 'titolo', 'testo'].some(k => contiene(c[k], p)); }) ? p : migliore(p)));
}

// `trovate`: al massimo il passaggio migliore, se supera la soglia. `vicine`: domande della guida, se non c'è risposta.
// `candidate`: le migliori `n` voci con un punteggio positivo (serve ai test e alla taratura).
export function rispondi(voci, domanda, n = 3) {
  const parole = normalizza(domanda ?? '').split(' ').filter(p => p.length >= MIN_PAROLA && !PAROLE_VUOTE.has(p));
  if (!parole.length) return { trovate: [], vicine: [], candidate: [] };
  let ordinate = voci.map(v => ({ v, p: punteggio(v, parole) })).filter(x => x.p > 0).sort((a, b) => b.p - a.p);
  if (!ordinate.length) {
    const corrette = correggi(voci, parole);
    if (corrette.some((p, i) => p !== parole[i])) ordinate = voci.map(v => ({ v, p: punteggio(v, corrette) })).filter(x => x.p > 0).sort((a, b) => b.p - a.p);
  }
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

const INDICE_IT = 'guida/indice.json';
const INDICE_EN = 'guida/indice.en.json';

async function scarica(fetcher, url) {
  const r = await fetcher(url);
  if (!r.ok) throw new Error(`Indice della guida non disponibile (${r.status})`); // i18n-ok: la schermata mostra chatbot.errore
  return r.json();
}

// Carica l'indice nella lingua dell'app. In inglese, se l'indice inglese non c'è (o non si scarica) si ripiega sull'italiano.
// Con un `url` esplicito si scarica solo quello.
export async function caricaIndice(fetcher = (...a) => fetch(...a), url = null, lingua = linguaApp()) {
  if (url) return scarica(fetcher, url);
  if (lingua !== 'en') return scarica(fetcher, INDICE_IT);
  try { return await scarica(fetcher, INDICE_EN); } catch { return scarica(fetcher, INDICE_IT); }
}
