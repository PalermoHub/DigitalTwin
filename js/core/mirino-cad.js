// «Mirino CAD»: due assi a tutto schermo che seguono il mouse sulla mappa, come il puntatore di AutoCAD.
// Spento di default; l'interruttore sta nel tab Opzioni, la scelta resta in localStorage.
import { t } from './i18n.js';

export const CHIAVE_MIRINO = 'dt-mirino';
export const EVENTO_MIRINO = 'dt:mirino'; // sul document a ogni cambio: l'interruttore si allinea

let attivo = true;
export const mirinoAttivo = () => attivo;

export function impostaMirino(v, storage = null) {
  attivo = Boolean(v);
  try { storage?.setItem(CHIAVE_MIRINO, attivo ? '1' : '0'); } catch { /* storage bloccato: vale la sessione */ }
  document.dispatchEvent(new Event(EVENTO_MIRINO));
  return attivo;
}

// Stessa forma degli altri interruttori del gruppo Overlay (`occhio` crea l'icona).
export function creaInterruttoreMirino(occhio, storage = null) {
  const etichetta = document.createElement('label');
  etichetta.classList.add('strato', 'interruttore-tip');
  const casella = Object.assign(document.createElement('input'), { type: 'checkbox', id: 'interruttore-mirino', checked: attivo });
  casella.dataset.filtro = 'mirino'; // non è uno strato: non va nei conteggi degli strati accesi
  casella.addEventListener('change', () => impostaMirino(casella.checked, storage));
  document.addEventListener(EVENTO_MIRINO, () => { casella.checked = attivo; });
  etichetta.append(casella, occhio(), ' ', t('mirino.interruttore'));
  return etichetta;
}

export function collegaMirino(map, storage = null) {
  let salvato = null;
  try { salvato = storage?.getItem(CHIAVE_MIRINO); } catch { /* storage bloccato */ }
  attivo = salvato !== '0'; // acceso di default
  const contenitore = map.getContainer();
  const x = document.createElement('div'), y = document.createElement('div');
  x.className = 'cad-asse cad-x'; y.className = 'cad-asse cad-y';
  for (const l of [x, y]) { l.hidden = true; l.setAttribute('aria-hidden', 'true'); contenitore.append(l); }
  // gli assi restano nell'area libera della mappa, non passano sopra i pannelli (la mappa sta sotto di loro)
  const limita = () => {
    const p = map.getPadding();
    x.style.left = `${p.left}px`; x.style.right = `${p.right}px`;
    y.style.top = `${p.top}px`; y.style.bottom = `${p.bottom}px`;
  };
  const mostra = on => { x.hidden = y.hidden = !on; };
  const applica = () => { map.getCanvas().classList.toggle('con-cad', attivo); if (!attivo) mostra(false); };
  document.addEventListener(EVENTO_MIRINO, applica);
  applica();
  document.dispatchEvent(new Event(EVENTO_MIRINO)); // allinea l'interruttore se è già stato creato
  map.on('mousemove', e => {
    if (!attivo || e.originalEvent?.pointerType === 'touch' || map.getCanvas().classList.contains('cad-pan')) return;
    limita();
    x.style.top = `${e.point.y}px`; y.style.left = `${e.point.x}px`;
    mostra(true);
  });
  // mentre si trascina la mappa il puntatore torna quello del pan (mano) e gli assi spariscono; al rilascio ricompaiono col mouse
  const inizia = () => { map.getCanvas().classList.add('cad-pan'); mostra(false); };
  const finisci = () => map.getCanvas().classList.remove('cad-pan');
  map.on('moveend', limita); // dopo un clic il mouse è fermo ma la scheda si è aperta: i limiti vanno rifatti
  map.on('dragstart', inizia);
  map.on('dragend', finisci);
  // lo stesso per rotazione e inclinazione col mouse; quelle fatte dal codice (flyTo, pulsante 3D) non contano
  for (const gesto of ['rotate', 'pitch']) {
    map.on(`${gesto}start`, e => { if (e.originalEvent) inizia(); });
    map.on(`${gesto}end`, e => { if (e.originalEvent) finisci(); });
  }
  contenitore.addEventListener('mouseleave', () => mostra(false));
}
