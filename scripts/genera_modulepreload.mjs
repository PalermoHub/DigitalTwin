// Elenca i moduli JS raggiunti con import statici da avvio.js e app.js e li scrive come <link rel="modulepreload">
// in mappa.html, tra i due marcatori. Senza elenco il browser scopre gli import un livello alla volta
// (circa 230 file in cascata); con l'elenco li scarica tutti insieme.
//   node scripts/genera_modulepreload.mjs          riscrive mappa.html
//   node scripts/genera_modulepreload.mjs --verifica   esce con errore se mappa.html non è aggiornato
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PAGINA = join(RADICE, 'mappa.html');
const INGRESSI = ['js/avvio.js', 'js/app.js'];
const INIZIO = '<!-- modulepreload:inizio (scripts/genera_modulepreload.mjs) -->';
const FINE = '<!-- modulepreload:fine -->';

// import ... from './x.js' ed export ... from './x.js'; gli import() dinamici restano fuori (si caricano a richiesta)
const IMPORT_STATICO = /(?:^|[\n;])\s*(?:import|export)\s[^'"`;]*?\sfrom\s*['"](\.[^'"]+)['"]|(?:^|[\n;])\s*import\s*['"](\.[^'"]+)['"]/g;

export function moduliStatici(ingressi = INGRESSI, radice = RADICE) {
  const visti = new Set();
  const coda = ingressi.map(i => resolve(radice, i));
  const ordine = [];
  while (coda.length) {
    const file = coda.shift();
    if (visti.has(file)) continue;
    visti.add(file);
    ordine.push(relative(radice, file).split('\\').join('/'));
    const testo = readFileSync(file, 'utf8');
    for (const m of testo.matchAll(IMPORT_STATICO)) coda.push(resolve(dirname(file), m[1] ?? m[2]));
  }
  return ordine;
}

export function bloccoLink(moduli) {
  return [INIZIO, ...moduli.map(m => `<link rel="modulepreload" href="${m}">`), FINE].join('\n');
}

export function sostituisciBlocco(html, blocco) {
  const a = html.indexOf(INIZIO);
  const b = html.indexOf(FINE);
  if (a < 0 || b < a) throw new Error(`mappa.html: mancano i marcatori «${INIZIO}» e «${FINE}»`);
  return html.slice(0, a) + blocco + html.slice(b + FINE.length);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const html = readFileSync(PAGINA, 'utf8');
  const nuovo = sostituisciBlocco(html, bloccoLink(moduliStatici()));
  if (process.argv.includes('--verifica')) {
    if (nuovo !== html) { console.error('mappa.html non è aggiornato: lancia node scripts/genera_modulepreload.mjs'); process.exit(1); }
    console.log('mappa.html: modulepreload aggiornati');
  } else {
    writeFileSync(PAGINA, nuovo);
    console.log(`mappa.html: ${moduliStatici().length} moduli in modulepreload`);
  }
}
