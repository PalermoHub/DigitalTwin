import { urlDati } from '../core/config.js';
import { leggiQuery, cercaVie, preparaIncidenti, cercaIncidenti } from '../core/ricerca-incidenti.js';

// Collega la ricerca degli incidenti alla mappa: `vie.json` (piccolo) si scarica alla prima ricerca, `incidenti.geojson`
// (qualche MB) solo quando si cerca con «incidente»/«sinistro». `filtro` è quello di sicurezza-filtro.js.
const PERCORSO = 'mobilita/sicurezza/';

function caricaUna(file, trasforma) {
  let promessa = null;
  return () => {
    promessa ??= fetch(urlDati(PERCORSO + file))
      .then(r => {
        if (!r.ok) throw new Error(`${file} non disponibile`);
        return r.json();
      })
      .then(trasforma)
      .catch(err => { promessa = null; throw err; }); // un errore non resta in cache: si riprova
    return promessa;
  };
}

// `suggerisci(testo)` → { inCima, inCoda }: con la parola «incidente» le righe vanno prima di tutto il resto,
// altrimenti le sole vie vanno dopo gli indirizzi. Le righe delle vie hanno `vai()`: filtrano gli incidenti e inquadrano la strada.
export function collegaRicercaIncidenti(map, filtro) {
  const vie = caricaUna('vie.json', x => x);
  const incidenti = caricaUna('incidenti.geojson', d => preparaIncidenti(d.features));

  const conAzione = r => ({
    ...r,
    vai: () => {
      filtro.imposta({ via: r.via });
      map.fitBounds([[r.bbox[0], r.bbox[1]], [r.bbox[2], r.bbox[3]]], { padding: 60, maxZoom: 17 });
    },
  });

  return {
    async suggerisci(testo) {
      const query = leggiQuery(testo);
      const parole = query ? query.token.join(' ') : testo;
      const righeVie = cercaVie(await vie(), parole).map(conAzione);
      if (!query) return { inCima: [], inCoda: righeVie };
      const singoli = cercaIncidenti(await incidenti(), query);
      return { inCima: [...righeVie, ...singoli], inCoda: [] };
    },
  };
}
