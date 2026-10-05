// js/geoimage/export.js
// Formati di esportazione basati su testo: KMZ, file .points di QGIS, world file, GCP GeoJSON. Portati da Geoimage.
// Il GeoTIFF sta in export-geotiff.js.

export const nomeBase = nome => (nome || 'mappa').replace(/\.[^/.]+$/, '');
export const escXml = s => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// File dei GCP per il Georeferenziatore di QGIS (l'asse y dell'immagine va verso l'alto, quindi -py)
export function puntiQgis(gcp) {
  return 'mapX,mapY,sourceX,sourceY,enable\n' + gcp.map(g => `${g.lng},${g.lat},${g.px},${-g.py},1\n`).join('');
}

export function geojsonGcp(gcp) {
  return {
    type: 'FeatureCollection',
    features: gcp.map((g, i) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [g.lng, g.lat] },
      properties: { id: i + 1, px: g.px, py: g.py, lat: g.lat, lng: g.lng },
    })),
  };
}

// World file a 6 righe (convenzione del centro del pixel). `t` è la trasformazione affine pixel → coordinate.
export function worldFile(t) {
  return [t.a, t.d, t.b, t.e, t.c, t.f].map(v => v.toFixed(10)).join('\n');
}

export function estensioneWorldFile(nomeFile) {
  const ext = (nomeFile.split('.').pop() || '').toLowerCase();
  return { jpg: 'jgw', jpeg: 'jgw', png: 'pgw', tif: 'tfw', tiff: 'tfw' }[ext] || 'wld';
}

// KML con gx:LatLonQuad: l'immagine sta esattamente sui 4 angoli, anche ruotata o deformata (ordine SO, SE, NE, NO)
export function kml({ nome, fileImmagine, angoli, gcp }) {
  const [NO, NE, SO, SE] = angoli;
  const coord = p => `${p.lng.toFixed(8)},${p.lat.toFixed(8)},0`;
  const segnaposti = gcp.map((g, i) => `    <Placemark>
      <name>GCP ${i + 1}</name>
      <description>Pixel: ${g.px}, ${g.py}</description>
      <Point><coordinates>${coord(g)}</coordinates></Point>
    </Placemark>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"
     xmlns:gx="http://www.google.com/kml/ext/2.2">
  <Document>
    <name>Mappa storica georeferenziata</name>
    <GroundOverlay>
      <name>${escXml(nome)}</name>
      <Icon><href>${fileImmagine}</href></Icon>
      <gx:LatLonQuad>
        <coordinates>
          ${coord(SO)}
          ${coord(SE)}
          ${coord(NE)}
          ${coord(NO)}
        </coordinates>
      </gx:LatLonQuad>
    </GroundOverlay>
    <Folder>
      <name>Ground Control Points</name>
${segnaposti}
    </Folder>
  </Document>
</kml>`;
}

// KMZ: doc.kml più l'immagine originale in files/. `JSZip` si passa dall'esterno (si carica solo quando serve).
export async function creaKmz(JSZip, { nome, dataUrl, angoli, gcp }) {
  const mime = dataUrl.split(';')[0].split(':')[1]; // per esempio image/jpeg
  const ext = mime.split('/')[1].replace('jpeg', 'jpg');
  const nomeImmagine = `${nomeBase(nome)}.${ext}`;
  const zip = new JSZip();
  zip.file('doc.kml', kml({ nome, fileImmagine: `files/${nomeImmagine}`, angoli, gcp }));
  zip.folder('files').file(nomeImmagine, dataUrl.split(',')[1], { base64: true });
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
}
