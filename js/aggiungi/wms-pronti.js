// js/aggiungi/wms-pronti.js
// WMS pronti da accendere dal ramo «WMS». Modulo puro, senza DOM né rete.
// Carte storiche e rilievi del Comune di Palermo (Sispi, ERDAS APOLLO): https, CORS aperto, EPSG:3857; `bbox` = estensione di ogni carta
const STORICHE = 'https://geodspweb.comune.palermo.it/erdas-iws/ogc/wms/Carte_storiche';
const storica = (id, nome, layers, bbox) => ({ id, nome, url: STORICHE, layers, version: '1.3.0', format: 'image/png', bbox });

export const WMS_CARTE_STORICHE = [
  storica('igmi-25v', 'IGM serie 25V, 1:25.000', 'IGMI_serie_25V', [13.2001, 37.9987, 13.4540, 38.2524]),
  storica('omira-1935', 'OMIRA 1935-37, 1:5.000', 'omira_1935_37_5000_img.ecw', [13.2678, 38.0582, 13.4609, 38.2342]),
  storica('irta-1956-5000', 'IRTA 1956, 1:5.000', 'irta_1956_5000', [13.2498, 38.0607, 13.4383, 38.2238]),
  storica('irta-1956-2000', 'IRTA 1956, 1:2.000', 'IRTA_1956_2000', [13.2711, 38.0727, 13.4380, 38.2124]),
  storica('eira-1957', 'EIRA 1957, 1:10.000', 'RILIEVO_EIRA_1957.ECW', [13.3098, 38.0861, 13.3893, 38.1761]),
  storica('sas-1973', 'SAS 1973, piano quotato', 'SAS_PIANO_QUOTATO_1973.ECW', [13.2495, 38.0598, 13.4588, 38.2357]),
  storica('sas-1981', 'SAS 1981, centro storico (carta dei tetti)', 'CENTRO STORICO SAS_1981.ecw', [13.3490, 38.1066, 13.3787, 38.1245]), // i18n-ok: tradotto con lbl.* in tl()
  storica('ctc-1989', 'Carta tecnica comunale 1989-91', 'CSG_89_91_2000.ecw', [13.2382, 38.0418, 13.4541, 38.2321]),
  storica('ortofoto-cs', 'Ortofoto del centro storico, 2000', 'ORTOFOTO_CENTRO_STORICO.ECW', [13.3484, 38.1054, 13.3794, 38.1249]), // i18n-ok: tradotto con lbl.* in tl()
]; // i18n-ok: nomi dei servizi, come sono sul server
