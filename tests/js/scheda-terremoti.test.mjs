import test from 'node:test';
import assert from 'node:assert/strict';
import { proprietaStorico, serieEventi, puntiMagnitudo, finestraTempo, curvaCumulativa, omori, rilascioCumulativo, tempiTraEventi, spazioTempo, eventiDaTesto, periodoSequenza, urlStorico, eventoDaIngv, fasciaEta, raggioMagnitudo, oraEvento, distanzaKm, modelloPopupTerremoto, voceTerremoto, riassuntoTerremoti, FASCE, passaFiltro, espressioneFiltro, classeMagnitudo, intervallo, eventiPerGiorno, eventiPerClasse, prossimaFinestra, altriTerremoti, accordionTerremoti, voceAltri, posizioneEvento, MAX_ELENCO, miniatura } from '../../js/layers/scheda-terremoti.js';

const ingv = (extra = {}, coord = [14.1717, 38.7938, 8.8]) => ({
  type: 'Feature', geometry: { type: 'Point', coordinates: coord },
  properties: { eventId: 47606532, time: '2026-10-23T10:19:15.470000', magType: 'ML', mag: 5, place: 'Tirreno Meridionale [Mare]', author: 'SURVEY-INGV', ...extra },
});
const ADESSO = Date.parse('2026-10-23T10:49:15Z');

test('oraEvento: ora UTC senza Z e con microsecondi', () => {
  assert.equal(oraEvento('2026-10-23T10:19:15.470000'), Date.parse('2026-10-23T10:19:15.470Z'));
});

test('fasciaEta: ultima ora, 24 ore, 7 giorni', () => {
  assert.equal(fasciaEta(ADESSO - 30 * 60000, ADESSO).nome, 'Ultima ora');
  assert.equal(fasciaEta(ADESSO - 5 * 3600000, ADESSO).nome, 'Ultime 24 ore');
  assert.equal(fasciaEta(ADESSO - 3 * 86400000, ADESSO).nome, 'Oltre 24 ore');
  assert.equal(FASCE.at(-1).finoA, Infinity);
});

test('raggioMagnitudo cresce con la magnitudo e ha un minimo', () => {
  assert.ok(raggioMagnitudo(1) >= 3);
  assert.ok(raggioMagnitudo(5) > raggioMagnitudo(3));
});

test('eventoDaIngv: proprietà piatte, profondità dalla terza coordinata', () => {
  const f = eventoDaIngv(ingv(), ADESSO);
  assert.equal(f.properties.id, '47606532');
  assert.equal(f.properties.prof, 8.8);
  assert.equal(f.properties.fascia, 'Ultima ora');
  assert.deepEqual(f.geometry.coordinates, [14.1717, 38.7938]);
});

test('eventoDaIngv: dati incompleti scartati', () => {
  assert.equal(eventoDaIngv(ingv({ mag: null })), null);
  assert.equal(eventoDaIngv(ingv({ time: 'boh' })), null);
  assert.equal(eventoDaIngv({}), null);
});

test('distanzaKm: Palermo-Catania circa 167 km', () => {
  const d = distanzaKm([13.3614, 38.1157], [15.087, 37.5079]);
  assert.ok(d > 150 && d < 185, String(d));
});

test('popup e voce: righe principali e link all\'evento', () => {
  const f = eventoDaIngv(ingv(), ADESSO);
  const p = { ...f.properties, lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] };
  const m = modelloPopupTerremoto(p, ADESSO);
  const val = e => m.righe.find(r => r.etichetta === e)?.valore;
  assert.match(m.titolo, /^M /);
  assert.match(val('Profondità'), /8[.,]8 km/);
  assert.ok(val('Distanza da Palermo'));
  assert.equal(m.righe.find(r => r.etichetta === 'Zona'), undefined);
  const v = voceTerremoto(p, ADESSO);
  assert.equal(v.link.url, 'https://terremoti.ingv.it/event/47606532');
  assert.equal(v.strato, 'terremoti');
});

