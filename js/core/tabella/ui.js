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
import { svgTabella } from './icone.js';

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
// Pulsante solo icona (stile barra QGIS): il nome per tutti è in aria-label e title.
const pulsanteIcona = (classe, icona, testo, azione) => {
  const b = el('button', classe);
  b.type = 'button';
  b.innerHTML = svgTabella(icona);
  b.setAttribute('aria-label', testo);
  b.title = testo;
  b.addEventListener('click', azione);
  return b;
};
const pulsante = (classe, testo, aria, azione) => {
  const b = el('button', classe, testo);
  b.type = 'button';
  if (aria) b.setAttribute('aria-label', aria);
  b.addEventListener('click', azione);
  return b;
};

// Firma di ciò che il cassetto mostra: se non cambia, ridisegnare non serve (e non rimette in moto la mappa).
export function firmaVista(stati, corrente, accesa = () => true) {
  const parti = [...stati].map(s => [s.sorgente.id, accesa(s) ? 1 : 0, s.troppe ? 1 : 0, s.righe.map(r => r.chiave).join(','),
    s.colonne.filter(c => c.visibile).map(c => c.campo).join(',')].join('|'));
  return [corrente, ...parti].join('#');
}
// Firma dell'evidenza sulla mappa: layer e righe selezionate.
export const firmaEvidenza = s => `${s.sorgente.id}|${s.righe.filter(r => s.sel.sel.has(r.chiave)).map(r => r.chiave).join(',')}`;

