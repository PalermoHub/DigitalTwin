// Stampa «poster» in PNG, JPG o PDF: mappa a tutta pagina con banner del titolo, legende dei layer accesi a riquadri, barra di scala,
// rosa dei venti e piede con fonti, crediti della stampa e attribuzioni delle basi cartografiche. Impaginazione ispirata alle mappe
// mensili dell'INGV, come nell'app Terremoti Italia di OpenDataSicilia da cui questo modulo deriva.
// Ispirato a Layout Composer (Defani Arman Alfitriansyah, MIT, https://github.com/Defani/Layout-Composer): nessun codice copiato.
import { t as tr, localeIntl } from './i18n.js';
import { FORMATI, barraScala, scalaDaZoom } from './stampa.js';
import { RESPIRO, TESTATA, RIGA, altezzaBlocco, colonneLegende } from './stampa-legende.js';

const MM_PX_CSS = 25.4 / 96; // lato di un pixel CSS sul foglio, in mm
const BLU = '#0b4f7a';
const LOGO = 'img/opendatasicilia.png';
const URL_APP = 'https://palermodigitaltwin.opendatasicilia.it/mappa.html';

// Pagina intera (senza margini) in mm
export function paginaMm(formato, direzione) {
  const [corto, lungo] = FORMATI[formato];
  return direzione === 'landscape' ? { larghezza: lungo, altezza: corto } : { larghezza: corto, altezza: lungo };
}

// Zoom che porta la vista attuale sul foglio: stesso territorio, riquadro di dimensioni diverse (mai oltre il riquadro più stretto)
export function zoomPerPagina(zoomVista, vistaPx, paginaPx) {
  return zoomVista + Math.log2(Math.min(paginaPx.larghezza / vistaPx.larghezza, paginaPx.altezza / vistaPx.altezza));
}

// Dispone `testo` su più righe di larghezza massima `max` (nell'unità del contesto corrente)
export function spezzaRighe(ctx, testo, max) {
  const righe = [];
  let corrente = '';
  for (const parola of testo.split(/\s+/).filter(Boolean)) {
    const prova = corrente ? `${corrente} ${parola}` : parola;
    if (corrente && ctx.measureText(prova).width > max) { righe.push(corrente); corrente = parola; } else corrente = prova;
  }
  if (corrente) righe.push(corrente);
  return righe;
}

// Scheda arrotondata con ombra morbida (u = px per mm: l'ombra non segue la scala del contesto)
function carta(ctx, u, x, y, w, h, r = 1.2, riempimento = 'rgba(255,255,255,.95)') {
  ctx.save();
  ctx.shadowColor = 'rgba(15,23,42,.38)'; ctx.shadowBlur = 1.8 * u; ctx.shadowOffsetY = 0.6 * u;
  ctx.fillStyle = riempimento;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(15,23,42,.2)'; ctx.lineWidth = 0.15;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.stroke();
}

// Bussola: disco bianco, anello, stella a quattro punte con il nord evidenziato
function roseDeiVenti(ctx, u, x, y, r) {
  carta(ctx, u, x - r * 1.25, y - r * 1.25, r * 2.5, r * 2.5, r * 1.25);
  ctx.strokeStyle = BLU; ctx.lineWidth = 0.25;
  ctx.beginPath(); ctx.arc(x, y, r * 1.02, 0, 2 * Math.PI); ctx.stroke();
  ctx.lineWidth = 0.1; ctx.beginPath(); ctx.arc(x, y, r * 0.86, 0, 2 * Math.PI); ctx.stroke();
  const punta = (ang, lungo, largo, colore) => {
    ctx.fillStyle = colore;
    ctx.beginPath();
    ctx.moveTo(x + lungo * Math.sin(ang), y - lungo * Math.cos(ang));
    ctx.lineTo(x + largo * Math.sin(ang + Math.PI / 4), y - largo * Math.cos(ang + Math.PI / 4));
    ctx.lineTo(x, y);
    ctx.lineTo(x + largo * Math.sin(ang - Math.PI / 4), y - largo * Math.cos(ang - Math.PI / 4));
    ctx.closePath(); ctx.fill();
  };
  [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4].forEach(a => punta(a, r * 0.55, r * 0.17, '#94a3b8'));
  [Math.PI / 2, Math.PI, 3 * Math.PI / 2].forEach(a => punta(a, r * 0.78, r * 0.2, '#334155'));
  punta(0, r * 0.82, r * 0.22, '#dc2626');
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r * 0.07, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#111'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `bold ${r * 0.42}px Montserrat, sans-serif`;
  ctx.fillText('N', x, y - r * 1.58);
}

