const R = 4; // tolleranza in pixel attorno al clic

function riga(dl, etichetta, valore) {
  const dt = document.createElement('dt');
  dt.textContent = etichetta;
  const dd = document.createElement('dd');
  dd.textContent = valore;
  dl.append(dt, dd);
}

function mostra(el, lngLat, voci) {
  const titolo = document.createElement('h2');
  titolo.textContent = `Scheda del luogo · ${lngLat.lat.toFixed(5)}, ${lngLat.lng.toFixed(5)}`;
  const chiudi = document.createElement('button');
  chiudi.type = 'button';
  chiudi.textContent = 'Chiudi';
  chiudi.addEventListener('click', () => { el.hidden = true; });
  const parti = [titolo];
  if (!voci.length) {
    const p = document.createElement('p');
    p.textContent = 'Nessun dato in questo punto.';
    parti.push(p);
  }
  for (const v of voci) {
    const h = document.createElement('h3');
    h.textContent = v.titolo;
    const dl = document.createElement('dl');
    for (const [k, val] of v.righe) riga(dl, k, val);
    parti.push(h, dl);
  }
  parti.push(chiudi);
  el.replaceChildren(...parti);
  el.hidden = false;
}

export function collegaScheda(map, moduli, el) {
  const conScheda = moduli.filter(m => m.scheda);
  map.on('click', e => {
    const voci = [];
    for (const m of conScheda) {
      const layers = m.scheda.layers.filter(id => map.getLayer(id));
      if (!layers.length) continue;
      let trovati = map.queryRenderedFeatures(e.point, { layers });
      const mancanti = layers.filter(id => !trovati.some(f => f.layer.id === id));
      if (mancanti.length) {
        const box = [[e.point.x - R, e.point.y - R], [e.point.x + R, e.point.y + R]];
        trovati = trovati.concat(map.queryRenderedFeatures(box, { layers: mancanti }));
      }
      const visti = new Set();
      for (const f of trovati) {
        if (visti.has(f.layer.id)) continue;
        visti.add(f.layer.id);
        voci.push(m.scheda.voce(f));
      }
    }
    voci.sort((a, b) => a.peso - b.peso);
    mostra(el, e.lngLat, voci);
  });
}
