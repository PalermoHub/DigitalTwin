// Pannello «Tema» nella barra di destra: scelta dei colori dell'interfaccia, anteprima dal vivo, salvataggio su un file
// .json nel computer dell'utente e caricamento da file. Il tema attivo resta anche nel browser (si ritrova alla visita dopo).
// Gli stili riusano le classi gi-* di Geoimage (testata, sezioni, pulsanti): sono le stesse del pannello gemello.
import { svgIcona } from './icone.js';
import { t as tr } from './i18n.js';
import { CAMPI, CAMPI_EXTRA, PRESET, DIMENSIONE, FONT, TIPOGRAFIA_STANDARD, applica, applicaTipografia, controlli, extraEffettivi, leggi, leggiTipografia, salva, esporta, importa } from './tema-interfaccia.js';

const el = (tag, classe, testo) => {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
};

const NOME_FILE = 'tema-digital-twin.json';

// Salva il testo come file nel computer: finestra «Salva con nome» dove il browser la offre, altrimenti scaricamento.
// false se l'utente annulla.
async function scriviFile(testo) {
  if (window.showSaveFilePicker) {
    try {
      const f = await window.showSaveFilePicker({ suggestedName: NOME_FILE, types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }] });
      const w = await f.createWritable();
      await w.write(testo);
      await w.close();
      return true;
    } catch (e) {
      if (e.name === 'AbortError') return false;
      /* altro errore (permessi, iframe): ripiega sullo scaricamento */
    }
  }
  const url = URL.createObjectURL(new Blob([testo], { type: 'application/json' }));
  Object.assign(document.createElement('a'), { href: url, download: NOME_FILE }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

// elemento: l'<aside> del pannello; bottoneTema: il pulsante chiaro/scuro (#btn-tema), che tiene allineati logo, mappa e intestazione.
export function creaPannelloInterfaccia(elemento, { storage, bottoneTema, segnala = () => {} }) {
  const radice = document.documentElement;
  let colori = leggi(storage) ?? { ...PRESET.chiaro };
  let attivo = !!leggi(storage);
  let tipo = leggiTipografia(storage);
  let guardia = false; // true mentre è il pannello a muovere il pulsante chiaro/scuro

  const testata = el('header', 'gi-testata');
  testata.append(el('h2', null, tr('tui.titolo')));
  const x = Object.assign(el('button', 'pannello-chiudi'), { type: 'button', title: tr('comune.chiudi'), ariaLabel: tr('tui.chiudi') });
  x.innerHTML = svgIcona('chiudi', 18);
  x.addEventListener('click', () => { elemento.hidden = true; });
  testata.append(x);

  const stato = Object.assign(el('p', 'gi-stato', tr('tui.stato.iniziale')), { id: 'tui-stato' });
  stato.setAttribute('role', 'status');

  const campi = {};
  const sezioneColori = el('section', 'gi-sezione');
  sezioneColori.append(el('h3', null, tr('tui.sez.colori')));
  for (const nome of CAMPI) {
    const etichetta = el('label', 'gi-campo tui-colore', tr(`tui.colore.${nome}`));
    const input = Object.assign(el('input'), { type: 'color', id: `tui-${nome}` });
    const valore = el('span', 'gi-valore');
    etichetta.append(input, valore);
    campi[nome] = { input, valore };
    input.addEventListener('input', () => { colori = { ...colori, [nome]: input.value }; usa(); });
    sezioneColori.append(etichetta);
  }
  const avvisi = Object.assign(el('ul', 'gi-nota'), { id: 'tui-avvisi' });
  sezioneColori.append(avvisi);

  const avanzati = el('details', 'tui-avanzati');
  avanzati.append(el('summary', null, tr('tui.sez.avanzati')), el('p', 'gi-nota', tr('tui.nota.avanzati')));
  const campiExtra = {};
  for (const nome of CAMPI_EXTRA) {
    const etichetta = el('label', 'gi-campo tui-colore', tr(`tui.extra.${nome}`));
    const input = Object.assign(el('input'), { type: 'color', id: `tui-extra-${nome}` });
    const valore = el('span', 'gi-valore');
    etichetta.append(input, valore);
    campiExtra[nome] = { input, valore };
    input.addEventListener('input', () => { colori = { ...colori, [nome]: input.value }; usa(); });
    avanzati.append(etichetta);
  }
  const ripristinaExtra = Object.assign(el('button', 'gi-btn', tr('tui.extra.ripristina')), { type: 'button', id: 'tui-extra-ripristina' });
  ripristinaExtra.addEventListener('click', () => {
    colori = Object.fromEntries(Object.entries(colori).filter(([k]) => !CAMPI_EXTRA.includes(k)));
    usa();
  });
  avanzati.append(ripristinaExtra);
  sezioneColori.append(avanzati);

  const sezioneTipo = el('section', 'gi-sezione');
  const scorrevole = Object.assign(el('input'), { type: 'range', id: 'tui-dimensione', min: DIMENSIONE.min, max: DIMENSIONE.max, step: DIMENSIONE.passo });
  const etichettaDim = el('label', 'gi-campo', tr('tui.tipo.dimensione'));
  const valoreDim = el('span', 'gi-valore');
  etichettaDim.append(valoreDim);
  const scelta = Object.assign(el('select'), { id: 'tui-font' });
  for (const f of Object.keys(FONT)) scelta.append(Object.assign(el('option', null, tr(`tui.font.${f}`)), { value: f }));
  const etichettaFont = el('label', 'gi-campo', tr('tui.tipo.font'));
  etichettaFont.append(scelta);
  const campione = el('p', 'tui-campione', tr('tui.tipo.campione'));
  const ripristinaTipo = Object.assign(el('button', 'gi-btn', tr('tui.tipo.ripristina')), { type: 'button', id: 'tui-tipo-ripristina' });
  const blocco = el('div', 'tui-tipo');
  blocco.append(etichettaDim, scorrevole, etichettaFont, campione, ripristinaTipo);
  sezioneTipo.append(el('h3', null, tr('tui.sez.tipo')), blocco);
  const usaTipo = () => { applicaTipografia(radice, tipo); salva(storage, attivo ? colori : null, tipo); mostra(); };
  scorrevole.addEventListener('input', () => { tipo = { ...tipo, dimensione: Number(scorrevole.value) }; usaTipo(); });
  scelta.addEventListener('change', () => { tipo = { ...tipo, font: scelta.value }; usaTipo(); });
  ripristinaTipo.addEventListener('click', () => { tipo = { ...TIPOGRAFIA_STANDARD }; usaTipo(); });

  const preset = el('div', 'tui-preset');
  for (const nome of Object.keys(PRESET)) {
    const b = Object.assign(el('button', 'gi-btn'), { type: 'button' });
    // miniatura dell'interfaccia: fondo, barra d'accento, due righe di testo, un link e il bordo
    const p = PRESET[nome];
    const anteprima = el('span', 'tui-anteprima');
    anteprima.style.cssText = `background:${p.sfondo};border-color:${p.bordo}`;
    for (const [classe, colore] of [['barra', p.accento], ['riga', p.testo], ['corta', p.testo], ['link', p.link]]) {
      const r = el('i', `tui-${classe}`);
      r.style.background = colore;
      anteprima.append(r);
    }
    b.append(anteprima, el('span', null, tr(`tui.preset.${nome}`)));
    b.dataset.preset = nome;
    b.addEventListener('click', () => { colori = { ...PRESET[nome] }; usa(); });
    preset.append(b);
  }
  const sezionePreset = el('section', 'gi-sezione');
  sezionePreset.append(el('h3', null, tr('tui.sez.preset')), preset);

  const bottone = (id, testo, titolo, classe = '') => Object.assign(el('button', `gi-btn ${classe}`.trim(), testo), { type: 'button', id: `tui-${id}`, title: titolo });
  const salvaFile = bottone('salva-file', tr('tui.salvaFile'), tr('tui.salvaFile.tip'), 'gi-primario');
  const caricaFile = bottone('carica-file', tr('tui.caricaFile'), tr('tui.caricaFile.tip'));
  const file = Object.assign(el('input'), { type: 'file', id: 'tui-file', accept: '.json,application/json', hidden: true });
  const ripristina = bottone('ripristina', tr('tui.ripristina'), tr('tui.ripristina.tip'), 'gi-pericolo');
  const sezioneFile = el('section', 'gi-sezione');
  const nota = el('p', 'gi-nota', tr('tui.nota.file'));
  const riga = el('div', 'gi-riga');
  riga.append(salvaFile, caricaFile);
  sezioneFile.append(el('h3', null, tr('tui.sez.file')), riga, file, nota, ripristina);

  const corpo = el('div', 'gi-corpo');
  corpo.append(sezionePreset, sezioneColori, sezioneTipo, sezioneFile);
  elemento.replaceChildren(testata, stato, corpo);

  function mostra() {
    for (const n of CAMPI) { campi[n].input.value = colori[n]; campi[n].valore.textContent = colori[n]; }
    const extra = extraEffettivi(colori);
    for (const n of CAMPI_EXTRA) { campiExtra[n].input.value = extra[n]; campiExtra[n].valore.textContent = extra[n]; }
    ripristinaExtra.disabled = !CAMPI_EXTRA.some(n => colori[n]);
    scorrevole.value = tipo.dimensione;
    valoreDim.textContent = `${tipo.dimensione}%`;
    scelta.value = tipo.font;
    campione.style.fontFamily = FONT[tipo.font];
    ripristinaTipo.disabled = tipo.dimensione === TIPOGRAFIA_STANDARD.dimensione && tipo.font === TIPOGRAFIA_STANDARD.font;
    avvisi.replaceChildren(...controlli(colori).filter(c => !c.ok).map(c => el('li', null, tr('tui.avviso', { colore: tr(`tui.colore.${c.id}`), rapporto: c.rapporto.toFixed(1), minimo: c.minimo }))));
    ripristina.disabled = !attivo;
    stato.textContent = attivo ? tr('tui.stato.attivo') : tr('tui.stato.iniziale');
  }

  // porta il pulsante chiaro/scuro (e con lui logo, mappa base e intestazione) in accordo con la luminosità dello sfondo scelto
  function allineaChiaroScuro(scuro) {
    if (scuro == null || (radice.dataset.tema === 'scuro') === scuro || !bottoneTema) return;
    guardia = true;
    try { bottoneTema.click(); } finally { guardia = false; }
  }

  function usa() {
    attivo = true;
    allineaChiaroScuro(applica(radice, colori));
    salva(storage, colori, tipo);
    mostra();
  }

  // chi usa l'interruttore chiaro/scuro torna ai colori standard dell'app
  document.addEventListener('tema', () => {
    if (guardia || !attivo) return;
    attivo = false;
    applica(radice, null);
    salva(storage, null, tipo);
    mostra();
  });

  ripristina.addEventListener('click', () => {
    attivo = false;
    colori = { ...PRESET[radice.dataset.tema === 'scuro' ? 'scuro' : 'chiaro'] };
    applica(radice, null);
    salva(storage, null, tipo);
    mostra();
    segnala(tr('tui.ripristinato'));
  });

  salvaFile.addEventListener('click', async () => {
    try {
      if (await scriviFile(esporta(colori, tipo))) segnala(tr('tui.salvato'));
    } catch (e) { segnala(tr('tui.errore', { msg: e.message })); }
  });
  caricaFile.addEventListener('click', () => file.click());
  file.addEventListener('change', async () => {
    const f = file.files?.[0];
    file.value = '';
    if (!f) return;
    try {
      ({ colori, tipografia: tipo } = importa(await f.text()));
      applicaTipografia(radice, tipo);
      usa();
      segnala(tr('tui.caricato', { nome: f.name }));
    } catch (e) { segnala(e.message); }
  });

  if (attivo) allineaChiaroScuro(applica(radice, colori));
  applicaTipografia(radice, tipo);
  mostra();
  return { colori: () => ({ ...colori }) };
}
