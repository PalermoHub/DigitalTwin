// Genera le social card (1200×630) in img/social/ con lo stile delle miniature dei video.
// Uso: node scripts/social/genera.mjs
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';

const qui = dirname(fileURLToPath(import.meta.url));
const uscita = join(qui, '../../img/social');
mkdirSync(uscita, { recursive: true });

const card = [
  { file: 'gemello-1', etichetta: 'IL DIGITAL TWIN DI PALERMO', titolo: 'Gemello digitale', t: 60, sotto: 'La città reale,<br>strato per strato', a: 'dt/dt-02.jpg', pa: 'right center', b: 'landing/hero-scuro.webp', pb: 'top' },
  { file: 'gemello-2', etichetta: 'LA CITTÀ IN UNA MAPPA', titolo: 'Gemello<br>digitale', t: 72, lh: '1.05', sotto: 'Catasto, PRG, edifici<br>e popolazione insieme', a: 'landing/hero-chiaro.webp', b: 'guida/passi/strati.webp', pa: 'top' },
  { file: 'gemello-3', etichetta: 'IL GEMELLO DIGITALE', titolo: 'Palermo', t: 90, sotto: 'La sua copia digitale,<br>aperta a tutti', a: 'landing/hero-scuro.webp', b: 'guida/passi/isole-calore.webp', pa: 'top' },
  { file: 'gemello-4', etichetta: 'IL GEMELLO DIGITALE', titolo: 'Dalla città<br>al civico', t: 64, lh: '1.05', sotto: 'Cerca, filtra, clicca:<br>Palermo in dettaglio', a: 'dt/dt-04.jpg', b: 'guida/passi/scheda.webp' },
  { file: 'gemello-5', etichetta: 'OPEN DATA SICILIA PRESENTA', titolo: 'Il gemello<br>di Palermo', t: 64, lh: '1.05', sotto: 'Una città, mille dati,<br>una sola mappa', a: 'dt/dt-09.jpg', b: 'dt/dt-01.jpg' },
  { file: 'per-tutti', etichetta: 'GRATIS E SENZA ACCOUNT', titolo: 'Per tutti', sotto: 'Cittadini, tecnici, scuole:<br>anche dallo smartphone', a: 'guida/passi/telefono.webp', b: 'guida/passi/monumenti.webp' },
];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
const pagina = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
for (const c of card) {
  const q = new URLSearchParams(Object.fromEntries(Object.entries(c).filter(([k]) => k !== 'file').map(([k, v]) => [k, String(v)])));
  await pagina.goto(pathToFileURL(join(qui, 'card.html')) + '?' + q);
  await pagina.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].map(i => i.decode().catch(() => {}))]));
  await pagina.screenshot({ path: join(uscita, `${c.file}.jpg`), type: 'jpeg', quality: 88 });
  console.log('ok', c.file);
}
await browser.close();
