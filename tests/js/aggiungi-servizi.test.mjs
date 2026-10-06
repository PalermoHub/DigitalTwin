// tests/js/aggiungi-servizi.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  leggiXml, capabilitiesWms, capabilitiesWfs, validaXyz, urlBase, urlCapabilities, urlGetFeature,
} from '../../js/aggiungi/servizi.js';

const WMS_130 = `<?xml version="1.0"?>
<WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms">
 <Capability>
  <Request><GetMap><Format>image/jpeg</Format><Format>image/png</Format></GetMap></Request>
  <Layer>
   <Title>Radice</Title>
   <CRS>EPSG:4326</CRS><CRS>EPSG:3857</CRS>
   <EX_GeographicBoundingBox><westBoundLongitude>12</westBoundLongitude><eastBoundLongitude>14</eastBoundLongitude><southBoundLatitude>37</southBoundLatitude><northBoundLatitude>39</northBoundLatitude></EX_GeographicBoundingBox>
   <Layer><Name>pai</Name><Title>Piano &amp; PAI</Title></Layer>
   <Layer><Title>Gruppo senza nome</Title><Layer><Name>annidato</Name><Title>Annidato</Title></Layer></Layer>
  </Layer>
 </Capability>
</WMS_Capabilities>`;

const WMS_SOLO_4326 = `<WMS_Capabilities version="1.3.0"><Capability><Request><GetMap><Format>image/png</Format></GetMap></Request>
<Layer><CRS>EPSG:4326</CRS><Layer><Name>a</Name><Title>A</Title></Layer></Layer></Capability></WMS_Capabilities>`;

const WMS_111 = `<?xml version="1.0"?>
<!DOCTYPE WMT_MS_Capabilities SYSTEM "http://schemas.opengis.net/wms/1.1.1/WMS_MS_Capabilities.dtd" [ <!ELEMENT VendorSpecificCapabilities EMPTY> ]>
<WMT_MS_Capabilities version="1.1.1"><Capability><Request><GetMap><Format>image/gif</Format></GetMap></Request>
<Layer><Title>R</Title><SRS>EPSG:4326 EPSG:900913</SRS><LatLonBoundingBox minx="12" miny="37" maxx="14" maxy="39"/>
<Layer><Name>a</Name><Title>A</Title></Layer></Layer></Capability></WMT_MS_Capabilities>`;

const WFS_200 = `<wfs:WFS_Capabilities version="2.0.0" xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:ows="http://www.opengis.net/ows/1.1">
<wfs:FeatureTypeList>
 <wfs:FeatureType><wfs:Name>ns:strade</wfs:Name><wfs:Title>Strade</wfs:Title></wfs:FeatureType>
 <wfs:FeatureType><wfs:Name>ns:civici</wfs:Name></wfs:FeatureType>
</wfs:FeatureTypeList></wfs:WFS_Capabilities>`;

test('leggiXml: prefissi tolti, entità, CDATA, commenti, auto-chiusi', () => {
  const r = leggiXml('<?xml version="1.0"?><!-- c --><a:r x:k="1 &amp; 2"><b>t&lt;</b><c/><d><![CDATA[<z>]]></d></a:r>');
  assert.equal(r.nome, 'r');
  assert.equal(r.attr.k, '1 & 2');
  assert.deepEqual(r.figli.map(f => f.nome), ['b', 'c', 'd']);
  assert.equal(r.figli[0].testo, 't<');
  assert.equal(r.figli[2].testo, '<z>');
});

test('leggiXml: XML non bilanciato, vuoto o HTML sciatto → errore', () => {
  assert.throws(() => leggiXml('<a><b></a>'), /XML non valido/);
  assert.throws(() => leggiXml('<a>'), /XML non valido/);
  assert.throws(() => leggiXml('solo testo'), /XML non valido/);
});

test('WMS 1.3.0: layer richiedibili, titolo decodificato, bbox ereditato, formato png preferito', () => {
  const c = capabilitiesWms(WMS_130);
  assert.equal(c.versione, '1.3.0');
  assert.equal(c.formato, 'image/png');
  assert.deepEqual(c.layer.map(l => l.nome), ['pai', 'annidato']);
  assert.equal(c.layer[0].titolo, 'Piano & PAI');
  assert.deepEqual(c.layer[0].bbox, [12, 37, 14, 39]);
  assert.deepEqual(c.layer[1].bbox, [12, 37, 14, 39]);
  assert.equal(c.layer[0].supportato, true);
});

test('WMS senza EPSG:3857: il layer c’è ma non è supportato', () => {
  const c = capabilitiesWms(WMS_SOLO_4326);
  assert.deepEqual(c.layer.map(l => [l.nome, l.supportato]), [['a', false]]);
});

