// Gruppo «Salute»: contenitore dei layer sulla sanità (pronto soccorso, e in futuro altri servizi sanitari).
// Non ha strati propri: i moduli con `gruppo: 'salute'` mettono i loro strati qui, quindi deve precederli in MODULI.
export default {
  id: 'salute',
  titolo: 'Salute',
  aggiungiSorgenti() {},
  aggiungiLayer() {},
  strati: [],
};