// Un riquadro di legenda: testata blu con il titolo del layer e una riga per voce (simbolo + testo)
function disegnaSimbolo(ctx, simbolo, x, y, lato) {
  if (!simbolo) return;
  if (simbolo.tipo === 'immagine') { // dentro un quadrato di `lato`, senza deformare
    const k = Math.min(lato / (simbolo.img.naturalWidth || simbolo.img.width), lato / (simbolo.img.naturalHeight || simbolo.img.height));
    const w = (simbolo.img.naturalWidth || simbolo.img.width) * k;
    const h = (simbolo.img.naturalHeight || simbolo.img.height) * k;
    ctx.drawImage(simbolo.img, x + (lato - w) / 2, y + (lato - h) / 2, w, h);
    return;
  }
  ctx.beginPath();
  if (simbolo.tondo) ctx.arc(x + lato / 2, y + lato / 2, lato / 2, 0, 2 * Math.PI); else ctx.roundRect(x, y, lato, lato, lato * 0.12);
  if (simbolo.tipo === 'sfumatura') {
    const g = ctx.createLinearGradient(x, 0, x + lato, 0);
    simbolo.colori.forEach((c, i) => g.addColorStop(i / (simbolo.colori.length - 1), c));
    ctx.fillStyle = g;
  } else ctx.fillStyle = simbolo.colore;
  ctx.fill();
  ctx.strokeStyle = simbolo.bordo ?? 'rgba(15,23,42,.45)'; ctx.lineWidth = 0.12; ctx.stroke();
}

function disegnaBlocco(ctx, u, x, y, larghezza, blocco, corpo) {
  const h = altezzaBlocco(blocco) * corpo;
  const testata = TESTATA * corpo;
  carta(ctx, u, x, y, larghezza, h, corpo * 0.8);
  ctx.fillStyle = BLU; ctx.beginPath(); ctx.roundRect(x, y, larghezza, testata, [corpo * 0.8, corpo * 0.8, 0, 0]); ctx.fill();
  ctx.fillStyle = '#f5a623'; ctx.fillRect(x, y + testata - corpo * 0.2, larghezza, corpo * 0.2);
  ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.font = `bold ${corpo * 1.1}px Montserrat, sans-serif`;
  ctx.fillText(blocco.titolo, x + corpo, y + testata * 0.46, larghezza - 2 * corpo);
  const lato = corpo * 1.1;
  blocco.voci.forEach((voce, i) => {
    const cy = y + testata + corpo * 0.25 + (i + 0.5) * RIGA * corpo;
    disegnaSimbolo(ctx, voce.simbolo, x + corpo, cy - lato / 2, lato);
    ctx.font = `${voce.nota ? 'italic ' : ''}${corpo * 0.95}px Montserrat, sans-serif`; ctx.fillStyle = voce.nota ? '#64748b' : '#1e293b';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const xt = x + corpo * (voce.simbolo ? 2.8 : 1);
    ctx.fillText(voce.testo, xt, cy, larghezza - (xt - x) - corpo * 0.6);
  });
}

// Corpo base del testo: 2,4 mm su A4 orizzontale, proporzionale sugli altri formati
export const corpoTesto = larghezzaPagina => Math.max(2.4, larghezzaPagina / 120);

