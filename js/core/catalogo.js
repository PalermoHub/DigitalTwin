import { urlDati } from './config.js';
import { schedaArgomenti } from './argomenti.js';
import { schedaGuida, passiRndt } from './guida.js';
import { schedaGeoimage } from '../geoimage/guida.js';

const AVVISI = [
  'Catasto, zonizzazione PRG e vincoli sono solo informativi e non hanno valore legale: per usi legali servono il certificato di destinazione urbanistica e le visure ufficiali.',
  'Il PRG vigente è la Variante generale 2004: varianti puntuali successive potrebbero non essere incluse.',
  'I dati del censimento 2023 sono stime campionarie (censimento permanente): i valori per sezione non sono conteggi esatti.',
  'La popolazione per edificio è una stima.',
];

export async function caricaCatalogo() {
  const r = await fetch(urlDati('catalogo.json'));
  if (!r.ok) throw new Error('catalogo.json non disponibile');
  return r.json();
}

const PLUGIN_URL = 'https://github.com/ondata/openrndt-geolibre';
const AUTORE_URL = 'https://www.linkedin.com/in/andreaborruso/';

function el(tag, testo, attr = {}) {
  return Object.assign(document.createElement(tag), testo != null ? { textContent: testo } : {}, attr);
}

function link(testo, href) {
  return el('a', testo, { href, target: '_blank', rel: 'noopener' });
}

// Testo del post LinkedIn «Palermo Digital Twin… work in progress», con le immagini del carosello a seguire.
function schedaDigitalTwin() {
  const fig = (n, alt) => el('img', null, { className: 'dt-fig', src: `img/dt/dt-${n}.jpg`, alt, loading: 'lazy', width: 1920, height: 1072 });
  const sezione = (titolo, testi, ...figure) => {
    const s = el('section', null, { className: 'dt-blocco' });
    s.append(el('h3', titolo), ...testi.map(t => el('p', t)), ...figure);
    return s;
  };
  return [
    el('h2', 'Palermo Digital Twin'),
    sezione('Cos\u2019è per noi un Digital Twin, in parole semplici', [
      'Il Digital Twin di Palermo è una copia digitale della città, costruita con dati pubblici e consultabile da chiunque. Non richiede competenze tecniche.',
      'Non è una semplice mappa, riunisce in un unico spazio informazioni che di solito sono sparse in archivi diversi.',
    ], fig('01', 'Palermo in Trasparenza: il gemello digitale della città, una guida visiva ai dati aperti di Open Data Sicilia')),
    sezione('Come è organizzato', [
      'La città è rappresentata a strati, sovrapposti come i fogli trasparenti di un atlante. Alla base c\u2019è la mappa di Palermo. Sopra si trovano il catasto, il piano regolatore, la popolazione, gli edifici e i monumenti, i trasporti la sicurezza stradale e tanto altro.',
    ], fig('02', 'La città stratificata: Palermo, Catasto e PRG, Popolazione, Edifici e Monumenti, Trasporto e Sicurezza'),
    fig('03', 'L\u2019anatomia della piattaforma: strati, legenda e scheda di dettaglio')),
    sezione('Le fonti', [
      'Ogni strato proviene da una fonte aperta, Comune di Palermo, Regione Siciliana, ISTAT, Agenzia delle Entrate, OpenStreetMap. Singolarmente, sono file e tabelle di difficile lettura. Messi insieme sulla stessa mappa, diventano comprensibili. \u{1F601}',
    ], fig('05', 'L\u2019ecosistema dei dati pubblici: Comune di Palermo, Regione Siciliana, ISTAT, Agenzia delle Entrate, OpenStreetMap')),
    sezione('Come si utilizza', [
      'La consultazione può partire dall\u2019intera città oppure da una via, da un numero civico o da una particella catastale. Si possono attivare soltanto gli strati di interesse, così da avere una mappa chiara e non sovraccarica.',
      'Selezionando un punto, si apre una scheda con tutte le informazioni che lo riguardano, la particella catastale, vincoli, zonizzazione, gli incidenti avvenuti nelle vicinanze, la fermata del trasporto pubblico più vicina, l\u2019eventuale presenza di un monumento, una colonnina di ricarica per auto elettrica, etc etc.',
    ], fig('04', 'Dall\u2019intera città al singolo civico: ricerca libera, filtri geografici, risultato mirato'),
    fig('09', 'La potenza dell\u2019intersezione: un clic su Via Maqueda 435 mostra catasto, vincoli, sicurezza, cultura e trasporti')),
    sezione('A cosa serve', [
      'Un singolo clic non restituisce un solo dato, ma l\u2019insieme di ciò che si sovrappone in quel luogo. Per ottenere lo stesso quadro, è necessario rivolgersi a più uffici e/o consultare più siti.',
    ], fig('06', 'Le lenti a confronto: urbanistica, sicurezza, servizi e rischi, con strato principale e caso d\u2019uso civico'),
    fig('07', 'Esplorare il patrimonio: monumenti e uffici comunali'),
    fig('08', 'Mappare la vulnerabilità: rischio idrogeologico e storico incendi dal 2007')),
    sezione('Quali sono i limiti', [
      'Il Digital Twin è uno strumento per informarsi, studiare e capire la città. Non sostituisce i documenti ufficiali. Catasto, Piano Regolatore e vincoli hanno qui valore puramente informativo e non hanno valore legale. Per una visura o per un certificato di destinazione urbanistica occorre rivolgersi a SISTER o agli uffici competenti.',
      'Anche i dati sulla popolazione per singolo edificio sono stime campionarie e vanno letti come indicazioni, non come conteggi esatti.',
    ], fig('10', 'Oltre la mappa, il perimetro di utilizzo: valore informativo e valore legale')),
  ];
}

