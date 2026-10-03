import { urlDati } from './config.js';
import { decodificaCivici, chiaveSezione } from './compatto.js';
import { preparaIndiceVie, vieConCivico, cerca } from './indirizzi.js';
import { FONTI, preparaLuoghi, cercaLuoghi } from './luoghi.js';
import { segnala } from './pannello.js';

let promessa = null;

// l'indice leggero delle vie (nome e primo punto) si scarica una volta sola, anche se si digita prima che arrivi
function indice() {
  promessa ??= fetch(urlDati('civici-omi/civici_vie.json'))
    .then(r => {
      if (!r.ok) throw new Error('indice civici non disponibile');
      return r.json();
    })
    .then(preparaIndiceVie)
    .catch(err => { promessa = null; throw err; }); // un errore non resta in cache: si riprova
  return promessa;
}

// i civici stanno in 32 file (hash del nome della via), scaricato solo quando si cerca «via + numero»
const sezioni = new Map();
function sezione(chiave) {
  if (!sezioni.has(chiave)) {
    sezioni.set(chiave, fetch(urlDati(`civici-omi/civici/${chiave}.json`))
      .then(r => {
        if (!r.ok) throw new Error('civici non disponibili');
        return r.json();
      })
      .then(decodificaCivici)
      .catch(err => { sezioni.delete(chiave); throw err; }));
  }
  return sezioni.get(chiave);
}

async function conCivici(voci, testo) {
  const vie = vieConCivico(voci, testo).filter(v => !v.civici);
  const chiavi = [...new Set(vie.map(v => chiaveSezione(v.via)))];
  const caricate = new Map(await Promise.all(chiavi.map(async k => [k, await sezione(k)])));
  for (const v of vie) v.civici = caricate.get(chiaveSezione(v.via))[v.via];
  return voci;
}

// scuole, sezioni elettorali e monumenti: i file sono già quelli degli strati, il browser li ha in cache
let promessaLuoghi = null;
function luoghi() {
  promessaLuoghi ??= Promise.all(FONTI.map(async f => {
    const r = await fetch(urlDati(f.file));
    if (!r.ok) throw new Error(`${f.file} non disponibile`);
    return { ...f, features: (await r.json()).features };
  })).then(preparaLuoghi).catch(err => { promessaLuoghi = null; throw err; });
  return promessaLuoghi;
}

// «12/345», «f 12 p 345», «foglio 12 particella 345» → { foglio, numero }; altrimenti null
export function leggiParticella(testo) {
  const m = testo.trim().match(/^(?:f(?:oglio)?\.?\s*)?(\d+)\s*(?:\/|-|p(?:art(?:icella)?)?\.?)\s*(\d+)$/i);
  return m ? { foglio: String(+m[1]), numero: String(+m[2]) } : null;
}

