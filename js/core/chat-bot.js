// Pannello «Chat bot»: disegna la conversazione di chat-bot-conversazione.js. Il testo delle risposte viene dalla guida:
// si inserisce solo come nodi di testo (mai innerHTML), con il solo grassetto **...** e gli elenchi «- ».
import { t, tn, tl } from './i18n.js';
import { svgIcona } from './icone.js';
import { creaConversazione } from './chat-bot-conversazione.js';
import { blocchiTesto } from './chat-bot-ricerca.js';
import { statoStrato, commutaStrato, accendiConLegenda } from './chat-bot-strati.js';
import { filtriDelloStrato, vociNominate, vocePremuta } from './filtri-chat.js';
import { tabPannello, apriPannello } from './chat-bot-pannelli.js';
import { suntoRicordato } from './chat-bot-sunto.js';
import { vociGuide } from './ricerca-guide.js';

const el = (tag, classe, testo) => {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
};

function inLinea(genitore, testo) {
  testo.split(/(\*\*[^*]+\*\*)/).forEach(parte => {
    if (/^\*\*[^*]+\*\*$/.test(parte)) genitore.append(el('strong', null, parte.slice(2, -2)));
    else if (parte) genitore.append(document.createTextNode(parte));
  });
}

function disegnaTesto(testo) {
  const radice = el('div', 'cb-testo');
  for (const blocco of blocchiTesto(testo)) {
    if (blocco.tipo === 'ul') {
      const ul = el('ul');
      blocco.righe.forEach(r => { const li = el('li'); inLinea(li, r); ul.append(li); });
      radice.append(ul);
    } else {
      const p = el('p');
      inLinea(p, blocco.righe.join(' '));
      radice.append(p);
    }
  }
  return radice;
}

const vaiAllaScheda = dettaglio => document.dispatchEvent(new CustomEvent('scheda:vai', { detail: dettaglio }));

// un pulsante per ogni oggetto trovato: accende il suo strato, porta la mappa sul punto e apre la scheda
function pulsantiOggetti(oggetti) {
  const azioni = el('div', 'cb-azioni');
  for (const o of oggetti ?? []) {
    const b = Object.assign(el('button', 'cb-oggetto', t('chatbot.apriScheda', { nome: o.nota ? `${o.etichetta} (${o.nota})` : o.etichetta })), { type: 'button' });
    b.title = b.ariaLabel = b.textContent;
    b.addEventListener('click', () => document.dispatchEvent(new CustomEvent('scheda:apri-luogo', { detail: o })));
    azioni.append(b);
  }
  return azioni;
}

// un pulsante per ogni pagina di guida dell'app che spiega la funzione («scheda:sezione», senza sezione per le pagine intere)
let titoliGuide;
function titoloGuida(scheda, sezione) {
  titoliGuide ??= new Map(vociGuide().map(v => [`${v.scheda}:${v.sezione}`, v.titolo]));
  const titolo = titoliGuide.get(`${scheda}:guida-${scheda === 'geoimage' ? 'geoimage-' : ''}${sezione}`);
  return titolo ? tl(titolo) : t(`html.menu.${scheda}`);
}

function pulsantiGuide(guide) {
  const azioni = el('div', 'cb-azioni');
  for (const g of guide ?? []) {
    const [scheda, sezione] = g.split(':');
    const nome = titoloGuida(scheda, sezione);
    const b = Object.assign(el('button', 'cb-guida', t('chatbot.apriGuida', { titolo: nome })), { type: 'button' });
    b.title = b.ariaLabel = b.textContent;
    b.addEventListener('click', () => document.dispatchEvent(new CustomEvent('guida:apri', { detail: { scheda, sezione: sezione && `guida-${scheda === 'geoimage' ? 'geoimage-' : ''}${sezione}` } })));
    azioni.append(b);
  }
  return azioni;
}

