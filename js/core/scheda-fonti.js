import { urlDati } from './config.js';
import { titoloPagina, blocco, link, elenco } from './pagina-info.js';

const AVVISI = [
  'Catasto, zonizzazione PRG e vincoli sono solo informativi e non hanno valore legale: per usi legali servono il certificato di destinazione urbanistica e le visure ufficiali.',
  'Il PRG vigente è la Variante generale 2004: varianti puntuali successive potrebbero non essere incluse.',
  'I dati del censimento 2023 sono stime campionarie (censimento permanente): i valori per sezione non sono conteggi esatti.',
  'La popolazione per edificio è una stima.',
  'I progetti PNRR sono quelli localizzati nella sola città di Palermo; sulla mappa compaiono solo quelli con un indirizzo trovato nei numeri civici (gli altri, per lo più formazione e ricerca, sono nell\'elenco CSV). Stato, importi e date sono quelli dichiarati nella fonte.',
  'Le opere pubbliche sono quelle localizzate nella sola città di Palermo, di qualunque titolare (Comune, Città Metropolitana, ANAS, IACP, aziende sanitarie…); sulla mappa compaiono solo quelle con un indirizzo trovato nei numeri civici. Lo stato è quello del CUP (attivo o chiuso), la fase è ricavata dalle date effettive dichiarate; costi e finanziamenti sono quelli dichiarati dai titolari e non vanno sommati.',
  'Il Piano triennale riporta gli interventi come programmati dal Comune: 94 interventi su 548 non hanno una geometria e compaiono solo nella scheda. Le tabelle sono state estratte dai PDF e le geometrie ricavate dalle tavole con l’aiuto di Claude AI, quindi i dati hanno carattere informativo e senza valore legale: per la documentazione ufficiale fare riferimento agli atti del Comune. I CUP «candidati» sono proposte da verificare, il CUP ufficiale non è stato modificato.',
];

const SIMULAZIONI = [
  'La simulazione dei mezzi in movimento (autobus, tram, treni) mostra posizioni teoriche ricavate dagli orari programmati: non tiene conto di ritardi, traffico o soppressioni, e tra due fermate il mezzo procede a velocità costante. Non è un servizio in tempo reale.',
  'Il percorso dei mezzi segue il tracciato delle linee, che può non coincidere con la strada reale in ogni tratto. Al momento non risultano feed GTFS-Realtime pubblicati per queste linee: se ne fossero disponibili, la simulazione potrebbe passare ai dati in tempo reale.',
  ['La simulazione dei mezzi in movimento è stata ispirata dal lavoro di ', link('Stig Arild Berntzen', 'https://www.linkedin.com/in/stigarildberntzen/'), '.'],
  ['Il post che presenta la simulazione è disponibile su ', link('LinkedIn', 'https://lnkd.in/p/dhyvcJhK'), '.'],
];

const LICENZE = {
  'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/deed.it',
  'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/deed.it',
  'CC BY 3.0 IT': 'https://creativecommons.org/licenses/by/3.0/it/legalcode',
  'ODbL 1.0': 'https://opendatacommons.org/licenses/odbl/1-0/',
  'IODL 2.0': 'https://www.dati.gov.it/content/italian-open-data-license-v20',
};

// Nome della licenza come link al testo ufficiale (se noto), altrimenti come testo semplice.
function licenza(nome) {
  return [LICENZE[nome] ? link(nome, LICENZE[nome]) : nome];
}

// Una voce dell'elenco fonti: testo, «Fonte dati» con i link, licenza (con link) o avviso se da verificare.
// `extra` = licenze note che valgono solo per una parte dei dati (es. le scuole del MIUR).
function voce(testo, riferimenti = [], lic = null, extra = []) {
  const parti = [testo];
  if (lic) parti.push(' — ', ...licenza(lic));
  if (riferimenti.length) {
    parti.push('. Fonte dati: ');
    riferimenti.forEach(([t, u], i) => parti.push(...(i ? [', '] : []), link(t, u)));
  }
  if (extra.length) parti.push(' (licenze: ', ...extra.flatMap((n, i) => [...(i ? [', '] : []), ...licenza(n)]), ')');
  if (!lic && !/condizioni d.uso da verificare|licenza da verificare/.test(testo) && !extra.length) parti.push(' — licenza da verificare');
  return parti;
}

