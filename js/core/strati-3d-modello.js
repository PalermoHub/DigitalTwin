// Modello della vista «Strati in 3D»: quali piani mostrare e come un punto di un piano torna un punto della mappa.
// Niente DOM né MapLibre qui: le funzioni lavorano su elenchi e numeri (vedi tests/js/strati-3d.test.mjs).

// Piani massimi: oltre, si tengono quelli più in alto nell'ordine di disegno (la base resta sempre).
export const MAX_PIANI = { desktop: 14, telefono: 8 };

const visibile = l => (l.layout?.visibility ?? 'visible') !== 'none';

// Un piano per strato acceso del pannello, nell'ordine di disegno della mappa (il primo sta sotto), più:
// - la base cartografica, sotto a tutto, se ha qualche layer visibile;
// - «altri», i layer visibili che nessuno strato dei moduli possiede (RNDT, I miei layer, mappe aggiunte),
//   esclusi quelli che leggono una sorgente dei moduli (sono i layer di servizio: clic, evidenze).
// stile: map.getStyle().layers · strati: [{ id, etichetta, layers }] · acceso(id) · eBase(idLayer)
export function gruppiStrati(stile, strati, acceso, eBase) {
  const posizione = new Map(stile.map((l, i) => [l.id, i]));
  const perId = new Map(stile.map(l => [l.id, l]));
  const vivi = ids => ids.filter(id => perId.has(id) && visibile(perId.get(id)));
  const gruppi = [];
  const base = stile.filter(l => eBase(l.id) && visibile(l)).map(l => l.id);
  if (base.length) gruppi.push({ id: 'base', base: true, layers: base });
  const posseduti = new Set();
  const sorgentiModuli = new Set();
  for (const s of strati) {
    for (const id of s.layers) { posseduti.add(id); const src = perId.get(id)?.source; if (src) sorgentiModuli.add(src); }
    if (!acceso(s.id)) continue;
    const layers = vivi(s.layers);
    if (layers.length) gruppi.push({ id: s.id, etichetta: s.etichetta, layers });
  }
  const altri = stile.filter(l => visibile(l) && !eBase(l.id) && !posseduti.has(l.id) && l.type !== 'background'
    && !(l.source && sorgentiModuli.has(l.source))).map(l => l.id);
  if (altri.length) gruppi.push({ id: 'altri', altri: true, layers: altri });
  const quota = g => (g.base ? -1 : Math.min(...g.layers.map(id => posizione.get(id))));
  return gruppi.sort((a, b) => quota(a) - quota(b));
}

// Rilievo 3D ed elevazione diventano un solo piano «terreno», in fondo alla pila: l'elevazione colorata va drappeggiata
// sul rilievo (strati-3d-terreno.js), da sola su un piano piatto perderebbe le altezze.
export const STRATI_TERRENO = ['rilievo3d', 'elevazione'];
export function unisciTerreno(gruppi, ids = STRATI_TERRENO) {
  const suoi = gruppi.filter(g => ids.includes(g.id));
  if (!suoi.length) return gruppi;
  const terreno = { id: 'terreno', terreno: true, strati: suoi.map(g => g.id), layers: suoi.flatMap(g => g.layers) };
  return [terreno, ...gruppi.filter(g => !ids.includes(g.id))];
}

// Tiene base e terreno e gli ultimi piani (quelli più in alto) fino a `max`: ritorna anche quanti ne restano fuori.
export function limitaPiani(gruppi, max) {
  if (gruppi.length <= max) return { piani: gruppi, fuori: 0 };
  const fisso = g => g.base || g.terreno;
  const base = gruppi.filter(fisso);
  const resto = gruppi.filter(g => !fisso(g));
  const tenuti = resto.slice(resto.length - (max - base.length));
  return { piani: [...base, ...tenuti], fuori: resto.length - tenuti.length };
}

// Dalla posizione su un piano (u, v in 0..1, origine in alto a sinistra) alle coordinate Mercator della mappa:
// a beccheggio zero la vista è un'affinità, quindi basta interpolare i quattro angoli catturati [no, ne, se, so].
export function puntoDaPiano(angoli, u, v) {
  const [no, ne, se, so] = angoli;
  const lerp = (a, b, k) => a + (b - a) * k;
  const su = [lerp(no[0], ne[0], u), lerp(no[1], ne[1], u)];
  const giu = [lerp(so[0], se[0], u), lerp(so[1], se[1], u)];
  return [lerp(su[0], giu[0], v), lerp(su[1], giu[1], v)];
}

// Quote dei piani esplosi: passo uguale, proporzionale al lato della cattura.
export const quote = (n, lato) => Array.from({ length: n }, (_, i) => i * lato * 0.075);

