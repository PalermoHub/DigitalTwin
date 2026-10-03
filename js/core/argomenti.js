// Argomenti trattati: un elemento per modulo con strati, per la tab «Argomenti» del foglio Info.
export function elencoArgomenti(moduli) {
  return moduli
    .filter(m => m.strati?.length)
    .map(m => ({
      id: m.id,
      titolo: m.argomento?.titolo ?? m.titolo,
      descrizione: m.argomento?.descrizione ?? '',
      strati: m.strati.map(s => ({ id: s.id, etichetta: s.etichetta })),
    }));
}

// Le caselle della tab pilotano quelle del pannello strati (`#strato-<id>`), che restano l'unica fonte di verità:
// così passano da imposta(), suCambio e dal pallino dell'icona senza duplicare la logica.
export function schedaArgomenti(moduli, doc = document) {
  const radice = doc.createElement('div');
  const h = doc.createElement('h2');
  h.textContent = 'Argomenti';
  radice.append(h);
  const intro = doc.createElement('p');
  intro.textContent = 'Gli argomenti trattati dal Digital Twin. Spunta uno strato per mostrarlo in mappa.';
  radice.append(intro);
  const caselle = [];
  for (const a of elencoArgomenti(moduli)) {
    const sez = doc.createElement('section');
    sez.className = 'argomento';
    const t = doc.createElement('h3');
    t.textContent = a.titolo;
    sez.append(t);
    if (a.descrizione) {
      const p = doc.createElement('p');
      p.textContent = a.descrizione;
      sez.append(p);
    }
    for (const s of a.strati) {
      const label = doc.createElement('label');
      const cb = doc.createElement('input');
      cb.type = 'checkbox';
      cb.dataset.strato = s.id;
      cb.addEventListener('change', () => {
        const origine = doc.getElementById(`strato-${s.id}`);
        if (!origine || origine.checked === cb.checked) return;
        origine.checked = cb.checked;
        origine.dispatchEvent(new Event('change', { bubbles: true }));
      });
      label.append(cb, ' ', s.etichetta);
      sez.append(label);
      caselle.push(cb);
    }
    radice.append(sez);
  }
  // riallinea alle caselle del pannello (stato attuale e strati non disponibili)
  const sincronizza = () => {
    for (const cb of caselle) {
      const origine = doc.getElementById(`strato-${cb.dataset.strato}`);
      cb.checked = !!origine?.checked;
      cb.disabled = !origine || origine.disabled;
      cb.title = origine?.disabled ? origine.title : '';
    }
  };
  sincronizza();
  return { elemento: radice, sincronizza };
}
