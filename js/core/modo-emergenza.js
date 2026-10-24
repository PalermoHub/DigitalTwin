// «Modalità emergenza» su telefono: con il Piano di emergenza acceso (da solo o con il percorso «Aree di emergenza») l'interfaccia
// si riduce all'essenziale: barra in basso con soli Mappa, Home, GPS, Condividi, Talia ed Esci, un clic sulla mappa apre solo la scheda dell'area. «Esci» è l'ultimo tab della barra.
// Il resto lo fa il CSS con body.modo-emergenza. Spento e riacceso lo strato, la modalità riparte; «Esci» vale finché lo strato resta acceso.
import { t } from './i18n.js';

export const STRATO_EMERGENZA = 'protezione-civile';
export const CLASSE_EMERGENZA = 'modo-emergenza';
export const MEDIA_TELEFONO = '(max-width: 720px)';

// La modalità vale solo su telefono, a strato acceso e se non è stata chiusa a mano.
export const modoAttivo = ({ telefono, stratoAcceso, uscito }) => Boolean(telefono && stratoAcceso && !uscito);

// Moduli da interrogare al clic: in modalità emergenza solo quello dell'area.
export const moduliAlClic = (moduli, emergenza) => (emergenza ? moduli.filter(m => m.id === STRATO_EMERGENZA) : moduli);

export const inModoEmergenza = (doc = document) => doc.body.classList.contains(CLASSE_EMERGENZA);

// `barraTab` = la barra a tab del telefono; `icone` = gli svg dei tab Home, GPS, Condividi, Talia ed Esci; `suHome` riporta la mappa allo zoom di base, `suGps`, `suCondividi` e `suTalia` aprono posizione, condivisione e chat; `suAttiva` chiude i fogli aperti.
export function collegaModoEmergenza(doc, { barraTab, icone, suHome = () => {}, suGps = () => {}, suCondividi = () => {}, suTalia = () => {}, suAttiva = () => {} }) {
  const finestra = doc.defaultView;
  const telefono = finestra?.matchMedia?.(MEDIA_TELEFONO);
  let uscito = false;

  // tab che si vedono solo in modalità emergenza (il CSS li nasconde altrimenti)
  const tab = (id, icona, testo, suClic) => {
    const b = doc.createElement('button');
    b.type = 'button';
    b.dataset.tab = id;
    b.innerHTML = `${icona}<span>${testo}</span>`;
    b.addEventListener('click', suClic);
    barraTab.append(b);
  };
  tab('home', icone.home, t('emergenza.home'), () => suHome());
  tab('gps', icone.gps, t('emergenza.gps'), () => suGps());
  tab('condividi', icone.condividi, t('emergenza.condividi'), () => suCondividi());
  tab('talia', icone.talia, t('app.rail.chatbot'), () => suTalia());
  tab('esci', icone.esci, t('emergenza.esci'), () => { uscito = true; aggiorna(); });

  function aggiorna() {
    const strato = doc.getElementById(`strato-${STRATO_EMERGENZA}`);
    if (!strato?.checked) uscito = false;
    const ora = modoAttivo({ telefono: Boolean(telefono?.matches), stratoAcceso: Boolean(strato?.checked), uscito });
    doc.body.classList.toggle(CLASSE_EMERGENZA, ora);
    if (ora) { suAttiva(); setTimeout(suAttiva, 0); } // anche a fine gestori: un link o l'app stessa possono riaprire il foglio
  }

  doc.addEventListener('change', e => { if (e.target?.id === `strato-${STRATO_EMERGENZA}`) aggiorna(); });
  telefono?.addEventListener('change', aggiorna);
  return { aggiorna };
}
