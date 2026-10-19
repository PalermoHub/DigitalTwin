// Apre dai pulsanti del Chat bot il tab di un pannello: «sinistra:<id>» è il tab della barra degli strati (btn-gruppo-<id>),
// «destra:<id>» quello della barra dei pannelli (rail-tab con data-pannello). Si clicca il tab solo se il pannello non è già aperto.
const selettore = (lato, id) => (lato === 'sinistra' ? `#btn-gruppo-${id}` : lato === 'destra' ? `#rail-pannelli .rail-tab[data-pannello="${id}"]` : null);
const aperto = (tab, lato) => tab.getAttribute(lato === 'sinistra' ? 'aria-expanded' : 'aria-pressed') === 'true';

// null se il tab non c'è in questa versione dell'app
export function tabPannello(doc, voce) {
  const [lato, id] = voce.split(':');
  const s = selettore(lato, id);
  const tab = s && doc.querySelector(s);
  if (!tab) return null;
  return { lato, nome: (tab.getAttribute('aria-label') ?? tab.title ?? id).trim() };
}

export function apriPannello(doc, voce) {
  const [lato, id] = voce.split(':');
  const s = selettore(lato, id);
  const tab = s && doc.querySelector(s);
  if (!tab) return false;
  if (!aperto(tab, lato)) tab.click();
  return true;
}
