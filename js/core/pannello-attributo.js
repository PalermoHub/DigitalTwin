// Sezione «Colora per attributo» del pannello Colori: sceglie un campo letto dalle feature visibili e lo colora
// per categorie o in classi numeriche. Il risultato ({campo, tipo, ...}) lo salva e applica pannello-tema.js.
import { rilevaAttributi, calcolaSoglie, etichetteClassi, coloriRampa, RAMPE, GRUPPI_RAMPE, TAVOLOZZA } from './tema-attributo.js';
import { comeEsadecimale } from './tema.js';

function selezione(testo, nome, opzioni) {
  const riga = document.createElement('label');
  riga.className = 'tema-riga';
  const t = document.createElement('span');
  t.textContent = testo;
  const s = document.createElement('select');
  s.dataset.attributo = nome;
  for (const [valore, etichetta] of opzioni) s.append(new Option(etichetta, valore));
  riga.append(t, s);
  return { riga, select: s };
}

// `leggi()` dà l'attributo corrente (o null), `cambia(attributo|null)` lo registra e ridisegna; `layers()` gli id dei layer da interrogare.
export function creaSezioneAttributo({ map, layers, leggi, cambia }) {
  const el = document.createElement('div');
  el.className = 'tema-attributo';
  const titolo = document.createElement('strong');
  titolo.textContent = 'Colora per attributo';
  const campo = selezione('Campo', 'campo', [['', 'Nessuno']]);
  const modo = selezione('Tipo', 'tipo', [['categorie', 'Per categorie'], ['graduata', 'Graduata (numerico)']]);
  const classi = selezione('Classi', 'classi', Array.from({ length: 7 }, (_, i) => [String(i + 3), String(i + 3)]));
  const metodo = selezione('Metodo', 'metodo', [['quantili', 'Quantili'], ['intervalli', 'Intervalli uguali']]);
  const rampa = selezione('Rampa', 'rampa', []);
  for (const [nome, rampe] of GRUPPI_RAMPE) {
    const g = document.createElement('optgroup');
    g.label = nome;
    g.append(...rampe.map(n => new Option(n, n)));
    rampa.select.append(g);
  }
  rampa.select.value = 'Blu';
  const anteprima = document.createElement('div');
  anteprima.className = 'tema-anteprima-rampa';
  anteprima.setAttribute('aria-hidden', 'true');
  const disegnaAnteprima = () => { anteprima.style.background = `linear-gradient(to right, ${RAMPE[rampa.select.value].join(', ')})`; };
  classi.select.value = '5';
  const aggiorna = document.createElement('button');
  aggiorna.type = 'button';
  aggiorna.className = 'strato-strumento';
  aggiorna.dataset.azione = 'attributo-rileva';
  aggiorna.textContent = 'Rileva valori';
  const voci = document.createElement('div');
  voci.className = 'tema-categorie';
  const msg = document.createElement('p');
  msg.className = 'tema-msg';
  msg.setAttribute('role', 'status');
  el.append(titolo, campo.riga, modo.riga, classi.riga, metodo.riga, rampa.riga, anteprima, aggiorna, voci, msg);

  let campi = new Map(); // campo → { valori, numeri, numerico } letto dalle feature in vista
  let ultimo = ''; // attributo mostrato nella lista, per non ricostruirla a ogni modifica
  const attivo = () => campo.select.value;

  const rileva = () => {
    const ids = layers().filter(id => map.getLayer(id));
    let feature = [];
    try { feature = ids.length ? map.queryRenderedFeatures({ layers: ids }) : []; } catch { feature = []; }
    campi = rilevaAttributi(feature);
    const corrente = leggi()?.campo ?? attivo();
    const nomi = new Set([...campi.keys(), ...(corrente ? [corrente] : [])]);
    campo.select.replaceChildren(new Option('Nessuno', ''), ...[...nomi].sort((a, b) => a.localeCompare(b)).map(n => new Option(n, n)));
    campo.select.value = corrente && nomi.has(corrente) ? corrente : '';
    msg.textContent = campi.size ? '' : 'Nessuna feature in vista: accendi lo strato e inquadra l’area, poi «Rileva valori».';
  };

  const mostraLista = a => {
    ultimo = JSON.stringify(a);
    voci.replaceChildren();
    voci.hidden = !a;
    if (!a) return;
    if (a.tipo === 'categorie') {
      for (const [valore, colore] of Object.entries(a.colori)) {
        const riga = document.createElement('label');
        riga.className = 'tema-riga';
        const t = document.createElement('span');
        t.textContent = valore;
        const i = document.createElement('input');
        i.type = 'color';
        i.value = comeEsadecimale(colore);
        i.dataset.valore = valore;
        i.addEventListener('input', () => {
          const nuovo = { ...a, colori: { ...a.colori, [valore]: i.value } };
          a = nuovo;
          ultimo = JSON.stringify(nuovo);
          cambia(nuovo);
        });
        riga.append(t, i);
        voci.append(riga);
      }
      return;
    }
    const colori = coloriRampa(a.rampa, a.soglie.length + 1);
    etichetteClassi(a.soglie).forEach((et, i) => {
      const riga = document.createElement('div');
      riga.className = 'tema-riga tema-classe';
      const t = document.createElement('span');
      t.textContent = et;
      const s = document.createElement('span');
      s.className = 'tema-campione';
      s.style.background = colori[i];
      riga.append(t, s);
      voci.append(riga);
    });
  };

  // costruisce l'attributo dai controlli e lo registra
  const ricalcola = () => {
    const nome = attivo();
    const info = campi.get(nome);
    const prec = leggi();
    modo.select.querySelector('option[value=graduata]').disabled = !(info?.numerico);
    if (!nome) { msg.textContent = ''; cambia(null); return; }
    if (modo.select.value === 'graduata' && !info?.numerico) modo.select.value = 'categorie';
    let nuovo = null;
    if (modo.select.value === 'graduata') {
      const soglie = calcolaSoglie(info.numeri, Number(classi.select.value), metodo.select.value);
      if (soglie.length) nuovo = { campo: nome, tipo: 'graduata', rampa: rampa.select.value, soglie };
      else msg.textContent = 'Valori troppo simili per formare classi.';
    } else {
      const valori = [...(info?.valori ?? [])].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      const vecchi = prec?.campo === nome && prec.tipo === 'categorie' ? prec.colori : {};
      const tutti = [...new Set([...Object.keys(vecchi), ...valori])];
      if (tutti.length > 200) msg.textContent = 'Troppi valori distinti (oltre 200): scegli un altro campo o la graduata.';
      else if (tutti.length) {
        nuovo = { campo: nome, tipo: 'categorie', colori: Object.fromEntries(tutti.map((v, i) => [v, vecchi[v] ?? TAVOLOZZA[i % TAVOLOZZA.length]])) };
      } else msg.textContent = 'Nessun valore in vista per questo campo.';
    }
    if (nuovo) msg.textContent = '';
    cambia(nuovo);
  };

  campo.select.addEventListener('change', ricalcola);
  for (const s of [modo, classi, metodo, rampa]) s.select.addEventListener('change', ricalcola);
  aggiorna.addEventListener('click', () => { rileva(); if (attivo()) ricalcola(); });

  // allinea i controlli al tema (caricamento, import, ripristino, o la modifica appena fatta)
  const sincronizza = () => {
    const a = leggi();
    if (JSON.stringify(a) !== ultimo) {
      if (!campi.size) rileva();
      if (!a) campo.select.value = '';
      else {
        if (![...campo.select.options].some(o => o.value === a.campo)) campo.select.append(new Option(a.campo, a.campo));
        campo.select.value = a.campo;
        modo.select.value = a.tipo;
        if (a.tipo === 'graduata') {
          rampa.select.value = a.rampa;
          const n = String(a.soglie.length + 1);
          if ([...classi.select.options].some(o => o.value === n)) classi.select.value = n;
        }
      }
      mostraLista(a);
    }
    classi.riga.hidden = metodo.riga.hidden = rampa.riga.hidden = anteprima.hidden = modo.select.value !== 'graduata';
    disegnaAnteprima();
  };

  rileva();
  sincronizza();
  return { el, sincronizza, rileva };
}
