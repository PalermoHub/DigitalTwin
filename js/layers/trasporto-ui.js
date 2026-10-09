import { metri } from './trasporto-vicino.js';
import {
  giornoIniziale, oggiISO, minutoAdesso, partenzeFermata, prossime, riepilogoLinea, formatoOra, colorePerTesto, validitaFermata,
} from './trasporto-orari.js';
import { t, tl } from '../core/i18n.js';

// DOM della scheda del trasporto pubblico: selettore del giorno e orari. Gli orari si scaricano alla prima apertura
// (`ctx.orari()` è una promessa condivisa); finché non arrivano si vede «in caricamento», se falliscono lo si dice.

const dataIt = iso => iso.split('-').reverse().join('/');

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = tl(testo);
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

// `disegna(orari, data)` restituisce i nodi del corpo, ridisegnati a ogni cambio di giorno. Il giorno iniziale, i limiti del
// selettore e l'avviso di validità sono quelli del feed di `stopId` (AMAT e Trenitalia hanno periodi diversi).
function conGiorno(ctx, stopId, disegna) {
  const radice = el('div', 'trasporto-orari');
  radice.append(el('p', 'scheda-nota', 'Orari in caricamento…'));
  ctx.orari().then(orari => {
    const validita = validitaFermata(orari, stopId);
    const { data, fuori } = giornoIniziale({ validita }, oggiISO());
    const scelta = el('input');
    scelta.type = 'date';
    scelta.value = data;
    scelta.min = validita.da;
    scelta.max = validita.a;
    scelta.setAttribute('aria-label', t('trasporto.giorno'));
    const giorno = el('label', 'trasporto-giorno', 'Giorno ');
    giorno.append(scelta);
    const corpo = el('div');
    const ridisegna = () => { if (scelta.value) corpo.replaceChildren(...disegna(orari, scelta.value)); };
    scelta.addEventListener('change', ridisegna);
    const avviso = fuori
      ? [el('p', 'scheda-nota', t('trasporto.orariValgono', { da: dataIt(validita.da), a: dataIt(validita.a) }))]
      : [];
    radice.replaceChildren(...avviso, giorno, corpo);
    ridisegna();
  }).catch(err => radice.replaceChildren(el('p', 'scheda-nota', t('trasporto.orariNd', { msg: err.message }))));
  return radice;
}

function tuttiGliOrari(ctx, partenze) {
  const radice = el('details', 'scheda-acc');
  radice.append(el('summary', null, t('trasporto.tuttiOrari', { n: partenze.length })));
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
  return () => conGiorno(ctx, stopId, (orari, data) => {
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

// Fermate in sequenza come uno schema a strisce: la linea nel suo colore con un pallino per fermata (capolinea più grandi),
// e accanto a ogni nome le altre linee che vi passano (i cambi). Il nome porta la mappa sulla fermata; un cambio la porta
// sulla fermata mostrando anche il percorso di quell'altra linea.
function fermateInSequenza(linea, ctx) {
  const radice = el('details', 'scheda-acc');
  radice.append(el('summary', null, `Fermate (${linea.fermate.length})`));
  const elenco = el('ol', 'trasporto-fermate trasporto-strip');
  elenco.style.setProperty('--colore-linea', linea.colore);
  const ultima = linea.fermate.length - 1;
  linea.fermate.forEach((id, i) => {
    const voce = el('li', i === 0 || i === ultima ? 'trasporto-strip-capolinea' : null);
    const nome = el('button', 'trasporto-strip-nome', ctx.nomeFermata(id));
    nome.type = 'button';
    nome.title = t('trasporto.mostraFermata');
    nome.addEventListener('click', () => ctx.vaiAFermata(id));
    voce.append(nome);
    for (const c of ctx.cambi(id, linea.numero)) {
      const b = el('button', 'trasporto-chip-bottone');
      b.type = 'button';
      b.title = t('trasporto.mostraPercorso', { numero: c.numero });
      b.addEventListener('click', () => ctx.vaiAFermata(id, c.numero));
      b.append(chip(c));
      voce.append(' ', b);
    }
    elenco.append(voce);
  });
  radice.append(elenco);
  return radice;
}

export function orariLinea(linea, ctx) {
  return () => {
    const radice = el('div');
    radice.append(conGiorno(ctx, linea.fermate[0], (orari, data) => {
      const r = riepilogoLinea(orari, linea, data);
      if (!r) return [nessunaCorsa()];
      const blocco = el('div', 'scheda-gruppo');
      blocco.append(
        riga('Corse al giorno', String(r.n)),
        riga('Primo passaggio al capolinea', formatoOra(r.primo)),
        riga('Ultimo passaggio al capolinea', formatoOra(r.ultimo)),
      );
      if (r.frequenza) blocco.append(riga('Frequenza media', t('trasporto.ogni', { n: r.frequenza })));
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
    linea.addEventListener('toggle', () => { if (linea.open) { riempi(); if (gruppi.length > 1) ctx.mostraLinea(g.route_id); } });
    if (gruppi.length === 1) { linea.open = true; riempi(); }
    radice.append(linea);
  }
  return radice;
}

// Fermate vicine al punto cliccato: il nome è un pulsante che porta la mappa sulla fermata e ne apre la scheda; sotto, le sue linee (ognuna fa lo stesso e mostra anche il proprio percorso).
export function elencoFermateVicine(fermate, vai) {
  const radice = el('div', 'trasporto-vicine');
  for (const f of fermate) {
    const voce = el('div', 'trasporto-vicina');
    const nome = el('button', 'trasporto-vicina-nome', f.nome);
    nome.type = 'button';
    nome.title = t('trasporto.mostraFermata');
    nome.addEventListener('click', () => vai(f));
    const testa = el('div', 'scheda-riga');
    testa.append(nome, el('span', 'scheda-val', metri(f.distanza)));
    const righe = el('div', 'trasporto-vicina-linee');
    if (f.stato) righe.append(el('span', 'scheda-nota', t('trasporto.inApertura')));
    for (const l of f.linee) {
      const b = el('button', 'trasporto-chip-bottone');
      b.type = 'button';
      b.title = t('trasporto.mostraPercorso', { numero: l.numero });
      b.addEventListener('click', () => vai(f, l.numero));
      b.append(chip({ numero: l.numero, colore: l.colore }));
      righe.append(b);
    }
    voce.append(testa, righe);
    radice.append(voce);
  }
  return radice;
}
