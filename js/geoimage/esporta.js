// js/geoimage/esporta.js
// Sezione «Export»: KMZ, GeoTIFF (con le sue impostazioni), .points di QGIS, world file e GCP GeoJSON.
// Gli abilitati sono quelli di Geoimage: KMZ e GeoTIFF servono immagine e GCP sufficienti, il world file almeno 3 GCP.
import { nomeBase, puntiQgis, geojsonGcp, worldFile, estensioneWorldFile, creaKmz } from './export.js';
import { campionaVicino, campionaBilineare, definisciSr, creaGeoTiff } from './export-geotiff.js';
import { calcolaTrasformazione, calcolaAffine, minimoGcp } from './trasformazioni.js';
import { jszip, proj4 } from './librerie.js';
import { scarica } from './scarica.js';

const caricaImg = src => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ko(new Error('immagine non leggibile')); i.src = src; });

export function collegaEsporta(ctx) {
  const { $, stato } = ctx;
  const testo = (contenuto, tipo, nome) => scarica(new Blob([contenuto], { type: tipo }), nome);

  function aggiorna() {
    const img = !!stato.immagine;
    const ok = img && stato.gcp.length >= minimoGcp(stato.tipo);
    $('kmz').disabled = !ok;
    $('geotiff').disabled = !ok;
    $('qgis').disabled = stato.gcp.length < 1;
    $('mondo').disabled = !(img && stato.gcp.length >= 3);
    $('geojson').disabled = stato.gcp.length < 1;
    $('json-esporta').disabled = !img;
    if (!ok) $('gtiff').hidden = true;
  }
  ctx.sulCambio(aggiorna);

  $('kmz').addEventListener('click', async () => {
    try {
      const blob = await creaKmz(await jszip(), { nome: stato.immagine.nome, dataUrl: stato.immagine.dataUrl, angoli: stato.angoli, gcp: stato.gcp });
      scarica(blob, `${nomeBase(stato.immagine.nome)}_georef.kmz`);
      ctx.messaggio('KMZ esportato (immagine incorporata).');
    } catch (errore) { ctx.avvisa(`Geoimage: KMZ non creato: ${errore.message}`); }
  });
  $('qgis').addEventListener('click', () => { testo(puntiQgis(stato.gcp), 'text/plain', 'gcp_qgis.points'); ctx.messaggio('File dei GCP per il Georeferenziatore di QGIS esportato.'); });
  $('geojson').addEventListener('click', () => {
    testo(JSON.stringify(geojsonGcp(stato.gcp), null, 2), 'application/json', `${nomeBase(stato.immagine?.nome)}_gcp.geojson`);
    ctx.messaggio(`GeoJSON dei GCP esportato (${stato.gcp.length} punti).`);
  });
  $('mondo').addEventListener('click', () => {
    const t = calcolaAffine(stato.gcp);
    if (!t) return ctx.messaggio('Servono almeno 3 GCP non allineati per il world file.');
    const ext = estensioneWorldFile(stato.immagine.nome);
    testo(worldFile(t), 'text/plain', `${nomeBase(stato.immagine.nome)}.${ext}`);
    ctx.messaggio(`World file esportato (${ext}).`);
  });

  // GeoTIFF: prima si scelgono le impostazioni, poi si esporta
  const nota = () => {
    const epsg = Number($('gtiff-sr').value);
    $('gtiff-ricamp-gruppo').classList.toggle('gi-spento', epsg === 4326);
    $('gtiff-nota').textContent = epsg === 4326
      ? 'EPSG:4326: trasformazione affine incorporata nel file, nessun ricampionamento (con la poly2 l\'immagine si ricampiona).'
      : `I pixel vengono ricampionati (${$('gtiff-ricamp').selectedOptions[0].text}) per riproiettare l'immagine in EPSG:${epsg}.`;
  };
  $('geotiff').addEventListener('click', () => { $('gtiff').hidden = !$('gtiff').hidden; nota(); });
  $('gtiff-annulla').addEventListener('click', () => { $('gtiff').hidden = true; });
  $('gtiff-sr').addEventListener('change', nota);
  $('gtiff-ricamp').addEventListener('change', nota);
  $('gtiff-vai').addEventListener('click', async () => {
    const t = calcolaTrasformazione(stato.tipo, stato.gcp);
    if (!t || !stato.immagine) return ctx.messaggio(`Servono almeno ${minimoGcp(stato.tipo)} GCP per il GeoTIFF.`);
    const epsg = Number($('gtiff-sr').value), maxRes = Number($('gtiff-max').value), compressione = Number($('gtiff-compr').value);
    const campiona = $('gtiff-ricamp').value === 'nearest' ? campionaVicino : campionaBilineare;
    $('gtiff').hidden = true;
    $('geotiff').disabled = true;
    try {
      ctx.messaggio('Caricamento immagine…');
      const [p4, img] = await Promise.all([proj4(), caricaImg(stato.immagine.dataUrl)]);
      definisciSr(p4);
      let srcW = img.naturalWidth, srcH = img.naturalHeight, sc = 1;
      if (srcW > maxRes || srcH > maxRes) { sc = maxRes / Math.max(srcW, srcH); srcW = Math.round(srcW * sc); srcH = Math.round(srcH * sc); }
      const cv = Object.assign(document.createElement('canvas'), { width: srcW, height: srcH });
      const g = cv.getContext('2d');
      g.drawImage(img, 0, 0, srcW, srcH);
      const imgData = g.getImageData(0, 0, srcW, srcH).data;
      const r = await creaGeoTiff({
        proj4: p4, t, imgData, srcW, srcH, sc, epsg, maxRes, campiona, compressione,
        progresso: pct => ctx.messaggio(`Ricampionamento ${pct}%…`),
      });
      scarica(new Blob([r.buffer], { type: 'image/tiff' }), `${nomeBase(stato.immagine.nome)}_georef_EPSG${epsg}.tif`);
      ctx.messaggio(`GeoTIFF EPSG:${epsg} esportato — ${r.W}×${r.H} px.`);
    } catch (errore) {
      ctx.avvisa(`Geoimage: GeoTIFF non creato: ${errore.message}`);
    } finally {
      aggiorna();
    }
  });
}
