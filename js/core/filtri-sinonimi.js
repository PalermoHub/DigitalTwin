// Parole che l'utente può scrivere nel Chat bot al posto del nome di una voce di legenda, per i layer i cui filtri si leggono
// dalla legenda (core/filtri-chat.js, daLegenda): { <id strato>: { titoli: [titolo di ogni gruppo], sinonimi: { <nome voce>: [parole] }, colora: <selettore dei pulsanti «Colora per», uno per gruppo> } }.
// Il nome della voce (senza il conteggio fra parentesi) e le sue parti separate da « · » sono già riconosciuti.
export const SINONIMI = {
  peba: { colora: '.peba-modo button' }, // premere una voce di un gruppo colora la mappa per quel gruppo
  distributori: {
    titoli: ['Marchio', 'Carburante'], // i18n-ok
    sinonimi: {
      'Agip Eni': ['eni', 'agip'], 'Api-Ip': ['api', 'ip'], 'Pompe Bianche': ['bianche', 'pompa bianca', 'no logo', 'indipendenti'], // i18n-ok
      Benzina: ['verde', 'senza piombo'], Gasolio: ['diesel'], GPL: ['gpl'], Metano: ['gas'], // i18n-ok
    },
  },
  opere: {
    sinonimi: {
      'Infrastrutture sociali': ['sociali', 'sociale'], 'Infrastrutture di trasporto': ['trasporti', 'trasporto', 'strade'], // i18n-ok
      'Ambiente e risorse idriche': ['ambiente', 'acqua', 'idriche', 'idrico'], Energia: ['energetico', 'energetiche'], // i18n-ok
      'Istruzione e formazione': ['istruzione', 'scuola', 'scuole', 'formazione'], 'Telecomunicazioni e informatica': ['telecomunicazioni', 'informatica', 'internet'], // i18n-ok
    },
  },
  pnrr: {
    sinonimi: {
      'M1 · Digitalizzazione, innovazione, competitività, cultura e turismo': ['digitalizzazione', 'turismo', 'cultura'], // i18n-ok
      'M2 · Rivoluzione verde e transizione ecologica': ['verde', 'transizione ecologica', 'ambiente'], // i18n-ok
      'M3 · Infrastrutture per una mobilità sostenibile': ['mobilità', 'mobilita', 'trasporti'], // i18n-ok
      'M4 · Istruzione e ricerca': ['istruzione', 'scuola', 'scuole', 'ricerca'], // i18n-ok
      'M5 · Inclusione e coesione': ['inclusione', 'coesione', 'sociale'], // i18n-ok
      'M6 · Salute': ['salute', 'sanità', 'sanita', 'ospedali'], // i18n-ok
    },
  },
  scuole: { sinonimi: { 'Asilo nido': ['asili', 'nidi', 'asilo'], 'Plesso scolastico': ['plessi', 'plesso'], "Sede dell'istituto": ['istituti', 'istituto'] } }, // i18n-ok
};
