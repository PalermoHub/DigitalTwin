// Renderizza il reel «strati esplosi» (1080×1920, 30 fps) in img/social/reel-strati.mp4.
// Prima: node scripts/social/strati-cattura.mjs (texture degli strati), python voce-esplodi.py, python musica-esplodi.py.
// Uso: node scripts/social/genera-esplodi.mjs [--tempi] [--url] [--audio esplodi-audio.wav] [--voce cartella-voce] [--prova 1,4,8]
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const qui = dirname(fileURLToPath(import.meta.url));
const uscita = join(qui, '../../img/social');
const FPS = 30;
const arg = n => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const prova = arg('--prova')?.split(',').map(Number);
const audio = arg('--audio');

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--force-gpu-mem-available-mb=4096'] });
const pagina = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
pagina.on('pageerror', e => console.log('errore pagina:', e.message));
// l'indirizzo del sito nella chiusura è sfocato; --url lo mostra
await pagina.goto(pathToFileURL(join(qui, 'esplodi.html')).href + (process.argv.includes('--url') ? '?url=1' : ''));
const strati = JSON.parse(readFileSync(join(uscita, '../strati-3d/strati.json'), 'utf8')).strati;
for (const s of strati) if (s.gradoni) s.gradoni = JSON.parse(readFileSync(join(uscita, '../strati-3d/terreno.json'), 'utf8'));
await pagina.evaluate(s => window.impostaStrati(s), strati);
const durata = await pagina.evaluate(() => window.DURATA);
if (process.argv.includes('--tempi')) {   // per musica-esplodi.py: tagli e passo della salita come li calcola la pagina
  writeFileSync(join(qui, 'esplodi-tempi.json'), JSON.stringify(await pagina.evaluate(() => window.TEMPI), null, 1) + '\n');
  console.log('ok esplodi-tempi.json'); await browser.close(); process.exit(0);
}
const voce = arg('--voce');
if (voce) {
  const battute = JSON.parse(readFileSync(join(qui, 'esplodi-battute.json'), 'utf8'));
  const d = JSON.parse(readFileSync(join(voce, 'durate.json'), 'utf8'));
  await pagina.evaluate(s => { window.SOTTOTITOLI = s; }, battute.map((b, k) => ({ t: b.t, d: d[k].d, parole: d[k].parole, testo: b.testo })));
}

async function fotogramma(t, file) {
  // due fotogrammi del browser: i livelli 3D grandi devono finire di rasterizzare prima dello scatto
  await pagina.evaluate(t => { window.render(t); return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }, t);
  await pagina.screenshot({ path: file, type: 'jpeg', quality: 92 });
}

if (prova) {
  for (const t of prova) await fotogramma(t, join(uscita, `strati-prova-${t}.jpg`));
} else {
  const dir = join(tmpdir(), 'strati-fotogrammi');
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir);
  const n = Math.round(durata * FPS);
  for (let f = 0; f < n; f++) {
    await fotogramma(f / FPS, join(dir, `f${String(f).padStart(5, '0')}.jpg`));
    if (f % 60 === 0) console.log(`${f}/${n}`);
  }
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(dir, 'f%05d.jpg'),
    ...(audio ? ['-i', audio] : ['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo']), '-shortest',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    '-c:a', 'aac', '-b:a', '192k', join(uscita, 'reel-strati.mp4')]);
  rmSync(dir, { recursive: true, force: true });
  console.log('ok reel-strati.mp4');
}
await browser.close();
