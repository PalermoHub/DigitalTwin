// Legende dei layer RNDT e «miei layer» in #legende: un blocco per layer acceso, creato al primo bisogno.
// WMS e ArcGIS scaricano l'immagine (o le classi) dal servizio, passando dall'host (proxy e credenziali); i dati vettoriali dell'utente
// mostrano il colore con cui sono disegnati. Se il servizio non risponde, il blocco lo dice e non si riprova a ogni clic.
import { t } from '../core/i18n.js';
import { richiesteLegendaWms, richiestaLegendaArcgis, vociLegendaArcgis, tipoImmagine, tipoLegenda, origineLayer } from './legenda.js';

const el = (tag, classe, testo) => {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
};

const immagine = (src, alt) => Object.assign(el('img', 'legenda-esterna-img'), { src, alt, loading: 'lazy' });
const nonDisponibile = corpo => corpo.replaceChildren(el('p', 'nota-omi', t('legenda.esterna.nonDisponibile')));

async function caricaWms(host, layer, corpo) {
  let almeno = false;
  const pezzi = [];
  for (const { nome, url } of richiesteLegendaWms(layer.sorgente)) {
    try {
      const buffer = await host.fetchArrayBuffer(url);
      const tipo = tipoImmagine(buffer);
      if (!tipo) continue;
      almeno = true;
      const pezzo = el('div', 'legenda-esterna-voce');
      if (layer.sorgente.layers.includes(',')) pezzo.append(el('small', null, nome));
      pezzo.append(immagine(URL.createObjectURL(new Blob([buffer], { type: tipo })), nome));
      pezzi.push(pezzo);
    } catch { /* un layer senza legenda non blocca gli altri */ }
  }
  if (almeno) corpo.replaceChildren(...pezzi); else nonDisponibile(corpo);
}

async function caricaArcgis(host, layer, corpo) {
  const { url, idLayer } = richiestaLegendaArcgis(layer.sorgente.url);
  const voci = vociLegendaArcgis(JSON.parse(new TextDecoder().decode(await host.fetchArrayBuffer(url))), idLayer);
  if (!voci.length) return nonDisponibile(corpo);
  const righe = [];
  let gruppo;
  for (const v of voci) {
    if (idLayer == null && v.gruppo !== gruppo) { gruppo = v.gruppo; righe.push(el('strong', 'legenda-esterna-gruppo', gruppo)); }
    const riga = el('div', 'legenda-esterna-classe');
    riga.append(immagine(v.src, v.etichetta), el('span', null, v.etichetta));
    righe.push(riga);
  }
  corpo.replaceChildren(...righe);
}

function riempi(host, layer, corpo) {
  const tipo = tipoLegenda(layer);
  if (tipo === 'vettoriale') {
    const riga = el('div', 'legenda-esterna-classe');
    const i = el('i');
    i.style.background = layer.colore;
    riga.append(i, el('span', null, t('legenda.esterna.vettoriale')));
    return corpo.replaceChildren(riga);
  }
  corpo.replaceChildren(el('p', 'nota-omi', t('legenda.esterna.caricamento')));
  (tipo === 'wms' ? caricaWms : caricaArcgis)(host, layer, corpo).catch(() => nonDisponibile(corpo));
}

export function collegaLegendeEsterne(hosts, contenitore) {
  const blocchi = new Map(); // `${indice host}:${id layer}` -> elemento
  function disegna() {
    const vivi = new Set();
    hosts.forEach((host, n) => {
      for (const layer of host.elenco()) {
        if (!tipoLegenda(layer)) continue;
        const chiave = `${n}:${layer.id}`;
        vivi.add(chiave);
        let blocco = blocchi.get(chiave);
        if (!blocco) {
          blocco = el('div', 'legenda legenda-esterna');
          const corpo = el('div', 'legenda-esterna-corpo');
          const { servizio, server } = origineLayer(layer);
          // servizio e server usati: «WMS · www.example.it», o «File caricato» per i dati dal computer
          const origine = el('small', 'legenda-esterna-origine', servizio ? `${servizio} · ${server}` : t('legenda.esterna.file'));
          blocco.append(el('strong', null, layer.nome), origine, corpo);
          blocco._corpo = corpo;
          blocchi.set(chiave, blocco);
          contenitore.append(blocco);
        }
        blocco.hidden = !layer.visibile || layer.indisponibile;
        if (!blocco.hidden && !blocco._caricata) { blocco._caricata = true; riempi(host, layer, blocco._corpo); }
      }
    });
    for (const [chiave, blocco] of blocchi) if (!vivi.has(chiave)) { blocco.remove(); blocchi.delete(chiave); }
  }
  hosts.forEach(h => h.suCambio(disegna));
  disegna();
}