// Un'etichetta per una feature qualsiasi, dalle sue proprietà (per gli strati senza un modello di tooltip):
// il catasto come foglio e particella, altrimenti il campo più parlante tra quelli noti e, se c'è, un secondo campo
// come dettaglio; in mancanza, il primo testo o il primo numero che non sia un identificativo.
const CHIAVI = ['nome', 'name', 'denominazione', 'denominaz', 'titolo', 'title', 'route_long_name', 'route_short_name', 'linea',
  'zto', 'zona', 'descrizion', 'descrizione', 'descrizone', 'tipo', 'categoria', 'indirizzo', 'quartiere', 'circoscriz', 'circoscrizione', 'sezione', 'classe'];
const IDENTIFICATIVO = /^(fid|id|id1|ogc_fid|objectid|gid|cod_istat|cod_cat)$/i;
export function etichettaFeature(p) {
  if (!p) return null;
  const chiavi = Object.keys(p);
  const trova = n => chiavi.find(k => k.toLowerCase() === n);
  const vale = k => k != null && p[k] != null && typeof p[k] !== 'object' && String(p[k]).trim() !== '';
  const foglio = trova('foglio'), particella = trova('paricella') ?? trova('particella');
  if (vale(foglio) && vale(particella)) return { foglio: String(p[foglio]), particella: String(p[particella]) };
  const trovate = CHIAVI.map(trova).filter(vale);
  if (trovate.length) {
    const titolo = String(p[trovate[0]]);
    const sotto = trovate.slice(1).map(k => String(p[k])).find(v => v !== titolo && v.length <= 80) ?? '';
    return { titolo, sotto };
  }
  const testo = chiavi.find(k => !IDENTIFICATIVO.test(k) && typeof p[k] === 'string' && p[k].trim());
  if (testo) return { titolo: p[testo], sotto: '' };
  const numero = chiavi.find(k => !IDENTIFICATIVO.test(k) && typeof p[k] === 'number');
  return numero ? { titolo: `${numero}: ${p[numero].toLocaleString()}`, sotto: '' } : null;
}

// Strati disegnati come immagini (PRG e vincoli) o con dati altrove: per il tooltip si interrogano i layer invisibili
// che l'app usa per la scheda. Le chiavi sono gli id degli strati del pannello.
export const LAYER_DA_INTERROGARE = {
  prg: ['prg-zto-hit', 'prg-ns-hit', 'prg-cs-hit'],
  vincoli: ['prg-va-hit', 'prg-vl-hit'],
  catasto: ['catasto-hit'],
  omi: ['omi-hit'],
  immobili: ['immobili-hit'],
  edificato: ['edifici-hit'],
  edifici3d: ['edifici-hit'],
  coropletico: ['pop-hit'],
  rilievo3d: ['griglia-hit'],
  elevazione: ['griglia-hit'],
};
// i layer da interrogare per un piano della pila (il terreno riunisce più strati)
export const layerDaInterrogare = g => [...new Set([...g.layers, ...(g.strati ?? [g.id]).flatMap(id => LAYER_DA_INTERROGARE[id] ?? [])])];

// ── «Dentro la pila»: l'occhio sta in un varco tra due piani accesi e guarda in su o in giù ──
// Un varco si indica con l'indice del piano acceso che ha sotto; ce n'è uno tra ogni coppia di piani accesi.
export function varchi(spento) {
  const accesi = spento.map((s, i) => (s ? -1 : i)).filter(i => i >= 0);
  return accesi.slice(0, -1);
}

// il varco sopra il piano `i` (o, se sopra non c'è niente, l'ultimo): -1 se non ce n'è nessuno
export function varcoPer(lista, i) {
  if (!lista.length) return -1;
  return lista.find(v => v >= i) ?? lista[lista.length - 1];
}

// sale (passo > 0) o scende di un varco, senza uscire dalla pila
export function camminaVarco(lista, v, passo) {
  const at = lista.indexOf(v);
  if (at < 0) return varcoPer(lista, v);
  return lista[Math.min(lista.length - 1, Math.max(0, at + passo))];
}

