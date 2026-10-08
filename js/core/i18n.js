// Internazionalizzazione IT/EN: dizionari piatti (js/locales/<lingua>.json), chiavi a punti, segnaposto {nome}.
// L'italiano è la lingua base e la riserva: una chiave mancante in inglese cade sul testo italiano.
// Cambiare lingua ricarica la pagina, quindi t() si risolve una volta sola, al caricamento dei moduli.
const CHIAVE = 'dt-lingua';
const LINGUE = ['it', 'en'];
const LOCALE = { it: 'it-IT', en: 'en-GB' };

let corrente = 'it';
let dizionario = {};
let riserva = {};

export function rilevaLingua(storage, navigatore) {
  let salvata = null;
  try { salvata = storage?.getItem(CHIAVE); } catch (e) { /* storage non disponibile: si usa il browser */ }
  if (LINGUE.includes(salvata)) return salvata;
  const l = String(navigatore?.language || 'it').toLowerCase();
  return l.startsWith('it') ? 'it' : 'en';
}

export function impostaDizionari(l, principale, italiano) {
  corrente = LINGUE.includes(l) ? l : 'it';
  dizionario = principale || {};
  riserva = italiano || {};
}

export const lingua = () => corrente;
export const localeIntl = () => LOCALE[corrente];

export function t(chiave, vars) {
  const s = dizionario[chiave] ?? riserva[chiave];
  if (s === undefined) {
    console.warn(`i18n: manca la chiave «${chiave}»`);
    return chiave;
  }
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s;
}

// Testi del modello dati (etichette di riga, titoli di sezione, note delle schede): restano italiani nei moduli che li
// producono, perché fanno da identità (preferenze salvate, confronti); si traducono solo al momento di mostrarli.
// In inglese cerca «lbl.<testo italiano>»; se manca (un nome proprio, un dato) restituisce il testo senza avvisi.
export const tl = testo => (corrente === 'it' || !testo ? testo : dizionario[`lbl.${testo}`] ?? testo);

// plurale: usa <base>.uno per n === 1, <base>.altri altrimenti; {n} è sempre disponibile
export const tn = (base, n, vars) => t(`${base}.${n === 1 ? 'uno' : 'altri'}`, { n, ...vars });

const ATTRIBUTI = {
  'data-i18n-title': 'title', 'data-i18n-aria': 'aria-label', 'data-i18n-placeholder': 'placeholder',
  'data-i18n-content': 'content', 'data-i18n-alt': 'alt',
};

// applica le traduzioni agli elementi marcati; data-i18n-html solo per testi nostri (mai da input utente)
export function applicaDom(radice = document) {
  radice.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.getAttribute('data-i18n')); });
  radice.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
  for (const [attr, dest] of Object.entries(ATTRIBUTI)) {
    radice.querySelectorAll(`[${attr}]`).forEach(el => el.setAttribute(dest, t(el.getAttribute(attr))));
  }
  radice.documentElement?.setAttribute('lang', corrente);
}

function storageSicuro() { try { return globalThis.localStorage; } catch (e) { return null; } }

export async function caricaDizionari({ fetchFn = fetch, storage, navigatore, base = new URL('../locales/', import.meta.url) } = {}) {
  const l = rilevaLingua(storage ?? storageSicuro(), navigatore ?? globalThis.navigator);
  const leggi = async nome => {
    try {
      const r = await fetchFn(new URL(`${nome}.json`, base));
      return r.ok ? await r.json() : {};
    } catch (e) { return {}; }
  };
  const [italiano, principale] = await Promise.all([leggi('it'), l === 'it' ? null : leggi(l)]);
  impostaDizionari(l, l === 'it' ? italiano : principale, italiano);
  return l;
}

export function impostaLingua(l, { storage = storageSicuro(), ricarica = () => location.reload() } = {}) {
  if (l === corrente) return;
  try { storage?.setItem(CHIAVE, l); } catch (e) { /* storage non disponibile: la scelta vale solo finché la pagina resta aperta */ }
  ricarica();
}

const GLOBO = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/></svg>';

// pulsante «globo + IT/EN»: mostra la lingua corrente, un clic passa all'altra
export function creaInterruttoreLingua(doc, opzioni = {}) {
  const altra = corrente === 'it' ? 'en' : 'it';
  const b = doc.createElement('button');
  b.id = 'switch-lingua';
  b.type = 'button';
  b.innerHTML = `${GLOBO}<span class="lingua-sigla">${corrente.toUpperCase()}</span>`;
  b.title = t('lingua.passa');
  b.setAttribute('aria-label', t('lingua.passa'));
  b.lang = altra;
  b.addEventListener('click', () => impostaLingua(altra, opzioni));
  return b;
}
