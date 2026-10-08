// Entry per le pagine statiche (presentazione.html): dizionari, traduzione del DOM, switch di lingua nella testata.
import { caricaDizionari, applicaDom, creaInterruttoreLingua } from './core/i18n.js';

await caricaDizionari();
applicaDom(document);
document.querySelector('.testata .contenitore')?.append(creaInterruttoreLingua(document));
