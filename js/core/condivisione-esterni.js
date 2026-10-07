// Dei layer aggiunti dall'utente nel link va solo ciò che il destinatario può riaprire da un indirizzo pubblico:
// niente file caricati, niente credenziali. Puro.

const NOME_SEGRETO = /token|api[-_]?key|^key$|pass|secret|auth|signature|^sig$/i;

// Indirizzo http(s) senza utente/password e senza parametri che sembrano segreti.
function indirizzoPubblico(valore) {
  try {
    const u = new URL(valore);
    if (!/^https?:$/.test(u.protocol) || u.username || u.password) return false;
    for (const nome of u.searchParams.keys()) if (NOME_SEGRETO.test(nome)) return false;
    return true;
  } catch {
    return false;
  }
}

const layerCondivisibile = l => Boolean(l) && typeof l.id === 'string' && typeof l.sorgente?.url === 'string' && indirizzoPubblico(l.sorgente.url);
const servizioCondivisibile = s => Boolean(s) && typeof s.id === 'string' && !s.utente && !s.conToken && indirizzoPubblico(s.url);

function filtra(valore, campo, ok) {
  const elenco = valore && typeof valore === 'object' && Array.isArray(valore[campo]) ? valore[campo] : null;
  if (!elenco) return { valore: null, scartati: 0 };
  const tenuti = elenco.filter(ok);
  return { valore: tenuti.length ? { ...valore, [campo]: tenuti } : null, scartati: elenco.length - tenuti.length };
}

export function condivisibili(chiave, valore) {
  if (chiave === 'dt:rndt:v1' || chiave === 'dt:miei:v1') return filtra(valore, 'layers', layerCondivisibile);
  if (chiave === 'dt:miei:servizi:v1') return filtra(valore, 'servizi', servizioCondivisibile);
  return { valore, scartati: 0 };
}
