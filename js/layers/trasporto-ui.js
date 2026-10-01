import {
  giornoIniziale, oggiISO, minutoAdesso, partenzeFermata, prossime, riepilogoLinea, formatoOra, colorePerTesto,
} from './trasporto-orari.js';

// DOM della scheda del trasporto pubblico: selettore del giorno e orari. Gli orari si scaricano alla prima apertura
// (`ctx.orari()` è una promessa condivisa); finché non arrivano si vede «in caricamento», se falliscono lo si dice.

const dataIt = iso => iso.split('-').reverse().join('/');

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}

function chip(info) {
  const c = el('span', 'trasporto-chip', info.numero);
  c.style.background = info.colore;
  c.style.color = colorePerTesto(info.colore);
  return c;
}

function riga(etichetta, valore) {
  const r = el('div', 'scheda-riga');
  r.append(typeof etichetta === 'string' ? el('span', 'scheda-et', etichetta) : etichetta, el('span', 'scheda-val', valore));
  return r;
}

const nessunaCorsa = () => el('p', 'scheda-nota', 'Nessuna corsa in questa data.');

// `disegna(orari, data)` restituisce i nodi del corpo, ridisegnati a ogni cambio di giorno.
function conGiorno(ctx, disegna) {
  const radice = el('div', 'trasporto-orari');
  radice.append(el('p', 'scheda-nota', 'Orari in caricamento…'));
  ctx.orari().then(orari => {
    const { data, fuori } = giornoIniziale(orari, oggiISO());
    const scelta = el('input');
    scelta.type = 'date';
    scelta.value = data;
    scelta.min = orari.validita.da;
    scelta.max = orari.validita.a;
    scelta.setAttribute('aria-label', 'Giorno');
    const giorno = el('label', 'trasporto-giorno', 'Giorno ');
    giorno.append(scelta);
    const corpo = el('div');
    const ridisegna = () => { if (scelta.value) corpo.replaceChildren(...disegna(orari, scelta.value)); };
    scelta.addEventListener('change', ridisegna);
    const avviso = fuori
      ? [el('p', 'scheda-nota', `Gli orari valgono dal ${dataIt(orari.validita.da)} al ${dataIt(orari.validita.a)}: mostro il primo giorno valido.`)]
      : [];
    radice.replaceChildren(...avviso, giorno, corpo);
    ridisegna();
  }).catch(err => radice.replaceChildren(el('p', 'scheda-nota', `Orari non disponibili: ${err.message}`)));
  return radice;
}

function tuttiGliOrari(ctx, partenze) {
  const radice = el('details', 'scheda-acc');
  radice.append(el('summary', null, `Tutti gli orari del giorno (${partenze.length})`));
  const gruppi = new Map();
  for (const p of partenze) {
    const k = `${p.route}|${p.dir}`;
    if (!gruppi.has(k)) gruppi.set(k, []);
    gruppi.get(k).push(p);
  }
  for (const lista of gruppi.values()) {
    const info = ctx.info(lista[0].route, lista[0].dir);
    const blocco = el('div', 'scheda-gruppo');
    const testata = el('div', 'trasporto-testata');
    testata.append(chip(info), ` → ${info.a}`);
    blocco.append(testata, el('p', 'trasporto-ore', lista.map(p => formatoOra(p.t)).join(' · ')));
    radice.append(blocco);
  }
  return radice;
}

export function orariFermata(stopId, ctx) {
  return () => conGiorno(ctx, (orari, data) => {
    const tutte = partenzeFermata(orari, stopId, data);
    if (!tutte.length) return [nessunaCorsa()];
    const oggi = data === oggiISO();
    const prime = oggi ? prossime(tutte, minutoAdesso()) : tutte.slice(0, 8);
    const blocco = el('div', 'scheda-gruppo');
    blocco.append(el('h4', null, oggi ? 'Prossime partenze' : 'Prime partenze del giorno'));
    if (!prime.length) blocco.append(el('p', 'scheda-nota', 'Nessun’altra partenza oggi.'));
    for (const p of prime) {
      const info = ctx.info(p.route, p.dir);
      const etichetta = el('span', 'scheda-et');
      etichetta.append(chip(info), ` → ${info.a}`);
      blocco.append(riga(etichetta, formatoOra(p.t)));
    }
    return [blocco, tuttiGliOrari(ctx, tutte)];
  });
}

function fermateInSequenza(linea, ctx) {
  const radice = el('details', 'scheda-acc');
  radice.append(el('summary', null, `Fermate (${linea.fermate.length})`));
  const elenco = el('ol', 'trasporto-fermate');
  for (const id of linea.fermate) elenco.append(el('li', null, ctx.nomeFermata(id)));
  radice.append(elenco);
  return radice;
}

export function orariLinea(linea, ctx) {
  return () => {
    const radice = el('div');
    radice.append(conGiorno(ctx, (orari, data) => {
      const r = riepilogoLinea(orari, linea, data);
      if (!r) return [nessunaCorsa()];
      const blocco = el('div', 'scheda-gruppo');
      blocco.append(
        riga('Corse al giorno', String(r.n)),
        riga('Primo passaggio al capolinea', formatoOra(r.primo)),
        riga('Ultimo passaggio al capolinea', formatoOra(r.ultimo)),
      );
      if (r.frequenza) blocco.append(riga('Frequenza media', `ogni ${r.frequenza} min`));
      return [blocco];
    }), fermateInSequenza(linea, ctx));
    return radice;
  };
}

// Tutte le linee sotto il clic: un accordion per linea (aperto solo se è l'unica). Direzioni e orari si costruiscono
// alla prima apertura, così `orari.json` non si scarica per decine di linee che nessuno ha aperto.
export function elencoLinee(gruppi, ctx) {
  const radice = el('div', 'trasporto-linee');
  for (const g of gruppi) {
    const linea = el('details', 'scheda-acc trasporto-linea');
    const titolo = el('summary');
    titolo.append(chip({ numero: g.numero, colore: ctx.info(g.route_id, g.direzioni[0].direzione).colore }), ` ${g.nome}`);
    const corpo = el('div');
    linea.append(titolo, corpo);
    const riempi = () => {
      if (corpo.hasChildNodes()) return; // già costruito
      for (const d of g.direzioni) {
        corpo.append(el('h4', null, `${d.da} → ${d.a}`), orariLinea(d, ctx)());
      }
    };
    linea.addEventListener('toggle', () => { if (linea.open) riempi(); });
    if (gruppi.length === 1) { linea.open = true; riempi(); }
    radice.append(linea);
  }
  return radice;
}
