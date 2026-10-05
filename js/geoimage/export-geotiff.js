// js/geoimage/export-geotiff.js
// GeoTIFF: ricampiona l'immagine su una griglia nord-su nel sistema di riferimento scelto e la scrive con un writer minimo,
// con compressione LZW o senza. Portato da Geoimage (che offriva l'LZW ma in pratica non comprimeva: qui sì).
import { applica, inversa } from './trasformazioni.js';

export const SR = {
  4326: '+proj=longlat +datum=WGS84 +no_defs',
  32632: '+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs',
  32633: '+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs',
  3857: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +no_defs',
};

export function definisciSr(proj4) {
  for (const [epsg, def] of Object.entries(SR)) proj4.defs(`EPSG:${epsg}`, def);
}

export function campionaVicino(d, W, H, px, py) {
  const x = Math.round(px), y = Math.round(py);
  if (x < 0 || y < 0 || x >= W || y >= H) return null;
  const i = (y * W + x) * 4;
  return [d[i], d[i + 1], d[i + 2]];
}

export function campionaBilineare(d, W, H, px, py) {
  if (px < -0.5 || py < -0.5 || px > W - 0.5 || py > H - 0.5) return null;
  const x0 = Math.max(0, Math.min(W - 1, Math.floor(px))), y0 = Math.max(0, Math.min(H - 1, Math.floor(py)));
  const x1 = Math.min(x0 + 1, W - 1), y1 = Math.min(y0 + 1, H - 1);
  const fx = Math.max(0, Math.min(1, px - x0)), fy = Math.max(0, Math.min(1, py - y0));
  const i00 = (y0 * W + x0) * 4, i10 = (y0 * W + x1) * 4, i01 = (y1 * W + x0) * 4, i11 = (y1 * W + x1) * 4;
  return [0, 1, 2].map(c => d[i00 + c] * (1 - fx) * (1 - fy) + d[i10 + c] * fx * (1 - fy) + d[i01 + c] * (1 - fx) * fy + d[i11 + c] * fx * fy);
}

// Ricampiona sulla griglia nord-su di `epsg`. `t` lavora sui pixel dell'immagine originale; `sc` è il fattore con cui
// l'immagine di partenza (imgData, srcW×srcH) è stata ridotta. `progresso(percentuale)` è facoltativo.
export async function riproietta({ proj4, t, imgData, srcW, srcH, sc, epsg, maxRes, campiona, progresso }) {
  const DA = 'EPSG:4326', A = `EPSG:${epsg}`;
  const proietta = (px, py) => { const g = applica(t, px / sc, py / sc); return proj4(DA, A, [g.lng, g.lat]); };
  const angoli = [[0, 0], [srcW, 0], [0, srcH], [srcW, srcH]].map(([px, py]) => proietta(px, py));
  const minX = Math.min(...angoli.map(c => c[0])), maxX = Math.max(...angoli.map(c => c[0]));
  const minY = Math.min(...angoli.map(c => c[1])), maxY = Math.max(...angoli.map(c => c[1]));

  // dimensione del pixel d'uscita: conserva la risoluzione della sorgente
  const p00 = proietta(0, 0), p10 = proietta(srcW, 0), p01 = proietta(0, srcH);
  const pixSize = Math.min(Math.hypot(p10[0] - p00[0], p10[1] - p00[1]) / srcW, Math.hypot(p01[0] - p00[0], p01[1] - p00[1]) / srcH);
  let W = Math.max(1, Math.round((maxX - minX) / pixSize)), H = Math.max(1, Math.round((maxY - minY) / pixSize));
  if (W > maxRes || H > maxRes) {
    const f = maxRes / Math.max(W, H);
    W = Math.round(W * f); H = Math.round(H * f);
  }
  const pixSizeX = (maxX - minX) / W, pixSizeY = (maxY - minY) / H;
  const rgb = new Uint8Array(W * H * 3);

  // riga per riga: si proiettano il bordo sinistro e destro e si interpola in mezzo
  for (let iy = 0; iy < H; iy++) {
    const y = maxY - (iy + 0.5) * pixSizeY;
    const wL = proj4(A, DA, [minX + 0.5 * pixSizeX, y]), wR = proj4(A, DA, [minX + (W - 0.5) * pixSizeX, y]);
    const sL = inversa(t, wL[0], wL[1]), sR = inversa(t, wR[0], wR[1]);
    if (!sL || !sR) continue;
    for (let ix = 0; ix < W; ix++) {
      const a = W > 1 ? ix / (W - 1) : 0;
      const v = campiona(imgData, srcW, srcH, (sL.px + a * (sR.px - sL.px)) * sc, (sL.py + a * (sR.py - sL.py)) * sc);
      if (!v) continue;
      const o = (iy * W + ix) * 3;
      rgb[o] = Math.round(v[0]); rgb[o + 1] = Math.round(v[1]); rgb[o + 2] = Math.round(v[2]);
    }
    if (iy % 25 === 0) {
      progresso?.(Math.round(iy / H * 100));
      await new Promise(r => setTimeout(r, 0)); // lascia respirare l'interfaccia
    }
  }
  return { W, H, rgb, originX: minX, originY: maxY, pixSizeX, pixSizeY };
}

