// Presentazione: gli strati della mappa esplosi in 3D, da girare a mano (sezione #strati-3d di presentazione.html).
// Le texture vengono dall'app (scripts/social/strati-cattura.mjs e terreno-gradoni.py, in img/strati-3d/); la scena è CSS 3D.
// Sulla pagina che scorre: un dito o il mouse girano la pila in orizzontale (la pagina scorre in verticale), lo zoom
// è con i pulsanti o Ctrl + rotella. Gira da sola solo quando è in vista e se non si è chiesto meno movimento.
import { caricaDizionari, t, tl } from './core/i18n.js';

const DIR = 'img/strati-3d/';
const GAP = 75, SPAZIO_TERRENO = 50, QUOTA = 0.15, FETTE = 6, PROSPETTIVA = 2600;
const lerp = (a, b, x) => a + (b - a) * x;
const cl = (x, a, b) => Math.min(b, Math.max(a, x));

async function avvia(radice) {
  await caricaDizionari();
  const [conf, gradoni] = await Promise.all([
    fetch(DIR + 'strati.json').then(r => r.json()),
    fetch(DIR + 'terreno.json').then(r => r.json()).catch(() => []),
  ]);
  const strati = conf.strati;
  const fermo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const palco = radice.querySelector('.p3-palco');
  const mondo = radice.querySelector('.p3-mondo');
  const elenco = radice.querySelector('.p3-elenco');
  const linee = radice.querySelector('.p3-linee');
  const baseZ = strati.map((_, i) => strati.slice(0, i).reduce((z, s) => z + GAP + (s.gradoni ? SPAZIO_TERRENO : 0), 0));

  const piani = strati.map((s, i) => {
    const d = document.createElement('div');
    d.className = 'p3-piano';
    const img = src => { const f = document.createElement('img'); f.src = DIR + src; f.alt = ''; f.decoding = 'async'; f.loading = 'lazy'; d.append(f); return f; };
    if (s.gradoni) for (const g of gradoni) img(g.file).dataset.q = g.quota;
    else {
      if (s.id === 'edifici') for (let j = 0; j < FETTE; j++) { const f = img(s.id + '.webp'); f.dataset.j = j; f.style.filter = `brightness(${0.35 + 0.5 * j / FETTE}) saturate(.6)`; }
      img(s.id + '.webp');
    }
    if (s.base) d.dataset.base = '';
    mondo.append(d);
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = '<i></i><span><b></b><small></small></span>';
    b.querySelector('i').textContent = i + 1;
    b.querySelector('b').textContent = tl(s.titolo);
    b.querySelector('small').textContent = tl(s.sotto);
    b.addEventListener('click', () => { meta.att = meta.att === i ? -1 : i; gesto(); });
    elenco.prepend(b); // in cima l'ultimo strato, come nella pila
    const ln = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    linee.append(ln);
    return { s, d, b, ln };
  });

  // camera: `meta` è dove va, `cam` dove si trova
  const meta = { a: 30, b: 58, z: 1, e: 1, att: -1 };
  const cam = { ...meta, zt: null };
  let gira = !fermo, visibile = false, ultimoGesto = 0, raf = 0;
  const gesto = () => { ultimoGesto = performance.now(); };

  // ── gesti ──
  let trascina = null;
  palco.addEventListener('pointerdown', ev => { trascina = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, tocco: ev.pointerType !== 'mouse' }; palco.classList.add('trascina'); gesto(); });
  window.addEventListener('pointermove', ev => {
    if (!trascina || ev.pointerId !== trascina.id) return;
    meta.a -= (ev.clientX - trascina.x) * 0.35;
    if (!trascina.tocco) meta.b = cl(meta.b - (ev.clientY - trascina.y) * 0.25, 0, 82); // col dito il verticale resta alla pagina
    trascina.x = ev.clientX; trascina.y = ev.clientY;
    gesto();
  });
  const lascia = () => { trascina = null; palco.classList.remove('trascina'); };
  window.addEventListener('pointerup', lascia);
  window.addEventListener('pointercancel', lascia);
  palco.addEventListener('wheel', ev => {
    if (!ev.ctrlKey) return; // senza Ctrl la rotella fa scorrere la pagina
    ev.preventDefault();
    meta.z = cl(meta.z * Math.exp(-ev.deltaY * 0.002), 0.5, 3);
    gesto();
  }, { passive: false });
  palco.addEventListener('keydown', ev => {
    const k = { ArrowLeft: () => { meta.a += 10; }, ArrowRight: () => { meta.a -= 10; }, ArrowUp: () => { meta.b = cl(meta.b + 6, 0, 82); },
      ArrowDown: () => { meta.b = cl(meta.b - 6, 0, 82); }, '+': () => { meta.z = cl(meta.z * 1.15, 0.5, 3); }, '-': () => { meta.z = cl(meta.z / 1.15, 0.5, 3); } }[ev.key];
    if (k) { ev.preventDefault(); k(); gesto(); }
  });
  const comando = (sel, fn) => radice.querySelector(sel)?.addEventListener('click', () => { fn(); gesto(); });
  comando('[data-p3=piu]', () => { meta.z = cl(meta.z * 1.2, 0.5, 3); });
  comando('[data-p3=meno]', () => { meta.z = cl(meta.z / 1.2, 0.5, 3); });
  radice.querySelector('[data-p3=esplodi]')?.addEventListener('input', ev => { meta.e = +ev.target.value; gesto(); });
  const btnGira = radice.querySelector('[data-p3=gira]');
  btnGira?.setAttribute('aria-pressed', String(gira));
  comando('[data-p3=gira]', () => { gira = !gira; btnGira.setAttribute('aria-pressed', String(gira)); });
  const btnAlto = radice.querySelector('[data-p3=alto]');
  comando('[data-p3=alto]', () => {
    const daAlto = meta.b > 5;
    meta.b = daAlto ? 0 : 58;
    if (daAlto) { meta.a = Math.round(meta.a / 360) * 360; gira = false; btnGira?.setAttribute('aria-pressed', 'false'); }
    btnAlto.textContent = t(daAlto ? 'pres.strati3d.in3d' : 'pres.strati3d.alto');
  });

  // ── disegno, solo quando la sezione è in vista ──
  let tPrima = performance.now();
  function passo(ora) {
    const dt = Math.min(0.05, (ora - tPrima) / 1000);
    tPrima = ora;
    if (gira && ora - ultimoGesto > 2500) meta.a += dt * 9;
    const m = fermo ? 1 : 1 - Math.exp(-dt * 6);
    for (const k of ['a', 'b', 'z', 'e']) cam[k] = lerp(cam[k], meta[k], m);
    const zt = meta.att >= 0 ? baseZ[meta.att] * meta.e : baseZ.at(-1) * meta.e / 2;
    cam.zt = cam.zt == null ? zt : lerp(cam.zt, zt, m);
    const { clientWidth: W, clientHeight: H } = palco;
    const k = Math.min(W, H) / 1000 * 0.52 * cam.z;
    const tr = `scale3d(${k},${k},${k}) rotateX(${cam.b}deg) rotateZ(${cam.a}deg) translateZ(${-cam.zt}px)`;
    mondo.style.transform = tr;
    const M = new DOMMatrix(tr);
    for (const [i, { s, d, b, ln }] of piani.entries()) {
      const att = i === meta.att;
      const z = baseZ[i] * cam.e + i * 0.4 + (att ? 25 : 0);
      d.style.transform = `translateZ(${z}px)`;
      d.style.opacity = meta.att < 0 || att ? 1 : i < meta.att ? 0.25 : 0.1;
      d.style.setProperty('--vetro', Math.min(1, cam.e * 1.5));
      d.classList.toggle('att', att);
      b.classList.toggle('att', att);
      b.setAttribute('aria-pressed', String(att));
      if (s.gradoni) for (const f of d.querySelectorAll('img[data-q]')) f.style.transform = `translateZ(${f.dataset.q * QUOTA * Math.min(1, cam.e * 1.3)}px)`;
      if (s.id === 'edifici') for (const f of d.querySelectorAll('img[data-j]')) f.style.transform = `translateZ(${(f.dataset.j - FETTE) * 3 * Math.min(1, cam.e * 1.2 + 0.3)}px)`;
      // linea tratteggiata dallo strato evidenziato verso l'elenco (se l'elenco sta di lato)
      if (att && elenco.offsetLeft > W / 2) {
        const [x, y] = [[-500, -500], [500, -500], [500, 500], [-500, 500]].map(([px, py]) => {
          const q = M.transformPoint(new DOMPoint(px, py, z)), w = 1 - q.z / PROSPETTIVA;
          return [W / 2 + q.x / w, H / 2 + q.y / w];
        }).reduce((a, q) => (q[0] > a[0] ? q : a));
        const r = b.getBoundingClientRect(), rp = palco.getBoundingClientRect();
        ln.setAttribute('d', `M${x},${y} L${r.left - rp.left - 24},${y} L${r.left - rp.left - 4},${r.top - rp.top + r.height / 2}`);
        ln.style.opacity = 1;
      } else ln.style.opacity = 0;
    }
    raf = visibile ? requestAnimationFrame(passo) : 0;
  }
  new IntersectionObserver(([v]) => {
    visibile = v.isIntersecting;
    if (visibile && !raf) { tPrima = performance.now(); raf = requestAnimationFrame(passo); }
  }, { rootMargin: '100px' }).observe(radice);
}

const radice = document.getElementById('strati3d-pres');
if (radice) avvia(radice).catch(e => console.warn('strati 3D:', e)); // i18n-ok: messaggio solo per la console
