import { urlDati } from './config.js';
import { preparaIndice, cerca } from './indirizzi.js';
import { segnala } from './pannello.js';

let promessa = null;

// l'indice (4,5 MB) si scarica una volta sola, anche se si digita prima che arrivi
function indice() {
  promessa ??= fetch(urlDati('civici-omi/civici_index.json'))
    .then(r => {
      if (!r.ok) throw new Error('indice civici non disponibile');
      return r.json();
    })
    .then(preparaIndice)
    .catch(err => { promessa = null; throw err; }); // un errore non resta in cache: si riprova
  return promessa;
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
    if (!risultati.length) {
      const vuoto = document.createElement('li');
      vuoto.className = 'cerca-vuoto';
      vuoto.textContent = 'Nessun risultato';
      lista.replaceChildren(vuoto);
      lista.hidden = false;
      return risultati;
    }
    lista.replaceChildren(...risultati.map(r => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = r.nota ? `${r.etichetta} — ${r.nota}` : r.etichetta;
      b.addEventListener('click', () => vai(r));
      li.append(b);
      return li;
    }));
    lista.hidden = false;
    return risultati;
  }

  input.addEventListener('input', aggiorna);
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const risultati = await aggiorna();
    if (risultati.length) vai(risultati[0]);
  });
}
