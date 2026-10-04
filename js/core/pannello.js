import { svgIcona } from './icone.js';

const mostrati = new Set();
const DURATA_AVVISO = 8000;

// Avviso non bloccante: ha il pulsante di chiusura e sparisce da solo; lo stesso testo non si impila due volte
// finché è visibile, ma può ricomparire dopo la chiusura.
const errori = new Set();

// Più strati non caricati si riassumono in un solo avviso (la copia non ha tutti i dati locali).
export function segnala(testo) {
  let riassunto = false;
  if (testo.startsWith('Strato non caricato')) {
    errori.add(testo.replace(/^Strato non caricato:\s*/, ''));
    riassunto = true;
    document.querySelector('#avvisi [data-errori] button')?.click();
    testo = errori.size === 1 ? `Strato non caricato: ${[...errori][0]}` : `${errori.size} strati non caricati: dati non raggiungibili`;
  }
  if (mostrati.has(testo)) return;
  mostrati.add(testo);
  const d = document.createElement('div');
  if (riassunto) d.dataset.errori = '1';
  const t = document.createElement('span');
  t.textContent = testo;
  const x = document.createElement('button');
  x.type = 'button';
  x.title = 'Chiudi';
  x.setAttribute('aria-label', 'Chiudi l\'avviso');
  x.innerHTML = svgIcona('chiudi', 14);
  const chiudi = () => { clearTimeout(timer); d.remove(); mostrati.delete(testo); };
  const timer = setTimeout(chiudi, DURATA_AVVISO);
  x.addEventListener('click', chiudi);
  d.append(t, x);
  document.getElementById('avvisi').append(d);
}

function imposta(map, ids, visibile) {
  for (const id of ids) {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visibile ? 'visible' : 'none');
  }
}

const ETICHETTE = { base: 'Mappa', popolazione: 'Popolazione', confini: 'Confini', territorio: 'Territorio', edifici: 'Edifici', terreno: 'Rilievo', trasporto: 'Trasporti', pai: 'Piano PAI', monumenti: 'Monumenti', scuole: 'Scuole', uffici: 'Uffici', colonnine: 'Servizi', incendi: 'Incendi', sicurezza: 'Sicurezza' };

// Totale degli strati accesi (mostrato sul pulsante «Strati» di mobile)
function aggiornaConteggio() {
  const caselle = [...document.querySelectorAll('#pannello input[type=checkbox]:checked:not([data-filtro])')];
  const el = document.getElementById('strati-attivi');
  if (el) el.textContent = String(caselle.length);
  // chip degli strati accesi: si spengono con un clic
  const chip = document.getElementById('strati-chip');
  if (!chip) return;
  const MAX = 4;
  const voci = caselle.slice(0, MAX).map(c => {
    const nome = c.closest('label')?.textContent.replace(/\s+/g, ' ').trim() || c.id;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'strato-chip';
    b.title = `Spegni: ${nome}`;
    b.setAttribute('aria-label', `Spegni lo strato ${nome}`);
    const t = document.createElement('span');
    t.textContent = nome;
    const x = document.createElement('i');
    x.textContent = '\u00d7';
    x.setAttribute('aria-hidden', 'true');
    b.append(t, x);
    b.addEventListener('click', () => { c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true })); });
    return b;
  });
  if (caselle.length > MAX) {
    const altri = document.createElement('span');
    altri.className = 'strato-chip strato-chip--altri';
    altri.textContent = `+${caselle.length - MAX}`;
    voci.push(altri);
  }
  chip.replaceChildren(...voci);
}

function bottoneGruppo(id, titolo) {
  const b = document.createElement('button');
  b.type = 'button';
  b.id = `btn-gruppo-${id}`;
  b.title = titolo;
  b.setAttribute('aria-label', titolo);
  b.setAttribute('aria-expanded', 'false');
  b.setAttribute('aria-controls', `gruppo-${id}`);
  b.innerHTML = `${svgIcona(id) || svgIcona('info')}<span class="et">${ETICHETTE[id] ?? titolo}</span>`;
  return b;
}

