// Pannello «Stampa»: scelta di cosa stampare. Un riquadro trascinabile sulla mappa (con la proporzione del foglio) dice quale area
// finisce nel file; il pannello sceglie formato, uscita, titolo ed elementi e mostra un'anteprima che si aggiorna da sola.
// La mappa sotto il riquadro resta spostabile e ingrandibile: il riquadro resta fermo sullo schermo.
import { t as tr, localeIntl } from './i18n.js';
import { FORMATI, SCALE_STAMPA, areaMappaMm, attribuzioniUniche, el, esportaFile, limiteLatoGpu, mmInPx, pixelRatioSicuro, stampaFoglio, zoomPerScala } from './stampa.js';
import { conAvvisoStampa } from './avviso-attesa.js';
import { calcolaPadding } from './padding-mappa.js';
import { leggiLegende } from './stampa-legende.js';
import { areaMappaPoster, caricaLogo, disegnaPoster, paginaMm, sottotitoloPredefinito, zoomPerPagina } from './stampa-poster.js';

const LARGHEZZA_GRANDE = 2000; // px del canvas dell'anteprima ingrandita
const LARGHEZZA_ANTEPRIMA = 640; // px del canvas dell'anteprima (CSS lo adatta al pannello)
const LARGHEZZA_MIN_RIQUADRO = 80;
const MARGINE_INIZIALE = 0.12;

// Proporzione larghezza/altezza dell'area stampata: la mappa dentro la cornice per il poster, l'area sopra i testi per il foglio
export function aspetto(formato, direzione, uscita) {
  const a = uscita === 'stampa' ? areaMappaMm(formato, direzione) : areaMappaPoster(formato, direzione);
  return a.larghezza / a.altezza;
}

// Riquadro { x, y, w, h } in px dello schermo, al centro della vista e con un margine tutt'intorno
// `vista.sinistra` (opzionale) = x da cui la mappa è libera: a sinistra c'è il pannello
// `vista.alto` (opzionale) = y da cui la mappa è libera: sul telefono il pannello è un foglio in alto; `vista.altezza` è il limite in basso
export function riquadroIniziale(vista, proporzione) {
  const sinistra = vista.sinistra ?? 0;
  const alto = vista.alto ?? 0;
  const libera = vista.larghezza - sinistra;
  const liberaA = vista.altezza - alto;
  const maxL = libera * (1 - 2 * MARGINE_INIZIALE);
  const maxA = liberaA * (1 - 2 * MARGINE_INIZIALE);
  const w = Math.min(maxL, maxA * proporzione);
  const h = w / proporzione;
  return { x: sinistra + (libera - w) / 2, y: alto + (liberaA - h) / 2, w, h };
}

// Tiene il riquadro dentro la vista senza cambiarne la dimensione
export function dentroVista(r, vista) {
  return { ...r, x: Math.max(vista.sinistra ?? 0, Math.min(r.x, vista.larghezza - r.w)), y: Math.max(vista.alto ?? 0, Math.min(r.y, vista.altezza - r.h)) };
}

// Nuova proporzione (cambio di formato o orientamento): stesso centro e stessa larghezza, ridotto se non sta nella vista
export function adattaProporzione(r, proporzione, vista) {
  let w = r.w;
  let h = w / proporzione;
  const liberaA = vista.altezza - (vista.alto ?? 0);
  if (h > liberaA) { h = liberaA; w = h * proporzione; }
  const libera = vista.larghezza - (vista.sinistra ?? 0);
  if (w > libera) { w = libera; h = w / proporzione; }
  return dentroVista({ x: r.x + r.w / 2 - w / 2, y: r.y + r.h / 2 - h / 2, w, h }, vista);
}

// Ridimensiona dall'angolo in basso a destra tenendo la proporzione, senza uscire dalla vista né scendere sotto il minimo
export function ridimensiona(r, dx, proporzione, vista) {
  let w = Math.max(LARGHEZZA_MIN_RIQUADRO, Math.min(r.w + dx, vista.larghezza - r.x));
  let h = w / proporzione;
  if (r.y + h > vista.altezza) { h = vista.altezza - r.y; w = h * proporzione; }
  return { ...r, w, h };
}

