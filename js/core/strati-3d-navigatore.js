import { t } from './i18n.js';
import { assiJoystick } from './strati-3d-modello.js';

// Navigatore della vista «Strati in 3D», sul modello di Google Earth: una bussola che si trascina per girare (un clic
// torna a nord) con al centro un joystick per muoversi, e una colonna di pulsanti da tenere premuti per zoom e
// inclinazione, più «centra» e la guida ai comandi. Non muove nulla da sé: passa assi e gesti alla scena.
// assi: oggetto { avanti, lato, gira, inclina, zoom } che la scena somma ai tasti a ogni fotogramma.

const SVG = d => `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONE = {
  piu: SVG('<path d="M12 5v14M5 12h14"/>'),
  meno: SVG('<path d="M5 12h14"/>'),
  inclinaSu: SVG('<path d="M4 17l8-8 8 8"/><path d="M4 21h16" opacity=".5"/>'),
  inclinaGiu: SVG('<path d="M4 9l8 8 8-8"/><path d="M4 4h16" opacity=".5"/>'),
  centra: SVG('<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/>'),
  guida: SVG('<circle cx="12" cy="12" r="9.5"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14"/><circle cx="12" cy="17.3" r=".6" fill="currentColor"/>'),
};

function el(tag, classe) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  return e;
}

// Un pulsante che agisce finché è premuto (mouse, dito o tastiera): `asse` riceve `verso` alla pressione e 0 al rilascio.
function tenuto(classe, icona, titolo, assi, asse, verso) {
  const b = el('button', classe);
  b.type = 'button';
  b.innerHTML = icona;
  b.title = b.ariaLabel = titolo;
  const via = () => { assi[asse] = 0; b.classList.remove('premuto'); };
  b.addEventListener('pointerdown', ev => { ev.preventDefault(); b.setPointerCapture?.(ev.pointerId); assi[asse] = verso; b.classList.add('premuto'); });
  b.addEventListener('pointerup', via);
  b.addEventListener('pointercancel', via);
  b.addEventListener('lostpointercapture', via);
  // da tastiera (Invio o spazio) un colpo breve
  b.addEventListener('click', ev => { if (ev.detail === 0) { assi[asse] = verso; setTimeout(via, 220); } });
  return b;
}

export function creaNavigatore({ assi, gira, nord, centra, guida, gesto }) {
  const radice = el('div', 'strati3d-nav');
  radice.setAttribute('role', 'group');
  radice.setAttribute('aria-label', t('strati3d.nav'));

  // bussola: l'anello si trascina attorno al centro per girare, un clic senza trascinare torna a nord
  const bussola = el('div', 'strati3d-bussola');
  bussola.title = t('strati3d.nav.bussola');
  bussola.setAttribute('role', 'button');
  bussola.tabIndex = 0;
  bussola.ariaLabel = t('strati3d.nav.bussola');
  const rosa = el('div', 'strati3d-rosa');
  rosa.innerHTML = '<b>N</b><i class="e"></i><i class="s"></i><i class="o"></i>'; // i18n-ok: la N della bussola
  const manopola = el('div', 'strati3d-manopola');
  manopola.title = t('strati3d.nav.joystick');
  manopola.setAttribute('role', 'button');
  manopola.ariaLabel = t('strati3d.nav.joystick');
  bussola.append(rosa, manopola);

  let giro = null;
  const angolo = ev => {
    const r = bussola.getBoundingClientRect();
    return Math.atan2(ev.clientY - (r.top + r.height / 2), ev.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
  };
  bussola.addEventListener('pointerdown', ev => {
    if (ev.target.closest('.strati3d-manopola')) return;
    ev.preventDefault();
    bussola.setPointerCapture?.(ev.pointerId);
    giro = { a: angolo(ev), mosso: 0 };
    bussola.classList.add('gira');
    gesto();
  });
  bussola.addEventListener('pointermove', ev => {
    if (!giro) return;
    const a = angolo(ev);
    const d = ((a - giro.a + 540) % 360) - 180;
    giro.a = a;
    giro.mosso += Math.abs(d);
    gira(d);
    gesto();
  });
  const lasciaGiro = () => {
    if (giro && giro.mosso < 3) nord();
    giro = null;
    bussola.classList.remove('gira');
  };
  bussola.addEventListener('pointerup', lasciaGiro);
  bussola.addEventListener('pointercancel', () => { giro = null; bussola.classList.remove('gira'); });
  bussola.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); nord(); } });

  // joystick: la manopola si trascina, la velocità cresce con la distanza dal centro; lasciata torna al centro
  let leva = null;
  const RAGGIO = () => bussola.clientWidth * 0.3;
  manopola.addEventListener('pointerdown', ev => {
    ev.preventDefault();
    ev.stopPropagation();
    manopola.setPointerCapture?.(ev.pointerId);
    const r = bussola.getBoundingClientRect();
    leva = [r.left + r.width / 2, r.top + r.height / 2];
    manopola.classList.add('premuto');
    gesto();
  });
  manopola.addEventListener('pointermove', ev => {
    if (!leva) return;
    const R = RAGGIO();
    let dx = ev.clientX - leva[0], dy = ev.clientY - leva[1];
    const d = Math.hypot(dx, dy);
    if (d > R) { dx *= R / d; dy *= R / d; }
    manopola.style.transform = `translate(${dx}px, ${dy}px)`;
    Object.assign(assi, assiJoystick(dx, dy, R));
    gesto();
  });
  const lasciaLeva = () => {
    leva = null;
    assi.avanti = assi.lato = 0;
    manopola.style.transform = '';
    manopola.classList.remove('premuto');
  };
  manopola.addEventListener('pointerup', lasciaLeva);
  manopola.addEventListener('pointercancel', lasciaLeva);
  manopola.addEventListener('lostpointercapture', lasciaLeva);

  const colonna = el('div', 'strati3d-nav-colonna');
  const bCentra = el('button', 'strati3d-nav-centra');
  bCentra.type = 'button';
  bCentra.innerHTML = ICONE.centra;
  bCentra.title = bCentra.ariaLabel = t('strati3d.nav.centra');
  bCentra.addEventListener('click', centra);
  const bGuida = el('button', 'strati3d-nav-guida');
  bGuida.type = 'button';
  bGuida.innerHTML = ICONE.guida;
  bGuida.title = bGuida.ariaLabel = t('strati3d.nav.guida');
  bGuida.addEventListener('click', guida);
  colonna.append(
    tenuto('strati3d-nav-piu', ICONE.piu, t('strati3d.nav.piu'), assi, 'zoom', 1),
    tenuto('strati3d-nav-meno', ICONE.meno, t('strati3d.nav.meno'), assi, 'zoom', -1),
    tenuto('strati3d-nav-inclina-su', ICONE.inclinaSu, t('strati3d.nav.inclinaSu'), assi, 'inclina', 1),
    tenuto('strati3d-nav-inclina-giu', ICONE.inclinaGiu, t('strati3d.nav.inclinaGiu'), assi, 'inclina', -1),
    bCentra, bGuida);
  radice.append(bussola, colonna);

  // la rosa segue la rotazione del modello: la N indica dove sta il nord della mappa
  let ultimo = null;
  const orienta = a => {
    const g = Math.round(a * 10) / 10;
    if (g === ultimo) return;
    ultimo = g;
    rosa.style.transform = `rotate(${g}deg)`;
  };
  return { radice, orienta };
}

// La guida ai comandi: una scheda con mouse, tastiera e tocco, che si apre la prima volta e dal pulsante «?».
export function creaGuida(chiudi) {
  const radice = el('div', 'strati3d-guida');
  radice.setAttribute('role', 'dialog');
  radice.setAttribute('aria-label', t('strati3d.guida.titolo'));
  radice.hidden = true;
  const h = el('h3');
  h.textContent = t('strati3d.guida.titolo');
  const griglia = el('div', 'strati3d-guida-griglia');
  for (const [sezione, n] of [['mouse', 4], ['tastiera', 4], ['tocco', 3]]) {
    const s = el('section');
    const t3 = el('h4');
    t3.textContent = t(`strati3d.guida.${sezione}`);
    const ul = el('ul');
    for (let i = 1; i <= n; i++) {
      const li = el('li');
      // le parti tra [quadre] sono tasti o gesti: si disegnano come tasti
      const testo = t(`strati3d.guida.${sezione}.${i}`);
      for (const [j, pezzo] of testo.split(/\[([^\]]+)\]/).entries()) {
        if (!pezzo) continue;
        const k = el(j % 2 ? 'kbd' : 'span');
        k.textContent = pezzo;
        li.append(k);
      }
      ul.append(li);
    }
    s.append(t3, ul);
    griglia.append(s);
  }
  const ok = el('button', 'strati3d-guida-ok');
  ok.type = 'button';
  ok.textContent = t('strati3d.guida.chiudi');
  ok.addEventListener('click', chiudi);
  radice.append(h, griglia, ok);
  return radice;
}
