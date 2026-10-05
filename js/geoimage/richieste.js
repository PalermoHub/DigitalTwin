// js/geoimage/richieste.js
// Le operazioni che finiscono dopo (caricare un file, importare un JSON, ripristinare il progetto) possono sovrapporsi:
// solo l'ultima prenotata ha il diritto di cambiare lo stato; le altre, risolte più tardi, si fermano senza fare nulla.
export function creaRichieste() {
  let ultima = 0;
  return {
    prenota: () => ++ultima,
    attuale: id => id === ultima,
  };
}
