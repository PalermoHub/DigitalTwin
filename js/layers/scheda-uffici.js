// Modello puro delle sedi degli uffici comunali: sede → aree → uffici (responsabile, contatti e link alla scheda del Comune).
// Lo stesso modello alimenta il popup (riassunto breve) e la scheda di destra (elenco completo).

const ORDINE = { area: 0, settore: 1, unita: 2 };
const ETICHETTA = { area: 'Area', settore: 'Settore', unita: 'U.O.' };
const FONTE = 'Fonte: sito del Comune di Palermo (comune.palermo.it/amministrazione/uffici)';
const MAX_AREE_POPUP = 4;

function ufficio(u) {
  return {
    nome: u.nome, livello: ETICHETTA[u.livello] ?? '', url: u.url,
    responsabile: u.responsabile || '',
    contatti: [...new Set([...(u.telefoni ?? []), ...(u.email ?? [])])].join(' · '),
  };
}

// Uffici raggruppati per area (la più numerosa prima); dentro l'area prima l'area stessa, poi i settori, poi le unità operative.
export function raggruppaPerArea(p) {
  const perArea = new Map();
  for (const u of p.uffici ?? []) {
    if (!perArea.has(u.area)) perArea.set(u.area, []);
    perArea.get(u.area).push(u);
  }
  return [...perArea].map(([area, lista]) => ({
    area,
    uffici: lista.sort((a, b) => (ORDINE[a.livello] ?? 9) - (ORDINE[b.livello] ?? 9) || a.nome.localeCompare(b.nome, 'it')).map(ufficio),
  })).sort((a, b) => b.uffici.length - a.uffici.length || a.area.localeCompare(b.area, 'it'));
}

const nUffici = n => (n === 1 ? '1 ufficio comunale' : `${n} uffici comunali`);
const conteggio = p => p.n_uffici ?? (p.uffici ?? []).length;

// Popup sulla mappa: poche righe (sede, indirizzo, quante aree); il dettaglio sta nella scheda.
export function modelloPopupSede(p) {
  const gruppi = raggruppaPerArea(p);
  return {
    titolo: p.nome, indirizzo: p.indirizzo, sottotitolo: nUffici(conteggio(p)),
    aree: gruppi.slice(0, MAX_AREE_POPUP).map(g => ({ area: g.area, n: g.uffici.length })),
    altreAree: Math.max(0, gruppi.length - MAX_AREE_POPUP),
  };
}

const riga = (etichetta, valore) => ({ etichetta, valore });

// Voce della scheda: righe riassuntive e, in un accordion chiuso, gli uffici per area con link, responsabile e contatti.
export function voceUffici(p) {
  const gruppi = raggruppaPerArea(p);
  const n = conteggio(p);
  return {
    chiave: `uffici-${p.id}`, peso: 8, titolo: p.nome, icona: 'uffici', badge: 'Uffici comunali', sempre: true,
    gruppi: [{ righe: [riga('Indirizzo', p.indirizzo), riga('Uffici', String(n)), riga('Aree', String(gruppi.length))].filter(r => r.valore) }],
    accordion: {
      riassunto: `Uffici e responsabili (${n})`,
      elementi: gruppi.map(g => ({
        titolo: g.area, stato: String(g.uffici.length),
        righe: g.uffici.map(u => ({
          etichetta: u.nome, url: u.url,
          valore: [u.livello !== 'U.O.' ? u.livello : '', u.responsabile, u.contatti].filter(Boolean).join(' — '),
        })),
      })),
    },
    fonte: FONTE,
  };
}