test('riassuntoTerremoti: numero e più forte', () => {
  assert.equal(riassuntoTerremoti([]), null);
  const r = riassuntoTerremoti([{ mag: 1.2 }, { mag: 4.1 }, { mag: 2 }]);
  assert.equal(r.n, 3);
  assert.equal(r.forte.mag, 4.1);
});

const ev = (id, mag, oreFa) => ({ id, mag, ts: ADESSO - oreFa * 3600000, luogo: 'Z', lon: 13, lat: 38 });

test('passaFiltro: magnitudo minima e periodo', () => {
  const f = { giorni: 1, magMin: 2 };
  assert.equal(passaFiltro(ev('a', 2.5, 3), f, ADESSO), true);
  assert.equal(passaFiltro(ev('b', 1.5, 3), f, ADESSO), false);
  assert.equal(passaFiltro(ev('c', 3, 30), f, ADESSO), false);
});

test('espressioneFiltro: stesse soglie per la mappa', () => {
  const e = espressioneFiltro({ giorni: 7, magMin: 3 }, ADESSO);
  assert.deepEqual(e[1], ['>=', ['get', 'mag'], 3]);
  assert.deepEqual(e[2], ['>=', ['get', 'ts'], ADESSO - 7 * 86400000]);
});

test('classeMagnitudo: classi 1-2, 2-3, 3-4, 4+', () => {
  assert.deepEqual([1, 1.9, 2, 3.5, 4, 6].map(classeMagnitudo), [0, 0, 1, 2, 3, 3]);
});

test('finestra dello slider: intervallo, filtro ed espressione', () => {
  const f = { giorni: 7, magMin: 1, finestra: [10, 20], classi: null };
  const [da, a] = intervallo(f, ADESSO);
  assert.equal(da, ADESSO - 20 * 86400000);
  assert.equal(a, ADESSO - 10 * 86400000);
  assert.equal(passaFiltro(ev('a', 2, 15 * 24), f, ADESSO), true);
  assert.equal(passaFiltro(ev('b', 2, 3 * 24), f, ADESSO), false); // fuori finestra, anche se nei 7 giorni
  assert.deepEqual(espressioneFiltro(f, ADESSO).at(-1), ['<=', ['get', 'ts'], a]);
  assert.equal(intervallo({ giorni: 7, finestra: [20, 30] }, ADESSO)[1], Infinity); // fine piena = aperta
});

test('classi di magnitudo accese: filtro ed espressione', () => {
  const f = { giorni: 7, magMin: 1, finestra: null, classi: new Set([2]) };
  assert.equal(passaFiltro(ev('a', 3.2, 1), f, ADESSO), true);
  assert.equal(passaFiltro(ev('b', 2.2, 1), f, ADESSO), false);
  assert.deepEqual(espressioneFiltro(f, ADESSO).at(-1), ['any', ['all', ['>=', ['get', 'mag'], 3], ['<', ['get', 'mag'], 4]]]);
});

test('eventiPerGiorno ed eventiPerClasse: conteggi per i due grafici', () => {
  const eventi = [ev('a', 1.5, 1), ev('b', 3, 2), ev('c', 3.5, 30), ev('d', 2, 24 * 29), ev('e', 2, 24 * 40)];
  const g = eventiPerGiorno(eventi, { magMin: 1, classi: null }, ADESSO);
  assert.equal(g.length, 30);
  assert.equal(g[29], 2);
  assert.equal(g[28], 1);
  assert.equal(g[0], 1);
  assert.equal(g.reduce((x, y) => x + y), 4); // il quinto è oltre i 30 giorni
  assert.deepEqual(eventiPerClasse(eventi, { giorni: 7, magMin: 1, finestra: null, classi: new Set([0]) }, ADESSO), [1, 0, 2, 0]);
});

test('prossimaFinestra: scorre di un giorno e riparte dall\'inizio', () => {
  assert.deepEqual(prossimaFinestra(null), [0, 3]);
  assert.deepEqual(prossimaFinestra([0, 3]), [1, 4]);
  assert.deepEqual(prossimaFinestra([27, 30]), [0, 3]);
});

