// I chip degli strati accesi (in alto a sinistra) non devono finire sotto la barra degli strumenti: se uno la tocca,
// tutta la fila scende a 10 px sotto il bordo inferiore delle icone della barra (e si allarga fino al bordo destro);
// altrimenti resta al suo posto.

export const DISTANZA = 10;

// rettangoli {left, right, top, bottom}: quelli dei chip alla quota normale e quelli delle icone della barra
export function sovrapposti(chip, icone) {
  return chip.some(c => icone.some(b => c.left < b.right && c.right > b.left && c.top < b.bottom && c.bottom > b.top));
}

// Riposiziona la fila: prima la riporta alla quota del CSS, poi misura; `top` nello stile solo se serve.
export function evitaBarra(fila, barra) {
  if (!fila || !barra) return;
  fila.style.top = fila.style.right = '';
  if (!fila.children.length || getComputedStyle(barra).display === 'none') return;
  const icone = [...barra.querySelectorAll('button')].filter(b => !b.hidden && b.offsetParent).map(b => b.getBoundingClientRect());
  const chip = [...fila.children].map(c => c.getBoundingClientRect());
  if (!icone.length || !sovrapposti(chip, icone)) return;
  const sotto = Math.max(...icone.map(r => r.bottom));
  const ora = fila.getBoundingClientRect().top;
  fila.style.top = `${parseFloat(getComputedStyle(fila).top) + sotto + DISTANZA - ora}px`;
  fila.style.right = 'calc(var(--scheda-l) + 12px)'; // i18n-ok: CSS. Sotto la barra c'è tutta la larghezza: ci stanno più chip
}

// Ricalcolo quando cambiano i chip, la barra (si sposta con la scheda aperta) o la finestra.
export function collegaChipBarra(fila, barra) {
  if (!fila || !barra) return () => {};
  let atteso = 0;
  const aggiorna = () => { cancelAnimationFrame(atteso); atteso = requestAnimationFrame(() => evitaBarra(fila, barra)); };
  new MutationObserver(aggiorna).observe(fila, { childList: true });
  new ResizeObserver(aggiorna).observe(barra);
  barra.addEventListener('transitionend', aggiorna);
  window.addEventListener('resize', aggiorna);
  aggiorna();
  return aggiorna;
}
