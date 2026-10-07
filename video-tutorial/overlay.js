// Sovrapposti per la registrazione: cursore con effetto clic, evidenziazioni, lower third,
// indicatore di capitolo, cartelli. Palette dell'app (--accent #f5a623, inchiostro #1a1206).
// Tutto con pointer-events:none, così non disturba i clic di Playwright.
(() => {
  const boot = () => {
  if (window.__v) return;
  const A = '#f5a623', INK = '#1a1206', NAVY = '#23262b';
  const st = document.createElement('style');
  st.textContent = `
  #v-root{position:fixed;inset:0;z-index:2147483000;pointer-events:none;font-family:Montserrat,system-ui,sans-serif}
  #v-cur{position:absolute;left:0;top:0;width:34px;height:34px;margin:-3px 0 0 -3px;will-change:transform;filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))}
  .v-rip{position:absolute;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;border:4px solid ${A};background:${A}55;animation:vrip .7s ease-out forwards}
  @keyframes vrip{from{transform:scale(.4);opacity:1}to{transform:scale(3.4);opacity:0}}
  .v-ring{position:absolute;border:4px solid ${A};border-radius:14px;box-shadow:0 0 0 6px ${A}44,0 0 24px ${A}aa;animation:vpulse 1.1s ease-in-out infinite;opacity:0;transition:opacity .25s}
  .v-ring.on{opacity:1}
  @keyframes vpulse{50%{box-shadow:0 0 0 12px ${A}22,0 0 34px ${A}}}
  .v-lab{position:absolute;background:${A};color:${INK};font-weight:700;font-size:23px;line-height:1.15;padding:9px 16px;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.35);opacity:0;transform:translateY(8px);transition:all .3s;max-width:520px}
  .v-lab.on{opacity:1;transform:none}
  #v-lower{position:absolute;left:0;bottom:92px;display:flex;align-items:stretch;transform:translateX(-110%);transition:transform .55s cubic-bezier(.2,.9,.25,1)}
  #v-lower.on{transform:none}
  #v-lower .barra{width:12px;background:${A}}
  #v-lower .testo{background:${NAVY}ee;color:#fff;padding:14px 30px 14px 22px;font-size:30px;font-weight:700;letter-spacing:.2px;border-radius:0 12px 12px 0}
  #v-lower .testo small{display:block;font-size:19px;font-weight:500;color:${A};margin-top:2px}
  #v-chip{position:absolute;top:122px;left:50%;transform:translate(-50%,-30px);display:flex;gap:6px;opacity:0;transition:all .5s}
  #v-chip.on{opacity:1;transform:translate(-50%,0)}
  #v-chip span{background:${NAVY}d9;color:#ffffffaa;font-size:15px;font-weight:600;padding:6px 14px;border-radius:99px;border:2px solid transparent}
  #v-chip span.att{background:${A};color:${INK};border-color:#fff}
  #v-card{position:absolute;inset:0;background:${NAVY}f2;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;opacity:0;transition:opacity .45s}
  #v-card.on{opacity:1}
  #v-card .num{font-size:30px;font-weight:700;color:${A};letter-spacing:6px;text-transform:uppercase}
  #v-card h1{font-size:92px;margin:14px 0 8px;font-weight:800}
  #v-card p{font-size:34px;margin:0;color:#ffffffcc;font-weight:500}
  #v-card .linea{width:0;height:8px;background:${A};margin-top:26px;border-radius:4px;transition:width .9s .15s}
  #v-card.on .linea{width:240px}
  #v-big{position:absolute;right:60px;top:50%;transform:translateY(-50%) scale(.9);background:${NAVY}f0;color:#fff;border:3px solid ${A};border-radius:20px;padding:26px 34px;font-size:30px;font-weight:600;max-width:640px;line-height:1.35;opacity:0;transition:all .4s}
  #v-big.on{opacity:1;transform:translateY(-50%)}
  #v-big b{color:${A}}
  `;
  document.documentElement.appendChild(st);
  const root = document.createElement('div'); root.id = 'v-root';
  root.innerHTML = `
   <svg id="v-cur" viewBox="0 0 24 24" style="display:none"><path d="M3 2l7.5 19 2.7-7.8L21 10.5z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>
   <div id="v-lower"><div class="barra"></div><div class="testo"></div></div>
   <div id="v-chip"></div>
   <div id="v-big"></div>
   <div id="v-card"><div class="num"></div><h1></h1><p></p><div class="linea"></div></div>`;
  document.documentElement.appendChild(root);
  const cur = root.querySelector('#v-cur');
  let cx = -100, cy = -100;
  const place = () => { cur.style.transform = `translate(${cx}px,${cy}px)`; };
  const rings = [];
  const rect = t => {
    if (Array.isArray(t)) return { left: t[0], top: t[1], width: t[2], height: t[3] };
    const el = typeof t === 'string' ? document.querySelector(t) : t;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  };
  window.__v = {
    glide(x0, y0, x1, y1, ms) {
      const t0 = performance.now(); cur.style.display = 'block';
      const f = now => { const u = Math.min(1, (now - t0) / Math.max(1, ms)), e = u * u * (3 - 2 * u);
        cx = x0 + (x1 - x0) * e; cy = y0 + (y1 - y0) * e; place(); if (u < 1) requestAnimationFrame(f); };
      requestAnimationFrame(f);
    },
    cursor(x, y) { cx = x; cy = y; cur.style.display = 'block'; place(); },
    ripple(x, y) { const d = document.createElement('div'); d.className = 'v-rip'; d.style.left = x + 'px'; d.style.top = y + 'px'; root.appendChild(d); setTimeout(() => d.remove(), 800); },
    ring(t, label, pos = 'below', pad = 8) {
      const r = rect(t); if (!r) return false;
      const d = document.createElement('div'); d.className = 'v-ring';
      Object.assign(d.style, { left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + 2 * pad + 'px', height: r.height + 2 * pad + 'px' });
      root.appendChild(d); rings.push(d); requestAnimationFrame(() => d.classList.add('on'));
      if (label) {
        const l = document.createElement('div'); l.className = 'v-lab'; l.textContent = label;
        root.appendChild(l); rings.push(l);
        const lw = Math.min(520, l.offsetWidth), lh = l.offsetHeight;
        let x = r.left, y = pos === 'above' ? r.top - pad - lh - 14 : r.top + r.height + pad + 14;
        if (pos === 'left') { x = r.left - pad - lw - 14; y = r.top; }
        if (pos === 'right') { x = r.left + r.width + pad + 14; y = r.top; }
        x = Math.max(12, Math.min(innerWidth - lw - 12, x)); y = Math.max(12, Math.min(innerHeight - lh - 12, y));
        l.style.left = x + 'px'; l.style.top = y + 'px'; requestAnimationFrame(() => l.classList.add('on'));
      }
      return true;
    },
    clearRings() { rings.splice(0).forEach(d => { d.classList.remove('on'); setTimeout(() => d.remove(), 350); }); },
    lower(titolo, sotto, ms = 4200) {
      const el = root.querySelector('#v-lower'); el.querySelector('.testo').innerHTML = titolo + (sotto ? `<small>${sotto}</small>` : '');
      requestAnimationFrame(() => el.classList.add('on'));
      setTimeout(() => el.classList.remove('on'), ms);
    },
    lowerOff() { root.querySelector('#v-lower').classList.remove('on'); },
    chip(voci, att) {
      const c = root.querySelector('#v-chip'); c.innerHTML = voci.map((v, i) => `<span class="${i === att ? 'att' : ''}">${v}</span>`).join('');
      c.classList.add('on');
    },
    chipOff() { root.querySelector('#v-chip').classList.remove('on'); },
    card(num, titolo, sotto) {
      const c = root.querySelector('#v-card'); c.querySelector('.num').textContent = num; c.querySelector('h1').textContent = titolo; c.querySelector('p').textContent = sotto || '';
      c.classList.add('on');
    },
    cardOff() { root.querySelector('#v-card').classList.remove('on'); },
    big(html) { const b = root.querySelector('#v-big'); b.innerHTML = html; b.classList.add('on'); },
    bigOff() { root.querySelector('#v-big').classList.remove('on'); },
  };
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
