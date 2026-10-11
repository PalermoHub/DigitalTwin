// Sottogruppi pieghevoli del pannello «Layer»: il titolo (h3.gruppo-sezione) di un gruppo condiviso si apre e si chiude, e chiuso
// nasconde gli strati (e ciò che li accompagna: opacità, filtri) fino al titolo successivo.

// Nodi da nascondere, dato l'elenco dei figli di un gruppo (funzioni `eTitolo(nodo)` e `chiuso(titolo)` per restare testabile senza DOM).
export function nascosti(nodi, eTitolo, chiuso) {
  const fuori = [];
  let nascondi = false;
  for (const n of nodi) {
    if (eTitolo(n)) nascondi = chiuso(n);
    else if (nascondi) fuori.push(n);
  }
  return fuori;
}

const CHIUSO = n => n.getAttribute('aria-expanded') === 'false';

// Applica lo stato dei titoli del gruppo: i nodi di un sottogruppo chiuso prendono la classe `sotto-chiuso` (display: none).
export function aggiornaSottogruppi(gruppo) {
  const figli = [...gruppo.children];
  const fuori = new Set(nascosti(figli, n => n.matches('h3.gruppo-sezione'), CHIUSO));
  for (const n of figli) n.classList.toggle('sotto-chiuso', fuori.has(n));
}

// Rende pieghevoli i titoli di sottogruppo del gruppo.
export function rendiPieghevoli(gruppo) {
  const titoli = [...gruppo.querySelectorAll(':scope > h3.gruppo-sezione')];
  for (const h of titoli) {
    h.tabIndex = 0;
    h.setAttribute('role', 'button');
    h.setAttribute('aria-expanded', 'true');
    const alterna = () => {
      h.setAttribute('aria-expanded', String(CHIUSO(h)));
      aggiornaSottogruppi(gruppo);
    };
    h.addEventListener('click', alterna);
    h.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alterna(); } });
  }
}
