import { rispondi, domandeIniziali, anteprima, caricaIndice } from './chat-bot-ricerca.js';

// Stato della conversazione del Chat bot, senza DOM: l'interfaccia (chat-bot.js) lo disegna e chiama chiedi()/commuta().
// Messaggi: presentazione | utente | scheda { luogo, blocchi } | risposta { voce, breve, cEAltro, espansa, oggetti } | luoghi { oggetti } | indirizzo { oggetti } | nonLoSo { vicine } | errore.
// `azioni(testo)` risponde con i dati dell'app (layer accesi, punto più vicino, conteggi, popolazione) o null: messaggio `azione { testo, oggetti, strati }`.
// `cercaOggetti(testo)` trova per nome i luoghi della mappa e gli indirizzi (come la barra di ricerca): ognuno ha il suo pulsante per aprirne la scheda.
// Un indirizzo (`indirizzo: true`) trovato da solo si apre subito con `apri(oggetto)`: la scheda racconta cosa c'è nei dintorni.
export function creaConversazione({ carica = caricaIndice, cercaOggetti = async () => [], azioni = async () => null, apri = () => {}, suCambio = () => {} } = {}) {
  const messaggi = [];
  let indice = null;
  let n = 0;
  const stato = { messaggi, suggerite: [] };
  const aggiungi = m => {
    // presentazione e domande suggerite servono solo all'avvio: con qualunque altro messaggio (domanda, racconto della scheda) spariscono
    if (m.tipo !== 'presentazione') {
      const iniziale = messaggi.findIndex(x => x.tipo === 'presentazione');
      if (iniziale >= 0) messaggi.splice(iniziale, 1);
    }
    messaggi.push({ id: ++n, ...m });
    suCambio();
  };

  const leggi = async () => indice ??= await carica();

  return Object.assign(stato, {
    async pulisci() { // ricomincia: l'indice resta in memoria, non si riscarica
      messaggi.length = 0;
      stato.suggerite = [];
      await stato.avvia();
    },
    async avvia() {
      aggiungi({ tipo: 'presentazione' });
      try { stato.suggerite = domandeIniziali(await leggi()); suCambio(); } catch { /* l'errore si mostra alla prima domanda */ }
    },
    async chiedi(testo) {
      const domanda = (testo ?? '').trim();
      if (!domanda) return;
      aggiungi({ tipo: 'utente', testo: domanda });
      const fatta = await azioni(domanda).catch(() => null);
      if (fatta) { aggiungi({ tipo: 'azione', ...fatta }); return; }
      let voci;
      try { voci = await leggi(); } catch { aggiungi({ tipo: 'errore' }); return; }
      const { trovate, vicine } = rispondi(voci, domanda);
      const oggetti = await cercaOggetti(domanda).catch(() => []);
      const indirizzi = oggetti.filter(o => o.indirizzo);
      if (!trovate.length && indirizzi.length) {
        aggiungi({ tipo: 'indirizzo', oggetti: indirizzi });
        if (indirizzi.length === 1) apri(indirizzi[0]);
        return;
      }
      if (!trovate.length) { aggiungi(oggetti.length ? { tipo: 'luoghi', oggetti } : { tipo: 'nonLoSo', vicine }); return; }
      const { breve, c_e_altro: cEAltro } = anteprima(trovate[0].testo);
      aggiungi({ tipo: 'risposta', voce: trovate[0], breve, cEAltro, espansa: false, oggetti, domanda });
    },
    // la scheda del luogo raccontata in frasi semplici (core/scheda-parole.js): { luogo, blocchi }
    racconta(dettaglio) { aggiungi({ tipo: 'scheda', ...dettaglio }); },
    commuta(id) {
      const m = messaggi.find(x => x.id === id);
      if (m?.tipo !== 'risposta') return;
      m.espansa = !m.espansa;
      suCambio();
    },
  });
}
