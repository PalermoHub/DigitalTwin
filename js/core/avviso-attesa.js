// Avviso «caricamento in corso» per i dati che arrivano in ritardo (layer differiti): compare solo se l'attesa dura
// più di `ritardo` (niente lampi per un caricamento rapido) e sparisce da solo quando finiscono tutte le attese aperte.
export function creaAvvisoAttesa(contenitore, testo, { ritardo = 400, creaNodo = () => document.createElement('div') } = {}) {
  let aperte = 0;
  let nodo = null;
  let timer = null;
  const mostra = () => {
    timer = null;
    if (nodo || !aperte) return;
    nodo = creaNodo();
    nodo.className = 'avviso-attesa';
    nodo.textContent = testo;
    contenitore.append(nodo);
  };
  const fine = () => {
    if (--aperte > 0) return;
    clearTimeout(timer);
    timer = null;
    nodo?.remove();
    nodo = null;
  };
  return {
    // Segue la promessa senza cambiarne l'esito: l'avviso resta finché una qualunque attesa è aperta.
    durante(promessa) {
      aperte++;
      timer ??= nodo ? null : setTimeout(mostra, ritardo);
      const p = Promise.resolve(promessa);
      p.then(fine, fine);
      return p;
    },
  };
}
