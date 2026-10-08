// Argomenti trattati: un elemento per modulo con strati, per la tab «Argomenti» del foglio Info.
// Argomenti e strati sono sempre in ordine alfabetico: i moduli nuovi trovano il loro posto da soli.
import { t as tr } from './i18n.js';
const alfabetico = (a, b) => a.localeCompare(b, 'it', { sensitivity: 'base' });

export function elencoArgomenti(moduli) {
  return moduli
    .filter(m => m.strati?.length)
    .map(m => ({
      id: m.id,
      titolo: m.argomento?.titolo ?? m.titolo,
      descrizione: m.argomento?.descrizione ?? '',
      strati: m.strati.map(s => ({ id: s.id, etichetta: s.etichetta, ...(s.sottovoci && { sottovoci: s.sottovoci }) })).sort((a, b) => alfabetico(a.etichetta, b.etichetta)),
    }))
    .sort((a, b) => alfabetico(a.titolo, b.titolo));
}

// Pagina di sola lettura: titolo, descrizione e strati di ogni argomento. «Mostra in mappa» accende gli strati
// dell'argomento attraverso le caselle del pannello strati (`#strato-<id>`), che restano l'unica fonte di verità
// (così passano da imposta(), suCambio e dal pallino dell'icona), poi chiude la pagina per far vedere la mappa.
export function schedaArgomenti(moduli, doc = document, chiudi = () => {}) {
  const radice = doc.createElement('div');
  const h = doc.createElement('h2');
  h.textContent = tr('argomenti.titolo');
  const intro = doc.createElement('p');
  intro.className = 'pagina-intro';
  intro.textContent = tr('argomenti.intro');
  radice.append(h, intro);
  const griglia = doc.createElement('div');
  griglia.className = 'argomenti-griglia';
  radice.append(griglia);
  const bottoni = [];
  for (const a of elencoArgomenti(moduli)) {
    const sez = doc.createElement('section');
    sez.className = 'argomento info-blocco';
    const t = doc.createElement('h3');
    t.textContent = a.titolo;
    sez.append(t);
    if (a.descrizione) {
      const p = doc.createElement('p');
      p.textContent = a.descrizione;
      sez.append(p);
    }
    const ul = doc.createElement('ul');
    for (const s of a.strati) {
      const li = doc.createElement('li');
      li.textContent = s.etichetta;
      ul.append(li);
    }
    const mostra = doc.createElement('button');
    mostra.type = 'button';
    mostra.className = 'argomento-mostra';
    mostra.textContent = tr('argomenti.mostra');
    mostra.dataset.argomento = a.id;
    const caselle = () => a.strati.map(s => doc.getElementById(`strato-${s.id}`)).filter(c => c && !c.disabled);
    mostra.addEventListener('click', () => {
      for (const c of caselle()) {
        if (c.checked) continue;
        c.checked = true;
        c.dispatchEvent(new Event('change', { bubbles: true }));
      }
      chiudi();
    });
    bottoni.push({ mostra, caselle });
    sez.append(ul, mostra);
    griglia.append(sez);
  }
  // senza strati disponibili (es. non ancora caricati) il pulsante resta spento
  const sincronizza = () => {
    for (const { mostra, caselle } of bottoni) mostra.disabled = !caselle().length;
  };
  sincronizza();
  return { elemento: radice, sincronizza };
}