test('altriTerremoti: esclude i cliccati, ordina dal più recente, limita', () => {
  const eventi = [ev('a', 3, 5), ev('b', 3, 1), ev('c', 3, 2), ev('d', 0.5, 1)];
  const r = altriTerremoti(eventi, new Set(['b']), { giorni: 7, magMin: 1 }, ADESSO);
  assert.deepEqual(r.mostrati.map(p => p.id), ['c', 'a']);
  assert.equal(r.n, 2);
  const molti = Array.from({ length: MAX_ELENCO + 5 }, (_, i) => ev(String(i), 2, 1 + i / 1000));
  const l = altriTerremoti(molti, new Set(), { giorni: 7, magMin: 1 }, ADESSO);
  assert.equal(l.mostrati.length, MAX_ELENCO);
  assert.equal(l.n, MAX_ELENCO + 5);
});

test('accordionTerremoti: una card per evento con il link INGV', () => {
  const a = accordionTerremoti({ n: 1, mostrati: [{ ...ev('x', 3, 2), tipoMag: 'ML', prof: 10, autore: 'INGV' }] }, ADESSO);
  assert.equal(a.elementi.length, 1);
  assert.match(a.elementi[0].righe.at(-1).urlValore, /ingv\.it\/event\/x$/);
});

test('voceAltri: sezione con contenuto dinamico', () => {
  const v = voceAltri(() => null);
  assert.equal(v.sempre, true);
  assert.equal(typeof v.dinamico, 'function');
});

test('miniatura: tessere che coprono il rettangolo centrato sul punto, link alla mappa', () => {
  const m = miniatura({ lon: 13.3614, lat: 38.1157 });
  assert.ok(m.tessere.length >= 1 && m.tessere.length <= 6);
  assert.match(m.tessere[0].url, /tile\.openstreetmap\.org\/8\/\d+\/\d+\.png$/);
  assert.equal(m.href, 'mappa.html#9/38.1157/13.3614');
  // il punto sta al centro: la tessera che lo contiene copre il centro del quadrato
  assert.ok(m.larghezza > m.altezza);
  const [cx, cy] = [m.larghezza / 2, m.altezza / 2];
  assert.ok(m.tessere.some(t => t.x <= cx && cx < t.x + 256 && t.y <= cy && cy < t.y + 256));
});

test('voceTerremoto: porta la miniatura dell\'epicentro', () => {
  const v = voceTerremoto({ id: '1', mag: 3, ts: ADESSO - 60000, lon: 13.3, lat: 38.1, luogo: 'Z', fascia: 'Ultima ora' }, ADESSO);
  assert.equal(v.miniatura.tessere.length >= 1, true);
});

test('posizioneEvento: posto dal più recente, con precedente e successivo', () => {
  const ev = [{ id: 'a', ts: 100 }, { id: 'c', ts: 300 }, { id: 'b', ts: 200 }];
  assert.deepEqual(posizioneEvento(ev, 'b'), { pos: 2, tot: 3, prec: ev[1], succ: ev[0] });
  assert.equal(posizioneEvento(ev, 'c').prec, null);
  assert.equal(posizioneEvento(ev, 'a').succ, null);
  assert.equal(posizioneEvento(ev, 'x'), null);
});

test('voceTerremoto: la barra dinamica è facoltativa', () => {
  const p = { id: '1', mag: 3, ts: ADESSO - 60000, lon: 13.3, lat: 38.1, luogo: 'Z', fascia: 'Ultima ora' };
  assert.equal('dinamico' in voceTerremoto(p, ADESSO), false);
  const f = () => null;
  assert.equal(voceTerremoto(p, ADESSO, f).dinamico, f);
});

const giorno = (g, ora = 12) => new Date(2026, 9, g, ora).getTime(); // ottobre 2026, ora locale
const OGGI = giorno(23, 15);

