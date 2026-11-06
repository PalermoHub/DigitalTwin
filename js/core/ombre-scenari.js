// Viste fotografiche con il sole: camera libera a quota d'occhio, data e ora già impostate.
// Il caso d'uso è l'alba del solstizio d'estate, quando il sole sorge in asse con il Cassaro (via Vittorio Emanuele) e si incornicia a Porta Felice.
const RAD = Math.PI / 180;
const M_PER_GRADO = 111320;
const LAT_PF = 38.1195699, LON_PF = 13.3713217; // Porta Felice (OpenStreetMap)
export const ASSE_CASSARO = 63;                  // azimut da Porta Nuova a Porta Felice, gradi dal nord
export const PITCH_VISTA = 85;                   // massimo di MapLibre: sguardo 5° sotto l'orizzonte
export const FOV_DEFAULT = 36.87;                // campo visivo verticale di MapLibre, gradi

// Punto a `metri` da Porta Felice, in direzione `azimut` (gradi dal nord).
export function daPortaFelice(metri, azimut) {
  const lat = LAT_PF + (metri * Math.cos(azimut * RAD)) / M_PER_GRADO;
  return { lat, lng: LON_PF + (metri * Math.sin(azimut * RAD)) / (M_PER_GRADO * Math.cos(LAT_PF * RAD)) };
}

const dietro = ASSE_CASSARO + 180;

// Azimut (gradi dal nord) da un punto a un altro, su distanze brevi.
export function azimutVerso(da, a) {
  const dx = (a.lng - da.lng) * Math.cos(da.lat * RAD), dy = a.lat - da.lat;
  return ((Math.atan2(dx, dy) / RAD) + 360) % 360;
}
// Asse di Via/Corso Vittorio Emanuele (il Cassaro) da Porta Felice a Porta Nuova, [lng, lat]: ways OpenStreetMap, per il riflesso del sole sull'asfalto.
export const LINEA_CASSARO = [[13.37145,38.11974],[13.37136,38.1197],[13.37113,38.11961],[13.37098,38.11955],[13.37088,38.11951],[13.37047,38.11934],[13.37039,38.11931],[13.37022,38.11924],[13.37004,38.11917],[13.36938,38.1189],[13.36785,38.11828],[13.36774,38.11824],[13.36739,38.11809],[13.36709,38.11797],[13.36678,38.11785],[13.36653,38.11774],[13.36624,38.11763],[13.36541,38.11729],[13.36518,38.1172],[13.36505,38.11714],[13.36454,38.11694],[13.36449,38.11692],[13.36418,38.11679],[13.36406,38.11675],[13.36402,38.11673],[13.36365,38.11657],[13.36359,38.11654],[13.36336,38.11645],[13.36291,38.11627],[13.3626,38.11614],[13.3623,38.11602],[13.36228,38.11601],[13.3619,38.11586],[13.36186,38.11584],[13.3616,38.11574],[13.36147,38.11568],[13.36144,38.11567],[13.36132,38.11562],[13.36124,38.11559],[13.36098,38.11548],[13.36071,38.11537],[13.36042,38.11525],[13.36014,38.11514],[13.36013,38.11513],[13.35984,38.11501],[13.35958,38.11491],[13.35906,38.1147],[13.35879,38.11459],[13.35844,38.11445],[13.35792,38.11424],[13.35763,38.11412],[13.35738,38.11402],[13.35713,38.11392],[13.35708,38.1139],[13.35682,38.1138],[13.35681,38.11379],[13.35653,38.11368],[13.35623,38.11356],[13.35595,38.11345],[13.35571,38.11335],[13.35566,38.11333],[13.35556,38.11329],[13.3548,38.11299],[13.35447,38.11285],[13.35398,38.11266],[13.35386,38.11261],[13.35373,38.11256],[13.35338,38.11242],[13.35308,38.1123],[13.35278,38.11218]];

// Intensità 0..1 del riflesso del sole sulla strada: serve il sole basso e in asse con il Cassaro (63° la mattina, 243° la sera).
export function riflessoCassaro(az, el) {
  if (el <= 0) return 0;
  const d = Math.min(...[ASSE_CASSARO, ASSE_CASSARO + 180].map(a => Math.abs(((az - a + 540) % 360) - 180)));
  const allineato = Math.max(0, 1 - d / 12);
  const basso = Math.max(0, Math.min(1, (35 - el) / 25));
  return allineato * basso;
}

