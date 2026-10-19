import { svgIcona } from './icone.js';
import { collegaIngrandimento } from './ingrandisci.js';
import { schedaGuida, indiceLaterale } from './guida.js';
import { schedaGeoimage } from '../geoimage/guida.js';
import { t as tr } from './i18n.js';
import { el, traduciAlbero } from './pagina-info.js';
import { schedaComunita } from './scheda-about.js';
import { schedaFonti } from './scheda-fonti.js';
import { schedaPrivacy } from './scheda-privacy.js';
import { schedaDigitalTwin } from './scheda-digitaltwin.js';
import { schedaPluginCompleta } from './scheda-plugin.js';

export { caricaCatalogo } from './scheda-fonti.js';


// Avvolge una pagina di blocchi in un contenitore con l'indice laterale (un voce per ogni blocco con titolo h3).
// Un h2.guida-gruppo è anche intestazione di gruppo nell'indice; un {gruppo} semplice (non un nodo) è un'intestazione solo dell'indice,
// per un gruppo che nella pagina sarebbe una ripetizione del titolo.
function paginaConIndice(nodi) {
  const radice = el('div');
  const voci = [];
  for (const n of nodi) {
    if (!n.nodeType) { voci.push({ gruppo: n.gruppo }); continue; }
    radice.append(n);
    if (n.tagName === 'H2' && n.className === 'guida-gruppo') voci.push({ gruppo: n.textContent });
    else if (n.tagName === 'SECTION' && n.querySelector('h3')) voci.push({ titolo: n.querySelector('h3').textContent, sezione: n });
  }
  indiceLaterale(document, radice, voci);
  return radice;
}

// Pagina informativa a tutta larghezza (non modale): ogni voce del menu in testata ne apre una sezione;
// la stessa voce premuta di nuovo, o Esc, la chiude.
export function commutaCrediti(dialog, catalogo, moduli = [], tab = 'fonti') {
  if (dialog.open && dialog.dataset.tab === tab) return dialog.close();
  apriCrediti(dialog, catalogo, moduli, tab);
}

export function apriCrediti(dialog, catalogo, moduli = [], tab = 'fonti') {
  if (dialog.open && dialog.vaiA) return dialog.vaiA(tab);
  const guida = schedaGuida();
  const schede = [
    ['digitaltwin', 'Digital Twin', [paginaConIndice(schedaDigitalTwin())]],
    ['guida', 'Guida', [guida]],
    ['geoimage', 'Guida Geoimage', [schedaGeoimage()]],
    ['plugin', 'Plugin RNDT', [paginaConIndice(schedaPluginCompleta())]],
    ['fonti', 'Fonti e note', schedaFonti(catalogo)],
    ['privacy', 'Privacy', schedaPrivacy()],
    ['about', 'About', schedaComunita()],
  ];

  const pannelli = schede.map(([id, , contenuto]) => {
    const p = document.createElement('div');
    p.id = `tabpanel-${id}`;
    p.className = 'info-sezione';
    p.append(...contenuto);
    return p;
  });
  const vaiA = id => {
    const i = Math.max(0, schede.findIndex(([k]) => k === id));
    pannelli.forEach((p, k) => { p.hidden = k !== i; });
    dialog.dataset.tab = schede[i][0];
    dialog.dispatchEvent(new CustomEvent('scheda', { detail: schede[i][0] }));
    corpo.scrollTop = 0;
  };

  const corpo = document.createElement('div');
  corpo.className = 'tab-corpo';
  corpo.append(...pannelli);
  traduciAlbero(corpo); // le pagine sono scritte in italiano: in inglese ogni testo si traduce con le voci lbl.* dei dizionari
  const inCima = document.createElement('button');
  inCima.type = 'button';
  inCima.className = 'in-cima';
  inCima.hidden = true;
  inCima.setAttribute('aria-label', tr('catalogo.inCima'));
  inCima.title = tr('catalogo.inCima');
  inCima.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20V5M5.5 11.5 12 5l6.5 6.5"/></svg>';
  inCima.addEventListener('click', () => corpo.scrollTo({ top: 0, behavior: 'smooth' }));
  corpo.addEventListener('scroll', () => { inCima.hidden = corpo.scrollTop < 40; });
  const chiudi = document.createElement('button');
  chiudi.type = 'button';
  chiudi.className = 'crediti-x';
  chiudi.setAttribute('aria-label', tr('comune.chiudi'));
  chiudi.title = tr('comune.chiudi');
  chiudi.innerHTML = svgIcona('chiudi', 18);
  chiudi.addEventListener('click', () => dialog.close());
  dialog.replaceChildren(corpo, chiudi, inCima);
  collegaIngrandimento(corpo);
  dialog.vaiA = vaiA;
  if (!dialog.open) {
    // chi chiude il foglio torna dove era (il menu in testata): il focus non si perde nel nulla
    const apertoDa = document.activeElement;
    dialog.addEventListener('close', () => { if (apertoDa?.isConnected) apertoDa.focus?.({ preventScroll: true }); }, { once: true });
    dialog.show();
  }
  vaiA(tab);
}
