// Pagina Privacy (privacy.html): lo stesso contenuto del tab «Privacy» del modale Info, a fasce come la home.
import { caricaDizionari, applicaDom } from './core/i18n.js';
import { avviaTestata } from './core/testata-pagina.js';
import { traduciAlbero } from './core/pagina-info.js';
import { impaginaFasce } from './core/fasce-pagina.js';
import { schedaPrivacy } from './core/scheda-privacy.js';

await caricaDizionari();
applicaDom(document);
await avviaTestata();

const corpo = document.getElementById('corpo');
impaginaFasce(schedaPrivacy(), corpo);
traduciAlbero(corpo); // il testo è scritto in italiano: in inglese si traduce con le voci lbl.* dei dizionari
