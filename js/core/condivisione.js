// «Condividi»: crea il link con la vista corrente e lo offre per copia, menu nativo e reti social.
// All'apertura di un link condiviso la vista viene riapplicata da app.js (vedi condivisione-stato.js).
import { codifica, decodifica, costruisciLink, PARAMETRO } from './condivisione-codec.js';
import { collegaMenuCondivisione } from './condivisione-menu.js';
import { installaOverlay } from './condivisione-storage.js';
import { raccogli, applica } from './condivisione-stato.js';

// Va chiamata prima di costruire i pannelli: se la pagina arriva da un link condiviso, installa l'overlay del
// localStorage con le preferenze del mittente. Senza `?v=` non cambia nulla.
export async function preparaCondivisione(finestra) {
  const grezzo = new URLSearchParams(finestra.location.search).get(PARAMETRO);
  if (!grezzo) return { stato: null, invalido: false };
  const stato = await decodifica(grezzo);
  if (!stato) return { stato: null, invalido: true };
  const iniziali = Object.fromEntries(Object.entries(stato.s ?? {}).map(([k, v]) => [k, JSON.stringify(v)]));
  installaOverlay(finestra, iniziali);
  return { stato, invalido: false };
}

export function collegaCondivisione(map, bottone, { storage }) {
  async function link() {
    const { stato, scartati } = raccogli(document, map, storage);
    const { testo, troncato } = await codifica(stato);
    return { link: costruisciLink(location.href, testo), troncato, scartati };
  }
  collegaMenuCondivisione(bottone, link);

  return { stato: () => raccogli(document, map, storage), applica: s => applica(s, document, map), link };
}
