// Pannello «Chat bot»: disegna la conversazione di chat-bot-conversazione.js. Il testo delle risposte viene dalla guida:
// si inserisce solo come nodi di testo (mai innerHTML), con il solo grassetto **...** e gli elenchi «- ».
import { t } from './i18n.js';
import { svgIcona } from './icone.js';
import { creaConversazione } from './chat-bot-conversazione.js';
import { blocchiTesto } from './chat-bot-ricerca.js';
import { statoStrato, commutaStrato } from './chat-bot-strati.js';

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

export function creaChatBot(pannello, { carica } = {}) {
  const testata = el('header', 'gi-testata');
  testata.append(el('h2', null, t('chatbot.titolo')));
  const x = Object.assign(el('button', 'pannello-chiudi'), { type: 'button', title: t('chatbot.chiudi'), ariaLabel: t('chatbot.chiudi') });
  x.innerHTML = svgIcona('chiudi', 18);
  x.addEventListener('click', () => { pannello.hidden = true; });
  testata.append(x);

  const log = el('div', 'cb-log');
  log.setAttribute('role', 'log');
  log.setAttribute('aria-live', 'polite');

  const form = el('form', 'cb-form');
  const campo = Object.assign(el('input', 'cb-campo'), { type: 'text', autocomplete: 'off', placeholder: t('chatbot.segnaposto') });
  campo.setAttribute('aria-label', t('chatbot.campo'));
  const invia = Object.assign(el('button', 'gi-btn', t('chatbot.invia')), { type: 'submit' });
  form.append(campo, invia);

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
        if (m.cEAltro) {
          const b = Object.assign(el('button', 'cb-altro', m.espansa ? t('chatbot.mostraMeno') : t('chatbot.leggiTutto')), { type: 'button' });
          b.setAttribute('aria-expanded', String(m.espansa));
          b.addEventListener('click', () => conv.commuta(m.id));
          box.append(b);
        }
      } else if (m.tipo === 'nonLoSo') {
        box.append(el('p', null, t('chatbot.nonLoSo')));
        if (m.vicine.length) box.append(domande(t('chatbot.vicine'), m.vicine));
      } else if (m.tipo === 'errore') {
        box.append(el('p', null, t('chatbot.errore')));
      }
      log.append(box);
    }
    aggiornaLayer();
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
  document.addEventListener('change', e => { if (e.target?.id?.startsWith('strato-')) aggiornaLayer(); });

  const conv = creaConversazione({ carica, suCambio: disegna });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const testo = campo.value;
    campo.value = '';
    chiedi(testo);
  });
  pannello.replaceChildren(testata, log, form);
  conv.avvia();
  campo.focus();
}