// Compressione LZW dei TIFF (Compression = 5): codici da 9 a 12 bit, bit più significativo per primo, «early change».
// Stessa regola del codificatore di libtiff: la larghezza sale quando il prossimo codice libero supera 2^n - 1.
export function lzwComprimi(dati) {
  let out = new Uint8Array(Math.max(1024, dati.length >> 1));
  let n = 0, buffer = 0, nBit = 0;
  const scrivi = (codice, larghezza) => {
    buffer = (buffer << larghezza) | codice;
    nBit += larghezza;
    while (nBit >= 8) {
      if (n === out.length) { const piu = new Uint8Array(out.length * 2); piu.set(out); out = piu; }
      out[n++] = (buffer >>> (nBit - 8)) & 0xFF;
      nBit -= 8;
    }
    buffer &= (1 << nBit) - 1;
  };
  let tabella = new Map(), libero = 258, larghezza = 9;
  scrivi(256, larghezza); // Clear
  if (dati.length) {
    let prefisso = dati[0];
    for (let i = 1; i < dati.length; i++) {
      const c = dati[i], chiave = prefisso * 256 + c;
      const trovato = tabella.get(chiave);
      if (trovato !== undefined) { prefisso = trovato; continue; }
      scrivi(prefisso, larghezza);
      tabella.set(chiave, libero++);
      if (libero === 4094) { scrivi(256, larghezza); tabella = new Map(); libero = 258; larghezza = 9; } // tabella piena: si riparte
      else if (libero > (1 << larghezza) - 1) larghezza++;
      prefisso = c;
    }
    scrivi(prefisso, larghezza);
  }
  scrivi(257, larghezza); // EOI
  if (nBit) {
    if (n === out.length) { const piu = new Uint8Array(out.length + 1); piu.set(out); out = piu; }
    out[n++] = (buffer << (8 - nBit)) & 0xFF;
  }
  return out.slice(0, n);
}

// Writer minimo nord-su. `compressione`: 1 = nessuna, 5 = LZW.
export function scriviTiffNordSu(W, H, rgb, originX, originY, pixSizeX, pixSizeY, epsg, compressione = 1) {
  const strip = compressione === 5 ? lzwComprimi(rgb) : rgb;
  const geografico = epsg === 4326;
  const nChiavi = geografico ? 4 : 3;
  const N = 13, HDR = 8, IFD = 2 + N * 12 + 4;
  let off = HDR + IFD;
  const bpsOff = off; off += 6;
  const scOff = off; off += 24;
  const tpOff = off; off += 48;
  const gkOff = off; off += (nChiavi + 1) * 4 * 2;
  const pxOff = off; off += strip.length;
  const buf = new ArrayBuffer(off), dv = new DataView(buf), by = new Uint8Array(buf);
  dv.setUint8(0, 0x49); dv.setUint8(1, 0x49); dv.setUint16(2, 42, true); dv.setUint32(4, HDR, true);
  let p = HDR;
  dv.setUint16(p, N, true); p += 2;
  const voce = (tag, tipo, n, val) => { dv.setUint16(p, tag, true); p += 2; dv.setUint16(p, tipo, true); p += 2; dv.setUint32(p, n, true); p += 4; dv.setUint32(p, val, true); p += 4; };
  voce(256, 3, 1, W); voce(257, 3, 1, H); voce(258, 3, 3, bpsOff);
  voce(259, 3, 1, compressione); voce(262, 3, 1, 2); voce(273, 4, 1, pxOff);
  voce(277, 3, 1, 3); voce(278, 4, 1, H); voce(279, 4, 1, strip.length);
  voce(284, 3, 1, 1);
  voce(33550, 12, 3, scOff); voce(33922, 12, 6, tpOff); voce(34735, 3, (nChiavi + 1) * 4, gkOff);
  dv.setUint32(p, 0, true);
  [8, 8, 8].forEach((v, i) => dv.setUint16(bpsOff + i * 2, v, true));
  [pixSizeX, pixSizeY, 0].forEach((v, i) => dv.setFloat64(scOff + i * 8, v, true));
  [0, 0, 0, originX, originY, 0].forEach((v, i) => dv.setFloat64(tpOff + i * 8, v, true));
  const chiavi = geografico
    ? [1, 1, 0, 4, 1024, 0, 1, 2, 1025, 0, 1, 1, 2048, 0, 1, 4326, 2054, 0, 1, 9102]
    : [1, 1, 0, 3, 1024, 0, 1, 1, 1025, 0, 1, 1, 3072, 0, 1, epsg];
  chiavi.forEach((v, i) => dv.setUint16(gkOff + i * 2, v, true));
  by.set(strip, pxOff);
  return buf;
}