// Ogni modulo diventa un sotto-pannello a comparsa sotto la barra degli strumenti; ne sta aperto uno solo.
export function costruisciPannello(map, moduli, contenitore, barra) {
  const gruppi = [];
  const aggiungi = (id, titolo) => {
    const el = document.createElement('section');
    el.id = `gruppo-${id}`;
    el.className = 'sotto-pannello';
    el.hidden = true;
    const h = document.createElement('h2');
    h.textContent = titolo;
    el.append(h);
    const bottone = bottoneGruppo(id, titolo);
    bottone.addEventListener('click', () => {
      const apri = el.hidden;
      for (const g of gruppi) { g.el.hidden = true; g.bottone.setAttribute('aria-expanded', 'false'); }
      el.hidden = !apri;
      bottone.setAttribute('aria-expanded', String(apri));
    });
    gruppi.push({ el, bottone });
    barra.append(bottone);
    contenitore.append(el);
    el.bottone = bottone;
    return el;
  };

  for (const m of moduli) {
    // un modulo con `gruppo` mette i suoi strati in un gruppo già esistente (che deve precederlo in MODULI)
    const gruppo = (m.gruppo && document.getElementById(`gruppo-${m.gruppo}`)) || aggiungi(m.id, m.titolo);
    // `sezione`: titolo sopra gli strati di un modulo che condivide il gruppo con altri
    if (m.sezione) {
      const h = document.createElement('h3');
      h.className = 'gruppo-sezione';
      h.textContent = m.sezione;
      gruppo.append(h);
    }
    for (const s of m.strati) {
      const label = document.createElement('label');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = `strato-${s.id}`;
      cb.checked = s.attivo;
      cb.addEventListener('change', () => {
        imposta(map, s.layers, cb.checked);
        if (s.suCambio) s.suCambio(cb.checked, map);
      });
      label.append(cb, ' ', s.etichetta);
      gruppo.append(label);
    }
    if (m.pannello) m.pannello(gruppo, map);
    // pallino verde sull'icona se nel gruppo c'è almeno uno strato acceso
    const segna = () => {
      const caselle = [...gruppo.querySelectorAll('input[type=checkbox]:not([data-filtro])')];
      if (caselle.length) {
        const n = caselle.filter(c => c.checked).length;
        gruppo.bottone.dataset.attivo = String(n > 0);
        gruppo.bottone.dataset.n = String(n);
      }
      aggiornaConteggio();
    };
    gruppo.addEventListener('change', segna);
    segna();
  }
  // campo «Cerca strato» nei gruppi con molte voci
  for (const { el } of gruppi) {
    const voci = [...el.querySelectorAll(':scope > label')];
    if (voci.length < 4 || el.querySelector('.base-griglia')) continue;
    const campo = document.createElement('input');
    campo.type = 'search';
    campo.className = 'strato-cerca';
    campo.placeholder = 'Cerca strato\u2026';
    campo.setAttribute('aria-label', 'Cerca strato');
    campo.addEventListener('input', () => {
      const q = campo.value.trim().toLowerCase();
      for (const v of voci) v.hidden = !!q && !v.textContent.toLowerCase().includes(q);
    });
    el.querySelector('h2').after(campo);
  }
  aggiornaConteggio();
  // clic fuori dai sotto-pannelli: si chiudono
  document.addEventListener('pointerdown', e => {
    if (e.target.closest('.sotto-pannello, #barra-gruppi')) return;
    for (const g of gruppi) { g.el.hidden = true; g.bottone.setAttribute('aria-expanded', 'false'); }
  });
}

// Disattiva uno strato il cui dato non si è caricato: nascosto, casella spenta e non cliccabile.
export function disattivaStrato(map, strato) {
  imposta(map, strato.layers, false);
  const casella = document.getElementById(`strato-${strato.id}`);
  if (!casella) return;
  casella.checked = false;
  casella.disabled = true;
  casella.title = 'Dato non disponibile';
  aggiornaConteggio();
}