// Area della mappa sulla pagina (mm): sotto il banner del titolo, con attorno la fascia della cornice e delle coordinate
export function areaMappaPoster(formato, direzione) {
  const p = paginaMm(formato, direzione);
  const corpo = corpoTesto(p.larghezza);
  const bordo = corpo * 3;
  const banner = corpo * 8;
  return { x: bordo, y: banner + bordo, larghezza: p.larghezza - 2 * bordo, altezza: p.altezza - banner - 2 * bordo, banner, bordo };
}

// — proiezione Web Mercator per graticola e scala: stessa matematica di MapLibre (mondo = 512 px × 2^zoom) —
const mercX = lng => (lng + 180) / 360;
const mercY = lat => { const s = Math.sin(lat * Math.PI / 180); return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI); };

// `area` = dimensioni della mappa in mm; le coordinate restituite sono in mm dall'angolo in alto a sinistra della mappa
export function proiettore(centro, zoom, area) {
  const mondo = 512 * 2 ** zoom * MM_PX_CSS;
  const cx = mercX(centro.lng);
  const cy = mercY(centro.lat);
  return {
    verso: (lng, lat) => ({ x: area.larghezza / 2 + (mercX(lng) - cx) * mondo, y: area.altezza / 2 + (mercY(lat) - cy) * mondo }),
    lng: x => ((x - area.larghezza / 2) / mondo + cx) * 360 - 180,
    lat: y => Math.atan(Math.sinh(Math.PI * (1 - 2 * ((y - area.altezza / 2) / mondo + cy)))) * 180 / Math.PI,
  };
}

const PASSI_GRIGLIA = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20];
// Passo della graticola in gradi: il più piccolo che non supera circa 6 linee sull'estensione data
export const passoGriglia = gradi => PASSI_GRIGLIA.find(p => gradi / p <= 6) ?? PASSI_GRIGLIA.at(-1);

// «12°30′ E», «38° N»; sotto i 3′ di passo gradi decimali
export function etichettaGradi(valore, asse, passo) {
  const lettera = asse === 'lng' ? (valore < 0 ? 'W' : 'E') : (valore < 0 ? 'S' : 'N');
  const assoluto = Math.abs(valore);
  if (passo < 0.05) return `${assoluto.toFixed(2)}° ${lettera}`;
  let g = Math.floor(assoluto + 1e-9);
  let m = Math.round((assoluto - g) * 60);
  if (m === 60) { g += 1; m = 0; }
  return m === 0 ? `${g}° ${lettera}` : `${g}°${String(m).padStart(2, '0')}′ ${lettera}`;
}

// Valori multipli di `passo` dentro [min, max]
export function valoriGriglia(min, max, passo) {
  const da = Math.ceil(min / passo - 1e-9);
  const a = Math.floor(max / passo + 1e-9);
  return Array.from({ length: Math.max(0, a - da + 1) }, (_, i) => Math.round((da + i) * passo * 1e6) / 1e6);
}

// Cornice a fascia a segmenti bianchi e neri (uno per intervallo di graticola), graticola e coordinate sui quattro lati
// Luminosità media (0–255) della mappa: la graticola cambia colore sulle basi scure (satellite, scuro) e su quelle chiare
export function luminosita(immagine, ritaglio) {
  const c = Object.assign(document.createElement('canvas'), { width: 24, height: 24 });
  const g = c.getContext('2d', { willReadFrequently: true });
  if (ritaglio) g.drawImage(immagine, ritaglio.x, ritaglio.y, ritaglio.w, ritaglio.h, 0, 0, 24, 24); else g.drawImage(immagine, 0, 0, 24, 24);
  const d = g.getImageData(0, 0, 24, 24).data;
  let somma = 0;
  for (let i = 0; i < d.length; i += 4) somma += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
  return somma / (d.length / 4);
}

