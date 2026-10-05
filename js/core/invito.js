// Invito all'avvio: un pill sulla mappa che dice di fare clic su un punto. Sparisce al primo clic (o tocco),
// dopo qualche secondo, o subito se l'indirizzo apre già una scheda; non torna a chi l'ha già visto.
export const CHIAVE_INVITO = 'dt.invito.visto';
export const DURATA_INVITO = 9000;

export function collegaInvito(map, doc, archivio, { adesso = setTimeout, annulla = clearTimeout, url = '' } = {}) {
  let visto = false;
  try { visto = archivio?.getItem(CHIAVE_INVITO) === '1'; } catch { /* storage bloccato: l'invito si mostra */ }
  if (visto || /[?&]scheda=/.test(url)) return null;
  const pill = doc.createElement('div');
  pill.className = 'invito-clic';
  pill.setAttribute('role', 'status');
  pill.textContent = 'Clicca sulla mappa per scoprire tutto su un punto';
  doc.body.append(pill);
  let timer = null;
  const chiudi = () => {
    annulla(timer);
    map.off('click', chiudi);
    pill.remove();
    try { archivio?.setItem(CHIAVE_INVITO, '1'); } catch { /* si ripresenta al prossimo avvio */ }
  };
  map.on('click', chiudi);
  timer = adesso(chiudi, DURATA_INVITO);
  return chiudi;
}
