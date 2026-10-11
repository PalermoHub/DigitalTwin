// Renderizza il reel di lancio (1080×1920, 30 fps) in img/social/reel-lancio.mp4.
// Uso: node scripts/social/genera-reel.mjs [--audio reel-audio.wav] [--voce cartella-voce] [--prova 1,4,8]  (con --prova salva solo i fotogrammi ai secondi indicati)
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, rmSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const qui = dirname(fileURLToPath(import.meta.url));
const uscita = join(qui, '../../img/social');
mkdirSync(uscita, { recursive: true });
const FPS = 30;
const i = process.argv.indexOf('--prova');
const prova = i > 0 ? process.argv[i + 1].split(',').map(Number) : null;
const ia = process.argv.indexOf('--audio');
const audio = ia > 0 ? process.argv[ia + 1] : null;   // wav di musica-reel.py; senza, traccia muta

const browser = await chromium.launch();
const pagina = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await pagina.goto(pathToFileURL(join(qui, 'reel.html')).href);
await pagina.evaluate(() => window.pronto);
// la timeline di reel.html è disegnata sui tempi «progetto»; i tempi «reali» seguono la voce
const tempi = JSON.parse(readFileSync(join(qui, 'reel-tempi.json'), 'utf8'));
const durata = tempi.reale.at(-1);
function progetto(tr) {
  const R = tempi.reale, P = tempi.progetto;
  for (let k = 0; k < R.length - 1; k++)
    if (tr < R[k + 1] || k === R.length - 2) return P[k] + (tr - R[k]) * (P[k + 1] - P[k]) / (R[k + 1] - R[k]);
}
// sottotitoli: battute + durate scritte da voce-reel.py (cartella passata con --voce)
const iv = process.argv.indexOf('--voce');
if (iv > 0) {
  const battute = JSON.parse(readFileSync(join(qui, 'reel-battute.json'), 'utf8'));
  const d = JSON.parse(readFileSync(join(process.argv[iv + 1], 'durate.json'), 'utf8'));
  await pagina.evaluate(s => { window.SOTTOTITOLI = s; }, battute.map((b, k) => ({ t: b.t, d: d[k].d, parole: d[k].parole, testo: b.testo })));
}

async function fotogramma(t, file) {
  await pagina.evaluate(async ([t, tr]) => {
    window.render(t, tr);
    await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  }, [progetto(t), t]);
  await pagina.screenshot({ path: file, type: 'jpeg', quality: 92 });
}

if (prova) {
  for (const t of prova) await fotogramma(t, join(uscita, `reel-prova-${t}.jpg`));
} else {
  const dir = join(tmpdir(), 'reel-fotogrammi');
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir);
  const n = Math.round(durata * FPS);
  for (let f = 0; f < n; f++) {
    await fotogramma(f / FPS, join(dir, `f${String(f).padStart(5, '0')}.jpg`));
    if (f % 60 === 0) console.log(`${f}/${n}`);
  }
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(dir, 'f%05d.jpg'),
    ...(audio ? ['-i', audio] : ['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo']), '-shortest',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    '-c:a', 'aac', '-b:a', '192k', join(uscita, 'reel-lancio.mp4')]);
  rmSync(dir, { recursive: true, force: true });
  console.log('ok reel-lancio.mp4');
}
await browser.close();