// Testi della pagina «Chi siamo» di opendatasicilia.it, riscritti con lo stile dell'app.
function schedaComunita() {
  const sezione = (titolo, ...contenuto) => {
    const s = el('section', null, { className: 'about-blocco' });
    s.append(el('h3', titolo), ...contenuto);
    return s;
  };
  const dove = el('ul');
  for (const [prima, testo, href] of [
    ['la ', 'mailing list', 'https://groups.google.com/d/forum/opendatasicilia'],
    ['il gruppo ', 'Facebook', 'https://www.facebook.com/groups/opendatasicilia/'],
    ['l\u2019account ', 'Twitter', 'https://twitter.com/opendatasicilia'],
    ['il gruppo ', 'Telegram', 'https://t.me/opendatasicilia'],
    ['GitHub ', 'Discussions', 'https://github.com/opendatasicilia/opendatasicilia.it/discussions'],
  ]) {
    const li = el('li');
    li.append(prima, link(testo, href));
    dove.append(li);
  }
  const sviluppo = el('p');
  sviluppo.append('Web app progettata e sviluppata da ', link('@gbvitrano', 'https://www.linkedin.com/in/gbvitrano'), ' in collaborazione con ',
    link('Claude AI (Anthropic)', 'https://www.anthropic.com/claude'),
    ', che ha affiancato le scelte architetturali, l\u2019ottimizzazione del codice e lo sviluppo delle funzionalità di visualizzazione geospaziale.');
  return [
    el('h2', 'La comunità OpenDataSicilia'),
    sezione('Che cos\u2019è', el('p', '#opendatasicilia è un\u2019iniziativa civica che si propone di far conoscere e diffondere la cultura dell\u2019open government e le prassi dell\u2019open data nel nostro territorio e aprire una discussione pubblica partecipata.')),
    sezione('Chi siamo', el('p', 'Siamo un gruppo di cittadini con diverse storie, competenze, professioni. Siamo accomunati dalla genuina volontà di contribuire a migliorare la qualità della vita della nostra comunità. Lo vogliamo fare con spirito di collaborazione e concretezza.')),
    sezione('Dove siamo', el('p', 'Ci trovi in questi luoghi:'), dove),
    el('h2', 'Credits'),
    sezione('Sviluppo', sviluppo),
  ];
}

function lista(voci) {
  const ul = el('ul');
  for (const v of voci) ul.append(el('li', v));
  return ul;
}