export function collegaTabella(map, { pulsante: bottone }) {
  const stato = new Map(SORGENTI.map(s => [s.id, {
    sorgente: s, righe: [], colonne: [], sel: nuovoStato(), ordine: null, filtro: '', troppe: false,
  }]));
  const accesa = s => attiva(map, s.sorgente);
  const esportazioni = new Map(); // pulsanti correnti, per aggiornare il conteggio senza ridisegnare la barra
  let corrente = SORGENTI[0].id;
  let criterio = []; // poligoni scelti sulla mappa; vuoto = si mostra la vista
  let livelloArea = 'quartiere';
  let messaggio = ''; // ultimo avviso degli strumenti
  let aperto = false;
  let rinvio = null;
  let ultimaFirma = null; // firma dell'ultimo disegno
  let ultimaEvidenza = null; // firma dell'ultima evidenza sulla mappa
  let dettagliAperti = false; // menu Colonne aperto
  let rigaAttiva = null; // riga con tabindex 0 (roving)

  // --- struttura ---
  const cassetto = el('section', 'tabella-dati');
  cassetto.id = 'tabella-dati';
  cassetto.tabIndex = -1; // riceve il focus se l'elemento attivo sparisce
  cassetto.hidden = true;
  cassetto.setAttribute('aria-label', t('tabella.titolo'));
  const maniglia = el('div', 'tabella-maniglia');
  maniglia.setAttribute('role', 'separator');
  maniglia.setAttribute('aria-orientation', 'horizontal');
  maniglia.setAttribute('aria-label', t('tabella.maniglia'));
  maniglia.tabIndex = 0;
  const testata = el('div', 'tabella-testata');
  testata.append(el('span', 'tabella-titolo', t('tabella.titolo')), pulsante('tabella-chiudi', '×', t('tabella.chiudi'), () => chiudi()));
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
  function aggiorna(forza = false) {
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
    // la scheda corrente resta se ha righe, altrimenti si passa alla prima che ne ha, o alla prima accesa
    if (!stato.get(corrente).righe.length) {
      const tutte = [...stato.values()];
      const prima = tutte.find(s => s.righe.length) ?? tutte.find(accesa);
      if (prima) corrente = prima.sorgente.id;
    }
    if (!forza && firmaVista(stato.values(), corrente, accesa) === ultimaFirma) return;
    disegna();
  }
  const rinviaAggiorna = () => { clearTimeout(rinvio); rinvio = setTimeout(aggiorna, RITARDO); };

  // --- strumenti di selezione ---
  const strumenti = collegaStrumenti(map, {
    suCriterio: (poligoni, { aggiungi }) => {
      messaggio = '';
      criterio = aggiungi ? [...criterio, ...poligoni] : poligoni;
      aggiorna(true);
    },
    suMessaggio: testo => { messaggio = testo; nota.textContent = testo; },
  });

  // --- disegno ---
  const ordinate = s => {
    const filtrate = filtra(s.righe, s.filtro);
    return s.ordine ? ordina(filtrate, s.ordine.campo, s.ordine.verso) : filtrate;
  };
  // Ricorda dov'era il focus dentro `contenitore` e ritorna la funzione che lo rimette dopo il ridisegno.
  // Se il focus era altrove (mappa, ricerca) non fa nulla; se l'elemento sparisce, il focus va al cassetto.
  function ricordaFocus(contenitore) {
    const att = document.activeElement;
    if (!att || !contenitore.contains(att)) return () => {};
    const id = att.closest('[data-focus]')?.dataset.focus ?? null;
    const sel = typeof att.selectionStart === 'number' ? [att.selectionStart, att.selectionEnd] : null;
    return () => {
      const nuovo = id == null ? null : [...contenitore.querySelectorAll('[data-focus]')].find(x => x.dataset.focus === id);
      nuovo?.focus();
      if (nuovo && sel) { try { nuovo.setSelectionRange(sel[0], sel[1]); } catch { /* campo senza selezione */ } }
      if (!cassetto.contains(document.activeElement)) cassetto.focus();
    };
  }
  const etichettaRighe = n => tn('tabella.righe', n);
  const dopoSelezione = s => { disegnaGriglia(s); disegnaEsporta(s); evidenziaSelezione(s); };

  function disegnaSchede() {
    const ripristina = ricordaFocus(schede);
    schede.replaceChildren();
    for (const s of stato.values()) {
      const n = s.righe.length;
      if (!accesa(s) || (!n && s.sorgente.id !== corrente)) continue; // un layer spento non ha scheda
      const b = el('button', 'tabella-scheda', `${s.sorgente.nome} · ${n}`);
      b.type = 'button';
      b.dataset.focus = `scheda:${s.sorgente.id}`;
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(s.sorgente.id === corrente));
      b.addEventListener('click', () => { corrente = s.sorgente.id; disegna(); });
      schede.append(b);
    }
    ripristina();
  }

  function disegnaColonne(s) {
    const dettagli = el('details', 'tabella-colonne');
    dettagli.open = dettagliAperti;
    // il menu è fixed (la barra scorre in orizzontale e lo taglierebbe): lo si ancora sopra il pulsante
    const posiziona = () => {
      if (!dettagli.open) return;
      const r = dettagli.querySelector('summary').getBoundingClientRect();
      const menu = dettagli.querySelector('.tabella-colonne-elenco');
      menu.style.left = `${Math.max(4, Math.min(r.left, window.innerWidth - menu.offsetWidth - 4))}px`;
      menu.style.bottom = `${window.innerHeight - r.top + 4}px`;
    };
    dettagli.addEventListener('toggle', () => { dettagliAperti = dettagli.open; posiziona(); });
    requestAnimationFrame(posiziona);
    const sommario = el('summary', null);
    sommario.innerHTML = svgTabella('colonne');
    sommario.setAttribute('aria-label', t('tabella.colonne'));
    sommario.title = t('tabella.colonne');
    sommario.dataset.focus = 'colonne';
    dettagli.append(sommario);
    const elenco = el('ul', 'tabella-colonne-elenco');
    s.colonne.forEach(c => {
      const nome = tl(c.campo);
      const voce = el('li');
      const vis = el('input');
      vis.type = 'checkbox';
      vis.dataset.focus = `col-vis:${c.campo}`;
      vis.checked = c.visibile;
      vis.setAttribute('aria-label', t('tabella.colonna.visibile', { nome }));
      vis.addEventListener('change', () => { s.colonne = commutaColonna(s.colonne, c.campo, 'visibile'); salvaColonne(s); disegna(); });
      const esp = el('input');
      esp.type = 'checkbox';
      esp.dataset.focus = `col-esp:${c.campo}`;
      esp.checked = c.esporta;
      esp.setAttribute('aria-label', t('tabella.colonna.esporta', { nome }));
      esp.addEventListener('change', () => { s.colonne = commutaColonna(s.colonne, c.campo, 'esporta'); salvaColonne(s); disegnaEsporta(s); });
      const su = pulsante('tabella-sposta', '◀', t('tabella.colonna.su', { nome }), () => { s.colonne = spostaColonna(s.colonne, c.campo, -1); salvaColonne(s); disegna(); });
      const giu = pulsante('tabella-sposta', '▶', t('tabella.colonna.giu', { nome }), () => { s.colonne = spostaColonna(s.colonne, c.campo, 1); salvaColonne(s); disegna(); });
      su.dataset.focus = `col-su:${c.campo}`;
      giu.dataset.focus = `col-giu:${c.campo}`;
      voce.append(vis, el('span', 'tabella-colonna-nome', nome), esp, su, giu);
      elenco.append(voce);
    });
    dettagli.append(elenco);
    const azioni = el('div', 'tabella-azioni-righe');
    const ordine = () => ordinate(s).map(r => r.chiave);
    for (const [id, testo, f] of [['tutte', t('tabella.riga.tutte'), tutte], ['svuota', t('tabella.svuota'), nessuna], ['inverti', t('tabella.inverti'), inverti]]) {
      const b = pulsanteIcona('tabella-azione', id, testo, () => { s.sel = f(s.sel, ordine()); dopoSelezione(s); });
      b.dataset.focus = `azione:${id}`;
      azioni.append(b);
    }
    return [dettagli, azioni];
  }

  function disegnaEsporta(s, crea = false) {
    const righe = righeDaEsportare(ordinate(s), s.sel);
    const colonne = colonneDaEsportare(s.colonne);
    const formati = [['csv', t('tabella.csv')], ['geojson', t('tabella.geojson')]];
    const pulsanti = crea ? formati.map(([f]) => {
      const b = el('button', 'tabella-esporta');
      b.type = 'button';
      b.innerHTML = `${svgTabella('esporta')}<span class="tabella-esporta-nome"></span><span class="tabella-esporta-n"></span>`;
      b.addEventListener('click', () => esportaFile(s, f));
      b.dataset.focus = `esporta:${f}`;
      esportazioni.set(f, b);
      return b;
    }) : [];
    for (const [f, nome] of formati) {
      const b = esportazioni.get(f);
      if (!b) continue;
      const completo = t('tabella.esporta', { formato: nome, righe: righe.length, colonne: colonne.length });
      b.querySelector('.tabella-esporta-nome').textContent = nome;
      b.querySelector('.tabella-esporta-n').textContent = `${righe.length} × ${colonne.length}`;
      b.setAttribute('aria-label', completo);
      // senza righe o senza colonne scelte non c'è nulla da esportare
      b.disabled = !righe.length || !colonne.length || !s.sorgente.esporta;
      b.title = s.sorgente.esporta ? completo : t('tabella.nessunaEsportazione');
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
    const ripristina = ricordaFocus(barra);
    barra.replaceChildren();
    esportazioni.clear();
    const gruppo = el('div', 'tabella-strumenti');
    gruppo.setAttribute('role', 'group');
    gruppo.setAttribute('aria-label', t('tabella.strumenti'));
    for (const modo of ['click', 'riquadro', 'poligono', 'area']) {
      const b = pulsanteIcona('tabella-strumento', modo, t(`tabella.strumento.${modo}`), () => {
        strumenti.imposta(strumenti.modo() === modo ? null : modo);
        disegnaBarra(s);
      });
      b.dataset.modo = modo; // il CSS su telefono nasconde riquadro e poligono
      b.dataset.focus = `strumento:${modo}`;
      b.setAttribute('aria-pressed', String(strumenti.modo() === modo));
      gruppo.append(b);
    }
    const livello = el('select', 'tabella-livello');
    livello.dataset.focus = 'livello';
    livello.setAttribute('aria-label', t('tabella.livello'));
    for (const l of ['circoscrizione', 'quartiere', 'upl']) livello.append(new Option(t(`tabella.livello.${l}`), l));
    livello.value = livelloArea;
    livello.addEventListener('change', () => { livelloArea = livello.value; strumenti.livello(livelloArea); });
    gruppo.append(livello);
    const torna = criterio.length ? pulsanteIcona('tabella-azione', 'torna', t('tabella.tornaVista'), () => {
      criterio = [];
      messaggio = '';
      aggiorna(true);
    }) : null;
    const filtro = el('input', 'tabella-filtro');
    filtro.type = 'search';
    filtro.dataset.focus = 'filtro';
    filtro.placeholder = t('tabella.filtro');
    filtro.setAttribute('aria-label', t('tabella.filtro'));
    filtro.value = s.filtro;
    filtro.addEventListener('input', () => { s.filtro = filtro.value; disegnaGriglia(s); disegnaEsporta(s); });
    if (torna) torna.dataset.focus = 'torna';
    barra.append(gruppo, ...(torna ? [torna] : []), filtro);
    const esporti = el('div', 'tabella-esporti');
    esporti.append(...disegnaEsporta(s, true));
    barra.append(...disegnaColonne(s), esporti);
    ripristina();
  }

  function disegnaGriglia(s) {
    const ripristina = ricordaFocus(corpo);
    costruisciGriglia(s);
    ripristina();
  }

  function costruisciGriglia(s) {
    corpo.replaceChildren();
    const righe = ordinate(s);
    if (!accesa(s)) { nota.textContent = messaggio; corpo.append(el('p', 'tabella-vuota', t('tabella.nessunLayer'))); return; }
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
    tutteCasella.dataset.focus = 'tutte-righe';
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
      const ord = pulsante('tabella-ordina', tl(c.campo), t('tabella.ordina', { nome: tl(c.campo) }), () => {
        s.ordine = { campo: c.campo, verso: ordinata && s.ordine.verso === 'su' ? 'giu' : 'su' };
        disegnaGriglia(s);
      });
      ord.dataset.focus = `ord:${c.campo}`;
      th.append(ord);
      testa.append(th);
    }

    const corpoTabella = tabella.createTBody();
    const mostrate = righe.slice(0, MAX_DOM);
    if (!mostrate.some(r => r.chiave === rigaAttiva)) rigaAttiva = mostrate[0]?.chiave ?? null;
    mostrate.forEach((r, i) => {
      const tr = corpoTabella.insertRow();
      tr.tabIndex = r.chiave === rigaAttiva ? 0 : -1;
      tr.dataset.chiave = r.chiave;
      tr.dataset.focus = `riga:${r.chiave}`;
      tr.setAttribute('aria-rowindex', String(i + 2));
      tr.setAttribute('aria-selected', String(s.sel.sel.has(r.chiave)));
      const casella = el('input');
      casella.type = 'checkbox';
      casella.checked = s.sel.sel.has(r.chiave);
      casella.dataset.focus = `casella:${r.chiave}`;
      casella.tabIndex = -1; // si naviga per righe, non per caselle
      casella.setAttribute('aria-label', t('tabella.riga.seleziona'));
      casella.addEventListener('click', e => {
        s.sel = commutaRiga(s.sel, r.chiave, chiavi, e.shiftKey);
        dopoSelezione(s);
      });
      const primo = tr.insertCell();
      primo.className = 'tabella-casella';
      primo.append(casella);
      for (const c of visibili) tr.insertCell().textContent = cella(r.proprieta[c.campo]);
      tr.addEventListener('focusin', () => {
        if (rigaAttiva === r.chiave) return;
        const prec = rigaPer(rigaAttiva);
        if (prec) prec.tabIndex = -1;
        rigaAttiva = r.chiave;
        tr.tabIndex = 0;
      });
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
        // primo Maiusc+freccia: la riga di partenza fa parte dell'intervallo
        const base = s.sel.ultimo == null ? { ...s.sel, ultimo: r.chiave } : s.sel;
        s.sel = commutaRiga(base, chiave, chiavi, true);
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
    const firma = firmaEvidenza(s);
    if (firma === ultimaEvidenza) return; // niente setData inutili: rimetterebbero in moto idle
    ultimaEvidenza = firma;
    const scelte = s.righe.filter(r => s.sel.sel.has(r.chiave));
    if (scelte.length) evidenziaRighe(map, scelte, s.sorgente.colore); else cancellaEvidenza(map);
  }

  function disegna() {
    const s = stato.get(corrente);
    ultimaFirma = firmaVista(stato.values(), corrente, accesa);
    disegnaSchede();
    disegnaBarra(s);
    disegnaGriglia(s);
    evidenziaSelezione(s);
  }

  // --- apertura e chiusura ---
  function apri() {
    if (aperto) return;
    aperto = true;
    cassetto.hidden = false;
    impostaAltezza(parseInt(cassetto.style.height, 10));
    bottone.setAttribute('aria-pressed', 'true');
    map.on('moveend', rinviaAggiorna);
    map.on('idle', rinviaAggiorna);
    aggiorna(true);
  }
  function chiudi() {
    if (!aperto) return;
    aperto = false;
    ultimaFirma = null;
    ultimaEvidenza = null;
    clearTimeout(rinvio);
    cassetto.hidden = true;
    document.body.style.setProperty('--tabella-h', '0px');
    bottone.setAttribute('aria-pressed', 'false');
    map.off('moveend', rinviaAggiorna);
    map.off('idle', rinviaAggiorna);
    if (strumenti.modo()) strumenti.imposta(null);
    cancellaEvidenza(map);
  }
  const commuta = () => (aperto ? chiudi() : apri());
  bottone.addEventListener('click', commuta);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && aperto && strumenti.modo()) { strumenti.imposta(null); disegnaBarra(stato.get(corrente)); }
  });

  return { apri, chiudi, commuta, aperta: () => aperto, elemento: cassetto };
}
