// Cattura dall'app vera, uno per volta, gli strati del reel «esploso» (vista dall'alto, sfondo trasparente)
// in img/social/strati/<id>.webp. Serve l'app in locale: python3 scripts/serve.py 8000
// Uso: node scripts/social/strati-cattura.mjs [--solo catasto,prg]   (poi python3 scripts/social/terreno-gradoni.py)
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const qui = dirname(fileURLToPath(import.meta.url));
const uscita = join(qui, '../../img/social/strati');
mkdirSync(uscita, { recursive: true });
// vista (dal centro a Monte Pellegrino), lato della texture quadrata e strati: tutti in strati.json
const { vista: VISTA, lato: LATO, strati: STRATI } = JSON.parse(readFileSync(join(qui, 'strati.json'), 'utf8'));
const is = process.argv.indexOf('--solo');
const solo = is > 0 ? new Set(process.argv[is + 1].split(',')) : null;

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pagina = await browser.newPage({ locale: 'it-IT', viewport: { width: LATO, height: LATO } });
pagina.on('pageerror', e => console.log('errore pagina:', e.message));
await pagina.goto(`http://127.0.0.1:8000/index.html#${VISTA.zoom}/${VISTA.center[1]}/${VISTA.center[0]}`);
await pagina.waitForFunction(() => window.dt?.pronto, null, { timeout: 120000 });
await pagina.evaluate(() => window.dt.differiti());
await pagina.evaluate(([lato, vista]) => {
  const m = document.getElementById('mappa');
  Object.assign(m.style, { position: 'fixed', left: '0', top: '0', width: lato + 'px', height: lato + 'px', zIndex: 0 });
  dt.map.resize();
  dt.map.jumpTo({ ...vista, pitch: 0, bearing: 0 });
  // tutti i temi spenti
  for (const c of document.querySelectorAll('input[type=checkbox][id^=strato-]')) if (c.checked) c.click();
}, [LATO, VISTA]);

const inattiva = () => pagina.evaluate(() => new Promise(r => {
  const m = dt.map; let fatto = false;
  const fine = () => { if (!fatto) { fatto = true; setTimeout(r, 400); } };
  m.once('idle', fine); m.triggerRepaint(); setTimeout(fine, 20000);
}));
await inattiva();

for (const s of STRATI) {
  if ((solo && !solo.has(s.id)) || s.gradoni) continue;   // il terreno a gradoni lo fa terreno-gradoni.py
  // accende i temi dello strato con i controlli dell'app, così stile e filtri sono quelli veri
  await pagina.evaluate(ids => { for (const id of ids) { const c = document.getElementById('strato-' + id); if (c && !c.checked) c.click(); } }, s.temi || []);
  await inattiva();
  const png = await pagina.evaluate(([s, vista]) => new Promise(r => {
    const m = dt.map, prima = new Map();
    m.jumpTo({ ...vista, pitch: 0, bearing: 0 });
    const base = s.base ? (l => l.source === 'openmaptiles' || l.type === 'background' || l.id.startsWith('base-positron')) : null;
    for (const l of m.getStyle().layers) {
      const v = m.getLayoutProperty(l.id, 'visibility') ?? 'visible';
      prima.set(l.id, v);
      const tieni = base ? base(l) && v !== 'none' : v !== 'none' && l.source !== 'openmaptiles' && l.type !== 'background';
      const nascondi = (s.escludi || []).some(x => l.id.includes(x));
      m.setLayoutProperty(l.id, 'visibility', tieni && !nascondi ? 'visible' : 'none');
    }
    m.once('idle', () => {
      m.once('render', () => {
        const url = m.getCanvas().toDataURL('image/png');
        for (const [id, v] of prima) m.setLayoutProperty(id, 'visibility', v);
        r(url);
      });
      m.triggerRepaint();
    });
    m.triggerRepaint();
  }), [s, VISTA]);
  const file = join(uscita, s.id + '.png');
  writeFileSync(file, Buffer.from(png.split(',')[1], 'base64'));
  // «chiaro»: linee sottili e scure (i confini) ispessite e schiarite, sennò sul vetro scuro non si leggono
  const ritocco = s.chiaro ? `a = im.getchannel('A').filter(ImageFilter.MaxFilter(5)); im = Image.new('RGBA', im.size, (236, 240, 247, 255)); im.putalpha(a)` : 'pass';
  execFileSync('python3', ['-c', `from PIL import Image, ImageFilter\nim = Image.open('${file}').convert('RGBA')\n${ritocco}\nim.save('${file.replace('.png', '.webp')}', quality=86, method=6)`]);
  rmSync(file);
  await pagina.evaluate(ids => { for (const id of ids) { const c = document.getElementById('strato-' + id); if (c && c.checked) c.click(); } }, s.temi || []);
  console.log('ok', s.id);
}
await browser.close();
