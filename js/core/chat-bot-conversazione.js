import { rispondi, domandeIniziali, anteprima, caricaIndice } from './chat-bot-ricerca.js';

// Stato della conversazione del Chat bot, senza DOM: l'interfaccia (chat-bot.js) lo disegna e chiama chiedi()/commuta().
// Messaggi: presentazione | utente | risposta { voce, breve, cEAltro, espansa, oggetti } | luoghi { oggetti } | nonLoSo { vicine } | errore.
// `cercaOggetti(testo)` trova per nome i luoghi della mappa (come la barra di ricerca): ognuno ha il suo pulsante per aprirne la scheda.
export function creaConversazione({ carica = caricaIndice, cercaOggetti = async () => [], suCambio = () => {} } = {}) {
  const messaggi = [];
  let indice = null;
  let n = 0;
  const stato = { messaggi, suggerite: [] };
  const aggiungi = m => { messaggi.push({ id: ++n, ...m }); suCambio(); };

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
      let voci;
      try { voci = await leggi(); } catch { aggiungi({ tipo: 'errore' }); return; }
      const { trovate, vicine } = rispondi(voci, domanda);
      const oggetti = await cercaOggetti(domanda).catch(() => []);
      if (!trovate.length) { aggiungi(oggetti.length ? { tipo: 'luoghi', oggetti } : { tipo: 'nonLoSo', vicine }); return; }
      const { breve, c_e_altro: cEAltro } = anteprima(trovate[0].testo);
      aggiungi({ tipo: 'risposta', voce: trovate[0], breve, cEAltro, espansa: false, oggetti });
    },
    commuta(id) {
      const m = messaggi.find(x => x.id === id);
      if (m?.tipo !== 'risposta') return;
      m.espansa = !m.espansa;
      suCambio();
    },
  });
}
