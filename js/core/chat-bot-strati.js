// Accende e spegne dai pulsanti del Chat bot i layer della barra degli strati: si spunta la loro casella (id «strato-<id>»)
// e si lancia «change», come farebbe il clic dell'utente.
const casella = (doc, id) => doc.getElementById(`strato-${id}`);

export function statoStrato(doc, id) {
  const c = casella(doc, id);
  if (!c) return null;
  const et = c.closest('label');
  return { nome: ((et?.innerText ?? et?.textContent) ?? id).trim().replace(/\s+/g, ' '), acceso: !!c.checked };
}

// Inverte la casella: true se ora è acceso, false se ora è spento, null se il layer non esiste
export function commutaStrato(doc, id) {
  const c = casella(doc, id);
  if (!c) return null;
  c.checked = !c.checked;
  if (c.dataset) { if (c.checked) c.dataset.legendaMappa = '1'; else delete c.dataset.legendaMappa; } // la legenda si vede sulla mappa
  c.dispatchEvent(new Event('change', { bubbles: true }));
  return c.checked;
}

// Porta lo strato (acceso o da accendere) a legenda sulla mappa; true se ora è acceso.
export function accendiConLegenda(doc, id) {
  const c = casella(doc, id);
  if (!c) return null;
  if (!c.checked) return commutaStrato(doc, id);
  if (c.dataset) c.dataset.legendaMappa = '1';
  c.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}
