// js/geoimage/sospensione.js
// Mentre si aggiungono i GCP il clic sulla mappa non deve aprire la Scheda né attivare gli altri strati (ognuno ha il suo
// map.on('click')). MapLibre consegna ogni evento con map.fire(): in modalità GCP i clic vanno solo al gestore dei GCP.
export function creaSospensione(map) {
  const originale = map.fire.bind(map);
  let gestore = null;
  map.fire = function (evento, dati) {
    const tipo = typeof evento === 'string' ? evento : evento?.type;
    if (gestore && tipo === 'click') {
      gestore(evento);
      return map;
    }
    return originale(evento, dati);
  };
  return {
    attiva(fn) { gestore = fn; },
    disattiva() { gestore = null; },
  };
}
