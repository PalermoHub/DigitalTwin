import { puntoDaPiano } from './strati-3d-modello.js';

// Terreno della vista «Strati in 3D»: il DTM dell'app (tile Terrarium della sorgente terrain-dem) letto sull'inquadratura
// catturata e tagliato a gradoni. Ogni gradone è la stessa immagine (rilievo ombreggiato e/o elevazione colorata)
// ritagliata dove il terreno supera quella quota: impilati, danno il plastico con i colori drappeggiati sopra.

// gradoni in metri: fitti in pianura, larghi sul monte (Monte Pellegrino arriva a 600 m)
export const QUOTE = [0, 10, 25, 45, 70, 100, 140, 190, 250, 320, 400, 490];
const MAX_TILE = 48;
const CIRCONFERENZA = 40075016.686;

// quota dal colore Terrarium
export const quotaTerrarium = (r, g, b) => r * 256 + g + b / 256 - 32768;

// zoom dei tile (256 px) per coprire la vista con al più MAX_TILE tile
export function zoomTile(mx0, my0, mx1, my1, zoomMappa, max = 15) {
  for (let z = Math.min(max, Math.floor(zoomMappa + 1)); z > 0; z--) {
    const n = 2 ** z;
    const conta = (Math.floor(mx1 * n) - Math.floor(mx0 * n) + 1) * (Math.floor(my1 * n) - Math.floor(my0 * n) + 1);
    if (conta <= MAX_TILE) return z;
  }
  return 0;
}

async function leggiTile(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(String(r.status));
  const bmp = await createImageBitmap(await r.blob());
  const c = document.createElement('canvas');
  c.width = bmp.width;
  c.height = bmp.height;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bmp, 0, 0);
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  const h = new Float32Array(c.width * c.height);
  for (let i = 0; i < h.length; i++) h[i] = quotaTerrarium(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
  return { h, lato: c.width };
}

// Gradoni per l'immagine `tessitura` (canvas della cattura), con gli angoli Mercator della vista [no, ne, se, so].
// Restituisce null se il DTM non c'è o non si legge: lo strato resta un piano piatto.
export async function gradoni(map, angoli, tessitura, { maxFette = QUOTE.length } = {}) {
  const url = map.getSource('terrain-dem')?.tiles?.[0];
  if (!url) return null;
  const xs = angoli.map(a => a[0]), ys = angoli.map(a => a[1]);
  const [mx0, mx1, my0, my1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const z = zoomTile(mx0, my0, mx1, my1, map.getZoom());
  const n = 2 ** z;
  const tile = new Map();
  const richieste = [];
  for (let tx = Math.floor(mx0 * n); tx <= Math.floor(mx1 * n); tx++) {
    for (let ty = Math.floor(my0 * n); ty <= Math.floor(my1 * n); ty++) {
      const u = url.replace('{z}', z).replace('{x}', tx).replace('{y}', ty);
      richieste.push(leggiTile(u).then(t => tile.set(`${tx}/${ty}`, t), () => {})); // tile mancante: mare
    }
  }
  await Promise.all(richieste);
  if (!tile.size) return null;

  // griglia delle quote a metà risoluzione della cattura (basta per il plastico, e pesa un quarto)
  const gw = Math.max(1, Math.round(tessitura.width / 2)), gh = Math.max(1, Math.round(tessitura.height / 2));
  const q = new Float32Array(gw * gh);
  let massima = 0;
  for (let j = 0; j < gh; j++) {
    for (let i = 0; i < gw; i++) {
      const [x, y] = puntoDaPiano(angoli, (i + 0.5) / gw, (j + 0.5) / gh);
      const px = x * n, py = y * n;
      const t = tile.get(`${Math.floor(px)}/${Math.floor(py)}`);
      let h = 0;
      if (t) h = t.h[Math.min(t.lato - 1, Math.floor((py % 1) * t.lato)) * t.lato + Math.min(t.lato - 1, Math.floor((px % 1) * t.lato))];
      q[j * gw + i] = h;
      if (h > massima) massima = h;
    }
  }
  const soglie = QUOTE.filter(s => s <= massima).slice(0, maxFette);
  const fette = soglie.map((soglia, k) => {
    const maschera = document.createElement('canvas');
    maschera.width = gw;
    maschera.height = gh;
    const mctx = maschera.getContext('2d');
    const img = mctx.createImageData(gw, gh);
    for (let p = 0; p < q.length; p++) img.data[p * 4 + 3] = q[p] > 0.5 && q[p] >= soglia ? 255 : 0;
    mctx.putImageData(img, 0, 0);
    const c = document.createElement('canvas');
    c.width = gw;
    c.height = gh;
    const ctx = c.getContext('2d');
    ctx.drawImage(tessitura, 0, 0, gw, gh);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(maschera, 0, 0);
    // i gradoni bassi un po' più scuri: si leggono le pareti tra una quota e l'altra
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = `rgba(0,0,0,${0.28 * (1 - k / Math.max(1, soglie.length - 1))})`;
    ctx.fillRect(0, 0, gw, gh);
    return { canvas: c, quota: soglia };
  });
  // metri per pixel della cattura: dalla larghezza Mercator della vista alla latitudine del centro
  const [, ly] = puntoDaPiano(angoli, 0.5, 0.5);
  const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * ly))) * 180 / Math.PI;
  const larghezza = Math.hypot(angoli[1][0] - angoli[0][0], angoli[1][1] - angoli[0][1]);
  const metriPx = larghezza * CIRCONFERENZA * Math.cos(lat * Math.PI / 180) / tessitura.width;
  return { fette, massima, metriPx };
}
