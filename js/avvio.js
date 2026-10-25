// Punto d'ingresso: prima i dizionari, poi l'app. Così t() è già pronta quando i moduli di app.js
// (con costanti che chiamano t() a livello di modulo) vengono valutati.
import { caricaDizionari, applicaDom, creaInterruttoreLingua } from './core/i18n.js';
import { avviaImpostazioni } from './core/impostazioni-mobile.js';

await caricaDizionari();
applicaDom(document);
document.getElementById('switch-tema').after(creaInterruttoreLingua(document));
avviaImpostazioni(); // telefono: tema, lingua e condividi dietro l'ingranaggio
await import('./app.js');
