// tests/js/aggiungi-wmts.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { capabilitiesWmts, prefissoWebMercator } from '../../js/aggiungi/wmts.js';
import { leggiXml, primo, figli } from '../../js/aggiungi/servizi.js';

const MATRICI = (prefisso, n, extra = '') => Array.from({ length: n }, (_, i) =>
  `<TileMatrix><ows:Identifier>${prefisso}${i}</ows:Identifier><ScaleDenominator>${559082264.0287178 / 2 ** i}</ScaleDenominator><TopLeftCorner>-20037508.342789244 20037508.342789244</TopLeftCorner><TileWidth>256</TileWidth><TileHeight>256</TileHeight><MatrixWidth>${2 ** i}</MatrixWidth><MatrixHeight>${2 ** i}</MatrixHeight>${extra}</TileMatrix>`).join('');
const INSIEME = (id, crs, matrici) => `<TileMatrixSet><ows:Identifier>${id}</ows:Identifier><ows:SupportedCRS>${crs}</ows:SupportedCRS>${matrici}</TileMatrixSet>`;
const WMTS_REST = `<?xml version="1.0"?>
<Capabilities xmlns="http://www.opengis.net/wmts/1.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.0.0">
 <ows:ServiceIdentification><ows:ServiceType>OGC WMTS</ows:ServiceType></ows:ServiceIdentification>
 <ows:OperationsMetadata><ows:Operation name="GetTile"><ows:DCP><ows:HTTP><ows:Get xlink:href="https://w.example.org/wmts?"/></ows:HTTP></ows:DCP></ows:Operation></ows:OperationsMetadata>
 <Contents>
  <Layer>
   <ows:Title>Ortofoto &amp; co</ows:Title><ows:Identifier>orto</ows:Identifier>
   <ows:WGS84BoundingBox><ows:LowerCorner>12 37</ows:LowerCorner><ows:UpperCorner>14 39</ows:UpperCorner></ows:WGS84BoundingBox>
   <Style isDefault="true"><ows:Identifier>normale</ows:Identifier></Style>
   <Format>image/jpeg</Format><Format>image/png</Format>
   <TileMatrixSetLink><TileMatrixSet>GoogleMapsCompatible</TileMatrixSet></TileMatrixSetLink>
   <ResourceURL format="image/png" resourceType="tile" template="https://w.example.org/orto/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png"/>
  </Layer>
  <Layer>
   <ows:Title>Solo UTM</ows:Title><ows:Identifier>utm</ows:Identifier>
   <Format>image/png</Format>
   <TileMatrixSetLink><TileMatrixSet>UTM</TileMatrixSet></TileMatrixSetLink>
  </Layer>
  ${INSIEME('GoogleMapsCompatible', 'urn:ogc:def:crs:EPSG:6.18:3:3857', MATRICI('', 4))}
  ${INSIEME('UTM', 'urn:ogc:def:crs:EPSG::32633', MATRICI('UTM:', 4))}
 </Contents>
</Capabilities>`;

const WMTS_KVP = `<Capabilities version="1.0.0"><ServiceIdentification><ServiceType>OGC WMTS</ServiceType></ServiceIdentification>
<Contents><Layer><Title>Base</Title><Identifier>base</Identifier><Format>image/png</Format>
<TileMatrixSetLink><TileMatrixSet>web</TileMatrixSet></TileMatrixSetLink></Layer>
${INSIEME('web', 'EPSG:3857', MATRICI('EPSG:3857:', 3))}</Contents></Capabilities>`;

test('prefissoWebMercator: identificatori numerici o con prefisso, in ordine di scala', () => {
  const nodo = x => primo(leggiXml(`<Contents xmlns:ows="x">${x}</Contents>`), 'TileMatrixSet');
  assert.equal(prefissoWebMercator(nodo(INSIEME('a', 'EPSG:3857', MATRICI('', 3)))), '');
  assert.equal(prefissoWebMercator(nodo(INSIEME('a', 'urn:ogc:def:crs:EPSG::3857', MATRICI('EPSG:3857:', 3)))), 'EPSG:3857:');
  assert.equal(prefissoWebMercator(nodo(INSIEME('a', 'EPSG:900913', MATRICI('wm', 2)))), 'wm');
});