// Opacità di un piano visto dal varco `v` con l'inclinazione `b` (0 = giù, 90 = orizzontale, 180 = su): i due piani che
// chiudono il varco pieni, gli altri sempre più trasparenti allontanandosi. Guardando dritto giù (o su) quelli alle
// spalle si nascondono: stanno dietro l'occhio e alcuni browser li disegnerebbero male. Con l'occhio arretrato
// (`lontano`, zoom indietro) non c'è niente alle spalle: si vedono tutti.
const SFUMA = [1, 0.6, 0.35, 0.2];
export function opacitaDentro(spento, v, i, b, lontano = false) {
  if (spento[i]) return 0;
  const accesi = spento.map((s, j) => (s ? -1 : j)).filter(j => j >= 0);
  const p = accesi.indexOf(i), ps = accesi.indexOf(v);
  const sopra = p > ps;
  if (!lontano && ((sopra && b < 45) || (!sopra && b > 135))) return 0;
  return SFUMA[Math.min(SFUMA.length - 1, sopra ? p - ps - 1 : ps - p)];
}

// Un trascinamento sullo schermo (dx, dy) diventa un passo dell'occhio sul piano, perché quello che sta sotto il dito
// segua il dito: `a` è la rotazione, `b` l'inclinazione, `h` la distanza dal piano più vicino, `P` la prospettiva.
// Guardando in su l'asse verticale dello schermo si ribalta.
export function passoOcchio(dx, dy, a, b, h, P) {
  const r = (a * Math.PI) / 180, f = h / P, sy = b > 90 ? -1 : 1;
  const x = dx, y = dy * sy;
  return [-(x * Math.cos(r) + y * Math.sin(r)) * f, -(-x * Math.sin(r) + y * Math.cos(r)) * f];
}

// La trasformazione del mondo, una sola per le due viste: da fuori l'occhio è a distanza (tz = 0) e la pila gira attorno
// al suo centro; da dentro tz = prospettiva porta l'occhio nel punto (ex, ey, zt) e la vista gira attorno all'occhio.
// Passando da una all'altra i numeri si interpolano e la camera «entra» nella pila.
export const trasformaMondo = c => `translate3d(${c.tx}px,${c.ty}px,${c.tz}px) rotateX(${c.b}deg) rotateZ(${c.a}deg) `
  + `scale3d(${c.k},${c.k},${c.k}) translate3d(${-c.ex}px,${-c.ey}px,${-c.zt}px)`;

// i piani accesi, su cui si può camminare (dal più basso)
export const pianiAccesi = spento => spento.map((s, i) => (s ? -1 : i)).filter(i => i >= 0);

