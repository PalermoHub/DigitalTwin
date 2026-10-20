import { normalizza } from './indirizzi.js';
import { t, tl, localeIntl } from './i18n.js';
import { leggiFiltro, descriviImporto } from './filtri-parole.js';

// Azioni di Talia che non vengono dalla guida: rispondono con i dati dell'app (luoghi già caricati per la ricerca e classifica della popolazione).
// Le frasi valgono in italiano e in inglese.
//   «cosa vedo ora?»          → i layer accesi, con un pulsante per spegnerli
//   «la colonnina più vicina» → i 3 punti più vicini alla posizione di chi scrive
//   «PNRR sopra 1 milione», «incidenti mortali 2022» → applica il filtro alla mappa, con un pulsante per toglierlo
//   «quante fontanelle ci sono?» → il totale nei dati
//   «quartiere più popoloso», «abitanti della Zisa» → classifica dei residenti
// Le frasi si riconoscono su testo normalizzato (maiuscolo, senza accenti); chi non le riconosce passa alla ricerca nella guida.

// categoria → strati dei luoghi (vedi FONTI in luoghi.js) e chiavi per riconoscerla
const CATEGORIE = [
  { id: 'colonnine', strati: ['colonnine'], parole: /\b(COLONNIN\w*|RICARICA|CHARGING|CHARGERS?)\b/ },
  { id: 'distributori', strati: ['distributori'], parole: /\b(DISTRIBUTOR\w*|BENZINAI\w*|CARBURANT\w*|FUEL|PETROL|GAS STATIONS?)\b/ },
  { id: 'fermate', strati: ['trasporto-fermate'], parole: /\b(FERMAT\w*|STOPS?)\b/ },
  { id: 'fontanelle', strati: ['fontanelle'], parole: /\b(FONTANELL\w*|FOUNTAINS?)\b/ },
  { id: 'scuole', strati: ['scuole'], parole: /\b(SCUOL\w*|ASIL\w*|SCHOOLS?|NURSER(Y|IES))\b/ },
  { id: 'uffici', strati: ['uffici'], parole: /\b(UFFICI\w*|OFFICES?)\b/ },
  { id: 'monumenti', strati: ['monumenti'], parole: /\b(MONUMENT\w*)\b/ },
  { id: 'alberi', strati: ['alberi'], parole: /\b(ALBER\w*|TREES?)\b/ },
  { id: 'seggi', strati: ['seggi'], parole: /\b(SEGGI\w*|SEDI ELETTORAL\w*|POLLING)\b/ },
];

const VICINO = /\b(PIU VICIN\w*|VICIN\w* A ME|QUI VICINO|QUI INTORNO|INTORNO A ME|ATTORNO A ME|DA QUI|CLOSEST|NEAREST|NEAR ME|NEARBY|AROUND ME|CLOSE TO ME|NEAR HERE)\b/;
const ATTIVI = /\b(COSA VEDO|LAYER ACCESI|STRATI ACCESI|LAYER ATTIVI|STRATI ATTIVI|COSA E ACCESO|COSA HO ACCESO|COSA STO VEDENDO|WHAT AM I LOOKING AT|WHAT CAN I SEE|WHICH LAYERS ARE (ON|ACTIVE)|ACTIVE LAYERS|LAYERS ARE (ON|ACTIVE))\b/;
const CONTEGGIO = /\b(QUANT[EIO]\b|HOW MANY\b)/;
const POPOLOSO = /\b(PIU POPOLOS\w*|MOST POPULOUS|LARGEST POPULATION|PIU ABITAT\w*|PIU GRAND\w* PER (ABITANTI|RESIDENTI))\b/;
const ABITANTI = /\b(ABITANTI|RESIDENTI|POPOLAZIONE|RESIDENTS|INHABITANTS|POPULATION)\b/;
const LIVELLI = [['quartieri', /QUARTIER|DISTRICT/], ['upl', /UPL/], ['circoscrizioni', /CIRCOSCRIZION/]];

export function riconosci(testo) {
  const q = normalizza(testo);
  if (ATTIVI.test(q)) return { tipo: 'attivi' };
  const filtro = leggiFiltro(testo);
  if (filtro) return { tipo: 'filtro', filtro };
  const cat = CATEGORIE.find(c => c.parole.test(q));
  if (cat && VICINO.test(q)) return { tipo: 'vicino', categoria: cat };
  if (cat && CONTEGGIO.test(q)) return { tipo: 'conteggio', categoria: cat, q };
  if (POPOLOSO.test(q)) return { tipo: 'popolosi', livello: (LIVELLI.find(([, p]) => p.test(q)) ?? LIVELLI[0])[0] };
  if (ABITANTI.test(q)) return { tipo: 'abitanti', q };
  return null;
}

const CHIAVE_FILTRO = { pnrr: 'Pnrr', opere: 'Opere', incidenti: 'Incidenti' };
const GRAVITA_NOME = { M: 'mortali', R: 'con prognosi riservata', F: 'con feriti', C: 'solo danni a cose' }; // i18n-ok: chiavi di tl(), le stesse dei chip dei chip degli incidenti (layers/sicurezza-filtro.js)
const nomeCategoria = c => t(`chatbot.cat.${c.id}`);
const numero = n => Math.round(n).toLocaleString(localeIntl());

