// Apre dai pulsanti del Chat bot il tab di un pannello: «sinistra:<id>» è il tab della barra degli strati (btn-gruppo-<id>),
// «destra:<id>» quello della barra dei pannelli (rail-tab con data-pannello). Si clicca il tab solo se il pannello non è già aperto.
// Su telefono (`mobile`) le barre laterali non ci sono: i pannelli di destra si aprono dai loro pulsanti nel foglio «Aggiungi»
// (btn-<id>-m) e quelli di sinistra non hanno un pulsante proprio (l'elenco dei layer RNDT sta in cima al catalogo).
const RAIL = id => `#rail-pannelli .rail-tab[data-pannello="${id}"]`;
const MOBILE = { rndt: '#btn-rndt-m', geoimage: '#btn-geoimage-m', tema: '#btn-tema-ui-m', chatbot: '#btn-chatbot-m' };
const aperto = (tab, lato) => tab.getAttribute(lato === 'sinistra' ? 'aria-expanded' : 'aria-pressed') === 'true';

// `tab`: dove si legge lo stato; `clic`: cosa si clicca per aprire
function bersagli(doc, voce, mobile) {
  const [lato, id] = voce.split(':');
  if (lato === 'sinistra' && !mobile) { const tab = doc.querySelector(`#btn-gruppo-${id}`); return tab && { lato, tab, clic: tab }; }
  if (lato === 'destra') {
    const tab = doc.querySelector(RAIL(id));
    const clic = mobile ? doc.querySelector(MOBILE[id] ?? '#senza-pulsante-mobile') : tab;
    return tab && clic && { lato, tab, clic };
  }
  return null;
}

// null se il tab non c'è in questa versione dell'app
export function tabPannello(doc, voce, mobile = false) {
  const b = bersagli(doc, voce, mobile);
  if (!b) return null;
  return { lato: mobile ? 'mobile' : b.lato, nome: (b.tab.getAttribute('aria-label') ?? b.tab.title ?? voce.split(':')[1]).trim() };
}

export function apriPannello(doc, voce, mobile = false) {
  const b = bersagli(doc, voce, mobile);
  if (!b) return false;
  if (!aperto(b.tab, b.lato)) b.clic.click();
  return true;
}
