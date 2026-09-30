const mostrati = new Set();

export function segnala(testo) {
  if (mostrati.has(testo)) return;
  mostrati.add(testo);
  const d = document.createElement('div');
  d.textContent = testo;
  document.getElementById('avvisi').append(d);
}

function imposta(map, ids, visibile) {
  for (const id of ids) {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visibile ? 'visible' : 'none');
  }
}

export function costruisciPannello(map, moduli, contenitore) {
  for (const m of moduli) {
    const gruppo = document.createElement('fieldset');
    const legenda = document.createElement('legend');
    legenda.textContent = m.titolo;
    gruppo.append(legenda);
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
    contenitore.append(gruppo);
  }
}