// distanza in metri (haversine)
export function distanza(a, b) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const formatoDistanza = m => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toLocaleString(localeIntl(), { maximumFractionDigits: 1 })} km`);

// nomi di zona (con i loro residenti) citati nel testo; vince il nome più lungo
function zonaCitata(classifica, anno, q) {
  let migliore = null;
  for (const [livello] of LIVELLI) {
    for (const [nome, residenti] of classifica[anno]?.[livello] ?? []) {
      const varianti = [normalizza(nome), ...nome.split(/\s*[-–]\s*/).map(normalizza).filter(v => v.length >= 4)];
      for (const v of varianti) {
        if (q.includes(v) && (!migliore || v.length > migliore.lunghezza)) migliore = { nome: nome.replace(/\s+/g, ' ').trim(), residenti, livello, lunghezza: v.length };
      }
    }
  }
  return migliore;
}

// `filtra(filtro)`: applica il filtro alla mappa e dà la funzione che lo toglie;
// `voci()`: luoghi preparati (preparaLuoghi); `classifica()`: dati/popolazione/classifica.json; `posizione()`: { lat, lon } o rifiuta; `attivi()`: [{ id, nome }]
export function creaAzioni({ voci, classifica, posizione, attivi, filtra = () => null }) {
  const ultimoAnno = c => Object.keys(c).sort().at(-1);

  return async function azione(testo) {
    const a = riconosci(testo);
    if (!a) return null;

    if (a.tipo === 'attivi') {
      const elenco = attivi();
      return elenco.length ? { testo: t('chatbot.azione.attivi', { n: elenco.length }), strati: elenco.map(x => x.id) } : { testo: t('chatbot.azione.nessunAttivo') };
    }

    if (a.tipo === 'filtro') {
      const f = a.filtro;
      const testoFiltro = f.strato === 'incidenti'
        ? [f.anno && t('chatbot.azione.filtroAnno', { anno: f.anno }), f.gravita && tl(GRAVITA_NOME[f.gravita])].filter(Boolean).join(', ')
        : descriviImporto(f);
      const annulla = filtra(f);
      if (!annulla) return null;
      return { testo: t(`chatbot.azione.filtro${CHIAVE_FILTRO[f.strato]}`, { testo: testoFiltro }), annulla };
    }

    if (a.tipo === 'vicino') {
      let qui;
      try { qui = await posizione(); } catch { return { testo: t('chatbot.azione.posizioneNd') }; }
      const vicini = (await voci()).filter(v => a.categoria.strati.includes(v.strato))
        .map(v => ({ v, m: distanza(qui, v) })).sort((x, y) => x.m - y.m).slice(0, 3);
      if (!vicini.length) return { testo: t('chatbot.azione.nessunDato', { nome: nomeCategoria(a.categoria) }) };
      return {
        testo: t('chatbot.azione.vicini', { nome: nomeCategoria(a.categoria) }),
        oggetti: vicini.map(({ v, m }) => ({ etichetta: v.etichetta, nota: [formatoDistanza(m), v.nota].filter(Boolean).join(' · '), strato: v.strato, zoom: v.zoom, lon: v.lon, lat: v.lat })),
      };
    }

    if (a.tipo === 'conteggio') {
      // «quante scuole alla Zisa?»: il conteggio per zona non c'è, meglio lasciare la domanda alla guida che dare il totale della città
      const c = await classifica().catch(() => null);
      if (c && zonaCitata(c, ultimoAnno(c), a.q)) return null;
      const n = (await voci()).filter(v => a.categoria.strati.includes(v.strato)).length;
      return n ? { testo: t('chatbot.azione.conteggio', { n: numero(n), nome: nomeCategoria(a.categoria) }) } : null;
    }

    const c = await classifica().catch(() => null);
    if (!c) return null;
    const anno = ultimoAnno(c);
    if (a.tipo === 'popolosi') {
      const primi = (c[anno]?.[a.livello] ?? []).slice(0, 3);
      if (!primi.length) return null;
      return { testo: t('chatbot.azione.popolosi', { livello: t(`chatbot.livello.${a.livello}`), anno, elenco: primi.map(([nome, n]) => `${nome.replace(/\s+/g, ' ').trim()} (${numero(n)})`).join(', ') }) };
    }
    const z = zonaCitata(c, anno, a.q);
    return z ? { testo: t('chatbot.azione.abitanti', { nome: z.nome, livello: t(`chatbot.livello.${z.livello}`), n: numero(z.residenti), anno }) } : null;
  };
}

// posizione di chi usa l'app, dal browser (rifiuta se negata o non disponibile)
export function posizioneBrowser(nav = globalThis.navigator) {
  return new Promise((ok, no) => {
    if (!nav?.geolocation) return no(new Error('geolocation'));
    nav.geolocation.getCurrentPosition(p => ok({ lat: p.coords.latitude, lon: p.coords.longitude }), no, { timeout: 8000, maximumAge: 60000 });
  });
}

// layer accesi della barra degli strati
export function stratiAccesi(doc) {
  return [...doc.querySelectorAll('input[id^="strato-"]:checked')].map(c => {
    const et = c.closest('label');
    return { id: c.id.slice('strato-'.length), nome: ((et?.innerText ?? et?.textContent) ?? c.id).trim().replace(/\s+/g, ' ') };
  });
}
