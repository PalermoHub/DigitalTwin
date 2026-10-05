// js/geoimage/index.js
// Geoimage nel pannello di destra: georeferenzia una mappa storica (o qualsiasi immagine) sulla base di Palermo.
// Qui nasce lo stato condiviso e il «contesto» che i moduli collega* usano; ogni modulo gestisce una sezione del pannello.
import { creaPannello } from './pannello.js';
import { creaOverlay } from './overlay.js';
import { creaManiglie } from './maniglie.js';
import { creaStorico } from './storico.js';
import { creaSospensione } from './sospensione.js';
import { creaRichieste } from './richieste.js';
import { collegaImmagine } from './immagine.js';
import { collegaPosizione } from './posizione.js';
import { collegaConfronto } from './confronto.js';
import { collegaGcp } from './gcp.js';
import { collegaSessione } from './sessione.js';
import { collegaEsporta } from './esporta.js';
import { limiti } from './geometria.js';
import { segnala } from '../core/pannello.js';

const copia = a => a.map(p => ({ lat: p.lat, lng: p.lng }));

export function collegaGeoimage(map, elemento) {
  creaPannello(elemento);
  // immagine = { dataUrl, nome, larghezza, altezza } originale; schermo = quella mostrata (vedi overlay.js);
  // angoli = [NO, NE, SO, SE] in gradi; gcp = [{ px, py, lat, lng }]; tipo = 'poly1' | 'poly2'
  const stato = { immagine: null, schermo: null, angoli: null, angoliIniziali: null, opacita: 0.7, tipo: 'poly1', gcp: [] };
  const overlay = creaOverlay(map);
  const storico = creaStorico();
  const sospensione = creaSospensione(map);
  const richieste = creaRichieste();
  const ascoltatori = { cambio: [], caricamento: [], visibilita: [], tasto: [] };
  const aperto = () => !elemento.hidden && !elemento.classList.contains('collassato');

  const ctx = {
    map, stato, overlay, storico, sospensione, aperto,
    $: id => elemento.querySelector(`#gi-${id}`),
    avvisa: segnala, // avvisi che restano visibili sulla mappa
    messaggio: testo => { elemento.querySelector('#gi-stato').textContent = testo; },
    prenota: richieste.prenota, // vedi richieste.js: chi finisce dopo deve controllare attuale(id) prima di toccare lo stato
    attuale: richieste.attuale,
    sulCambio: fn => ascoltatori.cambio.push(fn),
    sulCaricamento: fn => ascoltatori.caricamento.push(fn), // fn(origine): 'file' | 'progetto' | 'ripristino' | 'rimossa'
    suVisibilita: fn => ascoltatori.visibilita.push(fn),
    sulTasto: fn => ascoltatori.tasto.push(fn), // fn(evento) → true se ha gestito il tasto
    cambiato: () => ascoltatori.cambio.forEach(fn => fn()),
    // il pannello copre la destra della mappa e la ricerca il basso: l'immagine si inquadra nella parte rimasta visibile
    inquadra(angoli, maxZoom = 16) {
      const r = elemento.getBoundingClientRect();
      const destra = aperto() ? window.innerWidth - r.left : 44;
      map.fitBounds(limiti(angoli), { padding: { top: 40, bottom: 80, left: 60, right: destra + 20 }, maxZoom });
    },
    impostaAngoli(angoli) { stato.angoli = angoli; overlay.angoli(angoli); ctx.maniglie.aggiorna(); },
    conferma() { storico.salva(stato.angoli); ctx.cambiato(); }, // fine di un gesto: entra nella cronologia
    caricaImmagine(immagine, schermo, angoli, { gcp = [], opacita = stato.opacita, tipo = stato.tipo, iniziali = angoli, origine = 'file' } = {}) {
      Object.assign(stato, { immagine, schermo, angoli: copia(angoli), angoliIniziali: copia(iniziali), gcp: gcp.map(g => ({ ...g })), opacita, tipo });
      overlay.mostra(schermo, stato.angoli);
      overlay.opacita(opacita);
      storico.azzera();
      storico.salva(stato.angoli);
      ctx.maniglie.ricostruisci();
      ascoltatori.caricamento.forEach(fn => fn(origine));
      ctx.cambiato();
    },
    rimuoviImmagine() {
      richieste.prenota(); // un caricamento o ripristino ancora in corso non deve far riapparire l'immagine
      Object.assign(stato, { immagine: null, schermo: null, angoli: null, angoliIniziali: null, gcp: [] });
      overlay.nascondi();
      storico.azzera();
      ctx.maniglie.ricostruisci();
      ascoltatori.caricamento.forEach(fn => fn('rimossa'));
      ctx.cambiato();
    },
  };
  ctx.maniglie = creaManiglie(map, { leggi: () => stato.angoli, scrivi: a => ctx.impostaAngoli(a), alFine: () => ctx.conferma() });

  // le sezioni che hanno senso solo con un'immagine compaiono e spariscono con lei
  ctx.sulCambio(() => elemento.querySelectorAll('[data-richiede="immagine"]').forEach(s => { s.hidden = !stato.immagine; }));

  // le maniglie si vedono solo a pannello aperto e non ripiegato
  new MutationObserver(() => {
    const on = aperto();
    if (on) ctx.maniglie.mostra(); else ctx.maniglie.nascondi();
    ascoltatori.visibilita.forEach(fn => fn(on));
  }).observe(elemento, { attributes: true, attributeFilter: ['hidden', 'class'] });

  // scorciatoie: solo a pannello aperto e fuori dai campi di testo, per non toccare quelle del resto dell'app
  document.addEventListener('keydown', e => {
    if (!aperto() || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName) || e.target.isContentEditable) return;
    // in fase di cattura e fermando l'evento: un Esc consumato qui non deve chiudere anche la Scheda o i gruppi della barra
    for (const fn of ascoltatori.tasto) if (fn(e) === true) { e.preventDefault(); e.stopPropagation(); break; }
  }, true);

  collegaImmagine(ctx);
  collegaPosizione(ctx);
  collegaConfronto(ctx);
  collegaGcp(ctx);
  const sessione = collegaSessione(ctx);
  collegaEsporta(ctx);
  ctx.cambiato(); // stato iniziale dei pulsanti

  return {
    stato, // sola lettura: lo usano i test del browser
    apri() { elemento.hidden = false; },
    chiudi() { elemento.hidden = true; },
    ripristina: sessione.ripristina,
  };
}