function cornice(ctx, m, proj, corpo, conGriglia, scuro = false) {
  const fascia = corpo * 0.4;
  const { x, y, larghezza: w, altezza: h } = m;
  const estremi = { lngMin: proj.lng(0), lngMax: proj.lng(w), latMax: proj.lat(0), latMin: proj.lat(h) };
  const passo = passoGriglia(Math.max(estremi.lngMax - estremi.lngMin, (estremi.latMax - estremi.latMin) * (w / h)));
  const meridiani = valoriGriglia(estremi.lngMin, estremi.lngMax, passo);
  const paralleli = valoriGriglia(estremi.latMin, estremi.latMax, passo);
  const xs = meridiani.map(v => proj.verso(v, estremi.latMax).x);
  const ys = paralleli.map(v => proj.verso(estremi.lngMin, v).y);
  const tratti = (posizioni, lunghezza) => { const p = [0, ...posizioni, lunghezza]; return p.slice(0, -1).map((da, i) => [da, p[i + 1]]); };

  if (conGriglia) {
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const linee = () => {
      ctx.beginPath();
      xs.forEach(px => { ctx.moveTo(x + px, y); ctx.lineTo(x + px, y + h); });
      ys.forEach(py => { ctx.moveTo(x, y + py); ctx.lineTo(x + w, y + py); });
      ctx.stroke();
    };
    // sottile ma leggibile su ogni base: alone di contrasto sotto e filo sopra, chiari sulle basi scure e scuri su quelle chiare
    ctx.setLineDash([]);
    ctx.strokeStyle = scuro ? 'rgba(0,0,0,.6)' : 'rgba(255,255,255,.9)'; ctx.lineWidth = Math.max(0.5, corpo * 0.2); linee();
    ctx.setLineDash([corpo * 0.7, corpo * 0.45]);
    ctx.strokeStyle = scuro ? '#fff' : '#111'; ctx.lineWidth = Math.max(0.2, corpo * 0.085); linee();
    ctx.restore();
  }
  // fascia a scacchi: nera e bianca alternate fra due linee della graticola
  ctx.lineWidth = 0.08; ctx.strokeStyle = '#111';
  tratti(xs, w).forEach(([da, a], i) => {
    ctx.fillStyle = i % 2 ? '#fff' : '#111';
    ctx.fillRect(x + da, y - fascia, a - da, fascia); ctx.fillRect(x + da, y + h, a - da, fascia);
  });
  tratti(ys, h).forEach(([da, a], i) => {
    ctx.fillStyle = i % 2 ? '#fff' : '#111';
    ctx.fillRect(x - fascia, y + da, fascia, a - da); ctx.fillRect(x + w, y + da, fascia, a - da);
  });
  ctx.strokeStyle = '#111'; ctx.lineWidth = 0.12;
  ctx.strokeRect(x - fascia, y - fascia, w + 2 * fascia, h + 2 * fascia);
  ctx.lineWidth = 0.2; ctx.strokeRect(x, y, w, h);

  // coordinate: meridiani sopra e sotto, paralleli ai lati (testo ruotato)
  ctx.fillStyle = '#111'; ctx.font = `${corpo * 0.9}px Montserrat, sans-serif`;
  meridiani.forEach((v, i) => {
    const t = etichettaGradi(v, 'lng', passo);
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(t, x + xs[i], y - fascia - corpo * 0.3);
    ctx.textBaseline = 'top'; ctx.fillText(t, x + xs[i], y + h + fascia + corpo * 0.25);
  });
  paralleli.forEach((v, i) => {
    const t = etichettaGradi(v, 'lat', passo);
    ctx.textAlign = 'center';
    ctx.save(); ctx.translate(x - fascia - corpo * 0.25, y + ys[i]); ctx.rotate(-Math.PI / 2); ctx.textBaseline = 'bottom'; ctx.fillText(t, 0, 0); ctx.restore();
    ctx.save(); ctx.translate(x + w + fascia + corpo * 0.25, y + ys[i]); ctx.rotate(Math.PI / 2); ctx.textBaseline = 'bottom'; ctx.fillText(t, 0, 0); ctx.restore();
  });
  ctx.textBaseline = 'middle';
}