test('eventiDaTesto: legge ora e magnitudo, salta intestazione e righe rotte', () => {
  const testo = '#EventID|Time|Latitude|Longitude|Depth/Km|Author|Catalog|Contributor|ContributorID|MagType|Magnitude|MagAuthor|EventLocationName|EventType\n1|2026-10-23T13:45:38.880000|38.7|14.1|10.0|X|||| ML|2.1|--|Z|earthquake\n2|rotta|1|1|1|X||||ML|abc|--|Z|earthquake\n';
  const ev = eventiDaTesto(testo);
  assert.equal(ev.length, 1);
  assert.equal(ev[0].mag, 2.1);
  assert.equal(ev[0].ts, Date.parse('2026-10-23T13:45:38.880Z'));
  assert.deepEqual([ev[0].id, ev[0].lat, ev[0].lon, ev[0].prof, ev[0].luogo], ['1', 38.7, 14.1, 10, 'Z']);
});

test('serieEventi: barre per giorno, 30 finestre, la più recente è oggi', () => {
  const s = serieEventi([{ ts: giorno(23, 9), mag: 2.4 }, { ts: giorno(23, 10), mag: 3.1 }, { ts: giorno(20), mag: 2 }], 'giorno', 2, OGGI);
  assert.equal(s.barre.length, 30);
  assert.equal(s.barre.at(-1).n, 2);
  assert.equal(s.barre.at(-1).magMax, 3.1);
  assert.equal(s.barre.at(-4).n, 1);
  assert.equal(s.totale, 3);
});

test('serieEventi: la magnitudo minima scarta gli eventi sotto soglia e mai sotto lo storico', () => {
  const ev = [{ ts: giorno(22), mag: 2.2 }, { ts: giorno(22), mag: 3.5 }, { ts: giorno(22), mag: 1.5 }];
  assert.equal(serieEventi(ev, 'giorno', 3, OGGI).totale, 1);
  assert.equal(serieEventi(ev, 'giorno', 1, OGGI).totale, 2);
});

test('serieEventi: sciame = barra anomala; barre di sciame consecutive formano una sequenza', () => {
  const ev = [];
  for (let g = 1; g <= 23; g++) ev.push({ ts: giorno(g), mag: 2.1 }); // un evento al giorno
  for (const g of [10, 11, 12]) for (let k = 0; k < 15; k++) ev.push({ ts: giorno(g, k), mag: 2 + k / 10 });
  for (let k = 0; k < 9; k++) ev.push({ ts: giorno(20, k), mag: 2 });
  const s = serieEventi(ev, 'giorno', 2, OGGI);
  assert.equal(s.barre.filter(b => b.sciame).length, 4);
  assert.equal(s.sequenze.length, 2);
  assert.equal(s.sequenze[0].barre, 3);
  assert.equal(s.sequenze[0].n, 48);
  assert.equal(s.sequenze[1].barre, 1);
});

test('serieEventi: senza anomalie non ci sono sciami', () => {
  const ev = [];
  for (let g = 1; g <= 23; g++) ev.push({ ts: giorno(g), mag: 2.1 }, { ts: giorno(g, 14), mag: 2.3 });
  const s = serieEventi(ev, 'giorno', 2, OGGI);
  assert.equal(s.sequenze.length, 0);
});

test('serieEventi: per mese 24 barre e per anno 5, con eventi di anni fa', () => {
  const ev = [{ ts: new Date(2026, 9, 3).getTime(), mag: 2 }, { ts: new Date(2026, 8, 3).getTime(), mag: 2 }, { ts: new Date(2024, 2, 3).getTime(), mag: 4 }];
  const m = serieEventi(ev, 'mese', 2, OGGI);
  assert.equal(m.barre.length, 24);
  assert.equal(m.barre.at(-1).n, 1);
  assert.equal(m.barre.at(-2).n, 1);
  const a = serieEventi(ev, 'anno', 2, OGGI);
  assert.equal(a.barre.length, 5);
  assert.equal(a.barre.at(-1).n, 2);
  assert.equal(a.barre.at(-3).magMax, 4);
});

