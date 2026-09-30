#!/usr/bin/env node
// Estrae l'espressione `omiColorMatch` (da zone_omi.sld) dall'app originale e la scrive
// in js/layers/stile-omi.js, così i colori non vengono ricopiati a mano.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SORGENTE = '/mnt/d/GitHub - Clone/SiciliaHub/palermohub/pmtiles/js/catasto_script.js';
const DESTINAZIONE = new URL('../js/layers/stile-omi.js', import.meta.url);

export function estrai(testo) {
  const inizio = testo.indexOf('const omiColorMatch = [');
  if (inizio < 0) throw new Error('omiColorMatch non trovato');
  const da = testo.indexOf('[', inizio);
  const fine = testo.indexOf('];', da);
  const blocco = testo.slice(da, fine + 1).replace(/\/\/.*$/gm, '');
  return JSON.parse(blocco.replace(/,\s*]/g, ']'));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const espressione = estrai(readFileSync(SORGENTE, 'utf8'));
  writeFileSync(DESTINAZIONE,
    `// GENERATO da scripts/estrai_stile_omi.mjs a partire da\n// ${SORGENTE}\n// (colori di zone_omi.sld per campo Zona_OMI). Non modificare a mano.\n` +
    `export const STILE_OMI = ${JSON.stringify(espressione)};\n`);
  console.log(`${(espressione.length - 3) / 2} zone scritte in js/layers/stile-omi.js`);
}
