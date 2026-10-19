import { el, titoloPagina, blocco, link, AUTORE_URL, PLUGIN_URL } from './pagina-info.js';

// Testi della pagina «Chi siamo» di opendatasicilia.it, riscritti con lo stile dell'app.
export function schedaComunita() {
  const sezione = blocco;
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
  const segnala = el('p');
  segnala.append(link('Apri una segnalazione su GitHub', 'https://github.com/PalermoHub/DigitalTwin/issues'));
  const sviluppo = el('p');
  sviluppo.append('Web app progettata e sviluppata da ', link('@gbvitrano', 'https://www.linkedin.com/in/gbvitrano'), ' in collaborazione con ',
    link('Claude AI (Anthropic)', 'https://www.anthropic.com/claude'),
    ', che ha affiancato le scelte architetturali, l\u2019ottimizzazione del codice e lo sviluppo delle funzionalità di visualizzazione geospaziale.');
  return [
    ...titoloPagina('About', 'La comunità OpenDataSicilia, che promuove i dati aperti in Sicilia.'),
    sezione('Che cos\u2019è', el('p', '#opendatasicilia è un\u2019iniziativa civica che si propone di far conoscere e diffondere la cultura dell\u2019open government e le prassi dell\u2019open data nel nostro territorio e aprire una discussione pubblica partecipata.')),
    sezione('Chi siamo', el('p', 'Siamo un gruppo di cittadini con diverse storie, competenze, professioni. Siamo accomunati dalla genuina volontà di contribuire a migliorare la qualità della vita della nostra comunità. Lo vogliamo fare con spirito di collaborazione e concretezza.')),
    sezione('Dove siamo', el('p', 'Ci trovi in questi luoghi:'), dove),
    sezione('Collabora e segnala', el('p', 'Hai trovato un errore nei dati, qualcosa che non funziona o hai un\u2019idea per migliorare il sito? Segnalalo aprendo una issue su GitHub (basta un account gratuito): indica cosa stavi facendo, il livello o la mappa interessata e, se puoi, allega uno screenshot. Anche chi vuole contribuire con dati, correzioni o codice è il benvenuto.'), segnala),
    el('h2', 'Credits', { className: 'pagina-sezione' }),
    sezione('Sviluppo', sviluppo),
    ...strumentiUsati(sezione),
  ];
}

