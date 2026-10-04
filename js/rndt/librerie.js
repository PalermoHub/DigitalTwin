// js/rndt/librerie.js
// Le librerie per KML, GPX, KMZ e Shapefile (js/vendor/) si caricano solo quando serve il formato: l'avvio dell'app non cambia.
// Adatta le loro interfacce a quella che importaFile si aspetta in `lib`.
const carica = nome => import(new URL(`../vendor/${nome}`, import.meta.url).href);
const xml = testo => new DOMParser().parseFromString(testo, 'text/xml');

export const librerie = {
  async kml(testo) { return (await carica('togeojson.es.mjs')).kml(xml(testo)); },
  async gpx(testo) { return (await carica('togeojson.es.mjs')).gpx(xml(testo)); },
  // un KMZ è uno zip con un KML dentro: restituisce il testo del KML
  async kmz(buffer) {
    const { unzipSync } = await carica('fflate.esm.js');
    const file = unzipSync(new Uint8Array(buffer));
    const nome = Object.keys(file).find(n => /\.kml$/i.test(n));
    if (!nome) throw new Error('il KMZ non contiene un file KML');
    return new TextDecoder().decode(file[nome]);
  },
  // shpjs legge shp, dbf e prj dallo zip e riproietta in WGS84; con più shapefile nello zip restituisce un array
  async shp(buffer) { return (await carica('shp.esm.min.js')).default(buffer); },
};