test('periodoSequenza e urlStorico', () => {
  const s = serieEventi([], 'giorno', 2, OGGI);
  assert.match(periodoSequenza({ da: giorno(10, 0), a: giorno(13, 0) }, 'giorno'), /10.*–.*12/);
  assert.equal(s.totale, 0);
  const u = urlStorico({ minlon: 11.7, minlat: 36.3, maxlon: 16.2, maxlat: 39.2 }, OGGI);
  assert.match(u, /format=text/);
  assert.match(u, /minmag=2/);
});

test('puntiMagnitudo: stelo alto quanto la magnitudo, mainshock e repliche', () => {
  const ev = [{ ts: giorno(10), mag: 2.1 }, { ts: giorno(15), mag: 4.6 }, { ts: giorno(16), mag: 3.0 }, { ts: giorno(22), mag: 2.4 }, { ts: giorno(1) - 90 * 86400000, mag: 5 }];
  const g = puntiMagnitudo(ev, 'giorno', 2, OGGI);
  assert.equal(g.punti.length, 4); // il quinto è fuori finestra
  assert.equal(g.mainshock.mag, 4.6);
  assert.equal(g.repliche, 2);
  assert.equal(g.base, 2);
  assert.equal(g.cima, 5);
  assert.deepEqual(g.livelli, [2, 3, 4, 5]);
  assert.ok(Math.abs(g.mainshock.y - (4.6 - 2) / 3) < 1e-9);
  assert.ok(g.punti.every((p, i, a) => !i || p.x >= a[i - 1].x));
});

test('puntiMagnitudo: senza eventi non c\'è mainshock; la magnitudo minima filtra', () => {
  assert.equal(puntiMagnitudo([], 'mese', 2, OGGI).mainshock, null);
  const g = puntiMagnitudo([{ ts: giorno(20), mag: 2.2 }, { ts: giorno(20), mag: 3.4 }], 'giorno', 3, OGGI);
  assert.equal(g.punti.length, 1);
  assert.equal(g.base, 3);
});

test('curvaCumulativa: scala crescente da 0 al totale, sulla finestra intera', () => {
  const c = curvaCumulativa(puntiMagnitudo([{ ts: giorno(10), mag: 2.1 }, { ts: giorno(15), mag: 4.6 }, { ts: giorno(22), mag: 2.4 }], 'giorno', 2, OGGI));
  assert.equal(c.totale, 3);
  assert.deepEqual([c.passi[0].x, c.passi[0].n], [0, 0]);
  assert.deepEqual([c.passi.at(-1).x, c.passi.at(-1).n], [1, 3]);
  assert.ok(c.passi.every((p, i, a) => !i || (p.x >= a[i - 1].x && p.n >= a[i - 1].n)));
  assert.equal(curvaCumulativa(puntiMagnitudo([], 'mese', 2, OGGI)).totale, 0);
});

test('proprietaStorico: proprietà come quelle in mappa; senza coordinate è null', () => {
  const p = proprietaStorico({ id: '9', ts: OGGI - 3 * 86400000, mag: 3.2, lat: 38.5, lon: 13.9, prof: 8, luogo: 'Golfo', tipoMag: 'ML', autore: 'X' }, OGGI);
  assert.equal(p.fascia, 'Oltre 24 ore');
  assert.deepEqual([p.lon, p.lat, p.luogo], [13.9, 38.5, 'Golfo']);
  assert.equal(proprietaStorico({ ts: OGGI, mag: 2, lat: NaN, lon: NaN }, OGGI), null);
});

test('omori: repliche per giorno dopo la mainshock e pendenza log-log', () => {
  const ev = [{ ts: giorno(5), mag: 5 }];
  // decadimento ~ 1/t: 16, 8, 5, 4, 3 repliche nei giorni 1-5 dopo la scossa
  [16, 8, 5, 4, 3].forEach((n, i) => { for (let k = 0; k < n; k++) ev.push({ ts: giorno(5 + i, 13 + k * 0.1), mag: 2.1 }); });
  const o = omori(puntiMagnitudo(ev, 'giorno', 2, OGGI));
  assert.equal(o.mainshock.mag, 5);
  assert.deepEqual(o.giorni.slice(0, 5).map(d => d.n), [16, 8, 5, 4, 3]);
  assert.ok(o.fit.p > 0.5 && o.fit.p < 1.5);
  assert.equal(omori(puntiMagnitudo([], 'giorno', 2, OGGI)).mainshock, null);
  assert.equal(omori(puntiMagnitudo([{ ts: giorno(5), mag: 5 }, { ts: giorno(6), mag: 2.5 }], 'giorno', 2, OGGI)).fit, null);
});

