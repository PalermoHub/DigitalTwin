// Pagina Digital Twin (digitaltwin.html): lo stesso contenuto del tab «Digital Twin» del modale Info, a fasce come la home.
import { caricaDizionari, applicaDom } from './core/i18n.js';
import { avviaTestata } from './core/testata-pagina.js';
import { traduciAlbero } from './core/pagina-info.js';
import { impaginaFasce } from './core/fasce-pagina.js';
import { collegaIngrandimento } from './core/ingrandisci.js';
import { schedaDigitalTwin } from './core/scheda-digitaltwin.js';

await caricaDizionari();
applicaDom(document);
await avviaTestata();

const corpo = document.getElementById('corpo');
impaginaFasce(schedaDigitalTwin(), corpo, { indice: true });
traduciAlbero(corpo); // il testo è scritto in italiano: in inglese si traduce con le voci lbl.* dei dizionari
collegaIngrandimento(corpo);