test('prefissoWebMercator: altro CRS, tile non 256, origine diversa, id non coincidenti con il livello → null', () => {
  const nodo = x => primo(leggiXml(`<Contents xmlns:ows="x">${x}</Contents>`), 'TileMatrixSet');
  assert.equal(prefissoWebMercator(nodo(INSIEME('a', 'EPSG:32633', MATRICI('', 3)))), null);
  assert.equal(prefissoWebMercator(nodo(INSIEME('a', 'EPSG:3857', MATRICI('', 3).replaceAll('<TileWidth>256', '<TileWidth>512')))), null);
  assert.equal(prefissoWebMercator(nodo(INSIEME('a', 'EPSG:3857', MATRICI('', 3).replaceAll('-20037508.342789244 20037508', '0 20037508')))), null);
  assert.equal(prefissoWebMercator(nodo(INSIEME('a', 'EPSG:3857', MATRICI('', 3).replace('<ows:Identifier>1<', '<ows:Identifier>7<')))), null);
  assert.equal(prefissoWebMercator(nodo(INSIEME('a', 'EPSG:3857', MATRICI('l', 3).replaceAll('l1', 'l01')))), null);
  assert.equal(prefissoWebMercator(undefined), null);
});

test('WMTS REST: URL XYZ dal ResourceURL, stile e matrici sostituiti, bbox e titolo', () => {
  const c = capabilitiesWmts(WMTS_REST, 'https://w.example.org/wmts');
  assert.equal(c.versione, '1.0.0');
  assert.deepEqual(c.layer[0], {
    nome: 'orto', titolo: 'Ortofoto & co', bbox: [12, 37, 14, 39], supportato: true,
    tile: 'https://w.example.org/orto/normale/GoogleMapsCompatible/{z}/{y}/{x}.png',
  });
});

test('WMTS: un layer con soli insiemi non compatibili è «non supportato» e senza URL', () => {
  const c = capabilitiesWmts(WMTS_REST, 'https://w.example.org/wmts');
  assert.deepEqual(c.layer[1], { nome: 'utm', titolo: 'Solo UTM', bbox: null, supportato: false, tile: null });
});

test('WMTS KVP: GetTile costruito sull’indirizzo del servizio, segnaposto intatti, prefisso nella matrice', () => {
  const c = capabilitiesWmts(WMTS_KVP, 'https://k.example.org/ows?map=a&SERVICE=WMTS&REQUEST=GetCapabilities');
  const t = c.layer[0].tile;
  assert.ok(t.startsWith('https://k.example.org/ows?map=a&SERVICE=WMTS&'), t);
  assert.match(t, /REQUEST=GetTile/);
  assert.match(t, /LAYER=base/);
  assert.match(t, /TILEMATRIXSET=web/);
  assert.match(t, /FORMAT=image%2Fpng/);
  assert.ok(t.endsWith('&TILEMATRIX=EPSG%3A3857%3A{z}&TILEROW={y}&TILECOL={x}'), t);
});

test('WMTS: ResourceURL con dimensione sconosciuta o segnaposto ignoto → non supportato, mai graffe residue', () => {
  const x = WMTS_REST.replace('{TileCol}.png', '{TileCol}.png?t={Time}');
  const c = capabilitiesWmts(x, 'https://w.example.org/wmts');
  assert.equal(c.layer[0].supportato, false);
  assert.equal(c.layer[0].tile, null);
  const conDefault = WMTS_REST.replace('{TileCol}.png', '{TileCol}.png?t={Time}').replace('<Format>image/jpeg</Format>',
    '<Dimension><ows:Identifier>Time</ows:Identifier><Default>2024</Default></Dimension><Format>image/jpeg</Format>');
  assert.match(capabilitiesWmts(conDefault, 'https://w.example.org/wmts').layer[0].tile, /\.png\?t=2024$/);
});

test('WMTS: eccezioni, documenti non WMTS e servizi senza layer → errori in chiaro', () => {
  assert.throws(() => capabilitiesWmts('<ows:ExceptionReport><ows:Exception><ows:ExceptionText>Servizio spento</ows:ExceptionText></ows:Exception></ows:ExceptionReport>', 'https://w.it/x'), /Servizio spento/);
  assert.throws(() => capabilitiesWmts('<html></html>', 'https://w.it/x'), /non è un servizio WMTS/);
  assert.throws(() => capabilitiesWmts('<WMS_Capabilities version="1.3.0"/>', 'https://w.it/x'), /non è un servizio WMTS/);
  assert.throws(() => capabilitiesWmts('<Capabilities><ServiceIdentification><ServiceType>OGC WMTS</ServiceType></ServiceIdentification><Contents/></Capabilities>', 'https://w.it/x'), /nessun layer/);
});
