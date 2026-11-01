// Legende dei layer accesi per il poster (PNG, JPG, PDF). Le legende dell'app sono DOM, costruite da ogni modulo; il poster è un canvas:
// qui si leggono in dati semplici ({ titolo, voci: [{ testo, simbolo }] }) e si dispongono in colonne. Lettura e impaginazione
// sono separate: la seconda è pura e si prova senza browser.
import { t as tr } from './i18n.js';

const RIGHE_MAX = 14; // oltre, il blocco finisce con «… e altre N voci»
const RIGA = 1.75; // altezza di una voce, in corpi di testo
const TESTATA = 2.6; // altezza del titolo del blocco, in corpi di testo
const RESPIRO = 0.9; // distanza tra due blocchi, in corpi di testo
const SCARTATE = '[hidden], .legenda-sostituita, .legenda-vuota'; // come il foglio di stampa: restano le sole legende dei layer accesi
const RIGHE = 'label, li, div, p, tr';
const TITOLI = 'strong, h3, h4, legend';

const pulisci = testo => (testo ?? '').replace(/\s+/g, ' ').trim();

// Taglia le righe di un blocco al massimo e aggiunge la voce riassuntiva
export function limitaVoci(voci, massimo = RIGHE_MAX) {
  if (voci.length <= massimo) return voci;
  return [...voci.slice(0, massimo - 1), { testo: tr('stampa.legenda.altre', { n: voci.length - massimo + 1 }), simbolo: null, nota: true }];
}

// Altezza di un blocco in corpi di testo
export const altezzaBlocco = blocco => TESTATA + blocco.voci.length * RIGA + 0.5;

// Dispone i blocchi in colonne alte al più `altezzaMax` (corpi di testo): un blocco intero sta in una colonna; le colonne sono al più
// `colonneMax`. I blocchi che non entrano si contano in `omessi`. Mai un blocco più alto della colonna: si accorcia.
export function colonneLegende(blocchi, altezzaMax, colonneMax) {
  const colonne = [[]];
  let usata = 0;
  let omessi = 0;
  for (const originale of blocchi) {
    let blocco = originale;
    const piena = altezzaBlocco(blocco);
    if (piena > altezzaMax) { // troppo alto da solo: si tengono le voci che entrano
      const voci = Math.max(1, Math.floor((altezzaMax - TESTATA - 0.5) / RIGA));
      blocco = { ...blocco, voci: limitaVoci(blocco.voci, voci) };
    }
    const h = altezzaBlocco(blocco) + (colonne.at(-1).length ? RESPIRO : 0);
    if (usata + h > altezzaMax && colonne.at(-1).length) {
      if (colonne.length >= colonneMax) { omessi++; continue; }
      colonne.push([]);
      usata = 0;
    }
    usata += altezzaBlocco(blocco) + (colonne.at(-1).length ? RESPIRO : 0);
    colonne.at(-1).push(blocco);
  }
  return { colonne: colonne.filter(c => c.length), omessi };
}

// Dentro la legenda `radice`, un nodo è escluso se lui o un suo avo (fino alla radice) è nascosto. Non si guarda il layout:
// le legende lunghe stanno in un <details> chiuso e le loro righe sembrerebbero invisibili.
function scartato(nodo, radice) {
  for (let n = nodo; n; n = n.parentElement) {
    if (n.matches?.(SCARTATE)) return true;
    if (n === radice) return false;
  }
  return false;
}

const trasparente = c => !c || c === 'transparent' || /rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0\s*\)/.test(c);

function immagineDa(url) {
  return new Promise(risolvi => { const i = new Image(); i.onload = () => risolvi(i); i.onerror = () => risolvi(null); i.src = url; });
}

// Il simbolo di una riga: quadratino/pallino colorato (<i>), sfumatura, <svg> o <img> dello stesso sito. Altro: nessun simbolo (solo testo).
async function simboloDi(riga) {
  const stile = n => getComputedStyle(n);
  const i = riga.querySelector('i');
  if (i) {
    const st = stile(i);
    const tondo = parseFloat(st.borderTopLeftRadius) >= Math.min(parseFloat(st.width) || 99, parseFloat(st.height) || 99) / 2 - 0.5 && parseFloat(st.borderTopLeftRadius) > 0;
    const sfumatura = st.backgroundImage.match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}\b/gi);
    if (st.backgroundImage.includes('gradient') && sfumatura?.length > 1) return { tipo: 'sfumatura', colori: sfumatura };
    if (!trasparente(st.backgroundColor)) return { tipo: 'colore', colore: st.backgroundColor, tondo, bordo: trasparente(st.borderTopColor) || parseFloat(st.borderTopWidth) === 0 ? null : st.borderTopColor };
    if (parseFloat(st.borderTopWidth) > 0 && !trasparente(st.borderTopColor)) return { tipo: 'colore', colore: 'rgba(255,255,255,0)', tondo, bordo: st.borderTopColor };
  }
  const svg = riga.querySelector('svg');
  if (svg) {
    const copia = svg.cloneNode(true);
    copia.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    if (!copia.getAttribute('width')) copia.setAttribute('width', '16');
    if (!copia.getAttribute('height')) copia.setAttribute('height', '16');
    const img = await immagineDa(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(copia))}`);
    if (img) return { tipo: 'immagine', img };
  }
  const foto = riga.querySelector('img');
  if (foto) { // un'immagine di un altro sito sporcherebbe il canvas e bloccherebbe l'esportazione: solo quelle dello stesso sito
    try {
      if (new URL(foto.currentSrc || foto.src, location.href).origin === location.origin && foto.complete && foto.naturalWidth) return { tipo: 'immagine', img: foto };
    } catch { /* url non valido: nessun simbolo */ }
  }
  return null;
}

// Legge le legende accese dalla pagina `doc`: una voce per ogni blocco `.legenda` (sulla mappa o spostata sotto lo strato nel pannello)
export async function leggiLegende(doc) {
  const radici = [...doc.querySelectorAll('#legende .legenda, .legenda-in-pannello .legenda')].filter((n, k, tutti) => tutti.indexOf(n) === k);
  const blocchi = [];
  for (const radice of radici) {
    if (radice.closest(SCARTATE.replace('[hidden], ', '')) || scartato(radice, radice)) continue;
    if (radice.parentElement?.closest('.legenda') && radici.includes(radice.parentElement.closest('.legenda'))) continue; // già dentro un altro blocco
    const voci = [];
    let titolo = '';
    for (const nodo of radice.querySelectorAll(`${TITOLI}, ${RIGHE}`)) {
      if (scartato(nodo, radice)) continue;
      if (nodo.matches(TITOLI)) {
        const testo = pulisci(nodo.textContent);
        if (testo && !titolo && !voci.length) titolo = testo;
        else if (testo && (!nodo.parentElement.matches(RIGHE) || pulisci(nodo.parentElement.textContent) === testo)) voci.push({ testo, simbolo: null, nota: true });
        continue;
      }
      if (nodo.querySelector(`${RIGHE}, ${TITOLI}`)) continue; // contenitore: contano le righe che contiene
      const casella = nodo.querySelector('input[type="checkbox"]');
      if (casella && !casella.checked) continue; // categoria spenta: in mappa non c'è
      const testo = pulisci(nodo.textContent);
      if (!testo) continue;
      voci.push({ testo, simbolo: await simboloDi(nodo) });
    }
    if (voci.length || titolo) blocchi.push({ titolo: titolo || tr('stampa.legenda'), voci: limitaVoci(voci) });
  }
  return blocchi.filter(b => b.voci.length);
}

export { RIGA, TESTATA, RESPIRO };
