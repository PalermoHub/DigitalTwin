// Disegno della scheda del luogo: righe, gruppi, accordion, link e intestazione di sezione (con l'interruttore «Mappa»).
import { separaMancanti, dividiDettaglio, valoreLungo, MANCANTE } from './scheda-modello.js';
import { svgIcona } from './icone.js';
import { collegamento } from './url-sicuro.js';
import { t as tr, tl } from './i18n.js';

export function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = tl(testo); // testi del modello dati: italiani nel codice, tradotti qui (vedi tl)
  return e;
}

// Icona SVG inline della sezione: decorativa, nascosta ai lettori di schermo
export function icona(nome) {
  const i = el('span', 'scheda-icona');
  i.dataset.icona = nome;
  i.innerHTML = svgIcona(nome, 16);
  return i;
}

function disegnaRiga(r) {
  const riga = el('div', 'scheda-riga');
  if (r.url) { // etichetta-collegamento (es. scheda di un ufficio sul sito del Comune); il valore va a capo
    const et = el('span', 'scheda-et');
    const a = el('a', null, tl(r.etichetta));
    collegamento(a, r.url);
    et.append(a);
    riga.append(et);
    riga.classList.add('scheda-riga--lunga');
    if (r.valore) riga.append(el('span', 'scheda-val scheda-val--nota', r.valore));
    return riga;
  }
  riga.append(el('span', 'scheda-et', tl(r.etichetta)));
  if (r.classe) {
    const { valore, dettaglio } = dividiDettaglio(r.valore);
    const badge = el('span', 'scheda-val scheda-badge scheda-badge--c' + r.classe);
    badge.title = tr('scheda.classe', { classe: r.classe });
    badge.append(el('span', 'scheda-badge-num', String(r.classe)), ` ${tl(valore)}`);
    riga.append(badge);
    if (dettaglio) riga.append(el('span', 'scheda-dettaglio', dettaglio));
  } else {
    riga.append(el('span', 'scheda-val', r.valore));
    if (valoreLungo(r.valore)) riga.classList.add('scheda-riga--lunga');
  }
  return riga;
}

function disegnaGruppo(g) {
  const box = el('div', 'scheda-gruppo');
  if (g.titolo) box.append(el('h4', null, tl(g.titolo)));
  const { presenti, mancanti } = separaMancanti(g.righe);
  for (const r of presenti) box.append(disegnaRiga(r));
  if (mancanti.length) box.append(el('p', 'scheda-mancanti', tr('scheda.nonDisponibili', { elenco: mancanti.map(tl).join(', ') })));
  if (g.griglia?.length) {
    const griglia = el('div', 'scheda-griglia');
    for (const c of g.griglia) {
      const cella = el('div', 'scheda-cella');
      cella.append(el('div', 'scheda-cella-val', c.valore), el('div', 'scheda-cella-chiave', tl(c.chiave)));
      griglia.append(cella);
    }
    box.append(griglia);
  }
  return box;
}

function disegnaAccordion(a) {
  const radice = el('details', 'scheda-acc');
  if (a.aperto) radice.open = true;
  const riassunto = el('summary');
  if (a.icona) riassunto.append(icona(a.icona));
  riassunto.append(tl(a.riassunto));
  radice.append(riassunto);
  if (a.suggerimento) radice.append(el('p', 'scheda-suggerimento', tl(a.suggerimento)));
  for (const e of a.elementi) {
    const tipo = el('details', 'scheda-tipo');
    const sommario = el('summary');
    sommario.append(el('span', 'scheda-tipo-nome', tl(e.titolo)));
    if (e.stato) sommario.append(el('em', 'scheda-tipo-stato', e.stato));
    if (e.anteprima) sommario.append(el('span', 'scheda-tipo-anteprima', e.anteprima));
    tipo.append(sommario);
    if (e.strato) tipo.dataset.strato = e.strato;
    for (const r of e.righe) tipo.append(disegnaRiga(r));
    radice.append(tipo);
  }
  return radice;
}

function disegnaLink(l) {
  const a = el('a', 'scheda-link');
  collegamento(a, l.url);
  if (l.suggerimento) a.title = tl(l.suggerimento);
  const testo = el('span');
  if (l.icona) testo.append(icona(l.icona));
  testo.append(tl(l.testo));
  a.append(testo);
  if (l.etichetta) a.append(el('span', 'scheda-link-et', tl(l.etichetta)));
  return a;
}

