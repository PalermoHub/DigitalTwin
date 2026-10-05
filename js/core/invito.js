// Invito all'avvio: un pill con lo schema «tutto in un punto» (sotto, solo su schermi larghi) che dice di fare clic su un punto.
// Compare a ogni apertura e sparisce al clic (o tocco) sulla mappa; solo «Non mostrare più» lo spegne per sempre.
// «Ripristina» nella barra di ricerca lo riaccende (la chiave è tra le personalizzazioni).
// Non compare se l'indirizzo apre già una scheda.
export const CHIAVE_INVITO = 'dt.invito.no';
export const SCHEMA_INVITO = 'img/guida/passi/intersezione.svg';

export function collegaInvito(map, doc, archivio, { url = '' } = {}) {
  let spento = false;
  try { spento = archivio?.getItem(CHIAVE_INVITO) === '1'; } catch { /* storage bloccato: l'invito si mostra */ }
  if (spento || /[?&]scheda=/.test(url)) return null;
  const radice = doc.createElement('div');
  radice.className = 'invito-clic';
  radice.setAttribute('role', 'status');
  const pill = doc.createElement('p');
  pill.textContent = 'Clicca sulla mappa per scoprire tutto su un punto';
  const schema = doc.createElement('img');
  schema.src = SCHEMA_INVITO;
  schema.alt = '';
  schema.onerror = () => schema.remove(); // deploy senza lo schema: resta il pill
  const mai = doc.createElement('button');
  mai.type = 'button';
  mai.className = 'invito-mai';
  mai.textContent = 'Non mostrare più';
  radice.append(pill, schema, mai);
  doc.body.append(radice);
  const chiudi = () => { map.off('click', chiudi); radice.remove(); };
  mai.addEventListener('click', () => {
    chiudi();
    try { archivio?.setItem(CHIAVE_INVITO, '1'); } catch { /* si ripresenta al prossimo avvio */ }
  });
  map.on('click', chiudi);
  return chiudi;
}