// Writer minimo affine in WGS84: ModelTransformationTag gestisce anche la rotazione. `compressione`: 1 = nessuna, 5 = LZW.
export function scriviTiffAffine(W, H, rgb, t, compressione = 1) {
  const strip = compressione === 5 ? lzwComprimi(rgb) : rgb;
  const N = 12, HDR = 8, IFD = 2 + N * 12 + 4;
  let off = HDR + IFD;
  const bpsOff = off; off += 6;
  const trOff = off; off += 128;
  const gkOff = off; off += 40;
  const pxOff = off; off += strip.length;
  const buf = new ArrayBuffer(off), dv = new DataView(buf), by = new Uint8Array(buf);
  dv.setUint8(0, 0x49); dv.setUint8(1, 0x49); dv.setUint16(2, 42, true); dv.setUint32(4, HDR, true);
  let p = HDR;
  dv.setUint16(p, N, true); p += 2;
  const voce = (tag, tipo, n, val) => { dv.setUint16(p, tag, true); p += 2; dv.setUint16(p, tipo, true); p += 2; dv.setUint32(p, n, true); p += 4; dv.setUint32(p, val, true); p += 4; };
  voce(256, 3, 1, W); voce(257, 3, 1, H); voce(258, 3, 3, bpsOff);
  voce(259, 3, 1, compressione); voce(262, 3, 1, 2); voce(273, 4, 1, pxOff);
  voce(277, 3, 1, 3); voce(278, 4, 1, H); voce(279, 4, 1, strip.length);
  voce(284, 3, 1, 1); voce(34264, 12, 16, trOff); voce(34735, 3, 20, gkOff);
  dv.setUint32(p, 0, true);
  [8, 8, 8].forEach((v, i) => dv.setUint16(bpsOff + i * 2, v, true));
  [t.a, t.b, 0, t.c, t.d, t.e, 0, t.f, 0, 0, 1, 0, 0, 0, 0, 1].forEach((v, i) => dv.setFloat64(trOff + i * 8, v, true));
  [1, 1, 0, 4, 1024, 0, 1, 2, 1025, 0, 1, 1, 2048, 0, 1, 4326, 2054, 0, 1, 9102].forEach((v, i) => dv.setUint16(gkOff + i * 2, v, true));
  by.set(strip, pxOff);
  return buf;
}

// `georef` è { type: 'affine', t } oppure { type: 'northup', epsg, originX, originY, pixSizeX, pixSizeY }
export const scriviGeoTiff = (W, H, rgb, georef, compressione) => (georef.type === 'affine'
  ? scriviTiffAffine(W, H, rgb, georef.t, compressione)
  : scriviTiffNordSu(W, H, rgb, georef.originX, georef.originY, georef.pixSizeX, georef.pixSizeY, georef.epsg, compressione));

// Tutta la pipeline: `imgData` sono i pixel RGBA dell'immagine ridotta a srcW×srcH (fattore sc).
// Con EPSG:4326 e affine si incorpora la trasformazione senza ricampionare; altrimenti si riproietta.
export async function creaGeoTiff({ proj4, t, imgData, srcW, srcH, sc, epsg, maxRes, campiona, compressione, progresso }) {
  let W, H, rgb, georef;
  if (epsg === 4326 && t.order !== 2) {
    W = srcW; H = srcH;
    rgb = new Uint8Array(W * H * 3);
    for (let i = 0; i < W * H; i++) { rgb[i * 3] = imgData[i * 4]; rgb[i * 3 + 1] = imgData[i * 4 + 1]; rgb[i * 3 + 2] = imgData[i * 4 + 2]; }
    georef = { type: 'affine', t: { a: t.a / sc, b: t.b / sc, c: t.c, d: t.d / sc, e: t.e / sc, f: t.f } };
  } else {
    const r = await riproietta({ proj4, t, imgData, srcW, srcH, sc, epsg, maxRes, campiona, progresso });
    ({ W, H, rgb } = r);
    georef = { type: 'northup', epsg, originX: r.originX, originY: r.originY, pixSizeX: r.pixSizeX, pixSizeY: r.pixSizeY };
  }
  return { W, H, buffer: scriviGeoTiff(W, H, rgb, georef, compressione) };
}