export const SCENARI = [
  { id: 'strada', giorno: '06-21', minuti: 370, ...daPortaFelice(130, dietro), quota: 13, pitch: 80 }, // nel Cassaro, a 130 m da Porta Felice, 13 m su: sguardo leggermente in basso
  { id: 'colle', giorno: '06-21', minuti: 370, ...daPortaFelice(8000, dietro), quota: 330 },  // dal colle di Monreale, lungo lo stesso asse
  { id: 'mare', giorno: '06-21', minuti: 370, ...daPortaFelice(935, ASSE_CASSARO), quota: 300, bearing: dietro, pitch: 75 }, // dal mare, 935 m a nord-est di Porta Felice e 300 m su, verso il Cassaro: il sole sorge alle spalle
].map(s => ({ bearing: ASSE_CASSARO, pitch: PITCH_VISTA, ...s }));

// Camera «a quota d'occhio» come la intende MapLibre 4 (centro a terra, zoom, pitch, bearing), senza camera libera:
// con lo sguardo `90 - pitch` gradi sotto l'orizzonte il centro dello schermo cade a quota/tan(...) metri davanti all'osservatore;
// lo zoom è quello a cui la distanza camera-centro (1,5 volte l'altezza dello schermo in pixel) vale quota/sin(...) metri.
export function cameraVista(sc, hSchermo) {
  const giu = (90 - sc.pitch) * RAD;
  const centro = daPunto(sc, sc.quota / Math.tan(giu), sc.bearing);
  const distanza = sc.quota / Math.sin(giu);
  const zoom = Math.log2((40075016.686 * Math.cos(sc.lat * RAD) * (hSchermo / 2 / Math.tan((FOV_DEFAULT * RAD) / 2))) / (512 * distanza));
  return { center: [centro.lng, centro.lat], zoom, bearing: sc.bearing, pitch: sc.pitch };
}

function daPunto({ lat, lng }, metri, azimut) {
  return { lat: lat + (metri * Math.cos(azimut * RAD)) / M_PER_GRADO, lng: lng + (metri * Math.sin(azimut * RAD)) / (M_PER_GRADO * Math.cos(lat * RAD)) };
}

// Dove cade il sole (azimut/elevazione) nello schermo di una camera con bearing e pitch dati.
// Ritorna { x, y } in pixel, oppure null se è alle spalle della camera.
export function soleSchermo(az, el, { bearing, pitch, fov = FOV_DEFAULT, w, h, padding = {} }) {
  const b = bearing * RAD, c = (pitch - 90) * RAD; // c: elevazione dello sguardo (pitch 90 = orizzonte)
  const d = [Math.sin(az * RAD) * Math.cos(el * RAD), Math.cos(az * RAD) * Math.cos(el * RAD), Math.sin(el * RAD)]; // est, nord, su
  const avanti = [Math.sin(b) * Math.cos(c), Math.cos(b) * Math.cos(c), Math.sin(c)];
  const destra = [Math.cos(b), -Math.sin(b), 0];
  const su = [-Math.sin(b) * Math.sin(c), -Math.cos(b) * Math.sin(c), Math.cos(c)];
  const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
  const z = dot(d, avanti);
  if (z <= 1e-6) return null;
  const t = Math.tan((fov * RAD) / 2);
  // il centro della vista è il centro dell'area libera: MapLibre lo sposta con il padding dei pannelli laterali
  const cx = (w + (padding.left || 0) - (padding.right || 0)) / 2, cy = (h + (padding.top || 0) - (padding.bottom || 0)) / 2;
  return { x: cx + (dot(d, destra) / (z * t)) * (h / 2), y: cy - (dot(d, su) / (z * t)) * (h / 2) };
}

// Colori del cielo (alto, orizzonte) in base all'altezza del sole.
export function coloriCielo(el) {
  const k = Math.min(1, Math.max(0, (el + 2) / 12)); // 0 = sole sull'orizzonte, 1 = sole alto
  const mix = (a, b) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  return { alto: `rgb(${mix([38, 62, 122], [70, 130, 205]).join(',')})`, orizzonte: `rgb(${mix([255, 150, 70], [190, 220, 245]).join(',')})` };
}

// Sfondo CSS del contenitore della mappa: cielo sopra l'orizzonte (yOrizzonte in pixel), invariato sotto.
export function sfondoCielo(el, yOrizzonte, h) {
  const { alto, orizzonte } = coloriCielo(el);
  const y = Math.max(0, Math.min(h, yOrizzonte));
  return `linear-gradient(to bottom, ${alto} 0px, ${orizzonte} ${y}px, ${orizzonte} ${h}px)`;
}
