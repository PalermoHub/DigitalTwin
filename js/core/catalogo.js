import { urlDati } from './config.js';

const AVVISI = [
  'Catasto, zonizzazione PRG e vincoli sono solo informativi e non hanno valore legale: per usi legali servono il certificato di destinazione urbanistica e le visure ufficiali.',
  'Il PRG vigente è la Variante generale 2004: varianti puntuali successive potrebbero non essere incluse.',
  'I dati del censimento 2023 sono stime campionarie (censimento permanente): i valori per sezione non sono conteggi esatti.',
  'La popolazione per edificio è una stima.',
];

export async function caricaCatalogo() {
  const r = await fetch(urlDati('catalogo.json'));
  if (!r.ok) throw new Error('catalogo.json non disponibile');
  return r.json();
}

export function apriCrediti(dialog, catalogo) {
  const titolo = document.createElement('h2');
  titolo.textContent = 'Fonti e avvisi';
  const avvisi = document.createElement('ul');
  for (const a of AVVISI) {
    const li = document.createElement('li');
    li.textContent = a;
    avvisi.append(li);
  }
  const fonti = document.createElement('ul');
  for (const v of catalogo.filter(v => v.fonte)) {
    const li = document.createElement('li');
    li.textContent = `${v.fonte} (${v.data})` + (v.licenza ? ` — ${v.licenza}` : ' — licenza da verificare');
    fonti.append(li);
  }
  const base = document.createElement('li');
  base.textContent = 'Base cartografica: OpenFreeMap, © OpenMapTiles, dati © OpenStreetMap contributors';
  fonti.append(base);
  const chiudi = document.createElement('button');
  chiudi.type = 'button';
  chiudi.textContent = 'Chiudi';
  chiudi.addEventListener('click', () => dialog.close());
  dialog.replaceChildren(titolo, avvisi, fonti, chiudi);
  dialog.showModal();
}