// Tab «Plugin RNDT»: spiega in parole semplici cosa fa il catalogo e dà il merito all'autore del plugin.
function schedaPlugin() {
  const merito = el('div', null, { className: 'plugin-merito' });
  merito.append(
    el('p', 'Un lavoro di Andrea Borruso', { className: 'plugin-merito-titolo' }),
    (() => {
      const p = el('p');
      p.append('Il catalogo RNDT di questa mappa si basa interamente sul plugin ', link('openrndt-geolibre', PLUGIN_URL),
        ', ideato e scritto da ', link('Andrea Borruso', AUTORE_URL), ' (', link('onData', 'https://github.com/ondata'), '). ',
        'Senza il suo lavoro questa funzione non esisterebbe: l’ho solo adattata a questo progetto.');
      return p;
    })(),
    el('p', 'Grazie alla sua ottima architettura è stato possibile adattarlo con pochissimi interventi: il plugin nasceva per un’altra applicazione di mappe, ma è pensato così bene da poter essere ospitato anche qui senza riscriverlo.'),
  );
  return [
    el('h2', 'Plugin RNDT'),
    merito,
    el('h3', 'Cos’è l’RNDT'),
    el('p', 'Il Repertorio Nazionale dei Dati Territoriali (RNDT) è il catalogo ufficiale italiano dei dati geografici: raccoglie le schede di migliaia di mappe e dati pubblicati da Comuni, Regioni, ministeri, enti parco, agenzie e altri enti. È un po’ come una biblioteca: dice che cosa esiste, chi lo ha prodotto e dove si può consultare.'),
    el('h3', 'Cosa fa questo plugin'),
    lista([
      'Cerca nel catalogo nazionale per parola, tema, ente che ha pubblicato il dato, data e tipo di dato.',
      'Per ogni risultato mostra la scheda: titolo, descrizione, ente responsabile e servizi disponibili.',
      'Aggiunge alla mappa i servizi di mappe che trova: WMS (immagini della mappa, come un livello da sovrapporre) e WFS (i dati veri e propri, con le informazioni sugli oggetti).',
      'Scarica i dati WFS in formato GeoJSON, così si possono vedere e interrogare direttamente sulla mappa.',
    ]),
    el('h3', 'Come si usa'),
    lista([
      'Apri la scheda di un luogo e premi l’icona del catalogo RNDT, in alto accanto all’ingranaggio: il pannello si sovrappone alla scheda.',
      'Scrivi cosa cerchi (per esempio «idrografia», «rischio frane», «zone protette») e, se vuoi, filtra per tipo o per ente.',
      'Scegli un risultato, poi il servizio (WMS o WFS) e premi per aggiungerlo: compare come nuovo strato sulla mappa.',
      'Con il tab «Scheda» nella barra a destra (o con il tasto Esc) chiudi il catalogo e torni alla scheda: gli strati aggiunti restano sulla mappa.',
    ]),
    el('h3', 'Strati aggiunti'),
    lista([
      'In cima al pannello c’è l’elenco «Layer aggiunti»: puoi mostrarli, nasconderli o rimuoverli.',
      'Gli strati si ricordano da una visita all’altra, in questo browser. Se un servizio non risponde più, resta nell’elenco segnato come «non disponibile» e non viene cancellato.',
      'Cliccando un punto della mappa, la scheda mostra anche le informazioni degli strati RNDT attivi in quel punto, nel tab «Altri dati (RNDT)».',
    ]),
    el('h3', 'Cosa è stato adattato per Palermo'),
    lista([
      'La ricerca e i download sono sempre limitati all’area di Palermo: non si può cercare «in tutta Italia».',
      'I servizi pubblici spesso non permettono l’uso da altri siti web: un piccolo servizio intermedio (proxy) li rende raggiungibili, con controlli di sicurezza su indirizzi e dimensioni.',
      'Gli strati molto densi (come le particelle catastali) si vedono meglio con il WMS: il download WFS ha un tetto di 10.000 oggetti.',
    ]),
    el('h3', 'Dove saperne di più'),
    (() => {
      const p = el('p');
      p.append('Codice, istruzioni e segnalazioni: ', link('github.com/ondata/openrndt-geolibre', PLUGIN_URL),
        '. Autore: ', link('Andrea Borruso su LinkedIn', AUTORE_URL), '.');
      return p;
    })(),
  ];
}

