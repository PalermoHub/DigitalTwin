import { urlDati } from './config.js';
import { schedaArgomenti } from './argomenti.js';
import { schedaGuida } from './guida.js';

const AVVISI = [
  'Catasto, zonizzazione PRG e vincoli sono solo informativi e non hanno valore legale: per usi legali servono il certificato di destinazione urbanistica e le visure ufficiali.',
  'Il PRG vigente è la Variante generale 2004: varianti puntuali successive potrebbero non essere incluse.',
  'I dati del censimento 2023 sono stime campionarie (censimento permanente): i valori per sezione non sono conteggi esatti.',
  'La popolazione per edificio è una stima.',
];

export async function caricaCatalogo() {
  const r = await fetch(urlDati('catalogo.json'));
  if (!r.ok) throw new Error('catalogo.json non disponibile');
  return r.json();
}

const CREDITS = [
  'Testo provvisorio: progetto a cura di Open Data Sicilia.',
  'Realizzazione, dati e licenze: da completare.',
];

function elenco(voci) {
  const ul = document.createElement('ul');
  for (const t of voci) {
    const li = document.createElement('li');
    li.textContent = t;
    ul.append(li);
  }
  return ul;
}

// Foglio informativo non modale: si apre/chiude dalla linguetta, dal pulsante info o con Esc.
export function commutaCrediti(dialog, catalogo, moduli = []) {
  if (dialog.open) return dialog.close();
  apriCrediti(dialog, catalogo, moduli);
}

export function apriCrediti(dialog, catalogo, moduli = []) {
  const fonti = elenco([
    ...catalogo.filter(v => v.fonte).map(v => `${v.fonte} (${v.data})` + (v.licenza ? ` — ${v.licenza}` : ' — licenza da verificare')),
    'Base cartografica: OpenFreeMap, © OpenMapTiles, dati © OpenStreetMap contributors',
    'Carta Tecnica Comunale 2k (2007/09): SiciliaHub / Comune di Palermo',
    'Scuole, asili comunali e sedi delle sezioni elettorali: Comune di Palermo, dati aperti (2017) — condizioni d\'uso da verificare',
    'Trasporto pubblico (linee, fermate, orari): AMAT Palermo S.p.A., feed GTFS valido dal 25/08/2026 al 31/10/2026 — condizioni d\'uso da verificare',
    'Sicurezza stradale: incidenti 2015–2023 del Comune di Palermo (Polizia Municipale), rete stradale © OpenStreetMap contributors, elaborazione PalermoHub / OpenDataSicilia (studio «Rete stradale») — condizioni d\'uso da verificare',
    'Uffici comunali (struttura, responsabili, sedi e contatti): sito istituzionale del Comune di Palermo, comune.palermo.it/amministrazione/uffici — condizioni d\'uso da verificare',
    'Monumenti: Portale del Turismo del Comune di Palermo (testi, foto e link) e «Mappa monumentale di Palermo e dell\'Agro Palermitano» di Marcello Petrucci (posizioni, testi e foto) — condizioni d\'uso da verificare',
  ]);
  const argomenti = schedaArgomenti(moduli);
  const guida = schedaGuida();
  const schede = [
    ['fonti', 'Fonti e avvisi', [Object.assign(document.createElement('h2'), { textContent: 'Fonti e avvisi' }), elenco(AVVISI), fonti]],
    ['argomenti', 'Argomenti', [argomenti.elemento]],
    ['guida', 'Guida', [guida]],
    ['credits', 'Credits', [Object.assign(document.createElement('h2'), { textContent: 'Credits' }), elenco(CREDITS)]],
  ];

  const tabs = document.createElement('div');
  tabs.className = 'tabs';
  tabs.setAttribute('role', 'tablist');
  const pannelli = [];
  const seleziona = i => schede.forEach(([, , ], k) => {
    const attiva = k === i;
    tabs.children[k].setAttribute('aria-selected', String(attiva));
    tabs.children[k].tabIndex = attiva ? 0 : -1;
    pannelli[k].hidden = !attiva;
  });
  const aggiorna = () => argomenti.sincronizza();
  schede.forEach(([id, etichetta, contenuto], i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.id = `tab-${id}`;
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-controls', `tabpanel-${id}`);
    b.textContent = etichetta;
    b.addEventListener('click', () => { seleziona(i); aggiorna(); });
    b.addEventListener('keydown', e => {
      const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      const j = (i + d + schede.length) % schede.length;
      seleziona(j);
      aggiorna();
      tabs.children[j].focus();
    });
    tabs.append(b);
    const p = document.createElement('div');
    p.id = `tabpanel-${id}`;
    p.setAttribute('role', 'tabpanel');
    p.setAttribute('aria-labelledby', b.id);
    p.append(...contenuto);
    pannelli.push(p);
  });
  seleziona(0);

  const corpo = document.createElement('div');
  corpo.className = 'tab-corpo';
  corpo.append(...pannelli);
  const inCima = document.createElement('button');
  inCima.type = 'button';
  inCima.className = 'in-cima';
  inCima.hidden = true;
  inCima.textContent = '↑ In cima';
  inCima.addEventListener('click', () => corpo.scrollTo({ top: 0, behavior: 'smooth' }));
  corpo.addEventListener('scroll', () => { inCima.hidden = corpo.scrollTop < 40; });
  // cambiando tab si riparte dall'alto
  tabs.addEventListener('click', () => { corpo.scrollTop = 0; });
  const linguetta = document.createElement('button');
  linguetta.type = 'button';
  linguetta.className = 'crediti-linguetta';
  linguetta.setAttribute('aria-label', 'Chiudi le informazioni');
  linguetta.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>';
  linguetta.addEventListener('click', () => dialog.close());
  const chiudi = document.createElement('button');
  chiudi.type = 'button';
  chiudi.className = 'crediti-x';
  chiudi.setAttribute('aria-label', 'Chiudi');
  chiudi.title = 'Chiudi';
  chiudi.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
  chiudi.addEventListener('click', () => dialog.close());
  const testata = document.createElement('div');
  testata.className = 'crediti-testata';
  testata.append(tabs, chiudi);
  dialog.replaceChildren(linguetta, testata, corpo, inCima);
  // le caselle del pannello possono cambiare a foglio aperto (il foglio non è modale)
  const ctl = new AbortController();
  document.getElementById('pannello')?.addEventListener('change', aggiorna, { signal: ctl.signal });
  dialog.addEventListener('close', () => ctl.abort(), { once: true });
  if (!dialog.open) dialog.show();
}
