// Slide 1920×1200 per lo slider di palermohub.opendatasicilia.it → img/social/slide-palermohub.jpg
// e anteprima di come la ritaglia lo slider (1200×400 desktop, 375×300 smartphone).
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const qui = dirname(fileURLToPath(import.meta.url));
const out = join(qui, '../../img/social/slide-palermohub.jpg');
const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1920, height: 1200 } });
await p.goto(pathToFileURL(join(qui, 'slide-palermohub.html')).href);
await p.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].map(i => i.decode().catch(() => {}))]));
await p.screenshot({ path: out, type: 'jpeg', quality: 86 });
// anteprima con lo stesso CSS dello slider del sito (object-fit: cover, overlay in basso)
const anteprima = (w, h) => `<body style="margin:0;background:#eee;font-family:sans-serif">
  <div style="position:relative;width:${w}px;height:${h}px;overflow:hidden;border-radius:8px">
  <img src="${pathToFileURL(out).href}" style="width:100%;height:100%;object-fit:cover">
  <div style="position:absolute;left:0;right:0;bottom:0;background:linear-gradient(transparent,rgba(0,0,0,.8));padding:${w > 600 ? '3rem 2rem 2rem' : '2rem 1rem 1rem'};color:#fff;transform:translateY(20px)">
  <div style="font-size:${w > 600 ? 1.5 : 1.2}rem;font-weight:700;margin-bottom:.5rem">Palermo Digital Twin</div>
  <div style="font-size:1rem;opacity:.9">Il gemello digitale di Palermo: catasto, PRG, popolazione…</div></div></div></body>`;
for (const [w, h, nome] of [[1200, 400, 'desktop'], [375, 300, 'smartphone']]) {
  await p.setViewportSize({ width: w, height: h });
  await p.setContent(anteprima(w, h));
  await p.evaluate(() => document.images[0].decode());
  await p.screenshot({ path: out.replace('.jpg', `-anteprima-${nome}.jpg`), type: 'jpeg', quality: 86 });
}
await browser.close();
console.log('ok');
