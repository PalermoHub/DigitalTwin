// Modello puro della scheda del luogo: unisce i frammenti dei vari moduli in sezioni ordinate,
// senza ripetizioni e con il contesto amministrativo portato una sola volta nell'intestazione.
//
// Una voce è { chiave, peso, titolo, badge?, contesto?, gruppi?, accordion?, link?, nota?, fonte?, collassabile? }
//   gruppo   = { titolo?, righe: [{ etichetta, valore, classe? }], griglia?: [{ valore, chiave }] }
//   accordion = { riassunto, elementi: [{ titolo, stato?, anteprima?, righe }] }

const pieno = v => v != null && v !== '';

function aggiungiGruppo(sezione, gruppo) {
  let g = sezione.gruppi.find(x => x.titolo === gruppo.titolo);
  if (!g) {
    g = { titolo: gruppo.titolo, righe: [] };
    sezione.gruppi.push(g);
  }
  for (const r of gruppo.righe ?? []) {
    // stessa etichetta e stesso valore nello stesso gruppo = informazione ripetuta
    if (!g.righe.some(x => x.etichetta === r.etichetta && x.valore === r.valore)) g.righe.push(r);
  }
  if (gruppo.griglia) {
    g.griglia ??= [];
    for (const c of gruppo.griglia) if (!g.griglia.some(x => x.chiave === c.chiave)) g.griglia.push(c);
  }
}

const conContenuto = s =>
  s.gruppi.some(g => g.righe.length || g.griglia?.length) || s.accordion?.elementi?.length > 0 || s.link;

export function unisci(voci) {
  const contesto = {};
  const perChiave = new Map();
  for (const v of voci) {
    for (const [k, val] of Object.entries(v.contesto ?? {})) if (pieno(val) && !(k in contesto)) contesto[k] = val;
    let s = perChiave.get(v.chiave);
    if (!s) {
      const { contesto: _scartato, gruppi: _g, ...resto } = v;
      s = { ...resto, gruppi: [] };
      perChiave.set(v.chiave, s);
    } else {
      s.peso = Math.min(s.peso, v.peso);
      for (const campo of ['badge', 'link', 'accordion', 'nota', 'fonte']) s[campo] ??= v[campo];
    }
    for (const g of v.gruppi ?? []) aggiungiGruppo(s, g);
  }
  const sezioni = [...perChiave.values()].filter(conContenuto).sort((a, b) => a.peso - b.peso);
  return { contesto, sezioni };
}

export function testoContesto({ circoscrizione, quartiere, upl } = {}) {
  return [
    pieno(circoscrizione) && `Circoscrizione ${circoscrizione}`,
    pieno(quartiere) && `Quartiere ${quartiere}`,
    pieno(upl) && `UPL ${upl}`,
  ].filter(Boolean).join(' · ');
}
