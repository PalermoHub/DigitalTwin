// Argomenti trattati: un elemento per modulo con strati, per la tab «Argomenti» del foglio Info.
// Argomenti e strati sono sempre in ordine alfabetico: i moduli nuovi trovano il loro posto da soli.
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

// Le caselle della tab pilotano quelle del pannello strati (`#strato-<id>`), che restano l'unica fonte di verità:
// così passano da imposta(), suCambio e dal pallino dell'icona senza duplicare la logica.
// Le sotto-voci di uno strato (es. stato e corrente delle colonnine) fanno lo stesso con le caselle `[data-filtro]` del pannello.
export function schedaArgomenti(moduli, doc = document) {
  const radice = doc.createElement('div');
  const h = doc.createElement('h2');
  h.textContent = 'Argomenti';
  radice.append(h);
  const intro = doc.createElement('p');
  intro.textContent = 'Gli argomenti trattati dal Digital Twin. Spunta uno strato per mostrarlo in mappa.';
  radice.append(intro);
  const caselle = [];
  const filtri = [];
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
        sincronizza();
      });
      label.append(cb, ' ', s.etichetta);
      sez.append(label);
      caselle.push(cb);
      for (const gruppo of s.sottovoci ?? []) {
        const blocco = doc.createElement('div');
        blocco.className = 'argomento-filtri';
        const titolo = doc.createElement('h4');
        titolo.textContent = gruppo.titolo;
        blocco.append(titolo);
        for (const v of gruppo.voci) {
          const l = doc.createElement('label');
          const c = doc.createElement('input');
          c.type = 'checkbox';
          c.dataset.sottofiltro = v.id;
          c.addEventListener('change', () => {
            const filtro = doc.querySelector(`input[data-filtro="${v.id}"]`);
            if (!filtro || filtro.disabled || filtro.checked === c.checked) return;
            filtro.checked = c.checked;
            filtro.dispatchEvent(new Event('change', { bubbles: true }));
          });
          l.append(c, ' ', v.etichetta);
          blocco.append(l);
          filtri.push(c);
        }
        sez.append(blocco);
      }
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
    for (const c of filtri) {
      const filtro = doc.querySelector(`input[data-filtro="${c.dataset.sottofiltro}"]`);
      c.checked = !!filtro?.checked;
      c.disabled = !filtro || filtro.disabled;
    }
  };
  sincronizza();
  return { elemento: radice, sincronizza };
}