// `vaiParticella(foglio, numero)` è facoltativa: se c'è, la barra riconosce anche i riferimenti catastali.
// `incidenti` è facoltativo: ha `suggerisci(testo)` → { inCima, inCoda } (vedi layers/sicurezza-ricerca.js).
export function collegaRicerca(map, form, input, lista, vaiParticella = null, zone = null, incidenti = null) {
  let marcatore = null;

  function vai(r) {
    lista.hidden = true;
    input.value = r.etichetta;
    if (marcatore) marcatore.remove();
    marcatore = new maplibregl.Marker().setLngLat([r.lon, r.lat]).addTo(map);
    map.flyTo({ center: [r.lon, r.lat], zoom: r.zoom ?? 18 });
    // un luogo si vede solo a strato acceso: lo si accende (se il dato non si è caricato la casella è disabilitata)
    const casella = r.strato && document.getElementById(`strato-${r.strato}`);
    if (casella && !casella.checked && !casella.disabled) { casella.checked = true; casella.dispatchEvent(new Event('change')); }
  }

  async function aggiorna() {
    const zoneTrovate = zone ? zone.suggerisci(input.value) : [];
    if (input.value.trim().length < 3 && !zoneTrovate.length && !/^[a-z]*\d+$/i.test(input.value.trim())) { lista.hidden = true; return []; }
    const part = vaiParticella && leggiParticella(input.value);
    if (part) {
      const etichetta = `Particella catastale — foglio ${part.foglio}, particella ${part.numero}`;
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = etichetta;
      const vai = () => { lista.hidden = true; vaiParticella(part.foglio, part.numero); };
      b.addEventListener('click', vai);
      li.append(b);
      lista.replaceChildren(li);
      lista.hidden = false;
      return [{ vai }];
    }
    let risultati = [];
    let errore = null;
    try {
      risultati = cerca(await conCivici(await indice(), input.value), input.value);
    } catch (err) { errore = err; }
    let luoghiTrovati = [];
    try {
      luoghiTrovati = cercaLuoghi(await luoghi(), input.value);
    } catch (err) { errore ??= err; }
    let incidentiCima = [];
    let incidentiCoda = [];
    if (incidenti) {
      try {
        const { inCima, inCoda } = await incidenti.suggerisci(input.value);
        // la riga di una via ha una sua azione: la lista va chiusa e il testo messo nella barra, come in `vai`
        const chiudi = r => (r.vai ? { ...r, vai: () => { lista.hidden = true; input.value = r.etichetta; r.vai(); } } : r);
        incidentiCima = inCima.map(chiudi);
        incidentiCoda = inCoda.map(chiudi);
      } catch (err) { errore ??= err; }
    }
    if (errore && !zoneTrovate.length && !luoghiTrovati.length && !incidentiCima.length && !incidentiCoda.length) {
      segnala(`Ricerca non disponibile: ${errore.message}`);
      return [];
    }
    // le zone il cui nome inizia con il testo precedono tutto, poi i luoghi per nome, le vie, e in coda
    // le zone che lo contengono soltanto
    risultati = [...incidentiCima, ...zoneTrovate.filter(z => z.prefisso), ...luoghiTrovati, ...risultati, ...incidentiCoda, ...zoneTrovate.filter(z => !z.prefisso)];
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
      b.addEventListener('click', () => (r.vai ? r.vai() : vai(r)));
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
    if (!risultati.length) return;
    if (risultati[0].vai) risultati[0].vai(); else vai(risultati[0]);
  });
  // la lista si chiude cliccando fuori dalla barra
  document.addEventListener('click', e => { if (!form.contains(e.target)) lista.hidden = true; });
}

// Ricerca per foglio e particella: il dato è un PMTiles senza indice, quindi la particella
// si trova solo se la sua tile è già caricata (stessa limitazione dell'app catasto originale).
export function collegaRicercaParticella(map, campoFoglio, campoNumero, bottone, esito, pannello = null) {
  function mostra(testo) { esito.textContent = testo; esito.hidden = !testo; }
  function cerca() {
    if (pannello) pannello.hidden = false;
    const foglio = campoFoglio.value.trim();
    const numero = campoNumero.value.trim();
    if (!foglio || !numero) return mostra('Inserire sia il foglio che la particella');
    if (map.getZoom() < 12) return mostra('Avvicinati alla zona (zoom 12 o più) e riprova');
    const trovate = map.querySourceFeatures('catasto', {
      sourceLayer: 'particelle',
      filter: ['all', ['==', ['to-string', ['get', 'Foglio']], foglio], ['==', ['to-string', ['get', 'Paricella']], numero]],
    });
    if (!trovate.length) return mostra('Nessuna particella trovata: sposta la mappa sulla zona giusta e riprova');
    mostra('');
    const limiti = new maplibregl.LngLatBounds();
    const aggiungi = c => (typeof c[0] === 'number' ? limiti.extend(c) : c.forEach(aggiungi));
    trovate.forEach(f => aggiungi(f.geometry.coordinates));
    map.setFilter('catasto-evidenza', ['all', ['==', ['to-string', ['get', 'Foglio']], foglio], ['==', ['to-string', ['get', 'Paricella']], numero]]);
    const casella = document.getElementById('strato-catasto');
    if (casella && !casella.checked) { casella.checked = true; casella.dispatchEvent(new Event('change')); }
    map.fitBounds(limiti, { padding: 50, maxZoom: 18 });
    new maplibregl.Popup({ closeOnClick: true }).setLngLat(limiti.getCenter())
      .setHTML(`<div style="text-align:center"><b>Particella catastale</b><br>Foglio ${foglio} · Particella ${numero}</div>`).addTo(map);
  }
  bottone.addEventListener('click', cerca);
  return (foglio, numero) => { campoFoglio.value = foglio; campoNumero.value = numero; cerca(); };
  [campoFoglio, campoNumero].forEach(c => c.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); cerca(); } }));
}
