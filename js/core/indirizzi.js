// Ricerca per via e civico su un indice {VIA: {civico: [lon, lat]}}. Logica pura.
// I civici possono avere la lettera ("4A": 21% dell'indice reale) e alcune vie finiscono con un numero.

export function normalizza(s) {
  return s
    .toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9' ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function preparaIndice(indice) {
  return Object.entries(indice).map(([via, civici]) => ({ via, norm: normalizza(via), civici }));
}

// Indice leggero {VIA: [lon, lat]}: ogni via col suo primo punto; i civici (`civici`) arrivano dopo, solo per le vie cercate con un numero.
export function preparaIndiceVie(vie) {
  return Object.entries(vie).map(([via, primo]) => ({ via, norm: normalizza(via), primo, civici: null }));
}

const primoPunto = v => (v.civici ? Object.values(v.civici)[0] : v.primo);

// vie che contengono tutte le parole, prima quelle che iniziano con il testo
function vieCorrispondenti(voci, testoVia) {
  const token = testoVia.split(' ').filter(Boolean);
  if (!token.length) return [];
  return voci
    .filter(v => token.every(t => v.norm.includes(t)))
    .sort((a, b) =>
      (b.norm.startsWith(testoVia) - a.norm.startsWith(testoVia)) || (a.norm.length - b.norm.length));
}

const punto = (via, chiave) => ({ etichetta: `${via.via} ${chiave}`, lon: via.civici[chiave][0], lat: via.civici[chiave][1] });

function soloVia(voci, testoVia, max) {
  return vieCorrispondenti(voci, testoVia).slice(0, max).map(v => {
    const [lon, lat] = primoPunto(v);
    return { etichetta: v.via, lon, lat };
  });
}

function conCivico(voci, testoVia, numero, lettera, max) {
  const chiave = `${numero}${lettera}`;
  const risultati = [];
  for (const v of vieCorrispondenti(voci, testoVia)) {
    if (v.civici[chiave]) {
      risultati.push(punto(v, chiave));
      continue;
    }
    if (!lettera) {
      // «4» quando esistono solo 4A, 4B…: le propone
      const varianti = Object.keys(v.civici).filter(k => /^\d+/.exec(k)[0] === numero);
      if (varianti.length) {
        risultati.push(...varianti.map(k => punto(v, k)));
        continue;
      }
    }
    const [lon, lat] = primoPunto(v);
    risultati.push({ etichetta: v.via, lon, lat, nota: `civico ${chiave} non trovato` });
  }
  return risultati.slice(0, max);
}

// Le vie di cui `cerca` ha bisogno dei civici: quelle del testo «via + numero». Vuoto se basta il solo nome della via.
export function vieConCivico(voci, testo) {
  const norm = normalizza(testo);
  if (!norm || /^\d+$/.test(norm)) return [];
  const m = norm.match(/^(.*?)\s+(\d+)\s?([A-Z])?$/);
  return m && m[1] ? vieCorrispondenti(voci, m[1]) : [];
}

export function cerca(voci, testo, max = 8) {
  const norm = normalizza(testo);
  if (!norm || /^\d+$/.test(norm)) return [];
  // civico in coda: «4», «4A», «4/A» (normalizzato in «4 A»); il resto è il nome della via
  const m = norm.match(/^(.*?)\s+(\d+)\s?([A-Z])?$/);
  if (m && m[1]) {
    const risultati = conCivico(voci, m[1], m[2], m[3] ?? '', max);
    if (risultati.length) return risultati;
  }
  // altrimenti il testo intero può essere il nome di una via che finisce con un numero («LARGO V 21»)
  return soloVia(voci, norm, max);
}