// Link alla fonte dati dei layer scaricati dal catalogo (la corrispondenza è sul testo della fonte).
const LINK_CATALOGO = [
  [/particelle catastali/, [['SITR Regione Siciliana', 'https://www.sitr.regione.sicilia.it/'], ['Geoportale cartografico catastale, Agenzia delle Entrate', 'https://geoportale.cartografia.agenziaentrate.gov.it/age-inspire/srv/ita/catalog.search#/home'], ['Open data del Comune di Palermo', 'https://opendata.comune.palermo.it/index.php']]],
  [/Variante generale al PRG 2004/, [['Geocatalogo del Comune di Palermo', 'https://geocatalog.comune.palermo.it/geonetwork/srv/ita/catalog.search#/metadata/25562f02-587f-49ca-b5b6-21018efe7c78'], ['Open data del Comune di Palermo', 'https://opendata.comune.palermo.it/index.php'], ['SITR Regione Siciliana', 'https://www.sitr.regione.sicilia.it/']]],
  [/numeri civici/, [['ANNCSU, Archivio nazionale dei numeri civici', 'https://www.anncsu.gov.it/it/consultazione-dellarchivio/open-data/'], ['Mappa ANNCSU di PalermoHub', 'https://gbvitrano.github.io/ANNCSU/index.html']]],
  [/HR-DTM-5m/, [['Dati su Zenodo', 'https://zenodo.org/records/18872933'], ['DOI del dataset', 'https://doi.org/10.5281/zenodo.18921767'], ['Articolo (Scientific Data)', 'https://doi.org/10.1038/s41597-025-06132-z'], ['Repository del progetto', 'https://github.com/palermohub/Palerm-DTM-5m']]],
  [/Censimento permanente 2023/, [['AGID Cruscotto Italia', 'https://cruscotto-italia.dati.gov.it/comune.html?istat=082053#censimento']]],
  [/ISTAT/, [['ISTAT, Basi territoriali e variabili censuarie', 'https://www.istat.it/notizia/basi-territoriali-e-variabili-censuarie/'], ['Popolazione residente a Palermo, open data del Comune', 'https://opendata.comune.palermo.it/opendata-archivio-dataset.php?tag=POPOLAZIONE%20RESIDENTE']]],
];

function linkCatalogo(fonte) {
  return (LINK_CATALOGO.find(([re]) => re.test(fonte)) ?? [null, []])[1];
}

