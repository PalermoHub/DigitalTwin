// Invito all'avvio: un pill con lo schema «tutto in un punto» (sotto, solo su schermi larghi) che dice di fare clic su un punto.
// Sparisce al primo clic (o tocco) o dopo qualche secondo. Si ricorda solo il clic: chi non ha ancora provato lo rivede.
// Non compare se l'indirizzo apre già una scheda.
export const CHIAVE_INVITO = 'dt.invito.visto';
export const DURATA_INVITO = 12000;
export const SCHEMA_INVITO = 'img/guida/passi/intersezione.svg';

export function collegaInvito(map, doc, archivio, { adesso = setTimeout, annulla = clearTimeout, url = '' } = {}) {
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
  let timer = null;
  const chiudi = ricorda => {
    annulla(timer);
    map.off('click', alClic);
    radice.remove();
    if (!ricorda) return;
    try { archivio?.setItem(CHIAVE_INVITO, '1'); } catch { /* si ripresenta al prossimo avvio */ }
  };
  const alClic = () => chiudi(true);
  map.on('click', alClic);
  timer = adesso(() => chiudi(false), DURATA_INVITO);
  return alClic;
}