const LICENZE = {
  'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/deed.it',
  'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/deed.it',
  'CC BY 3.0 IT': 'https://creativecommons.org/licenses/by/3.0/it/legalcode',
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
  [/Censimento permanente 2023/, [['Cruscotto Statistico Comunale (Palermo)', 'https://cruscotto-italia.dati.gov.it/comune.html?istat=082053#censimento']]],
  [/ISTAT/, [['ISTAT, Basi territoriali e variabili censuarie', 'https://www.istat.it/notizia/basi-territoriali-e-variabili-censuarie/'], ['Popolazione residente a Palermo, open data del Comune', 'https://opendata.comune.palermo.it/opendata-archivio-dataset.php?tag=POPOLAZIONE%20RESIDENTE']]],
];

function linkCatalogo(fonte) {
  return (LINK_CATALOGO.find(([re]) => re.test(fonte)) ?? [null, []])[1];
}

function elenco(voci) {
  const ul = document.createElement('ul');
  for (const t of voci) {
    const li = document.createElement('li');
    li.append(...[t].flat()); // una voce è una stringa o un elenco di stringhe e nodi (per i link)
    ul.append(li);
  }
  return ul;
}

// Pagina informativa a tutta larghezza (non modale): ogni voce del menu in testata ne apre una sezione;
// la stessa voce premuta di nuovo, o Esc, la chiude.
export function commutaCrediti(dialog, catalogo, moduli = [], tab = 'fonti') {
  if (dialog.open && dialog.dataset.tab === tab) return dialog.close();
  apriCrediti(dialog, catalogo, moduli, tab);
}