// un pulsante per ogni tab di pannello collegato alla sezione (barra degli strati a sinistra, pannelli a destra)
function pulsantiPannelli(pannelli) {
  const azioni = el('div', 'cb-azioni');
  for (const voce of pannelli ?? []) {
    const mobile = !!window.matchMedia?.('(max-width: 720px)').matches;
    const tab = tabPannello(document, voce, mobile);
    if (!tab) continue; // il tab non c'è in questa versione dell'app
    const b = Object.assign(el('button', 'cb-guida', t(`chatbot.apriPannello.${tab.lato}`, { nome: tab.nome })), { type: 'button' });
    b.title = b.ariaLabel = b.textContent;
    b.addEventListener('click', () => apriPannello(document, voce, window.matchMedia?.('(max-width: 720px)').matches));
    azioni.append(b);
  }
  return azioni;
}

// Per i layer con filtri (stato, corrente…): un pulsante per ogni voce, così chi non conosce la legenda vede cosa può scegliere.
// Le voci nominate nella domanda vengono per prime e in evidenza. Il pulsante accende il layer (legenda sulla mappa) e lascia in mappa solo quella voce.
function pulsantiFiltri(ids, domanda) {
  const box = el('div', 'cb-filtri');
  for (const id of ids ?? []) {
    const d = filtriDelloStrato(id);
    if (!d) continue;
    const nominate = vociNominate(d, domanda);
    box.append(el('p', 'cb-nota', t(nominate.length ? 'chatbot.filtri.consigliati' : 'chatbot.filtri.scegli')));
    const stato = Object.assign(el('p', 'cb-filtri-stato'), { role: 'status' });
    stato.dataset.strato = id;
    if (d.gruppi.length > 1) box.append(el('p', 'cb-nota', t('chatbot.filtri.sommano')));
    box.append(stato);
    for (const g of d.gruppi) {
      const azioni = el('div', 'cb-azioni');
      if (g.titolo && d.gruppi.length > 1) azioni.append(el('span', 'cb-nota', `${tl(g.titolo)}:`));
      const voci = [...g.voci].sort((a, b) => nominate.includes(`${g.tipo}:${b.chiave}`) - nominate.includes(`${g.tipo}:${a.chiave}`));
      for (const v of voci) {
        const b = Object.assign(el('button', 'cb-filtro', tl(v.nome)), { type: 'button' });
        b.dataset.strato = id; b.dataset.tipo = g.tipo; b.dataset.chiave = v.chiave;
        if (nominate.includes(`${g.tipo}:${v.chiave}`)) b.classList.add('cb-filtro-consigliato');
        b.title = b.ariaLabel = t('chatbot.filtri.solo', { nome: tl(v.nome) });
        b.addEventListener('click', () => { accendiConLegenda(document, id); d.solo(g.tipo, v.chiave); aggiornaFiltri(); });
        azioni.append(b);
      }
      box.append(azioni);
    }
    const tutte = Object.assign(el('button', 'cb-filtro cb-filtro-tutte', t('chatbot.filtri.tutte')), { type: 'button' });
    tutte.addEventListener('click', () => { d.tutte(); aggiornaFiltri(); });
    const riga = el('div', 'cb-azioni');
    riga.append(tutte);
    box.append(riga);
  }
  return box.childElementCount ? box : null;
}

// Pulsanti premuti e riga «In mappa»: seguono lo stato reale dei filtri del layer, anche quando cambia dalla legenda o dal pannello.
function aggiornaFiltri() {
  for (const b of document.querySelectorAll('.cb-filtro[data-chiave]')) {
    const d = filtriDelloStrato(b.dataset.strato);
    if (d) b.setAttribute('aria-pressed', String(vocePremuta(d, b.dataset.tipo, b.dataset.chiave)));
  }
  for (const riga of document.querySelectorAll('.cb-filtri-stato')) {
    const d = filtriDelloStrato(riga.dataset.strato);
    if (!d) continue;
    const accese = d.accese();
    const scelti = d.gruppi.map(g => ({ g, voci: g.voci.filter(v => accese.has(`${g.tipo}:${v.chiave}`)) })).filter(({ g, voci }) => voci.length < g.voci.length);
    riga.textContent = scelti.length
      ? t('chatbot.filtri.inMappa', { elenco: scelti.map(({ g, voci }) => `${g.titolo && d.gruppi.length > 1 ? `${tl(g.titolo)}: ` : ''}${voci.map(v => tl(v.nome)).join(', ') || t('chatbot.filtri.nessuna')}`).join(' · ') })
      : t('chatbot.filtri.tutto');
  }
}