// Disegna il poster sulla pagina `canvas`: sfondo bianco, banner (titolo e crediti), mappa incorniciata con graticola, legenda, scala, rosa dei venti.
// Le misure sono in mm: il contesto è scalato di `u` px/mm. `mappa` = { immagine, ritaglio? } con ritaglio opzionale { x, y, w, h } in px dell'immagine.
// `vista` = { centro, zoom } con cui la mappa è stata resa: servono per la graticola e la barra di scala.
export function disegnaPoster(canvas, opzioni) {
  const { pagina, formato, direzione, titolo, sottotitolo, attribuzioni, logo, data, mappa, vista } = opzioni;
  const legende = opzioni.legende ?? [];
  const el = { legenda: true, scala: true, rosa: true, griglia: true, ...opzioni.elementi }; // cornice, fonte dei dati, logo e attribuzioni ci sono sempre
  const ctx = canvas.getContext('2d');
  const u = canvas.width / pagina.larghezza;
  ctx.save();
  ctx.scale(u, u);
  const { larghezza: L, altezza: A } = pagina;
  const corpo = corpoTesto(L);
  const m = areaMappaPoster(formato, direzione);
  const margine = corpo * 1.3; // distanza degli elementi dal bordo della mappa
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, L, A);

  // Mappa
  if (mappa?.immagine) {
    const r = mappa.ritaglio;
    if (r) ctx.drawImage(mappa.immagine, r.x, r.y, r.w, r.h, m.x, m.y, m.larghezza, m.altezza);
    else ctx.drawImage(mappa.immagine, m.x, m.y, m.larghezza, m.altezza);
  }
  const proj = proiettore(vista.centro, vista.zoom, m);
  cornice(ctx, m, proj, corpo, el.griglia, mappa?.immagine ? luminosita(mappa.immagine, mappa.ritaglio) < 120 : false);

  // Banner del titolo: sfumatura blu, reticolo in filigrana e filo ambra; a destra due blocchi di crediti (fuori dalla mappa)
  const gb = ctx.createLinearGradient(0, 0, L, 0);
  gb.addColorStop(0, '#093a5c'); gb.addColorStop(0.55, BLU); gb.addColorStop(1, '#2a8fc4');
  ctx.fillStyle = gb; ctx.fillRect(0, 0, L, m.banner);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, L, m.banner); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 0.18;
  ctx.beginPath();
  const passoReticolo = m.banner * 0.5;
  for (let gx = L * 0.55; gx < L; gx += passoReticolo) { ctx.moveTo(gx, 0); ctx.lineTo(gx - m.banner * 0.6, m.banner); }
  for (let gy = passoReticolo; gy < m.banner; gy += passoReticolo) { ctx.moveTo(L * 0.5, gy); ctx.lineTo(L, gy); }
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#f5a623'; ctx.fillRect(0, m.banner - corpo * 0.3, L, corpo * 0.3);
  // Logo ODS prima del titolo (è scuro: un riquadro bianco arrotondato lo fa leggere sul blu)
  let xTitolo = corpo * 1.8;
  if (logo) {
    const hl = m.banner - corpo * 3.2, lw = hl * (logo.naturalWidth / logo.naturalHeight), lx = corpo * 1.8, ly = (m.banner - corpo * 0.3 - hl) / 2;
    ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.roundRect(lx - corpo * 0.4, ly - corpo * 0.4, lw + corpo * 0.8, hl + corpo * 0.8, corpo * 0.8); ctx.fill();
    ctx.drawImage(logo, lx, ly, lw, hl);
    xTitolo = lx + lw + corpo * 1.5;
  }
  const wTitolo = L * 0.35 - corpo * 1.2 - xTitolo;
  ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
  ctx.font = `bold ${corpo * 2.2}px Montserrat, sans-serif`;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 0.8 * u; ctx.shadowOffsetY = 0.25 * u;
  ctx.fillText(titolo, xTitolo, m.banner * 0.4, wTitolo);
  ctx.restore();
  ctx.font = `${corpo * 0.95}px Montserrat, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,.88)';
  ctx.fillText(sottotitolo, xTitolo, m.banner * 0.74, wTitolo);

  // Blocco 1: fonte dei dati, realizzazione, link all'app, attribuzioni delle basi. Blocco 2: avvertenza
  const yC = corpo * 0.8, hC = m.banner - corpo * 0.3 - 2 * yC; // altezza utile delle schede
  const xIni = L * 0.35, xFin = L - corpo * 1.5, gap = corpo * 0.8;
  const w1 = (xFin - xIni - gap) * 0.56, w2 = xFin - xIni - gap - w1;
    const tagliaA = (righe, n) => righe.length <= n ? righe : [...righe.slice(0, n - 1), `${righe[n - 1].replace(/[\s·,;.]+$/, '')}…`];
  ctx.font = `${corpo * 0.95}px Montserrat, sans-serif`;
  const righe = tagliaA([
    tr('stampa.poster.fonteDati'),
    tr('stampa.poster.realizzazione'),
    URL_APP,
    ...spezzaRighe(ctx, attribuzioni.join(' · ').replace(/\s*[|·]\s*INGV\b/g, '').replace(/\bINGV\s*[|·]\s*/g, ''), w1 - corpo * 0.8), // l'INGV è l'attribuzione di un layer, non della base: nei crediti del banner non va
  ], Math.floor((hC - corpo * 0.8) / (corpo * 1.25)));
  // Nessuna scheda né bordo: il testo sta direttamente sul fondo del banner
  ctx.textAlign = 'left';
  const y1 = yC + (hC - righe.length * corpo * 1.25) / 2 + corpo * 0.625;
  righe.forEach((r, i) => {
    ctx.font = `${i < 3 ? 'bold ' : ''}${corpo * 0.95}px Montserrat, sans-serif`;
    ctx.fillStyle = i === 2 ? '#ffd27a' : i < 2 ? '#fff' : 'rgba(255,255,255,.78)';
    ctx.fillText(r, xIni, y1 + i * corpo * 1.25, w1 - corpo * 0.5);
  });
  const x2 = xIni + w1 + gap;
  ctx.font = `italic ${corpo * 0.8}px Montserrat, sans-serif`;
  const avviso = tagliaA(spezzaRighe(ctx, tr('stampa.poster.avvertenza'), w2 - corpo * 1.2), Math.floor((hC - corpo * 0.8) / corpo));
  ctx.fillStyle = 'rgba(255,255,255,.72)'; ctx.textAlign = 'left';
  const y2 = yC + (hC - avviso.length * corpo) / 2 + corpo * 0.5;
  avviso.forEach((r, i) => ctx.fillText(r, x2 + corpo * 0.4, y2 + i * corpo, w2 - corpo * 0.8));

  // Rosa dei venti (alto a destra dentro la mappa)
  if (el.rosa) roseDeiVenti(ctx, u, m.x + m.larghezza - margine - corpo * 2.6, m.y + margine + corpo * 4, corpo * 1.9);

  // Filetto esterno della pagina
  ctx.strokeStyle = BLU; ctx.lineWidth = 0.6; ctx.strokeRect(0.3, 0.3, L - 0.6, A - 0.6);
  ctx.restore();
}

// PDF minimo con una sola pagina e un'immagine JPEG a pagina intera (nessuna dipendenza)
export function creaPdf(jpeg, pxL, pxA, paginaL, paginaA) {
  const pt = mm => (mm * 72 / 25.4).toFixed(2);
  const codifica = new TextEncoder();
  const contenuto = `q ${pt(paginaL)} 0 0 ${pt(paginaA)} 0 0 cm /Im0 Do Q`;
  const parti = [];
  const offset = [];
  let lunghezza = 0;
  const aggiungi = dati => { const b = typeof dati === 'string' ? codifica.encode(dati) : dati; parti.push(b); lunghezza += b.length; };
  const oggetto = (n, corpo) => { offset[n] = lunghezza; aggiungi(`${n} 0 obj\n`); corpo(); aggiungi('\nendobj\n'); };
  aggiungi('%PDF-1.4\n');
  oggetto(1, () => aggiungi('<< /Type /Catalog /Pages 2 0 R >>'));
  oggetto(2, () => aggiungi('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));
  oggetto(3, () => aggiungi(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pt(paginaL)} ${pt(paginaA)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`));
  oggetto(4, () => { aggiungi(`<< /Type /XObject /Subtype /Image /Width ${pxL} /Height ${pxA} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`); aggiungi(jpeg); aggiungi('\nendstream'); });
  oggetto(5, () => aggiungi(`<< /Length ${contenuto.length} >>\nstream\n${contenuto}\nendstream`));
  const xref = lunghezza;
  aggiungi(`xref\n0 6\n0000000000 65535 f \n${[1, 2, 3, 4, 5].map(n => `${String(offset[n]).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(parti, { type: 'application/pdf' });
}

export const caricaLogo = () => new Promise(risolvi => { const i = new Image(); i.onload = () => risolvi(i); i.onerror = () => risolvi(null); i.src = LOGO; });
const caricaImmagine = url => new Promise((risolvi, rifiuta) => { const i = new Image(); i.onload = () => risolvi(i); i.onerror = () => rifiuta(new Error('image load failed')); i.src = url; });
const comeBlob = (canvas, tipo, qualita) => new Promise((ok, ko) => canvas.toBlob(b => (b ? ok(b) : ko(new Error('canvas too large'))), tipo, qualita));

function scarica(blob, nome) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: nome });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// `immagineUrl` = mappa catturata a tutta pagina; `uscita` = 'png' | 'pdf'
// Sottotitolo di riserva: centro della mappa e data
export const sottotitoloPredefinito = (centro, data) => tr('stampa.poster.sottotitolo', { lat: centro.lat.toFixed(3), lng: centro.lng.toFixed(3), data });

