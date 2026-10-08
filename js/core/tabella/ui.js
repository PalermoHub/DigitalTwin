// js/core/tabella/ui.js
// Il cassetto «Tabella»: schede per layer, griglia, selezione di righe e colonne, export.
import { t, tn, tl } from '../i18n.js';
import { scarica as scaricaFile } from '../../geoimage/scarica.js';
import { SORGENTI, LIMITE_RIGHE, MAX_DOM } from './sorgenti.js';
import { unisciColonne, applicaPreferenze, ordina, filtra, cella } from './modello.js';
import { nuovoStato, commutaRiga, tutte, nessuna, inverti, statoTutte, righeDaEsportare, commutaColonna, spostaColonna, colonneDaEsportare } from './selezione.js';
import { csv, geojson, nomeFile } from './esporta.js';
import { attiva, leggiVista, righeIn, evidenziaRighe, cancellaEvidenza, vaiA } from './mappa.js';
import { collegaStrumenti } from './strumenti.js';

const CHIAVE_ALTEZZA = 'dt-tabella-altezza';
const CHIAVE_COLONNE = id => `dt-tabella-colonne-${id}`;
const RITARDO = 250; // ms: attende che la mappa si fermi prima di rileggere le feature
const ALTEZZA_MIN = 160;

const leggiLocale = k => { try { return window.localStorage.getItem(k); } catch { return null; } };
const scriviLocale = (k, v) => { try { window.localStorage.setItem(k, v); } catch { /* storage bloccato: la scelta non resta */ } };

const el = (tag, classe, testo) => {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
};
const pulsante = (classe, testo, aria, azione) => {
  const b = el('button', classe, testo);
  b.type = 'button';
  if (aria) b.setAttribute('aria-label', aria);
  b.addEventListener('click', azione);
  return b;
};

