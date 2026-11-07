// Tab «Opzioni» del pannello sinistro: tutte le impostazioni dell'interfaccia in un posto solo.
// Le scelte durano finché l'utente non cancella i dati del browser (localStorage). Legenda sulla mappa e tab mostrano lo stesso
// stato e si riallineano a vicenda con gli eventi dei moduli di stato (live-zoom, raggio-vicini, opzioni-selezione).
import { t } from './i18n.js';
import { svgIcona } from './icone.js';
import { voceFiltro } from './legenda.js';
import { simboloGlifo } from './icone-mappa.js';
import { vociCatalogo } from './evidenza.js';
import { creaRegolatoreRaggio, impostaRaggio, impostaCerchio, raggioVicini, EVENTO_RAGGIO, RAGGIO_INIZIALE } from './raggio-vicini.js';
import { tooltipSelezioneAttivo, impostaTooltipSelezione, vociSpente, impostaVoci, EVENTO_SELEZIONE } from './opzioni-selezione.js';

// Scheda del cruscotto: intestazione con icona, titolo, descrizione breve e riepilogo di stato (aggiornabile con `riepilogo(testo)`).
// Stessa struttura ripiegabile delle sezioni del tab Layer, così freccia, tipografia e colori restano quelli dell'interfaccia.
export function sezioneOpzioni(id, { titolo, descrizione, icona }, ...figli) {
  const el = document.createElement('details');
  el.id = id;
  el.open = true;
  el.className = 'layer-sezione opzioni-sezione';
  const sommario = document.createElement('summary');
  const chip = document.createElement('span');
  chip.className = 'opz-icona';
  chip.setAttribute('aria-hidden', 'true');
  chip.innerHTML = svgIcona(icona, 16);
  const testi = document.createElement('div');
  testi.className = 'opz-testi';
  const h = document.createElement('h2');
  h.textContent = titolo;
  const sotto = document.createElement('small');
  sotto.textContent = descrizione;
  testi.append(h, sotto);
  const stato = document.createElement('output');
  stato.className = 'opz-stato';
  sommario.append(chip, testi, stato);
  el.append(sommario, ...figli);
  el.riepilogo = testo => { stato.textContent = testo; };
  return el;
}

// Pulsante «Ripristina predefiniti» in fondo a una scheda.
function piede(suClic) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'opz-ripristina';
  b.textContent = t('opzioni.ripristina');
  b.addEventListener('click', suClic);
  const p = document.createElement('div');
  p.className = 'opz-piede';
  p.append(b);
  return p;
}

// Riga di un interruttore già pronto (tooltip, legende, Live Zoom): aggiunge la descrizione sotto l'etichetta.
function iconaRiga(icona) {
  const i = document.createElement('span');
  i.className = 'opz-ico';
  i.setAttribute('aria-hidden', 'true');
  i.innerHTML = svgIcona(icona, 15);
  return i;
}

function conDescrizione(riga, chiave, icona) {
  riga.classList.add('opz-riga');
  riga.prepend(iconaRiga(icona));
  const d = document.createElement('small');
  d.className = 'opz-desc';
  d.textContent = t(chiave);
  riga.append(d);
  return riga;
}

// «Overlay informativi»: gli interruttori creati dal pannello, con descrizione e conteggio degli attivi.
export function sezioneOverlay(voci) {
  const righe = voci.filter(v => v.el).map(v => conDescrizione(v.el, v.desc, v.icona));
  const sez = sezioneOpzioni('opzioni-overlay', { titolo: t('pannello.overlay.titolo'), descrizione: t('opzioni.overlay.desc'), icona: 'occhio' }, ...righe);
  const aggiorna = () => sez.riepilogo(t('opzioni.attivi', { n: righe.filter(r => r.querySelector('input')?.checked).length, tot: righe.length }));
  sez.addEventListener('change', aggiorna);
  aggiorna();
  setTimeout(aggiorna, 0); // alcuni interruttori si allineano subito dopo la creazione
  return sez;
}

