// Voce «Terreno» della scheda, dal punto della griglia DTM più vicino. Gruppi, etichette e formati
// sono quelli della scheda di palermo_popolazione (js/punto.js, renderPuntoPanel).

const ha = v => v != null && v !== '' && Number.isFinite(Number(v));
const fmt = (v, decimali, unita = '') => (ha(v) ? `${Number(v).toFixed(decimali)}${unita}` : '—');
const testo = v => (v != null && v !== '' ? String(v) : '—');

// Classi 1 (migliore) → 5 (peggiore) dai campi numerici `stabilita`, `costruibilita` (0 = non disponibile)
const classe = codice => {
  const c = Number(codice);
  return Number.isInteger(c) && c >= 1 && c <= 5 ? c : undefined;
};

const riga = (etichetta, valore, cl) => (cl ? { etichetta, valore, classe: cl } : { etichetta, valore });

export function voceTerreno(p) {
  const gruppi = [
    { titolo: 'Pendenza', righe: [riga('Gradi', fmt(p.slope_deg, 1, '°')), riga('Percentuale', fmt(p.slope_pct, 1, ' %'))] },
    { titolo: 'Morfologia', righe: [riga('Esposizione', testo(p.aspetto_nome)), riga('Forma terreno', testo(p.geomorf_nome))] },
    { titolo: 'Rischio versanti', righe: [
      riga('Stabilità', testo(p.stabilita_nome), classe(p.stabilita)),
      riga('Costruibilità', testo(p.costr_nome), classe(p.costruibilita)),
    ] },
    { titolo: 'Indici morfometrici', righe: [], griglia: [
      { valore: fmt(p.tri, 2), chiave: 'TRI' }, { valore: fmt(p.tpi, 2), chiave: 'TPI' },
      { valore: fmt(p.sri, 2), chiave: 'SRI' }, { valore: fmt(p.hillshade, 0), chiave: 'HS' },
    ] },
  ];

  const idrologia = [riga('TWI — Umidità topografica', fmt(p.twi, 1)), riga('SPI — Stream Power', fmt(p.spi, 2))];
  if (p.flow_acc != null) idrologia.push(riga('Flow Acc. (log)', fmt(p.flow_acc, 2)));
  if (p.dtw != null) idrologia.push(riga('DTW — Profondità falda', fmt(p.dtw, 1, ' m')));
  gruppi.push({ titolo: 'Idrologia', righe: idrologia });

  const energia = [];
  if (p.svf != null) energia.push(riga('SVF — Cielo visibile', `${Math.round(p.svf * 100)} %`));
  if (p.fv != null) energia.push(riga('Potenziale FV', `${Math.round(p.fv * 100)} %`));
  if (p.ombra_est != null) energia.push(riga('Ombra estiva', `${Math.round(p.ombra_est / 2.55)} %`));
  if (p.ombra_inv != null) energia.push(riga('Ombra invernale', `${Math.round(p.ombra_inv / 2.55)} %`));
  if (p.frost != null) energia.push(riga('Rischio gelata', fmt(p.frost, 3)));
  if (energia.length) gruppi.push({ titolo: 'Energia e clima', righe: energia });

  const mobilita = [];
  if (p.tobler != null) mobilita.push(riga('Velocità Tobler', fmt(p.tobler, 1, ' km/h')));
  if (p.viewshed != null) mobilita.push(riga('Visibilità cumulativa', `${Math.round(p.viewshed)}/6 punti`));
  if (p.rusle != null) mobilita.push(riga('Erosione RUSLE LS', fmt(p.rusle, 2)));
  if (mobilita.length) gruppi.push({ titolo: 'Accessibilità ed erosione', righe: mobilita });

  return {
    chiave: 'terreno',
    peso: 80,
    strato: 'elevazione',
    titolo: 'Terreno (DTM 5 m)',
    icona: 'rilievo',
    ...(ha(p.quota) ? { badge: `${fmt(p.quota, 0)} m s.l.m.` } : {}),
    collassabile: true,
    aperta: true,
    gruppi,
    nota: 'Punto della griglia DTM più vicino (passo 50 m).',
    link: { testo: 'Analisi morfologica interattiva', icona: 'esterno', url: 'https://palermohub.opendatasicilia.it/palermo_dtm5m.html' },
  };
}
