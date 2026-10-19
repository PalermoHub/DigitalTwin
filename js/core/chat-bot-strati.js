// Accende dai pulsanti del Chat bot i layer della barra degli strati: si spunta la loro casella (id «strato-<id>»)
// e si lancia «change», come farebbe il clic dell'utente.
const casella = (doc, id) => doc.getElementById(`strato-${id}`);

export function statoStrato(doc, id) {
  const c = casella(doc, id);
  if (!c) return null;
  const et = c.closest('label');
  return { nome: ((et?.innerText ?? et?.textContent) ?? id).trim().replace(/\s+/g, ' '), acceso: !!c.checked };
}

// true se l'ha acceso ora; false se era già acceso o non esiste
export function accendiStrato(doc, id) {
  const c = casella(doc, id);
  if (!c || c.checked) return false;
  c.checked = true;
  c.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}