const tronca = (testo, n) => (testo.length > n ? `${testo.slice(0, n - 1).trimEnd()}…` : testo);

// «Cosa c'è qui»: i dati principali della scheda aperta sulla mappa, un blocco per tab, con i pulsanti per aprirla.
function disegnaSunto(riquadro) {
  const sunto = suntoRicordato();
  riquadro.hidden = !sunto.length;
  const corpo = [];
  for (const { tab, voci, altre } of sunto) {
    const nomeTab = t(`scheda.tab.${tab}`);
    const testa = el('div', 'cb-sunto-tab');
    testa.append(el('strong', null, nomeTab));
    const apri = Object.assign(el('button', 'cb-sunto-apri', t('chatbot.sunto.apri')), { type: 'button', title: t('chatbot.sunto.apriTab', { tab: nomeTab }) });
    apri.setAttribute('aria-label', apri.title);
    apri.addEventListener('click', () => vaiAllaScheda({ tab }));
    testa.append(apri);
    const ul = el('ul', 'cb-sunto-voci');
    for (const v of voci) {
      const li = el('li');
      const nome = Object.assign(el('button', 'cb-sunto-voce', tronca(tl(v.titolo), 48)), { type: 'button' });
      nome.addEventListener('click', () => vaiAllaScheda({ tab, chiave: v.chiave }));
      const dati = [...v.badges.map(tl), ...v.dati.map(d => `${tl(d.etichetta)} ${tl(d.valore)}`), ...(v.conteggio ? [tn('chatbot.sunto.elementi', v.conteggio)] : [])];
      li.append(nome);
      if (dati.length) li.append(document.createTextNode(`: ${tronca(dati.join(' · '), 110)}`));
      ul.append(li);
    }
    if (altre.length) ul.append(el('li', 'cb-nota', t('chatbot.sunto.altre', { elenco: tronca(altre.slice(0, 3).map(tl).join(', '), 90) + (altre.length > 3 ? ` +${altre.length - 3}` : '') })));
    corpo.push(testa, ul);
  }
  riquadro.replaceChildren(el('summary', null, t('chatbot.sunto.titolo')), ...corpo);
}

