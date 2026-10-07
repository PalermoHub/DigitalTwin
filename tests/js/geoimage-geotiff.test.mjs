import test from 'node:test';
import assert from 'node:assert/strict';
import { campionaVicino, campionaBilineare, riproietta, lzwComprimi, scriviTiffNordSu, scriviTiffAffine, scriviGeoTiff, creaGeoTiff, definisciSr } from '../../js/geoimage/export-geotiff.js';

// immagine 4×2: pixel (x, y) = [x*10, y*100, 5, 255]
const rgba = (W, H) => { const d = new Uint8ClampedArray(W * H * 4); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) d.set([x * 10, y * 100, 5, 255], (y * W + x) * 4); return d; };
// proj4 finto: identità (entrambi i sistemi sono «gradi» nel test)
const proj4 = Object.assign((da, a, [x, y]) => [x, y], { defs: () => {} });

test('campionaVicino legge il pixel più vicino e dà null fuori dall\'immagine', () => {
  const d = rgba(4, 2);
  assert.deepEqual(campionaVicino(d, 4, 2, 2.2, 0.9), [20, 100, 5]);
  assert.equal(campionaVicino(d, 4, 2, 4, 0), null);
  assert.equal(campionaVicino(d, 4, 2, -1, 0), null);
});

test('campionaBilineare interpola tra i pixel e dà null fuori', () => {
  const d = rgba(4, 2);
  assert.deepEqual(campionaBilineare(d, 4, 2, 0.5, 0).map(Math.round), [5, 0, 5]);
  assert.equal(campionaBilineare(d, 4, 2, 9, 0), null);
});

test('definisciSr registra i 4 sistemi di riferimento', () => {
  const visti = [];
  definisciSr({ defs: (nome) => visti.push(nome) });
  assert.deepEqual(visti, ['EPSG:3857', 'EPSG:4326', 'EPSG:32632', 'EPSG:32633']);
});

test('riproietta con identità: l\'immagine esce intera e orientata nord-su', async () => {
  const W = 8, H = 4;
  const t = { a: 0.001, b: 0, c: 13, d: 0, e: -0.001, f: 38 }; // x → est, y → sud
  const r = await riproietta({ proj4, t, imgData: rgba(W, H), srcW: W, srcH: H, sc: 1, epsg: 3857, maxRes: 100, campiona: campionaVicino });
  assert.equal(r.W, 8); assert.equal(r.H, 4);
  assert.ok(Math.abs(r.originX - 13) < 1e-9 && Math.abs(r.originY - 38) < 1e-9);
  const px = (x, y) => [...r.rgb.slice((y * r.W + x) * 3, (y * r.W + x) * 3 + 3)];
  assert.ok(px(7, 0)[0] > px(0, 0)[0], 'il rosso cresce verso est (x dell\'immagine)');
  assert.ok(px(0, 3)[1] > px(0, 0)[1], 'il verde cresce verso sud (y dell\'immagine): nord in alto');
});

test('riproietta rispetta la risoluzione massima', async () => {
  const t = { a: 0.001, b: 0, c: 13, d: 0, e: -0.001, f: 38 };
  const r = await riproietta({ proj4, t, imgData: rgba(8, 4), srcW: 8, srcH: 4, sc: 1, epsg: 3857, maxRes: 4, campiona: campionaVicino });
  assert.equal(Math.max(r.W, r.H), 4);
});

test('writer nord-su: intestazione TIFF little-endian, dimensioni e dati dei pixel', () => {
  const rgb = new Uint8Array([1, 2, 3, 4, 5, 6]); // 2×1
  const buf = scriviTiffNordSu(2, 1, rgb, 13, 38, 0.001, 0.001, 4326);
  const dv = new DataView(buf);
  assert.equal(dv.getUint16(0, true), 0x4949);
  assert.equal(dv.getUint16(2, true), 42);
  assert.equal(dv.getUint16(8, true), 13, '13 voci nell\'IFD');
  assert.deepEqual([...new Uint8Array(buf).slice(-6)], [1, 2, 3, 4, 5, 6]);
});

test('writer affine: tag ModelTransformation con la trasformazione e dati in coda', () => {
  const rgb = new Uint8Array([9, 8, 7]);
  const buf = scriviTiffAffine(1, 1, rgb, { a: 0.5, b: 0, c: 13, d: 0, e: -0.5, f: 38 });
  const dv = new DataView(buf);
  assert.equal(dv.getUint16(8, true), 12);
  assert.deepEqual([...new Uint8Array(buf).slice(-3)], [9, 8, 7]);
  const off = 8 + 2 + 12 * 12 + 4 + 6; // dopo IFD e BitsPerSample
  assert.equal(dv.getFloat64(off, true), 0.5);
  assert.equal(dv.getFloat64(off + 3 * 8, true), 13);
});

