import { el, titoloPagina, blocco, link, AUTORE_URL, PLUGIN_URL } from './pagina-info.js';
import { passiRndt } from './guida.js';

function lista(voci) {
  const ul = el('ul');
  for (const v of voci) ul.append(el('li', v));
  return ul;
}

// Tab «Plugin RNDT» (il testo di «Un lavoro di Andrea Borruso» è anche in MERITO_PLUGIN, guida-contenuti.js): spiega in parole semplici cosa fa il catalogo e dà il merito all'autore del plugin.
export function schedaPlugin() {
  const merito = blocco('Un lavoro di Andrea Borruso',
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
    ...titoloPagina('Plugin RNDT', 'Il catalogo nazionale dei dati territoriali, direttamente sulla mappa.'),
    { gruppo: 'Plugin' }, // solo nell'indice: nella pagina sarebbe una ripetizione del titolo «Plugin RNDT»
    merito,
    blocco('Cos’è l’RNDT', el('p', 'Il Repertorio Nazionale dei Dati Territoriali (RNDT) è il catalogo ufficiale italiano dei dati geografici: raccoglie le schede di migliaia di mappe e dati pubblicati da Comuni, Regioni, ministeri, enti parco, agenzie e altri enti. È un po’ come una biblioteca: dice che cosa esiste, chi lo ha prodotto e dove si può consultare.')),
    blocco('Cosa fa questo plugin', lista([
      'Cerca nel catalogo nazionale per parola, tema, ente che ha pubblicato il dato, data e tipo di dato.',
      'Per ogni risultato mostra la scheda: titolo, descrizione, ente responsabile e servizi disponibili.',
      'Aggiunge alla mappa i servizi di mappe che trova: WMS (immagini della mappa, come un livello da sovrapporre) e WFS (i dati veri e propri, con le informazioni sugli oggetti).',
      'Scarica i dati WFS in formato GeoJSON, così si possono vedere e interrogare direttamente sulla mappa.',
    ])),
    blocco('Come si usa', lista([
      'Apri la scheda di un luogo e premi l’icona del catalogo RNDT, in alto accanto all’ingranaggio: il pannello si sovrappone alla scheda.',
      'Scrivi cosa cerchi (per esempio «idrografia», «rischio frane», «zone protette») e, se vuoi, filtra per tipo o per ente.',
      'Scegli un risultato, poi il servizio (WMS o WFS) e premi per aggiungerlo: compare come nuovo strato sulla mappa.',
      'Con il tab «Scheda» nella barra a destra (o con il tasto Esc) chiudi il catalogo e torni alla scheda: gli strati aggiunti restano sulla mappa.',
    ])),
    blocco('Strati aggiunti', lista([
      'In cima al pannello c’è l’elenco «Layer aggiunti»: puoi mostrarli, nasconderli o rimuoverli.',
      'Gli strati si ricordano da una visita all’altra, in questo browser. Se un servizio non risponde più, resta nell’elenco segnato come «non disponibile» e non viene cancellato.',
      'Cliccando un punto della mappa, la scheda mostra anche le informazioni degli strati RNDT attivi in quel punto, nel tab «Altri dati (RNDT)».',
    ])),
    blocco('Cosa è stato adattato per Palermo', lista([
      'La ricerca e i download sono sempre limitati all’area di Palermo: non si può cercare «in tutta Italia».',
      'I servizi pubblici spesso non permettono l’uso da altri siti web: un piccolo servizio intermedio (proxy) li rende raggiungibili, con controlli di sicurezza su indirizzi e dimensioni.',
      'Gli strati molto densi (come le particelle catastali) si vedono meglio con il WMS: il download WFS ha un tetto di 10.000 oggetti.',
    ])),
    blocco('Dove saperne di più', (() => {
      const p = el('p');
      p.append('Codice, istruzioni e segnalazioni: ', link('github.com/ondata/openrndt-geolibre', PLUGIN_URL),
        '. Autore: ', link('Andrea Borruso su LinkedIn', AUTORE_URL), '.');
      return p;
    })()),
  ];
}

// La pagina completa: la scheda del plugin, poi i casi d'uso (passi RNDT) sotto il gruppo «Casi d'uso».
export function schedaPluginCompleta() {
  return [...schedaPlugin(), el('h2', 'Casi d\'uso', { className: 'guida-gruppo' }), ...passiRndt()];
}
