// js/rndt/pannello.js
// Pannello del catalogo RNDT: si sovrappone alla scheda del luogo (desktop) o al foglio basso (mobile). Ospita la UI del
// plugin, l'elenco dei layer aggiunti e fa rispettare l'area di Palermo sui controlli del plugin.
import { BBOX_PALERMO } from './area.js';

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}

// Il plugin disegna i suoi controlli quando serve: a ogni cambiamento del DOM si rimettono i limiti d'area.
function limitaArea(radice) {
  const dove = radice.querySelector('select[name="where"]');
  if (dove && !dove.dataset.palermo) {
    dove.dataset.palermo = '1';
    for (const o of [...dove.options]) if (o.value !== 'view' && o.value !== 'box') o.remove(); // niente «Anywhere» né forme disegnate
    dove.value = 'box';
    const box = radice.querySelector('[name="box"]');
    if (box) box.value = BBOX_PALERMO.join(', ');
    dove.dispatchEvent(new Event('change'));
  }
  for (const label of radice.querySelectorAll('label.ordt-check')) {
    if (!/Only features in the current map view/.test(label.textContent)) continue;
    const casella = label.querySelector('input');
    if (!casella || casella.disabled) continue;
    casella.checked = true;
    casella.disabled = true;
    label.title = 'Il download è sempre limitato all’area di Palermo';
  }
}

export function creaPannello(elemento) {
  const testata = el('header', 'rndt-testata');
  const indietro = el('button', 'rndt-indietro', '‹ Scheda');
  indietro.type = 'button';
  indietro.setAttribute('aria-label', 'Chiudi il catalogo e torna alla scheda');
  testata.append(indietro, el('h2', null, 'Catalogo RNDT · Palermo'));
  const elenco = el('details', 'rndt-layer');
  elenco.hidden = true;
  const contenuto = el('div', 'rndt-contenuto');
  contenuto.append(el('p', 'rndt-attesa', 'Caricamento del catalogo…'));
  elemento.append(testata, elenco, contenuto);

  let registrazione = null;
  let montato = false;
  let osservatore = null;

  function monta() {
    if (montato || !registrazione) return;
    montato = true;
    contenuto.replaceChildren();
    registrazione.render(contenuto);
    limitaArea(contenuto);
    osservatore = new MutationObserver(() => limitaArea(contenuto));
    osservatore.observe(contenuto, { childList: true, subtree: true });
  }

  const chiudi = () => { elemento.hidden = true; };
  const apri = () => { elemento.hidden = false; monta(); };
  indietro.addEventListener('click', chiudi);
  // Esc chiude prima il catalogo, poi (al secondo Esc) la scheda: il gestore della scheda sta in fase di bolla
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || elemento.hidden) return;
    e.stopPropagation();
    chiudi();
  }, true);

  return {
    registra(reg) { registrazione = reg; return () => { registrazione = null; }; },
    apri,
    chiudi,
    errore(testo) { contenuto.replaceChildren(el('p', 'rndt-errore', testo)); },
    // elenco dei layer aggiunti: visibilità e rimozione, sempre allineato all'host
    disegnaElenco(host) {
      const lista = host.elenco();
      elenco.hidden = !lista.length;
      const sommario = el('summary', null, `Layer aggiunti (${lista.length})`);
      const voci = lista.map(l => {
        const riga = el('div', 'rndt-layer-riga');
        const etichetta = el('label');
        const casella = el('input');
        casella.type = 'checkbox';
        casella.checked = l.visibile && !l.indisponibile;
        casella.disabled = l.indisponibile;
        casella.addEventListener('change', () => host.mostra(l.id, casella.checked));
        etichetta.append(casella, ' ', l.nome);
        if (l.indisponibile) etichetta.append(' ', el('em', null, '(non disponibile)'));
        else if (!l.salvato) etichetta.append(' ', el('em', null, '(solo questa sessione)'));
        else if (l.errore) etichetta.append(' ', el('em', null, '(errori di caricamento)'));
        const rimuovi = el('button', 'rndt-rimuovi', 'Rimuovi');
        rimuovi.type = 'button';
        rimuovi.addEventListener('click', () => host.elimina(l.id));
        riga.append(etichetta, rimuovi);
        return riga;
      });
      const aperto = elenco.open;
      elenco.replaceChildren(sommario, ...voci);
      elenco.open = aperto;
    },
  };
}
