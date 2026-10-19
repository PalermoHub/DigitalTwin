// Entry per le pagine statiche (presentazione.html): dizionari, traduzione del DOM, testata con menu del sito.
import { caricaDizionari, applicaDom } from './core/i18n.js';
import { avviaTestata } from './core/testata-pagina.js';

await caricaDizionari();
applicaDom(document);
await avviaTestata();