test('WMS 1.1.1: DOCTYPE con sottoinsieme, SRS in elenco, LatLonBoundingBox, primo formato se manca png', () => {
  const c = capabilitiesWms(WMS_111);
  assert.equal(c.versione, '1.1.1');
  assert.equal(c.formato, 'image/gif');
  assert.deepEqual(c.layer, [{ nome: 'a', titolo: 'A', bbox: [12, 37, 14, 39], supportato: true }]);
});

test('WMS: eccezioni del servizio, pagina HTML e XML non WMS danno errori in chiaro', () => {
  assert.throws(() => capabilitiesWms('<ServiceExceptionReport><ServiceException>Boom</ServiceException></ServiceExceptionReport>'), /Boom/);
  assert.throws(() => capabilitiesWms('<html><body>Accesso negato</body></html>'), /non è un servizio WMS/);
  assert.throws(() => capabilitiesWms('<WMS_Capabilities version="1.3.0"><Capability></Capability></WMS_Capabilities>'), /nessun layer/);
});

test('WFS 2.0.0: tipi con nome e titolo (senza titolo vale il nome)', () => {
  const c = capabilitiesWfs(WFS_200);
  assert.equal(c.versione, '2.0.0');
  assert.deepEqual(c.tipi, [{ nome: 'ns:strade', titolo: 'Strade' }, { nome: 'ns:civici', titolo: 'ns:civici' }]);
});

test('WFS: eccezione OWS e documento non WFS → errore', () => {
  assert.throws(() => capabilitiesWfs('<ows:ExceptionReport><ows:Exception><ows:ExceptionText>Servizio spento</ows:ExceptionText></ows:Exception></ows:ExceptionReport>'), /Servizio spento/);
  assert.throws(() => capabilitiesWfs('<html></html>'), /non è un servizio WFS/);
  assert.throws(() => capabilitiesWfs('<WFS_Capabilities version="2.0.0"><FeatureTypeList/></WFS_Capabilities>'), /nessun tipo/);
});

test('validaXyz: https con {z} {x} {y}', () => {
  assert.equal(validaXyz('  https://a.it/{z}/{x}/{y}.png '), 'https://a.it/{z}/{x}/{y}.png');
  assert.throws(() => validaXyz('http://a.it/{z}/{x}/{y}.png'), /https/);
  assert.throws(() => validaXyz('https://a.it/tile.png'), /\{z\}/);
  assert.throws(() => validaXyz('ciao'), /non valido/);
  assert.throws(() => validaXyz(''), /non valido/);
});

test('urlBase e urlCapabilities: tolgono service/request/version in ogni maiuscola e tengono il resto', () => {
  const dato = 'https://x.it/ows?map=a&SERVICE=WMS&request=GetCapabilities&Version=1.1.1';
  assert.equal(urlBase(dato), 'https://x.it/ows?map=a');
  const u = new URL(urlCapabilities(dato, 'wms'));
  assert.equal(u.searchParams.get('map'), 'a');
  assert.equal(u.searchParams.get('SERVICE'), 'WMS');
  assert.equal(u.searchParams.get('REQUEST'), 'GetCapabilities');
  assert.equal([...u.searchParams.keys()].filter(k => k.toLowerCase() === 'request').length, 1);
  assert.equal(new URL(urlCapabilities('https://x.it/wfs', 'wfs')).searchParams.get('SERVICE'), 'WFS');
  assert.throws(() => urlBase('http://x.it/ows'), /https/);
  assert.throws(() => urlBase('non è un indirizzo'), /non valido/);
});

test('urlGetFeature 2.0.0: typeNames, count, bbox con asse lat/lon e urn', () => {
  const u = new URL(urlGetFeature('https://x.it/wfs?map=a', { tipo: 'ns:strade', versione: '2.0.0', bbox: [13.1, 37.9785, 13.55, 38.2919], max: 5001 }));
  const p = u.searchParams;
  assert.equal(p.get('map'), 'a');
  assert.equal(p.get('SERVICE'), 'WFS');
  assert.equal(p.get('REQUEST'), 'GetFeature');
  assert.equal(p.get('VERSION'), '2.0.0');
  assert.equal(p.get('typeNames'), 'ns:strade');
  assert.equal(p.get('count'), '5001');
  assert.equal(p.get('outputFormat'), 'application/json');
  assert.equal(p.get('srsName'), 'EPSG:4326');
  assert.equal(p.get('bbox'), '37.9785,13.1,38.2919,13.55,urn:ogc:def:crs:EPSG::4326');
});

test('urlGetFeature 1.0.0: typeName, maxFeatures, bbox lon/lat', () => {
  const p = new URL(urlGetFeature('https://x.it/wfs', { tipo: 'a', versione: '1.0.0', bbox: [13.1, 37.9785, 13.55, 38.2919], max: 5001 })).searchParams;
  assert.equal(p.get('typeName'), 'a');
  assert.equal(p.get('maxFeatures'), '5001');
  assert.equal(p.get('bbox'), '13.1,37.9785,13.55,38.2919,EPSG:4326');
  assert.equal(p.get('typeNames'), null);
});
