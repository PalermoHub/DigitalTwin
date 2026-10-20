// «Cosa puoi chiedermi»: esempi di domande per tipo, che Talia sa risolvere. Ogni esempio è una chiave dei dizionari (IT/EN) e, toccato, si invia come domanda.
// Gli esempi sono quelli che le azioni (chat-bot-azioni.js, filtri-parole.js, ricerca-mappa.js) e la ricerca dei luoghi riconoscono davvero.
export const GRUPPI_AIUTO = [
  { id: 'trova', esempi: ['teatro', 'indirizzo', 'zona', 'particella'] },
  { id: 'vicino', esempi: ['colonnina', 'fermata'] },
  { id: 'numeri', esempi: ['fontanelle', 'popoloso', 'abitanti'] },
  { id: 'filtri', esempi: ['pnrr', 'incidenti'] },
  { id: 'app', esempi: ['attivi', 'scheda', 'pai'] },
];

// [{ id, titolo, esempi: [testo] }] con i testi già tradotti; `t` è la funzione di traduzione
export const vociAiuto = t => GRUPPI_AIUTO.map(g => ({
  id: g.id, titolo: t(`chatbot.aiuto.${g.id}`), esempi: g.esempi.map(e => t(`chatbot.aiuto.${g.id}.${e}`)),
}));

// un esempio a caso per il segnaposto del campo (cambia a ogni apertura, così se ne scoprono di diversi)
export const esempioCasuale = (voci, caso = Math.random) => {
  const tutti = voci.flatMap(v => v.esempi);
  return tutti[Math.floor(caso() * tutti.length)] ?? '';
};
