// Pagina Fonti e note (fonti.html): lo stesso contenuto del tab «Fonti e note» del modale Info, a fasce come la home.
import { caricaDizionari, applicaDom, t as tr } from './core/i18n.js';
import { avviaTestata } from './core/testata-pagina.js';
import { traduciAlbero } from './core/pagina-info.js';
import { impaginaFasce } from './core/fasce-pagina.js';
import { schedaFonti, caricaCatalogo } from './core/scheda-fonti.js';

await caricaDizionari();
applicaDom(document);
await avviaTestata();

const corpo = document.getElementById('corpo');
try {
  impaginaFasce(schedaFonti(await caricaCatalogo()), corpo);
} catch {
  corpo.textContent = tr('app.fonti.errore');
}
traduciAlbero(corpo); // il testo è scritto in italiano: in inglese si traduce con le voci lbl.* dei dizionari
