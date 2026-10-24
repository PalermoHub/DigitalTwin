// Elenca i moduli JS raggiunti con import statici da avvio.js e app.js e li mette in mappa.html, tra i due marcatori:
// app.js come <link rel="modulepreload"> subito, gli altri con un piccolo script che li aggiunge dopo il primo paint.
// Senza elenco il browser scopre gli import un livello alla volta (circa 230 file in cascata); con l'elenco li scarica insieme.
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

// app.js parte subito (come prima); gli altri partono dopo il primo paint: scaricati e valutati in blocco
// prima del paint, 230 moduli rubano CPU e banda a CSS e font e il primo paint slitta di oltre un secondo.
export function bloccoLink(moduli) {
  const altri = moduli.filter(m => m !== 'js/app.js');
  const script = `(function(){var m=${JSON.stringify(altri)},f=0;function v(){if(f)return;f=1;m.forEach(function(h){var l=document.createElement('link');l.rel='modulepreload';l.href=h;document.head.append(l)})}try{new PerformanceObserver(function(l,o){if(l.getEntries().some(function(e){return e.name==='first-contentful-paint'})){o.disconnect();v()}}).observe({type:'paint',buffered:true})}catch(e){v()}setTimeout(v,2500)})();`;
  return [INIZIO, '<link rel="modulepreload" href="js/app.js">', `<script>${script}</script>`, FINE].join('\n');
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