// decodificatore LZW dei TIFF scritto dalla specifica (TIFF 6.0, sezione 13): serve a verificare il compressore
function lzwDecomprimi(dati) {
  const out = [];
  let tabella = [], larghezza = 9, buffer = 0, nBit = 0, i = 0, precedente = null;
  const reset = () => { tabella = Array.from({ length: 256 }, (_, k) => [k]); tabella.push(null, null); larghezza = 9; precedente = null; };
  reset();
  for (;;) {
    while (nBit < larghezza && i < dati.length) { buffer = (buffer << 8) | dati[i++]; nBit += 8; }
    if (nBit < larghezza) break;
    const codice = (buffer >>> (nBit - larghezza)) & ((1 << larghezza) - 1);
    nBit -= larghezza; buffer &= (1 << nBit) - 1;
    if (codice === 257) break;
    if (codice === 256) { reset(); continue; }
    let voce;
    if (codice < tabella.length) voce = tabella[codice];
    else voce = [...precedente, precedente[0]];
    out.push(...voce);
    if (precedente) tabella.push([...precedente, voce[0]]);
    precedente = voce;
    // «early change»: la larghezza sale un codice prima del naturale
    if (larghezza < 12 && tabella.length >= (1 << larghezza) - 1) larghezza++;
  }
  return Uint8Array.from(out);
}

test('LZW: i dati ripetitivi si comprimono e tornano identici (anche oltre la tabella da 4096 codici)', () => {
  const ripetitivo = new Uint8Array(5000).map((_, k) => (k >> 4) & 7);
  const c = lzwComprimi(ripetitivo);
  assert.ok(c.length < ripetitivo.length / 2, `${c.length} byte per ${ripetitivo.length}`);
  assert.deepEqual([...lzwDecomprimi(c)], [...ripetitivo]);
  // rumore pseudo-casuale: riempie la tabella più volte e forza i Clear
  let seme = 12345;
  const rumore = new Uint8Array(60000).map(() => { seme = (seme * 1103515245 + 12345) & 0x7fffffff; return seme >> 16; });
  assert.deepEqual([...lzwDecomprimi(lzwComprimi(rumore))], [...rumore]);
});

test('LZW: dati vuoti e di un solo byte', () => {
  assert.deepEqual([...lzwDecomprimi(lzwComprimi(new Uint8Array(0)))], []);
  assert.deepEqual([...lzwDecomprimi(lzwComprimi(Uint8Array.of(7)))], [7]);
});

test('i writer scrivono Compression = 5 e la strip compressa quando richiesto', () => {
  const rgb = new Uint8Array(30 * 20 * 3).fill(9);
  const buf = scriviTiffNordSu(30, 20, rgb, 13, 38, 0.001, 0.001, 4326, 5);
  const dv = new DataView(buf);
  const compressione = [...Array(13).keys()].map(k => [dv.getUint16(10 + k * 12, true), dv.getUint32(10 + k * 12 + 8, true)]).find(([tag]) => tag === 259)[1];
  assert.equal(compressione, 5);
  assert.ok(buf.byteLength < 8 + 2 + 13 * 12 + 4 + rgb.length, 'più piccolo di quello non compresso');
  const affine = scriviTiffAffine(30, 20, rgb, { a: 1, b: 0, c: 0, d: 0, e: 1, f: 0 }, 5);
  assert.ok(affine.byteLength < 8 + 2 + 12 * 12 + 4 + 6 + 128 + 40 + rgb.length);
});

test('scriviGeoTiff sceglie il writer dal tipo di georeferenza', () => {
  const rgb = new Uint8Array([1, 2, 3]);
  assert.equal(new DataView(scriviGeoTiff(1, 1, rgb, { type: 'affine', t: { a: 1, b: 0, c: 0, d: 0, e: 1, f: 0 } }, 1)).getUint16(8, true), 12);
  assert.equal(new DataView(scriviGeoTiff(1, 1, rgb, { type: 'northup', epsg: 3857, originX: 0, originY: 0, pixSizeX: 1, pixSizeY: 1 }, 1)).getUint16(8, true), 13);
});

test('creaGeoTiff in EPSG:4326 con affine incorpora la trasformazione scalata senza ricampionare', async () => {
  const t = { a: 0.002, b: 0, c: 13, d: 0, e: -0.002, f: 38 };
  const r = await creaGeoTiff({ proj4, t, imgData: rgba(4, 2), srcW: 4, srcH: 2, sc: 0.5, epsg: 4326, maxRes: 100, campiona: campionaVicino, compressione: 1 });
  assert.equal(r.W, 4);
  const dv = new DataView(r.buffer);
  assert.equal(dv.getUint16(8, true), 12, 'writer affine');
  const trOff = 8 + 2 + 12 * 12 + 4 + 6;
  assert.equal(dv.getFloat64(trOff, true), 0.004, 'a / sc');
});