export function collegaTabella(map, { pulsante: bottone }) {
  const stato = new Map(SORGENTI.map(s => [s.id, {
    sorgente: s, righe: [], colonne: [], sel: nuovoStato(), ordine: null, filtro: '', troppe: false,
  }]));
  const esportazioni = new Map(); // pulsanti correnti, per aggiornare il conteggio senza ridisegnare la barra
  let corrente = SORGENTI[0].id;
  let criterio = []; // poligoni scelti sulla mappa; vuoto = si mostra la vista
  let livelloArea = 'quartiere';
  let messaggio = ''; // ultimo avviso degli strumenti
  let aperto = false;
  let rinvio = null;

  // --- struttura ---
  const cassetto = el('section', 'tabella-dati');
  cassetto.id = 'tabella-dati';
  cassetto.hidden = true;
  cassetto.setAttribute('aria-label', t('tabella.titolo'));
  const maniglia = el('div', 'tabella-maniglia');
  maniglia.setAttribute('role', 'separator');
  maniglia.setAttribute('aria-orientation', 'horizontal');
  maniglia.setAttribute('aria-label', t('tabella.maniglia'));
  maniglia.tabIndex = 0;
  const testata = el('div', 'tabella-testata');
  const schede = el('div', 'tabella-schede');
  schede.setAttribute('role', 'tablist');
  const barra = el('div', 'tabella-barra');
  const nota = el('p', 'tabella-nota');
  const corpo = el('div', 'tabella-corpo');
  const annuncio = el('div', 'solo-lettori');
  annuncio.setAttribute('aria-live', 'polite');
  cassetto.append(maniglia, testata, schede, barra, nota, corpo, annuncio);
  document.body.append(cassetto);

  // --- altezza ridimensionabile ---
  const impostaAltezza = px => {
    const h = Math.max(ALTEZZA_MIN, Math.min(px, window.innerHeight * 0.7));
    cassetto.style.height = `${h}px`;
    document.body.style.setProperty('--tabella-h', aperto ? `${h}px` : '0px');
    return h;
  };
  impostaAltezza(Number(leggiLocale(CHIAVE_ALTEZZA)) || 280);
  maniglia.addEventListener('pointerdown', e => {
    maniglia.setPointerCapture(e.pointerId);
    const muovi = ev => impostaAltezza(window.innerHeight - ev.clientY - (document.getElementById('app-footer')?.offsetHeight ?? 0));
    const fine = () => {
      maniglia.removeEventListener('pointermove', muovi);
      maniglia.removeEventListener('pointerup', fine);
      scriviLocale(CHIAVE_ALTEZZA, String(parseInt(cassetto.style.height, 10)));
    };
    maniglia.addEventListener('pointermove', muovi);
    maniglia.addEventListener('pointerup', fine);
  });
  maniglia.addEventListener('keydown', e => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const h = impostaAltezza(parseInt(cassetto.style.height, 10) + (e.key === 'ArrowUp' ? 24 : -24));
    scriviLocale(CHIAVE_ALTEZZA, String(h));
  });

  // --- preferenze delle colonne ---
  function lette(id) {
    try { return JSON.parse(leggiLocale(CHIAVE_COLONNE(id)) ?? 'null'); } catch { return null; }
  }
  const salvaColonne = s => scriviLocale(CHIAVE_COLONNE(s.sorgente.id), JSON.stringify(s.colonne));

  // --- lettura delle righe ---
  function aggiorna() {
    if (!aperto) return;
    for (const s of stato.values()) {
      if (!attiva(map, s.sorgente)) { s.righe = []; s.troppe = false; continue; }
      let righe = leggiVista(map, s.sorgente);
      if (criterio.length) righe = righeIn(righe, criterio);
      s.troppe = righe.length > LIMITE_RIGHE;
      s.righe = s.troppe ? righe.slice(0, LIMITE_RIGHE) : righe;
      const prima = !s.colonne.length;
      s.colonne = unisciColonne(s.colonne, s.righe);
      if (prima) s.colonne = applicaPreferenze(s.colonne, lette(s.sorgente.id));
    }
    // la scheda corrente resta se ha righe, altrimenti si passa alla prima che ne ha
    if (!stato.get(corrente).righe.length) {
      const prima = [...stato.values()].find(s => s.righe.length);
      if (prima) corrente = prima.sorgente.id;
    }
    disegna();
  }
  const rinviaAggiorna = () => { clearTimeout(rinvio); rinvio = setTimeout(aggiorna, RITARDO); };

  // --- strumenti di selezione ---
  const strumenti = collegaStrumenti(map, {
    suCriterio: (poligoni, { aggiungi }) => {
      messaggio = '';
      criterio = aggiungi ? [...criterio, ...poligoni] : poligoni;
      aggiorna();
    },
    suMessaggio: testo => { messaggio = testo; nota.textContent = testo; },
  });

  // --- disegno ---
  const ordinate = s => {
    const filtrate = filtra(s.righe, s.filtro);
    return s.ordine ? ordina(filtrate, s.ordine.campo, s.ordine.verso) : filtrate;
  };
  const etichettaRighe = n => tn('tabella.righe', n);
  const dopoSelezione = s => { disegnaGriglia(s); disegnaEsporta(s); evidenziaSelezione(s); };

  function disegnaSchede() {
    schede.replaceChildren();
    for (const s of stato.values()) {
      const n = s.righe.length;
      if (!n && s.sorgente.id !== corrente) continue;
      const b = el('button', 'tabella-scheda', `${s.sorgente.nome} · ${n}`);
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(s.sorgente.id === corrente));
      b.addEventListener('click', () => { corrente = s.sorgente.id; disegna(); });
      schede.append(b);
    }
  }

  function disegnaColonne(s) {
    const dettagli = el('details', 'tabella-colonne');
    dettagli.append(el('summary', null, t('tabella.colonne')));
    const elenco = el('ul', 'tabella-colonne-elenco');
    s.colonne.forEach(c => {
      const nome = tl(c.campo);
      const voce = el('li');
      const vis = el('input');
      vis.type = 'checkbox';
      vis.checked = c.visibile;
      vis.setAttribute('aria-label', t('tabella.colonna.visibile', { nome }));
      vis.addEventListener('change', () => { s.colonne = commutaColonna(s.colonne, c.campo, 'visibile'); salvaColonne(s); disegna(); });
      const esp = el('input');
      esp.type = 'checkbox';
      esp.checked = c.esporta;
      esp.setAttribute('aria-label', t('tabella.colonna.esporta', { nome }));
      esp.addEventListener('change', () => { s.colonne = commutaColonna(s.colonne, c.campo, 'esporta'); salvaColonne(s); disegnaEsporta(s); });
      voce.append(vis, el('span', 'tabella-colonna-nome', nome), esp,
        pulsante('tabella-sposta', '◀', t('tabella.colonna.su', { nome }), () => { s.colonne = spostaColonna(s.colonne, c.campo, -1); salvaColonne(s); disegna(); }),
        pulsante('tabella-sposta', '▶', t('tabella.colonna.giu', { nome }), () => { s.colonne = spostaColonna(s.colonne, c.campo, 1); salvaColonne(s); disegna(); }));
      elenco.append(voce);
    });
    dettagli.append(elenco);
    const azioni = el('div', 'tabella-azioni-righe');
    const ordine = () => ordinate(s).map(r => r.chiave);
    for (const [testo, f] of [[t('tabella.riga.tutte'), tutte], [t('tabella.svuota'), nessuna], [t('tabella.inverti'), inverti]]) {
      azioni.append(pulsante('tabella-azione', testo, null, () => { s.sel = f(s.sel, ordine()); dopoSelezione(s); }));
    }
    return [dettagli, azioni];
  }

  function disegnaEsporta(s, crea = false) {
    const righe = righeDaEsportare(ordinate(s), s.sel);
    const colonne = colonneDaEsportare(s.colonne);
    const formati = [['csv', t('tabella.csv')], ['geojson', t('tabella.geojson')]];
    const pulsanti = crea ? formati.map(([f]) => {
      const b = pulsante('tabella-esporta', '', null, () => esportaFile(s, f));
      esportazioni.set(f, b);
      return b;
    }) : [];
    for (const [f, nome] of formati) {
      const b = esportazioni.get(f);
      if (!b) continue;
      b.textContent = t('tabella.esporta', { formato: nome, righe: righe.length, colonne: colonne.length });
      // senza righe o senza colonne scelte non c'è nulla da esportare
      b.disabled = !righe.length || !colonne.length || !s.sorgente.esporta;
      b.title = s.sorgente.esporta ? '' : t('tabella.nessunaEsportazione');
    }
    return pulsanti;
  }

  function esportaFile(s, formato) {
    const righe = righeDaEsportare(ordinate(s), s.sel);
    const colonne = colonneDaEsportare(s.colonne);
    if (!righe.length || !colonne.length || !s.sorgente.esporta) return;
    const id = s.sorgente.id;
    let testo;
    let mime;
    if (formato === 'csv') {
      testo = csv(righe, colonne, { fonte: s.sorgente.fonte });
      mime = 'text/csv;charset=utf-8';
    } else {
      if (s.sorgente.approssimata && !window.confirm(t('tabella.conferma.geojson'))) return;
      testo = geojson(righe, colonne, { layer: id, fonte: s.sorgente.fonte, approssimata: s.sorgente.approssimata, data: new Date().toISOString().slice(0, 10) });
      mime = 'application/geo+json;charset=utf-8';
    }
    scaricaFile(new Blob([testo], { type: mime }), nomeFile(id, formato === 'csv' ? 'csv' : 'geojson'));
  }

  function disegnaBarra(s) {
    barra.replaceChildren();
    esportazioni.clear();
    const gruppo = el('div', 'tabella-strumenti');
    gruppo.setAttribute('role', 'group');
    gruppo.setAttribute('aria-label', t('tabella.strumenti'));
    for (const modo of ['click', 'riquadro', 'poligono', 'area']) {
      const b = pulsante('tabella-strumento', t(`tabella.strumento.${modo}`), null, () => {
        strumenti.imposta(strumenti.modo() === modo ? null : modo);
        disegnaBarra(s);
      });
      b.setAttribute('aria-pressed', String(strumenti.modo() === modo));
      gruppo.append(b);
    }
    const livello = el('select', 'tabella-livello');
    livello.setAttribute('aria-label', t('tabella.livello'));
    for (const l of ['circoscrizione', 'quartiere', 'upl']) livello.append(new Option(t(`tabella.livello.${l}`), l));
    livello.value = livelloArea;
    livello.addEventListener('change', () => { livelloArea = livello.value; strumenti.livello(livelloArea); });
    gruppo.append(livello);
    const svuota = pulsante('tabella-azione', criterio.length ? t('tabella.tornaVista') : t('tabella.svuota'), null, () => {
      criterio = [];
      messaggio = '';
      for (const x of stato.values()) x.sel = nuovoStato();
      aggiorna();
    });
    const filtro = el('input', 'tabella-filtro');
    filtro.type = 'search';
    filtro.placeholder = t('tabella.filtro');
    filtro.setAttribute('aria-label', t('tabella.filtro'));
    filtro.value = s.filtro;
    filtro.addEventListener('input', () => { s.filtro = filtro.value; disegnaGriglia(s); disegnaEsporta(s); });
    barra.append(gruppo, svuota, filtro);
    barra.append(...disegnaColonne(s), ...disegnaEsporta(s, true));
  }

  function disegnaGriglia(s) {
    corpo.replaceChildren();
    const righe = ordinate(s);
    if (!attiva(map, s.sorgente)) { nota.textContent = messaggio; corpo.append(el('p', 'tabella-vuota', t('tabella.spento'))); return; }
    if (!s.righe.length) { nota.textContent = messaggio; corpo.append(el('p', 'tabella-vuota', t('tabella.vuota'))); return; }
    const avvisi = [messaggio, criterio.length ? '' : t('tabella.soloVista'), s.sorgente.approssimata ? t('tabella.approssimata') : '',
      s.troppe ? t('tabella.troppe', { max: LIMITE_RIGHE }) : '', righe.length > MAX_DOM ? t('tabella.mostrate', { n: MAX_DOM }) : ''];
    nota.textContent = avvisi.filter(Boolean).join(' ');

    const visibili = s.colonne.filter(c => c.visibile);
    const chiavi = righe.map(r => r.chiave);
    const tabella = el('table', 'tabella-griglia');
    tabella.setAttribute('role', 'grid');
    tabella.setAttribute('aria-rowcount', String(righe.length + 1));
    tabella.setAttribute('aria-colcount', String(visibili.length + 1));

    const testa = tabella.createTHead().insertRow();
    const tutteCasella = el('input');
    tutteCasella.type = 'checkbox';
    tutteCasella.setAttribute('aria-label', t('tabella.riga.tutte'));
    const st = statoTutte(s.sel, chiavi);
    tutteCasella.checked = st === 'tutte';
    tutteCasella.indeterminate = st === 'parziale';
    tutteCasella.addEventListener('change', () => {
      s.sel = tutteCasella.checked ? tutte(s.sel, chiavi) : nessuna(s.sel, chiavi);
      dopoSelezione(s);
    });
    testa.insertCell().append(tutteCasella);
    testa.cells[0].className = 'tabella-casella';
    for (const c of visibili) {
      const th = document.createElement('th');
      th.scope = 'col';
      const ordinata = s.ordine?.campo === c.campo;
      th.setAttribute('aria-sort', ordinata ? (s.ordine.verso === 'su' ? 'ascending' : 'descending') : 'none');
      th.append(pulsante('tabella-ordina', tl(c.campo), t('tabella.ordina', { nome: tl(c.campo) }), () => {
        s.ordine = { campo: c.campo, verso: ordinata && s.ordine.verso === 'su' ? 'giu' : 'su' };
        disegnaGriglia(s);
      }));
      testa.append(th);
    }

    const corpoTabella = tabella.createTBody();
    righe.slice(0, MAX_DOM).forEach((r, i) => {
      const tr = corpoTabella.insertRow();
      tr.tabIndex = i === 0 ? 0 : -1;
      tr.dataset.chiave = r.chiave;
      tr.setAttribute('aria-rowindex', String(i + 2));
      tr.setAttribute('aria-selected', String(s.sel.sel.has(r.chiave)));
      const casella = el('input');
      casella.type = 'checkbox';
      casella.checked = s.sel.sel.has(r.chiave);
      casella.setAttribute('aria-label', t('tabella.riga.seleziona'));
      casella.addEventListener('click', e => {
        s.sel = commutaRiga(s.sel, r.chiave, chiavi, e.shiftKey);
        dopoSelezione(s);
      });
      const primo = tr.insertCell();
      primo.className = 'tabella-casella';
      primo.append(casella);
      for (const c of visibili) tr.insertCell().textContent = cella(r.proprieta[c.campo]);
      tr.addEventListener('dblclick', () => vaiA(map, r));
      tr.addEventListener('keydown', e => tastiRiga(e, s, r, tr, chiavi));
    });
    corpo.append(tabella);
    annuncio.textContent = t('tabella.annuncio', { righe: etichettaRighe(righe.length), sel: s.sel.sel.size });
  }

  const rigaPer = chiave => corpo.querySelector(`[data-chiave="${CSS.escape(chiave)}"]`);

  function tastiRiga(e, s, r, tr, chiavi) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const vicina = e.key === 'ArrowDown' ? tr.nextElementSibling : tr.previousElementSibling;
      if (!vicina) return;
      const chiave = vicina.dataset.chiave;
      if (e.shiftKey) {
        s.sel = commutaRiga(s.sel, chiave, chiavi, true);
        dopoSelezione(s);
        rigaPer(chiave)?.focus(); // la griglia è stata ridisegnata: il focus va rimesso
      } else vicina.focus();
    } else if (e.key === ' ') {
      e.preventDefault();
      s.sel = commutaRiga(s.sel, r.chiave, chiavi, false);
      dopoSelezione(s);
      rigaPer(r.chiave)?.focus();
    } else if (e.key === 'Enter') vaiA(map, r);
  }

  function evidenziaSelezione(s) {
    const scelte = s.righe.filter(r => s.sel.sel.has(r.chiave));
    if (scelte.length) evidenziaRighe(map, scelte, s.sorgente.colore); else cancellaEvidenza(map);
  }

  function disegna() {
    const s = stato.get(corrente);
    disegnaSchede();
    disegnaBarra(s);
    disegnaGriglia(s);
    evidenziaSelezione(s);
  }

  // --- apertura e chiusura ---
  function apri() {
    aperto = true;
    cassetto.hidden = false;
    impostaAltezza(parseInt(cassetto.style.height, 10));
    bottone.setAttribute('aria-pressed', 'true');
    map.on('moveend', rinviaAggiorna);
    map.on('idle', rinviaAggiorna);
    aggiorna();
  }
  function chiudi() {
    aperto = false;
    clearTimeout(rinvio);
    cassetto.hidden = true;
    document.body.style.setProperty('--tabella-h', '0px');
    bottone.setAttribute('aria-pressed', 'false');
    map.off('moveend', rinviaAggiorna);
    map.off('idle', rinviaAggiorna);
    strumenti.imposta(null);
    cancellaEvidenza(map);
  }
  const commuta = () => (aperto ? chiudi() : apri());
  bottone.addEventListener('click', commuta);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && aperto && strumenti.modo()) { strumenti.imposta(null); disegnaBarra(stato.get(corrente)); }
  });

  return { apri, chiudi, commuta, aperta: () => aperto, elemento: cassetto };
}
