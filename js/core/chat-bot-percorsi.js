// Percorsi guidati della home (js/core/home-percorsi.json) attivati dai pulsanti del Chat bot: si accendono, con la legenda sulla mappa,
// tutti gli strati del percorso (quelli che nell'app ci sono); un secondo clic li spegne. Se il percorso ha una vista, la mappa vi si porta.
import { statoStrato, accendiConLegenda, commutaStrato } from './chat-bot-strati.js';

// Gli strati del percorso presenti nell'app e se sono tutti accesi
export function statoPercorso(doc, strati) {
  const presenti = strati.filter(id => statoStrato(doc, id));
  return { presenti, acceso: presenti.length > 0 && presenti.every(id => statoStrato(doc, id).acceso) };
}

// Accende il percorso (true) o, se era già tutto acceso, lo spegne (false); null se nell'app non c'è nessuno dei suoi strati
export function commutaPercorso(doc, strati) {
  const { presenti, acceso } = statoPercorso(doc, strati);
  if (!presenti.length) return null;
  if (acceso) { for (const id of presenti) commutaStrato(doc, id); return false; }
  for (const id of presenti) accendiConLegenda(doc, id);
  return true;
}

// vista = [lng, lat, zoom, bearing, pitch], come nel campo `c` dei link condivisi
export function portaAllaVista(mappa, vista) {
  if (!mappa || !Array.isArray(vista) || vista.length !== 5) return;
  const [lng, lat, zoom, bearing, pitch] = vista;
  mappa.flyTo({ center: [lng, lat], zoom, bearing, pitch });
}
