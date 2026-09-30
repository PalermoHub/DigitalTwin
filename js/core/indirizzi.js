// Ricerca per via e civico su un indice {VIA: {civico: [lon, lat]}}. Logica pura.

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

export function cerca(voci, testo, max = 8) {
  const m = normalizza(testo).match(/^(.*?)(?:\s+(\d+))?$/);
  const viaTesto = m[1];
  const civico = m[2];
  const token = viaTesto.split(' ').filter(Boolean);
  if (!token.length) return [];
  return voci
    .filter(v => token.every(t => v.norm.includes(t)))
    .sort((a, b) =>
      (b.norm.startsWith(viaTesto) - a.norm.startsWith(viaTesto)) || (a.norm.length - b.norm.length))
    .slice(0, max)
    .map(v => {
      if (civico && v.civici[civico]) {
        const [lon, lat] = v.civici[civico];
        return { etichetta: `${v.via} ${civico}`, lon, lat };
      }
      const [lon, lat] = Object.values(v.civici)[0];
      return { etichetta: v.via, lon, lat };
    });
}
