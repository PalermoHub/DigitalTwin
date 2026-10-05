// Invito all'avvio: un pill con lo schema «tutto in un punto» (sotto, solo su schermi larghi) che dice di fare clic su un punto.
// Resta finché non si fa clic (o tocco) sulla mappa; il clic si ricorda e non torna più.
// Non compare se l'indirizzo apre già una scheda.
export const CHIAVE_INVITO = 'dt.invito.visto';
export const SCHEMA_INVITO = 'img/guida/passi/intersezione.svg';

export function collegaInvito(map, doc, archivio, { url = '' } = {}) {
  let visto = false;
  try { visto = archivio?.getItem(CHIAVE_INVITO) === '1'; } catch { /* storage bloccato: l'invito si mostra */ }
  if (visto || /[?&]scheda=/.test(url)) return null;
  const radice = doc.createElement('div');
  radice.className = 'invito-clic';
  radice.setAttribute('role', 'status');
  const pill = doc.createElement('p');
  pill.textContent = 'Clicca sulla mappa per scoprire tutto su un punto';
  const schema = doc.createElement('img');
  schema.src = SCHEMA_INVITO;
  schema.alt = '';
  schema.onerror = () => schema.remove(); // deploy senza lo schema: resta il pill
  radice.append(pill, schema);
  doc.body.append(radice);
  const alClic = () => {
    map.off('click', alClic);
    radice.remove();
    try { archivio?.setItem(CHIAVE_INVITO, '1'); } catch { /* si ripresenta al prossimo avvio */ }
  };
  map.on('click', alClic);
  return alClic;
}
