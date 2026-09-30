import { unisci, testoContesto } from './scheda-modello.js';

const R = 4; // tolleranza in pixel attorno al clic

function el(tag, classe, testo) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (testo != null) e.textContent = testo;
  return e;
}

// Icona Font Awesome (stessa libreria dell'app originale): decorativa, nascosta ai lettori di schermo
function icona(nome) {
  const i = el('i', `fas ${nome} scheda-icona`);
  i.setAttribute('aria-hidden', 'true');
  return i;
}

function disegnaRiga(r) {
  const riga = el('div', 'scheda-riga');
  riga.append(el('span', 'scheda-et', r.etichetta));
  if (r.classe) {
    const badge = el('span', `scheda-val scheda-badge scheda-badge--c${r.classe}`);
    badge.title = `Classe ${r.classe} su 5 (1 = migliore)`;
    badge.append(el('span', 'scheda-badge-num', String(r.classe)), ` ${r.valore}`);
    riga.append(badge);
  } else {
    riga.append(el('span', 'scheda-val', r.valore));
  }
  return riga;
}

function disegnaGruppo(g) {
  const box = el('div', 'scheda-gruppo');
  if (g.titolo) box.append(el('h4', null, g.titolo));
  for (const r of g.righe) box.append(disegnaRiga(r));
  if (g.griglia?.length) {
    const griglia = el('div', 'scheda-griglia');
    for (const c of g.griglia) {
      const cella = el('div', 'scheda-cella');
      cella.append(el('div', 'scheda-cella-val', c.valore), el('div', 'scheda-cella-chiave', c.chiave));
      griglia.append(cella);
    }
    box.append(griglia);
  }
  return box;
}

function disegnaAccordion(a) {
  const radice = el('details', 'scheda-acc');
  const riassunto = el('summary');
  if (a.icona) riassunto.append(icona(a.icona));
  riassunto.append(a.riassunto);
  radice.append(riassunto);
  if (a.suggerimento) radice.append(el('p', 'scheda-suggerimento', a.suggerimento));
  for (const e of a.elementi) {
    const tipo = el('details', 'scheda-tipo');
    const sommario = el('summary');
    sommario.append(el('span', 'scheda-tipo-nome', e.titolo));
    if (e.stato) sommario.append(el('em', 'scheda-tipo-stato', e.stato));
    if (e.anteprima) sommario.append(el('span', 'scheda-tipo-anteprima', e.anteprima));
    tipo.append(sommario);
    for (const r of e.righe) tipo.append(disegnaRiga(r));
    radice.append(tipo);
  }
  return radice;
}

function disegnaLink(l) {
  const a = el('a', 'scheda-link');
  a.href = l.url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  if (l.suggerimento) a.title = l.suggerimento;
  const testo = el('span');
  if (l.icona) testo.append(icona(l.icona));
  testo.append(l.testo);
  a.append(testo);
  if (l.etichetta) a.append(el('span', 'scheda-link-et', l.etichetta));
  return a;
}

function disegnaSezione(s) {
  const titolo = el('h3');
  if (s.icona) titolo.append(icona(s.icona));
  titolo.append(s.titolo);
  if (s.badge) titolo.append(' ', el('span', 'scheda-tag', s.badge));
  const corpo = [...s.gruppi.map(disegnaGruppo)];
  if (s.accordion) corpo.push(disegnaAccordion(s.accordion));
  if (s.link) corpo.push(disegnaLink(s.link));
  if (s.nota) corpo.push(el('p', 'scheda-nota', s.nota));
  if (s.fonte) corpo.push(el('p', 'scheda-nota scheda-fonte', s.fonte));

  let sezione;
  if (s.collassabile) {
    sezione = el('details', 'scheda-sez');
    sezione.open = true;
    const sommario = el('summary');
    sommario.append(titolo);
    sezione.append(sommario, ...corpo);
  } else {
    sezione = el('section', 'scheda-sez');
    sezione.append(titolo, ...corpo);
  }
  sezione.dataset.chiave = s.chiave;
  sezione.dataset.titolo = s.titolo;
  return sezione;
}

function mostra(contenitore, lngLat, { contesto, sezioni }) {
  const titolo = el('h2', null, 'Scheda del luogo');
  const coordinate = el('p', 'scheda-coordinate', `${lngLat.lat.toFixed(5)}° N, ${lngLat.lng.toFixed(5)}° E`);
  const chiudi = el('button', 'scheda-chiudi', 'Chiudi');
  chiudi.type = 'button';
  chiudi.addEventListener('click', () => { contenitore.hidden = true; });

  const parti = [titolo, coordinate];
  const testo = testoContesto(contesto);
  if (testo) parti.push(el('p', 'scheda-contesto', testo));
  if (!sezioni.length) parti.push(el('p', null, 'Nessun dato in questo punto.'));
  parti.push(...sezioni.map(disegnaSezione), chiudi);
  contenitore.replaceChildren(...parti);
  contenitore.hidden = false;
}

// Prima il punto esatto; per i layer senza risultato, un riquadro di ±R pixel.
function trovaFeature(map, punto, layers) {
  let trovati = map.queryRenderedFeatures(punto, { layers });
  const mancanti = layers.filter(id => !trovati.some(f => f.layer.id === id));
  if (mancanti.length) {
    const riquadro = [[punto.x - R, punto.y - R], [punto.x + R, punto.y + R]];
    trovati = trovati.concat(map.queryRenderedFeatures(riquadro, { layers: mancanti }));
  }
  return trovati;
}

export function collegaScheda(map, moduli, contenitore) {
  const conScheda = moduli.filter(m => m.scheda);
  map.on('click', e => {
    const voci = [];
    for (const m of conScheda) {
      const layers = m.scheda.layers.filter(id => map.getLayer(id));
      if (!layers.length) continue;
      voci.push(...m.scheda.voci(trovaFeature(map, e.point, layers), e.lngLat));
    }
    mostra(contenitore, e.lngLat, unisci(voci));
  });
}
