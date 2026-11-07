// Sagoma della particella con i suoi edifici, per la mini-anteprima SVG della scheda (idea di «Palermo ordinata»).
// Modulo puro: da anelli in metri (piano locale, y verso nord) a tracciati SVG in un viewBox con y verso il basso.
const MARGINE = 0.06; // quota del lato maggiore lasciata libera attorno al disegno
const L_MAX = 100;    // lato maggiore del viewBox

const bbox = anelli => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const a of anelli) for (const [x, y] of a) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return [x0, y0, x1, y1];
};

/* sagoma: { particella: [poligono[anello[[x,y]]]], edifici: [{ poligoni, cavallo, altezza, area }] }
   Ritorna { larghezza, altezza, particella: d, edifici: [{ d, cavallo, altezza, area }] } oppure null.
   La scala è unica (1 unità = 1/scala metri): le proporzioni reali si conservano. Il riquadro include anche gli edifici a cavallo. */
export function sagomaSvg(sagoma) {
  if (!sagoma?.particella?.length) return null;
  const tutti = [...sagoma.particella.flat(), ...sagoma.edifici.flatMap(e => e.poligoni.flat())];
  const [x0, y0, x1, y1] = bbox(tutti);
  const w = x1 - x0, h = y1 - y0;
  if (!(w > 0 && h > 0)) return null;
  const scala = L_MAX * (1 - 2 * MARGINE) / Math.max(w, h);
  const m = L_MAX * MARGINE;
  const px = x => +(m + (x - x0) * scala).toFixed(2), py = y => +(m + (y1 - y) * scala).toFixed(2); // y rovesciata: nord in alto
  const tracciato = poligoni => poligoni.flat().map(a => `M${a.map(([x, y]) => `${px(x)} ${py(y)}`).join('L')}Z`).join('');
  return {
    larghezza: +(w * scala + 2 * m).toFixed(2), altezza: +(h * scala + 2 * m).toFixed(2),
    particella: tracciato(sagoma.particella),
    edifici: sagoma.edifici.map(e => ({ d: tracciato(e.poligoni), cavallo: e.cavallo, altezza: e.altezza, area: e.area })),
  };
}
