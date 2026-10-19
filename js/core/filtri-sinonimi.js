// Parole che l'utente può scrivere nel Chat bot al posto del nome di una voce di legenda, per i layer i cui filtri si leggono
// dalla legenda (core/filtri-chat.js, daLegenda): { <id strato>: { titoli: [titolo di ogni gruppo], sinonimi: { <nome voce>: [parole] }, colora: <selettore dei pulsanti «Colora per», uno per gruppo> } }.
// Il nome della voce (senza il conteggio fra parentesi) e le sue parti separate da « · » sono già riconosciuti.
export const SINONIMI = {
  peba: { colora: '.peba-modo button' }, // premere una voce di un gruppo colora la mappa per quel gruppo
  distributori: {
    titoli: ['Marchio', 'Carburante'], // i18n-ok
    sinonimi: {
      'Agip Eni': ['eni', 'agip'], 'Api-Ip': ['api', 'ip'], 'Pompe Bianche': ['bianche', 'pompa bianca', 'no logo', 'indipendenti', 'white pumps', 'independent', 'unbranded'], // i18n-ok
      Benzina: ['verde', 'senza piombo', 'petrol', 'gasoline', 'unleaded'], Gasolio: ['diesel'], GPL: ['gpl', 'lpg'], Metano: ['gas', 'methane', 'cng'], // i18n-ok
    },
  },
  opere: {
    sinonimi: {
      'Infrastrutture sociali': ['sociali', 'sociale', 'social'], 'Infrastrutture di trasporto': ['trasporti', 'trasporto', 'strade', 'transport', 'roads'], // i18n-ok
      'Ambiente e risorse idriche': ['ambiente', 'acqua', 'idriche', 'idrico', 'environment', 'water'], Energia: ['energetico', 'energetiche', 'energy'], // i18n-ok
      'Istruzione e formazione': ['istruzione', 'scuola', 'scuole', 'formazione', 'education', 'school', 'schools', 'training'], 'Telecomunicazioni e informatica': ['telecomunicazioni', 'informatica', 'internet', 'telecommunications'], // i18n-ok
    },
  },
  pnrr: {
    sinonimi: {
      'M1 · Digitalizzazione, innovazione, competitività, cultura e turismo': ['digitalizzazione', 'turismo', 'cultura', 'digitalisation', 'digitization', 'tourism', 'culture'], // i18n-ok
      'M2 · Rivoluzione verde e transizione ecologica': ['verde', 'transizione ecologica', 'ambiente', 'green', 'ecological transition', 'environment'], // i18n-ok
      'M3 · Infrastrutture per una mobilità sostenibile': ['mobilità', 'mobilita', 'trasporti', 'mobility', 'transport'], // i18n-ok
      'M4 · Istruzione e ricerca': ['istruzione', 'scuola', 'scuole', 'ricerca', 'education', 'school', 'schools', 'research'], // i18n-ok
      'M5 · Inclusione e coesione': ['inclusione', 'coesione', 'sociale', 'inclusion', 'cohesion', 'social'], // i18n-ok
      'M6 · Salute': ['salute', 'sanità', 'sanita', 'ospedali', 'health', 'hospitals'], // i18n-ok
    },
  },
  scuole: { sinonimi: { 'Asilo nido': ['asili', 'nidi', 'asilo', 'nursery', 'nurseries', 'kindergarten'], 'Plesso scolastico': ['plessi', 'plesso', 'school complex', 'schools'], "Sede dell'istituto": ['istituti', 'istituto', 'institute', 'institutes'] } }, // i18n-ok
};