// «Raggio dei dintorni»: lo stesso cursore e interruttore del riquadro sulla mappa.
export function sezioneRaggio(storage) {
  const sez = sezioneOpzioni('opzioni-raggio', { titolo: t('opzioni.raggio.titolo'), descrizione: t('opzioni.raggio.desc'), icona: 'indirizzo' },
    creaRegolatoreRaggio(storage, { id: 'opzioni-raggio-regolatore', carica: false }),
    piede(() => { impostaRaggio(RAGGIO_INIZIALE, storage); impostaCerchio(true, storage); document.dispatchEvent(new Event(EVENTO_RAGGIO)); }));
  const aggiorna = () => sez.riepilogo(`${raggioVicini()} m`);
  document.addEventListener(EVENTO_RAGGIO, aggiorna);
  aggiorna();
  return sez;
}

// Riga interruttore uguale a quelle degli overlay: titolo e descrizione a sinistra, interruttore a destra.
function rigaInterruttore(icona, titolo, descrizione, suCambio) {
  const riga = document.createElement('label');
  riga.className = 'strato opz-riga'; // i18n-ok: nome di classe CSS
  const casella = Object.assign(document.createElement('input'), { type: 'checkbox', role: 'switch' });
  casella.addEventListener('change', () => suCambio(casella.checked));
  const testo = document.createElement('span');
  testo.textContent = titolo;
  const d = document.createElement('small');
  d.className = 'opz-desc';
  d.textContent = descrizione;
  riga.append(iconaRiga(icona), testo, d, casella);
  return { riga, casella };
}

// «Selezione in mappa»: dettagli al passaggio del mouse, tutte le voci insieme e una riga per ogni voce possibile.
export function sezioneSelezione(storage) {
  const voci = vociCatalogo();
  const caselle = [];
  const tooltip = rigaInterruttore('fumetto', t('opzioni.selezione.tooltip'), t('opzioni.selezione.tooltip.desc'), v => impostaTooltipSelezione(v, storage));
  const tutte = rigaInterruttore('occhio', t('opzioni.selezione.tutte'), t('opzioni.selezione.tutte.desc'), v => impostaVoci(voci.map(x => x.chiave), v, storage));
  const nota = document.createElement('p');
  nota.className = 'filtri-nota';
  nota.textContent = t('opzioni.selezione.nota');
  const elenco = document.createElement('div');
  elenco.className = 'selezione-voci legenda';
  for (const v of voci) {
    const simbolo = v.icona ? simboloGlifo(v.icona, v.colore) : document.createElement('i');
    if (!v.icona) { simbolo.className = 'selezione-simbolo'; simbolo.style.setProperty('--colore', v.colore); }
    const riga = voceFiltro(simbolo, v.etichetta, acceso => impostaVoci([v.chiave], acceso, storage), !vociSpente().has(v.chiave), false);
    riga.classList.add('opz-voce');
    riga.querySelector('input').setAttribute('role', 'switch');
    caselle.push(riga.querySelector('input'));
    elenco.append(riga);
  }
  const allinea = () => {
    voci.forEach((v, i) => { caselle[i].checked = !vociSpente().has(v.chiave); });
    const n = voci.filter(v => !vociSpente().has(v.chiave)).length;
    tooltip.casella.checked = tooltipSelezioneAttivo();
    tutte.casella.checked = n === voci.length;
    sez.riepilogo(t('opzioni.attivi', { n, tot: voci.length }));
  };
  const ripristina = piede(() => { impostaTooltipSelezione(true, storage); impostaVoci(voci.map(v => v.chiave), true, storage); });
  const sez = sezioneOpzioni('opzioni-selezione', { titolo: t('evidenza.titolo'), descrizione: t('opzioni.selezione.desc'), icona: 'mappa' }, tooltip.riga, tutte.riga, elenco, nota, ripristina);
  document.addEventListener(EVENTO_SELEZIONE, allinea);
  allinea();
  return sez;
}