const BREVI = [[/^Particella catastale/i, 'Catasto'], [/^Zonizzazione/i, 'PRG'], [/^Quotazioni OMI/i, 'OMI'], [/^Sezione di censimento/i, 'Censimento'], [/^Terreno/i, 'Terreno']];
function titoloBreve(t) {
  const m = BREVI.find(([re]) => re.test(t));
  return tl(m ? m[1] : t.replace(/\s*\(.*\)\s*$/, ''));
}

function riassunto(s) {
  const r = s.gruppi.flatMap(g => g.righe).find(x => x.valore && x.valore !== MANCANTE);
  if (!r) return '';
  const v = String(r.valore);
  return v.length > 26 ? v.slice(0, 25) + '…' : v;
}

// Interruttore «Mappa» nell'intestazione di una sezione: accende o spegne lo strato collegato. Passa dalla casella del
// pannello strati (`#strato-<id>`), unica fonte di verità, come fa la tab Argomenti.
export function sincronizzaStrato(b) {
  const origine = document.getElementById(`strato-${b.dataset.strato}`);
  b.hidden = !origine;
  b.disabled = !!origine?.disabled;
  b.setAttribute('aria-pressed', String(!!origine?.checked));
  b.title = origine?.disabled ? origine.title : origine?.checked ? tr('scheda.nascondiStrato') : tr('scheda.mostraStrato');
}

// strati accesi da un interruttore della scheda: si spengono quando la scheda si chiude
export const acceseDaScheda = new Set();

export function spegniStratiDaScheda() {
  for (const id of acceseDaScheda) {
    const origine = document.getElementById(`strato-${id}`);
    if (!origine?.checked) continue;
    origine.checked = false;
    origine.dispatchEvent(new Event('change', { bubbles: true }));
  }
  acceseDaScheda.clear();
}

export function creaInterruttoreStrato(id) {
  const b = el('button', 'scheda-strato', tr('scheda.mappa'));
  b.type = 'button';
  b.dataset.strato = id;
  b.addEventListener('click', () => {
    const origine = document.getElementById(`strato-${id}`);
    if (!origine || origine.disabled) return;
    origine.checked = !origine.checked;
    acceseDaScheda[origine.checked ? 'add' : 'delete'](id);
    origine.dispatchEvent(new Event('change', { bubbles: true }));
  });
  sincronizzaStrato(b);
  return b;
}

export function disegnaSezione(s, i) {
  const titolo = el('h3');
  if (s.icona) titolo.append(icona(s.icona));
  titolo.append(tl(s.titolo));
  for (const b of s.badges ?? (s.badge ? [s.badge] : [])) titolo.append(' ', el('span', 'scheda-tag', tl(b)));
  const corpo = [];
  if (s.immagine) {
    const img = el('img', 'scheda-foto');
    img.src = s.immagine.url;
    img.alt = tl(s.immagine.alt);
    img.loading = 'lazy';
    img.addEventListener('error', () => img.remove());
    corpo.push(img);
  }
  if (s.testo) corpo.push(el('p', 'scheda-testo', tl(s.testo)));
  corpo.push(...s.gruppi.map(disegnaGruppo));
  if (s.dinamico) corpo.push(s.dinamico()); // contenuto interattivo costruito dal layer (es. orari con selettore del giorno)
  if (s.accordion) corpo.push(disegnaAccordion(s.accordion));
  for (const l of [].concat(s.link ?? [])) corpo.push(disegnaLink(l));
  if (s.nota) corpo.push(el('p', 'scheda-nota', tl(s.nota)));
  for (const f of s.fonte?.split('\n') ?? []) corpo.push(el('p', 'scheda-nota scheda-fonte', tl(f)));

  const sezione = el('details', 'scheda-sez');
  sezione.open = s.aperta !== false;
  sezione.dataset.peso = s.peso;
  const sommario = el('summary');
  sommario.append(titolo);
  const sunto = riassunto(s);
  if (sunto) sommario.append(el('span', 'scheda-riassunto', sunto));
  sezione.append(sommario, ...corpo);
  sezione.dataset.chiave = s.chiave;
  sezione.dataset.titolo = s.titolo;
  if (s.strato) sezione.dataset.strato = s.strato;
  return sezione;
}
