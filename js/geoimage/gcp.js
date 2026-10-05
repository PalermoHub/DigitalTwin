// js/geoimage/gcp.js
// Ground Control Points: modalità GCP (due clic per punto), tabella con residui, RMSE, tipo di trasformazione,
// «Allinea immagine ai GCP» e anteprima dell'immagine con i punti.
//   Passo 1: clic sull'immagine storica sulla mappa → pixel dell'immagine (geoAPixel).
//   Passo 2: clic sulla mappa nel punto reale corrispondente → coordinate.
import { geoAPixel } from './geometria.js';
import { calcolaTrasformazione, minimoGcp, applica, residui, rmse } from './trasformazioni.js';

const segno = (classe, testo = '') => Object.assign(document.createElement('div'), { className: classe, textContent: testo });
const LARGHEZZA_ANTEPRIMA = 800;

export function collegaGcp(ctx) {
  const { $, map, stato, sospensione } = ctx;
  let attivo = false;
  let attesa = null; // { px, py }: passo 1 fatto
  let segnoAttesa = null;
  let marcatori = [];
  let anteprima = null; // Image dell'immagine storica per il canvas

  const titolo = (g, i) => `GCP ${i + 1} · lat ${g.lat.toFixed(6)} · lon ${g.lng.toFixed(6)} · px ${g.px}, py ${g.py}`;

  function ricostruisci() {
    marcatori.forEach(k => k.remove());
    marcatori = stato.gcp.map((g, i) => {
      const elemento = segno('gi-gcp', String(i + 1));
      elemento.title = titolo(g, i);
      elemento.addEventListener('click', e => e.stopPropagation());
      const k = new maplibregl.Marker({ element: elemento, draggable: true }).setLngLat([g.lng, g.lat]).addTo(map);
      // px e py restano quelli del passo 1: sono un punto dell'immagine, non dipendono da dove sta l'overlay
      k.on('dragend', () => { const { lat, lng } = k.getLngLat(); Object.assign(g, { lat, lng }); elemento.title = titolo(g, i); ctx.cambiato(); });
      return k;
    });
  }

  const aggiungi = (lat, lng, px, py) => { stato.gcp.push({ px, py, lat, lng }); ricostruisci(); ctx.cambiato(); };
  const rimuovi = i => { stato.gcp.splice(i, 1); ricostruisci(); ctx.cambiato(); };
  const svuota = () => { stato.gcp = []; ricostruisci(); ctx.cambiato(); };

  function annullaAttesa() {
    attesa = null;
    segnoAttesa?.remove();
    segnoAttesa = null;
  }

  function clic(e) {
    if (!stato.immagine) return;
    const { lat, lng } = e.lngLat;
    if (!attesa) {
      const r = geoAPixel(stato.angoli, stato.immagine.larghezza, stato.immagine.altezza, lat, lng);
      if (!r.valido) return ctx.messaggio('Passo 1: clicca sull\'immagine storica per scegliere il punto.');
      attesa = { px: r.px, py: r.py };
      segnoAttesa = new maplibregl.Marker({ element: segno('gi-gcp gi-gcp-attesa') }).setLngLat([lng, lat]).addTo(map);
      ctx.cambiato();
      return ctx.messaggio(`Pixel (${r.px}, ${r.py}) scelto. Passo 2: clicca sulla mappa nel punto reale corrispondente. Esc per annullare.`);
    }
    const { px, py } = attesa;
    annullaAttesa();
    aggiungi(lat, lng, px, py);
    ctx.messaggio(`GCP ${stato.gcp.length} aggiunto. Passo 1: clicca sull'immagine per il prossimo punto, Esc per uscire.`);
  }

  function imposta(on) {
    if (on && !stato.immagine) return;
    attivo = on;
    annullaAttesa();
    if (on) { sospensione.attiva(clic); map.doubleClickZoom.disable(); } else { sospensione.disattiva(); map.doubleClickZoom.enable(); }
    map.getCanvas().style.cursor = on ? 'crosshair' : '';
    $('gcp-modo').setAttribute('aria-pressed', String(on));
    $('gcp-modo').textContent = on ? 'Esci dalla modalità GCP (G)' : 'Aggiungi GCP (G)';
    if (on) ctx.messaggio('Modalità GCP. Passo 1: clicca sull\'immagine storica per scegliere un punto riconoscibile.');
    ctx.cambiato();
  }

  function disegnaAnteprima() {
    const box = $('anteprima-box');
    box.hidden = !(attivo && stato.immagine);
    if (box.hidden || !anteprima) return;
    const canvas = $('anteprima');
    const { larghezza: W, altezza: H } = stato.immagine;
    const k = Math.min(1, LARGHEZZA_ANTEPRIMA / W);
    canvas.width = Math.round(W * k);
    canvas.height = Math.round(H * k);
    const g = canvas.getContext('2d');
    g.drawImage(anteprima, 0, 0, canvas.width, canvas.height);
    const pallino = (p, colore, r, testo) => {
      g.beginPath(); g.arc(p.px * k, p.py * k, r, 0, Math.PI * 2);
      g.fillStyle = colore; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
      if (testo) { g.fillStyle = '#fff'; g.font = 'bold 11px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(testo, p.px * k, p.py * k); }
    };
    stato.gcp.forEach((p, i) => pallino(p, '#ef4444', 9, String(i + 1)));
    if (attesa) pallino(attesa, 'rgba(245, 158, 11, .9)', 10);
  }

  function aggiornaTabella() {
    const n = stato.gcp.length, min = minimoGcp(stato.tipo);
    $('gcp-conteggio').textContent = n === 0 ? 'Nessun GCP inserito' : n < min ? `${n} GCP: ne servono almeno ${min}` : `${n} GCP`;
    const t = n >= min ? calcolaTrasformazione(stato.tipo, stato.gcp) : null;
    const res = t ? residui(t, stato.gcp) : [];
    const media = res.length ? res.reduce((s, r) => s + r, 0) / res.length : 0;
    const corpo = $('gcp-corpo');
    corpo.replaceChildren(...stato.gcp.map((g, i) => {
      const riga = document.createElement('tr');
      const r = res[i];
      if (r != null) riga.className = r < media * 1.5 ? 'gi-res-buono' : r < media * 3 ? 'gi-res-medio' : 'gi-res-alto';
      for (const testo of [i + 1, g.lat.toFixed(6), g.lng.toFixed(6), g.px, g.py, r != null ? r.toFixed(1) : '—']) riga.append(Object.assign(document.createElement('td'), { textContent: String(testo) }));
      const x = Object.assign(document.createElement('button'), { type: 'button', className: 'gi-btn gi-x', textContent: '×', title: `Rimuovi il GCP ${i + 1}` });
      x.setAttribute('aria-label', `Rimuovi il GCP ${i + 1}`);
      x.addEventListener('click', () => rimuovi(i));
      const cella = document.createElement('td');
      cella.append(x);
      riga.append(cella);
      return riga;
    }));
    $('rmse').hidden = !t;
    $('rmse-val').textContent = t ? rmse(res).toFixed(2) : '—';
    $('allinea').disabled = !(t && stato.immagine);
    $('gcp-svuota').disabled = n === 0;
    $('tipo').value = stato.tipo;
    disegnaAnteprima();
  }

  $('gcp-modo').addEventListener('click', () => imposta(!attivo));
  $('gcp-svuota').addEventListener('click', () => { annullaAttesa(); svuota(); });
  $('tipo').addEventListener('change', () => { stato.tipo = $('tipo').value; ctx.cambiato(); });
  $('allinea').addEventListener('click', () => {
    const t = calcolaTrasformazione(stato.tipo, stato.gcp);
    if (!t || !stato.immagine) return;
    const { larghezza: W, altezza: H } = stato.immagine;
    const angoli = [[0, 0], [W, 0], [0, H], [W, H]].map(([px, py]) => { const g = applica(t, px, py); return { lat: g.lat, lng: g.lng }; });
    ctx.impostaAngoli(angoli);
    ctx.conferma();
    ctx.inquadra(angoli);
    ctx.messaggio('Immagine allineata alle coordinate dei GCP.');
  });

  ctx.sulTasto(e => {
    if (!stato.immagine) return false;
    if (!e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'g') { imposta(!attivo); return true; }
    if (e.key === 'Escape') {
      if (attesa) { annullaAttesa(); ctx.messaggio('Passo 1 annullato: clicca sull\'immagine per scegliere un altro punto.'); ctx.cambiato(); return true; }
      if (attivo) { imposta(false); return true; }
      return false;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && stato.gcp.length) { rimuovi(stato.gcp.length - 1); return true; }
    return false;
  });

  // nuova immagine o progetto: la modalità GCP si spegne, i marcatori e l'anteprima ripartono dai GCP dello stato
  ctx.sulCaricamento(() => {
    attivo = false; annullaAttesa(); sospensione.disattiva(); map.doubleClickZoom.enable(); map.getCanvas().style.cursor = '';
    $('gcp-modo').setAttribute('aria-pressed', 'false');
    $('gcp-modo').textContent = 'Aggiungi GCP (G)';
    ricostruisci();
    anteprima = null;
    if (stato.immagine) {
      const img = new Image();
      img.onload = () => { anteprima = img; disegnaAnteprima(); };
      img.src = stato.immagine.dataUrl;
    }
  });
  // il pannello si chiude o si ripiega: con la mappa libera i clic tornano normali
  ctx.suVisibilita(aperto => { if (!aperto && attivo) imposta(false); });
  ctx.sulCambio(aggiornaTabella);
}
