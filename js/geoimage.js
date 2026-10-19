// Pagina Guida Geoimage (geoimage.html): lo stesso contenuto del tab «Guida Geoimage» del modale Info, a fasce come la home.
import { caricaDizionari, applicaDom } from './core/i18n.js';
import { avviaTestata } from './core/testata-pagina.js';
import { traduciAlbero } from './core/pagina-info.js';
import { impaginaFasce } from './core/fasce-pagina.js';
import { collegaIngrandimento } from './core/ingrandisci.js';
import { schedaGeoimage } from './geoimage/guida.js';

await caricaDizionari();
applicaDom(document);
await avviaTestata();

const corpo = document.getElementById('corpo');
// il contenuto viene con il proprio indice laterale (quello del modale): qui lo rifà impaginaFasce
const nodi = [...schedaGeoimage().children].filter(n => n.className !== 'guida-indice');
impaginaFasce(nodi, corpo, { indice: true });
traduciAlbero(corpo); // il testo è scritto in italiano: in inglese si traduce con le voci lbl.* dei dizionari
collegaIngrandimento(corpo);
