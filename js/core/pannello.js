import { svgIcona } from './icone.js';

const mostrati = new Set();
const DURATA_AVVISO = 8000;

// Avviso non bloccante: ha il pulsante di chiusura e sparisce da solo; lo stesso testo non si impila due volte
// finché è visibile, ma può ricomparire dopo la chiusura.
export function segnala(testo) {
  if (mostrati.has(testo)) return;
  mostrati.add(testo);
  const d = document.createElement('div');
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

const ETICHETTE = { base: 'Mappa', popolazione: 'Abitanti', confini: 'Confini', territorio: 'Territorio', edifici: 'Edifici', terreno: 'Rilievo', trasporto: 'Trasporti', pai: 'PAI' };

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
      const caselle = [...gruppo.querySelectorAll('input[type=checkbox]')];
      if (caselle.length) gruppo.bottone.dataset.attivo = String(caselle.some(c => c.checked));
    };
    gruppo.addEventListener('change', segna);
    segna();
  }
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
}
