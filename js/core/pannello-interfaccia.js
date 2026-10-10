// Pannello «Tema» nella barra di destra: scelta dei colori dell'interfaccia, anteprima dal vivo, salvataggio su un file
// .json nel computer dell'utente e caricamento da file. Il tema attivo resta anche nel browser (si ritrova alla visita dopo).
// Gli stili riusano le classi gi-* di Geoimage (testata, sezioni, pulsanti): sono le stesse del pannello gemello.
import { svgIcona } from './icone.js';
import { t as tr } from './i18n.js';
import { CAMPI, CAMPI_EXTRA, PRESET, DIMENSIONE, FONT, TIPOGRAFIA_STANDARD, applica, applicaTipografia, controlli, correggiContrasto, extraEffettivi, normalizza, presetCorrispondente, leggi, leggiTipografia, salva, esporta, importa } from './tema-interfaccia.js';

const el = (tag, classe, testo) => {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
};

// Miniatura dell'interfaccia: fondo, barra d'accento, due righe di testo, un link e il bordo
const PARTI_MINIATURA = [['barra', 'accento'], ['riga', 'testo'], ['corta', 'testo'], ['link', 'link']];
function miniatura(p, classe = '') {
  const anteprima = el('span', `tui-anteprima ${classe}`.trim());
  const barre = PARTI_MINIATURA.map(([k]) => el('i', `tui-${k}`));
  anteprima.append(...barre);
  const colora = c => {
    anteprima.style.cssText = `background:${c.sfondo};border-color:${c.bordo}`;
    PARTI_MINIATURA.forEach(([, campo], i) => { barre[i].style.background = c[campo]; });
  };
  colora(p);
  return { el: anteprima, colora };
}