// Da dentro la pila si gira tutto il modello attorno al suo asse (non attorno all'occhio): ruotare il mondo di `delta`
// gradi con l'occhio fermo sullo schermo equivale a sommare `delta` alla rotazione e a riportare l'occhio nel mondo
// ruotato di -delta. Con l'occhio al centro della pila è una semplice rotazione.
export function ruotaAttorno({ a, ex, ey }, delta) {
  const r = (delta * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  return { a: a + delta, ex: ex * c + ey * s, ey: -ex * s + ey * c };
}

// Camminando: un passo in avanti (verso l'alto dello schermo) e di lato (verso destra), con la rotazione `a`
export function passoAvanti(a, avanti, destra = 0) {
  const r = (a * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  return [destra * c - avanti * s, -destra * s - avanti * c];
}

// Zoom da dentro la pila (k: 1 = normale). Avvicinando (k > 1) si stringe il campo visivo come un teleobiettivo;
// allontanando (k < 1) l'occhio arretra lungo lo sguardo, fino a vedere la pila da fuori: allargare soltanto il campo
// visivo rimpicciolirebbe poco e deformerebbe i bordi. `base` è la prospettiva normale, `lato` il lato dei piani.
export const ZOOM_DENTRO = { min: 0.15, max: 4 };
export function zoomDentro(k, base, lato) {
  const z = Math.min(ZOOM_DENTRO.max, Math.max(ZOOM_DENTRO.min, k));
  return { P: base * Math.max(1, z), indietro: z < 1 ? (1 / z - 1) * lato * 0.3 : 0 };
}

// ── Movimento continuo, come in un videogioco ──
// Tasti tenuti, joystick e pulsanti tenuti danno cinque assi in -1..1; la velocità li insegue con un'accelerazione
// morbida (avvicina) e ogni fotogramma sposta la camera di velocità × tempo. Così il moto parte e si ferma senza scatti
// e non dipende dalla ripetizione dei tasti del sistema.
export const ASSI = ['avanti', 'lato', 'gira', 'inclina', 'zoom'];
// per codice del tasto (ev.code, indipendente dalla tastiera): [asse, verso]; con Maiusc le frecce su e giù inclinano
const TASTI = {
  KeyW: ['avanti', 1], ArrowUp: ['avanti', 1], KeyS: ['avanti', -1], ArrowDown: ['avanti', -1],
  KeyA: ['gira', 1], ArrowLeft: ['gira', 1], KeyD: ['gira', -1], ArrowRight: ['gira', -1],
  KeyQ: ['lato', -1], KeyE: ['lato', 1], KeyR: ['inclina', 1], KeyF: ['inclina', -1],
  Equal: ['zoom', 1], NumpadAdd: ['zoom', 1], Minus: ['zoom', -1], NumpadSubtract: ['zoom', -1],
};
export const tastoDiMoto = code => code in TASTI;
export function assiDaTasti(premuti, maiuscolo = false) {
  const assi = Object.fromEntries(ASSI.map(a => [a, 0]));
  for (const code of premuti) {
    let [asse, verso] = TASTI[code] ?? [];
    if (!asse) continue;
    if (maiuscolo && (code === 'ArrowUp' || code === 'ArrowDown')) asse = 'inclina';
    assi[asse] += verso;
  }
  return assi;
}
// somma di più sorgenti, ogni asse tenuto in -1..1
export const sommaAssi = (...fonti) => Object.fromEntries(ASSI.map(a => [a, Math.max(-1, Math.min(1, fonti.reduce((s, f) => s + (f[a] ?? 0), 0)))]));
// la velocità insegue gli assi: `ritmo` più alto = più reattiva; sotto una soglia si ferma del tutto
export function avvicina(vel, scopo, dt, ritmo = 7) {
  const m = 1 - Math.exp(-dt * ritmo);
  for (const a of ASSI) {
    vel[a] += ((scopo[a] ?? 0) - vel[a]) * m;
    if (!scopo[a] && Math.abs(vel[a]) < 1e-3) vel[a] = 0;
  }
  return vel;
}
// Joystick: spostamento della manopola (dx, dy) in px su un raggio → avanti (su = avanti) e lato, con una zona morta al
// centro e una curva che rende fini i movimenti piccoli.
export function assiJoystick(dx, dy, raggio, morta = 0.12) {
  const d = Math.hypot(dx, dy) / raggio;
  if (d < morta) return { avanti: 0, lato: 0 };
  const k = Math.min(1, (d - morta) / (1 - morta)) ** 1.6 / d;
  return { avanti: -dy / raggio * k, lato: dx / raggio * k };
}
// l'angolo più breve (in -180..180) per tornare a nord da una rotazione `a`
export const versoNord = a => -(((a % 360) + 540) % 360 - 180);

// I layer «fratelli» di un piano: quelli dello stile che leggono la stessa sorgente (e source-layer) dei layer del piano
// e ne disegnano le aree. Uno strato di confini, per esempio, si vede come linea ma ha un riempimento invisibile: un punto
// dentro un poligono tocca solo quello. stile: map.getStyle().layers
export function layerFratelli(stile, ids) {
  const chiave = l => `${l.source}\n${l['source-layer'] ?? ''}`;
  const suoi = new Set(stile.filter(l => ids.includes(l.id) && l.source).map(chiave));
  return stile.filter(l => !ids.includes(l.id) && l.type === 'fill' && suoi.has(chiave(l))).map(l => l.id);
}

// Gli attributi da mostrare per una feature: [campo, valore] senza identificativi, valori vuoti od oggetti; i campi
// parlanti (CHIAVI) per primi, testi lunghi accorciati. `salta`: valori già mostrati come titolo.
export function attributiFeature(p, max = 4, salta = []) {
  if (!p) return [];
  const gia = new Set(salta.filter(Boolean).map(String));
  const vale = k => p[k] != null && typeof p[k] !== 'object' && String(p[k]).trim() !== '' && !/^(null|undefined)$/i.test(String(p[k]))
    && !IDENTIFICATIVO.test(k) && !/^(id\d*|fid|shape_.*|objectid_\d+)$/i.test(k);
  const rango = k => { const i = CHIAVI.indexOf(k.toLowerCase()); return i < 0 ? CHIAVI.length : i; };
  const campi = Object.keys(p).filter(vale).sort((a, b) => rango(a) - rango(b));
  const fuori = [];
  for (const k of campi) {
    let v = typeof p[k] === 'number' ? p[k].toLocaleString() : String(p[k]).trim();
    if (gia.has(v)) continue;
    if (v.length > 90) v = `${v.slice(0, 87)}…`;
    fuori.push([k, v]);
    if (fuori.length >= max) break;
  }
  return fuori;
}

// zoom a cui la mappa sotto la scena interroga i dati: abbastanza vicino da avere tutte le sorgenti (il PRG parte da 12,
// il catasto da 15), mai più lontano di com'era la mappa
export const ZOOM_SONDA = 15.5;
export const zoomSonda = zoomVista => Math.max(zoomVista, ZOOM_SONDA);
