import { urlDati } from './config.js';
import { preparaIndice, cerca } from './indirizzi.js';
import { segnala } from './pannello.js';

let voci = null;

async function indice() {
  if (!voci) {
    const r = await fetch(urlDati('civici-omi/civici_index.json'));
    if (!r.ok) throw new Error('indice civici non disponibile');
    voci = preparaIndice(await r.json());
  }
  return voci;
}

export function collegaRicerca(map, form, input, lista) {
  let marcatore = null;

  function vai(r) {
    lista.hidden = true;
    input.value = r.etichetta;
    if (marcatore) marcatore.remove();
    marcatore = new maplibregl.Marker().setLngLat([r.lon, r.lat]).addTo(map);
    map.flyTo({ center: [r.lon, r.lat], zoom: 18 });
  }

  async function aggiorna() {
    if (input.value.trim().length < 3) { lista.hidden = true; return []; }
    let risultati;
    try {
      risultati = cerca(await indice(), input.value);
    } catch (err) {
      segnala(`Ricerca non disponibile: ${err.message}`);
      return [];
    }
    lista.replaceChildren(...risultati.map(r => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = r.etichetta;
      b.addEventListener('click', () => vai(r));
      li.append(b);
      return li;
    }));
    lista.hidden = !risultati.length;
    return risultati;
  }

  input.addEventListener('input', aggiorna);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const risultati = await aggiorna();
    if (risultati.length) vai(risultati[0]);
  });
}