const NOME_FILE = 'tema-digital-twin.json';
const ATTESA_ANNULLA = 8000; // ms in cui resta offerto «Annulla» dopo aver tolto il tema personalizzato
const VISIBILI = 4; // temi mostrati per gruppo prima di «Mostra tutti»
// I temi pronti per gruppo; quelli non elencati vanno tra i chiari. Gli accessibili stanno sempre tutti in vista.
const GRUPPI = [
  { id: 'chiari', preset: ['chiaro', 'mare', 'bosco', 'sepia', 'lavanda', 'grigio', 'carta', 'menta', 'rosa', 'alba'] },
  { id: 'scuri', preset: ['scuro', 'notte', 'tramonto', 'grafite', 'oceano', 'violanotte', 'terminale'] },
  { id: 'accessibili', preset: ['contrasto', 'daltonici', 'daltonici2'], tutti: true },
];

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
  let annullabile = null; // { messaggio, colori }: tema personalizzato appena tolto, ancora recuperabile
  let timerAnnulla = null;
  let guardia = false; // true mentre è il pannello a muovere il pulsante chiaro/scuro

  const testata = el('header', 'gi-testata');
  testata.append(el('h2', null, tr('tui.titolo')));
  const x = Object.assign(el('button', 'pannello-chiudi'), { type: 'button', title: tr('comune.chiudi'), ariaLabel: tr('tui.chiudi') });
  x.innerHTML = svgIcona('chiudi', 18);
  x.addEventListener('click', () => { elemento.hidden = true; });
  testata.append(x);

  const stato = Object.assign(el('p', 'gi-stato'), { id: 'tui-stato' });
  stato.setAttribute('role', 'status');
  const testoStato = el('span', 'gi-stato-testo');
  const annullaBtn = Object.assign(el('button', 'gi-btn', tr('tui.annulla')), { type: 'button', id: 'tui-annulla', hidden: true });
  stato.append(testoStato, annullaBtn);

  // Riga di un colore: campione, nome, esadecimale modificabile. `avviso` (solo per i colori con controllo di contrasto)
  // sta sotto la riga, con il pulsante «Correggi».
  const righe = {};
  function rigaColore(nome, testo, idColore, daCorreggere, suggerimento) {
    const input = Object.assign(el('input'), { type: 'color', id: idColore });
    input.setAttribute('aria-label', testo);
    const etichetta = Object.assign(el('label', null, testo), { htmlFor: idColore });
    const hex = Object.assign(el('input', 'tui-hex'), { type: 'text', id: `${idColore}-hex`, maxLength: 7, spellcheck: false, autocomplete: 'off' });
    hex.setAttribute('aria-label', tr('tui.hex', { colore: testo }));
    const riga = el('div', 'gi-campo tui-colore');
    if (suggerimento) {
      const nota = Object.assign(el('small', 'tui-suggerimento', suggerimento), { id: `${idColore}-nota` });
      const colonna = el('span', 'tui-nome');
      colonna.append(etichetta, nota);
      input.setAttribute('aria-describedby', nota.id);
      riga.append(input, colonna, hex);
    } else riga.append(input, etichetta, hex);
    const scegli = v => { colori = { ...colori, [nome]: v }; usa(); };
    input.addEventListener('input', () => scegli(input.value));
    // si scrive con o senza #; finché non è un colore valido il campo segna l'errore e il tema non cambia
    hex.addEventListener('input', () => {
      const v = normalizza(hex.value.startsWith('#') ? hex.value : `#${hex.value}`);
      hex.setAttribute('aria-invalid', String(!v));
      if (v) scegli(v);
    });
    hex.addEventListener('blur', () => { hex.removeAttribute('aria-invalid'); hex.value = input.value; });
    const voce = { input, hex, riga, avviso: null };
    righe[nome] = voce;
    if (!daCorreggere) return riga;
    const avviso = el('p', 'tui-avviso');
    avviso.hidden = true;
    const msg = el('span');
    const correggi = Object.assign(el('button', 'gi-btn', tr('tui.correggi')), { type: 'button' });
    correggi.addEventListener('click', () => scegli(correggiContrasto(colori[nome], colori.sfondo)));
    avviso.append(msg, correggi);
    voce.avviso = { avviso, msg };
    const blocco = el('div', 'tui-blocco');
    blocco.append(riga, avviso);
    return blocco;
  }
  const sezioneColori = el('section', 'gi-sezione');
  sezioneColori.append(el('h3', null, tr('tui.sez.colori')));
  const anteprimaViva = miniatura(colori, 'tui-anteprima-grande');
  anteprimaViva.el.setAttribute('aria-hidden', 'true');
  sezioneColori.append(anteprimaViva.el);
  for (const nome of CAMPI) sezioneColori.append(rigaColore(nome, tr(`tui.colore.${nome}`), `tui-${nome}`, nome === 'testo' || nome === 'link'));

  const avanzati = el('details', 'tui-avanzati');
  avanzati.append(el('summary', null, tr('tui.sez.avanzati')), el('p', 'gi-nota', tr('tui.nota.avanzati')));
  for (const nome of CAMPI_EXTRA) avanzati.append(rigaColore(nome, tr(`tui.extra.${nome}`), `tui-extra-${nome}`, false, tr(`tui.extraEsempio.${nome}`)));
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

  const bottoniPreset = new Map(); // nome → pulsante, per segnare quello attivo
  const gruppi = []; // { nomi, aperto, riallinea }: per riaprire il gruppo che contiene il tema attivo
  const sezionePreset = el('section', 'gi-sezione');
  sezionePreset.append(el('h3', null, tr('tui.sez.preset')));
  const elencati = new Set(GRUPPI.flatMap(g => g.preset));
  for (const g of GRUPPI) {
    const nomi = [...g.preset, ...(g.id === 'chiari' ? Object.keys(PRESET).filter(n => !elencati.has(n)) : [])].filter(n => PRESET[n]);
    const gruppo = el('div', 'tui-gruppo');
    const titoloGruppo = el('h4', null, tr(`tui.gruppo.${g.id}`));
    titoloGruppo.id = `tui-gruppo-${g.id}`;
    const elenco = el('div', 'tui-preset');
    elenco.setAttribute('role', 'group');
    elenco.setAttribute('aria-labelledby', titoloGruppo.id);
    for (const nome of nomi) {
      const b = Object.assign(el('button', 'gi-btn'), { type: 'button' });
      const anteprima = miniatura(PRESET[nome]).el;
      b.append(anteprima, el('span', null, tr(`tui.preset.${nome}`)));
      b.dataset.preset = nome;
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => { colori = { ...PRESET[nome] }; usa(); });
      bottoniPreset.set(nome, b);
      elenco.append(b);
    }
    gruppo.append(titoloGruppo, elenco);
    const info = { nomi, aperto: false, riallinea: () => {} };
    if (!g.tutti && nomi.length > VISIBILI) {
      const altri = Object.assign(el('button', 'gi-btn tui-altri'), { type: 'button' });
      info.riallinea = () => {
        nomi.forEach((n, i) => { bottoniPreset.get(n).hidden = !info.aperto && i >= VISIBILI; });
        altri.textContent = info.aperto ? tr('tui.gruppo.meno') : tr('tui.gruppo.altri', { n: nomi.length - VISIBILI });
        altri.setAttribute('aria-expanded', String(info.aperto));
      };
      altri.addEventListener('click', () => { info.aperto = !info.aperto; info.riallinea(); });
      info.riallinea();
      gruppo.append(altri);
    }
    gruppi.push(info);
    sezionePreset.append(gruppo);
  }

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
    anteprimaViva.colora(colori);
    const extra = extraEffettivi(colori);
    for (const n of [...CAMPI, ...CAMPI_EXTRA]) {
      const v = colori[n] ?? extra[n];
      righe[n].input.value = v;
      if (document.activeElement !== righe[n].hex) righe[n].hex.value = v; // non si riscrive il campo mentre l'utente digita
    }
    ripristinaExtra.hidden = !CAMPI_EXTRA.some(n => colori[n]);
    scorrevole.value = tipo.dimensione;
    valoreDim.textContent = `${tipo.dimensione}%`;
    scelta.value = tipo.font;
    campione.style.fontFamily = FONT[tipo.font];
    ripristinaTipo.disabled = tipo.dimensione === TIPOGRAFIA_STANDARD.dimensione && tipo.font === TIPOGRAFIA_STANDARD.font;
    for (const c of controlli(colori)) {
      const { avviso, msg } = righe[c.id].avviso;
      avviso.hidden = c.ok;
      msg.textContent = c.ok ? '' : tr('tui.avviso', { rapporto: c.rapporto.toFixed(1), minimo: c.minimo });
      righe[c.id].input.setAttribute('aria-invalid', String(!c.ok));
    }
    ripristina.disabled = !attivo;
    const corrente = attivo ? presetCorrispondente(colori) : null;
    for (const [nome, b] of bottoniPreset) b.setAttribute('aria-pressed', String(nome === corrente));
    for (const g of gruppi) if (!g.aperto && corrente && g.nomi.includes(corrente) && g.nomi.indexOf(corrente) >= VISIBILI) { g.aperto = true; g.riallinea(); }
    annullaBtn.hidden = !annullabile;
    testoStato.textContent = annullabile ? annullabile.messaggio
      : corrente ? tr('tui.stato.preset', { nome: tr(`tui.preset.${corrente}`) })
      : attivo ? tr('tui.stato.attivo') : tr('tui.stato.iniziale');
  }

  // Dopo aver tolto il tema personalizzato si offre «Annulla» nella barra di stato per qualche secondo.
  function offriAnnulla(messaggio, prima) {
    clearTimeout(timerAnnulla);
    annullabile = { messaggio, colori: prima };
    timerAnnulla = setTimeout(() => { annullabile = null; mostra(); }, ATTESA_ANNULLA);
  }
  function chiudiAnnulla() {
    clearTimeout(timerAnnulla);
    annullabile = null;
  }

  // porta il pulsante chiaro/scuro (e con lui logo, mappa base e intestazione) in accordo con la luminosità dello sfondo scelto
  function allineaChiaroScuro(scuro) {
    if (scuro == null || (radice.dataset.tema === 'scuro') === scuro || !bottoneTema) return;
    guardia = true;
    try { bottoneTema.click(); } finally { guardia = false; }
  }

  function usa() {
    chiudiAnnulla();
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
    offriAnnulla(tr('tui.rimosso'), { ...colori });
    mostra();
  });

  ripristina.addEventListener('click', () => {
    const prima = { ...colori };
    attivo = false;
    colori = { ...PRESET[radice.dataset.tema === 'scuro' ? 'scuro' : 'chiaro'] };
    applica(radice, null);
    salva(storage, null, tipo);
    offriAnnulla(tr('tui.ripristinato'), prima);
    mostra();
  });
  annullaBtn.addEventListener('click', () => {
    if (!annullabile) return;
    colori = annullabile.colori;
    usa();
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
