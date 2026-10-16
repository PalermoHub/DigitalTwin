// Forme dei punti oltre al cerchio: quadrato, triangolo (anche capovolto), rombo, pentagono, esagono, ottagono, stella, croce.
// In MapLibre un layer `circle` disegna solo cerchi; per le altre forme si usa un layer `symbol` con icone SDF
// (distanza dal bordo nel canale alfa): il colore, l'alone e il contorno restano stili del layer (`icon-color`,
// `icon-halo-color`, `icon-halo-width`), quindi le espressioni di colore dei layer si riusano così come sono.
// Le icone si calcolano dalla geometria (nessun canvas): lo stesso elenco di vertici disegna anche il simbolo di legenda.

export const FORME = ['cerchio', 'quadrato', 'triangolo', 'triangolo-giu', 'rombo', 'pentagono', 'esagono', 'ottagono', 'stella', 'croce'];
export const idForma = nome => `forma-${nome}`;

const PR = 2; // pixelRatio delle icone: l'immagine misura il doppio dei punti a schermo
const RAGGIO = 10; // raggio della forma nell'immagine (px)
const MARGINE = 6; // spazio attorno alla forma, riempito dalla sfumatura SDF (da qui la larghezza massima dell'alone)

const poligonoRegolare = (n, rotazione) =>
  Array.from({ length: n }, (_, i) => { const a = rotazione + (2 * Math.PI * i) / n; return [Math.cos(a), Math.sin(a)]; });
const croce = () => [[-0.35, -1], [0.35, -1], [0.35, -0.35], [1, -0.35], [1, 0.35], [0.35, 0.35], [0.35, 1], [-0.35, 1], [-0.35, 0.35], [-1, 0.35], [-1, -0.35], [-0.35, -0.35]];
const stella = () =>
  Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (Math.PI * i) / 5; const r = i % 2 ? 0.45 : 1; return [r * Math.cos(a), r * Math.sin(a)]; });

// Vertici su un cerchio di raggio 1 centrato nell'origine (y verso il basso); null = cerchio.
export function vertici(nome) {
  switch (nome) {
    case 'quadrato': return poligonoRegolare(4, Math.PI / 4).map(([x, y]) => [x * 0.9, y * 0.9]); // lato ≈ 1,27: area simile al cerchio
    case 'triangolo': return poligonoRegolare(3, -Math.PI / 2);
    case 'triangolo-giu': return poligonoRegolare(3, Math.PI / 2);
    case 'rombo': return poligonoRegolare(4, 0);
    case 'pentagono': return poligonoRegolare(5, -Math.PI / 2);
    case 'esagono': return poligonoRegolare(6, 0);
    case 'ottagono': return poligonoRegolare(8, Math.PI / 8);
    case 'stella': return stella();
    case 'croce': return croce();
    default: return null;
  }
}

// Distanza con segno dal bordo (positiva fuori, negativa dentro) dal punto (x, y) a una forma di raggio r centrata nell'origine.
export function distanzaForma(nome, x, y, r) {
  const v = vertici(nome);
  if (!v) return Math.hypot(x, y) - r;
  const p = v.map(([vx, vy]) => [vx * r, vy * r]);
  let minimo = Infinity;
  let dentro = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [ax, ay] = p[j];
    const [bx, by] = p[i];
    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
    minimo = Math.min(minimo, Math.hypot(x - (ax + t * dx), y - (ay + t * dy)));
    if ((ay > y) !== (by > y) && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) dentro = !dentro;
  }
  return dentro ? -minimo : minimo;
}

// Immagine SDF {width, height, data} (RGBA) per `map.addImage(..., { sdf: true })`: alfa 191 sul bordo, più alto dentro, più basso fuori.
export function immagineForma(nome, raggio = RAGGIO, margine = MARGINE) {
  const lato = 2 * (raggio + margine);
  const data = new Uint8ClampedArray(lato * lato * 4);
  for (let py = 0; py < lato; py++) {
    for (let px = 0; px < lato; px++) {
      const d = distanzaForma(nome, px + 0.5 - lato / 2, py + 0.5 - lato / 2, raggio);
      const k = (py * lato + px) * 4;
      data[k] = data[k + 1] = data[k + 2] = 255;
      data[k + 3] = Math.round(255 * Math.max(0, Math.min(1, 0.75 - d / margine)));
    }
  }
  return { width: lato, height: lato, data };
}

// Registra le forme sulla mappa (da fare prima di aggiungere i layer che le usano); quelle già presenti restano.
export function registraForme(map, nomi = FORME) {
  for (const nome of nomi) {
    if (!map.hasImage(idForma(nome))) map.addImage(idForma(nome), immagineForma(nome), { sdf: true, pixelRatio: PR });
  }
}

// Dimensione sullo schermo in punti: il layer `symbol` la scala con `icon-size` (1 = forma di 2 × RAGGIO / PR punti).
// Stessa curva dei vecchi cerchi (raggio 4 a zoom 11, 7 a zoom 17) per chi vuole sostituire un `circle` senza cambiare l'aspetto.
export const DIMENSIONE_ICONA = ['interpolate', ['linear'], ['zoom'], 11, 0.8, 17, 1.4];

// Il layer `symbol` che sostituisce un `circle`: `forma` = nome di forma o espressione MapLibre che dà `forma-<nome>`.
export function layerForme({ id, source, forma, colore, layout = {}, paint = {}, dimensione = DIMENSIONE_ICONA }) {
  return {
    id, type: 'symbol', source, metadata: { forme: true }, // il tema dei colori riconosce così i punti a forma
    layout: {
      'icon-image': typeof forma === 'string' ? idForma(forma) : forma,
      'icon-size': dimensione,
      'icon-allow-overlap': true, 'icon-ignore-placement': true, // i punti vicini non si nascondono a vicenda come le etichette
      ...layout,
    },
    paint: { 'icon-color': colore, 'icon-halo-color': '#fff', 'icon-halo-width': 1, ...paint },
  };
}

// Stile di un simbolo di legenda o di tooltip nella forma data: un <i class="monumenti-pallino"> col colore di sfondo ritagliato
// con clip-path. Resta un normale elemento colorato, quindi il pannello dei colori, il clone e il grigio delle voci spente funzionano come per i pallini.
export function stileForma(nome, colore) {
  const v = vertici(nome);
  if (!v) return { background: colore };
  const pc = ([x, y]) => `${((x + 1.1) / 2.2 * 100).toFixed(1)}% ${((y + 1.1) / 2.2 * 100).toFixed(1)}%`;
  return { background: colore, borderRadius: '0', width: '12px', height: '12px', clipPath: `polygon(${v.map(pc).join(',')})` };
}

export function simboloForma(nome, colore) {
  const i = document.createElement('i');
  i.className = 'monumenti-pallino';
  Object.assign(i.style, stileForma(nome, colore));
  return i;
}