export function creaChatBot(pannello, { carica, cercaOggetti } = {}) {
  const testata = el('header', 'gi-testata');
  testata.append(el('h2', null, t('chatbot.titolo')));
  const pulisci = Object.assign(el('button', 'cb-pulisci'), { type: 'button', title: t('chatbot.pulisci'), ariaLabel: t('chatbot.pulisci') });
  pulisci.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/></svg>';
  pulisci.addEventListener('click', () => { conv.pulisci(); campo.focus(); });
  const x = Object.assign(el('button', 'pannello-chiudi'), { type: 'button', title: t('chatbot.chiudi'), ariaLabel: t('chatbot.chiudi') });
  x.innerHTML = svgIcona('chiudi', 18);
  x.addEventListener('click', () => { pannello.hidden = true; });
  testata.append(x);

  // la scheda del luogo cliccato: si riscrive a ogni clic sulla mappa e sparisce quando la scheda si chiude
  const riquadroSunto = el('details', 'cb-sunto');
  riquadroSunto.open = true;
  const aggiornaSunto = () => disegnaSunto(riquadroSunto);
  document.addEventListener('scheda:sunto', aggiornaSunto);
  document.addEventListener('scheda:chiusa', aggiornaSunto);
  aggiornaSunto();

  const log = el('div', 'cb-log');
  log.setAttribute('role', 'log');
  log.setAttribute('aria-live', 'polite');

  const form = el('form', 'cb-form');
  const campo = Object.assign(el('input', 'cb-campo'), { type: 'text', autocomplete: 'off', placeholder: t('chatbot.segnaposto') });
  campo.setAttribute('aria-label', t('chatbot.campo'));
  const invia = Object.assign(el('button', 'gi-btn', t('chatbot.invia')), { type: 'submit' });
  form.append(campo, invia, pulisci);

  const chiedi = testo => { conv.chiedi(testo); };
  const domande = (titolo, elenco) => {
    const box = el('div', 'cb-domande');
    box.append(el('p', 'cb-nota', titolo));
    for (const d of elenco) {
      const b = Object.assign(el('button', 'cb-domanda', d), { type: 'button' });
      b.addEventListener('click', () => chiedi(d));
      box.append(b);
    }
    return box;
  };

  function disegna() {
    log.replaceChildren();
    for (const m of conv.messaggi) {
      if (m.tipo === 'utente') { log.append(el('div', 'cb-msg cb-utente', m.testo)); continue; }
      const box = el('div', 'cb-msg cb-bot');
      if (m.tipo === 'presentazione') {
        box.append(el('p', null, t('chatbot.presentazione')));
        if (conv.suggerite.length) box.append(domande(t('chatbot.suggerite'), conv.suggerite));
      } else if (m.tipo === 'risposta') {
        box.append(el('p', 'cb-nota', t('chatbot.da', { titolo: m.voce.titolo })));
        box.append(disegnaTesto(m.espansa ? m.voce.testo : m.breve));
        const azioni = el('div', 'cb-azioni');
        for (const id of m.voce.strati ?? []) {
          const st = statoStrato(document, id);
          if (!st) continue; // il layer non c'è in questa versione dell'app
          const b = Object.assign(el('button', 'cb-layer', st.nome), { type: 'button' });
          b.dataset.strato = id;
          b.addEventListener('click', () => commutaStrato(document, id));
          azioni.append(b);
        }
        if (azioni.childElementCount) box.append(azioni);
        const filtri = pulsantiFiltri(m.voce.strati, m.domanda);
        if (filtri) box.append(filtri);
        if (m.oggetti?.length) box.append(pulsantiOggetti(m.oggetti));
        if (m.voce.pannelli?.length) box.append(pulsantiPannelli(m.voce.pannelli));
        if (m.voce.guide?.length) box.append(pulsantiGuide(m.voce.guide));
        if (m.cEAltro) {
          const b = Object.assign(el('button', 'cb-altro', m.espansa ? t('chatbot.mostraMeno') : t('chatbot.leggiTutto')), { type: 'button' });
          b.setAttribute('aria-expanded', String(m.espansa));
          b.addEventListener('click', () => conv.commuta(m.id));
          box.append(b);
        }
      } else if (m.tipo === 'luoghi') {
        box.append(el('p', null, t('chatbot.luoghi')), pulsantiOggetti(m.oggetti));
      } else if (m.tipo === 'nonLoSo') {
        box.append(el('p', null, t('chatbot.nonLoSo')));
        if (m.vicine.length) box.append(domande(t('chatbot.vicine'), m.vicine));
      } else if (m.tipo === 'errore') {
        box.append(el('p', null, t('chatbot.errore')));
      }
      log.append(box);
    }
    aggiornaLayer();
    aggiornaFiltri();
    log.scrollTop = log.scrollHeight;
  }

  // I pulsanti dei layer sono interruttori: seguono la casella del layer, anche se cambia dal pannello degli strati.
  function aggiornaLayer() {
    for (const b of log.querySelectorAll('.cb-layer')) {
      const st = statoStrato(document, b.dataset.strato);
      if (!st) continue;
      const suggerimento = t(st.acceso ? 'chatbot.disattiva' : 'chatbot.accendi', { nome: st.nome }); // tooltip e nome accessibile
      b.setAttribute('aria-pressed', String(st.acceso));
      b.title = b.ariaLabel = suggerimento;
    }
  }
  document.addEventListener('change', e => { if (e.target?.id?.startsWith('strato-')) aggiornaLayer(); aggiornaFiltri(); }); // anche i clic sulla legenda o sul pannello

  const conv = creaConversazione({ carica, cercaOggetti, suCambio: disegna });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const testo = campo.value;
    campo.value = '';
    chiedi(testo);
  });
  pannello.replaceChildren(testata, riquadroSunto, log, form);
  conv.avvia();
  campo.focus();
}