// Copia del fotogramma della mappa: il canvas WebGL si legge solo durante il render
function fotogramma(map) {
  return new Promise(risolvi => {
    map.once('render', () => {
      const c = map.getCanvas();
      const copia = Object.assign(document.createElement('canvas'), { width: c.width, height: c.height });
      copia.getContext('2d').drawImage(c, 0, 0);
      risolvi(copia);
    });
    map.triggerRepaint();
  });
}

const OPZIONI_ELEMENTI = ['legenda', 'scala', 'rosa', 'griglia']; // logo, fonte, attribuzioni e cornice non si tolgono

export function creaPannelloStampa(map, radice) {
  const contenitore = map.getContainer();
  const stato = { formato: 'A4', direzione: 'landscape', uscita: 'png', dpi: 150, scala: null, titolo: '', sottotitolo: '', elementi: Object.fromEntries(OPZIONI_ELEMENTI.map(k => [k, true])), riquadro: null, occupato: false };
  let logo = null;
  let ultimoFotogramma = null;
  let aperto = false;
  let legende = [];

  // Area della mappa in cui sta il riquadro: quella non coperta dai pannelli (a sinistra Layer, a destra questo pannello), così riquadro
  // e maniglia non finiscono mai sotto un pannello. Sul telefono il pannello è un foglio basso: la mappa libera sta sopra.
  const vista = () => {
    const b = contenitore.getBoundingClientRect();
    let larghezza = contenitore.clientWidth;
    let altezza = contenitore.clientHeight;
    let sinistra = 0;
    let alto = 0;
    if (aperto) {
      const minimo = 2 * LARGHEZZA_MIN_RIQUADRO;
      if (matchMedia('(max-width: 720px)').matches) {
        const p = (radice.parentElement ?? radice).getBoundingClientRect();
        if (p.top - b.top < b.height / 2) { // foglio in alto: la mappa libera sta sotto, sopra la barra dei tab
          const tab = document.getElementById('barra-tab');
          const fondo = tab && tab.offsetParent !== null ? tab.getBoundingClientRect().top - b.top - 8 : altezza;
          alto = Math.max(0, Math.min(p.bottom - b.top + 12, altezza - minimo));
          altezza = Math.max(alto + minimo, Math.min(altezza, fondo));
        } else altezza = Math.max(minimo, Math.min(altezza, p.top - b.top - 12)); // foglio basso: la mappa libera sta sopra
      } else {
        const pad = calcolaPadding(document, contenitore, false);
        sinistra = pad.left ? Math.min(larghezza - minimo, pad.left + 12) : 0;
        larghezza = Math.max(sinistra + minimo, larghezza - (pad.right ? pad.right + 12 : 0));
      }
    }
    return { larghezza, altezza, sinistra, alto };
  };
  // Con una scala fissa l'area stampata la decide la scala, non il riquadro: il riquadro prende l'estensione reale (stesso centro) e
  // non si ridimensiona più; per stampare di più o di meno si cambia lo zoom della mappa o la scala.
  const adattaAScala = () => {
    riquadro.classList.toggle('a-scala', Boolean(stato.scala));
    if (!stato.scala || !stato.riquadro) return;
    const r = stato.riquadro;
    const area = stato.uscita === 'stampa' ? areaMappaMm(stato.formato, stato.direzione) : areaMappaPoster(stato.formato, stato.direzione);
    const centro = map.unproject([r.x + r.w / 2, r.y + r.h / 2]);
    const k = 2 ** (map.getZoom() - zoomPerScala(centro.lat, stato.scala)); // pixel dello schermo per pixel del foglio
    const w = mmInPx(area.larghezza) * k;
    const h = mmInPx(area.altezza) * k;
    stato.riquadro = { x: r.x + r.w / 2 - w / 2, y: r.y + r.h / 2 - h / 2, w, h };
    posiziona();
  };
  // Se l'estensione della scala non sta nella parte libera della mappa (o è minuscola), si cambia lo zoom finché ci sta bene (la stampa non cambia)
  const portaInVista = () => {
    if (!stato.scala || !stato.riquadro) return;
    const v = vista();
    const r = stato.riquadro;
    const lib = { w: v.larghezza - (v.sinistra ?? 0), h: v.altezza - (v.alto ?? 0) };
    if (r.w <= lib.w && r.h <= lib.h && (r.w >= lib.w * 0.3 || r.h >= lib.h * 0.3)) return; // sta e si vede bene
    const k = Math.min(lib.w * 0.88 / r.w, lib.h * 0.88 / r.h);
    map.zoomTo(map.getZoom() + Math.log2(k), { duration: 0 });
    stato.riquadro = riquadroIniziale(v, proporzione());
    adattaAScala();
  };
  const proporzione = () => aspetto(stato.formato, stato.direzione, stato.uscita);

  // — riquadro sulla mappa —
  const maniglia = el('span', { className: 'stampa-maniglia', title: tr('stampa.maniglia') });
  const riquadro = el('div', { id: 'stampa-riquadro', hidden: true }, maniglia);
  document.body.append(riquadro);
  const posiziona = () => {
    const r = stato.riquadro;
    const b = contenitore.getBoundingClientRect();
    Object.assign(riquadro.style, { left: `${b.left + r.x}px`, top: `${b.top + r.y}px`, width: `${r.w}px`, height: `${r.h}px` });
  };
  let trascina = null;
  riquadro.addEventListener('pointerdown', e => {
    if (stato.scala && e.target === maniglia) return; // a scala fissa l'estensione è quella della scala
    trascina = { tipo: e.target === maniglia ? 'maniglia' : 'sposta', x: e.clientX, y: e.clientY, partenza: { ...stato.riquadro } };
    riquadro.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  riquadro.addEventListener('pointermove', e => {
    if (!trascina) return;
    const dx = e.clientX - trascina.x;
    const dy = e.clientY - trascina.y;
    stato.riquadro = trascina.tipo === 'maniglia'
      ? ridimensiona(trascina.partenza, dx, proporzione(), vista())
      : dentroVista({ ...trascina.partenza, x: trascina.partenza.x + dx, y: trascina.partenza.y + dy }, vista());
    posiziona();
  });
  const rilascia = () => { if (trascina) { trascina = null; aggiornaAnteprima(); } };
  riquadro.addEventListener('pointerup', rilascia);
  riquadro.addEventListener('pointercancel', rilascia);

  // — anteprima —
  const anteprima = el('canvas', { className: 'stampa-anteprima', role: 'img', ariaLabel: tr('stampa.anteprima.alt') });
  // Centro e zoom con cui il riquadro verrebbe reso: gli stessi dell'esportazione, così la graticola dell'anteprima è quella vera
  const inquadratura = () => {
    const r = stato.riquadro;
    const area = stato.uscita === 'stampa' ? areaMappaMm(stato.formato, stato.direzione) : areaMappaPoster(stato.formato, stato.direzione);
    return {
      centro: map.unproject([r.x + r.w / 2, r.y + r.h / 2]),
      zoom: zoomPerPagina(map.getZoom(), { larghezza: r.w, altezza: r.h }, { larghezza: mmInPx(area.larghezza), altezza: mmInPx(area.altezza) }),
    };
  };
  const sottotitoloEffettivo = () => stato.sottotitolo;
  // Disegna l'anteprima su `tela` alla larghezza `larghezza` px: la stessa immagine nel pannello (piccola) e ingrandita (finestra)
  function disegnaAnteprimaSu(tela, larghezza) {
    const r = stato.riquadro;
    const k = ultimoFotogramma.width / contenitore.clientWidth;
    const ritaglio = { x: r.x * k, y: r.y * k, w: r.w * k, h: r.h * k };
    if (stato.uscita === 'stampa') {
      tela.width = larghezza;
      tela.height = Math.round(larghezza / proporzione());
      tela.getContext('2d').drawImage(ultimoFotogramma, ritaglio.x, ritaglio.y, ritaglio.w, ritaglio.h, 0, 0, tela.width, tela.height);
      return;
    }
    const pagina = paginaMm(stato.formato, stato.direzione);
    tela.width = larghezza;
    tela.height = Math.round(larghezza * pagina.altezza / pagina.larghezza);
    const data = new Date().toLocaleDateString(localeIntl(), { day: 'numeric', month: 'long', year: 'numeric' });
    const vista = inquadratura();
    disegnaPoster(tela, {
      pagina, formato: stato.formato, direzione: stato.direzione, titolo: stato.titolo || tr('stampa.poster.titoloDefault'),
      sottotitolo: sottotitoloEffettivo() || sottotitoloPredefinito(vista.centro, data),
      attribuzioni: attribuzioniUniche([...document.querySelectorAll('#mappa .maplibregl-ctrl-attrib-inner')].map(a => a.textContent)),
      logo, data, elementi: stato.elementi, legende, mappa: { immagine: ultimoFotogramma, ritaglio }, vista,
    });
  }
  async function aggiornaAnteprima(nuovoFotogramma = true) {
    if (!aperto || !stato.riquadro) return;
    if (nuovoFotogramma) [ultimoFotogramma, legende] = await Promise.all([fotogramma(map), leggiLegende(document)]);
    if (!aperto || !ultimoFotogramma) return;
    disegnaAnteprimaSu(anteprima, LARGHEZZA_ANTEPRIMA);
    if (finestraGrande.open) disegnaAnteprimaSu(telaGrande, LARGHEZZA_GRANDE);
  }
  // Un clic (o Invio) sull'anteprima la apre grande, a tutto schermo; si chiude con Esc, un clic o la X
  const telaGrande = el('canvas', { className: 'stampa-anteprima-tela', role: 'img', ariaLabel: tr('stampa.anteprima.alt') });
  const chiudiGrande = el('button', { type: 'button', className: 'stampa-anteprima-chiudi', textContent: '×', ariaLabel: tr('comune.chiudi') });
  const finestraGrande = el('dialog', { className: 'stampa-anteprima-grande' }, telaGrande, chiudiGrande);
  const apriGrande = () => { if (!ultimoFotogramma) return; disegnaAnteprimaSu(telaGrande, LARGHEZZA_GRANDE); if (!finestraGrande.open) finestraGrande.showModal(); };
  anteprima.tabIndex = 0;
  anteprima.title = tr('stampa.anteprima.ingrandisci');
  anteprima.addEventListener('click', apriGrande);
  anteprima.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); apriGrande(); } });
  finestraGrande.addEventListener('click', () => finestraGrande.close());
  document.body.append(finestraGrande);
  const sulMovimento = () => { adattaAScala(); aggiornaAnteprima(); };
  const sulRidimensionamento = () => { if (aperto) { stato.riquadro = adattaProporzione(stato.riquadro, proporzione(), vista()); posiziona(); adattaAScala(); aggiornaAnteprima(); } };

  // — controlli —
  const sceltaDa = (id, etichetta, opzioni, valore, suCambio) => {
    const select = el('select', { id }, ...opzioni.map(([v, testo]) => el('option', { value: v, textContent: testo, selected: v === valore })));
    select.addEventListener('change', () => suCambio(select.value));
    return el('label', { className: 'stampa-campo', htmlFor: id }, el('span', { textContent: etichetta }), select);
  };
  const campoTesto = (id, etichetta, suCambio, segnaposto = '') => {
    const input = el('input', { id, type: 'text', maxLength: 90, placeholder: segnaposto });
    input.addEventListener('input', () => suCambio(input.value.trim()));
    return el('label', { className: 'stampa-campo', htmlFor: id }, el('span', { textContent: etichetta }), input);
  };
  const dopoCambioProporzione = () => { stato.riquadro = adattaProporzione(stato.riquadro, proporzione(), vista()); posiziona(); adattaAScala(); portaInVista(); aggiornaVisibilita(); aggiornaRisoluzione(); aggiornaAnteprima(false); };
  const campoSoloPoster = [];
  const elementi = el('fieldset', { className: 'stampa-elementi' }, el('legend', { textContent: tr('stampa.elementi') }),
    ...OPZIONI_ELEMENTI.map(k => {
      const casella = el('input', { type: 'checkbox', checked: true });
      casella.addEventListener('change', () => { stato.elementi[k] = casella.checked; aggiornaAnteprima(false); });
      return el('label', {}, casella, el('span', { textContent: tr(`stampa.el.${k}`) }));
    }),
    el('p', { className: 'stampa-nota', textContent: tr('stampa.el.nota') }));
  const sottotitolo = campoTesto('stampa-sottotitolo', tr('stampa.sottotitolo'), v => { stato.sottotitolo = v; aggiornaAnteprima(false); }, tr('stampa.sottotitolo.segnaposto'));
  campoSoloPoster.push(sottotitolo, elementi);
  const aggiornaVisibilita = () => campoSoloPoster.forEach(n => { n.hidden = stato.uscita === 'stampa'; });
  // Risoluzione di uscita: la dimensione in pixel dell'immagine; il dispositivo ha un limite alla cattura, che qui si dichiara
  const infoRisoluzione = el('p', { className: 'stampa-nota' });
  const aggiornaRisoluzione = () => {
    const ratio = pixelRatioSicuro(stato.dpi / 96, areaMappaPoster(stato.formato, stato.direzione), limiteLatoGpu(map));
    const pagina = paginaMm(stato.formato, stato.direzione);
    const px = mm => Math.round(mm / 25.4 * ratio * 96).toLocaleString(localeIntl());
    const effettivi = Math.round(ratio * 96);
    infoRisoluzione.textContent = tr('stampa.risoluzione.info', { l: px(pagina.larghezza), a: px(pagina.altezza) }) + (effettivi < stato.dpi - 1 ? ` · ${tr('stampa.risoluzione.limitata', { dpi: effettivi })}` : '');
  };

  const campoRisoluzione = sceltaDa('stampa-risoluzione', tr('html.stampa.risoluzione'), [96, 150, 300].map(d => [String(d), tr('stampa.risoluzione.opzione', { dpi: d, nome: tr(`stampa.risoluzione.${d}`) })]), String(stato.dpi), v => { stato.dpi = +v; aggiornaRisoluzione(); });
  campoSoloPoster.push(campoRisoluzione, infoRisoluzione);
  const statoEsporta = el('p', { className: 'stampa-nota stampa-errore', role: 'status', hidden: true, textContent: tr('stampa.errore') });
  const esporta = el('button', { type: 'button', className: 'stampa-esporta', textContent: tr('stampa.esporta') });
  const centra = el('button', { type: 'button', className: 'stampa-centra', textContent: tr('stampa.centra'), title: tr('stampa.centra.titolo') });
  const adatta = el('button', { type: 'button', className: 'stampa-adatta', textContent: tr('stampa.riquadro.adatta') });

  radice.append( // il titolo è quello del tab, già nella sezione
    anteprima,
    el('p', { className: 'stampa-nota', textContent: tr('stampa.riquadro.nota') }),
    campoTesto('stampa-titolo', tr('html.stampa.titolo'), v => { stato.titolo = v; aggiornaAnteprima(false); }, tr('stampa.poster.titoloDefault')),
    sottotitolo,
    el('div', { className: 'stampa-riga' },
      sceltaDa('stampa-formato', tr('html.stampa.formato'), Object.keys(FORMATI).map(f => [f, f]), stato.formato, v => { stato.formato = v; dopoCambioProporzione(); }),
      sceltaDa('stampa-direzione', tr('html.stampa.orient'), [['landscape', tr('stampa.orizzontale')], ['portrait', tr('stampa.verticale')]], stato.direzione, v => { stato.direzione = v; dopoCambioProporzione(); })),
    el('div', { className: 'stampa-riga' },
      sceltaDa('stampa-uscita', tr('html.stampa.uscita'), ['png', 'jpg', 'pdf', 'stampa'].map(v => [v, tr(`stampa.uscita.${v}`)]), stato.uscita, v => { stato.uscita = v; dopoCambioProporzione(); }),
      sceltaDa('stampa-scala', tr('html.stampa.scala'), [['', tr('stampa.vistaAttuale')], ...SCALE_STAMPA.map(n => [String(n), tr('stampa.opzioneScala', { n: n.toLocaleString(localeIntl()) })])], '', v => { stato.scala = +v || null; if (stato.scala) { adattaAScala(); portaInVista(); } else { riquadro.classList.remove('a-scala'); stato.riquadro = riquadroIniziale(vista(), proporzione()); posiziona(); } aggiornaAnteprima(false); })),
    campoRisoluzione, infoRisoluzione,
    elementi,
    statoEsporta,
    el('div', { className: 'stampa-azioni' }, adatta, centra, esporta));
  aggiornaVisibilita();
  aggiornaRisoluzione();

  // Centra il riquadro nell'area libera della mappa
  centra.addEventListener('click', () => {
    const r = stato.riquadro;
    const v = vista();
    stato.riquadro = dentroVista({ ...r, x: (v.sinistra ?? 0) + (v.larghezza - (v.sinistra ?? 0) - r.w) / 2, y: (v.alto ?? 0) + (v.altezza - (v.alto ?? 0) - r.h) / 2 }, v);
    posiziona(); aggiornaAnteprima();
  });
  adatta.addEventListener('click', () => { stato.riquadro = riquadroIniziale(vista(), proporzione()); posiziona(); adattaAScala(); portaInVista(); aggiornaAnteprima(); });

  esporta.addEventListener('click', async () => {
    if (stato.occupato) return;
    stato.occupato = true;
    esporta.disabled = true;
    const etichetta = esporta.textContent;
    esporta.textContent = tr('stampa.occupato');
    try {
      const { centro } = inquadratura();
      const { zoom } = inquadratura();
      const comuni = { formato: stato.formato, direzione: stato.direzione, scala: stato.scala, centro, zoom, titolo: stato.titolo };
      statoEsporta.hidden = true;
      const riuscita = await conAvvisoStampa(tr('avviso.stampaInCorso'), () => stato.uscita === 'stampa' ? stampaFoglio(map, comuni)
        : esportaFile(map, { ...comuni, uscita: stato.uscita, dpi: stato.dpi, titolo: stato.titolo || tr('stampa.poster.titoloDefault'), sottotitolo: sottotitoloEffettivo(), elementi: stato.elementi }));
      statoEsporta.hidden = riuscita !== false; // cattura o scrittura fallite (di solito immagine troppo grande per il dispositivo)
    } finally { stato.occupato = false; esporta.disabled = false; esporta.textContent = etichetta; }
  });

  // Le legende cambiano quando si accende o spegne un layer: anteprima e poster le rileggono
  const radiceLegende = document.getElementById('legende-box') ?? document.body;
  let rinvio = null;
  const suLegende = () => { clearTimeout(rinvio); rinvio = setTimeout(() => aggiornaAnteprima(), 300); };
  const osservaLegende = new MutationObserver(suLegende);

  // Il pannello della rail si apre, si ripiega (classe «collassato», quando ne passa un altro in primo piano) e si chiude (hidden):
  // il riquadro sulla mappa c'è solo quando il pannello è aperto e in primo piano
  const inPrimoPiano = () => !radice.hidden && !radice.classList.contains('collassato');
  function imposta(apri) {
    if (apri === aperto) return;
    aperto = apri;
    riquadro.hidden = !apri;
    document.body.classList.toggle('stampa-pannello', apri); // su desktop nasconde legenda, minimappa, logo e scala della mappa
    if (!apri) { map.off('moveend', sulMovimento); window.removeEventListener('resize', sulRidimensionamento); osservaLegende.disconnect(); return; }
    stato.riquadro = stato.riquadro ? adattaProporzione(stato.riquadro, proporzione(), vista()) : riquadroIniziale(vista(), proporzione());
    posiziona();
    map.on('moveend', sulMovimento);
    window.addEventListener('resize', sulRidimensionamento);
    osservaLegende.observe(radiceLegende, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class'] });
    caricaLogo().then(i => { logo = i; aggiornaAnteprima(false); });
    aggiornaAnteprima();
    setTimeout(sulRidimensionamento, 450); // il margine della mappa si assesta dopo l'apertura del pannello
    radice.querySelector('#stampa-titolo').focus({ preventScroll: true });
  }
  new MutationObserver(() => imposta(inPrimoPiano())).observe(radice, { attributes: true, attributeFilter: ['hidden', 'class'] });
  imposta(inPrimoPiano()); // il contenuto si crea quando il pannello è già aperto
  return { aperto: () => aperto };
}