const evGeo = [{ ts: giorno(5), mag: 5, lat: 38.0, lon: 13 }, { ts: giorno(5, 14), mag: 2.1, lat: 38.1, lon: 13 }, { ts: giorno(5, 15), mag: 2.2, lat: 38.2, lon: 13 }, { ts: giorno(9), mag: 2.0, lat: 38.4, lon: 13 }];

test('rilascioCumulativo: domina l\'evento grande; magnitudo equivalente ≥ del più forte', () => {
  const r = rilascioCumulativo(puntiMagnitudo(evGeo, 'giorno', 2, OGGI));
  assert.ok(r.quotaMax > 0.99);
  assert.ok(r.magEquiv >= 5 && r.magEquiv < 5.01);
  assert.equal(r.passi.at(-1).f, 1);
  assert.ok(r.passi.every((p, i, a) => !i || (p.x >= a[i - 1].x && p.f >= a[i - 1].f)));
  assert.equal(rilascioCumulativo(puntiMagnitudo([], 'giorno', 2, OGGI)).totale, 0);
});

test('tempiTraEventi: attese in classi, cv > 1 se raggruppati; meno di 3 eventi è null', () => {
  const a = tempiTraEventi(puntiMagnitudo(evGeo, 'giorno', 2, OGGI));
  assert.equal(a.n, 3);
  assert.equal(a.classi.reduce((s, c) => s + c.n, 0), 3);
  assert.equal(a.classi.find(c => c.da === 60).n, 2); // 2 ore e 1 ora tra i primi eventi
  assert.ok(a.cv > 0.5);
  assert.equal(tempiTraEventi(puntiMagnitudo(evGeo.slice(0, 2), 'giorno', 2, OGGI)), null);
});

test('spazioTempo: latitudine in quota 0-1; senza coordinate è null', () => {
  const st = spazioTempo(puntiMagnitudo(evGeo, 'giorno', 2, OGGI));
  assert.deepEqual([st.latMin, st.latMax], [38, 38.4]);
  assert.ok(Math.abs(st.punti[0].y) < 1e-9 && Math.abs(st.punti.at(-1).y - 1) < 1e-9);
  assert.equal(st.mainshock.mag, 5);
  assert.equal(spazioTempo(puntiMagnitudo([{ ts: giorno(5), mag: 3 }, { ts: giorno(6), mag: 3 }], 'giorno', 2, OGGI)), null);
});

test('finestraTempo: restringe a un tratto, rifà x e riconosce la mainshock del tratto', () => {
  const g = puntiMagnitudo([
    { id: 'a', ts: OGGI - 5 * 86400000, mag: 5 },
    { id: 'b', ts: OGGI - 3 * 86400000, mag: 3 },
    { id: 'c', ts: OGGI - 2 * 86400000, mag: 4 },
    { id: 'd', ts: OGGI - 86400000, mag: 2.5 },
  ], 'giorno', 2, OGGI);
  const w = finestraTempo(g, OGGI - 3.5 * 86400000, OGGI - 0.5 * 86400000);
  assert.deepEqual(w.punti.map(p => p.id), ['b', 'c', 'd']);
  assert.equal(w.mainshock.id, 'c');
  assert.equal(w.repliche, 1);
  assert.ok(w.punti.every(p => p.x >= 0 && p.x <= 1));
  assert.equal(w.punti[0].x, 0.5 / 3);
  assert.equal(w.base, g.base);
  assert.equal(finestraTempo(g, OGGI - 0.5 * 86400000, OGGI).mainshock, null);
});
