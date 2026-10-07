// Legge un JSON di dati/: dalla copia locale se c'è, altrimenti dal link del catalogo (cache in .cache/).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const RADICE = new URL('../../', import.meta.url);
const sha = percorso => createHash('sha256').update(readFileSync(percorso)).digest('hex');

export async function leggiJson(rel) {
  const locale = new URL(`dati/${rel}`, RADICE);
  if (existsSync(locale)) return JSON.parse(readFileSync(locale, 'utf8'));
  const catalogo = JSON.parse(readFileSync(new URL('dati/catalogo.json', RADICE), 'utf8'));
  const voce = catalogo.find(v => v.percorso === rel && v.url);
  if (!voce) throw new Error(`dato non disponibile: ${rel}`);
  const cache = new URL(`.cache/dati/${rel}`, RADICE);
  const valida = () => existsSync(cache) && sha(cache) === voce.sha256;
  if (!valida()) {
    const r = await fetch(voce.url);
    if (!r.ok) throw new Error(`${voce.url}: HTTP ${r.status}`);
    mkdirSync(new URL('.', cache), { recursive: true });
    writeFileSync(cache, Buffer.from(await r.arrayBuffer()));
    if (!valida()) throw new Error(`contenuto remoto diverso dal catalogo: ${rel}`);
  }
  return JSON.parse(readFileSync(cache, 'utf8'));
}
