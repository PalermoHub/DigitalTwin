// Pagina Plugin RNDT (plugin.html): lo stesso contenuto del tab «Plugin RNDT» del modale Info, a fasce come la home.
import { caricaDizionari, applicaDom } from './core/i18n.js';
import { avviaTestata } from './core/testata-pagina.js';
import { traduciAlbero } from './core/pagina-info.js';
import { impaginaFasce } from './core/fasce-pagina.js';
import { collegaIngrandimento } from './core/ingrandisci.js';
import { schedaPluginCompleta } from './core/scheda-plugin.js';

await caricaDizionari();
applicaDom(document);
await avviaTestata();

const corpo = document.getElementById('corpo');
impaginaFasce(schedaPluginCompleta(), corpo, { indice: true, etichette: true });
traduciAlbero(corpo); // il testo è scritto in italiano: in inglese si traduce con le voci lbl.* dei dizionari
collegaIngrandimento(corpo);