// «Strumenti usati»: schede degli strumenti e delle librerie che hanno reso possibile il lavoro.
function strumentiUsati(sezione) {
  const p = (...parti) => {
    const e = el('p');
    e.append(...parti);
    return e;
  };
  const qgis = sezione('QGIS Headless WSL2',
    p('QGIS senza interfaccia grafica su Windows Subsystem for Linux 2 (WSL2): consente di eseguire algoritmi QGIS Processing e codice PyQGIS da terminale o pipeline di automazione, senza aprire il desktop. Qui è servito ad automatizzare l’elaborazione dei dati delle varie mappe: ', el('strong', '18 layer morfologici'), ' derivati dal DTM a 5 m (', link('Palermo DTM 5m', 'https://github.com/coseerobe/palermo_dtm_5m'), '), il grafo stradale, le isole di calore e molto altro.'),
    p(link('Repository GitHub', 'https://github.com/pigreco/qgis_headless_wsl2'), ' · ', link('Video tutorial', 'https://www.youtube.com/watch?v=FQEmhktDRaQ'), ' · ', link('Pagina originale', 'https://gbvitrano.github.io/palermo_popolazione/')),
    p('Guida di ', link('Totò Fiandaca', 'https://www.linkedin.com/in/salvatore-fiandaca-23a1a250/'), ' (', link('@pigreco71', 'https://www.linkedin.com/in/salvatore-fiandaca-23a1a250/'), ') ❤️'));
  const colori = sezione('Scientific colour maps',
    p('Sono le scale colore scientifiche di Fabio Crameri: rampe di colore «percettivamente uniformi», in cui a uguali variazioni del dato corrispondono uguali variazioni visive. Si leggono bene anche con deficit nella visione dei colori e in stampa in bianco e nero, a differenza di arcobaleni come «jet», che creano false bande e deformano i valori.'),
    p('Sono usate qui per colorare i layer per attributo (sequenziali, divergenti e categoriche). Mapshaper le include dalla versione 0.7.75: 12 scale sequenziali (batlow, batlowW, acton, bamako, bilbao, davos, devon, lajolla, lapaz, oslo, tokyo, turku), 5 divergenti (bam, broc, cork, roma, vik) e 1 categorica (batlowS).'),
    p(link('Sito di Fabio Crameri', 'https://www.fabiocrameri.ch/colourmaps/'), ' · ', link('Mapshaper e i colori di Crameri', 'https://claude.ai/artifact/FrXh66VWcJu5BTsDq29BPe')),
    p('Consigliata dall’Influencer ', link('@aborruso', AUTORE_URL), ' ❤️'));
  const mappa = sezione('MapLibre GL JS e librerie della mappa',
    p(link('MapLibre GL JS', 'https://maplibre.org/'), ' (4.7.1, licenza BSD a tre clausole) disegna la mappa nel browser, con strati vettoriali, raster e rilievo. ', link('PMTiles', 'https://github.com/protomaps/PMTiles'), ' (Protomaps) permette di servire interi insiemi di dati da un unico file statico, senza un server di tile.'),
    p('Per i file caricati dagli utenti: ', link('shpjs', 'https://github.com/calvinmetcalf/shapefile-js'), ' (Shapefile), ', link('@tmcw/togeojson', 'https://github.com/placemark/togeojson'), ' (KML e GPX), ', link('JSZip', 'https://stuk.github.io/jszip/'), ' e ', link('fflate', 'https://github.com/101arrowz/fflate'), ' (archivi zip e KMZ), ', link('proj4js', 'http://proj4js.org/'), ' (cambio di sistema di riferimento).'),
    p('Il link all’Atlante storico usa il formato dell’indirizzo di ', link('leaflet-hash', 'https://github.com/mlevans/leaflet-hash'), ' (#zoom/lat/lon), così l’atlante si apre sulla zona che si sta guardando. Il catalogo RNDT è il plugin ', link('openrndt-geolibre', PLUGIN_URL), ' (v. 0.3.1) di Andrea Borruso (onData).'));
  const base = sezione('Mappe e dati di base',
    p(link('OpenFreeMap', 'https://openfreemap.org/'), ' fornisce la base cartografica vettoriale, con dati di ', link('OpenStreetMap', 'https://www.openstreetmap.org/copyright'), ' (© contributori di OpenStreetMap, ODbL). Le mappe storiche sono georeferenziate con ', link('Map Warper', 'https://mapwarper.net/'), ' e raccolte nell’', link('Atlante delle carte tecniche storiche di Palermo', 'https://palermohub.opendatasicilia.it/index_atlante_iframe.html'), '.'),
    p('Il font è ', link('Montserrat', 'https://fonts.google.com/specimen/Montserrat'), ' (Julieta Ulanovsky, licenza SIL OFL), servito dal sito stesso.'));
  const sviluppoStrumenti = sezione('Strumenti di sviluppo',
    p('Il codice della webapp è JavaScript puro, senza framework né passaggi di compilazione. I dati sono preparati con script ', link('Python', 'https://www.python.org/'), ' e con QGIS (vedi sopra); la pubblicazione è su ', link('GitHub Pages', 'https://pages.github.com/'), ' e l’inoltro delle richieste verso servizi esterni passa da un ', link('Cloudflare Worker', 'https://workers.cloudflare.com/'), '.'),
    p('Test con il runner integrato di ', link('Node.js', 'https://nodejs.org/'), ' e con ', link('Playwright', 'https://playwright.dev/'), ' (anche per rigenerare gli screenshot della Guida); video e immagini con ', link('FFmpeg', 'https://ffmpeg.org/'), '. Il progetto è stato sviluppato con l’aiuto di ', link('Claude Code', 'https://claude.com/claude-code'), ' (Anthropic).'));
  return [el('h2', 'Strumenti usati', { className: 'pagina-sezione' }), mappa, qgis, colori, base, sviluppoStrumenti];
}