export async function esportaPoster({ immagineUrl, uscita, formato, direzione, titolo, sottotitolo, elementi, legende, attribuzioni, centro, zoom }) {
  const pagina = paginaMm(formato, direzione);
  const area = areaMappaPoster(formato, direzione);
  const mappa = await caricaImmagine(immagineUrl);
  const k = mappa.naturalWidth / area.larghezza; // px per mm della mappa catturata
  const canvas = Object.assign(document.createElement('canvas'), { width: Math.round(pagina.larghezza * k), height: Math.round(pagina.altezza * k) });
  const data = new Date().toLocaleDateString(localeIntl(), { day: 'numeric', month: 'long', year: 'numeric' });
  disegnaPoster(canvas, {
    pagina, formato, direzione, titolo, attribuzioni, data, logo: await caricaLogo(), elementi, legende,
    mappa: { immagine: mappa }, vista: { centro, zoom },
    sottotitolo: sottotitolo || sottotitoloPredefinito(centro, data),
  });
  const nome = `palermo-digital-twin-${new Date().toISOString().slice(0, 10)}`;
  if (uscita === 'png') return scarica(await comeBlob(canvas, 'image/png'), `${nome}.png`);
  if (uscita === 'jpg') return scarica(await comeBlob(canvas, 'image/jpeg', 0.93), `${nome}.jpg`);
  const jpeg = new Uint8Array(await (await comeBlob(canvas, 'image/jpeg', 0.92)).arrayBuffer());
  scarica(creaPdf(jpeg, canvas.width, canvas.height, pagina.larghezza, pagina.altezza), `${nome}.pdf`);
}