// Pagina «Fonti e note»: l'elenco delle fonti dei dati (il catalogo degli strati più le fonti fisse) e gli avvisi.
export function schedaFonti(catalogo) {
  const fonti = elenco([
    ...catalogo.filter(v => v.fonte).map(v => voce(`${v.fonte} (${v.data})`, linkCatalogo(v.fonte), v.licenza)),
    voce('Base cartografica: OpenFreeMap, © OpenMapTiles, dati © OpenStreetMap contributors', [['OpenFreeMap', 'https://openfreemap.org/'], ['OpenStreetMap', 'https://www.openstreetmap.org/copyright']], 'ODbL 1.0'),
    voce('Carte tecniche (CSG 2k 1989/91, CTC 2k 2007/09, CTR 10k 2012/13): SiciliaHub / PalermoHub, Comune di Palermo e Regione Siciliana (SITR)', [['SITR Regione Siciliana', 'https://www.sitr.regione.sicilia.it/?page_id=419'], ['Geocatalogo del Comune di Palermo', 'https://geocatalog.comune.palermo.it/geonetwork/srv/ita/catalog.search#/metadata/25562f02-587f-49ca-b5b6-21018efe7c78'], ['Atlante delle carte tecniche', 'https://palermohub.opendatasicilia.it/index_atlante_iframe.html']], 'CC BY 4.0'),
    ['Mappe storiche (1580–1993): ', link('Atlante delle carte tecniche storiche di Palermo', 'https://palermohub.opendatasicilia.it/index_atlante_iframe.html'), ', OpenDataSicilia (A. Borruso, F. P. Paolicelli, C. Spataro, G. B. Vitrano), georeferenziate su ', link('Map Warper', 'https://mapwarper.net/'), ' — ', ...licenza('CC BY 4.0'), '; le fonti originali (BnF Gallica, Library of Congress, Harvard Map Collection, U.S. Army Map Service, Comune di Palermo) sono indicate nell\'attribuzione di ogni mappa. Fonte dati: ', link('Dataset del Comune di Palermo', 'https://opendata.comune.palermo.it/opendata-dataset.php?dataset=1287'), ', ', link('SITR', 'https://www.sitr.regione.sicilia.it/geoportale/it/Metadata/Details/784'), ', ', link('Repertorio cartografico CRICD', 'https://www.cricd.it/'), ', ', link('University of Texas, Perry-Castañeda Library Map Collection', 'https://legacy.lib.utexas.edu/maps/ams/italy_city_plans/')],
    voce('Scuole, asili comunali e sedi delle sezioni elettorali: Comune di Palermo, dati aperti (2017)', [['Anagrafe edilizia scolastica, MIUR (scuole)', 'http://www.miur.gov.it/web/guest/-/scuola-online-i-dati-aggiornati-dell-anagrafe-dell-edilizia'], ['Open data del Comune di Palermo', 'https://opendata.comune.palermo.it/index.php']], 'CC BY 4.0', ['IODL 2.0']),
    voce('Trasporto pubblico (linee, fermate, orari): AMAT Palermo S.p.A., feed GTFS valido dal 25/08/2026 al 31/10/2026', [['Progetto OpenAMAT', 'https://github.com/openamat/Products/tree/master/data']], 'CC BY 4.0'),
    voce('Trasporto ferroviario urbano (linee, stazioni, orari): Trenitalia S.p.A. / CCISS MMTIS, dati NeTEx convertiti in GTFS da Clément Desouche (@deryclem), feed valido dal 26/09/2026 al 12/12/2026', [['Feed GTFS Trenitalia', 'https://github.com/deryclem/trenitalia-gtfs'], ['Posizione di alcune stazioni e stazioni in apertura (Politeama, Porto) da dati © contributori OpenStreetMap (ODbL)', 'https://www.openstreetmap.org/copyright']], 'CC BY 4.0'),
    voce('Sicurezza stradale: incidenti 2015–2023 del Comune di Palermo (Polizia Municipale), rete stradale © OpenStreetMap contributors, elaborazione PalermoHub / OpenDataSicilia (studio «Rete stradale»)', [['Sinistri 2022, open data del Comune', 'https://opendata.comune.palermo.it/opendata-dataset.php?dataset=1713'], ['Dataset sugli incidenti di Palermo su dati.gov.it', 'https://www.dati.gov.it/view-dataset?Cerca=incidenti+palermo'], ['OpenStreetMap', 'https://www.openstreetmap.org/copyright']], 'CC BY 4.0', ['ODbL 1.0']),
    voce('Colonnine di ricarica: GSE, Piattaforma Unica Nazionale (PUN), serie storica PalermoHub/evcharginglogsicilia, stato aggiornato in continuo', [['Piattaforma Unica Nazionale', 'https://www.piattaformaunicanazionale.it/'], ['EV Charging Log Sicilia', 'https://palermohub.github.io/evcharginglogsicilia/'], ['Rete di ricarica, onData', 'https://github.com/ondata/rete_ricarica_veicoli_elettrici']], 'CC BY 4.0').concat([
      '. Il progetto evcharginglogsicilia è un refactoring per la Sicilia di ', link('evcharginglogtrento', 'https://github.com/napo/evcharginglogtrento'),
      ', il progetto originale di ', link('Maurizio Napolitano (@napo)', 'https://www.linkedin.com/in/napolnx/'),
      ', per ', link('Trento', 'https://napo.github.io/evcharginglogtrento/'), '.',
    ]),
    voce('Distributori di carburante (impianti e prezzi): MIMIT, Osservaprezzi carburanti, dati aperti aggiornati ogni giorno', [['Open data carburanti del MIMIT', 'https://www.mimit.gov.it/it/open-data/elenco-dataset/carburanti-prezzi-praticati-e-anagrafica-degli-impianti'], ['Osservaprezzi carburanti', 'https://carburanti.mise.gov.it/ospzSearch/zona']], 'IODL 2.0'),
    voce('Uffici comunali (struttura, responsabili, sedi e contatti): sito istituzionale del Comune di Palermo, comune.palermo.it/amministrazione/uffici', [['Uffici del Comune di Palermo', 'https://www.comune.palermo.it/amministrazione/uffici']], 'CC BY 4.0'),
    voce('Fontanelle: AMAP S.p.A., fontanelle pubbliche di Palermo (elaborazione PalermoHub / OpenDataSicilia)', [['Dataset sul portale open data del Comune', 'https://opendata.comune.palermo.it/opendata-dataset.php?dataset=1249'], ['Libro delle fontane AMAP (PDF)', 'https://www.amapspa.it/wp-content/uploads/2019/07/Libro_Fontane_AMAP.pdf'], ['Progetto Fontanelle, onData', 'https://fontanelle.ondata.it/']], 'CC BY 4.0'),
    voce('Immobili dichiarati al MEF: Ministero dell\'economia e delle finanze, Dipartimento del Tesoro, Censimento degli immobili pubblici (beni dei comuni dichiarati dagli enti, ultimo anno pubblicato); poligoni degli edifici: Comune di Palermo, unità volumetriche CTC', [['Open data del censimento degli immobili pubblici', 'https://www.de.mef.gov.it/it/attivita_istituzionali/patrimonio_pubblico/censimento_immobili_pubblici/open_data_immobili/']], 'CC BY 4.0'),
    voce('Trend della popolazione: ISTAT, Censimento 2011 (dati e basi territoriali delle sezioni di censimento) e Censimento permanente 2021 e 2023 (dati per sezione); elaborazione DigitalTwin Palermo, con popolazione 2011 ripartita sulle aree attuali per sovrapposizione dei confini', [['ISTAT, Basi territoriali e variabili censuarie', 'https://www.istat.it/notizia/basi-territoriali-e-variabili-censuarie/'], ['ISTAT, Dati per sezioni di censimento', 'https://www.istat.it/notizia/dati-per-sezioni-di-censimento/']], 'CC BY 4.0'),
    voce('Pendolarismo da e verso Palermo: ISTAT, Censimento permanente della popolazione e delle abitazioni 2021, matrice di pendolarismo per lavoro tra comuni (dati al 31 dicembre 2021); elaborazione PalermoHub', [['ISTAT, Matrice di pendolarismo (Esplora dati)', 'https://esploradati.istat.it/databrowser/#/it/censpop/categories/IT1,Z1200CPA,1.0/MATRICE_PEND'], ['Mappa Pendolarismo 2021, PalermoHub', 'https://palermohub.github.io/Pendolarismo_2021/']], 'CC BY 4.0'),
    voce('Progetti del PNRR a Palermo: Italia Domani, Struttura di missione PNRR e Sogei, catalogo open data (localizzazione e progetti del PNRR); i progetti localizzati nella sola città di Palermo sono posizionati dagli indirizzi con i numeri civici ANNCSU e, per le scuole e il Comune, dalla sede (Indice delle Pubbliche Amministrazioni, AgID; layer Scuole del Comune di Palermo); elaborazione DigitalTwin Palermo', [['Catalogo open data di Italia Domani', 'https://www.italiadomani.gov.it/content/sogei-ng/it/it/catalogo-open-data.html'], ['Localizzazione dei progetti del PNRR (CSV)', 'https://www.italiadomani.gov.it/content/dam/sogei-ng/opendata/PNRR_Localizzazione.csv'], ['Progetti del PNRR, Missione 4 (CSV)', 'https://www.italiadomani.gov.it/content/dam/sogei-ng/opendata/PNRR_Progetti_M4.csv'], ['PNRR di Palermo su Cruscotto Italia (AGID)', 'https://cruscotto-italia.dati.gov.it/comune.html?istat=082053#pnrr'], ['ANNCSU, Archivio nazionale dei numeri civici', 'https://www.anncsu.gov.it/it/consultazione-dellarchivio/open-data/'], ['Indice delle Pubbliche Amministrazioni (IPA), AgID', 'https://indicepa.gov.it/ipa-dati/dataset/amministrazioni']], 'CC BY 4.0'),
    voce('Opere pubbliche a Palermo: Open BDAP, Ragioneria generale dello Stato, Monitoraggio Opere Pubbliche (MOP: progetti, titolari, importi e date di fase, localizzazione per comune); sono le opere localizzate nella sola città di Palermo, di qualunque titolare, posizionate dagli indirizzi con i numeri civici ANNCSU; elaborazione DigitalTwin Palermo', [['Progetti Opere Pubbliche MOP, Open BDAP', 'https://bdap-opendata.rgs.mef.gov.it/content/progetti-opere-pubbliche-mop-totale'], ['Open BDAP, Ragioneria generale dello Stato', 'https://bdap-opendata.rgs.mef.gov.it/'], ['Opere pubbliche di Palermo su Cruscotto Italia (AGID)', 'https://cruscotto-italia.dati.gov.it/comune.html?istat=082053#opere'], ['ANNCSU, Archivio nazionale dei numeri civici', 'https://www.anncsu.gov.it/it/consultazione-dellarchivio/open-data/']], 'CC BY (libero riuso citando la fonte)'),
    voce('Piano triennale dei lavori pubblici 2026-2028: Comune di Palermo, Programma triennale dei lavori pubblici (schede e allegati, Delibera di Consiglio comunale n. 553/2026: elenco degli interventi, scheda D, fonti di finanziamento, elenco annuale, quadro delle risorse); tabelle estratte dai PDF e geometrie ricavate dalle tavole del Programma da OpenDataSicilia con Claude AI; elaborazione DigitalTwin Palermo', [['Mappa del Piano triennale, OpenDataSicilia', 'https://opendatasicilia.github.io/piano_triennale_26_28/'], ['OpenCUP, Codici Unici di Progetto', 'https://www.opencup.gov.it/']], 'Atti pubblici del Comune di Palermo; estrazione e georeferenziazione con carattere informativo, senza valore legale'),
    voce('Distretti idrici: AMAP S.p.A., Palermo', [['Emergenza idrica, AMAP', 'https://www.amapspa.it/it/comunicazione/emergenza-idrica/'], ['Emergenza idrica in Sicilia, OpenDataSicilia', 'https://opendatasicilia.github.io/emergenza-idrica-sicilia/']], 'CC BY 4.0'),
    voce('Alberi monumentali: Ministero dell\'agricoltura, della sovranità alimentare e delle foreste (MASAF), Elenco degli alberi monumentali d\'Italia', [['Elenco degli alberi monumentali d\'Italia, MASAF', 'https://www.politicheagricole.it/flex/cm/pages/ServeBLOB.php/L/IT/IDPagina/11260'], ['Dove sono gli alberi monumentali d\'Italia?', 'https://medium.com/tantotanto/dove-sono-gli-alberi-monumentali-ditalia-ffd7d0d6d860']], 'CC BY 4.0'),
    voce('Monumenti: Portale del Turismo del Comune di Palermo (testi, foto e link) e «Mappa monumentale di Palermo e dell\'Agro Palermitano» di Marcello Petrucci (posizioni, testi e foto)', [['Mappa monumentale di Palermo, M. Petrucci', 'https://www.google.com/maps/d/viewer?mid=1BbwKWTf0ssw__JFLvYJAoVrZVDw']], 'CC BY 4.0'),
    voce('Isole di calore: temperatura superficiale da satellite Landsat (USGS), elaborazione PalermoHub / OpenDataSicilia, 2019–2025', [['USGS Landsat', 'https://www.usgs.gov/landsat-missions/landsat-science-products'], ['Dati su Zenodo', 'https://zenodo.org/records/18872933'], ['Isole di calore urbane 2019-2025', 'https://palermohub.github.io/isole_di_calore/']], 'CC BY 4.0'),
    voce('Pericolosità e rischio idrogeologico (PAI): Regione Siciliana, Piano di assetto idrogeologico, bacini 039-040', [['PAI, SITR Regione Siciliana', 'https://www.sitr.regione.sicilia.it/pai/'], ['Dati PAI aggiornati al 12/05/2026', 'https://www.sitr.regione.sicilia.it/dati-pai-idraulica-e-geomorfologia-aggiornati-al-12-05-2026/']]),
    voce('Incendi: catasto dei soprassuoli percorsi dal fuoco, Comune di Palermo e Sistema Informativo Forestale (SIF) della Regione Siciliana', [['SIF Regione Siciliana', 'https://sif.regione.sicilia.it/ilportale/']], null, ['CC BY 3.0 IT']),
    voce('Edificato 3D (edifici unificati): poligoni da tre fonti globali, Overture Maps Foundation, Global Building Atlas (DLR / TU München) e OpenBuildingMap (Awesome GEE Community Catalog), uniti con una pipeline di geoprocessing, (2026) e volumetria comunale del Comune di Palermo (2006)', [['Overture Maps Foundation', 'https://overturemaps.org/'], ['Global Building Atlas, DLR / TU München', 'https://tubvsig-so2sat-vm1.srv.mwn.de/'], ['OpenBuildingMap, Awesome GEE Community Catalog', 'https://gee-community-catalog.org/projects/obm/']]),
    voce('Ex Noviziato dei Crociferi in 3D: piante DWG, sezione e prospetti del Comune di Palermo, Settore Centro Storico; piante georeferenziate sulle unità volumetriche CTC e messe in quota piano per piano, elaborazione PalermoHub'),
    voce('Indicatori statistici comunali di Palermo (popolazione, censimento, imprese, ambiente e altro): AGID Cruscotto Italia, dati.gov.it', [['AGID Cruscotto Italia', 'https://cruscotto-italia.dati.gov.it/comune.html?istat=082053']], 'CC BY 4.0'),
  ]);
  return [...titoloPagina('Fonti e note', 'Da dove vengono i dati e cosa tenere presente quando li si usa.'), blocco('Fonti dei dati', fonti), blocco('Da sapere', elenco(AVVISI)), blocco('Simulazione del movimento dei mezzi di trasporto pubblico', elenco(SIMULAZIONI))];
}

export async function caricaCatalogo() {
  const r = await fetch(urlDati('catalogo.json'));
  if (!r.ok) throw new Error('catalogo.json non disponibile');
  return r.json();
}
