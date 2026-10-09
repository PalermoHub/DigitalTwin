// js/aggiungi/wms-pronti.js
// WMS pronti da accendere dal ramo «WMS»: il Geoportale Nazionale (Ministero dell'Ambiente), carta IGM 1:25.000.
// Il server risponde solo in http: passa dal Worker, che per questo host (e solo questo) accetta http. Modulo puro, senza DOM né rete.
const IGM = 'http://wms.pcn.minambiente.it/ogc?map=/ms_ogc/WMS_v1.3/raster/IGM_25000.map';

export const WMS_PRONTI = [
  { id: 'igm25-33', nome: 'IGM 25.000, zona UTM 33 (Sicilia)', url: IGM, layers: 'CB.IGM25000.33', version: '1.3.0', format: 'image/png' },
  { id: 'igm25-32', nome: 'IGM 25.000, zona UTM 32 (Nord-Ovest e Sardegna)', url: IGM, layers: 'CB.IGM25000.32', version: '1.3.0', format: 'image/png' },
]; // i18n-ok: nomi dei servizi, come sono sul server
