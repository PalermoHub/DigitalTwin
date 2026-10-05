// js/geoimage/storico.js
// Cronologia delle posizioni dell'immagine per Annulla / Ripeti (fino a 50 passi, come in Geoimage).
const copia = a => a.map(p => ({ lat: p.lat, lng: p.lng }));

export function creaStorico(massimo = 50) {
  let voci = [], i = -1;
  return {
    // registra la posizione corrente; una nuova azione cancella i passi «ripeti»
    salva(angoli) {
      voci = voci.slice(0, i + 1);
      voci.push(copia(angoli));
      if (voci.length > massimo) voci.shift();
      i = voci.length - 1;
    },
    // restituiscono gli angoli da applicare, o null se non c'è nulla da fare
    annulla(passi = 1) {
      if (i <= 0) return null;
      i = Math.max(0, i - passi);
      return copia(voci[i]);
    },
    ripeti(passi = 1) {
      if (i >= voci.length - 1) return null;
      i = Math.min(voci.length - 1, i + passi);
      return copia(voci[i]);
    },
    puoAnnullare: () => i > 0,
    puoRipetere: () => i < voci.length - 1,
    azzera() { voci = []; i = -1; },
  };
}
