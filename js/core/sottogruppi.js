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

// Titolo che governa il nodo `n`: l'ultimo titolo che lo precede.
const titoloDi = (figli, n) => figli.slice(0, figli.indexOf(n)).reverse().find(x => x.matches('h3.gruppo-sezione'));

// Applica lo stato dei titoli del gruppo: i nodi di un sottogruppo chiuso prendono la classe `sotto-chiuso` (display: none).
// `ignora`: ricerca in corso, niente resta nascosto (lo strato trovato deve vedersi). `riapri`: dopo un riordino, uno strato finito
// sotto un titolo chiuso lo riapre, così non sparisce.
export function aggiornaSottogruppi(gruppo, { ignora = false, riapri = false } = {}) {
  const figli = [...gruppo.children];
  const calcola = () => new Set(ignora ? [] : nascosti(figli, n => n.matches('h3.gruppo-sezione'), CHIUSO));
  let fuori = calcola();
  if (riapri) {
    for (const n of fuori) {
      if (n.classList.contains('sotto-chiuso')) continue; // era già nascosto: resta com'è
      titoloDi(figli, n)?.setAttribute('aria-expanded', 'true');
    }
    fuori = calcola();
  }
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
