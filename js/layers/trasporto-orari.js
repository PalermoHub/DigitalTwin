// Logica pura degli orari del trasporto pubblico (nessun DOM): giorni di servizio, partenze di una fermata, riepilogo di una linea.
// Gli orari sono minuti dalla mezzanotte del giorno di servizio: oltre 1440 sono corse dopo la mezzanotte.

const due = n => String(n).padStart(2, '0');

export function formatoOra(minuti) {
  const ora = `${due(Math.floor(minuti / 60) % 24)}:${due(minuti % 60)}`;
  return minuti >= 1440 ? `${ora} (+1)` : ora;
}

export function oggiISO(d = new Date()) {
  return `${d.getFullYear()}-${due(d.getMonth() + 1)}-${due(d.getDate())}`;
}

export function minutoAdesso(d = new Date()) {
  return d.getHours() * 60 + d.getMinutes();
}

// Oggi se rientra nella validità del feed, altrimenti il primo giorno valido (`fuori` fa mostrare l'avviso).
export function giornoIniziale({ validita }, oggi) {
  return oggi >= validita.da && oggi <= validita.a ? { data: oggi, fuori: false } : { data: validita.da, fuori: true };
}

// Fonde gli orari di due feed (AMAT e Trenitalia): gli indici di servizio e gli id di fermata non collidono (i servizi
// ferroviari partono da 1000, le stazioni hanno il prefisso «f»). La validità è l'unione: fuori dal periodo di un feed
// i suoi servizi semplicemente non hanno giorni attivi. Con un solo feed restituisce quello.
export function uniscimOrari(a, b) {
  if (!a || !b) return a ?? b;
  return {
    validita: { da: a.validita.da < b.validita.da ? a.validita.da : b.validita.da, a: a.validita.a > b.validita.a ? a.validita.a : b.validita.a },
    servizi: { ...a.servizi, ...b.servizi },
    fermate: { ...a.fermate, ...b.fermate },
  };
}

export function serviziAttivi({ servizi }, data) {
  return new Set(Object.entries(servizi).filter(([, date]) => date.includes(data)).map(([indice]) => Number(indice)));
}

function giornoPrima(data) {
  const d = new Date(`${data}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Partenze di una fermata nel giorno `data`, ordinate. Le corse di ieri che finiscono dopo la mezzanotte
// (orario ≥ 1440) partono di fatto al mattino di oggi e si aggiungono con l'orario riportato a 0–1439
// (`conIeri = false` per contare solo le corse del giorno di servizio, come nel riepilogo di una linea).
export function partenzeFermata(orari, stopId, data, conIeri = true) {
  const oggi = serviziAttivi(orari, data);
  const ieri = conIeri ? serviziAttivi(orari, giornoPrima(data)) : new Set();
  const partenze = [];
  for (const [route, gruppi] of Object.entries(orari.fermate[stopId] ?? {})) {
    for (const g of gruppi) {
      if (oggi.has(g.s)) for (const t of g.t) partenze.push({ route, dir: g.d, t });
      if (ieri.has(g.s)) for (const t of g.t) if (t >= 1440) partenze.push({ route, dir: g.d, t: t - 1440 });
    }
  }
  return partenze.sort((a, b) => a.t - b.t || a.route.localeCompare(b.route));
}

export function prossime(partenze, minuto, n = 8) {
  return partenze.filter(p => p.t >= minuto).slice(0, n);
}

// Corse, primo e ultimo passaggio e frequenza media (minuti) misurati alla prima fermata della linea; se lì oggi non parte
// niente (è il capolinea di una variante) si usa la fermata della linea con più partenze.
export function riepilogoLinea(orari, linea, data) {
  const deLinea = stop => partenzeFermata(orari, stop, data, false).filter(x => x.route === linea.route_id && x.dir === linea.direzione);
  let p = deLinea(linea.fermate[0]);
  if (!p.length) p = linea.fermate.map(deLinea).reduce((meglio, x) => (x.length > meglio.length ? x : meglio), []);
  if (!p.length) return null;
  const primo = p[0].t;
  const ultimo = p[p.length - 1].t;
  return { n: p.length, primo, ultimo, frequenza: p.length > 1 ? Math.round((ultimo - primo) / (p.length - 1)) : null };
}

// Testo nero o bianco, a seconda della luminosità dello sfondo (i colori delle linee vanno dal giallo al viola scuro).
export function colorePerTesto(esadecimale) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(esadecimale.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? '#000000' : '#ffffff';
}

// Ordine dei numeri di linea: prima i numerici (9 prima di 101), poi le sigle (N1, TRAM1).
export function ordineLinea(a, b) {
  const na = /^\d+$/.test(a);
  const nb = /^\d+$/.test(b);
  if (na && nb) return Number(a) - Number(b);
  return na === nb ? a.localeCompare(b) : na ? -1 : 1;
}
