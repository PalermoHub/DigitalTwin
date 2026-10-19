import { normalizza } from './indirizzi.js';
import { SINONIMI } from './filtri-sinonimi.js';
// Filtri dei layer che il Chat bot può proporre come pulsanti («Mostra solo: Disponibile»). Ogni layer con filtri in legenda li registra:
//   registraFiltriChat('colonnine', { gruppi: [{ tipo, titolo, voci: [{ chiave, nome, sinonimi }] }], accese(), solo(tipo, chiave), tutte() })
// `accese` dà le voci in mappa come «tipo:chiave»; `solo` lascia in mappa soltanto quella voce, `tutte` toglie ogni filtro. Le voci si leggono dal layer, non dalla guida:
// un layer nuovo con filtri ottiene i pulsanti registrandosi. I `sinonimi` sono parole italiane che l'utente può usare al posto del nome.
const registro = new Map();

export const registraFiltriChat = (idStrato, descrittore) => registro.set(idStrato, descrittore);
// Un layer non registrato ha comunque i pulsanti se la sua legenda (`.lg-<id strato>`) ha righe di filtro (voceFiltro): vedi daLegenda().
export const filtriDelloStrato = (idStrato, doc = globalThis.document) => registro.get(idStrato) ?? daLegenda(doc, idStrato);

// Voci del layer nominate dalla domanda (per nome o per sinonimo), come «tipo:chiave». Il confronto è su parole intere o su parti di frase.
export function vociNominate(descrittore, domanda) {
  const testo = ` ${normalizza(domanda ?? '')} `;
  const trovate = [];
  for (const g of descrittore?.gruppi ?? []) {
    for (const v of g.voci) {
      const parole = [...(v.nome ?? '').split(' · '), v.nome, ...(v.sinonimi ?? [])].map(normalizza).filter(Boolean);
      if (parole.some(p => testo.includes(` ${p} `))) trovate.push(`${g.tipo}:${v.chiave}`);
    }
  }
  return trovate;
}

// Voce «filtrata»: è accesa mentre qualche altra voce del suo gruppo è spenta (con tutto acceso nessun filtro è applicato).
export function vocePremuta(descrittore, tipo, chiave) {
  const accese = descrittore.accese();
  const gruppo = descrittore.gruppi.find(g => g.tipo === tipo);
  return accese.has(`${tipo}:${chiave}`) && gruppo.voci.some(v => !accese.has(`${tipo}:${v.chiave}`));
}

// ——— Filtri letti dalla legenda ———
// Le righe «esclusive» della legenda (core/legenda.js, voceFiltro) sono i filtri a scelta singola: il clic su una lascia accesa solo quella.
// Le righe dello stesso contenitore formano un gruppo (da 2 righe in su). La chiave di una voce è il suo testo, il tipo è «g<posizione>».
const righeFiltro = legenda => [...legenda.querySelectorAll('label')].filter(r => r._filtro?.esclusivo);
const testoRiga = r => r.textContent.trim().replace(/\s+/g, ' ');
const senzaConteggio = testo => testo.replace(/\s*\(\d[\d.]*\)$/, ''); // «2019 (12)» -> «2019»

function gruppiLegenda(legenda) {
  const per = new Map();
  for (const r of righeFiltro(legenda)) per.set(r.parentElement, [...(per.get(r.parentElement) ?? []), r]);
  return [...per.values()].filter(righe => righe.length >= 2);
}

// Titolo del gruppo: l'intestazione (em, h3) che sta subito prima della prima riga.
const titoloPrecedente = riga => {
  const prima = riga.previousElementSibling;
  return prima?.matches?.('em, h3') ? prima.textContent.trim() : '';
};

export function daLegenda(doc, idStrato) {
  const legenda = doc?.querySelector?.(`.lg-${idStrato}`);
  if (!legenda || !gruppiLegenda(legenda).length) return null;
  const extra = SINONIMI[idStrato] ?? {};
  const riga = (tipo, chiave) => gruppiLegenda(legenda)[Number(tipo.slice(1))]?.find(r => testoRiga(r) === chiave);
  return {
    get gruppi() {
      return gruppiLegenda(legenda).map((righe, i) => ({
        tipo: `g${i}`,
        titolo: extra.titoli?.[i] ?? titoloPrecedente(righe[0]),
        voci: righe.map(r => {
          const chiave = testoRiga(r);
          const nome = senzaConteggio(chiave);
          return { chiave, nome: chiave, sinonimi: [nome, ...(extra.sinonimi?.[nome] ?? [])] };
        }),
      }));
    },
    accese: () => new Set(gruppiLegenda(legenda).flatMap((righe, i) => righe.filter(r => r._filtro.casella.checked).map(r => `g${i}:${testoRiga(r)}`))),
    solo(tipo, chiave) {
      const r = riga(tipo, chiave);
      const gruppo = r && gruppiLegenda(legenda)[Number(tipo.slice(1))];
      const soloQuesta = r && gruppo.every(x => x._filtro.casella.checked === (x === r));
      if (r && !soloQuesta) r._filtro.casella.click();
    },
    // Layer con più colorazioni (PEBA: per accessibilità o per gruppo): la mappa si colora per il gruppo della voce premuta.
    colora(tipo) {
      const pulsante = extra.colora && legenda.querySelectorAll(extra.colora)[Number(tipo.slice(1))];
      if (pulsante && pulsante.getAttribute('aria-pressed') !== 'true') pulsante.click();
    },
    tutte() {
      for (const righe of gruppiLegenda(legenda)) {
        const accese = righe.filter(r => r._filtro.casella.checked);
        if (accese.length === righe.length) continue;
        if (accese.length === 1) accese[0]._filtro.casella.click(); // l'unica voce accesa: il secondo clic rimostra tutto
        else righe.filter(r => !r._filtro.casella.checked).forEach(r => r._filtro.casella.click());
      }
    },
  };
}
