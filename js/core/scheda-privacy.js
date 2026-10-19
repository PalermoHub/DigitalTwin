import { el, titoloPagina, blocco, link, elenco } from './pagina-info.js';

// Informativa sintetica ai sensi del Regolamento (UE) 2016/679 (GDPR) e della direttiva ePrivacy.
export function schedaPrivacy() {
  return [...titoloPagina('Privacy', 'Come sono trattati i dati personali di chi usa il sito (Regolamento UE 2016/679).'), blocco('Informativa sul trattamento dei dati',
    el('p', 'La mappa non richiede registrazione e non raccoglie dati personali con moduli. I dati mostrati (catasto, popolazione, uffici…) sono pubblici; i contatti degli uffici sono quelli pubblicati dal Comune di Palermo.'),
    elenco([
      ['Statistiche di accesso: il sito usa ', link('Google Analytics', 'https://policies.google.com/technologies/partner-sites'), ' (Google Ireland Ltd., UE) per contare le visite in forma aggregata, solo se si accetta il banner di consenso (nulla viene caricato prima). Google può impostare cookie e trattare l’indirizzo IP e informazioni sul dispositivo; i dati possono essere trasferiti anche fuori dall’UE secondo le garanzie del Data Privacy Framework.'],
      'Sul vostro dispositivo restano solo la scelta del tema chiaro o scuro, la cache offline dell’app (service worker) e, per chi li usa, gli strati caricati dal proprio computer o da un servizio indicato (IndexedDB). Nulla di questo viene inviato a noi.',
      'Utente e password dei servizi protetti si tengono solo in memoria, per la sessione: non vengono salvati.',
      'Servizi esterni contattati dal browser: base cartografica OpenFreeMap, video su YouTube in modalità «privacy avanzata» (youtube-nocookie.com, solo se si preme Play), e un proxy su Cloudflare Workers per interrogare i cataloghi RNDT. Ognuno vede l’indirizzo IP di chi si collega, come in ogni richiesta web.',
      ['Diritti: ai sensi degli artt. 15–22 del GDPR si può chiedere accesso, rettifica, cancellazione, limitazione e opposizione al trattamento; reclami al ', link('Garante per la protezione dei dati personali', 'https://www.garanteprivacy.it/'), '.'],
      ['Titolare del trattamento: ', link('OpenDataSicilia', 'https://opendatasicilia.it/'), '. Contatto per le richieste sui dati personali: ', link('discussioni di OpenDataSicilia su GitHub', 'https://github.com/opendatasicilia/opendatasicilia.it/discussions'), ' oppure la pagina ', link('opendatasicilia.it', 'https://opendatasicilia.it/'), '.'],
    ]),
    el('button', 'Gestisci il consenso alle statistiche', { type: 'button', className: 'btn-consenso', onclick: () => window.dtConsenso?.riapri() }))];
}