export function apriCrediti(dialog, catalogo, moduli = [], tab = 'fonti') {
  if (dialog.open && dialog.vaiA) return dialog.vaiA(tab);
  const fonti = elenco([
    ...catalogo.filter(v => v.fonte).map(v => voce(`${v.fonte} (${v.data})`, linkCatalogo(v.fonte), v.licenza)),
    voce('Base cartografica: OpenFreeMap, © OpenMapTiles, dati © OpenStreetMap contributors', [['OpenFreeMap', 'https://openfreemap.org/'], ['OpenStreetMap', 'https://www.openstreetmap.org/copyright']]),
    voce('Carte tecniche (CSG 2k 1989/91, CTC 2k 2007/09, CTR 10k 2012/13): SiciliaHub / PalermoHub, Comune di Palermo e Regione Siciliana (SITR)', [['SITR Regione Siciliana', 'https://www.sitr.regione.sicilia.it/?page_id=419'], ['Geocatalogo del Comune di Palermo', 'https://geocatalog.comune.palermo.it/geonetwork/srv/ita/catalog.search#/metadata/25562f02-587f-49ca-b5b6-21018efe7c78'], ['Atlante delle carte tecniche', 'https://palermohub.opendatasicilia.it/index_atlante_iframe.html']]),
    ['Mappe storiche (1580–1993): ', link('Atlante delle carte tecniche storiche di Palermo', 'https://palermohub.opendatasicilia.it/index_atlante_iframe.html'), ', OpenDataSicilia (A. Borruso, F. P. Paolicelli, C. Spataro, G. B. Vitrano), georeferenziate su ', link('Map Warper', 'https://mapwarper.net/'), ' — ', ...licenza('CC BY 4.0'), '; le fonti originali (BnF Gallica, Library of Congress, Harvard Map Collection, U.S. Army Map Service, Comune di Palermo) sono indicate nell\'attribuzione di ogni mappa. Fonte dati: ', link('Dataset del Comune di Palermo', 'https://opendata.comune.palermo.it/opendata-dataset.php?dataset=1287'), ', ', link('SITR', 'https://www.sitr.regione.sicilia.it/geoportale/it/Metadata/Details/784'), ', ', link('Repertorio cartografico CRICD', 'https://www.cricd.it/'), ', ', link('University of Texas, Perry-Castañeda Library Map Collection', 'https://legacy.lib.utexas.edu/maps/ams/italy_city_plans/')],
    voce('Scuole, asili comunali e sedi delle sezioni elettorali: Comune di Palermo, dati aperti (2017) — condizioni d\'uso da verificare', [['Anagrafe edilizia scolastica, MIUR (scuole)', 'http://www.miur.gov.it/web/guest/-/scuola-online-i-dati-aggiornati-dell-anagrafe-dell-edilizia'], ['Open data del Comune di Palermo', 'https://opendata.comune.palermo.it/index.php']], null, ['IODL 2.0']),
    voce('Trasporto pubblico (linee, fermate, orari): AMAT Palermo S.p.A., feed GTFS valido dal 25/08/2026 al 31/10/2026 — condizioni d\'uso da verificare', [['Progetto OpenAMAT', 'https://github.com/openamat/Products/tree/master/data']]),
    voce('Sicurezza stradale: incidenti 2015–2023 del Comune di Palermo (Polizia Municipale), rete stradale © OpenStreetMap contributors, elaborazione PalermoHub / OpenDataSicilia (studio «Rete stradale») — condizioni d\'uso da verificare', [['Sinistri 2022, open data del Comune', 'https://opendata.comune.palermo.it/opendata-dataset.php?dataset=1713'], ['Dataset sugli incidenti di Palermo su dati.gov.it', 'https://www.dati.gov.it/view-dataset?Cerca=incidenti+palermo'], ['OpenStreetMap', 'https://www.openstreetmap.org/copyright']]),
    voce('Colonnine di ricarica: GSE, Piattaforma Unica Nazionale (PUN), serie storica PalermoHub/evcharginglogsicilia, stato aggiornato in continuo', [['Piattaforma Unica Nazionale', 'https://www.piattaformaunicanazionale.it/'], ['EV Charging Log Sicilia', 'https://palermohub.github.io/evcharginglogsicilia/'], ['Rete di ricarica, onData', 'https://github.com/ondata/rete_ricarica_veicoli_elettrici']], 'CC BY 4.0'),
    voce('Uffici comunali (struttura, responsabili, sedi e contatti): sito istituzionale del Comune di Palermo, comune.palermo.it/amministrazione/uffici — condizioni d\'uso da verificare', [['Uffici del Comune di Palermo', 'https://www.comune.palermo.it/amministrazione/uffici']]),
    voce('Fontanelle: AMAP S.p.A., fontanelle pubbliche di Palermo (elaborazione PalermoHub / OpenDataSicilia) — condizioni d\'uso da verificare', [['Dataset sul portale open data del Comune', 'https://opendata.comune.palermo.it/opendata-dataset.php?dataset=1249'], ['Libro delle fontane AMAP (PDF)', 'https://www.amapspa.it/wp-content/uploads/2019/07/Libro_Fontane_AMAP.pdf'], ['Progetto Fontanelle, onData', 'https://fontanelle.ondata.it/']]),
    voce('Distretti idrici: AMAP S.p.A., Palermo — condizioni d\'uso da verificare', [['Emergenza idrica, AMAP', 'https://www.amapspa.it/it/comunicazione/emergenza-idrica/'], ['Emergenza idrica in Sicilia, OpenDataSicilia', 'https://opendatasicilia.github.io/emergenza-idrica-sicilia/']]),
    voce('Alberi monumentali: Ministero dell\'agricoltura, della sovranità alimentare e delle foreste (MASAF), Elenco degli alberi monumentali d\'Italia — condizioni d\'uso da verificare', [['Elenco degli alberi monumentali d\'Italia, MASAF', 'https://www.politicheagricole.it/flex/cm/pages/ServeBLOB.php/L/IT/IDPagina/11260'], ['Dove sono gli alberi monumentali d\'Italia?', 'https://medium.com/tantotanto/dove-sono-gli-alberi-monumentali-ditalia-ffd7d0d6d860']]),
    voce('Monumenti: Portale del Turismo del Comune di Palermo (testi, foto e link) e «Mappa monumentale di Palermo e dell\'Agro Palermitano» di Marcello Petrucci (posizioni, testi e foto) — condizioni d\'uso da verificare', [['Mappa monumentale di Palermo, M. Petrucci', 'https://www.google.com/maps/d/viewer?mid=1BbwKWTf0ssw__JFLvYJAoVrZVDw']]),
    voce('Isole di calore: temperatura superficiale da satellite Landsat (USGS), elaborazione PalermoHub / OpenDataSicilia, 2019–2025', [['USGS Landsat', 'https://www.usgs.gov/landsat-missions/landsat-science-products'], ['Dati su Zenodo', 'https://zenodo.org/records/18872933'], ['Isole di calore urbane 2019-2025', 'https://palermohub.github.io/isole_di_calore/']], 'CC BY 4.0'),
    voce('Pericolosità e rischio idrogeologico (PAI): Regione Siciliana, Piano di assetto idrogeologico, bacini 039-040', [['PAI, SITR Regione Siciliana', 'https://www.sitr.regione.sicilia.it/pai/'], ['Dati PAI aggiornati al 12/05/2026', 'https://www.sitr.regione.sicilia.it/dati-pai-idraulica-e-geomorfologia-aggiornati-al-12-05-2026/']]),
    voce('Incendi: catasto dei soprassuoli percorsi dal fuoco, Comune di Palermo e Sistema Informativo Forestale (SIF) della Regione Siciliana', [['SIF Regione Siciliana', 'https://sif.regione.sicilia.it/ilportale/']], null, ['CC BY 3.0 IT']),
  ]);
  const argomenti = schedaArgomenti(moduli);
  const guida = schedaGuida();
  const schede = [
    ['digitaltwin', 'Digital Twin', schedaDigitalTwin()],
    ['argomenti', 'Argomenti', [argomenti.elemento]],
    ['guida', 'Guida', [guida]],
    ['geoimage', 'Guida Geoimage', [schedaGeoimage()]],
    ['plugin', 'Plugin RNDT', [...schedaPlugin(), ...passiRndt()]],
    ['fonti', 'Fonti e avvisi', [Object.assign(document.createElement('h2'), { textContent: 'Fonti e avvisi' }), elenco(AVVISI), fonti]],
    ['about', 'About', schedaComunita()],
  ];

  const pannelli = schede.map(([id, , contenuto]) => {
    const p = document.createElement('div');
    p.id = `tabpanel-${id}`;
    p.className = 'info-sezione';
    p.append(...contenuto);
    return p;
  });
  const aggiorna = () => argomenti.sincronizza();
  const vaiA = id => {
    const i = Math.max(0, schede.findIndex(([k]) => k === id));
    pannelli.forEach((p, k) => { p.hidden = k !== i; });
    dialog.dataset.tab = schede[i][0];
    dialog.dispatchEvent(new CustomEvent('scheda', { detail: schede[i][0] }));
    aggiorna();
    corpo.scrollTop = 0;
  };

  const corpo = document.createElement('div');
  corpo.className = 'tab-corpo';
  corpo.append(...pannelli);
  const inCima = document.createElement('button');
  inCima.type = 'button';
  inCima.className = 'in-cima';
  inCima.hidden = true;
  inCima.textContent = '↑ In cima';
  inCima.addEventListener('click', () => corpo.scrollTo({ top: 0, behavior: 'smooth' }));
  corpo.addEventListener('scroll', () => { inCima.hidden = corpo.scrollTop < 40; });
  const chiudi = document.createElement('button');
  chiudi.type = 'button';
  chiudi.className = 'crediti-x';
  chiudi.setAttribute('aria-label', 'Chiudi');
  chiudi.title = 'Chiudi';
  chiudi.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
  chiudi.addEventListener('click', () => dialog.close());
  dialog.replaceChildren(corpo, chiudi, inCima);
  dialog.vaiA = vaiA;
  // le caselle del pannello possono cambiare a foglio aperto (il foglio non è modale)
  const ctl = new AbortController();
  document.getElementById('pannello')?.addEventListener('change', aggiorna, { signal: ctl.signal });
  dialog.addEventListener('close', () => ctl.abort(), { once: true });
  if (!dialog.open) dialog.show();
  vaiA(tab);
}
