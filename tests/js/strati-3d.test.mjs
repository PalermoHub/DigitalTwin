import test from 'node:test';
import assert from 'node:assert/strict';
import { gruppiStrati, limitaPiani, puntoDaPiano, quote } from '../../js/core/strati-3d-modello.js';

const L = (id, extra = {}) => ({ id, type: 'fill', source: 'src-' + id.split('-')[0], ...extra });
const nascosto = { layout: { visibility: 'none' } };
const eBase = id => id.startsWith('base-') || id === 'water';

const STILE = [
  { id: 'base-osm', type: 'raster', source: 'osm', ...nascosto },
  L('water', { source: 'openmaptiles' }),
  L('catasto'), L('catasto-hit'), L('catasto-evidenza'),
  L('prg-zto'), L('prg-hit'),
  L('isole', nascosto),
  L('rndt-1', { source: 'rndt-x' }),
  L('edifici'),
];
const STRATI = [
  { id: 'catasto', etichetta: 'Catasto', layers: ['catasto'] },
  { id: 'prg', etichetta: 'PRG', layers: ['prg-zto'] },
  { id: 'isole', etichetta: 'Isole', layers: ['isole'] },
  { id: 'edificato', etichetta: 'Edificato', layers: ['edifici'] },
];

test('gruppiStrati: base in fondo, poi gli strati accesi nell\'ordine di disegno, poi gli altri layer', () => {
  const accesi = new Set(['edificato', 'catasto', 'prg', 'isole']);
  const g = gruppiStrati(STILE, STRATI, id => accesi.has(id), eBase);
  assert.deepEqual(g.map(x => x.id), ['base', 'catasto', 'prg', 'altri', 'edificato']);
  assert.deepEqual(g[0].layers, ['water']); // la base raster nascosta non conta
  assert.deepEqual(g.find(x => x.id === 'altri').layers, ['rndt-1']); // i layer di servizio dei moduli (hit, evidenza) no
});

test('gruppiStrati: uno strato acceso ma con i layer nascosti (o spento) non fa piano', () => {
  const g = gruppiStrati(STILE, STRATI, id => id === 'isole', eBase);
  assert.deepEqual(g.map(x => x.id), ['base', 'altri']);
});

test('limitaPiani: tiene la base e i piani più in alto', () => {
  const gruppi = [{ id: 'base', base: true }, { id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  assert.deepEqual(limitaPiani(gruppi, 3), { piani: [gruppi[0], gruppi[3], gruppi[4]], fuori: 2 });
  assert.deepEqual(limitaPiani(gruppi, 9), { piani: gruppi, fuori: 0 });
});

test('puntoDaPiano: angoli e centro di una vista ruotata', () => {
  const angoli = [[0, 0], [4, 2], [3, 5], [-1, 3]]; // no, ne, se, so
  assert.deepEqual(puntoDaPiano(angoli, 0, 0), [0, 0]);
  assert.deepEqual(puntoDaPiano(angoli, 1, 0), [4, 2]);
  assert.deepEqual(puntoDaPiano(angoli, 1, 1), [3, 5]);
  assert.deepEqual(puntoDaPiano(angoli, 0.5, 0.5), [1.5, 2.5]);
});

test('quote: passo costante dal basso', () => {
  assert.deepEqual(quote(3, 1000), [0, 75, 150]);
});

test('unisciTerreno: rilievo ed elevazione in un solo piano, in fondo', async () => {
  const { unisciTerreno } = await import('../../js/core/strati-3d-modello.js');
  const g = unisciTerreno([{ id: 'base', base: true, layers: ['b'] }, { id: 'catasto', layers: ['c'] }, { id: 'rilievo3d', layers: ['h'] }, { id: 'elevazione', layers: ['e'] }]);
  assert.deepEqual(g.map(x => x.id), ['terreno', 'base', 'catasto']);
  assert.deepEqual(g[0].layers, ['h', 'e']);
  assert.deepEqual(unisciTerreno([{ id: 'catasto', layers: ['c'] }]).map(x => x.id), ['catasto']);
  // il limite dei piani non taglia né la base né il terreno
  assert.deepEqual(limitaPiani([g[0], g[1], { id: 'a' }, { id: 'b' }], 3).piani.map(x => x.id), ['terreno', 'base', 'b']);
});

test('terreno: quota Terrarium e zoom dei tile entro il tetto', async () => {
  const { quotaTerrarium, zoomTile } = await import('../../js/core/strati-3d-terreno.js');
  assert.equal(quotaTerrarium(128, 0, 0), 0);
  assert.equal(quotaTerrarium(130, 88, 128), 600.5);
  // una vista di circa 0,0004 unità Mercator (≈ 16 km) a zoom 14: si scende finché i tile sono al più 48
  const z = zoomTile(0.5370, 0.3880, 0.5374, 0.3884, 14);
  const n = 2 ** z;
  assert.ok((Math.floor(0.5374 * n) - Math.floor(0.5370 * n) + 1) * (Math.floor(0.3884 * n) - Math.floor(0.3880 * n) + 1) <= 48);
  assert.ok(z <= 15 && z >= 10);
});

test('etichettaFeature: catasto, campi noti con dettaglio, ripieghi', async () => {
  const { etichettaFeature } = await import('../../js/core/strati-3d-modello.js');
  assert.deepEqual(etichettaFeature({ Foglio: 54, Paricella: '312', fid: 9 }), { foglio: '54', particella: '312' });
  assert.deepEqual(etichettaFeature({ ZTO: 'B2', DESCRIZION: 'Zona residenziale', fid: 1 }), { titolo: 'B2', sotto: 'Zona residenziale' });
  assert.deepEqual(etichettaFeature({ fid: 3, colore: 'rosso' }), { titolo: 'rosso', sotto: '' });
  assert.deepEqual(etichettaFeature({ fid: 3, pop21: 1250 }), { titolo: `pop21: ${(1250).toLocaleString()}`, sotto: '' });
  assert.equal(etichettaFeature({ fid: 3 }), null);
});

test('layerDaInterrogare: i layer di servizio degli strati disegnati come immagini', async () => {
  const { layerDaInterrogare } = await import('../../js/core/strati-3d-modello.js');
  assert.deepEqual(layerDaInterrogare({ id: 'prg', layers: ['prg-zto', 'prg-ppe'] }), ['prg-zto', 'prg-ppe', 'prg-zto-hit', 'prg-ns-hit', 'prg-cs-hit']);
  assert.deepEqual(layerDaInterrogare({ id: 'terreno', strati: ['rilievo3d', 'elevazione'], layers: ['h', 'e'] }), ['h', 'e', 'griglia-hit']);
  assert.deepEqual(layerDaInterrogare({ id: 'altri', layers: ['x'] }), ['x']);
});

test('varchi: uno tra ogni coppia di piani accesi, indicato col piano sotto', async () => {
  const { varchi, varcoPer, camminaVarco } = await import('../../js/core/strati-3d-modello.js');
  const spento = [false, false, true, false, false];
  const lista = varchi(spento);
  assert.deepEqual(lista, [0, 1, 3]);
  assert.deepEqual(varchi([false]), []);
  assert.deepEqual(varchi([true, false, true]), []);
  assert.equal(varcoPer(lista, 1), 1);
  assert.equal(varcoPer(lista, 2), 3); // uno strato spento: il varco sopra
  assert.equal(varcoPer(lista, 4), 3); // l'ultimo strato: il varco sotto
  assert.equal(varcoPer(lista, Infinity), 3);
  assert.equal(varcoPer([], 0), -1);
  assert.equal(camminaVarco(lista, 1, 1), 3);
  assert.equal(camminaVarco(lista, 3, 1), 3); // non esce dalla pila
  assert.equal(camminaVarco(lista, 0, -1), 0);
  assert.equal(camminaVarco(lista, 2, -1), 3); // varco non più valido: il più vicino
});

test('opacitaDentro: pieni i due piani del varco, sfumano gli altri, spariscono quelli alle spalle', async () => {
  const { opacitaDentro } = await import('../../js/core/strati-3d-modello.js');
  const spento = [false, false, false, true, false, false];
  const op = b => spento.map((_, i) => opacitaDentro(spento, 1, i, b));
  assert.deepEqual(op(90), [0.6, 1, 1, 0, 0.6, 0.35]);
  assert.deepEqual(op(0), [0.6, 1, 0, 0, 0, 0]);   // dritto giù: niente sopra
  assert.deepEqual(op(180), [0, 0, 1, 0, 0.6, 0.35]); // dritto su: niente sotto
  assert.deepEqual(spento.map((_, i) => opacitaDentro(spento, 1, i, 0, true)), [0.6, 1, 1, 0, 0.6, 0.35]); // arretrato: tutti
});

test('passoOcchio: quello che sta sotto il dito segue il dito', async () => {
  const { passoOcchio } = await import('../../js/core/strati-3d-modello.js');
  const vicino = (a, b) => a.every((x, i) => Math.abs(x - b[i]) < 1e-9);
  assert.ok(vicino(passoOcchio(100, 0, 0, 0, 260, 2600), [-10, 0]));   // a destra: l'occhio va a sinistra
  assert.ok(vicino(passoOcchio(0, 100, 0, 0, 260, 2600), [0, -10]));
  assert.ok(vicino(passoOcchio(0, 100, 0, 180, 260, 2600), [0, 10]));  // guardando su il verticale si ribalta
  assert.ok(vicino(passoOcchio(100, 0, 90, 0, 260, 2600), [0, 10]));   // girati di 90°
});

test('trasformaMondo: da fuori come la vista a orbita, da dentro l\'occhio nel punto scelto', async () => {
  const { trasformaMondo } = await import('../../js/core/strati-3d-modello.js');
  assert.equal(trasformaMondo({ tx: 5, ty: -3, tz: 0, a: 25, b: 56, k: 0.5, ex: 0, ey: 0, zt: 100 }),
    'translate3d(5px,-3px,0px) rotateX(56deg) rotateZ(25deg) scale3d(0.5,0.5,0.5) translate3d(0px,0px,-100px)');
  assert.match(trasformaMondo({ tx: 0, ty: 0, tz: 2600, a: 0, b: 180, k: 1, ex: 10, ey: -20, zt: 3000 }),
    /^translate3d\(0px,0px,2600px\) rotateX\(180deg\).*translate3d\(-10px,20px,-3000px\)$/);
});

test('ruotaAttorno: il modello gira sul suo asse, l\'occhio resta dov\'è sullo schermo', async () => {
  const { ruotaAttorno } = await import('../../js/core/strati-3d-modello.js');
  const vicino = (a, b) => a.every((x, i) => Math.abs(x - b[i]) < 1e-9);
  const rot = (deg, [x, y]) => { const t = deg * Math.PI / 180; return [x * Math.cos(t) - y * Math.sin(t), x * Math.sin(t) + y * Math.cos(t)]; };
  assert.deepEqual(ruotaAttorno({ a: 10, ex: 0, ey: 0 }, 30), { a: 40, ex: 0, ey: 0 }); // occhio al centro: solo rotazione
  // la camera vecchia sul modello ruotato vede quello che la camera nuova vede sul modello fermo: Rz(a)(Rz(Δ)p − e) = Rz(a')(p − e')
  const cam = { a: 25, ex: 100, ey: -40 }, delta = 70, nuova = ruotaAttorno(cam, delta);
  for (const p of [[30, 50], [-200, 10], [0, 0]]) {
    const r = rot(delta, p);
    assert.ok(vicino(rot(cam.a, [r[0] - cam.ex, r[1] - cam.ey]), rot(nuova.a, [p[0] - nuova.ex, p[1] - nuova.ey])));
  }
});

test('passoAvanti e pianiAccesi', async () => {
  const { passoAvanti, pianiAccesi, passoOcchio } = await import('../../js/core/strati-3d-modello.js');
  const vicino = (a, b) => a.every((x, i) => Math.abs(x - b[i]) < 1e-9);
  assert.ok(vicino(passoAvanti(0, 10), [0, -10]));       // avanti = verso l'alto dello schermo
  assert.ok(vicino(passoAvanti(0, 0, 10), [10, 0]));
  assert.ok(vicino(passoAvanti(90, 10), [-10, 0]));
  // coerente col trascinamento: andare avanti è come tirare giù il piano
  assert.ok(vicino(passoAvanti(35, 10), passoOcchio(0, 10, 35, 0, 1, 1)));
  assert.deepEqual(pianiAccesi([false, true, false]), [0, 2]);
});

test('zoomDentro: avvicinando si stringe il campo visivo, allontanando si arretra', async () => {
  const { zoomDentro, ZOOM_DENTRO } = await import('../../js/core/strati-3d-modello.js');
  assert.deepEqual(zoomDentro(1, 700, 1000), { P: 700, indietro: 0 });
  assert.deepEqual(zoomDentro(2, 700, 1000), { P: 1400, indietro: 0 });
  assert.deepEqual(zoomDentro(0.5, 700, 1000), { P: 700, indietro: 300 });
  assert.deepEqual(zoomDentro(0.01, 700, 1000), zoomDentro(ZOOM_DENTRO.min, 700, 1000)); // con un tetto
  assert.ok(zoomDentro(ZOOM_DENTRO.min, 700, 1000).indietro > 1500); // abbastanza da vedere la pila da fuori
});

test('movimento continuo: tasti, joystick, accelerazione morbida, nord', async () => {
  const { assiDaTasti, sommaAssi, avvicina, assiJoystick, versoNord, tastoDiMoto } = await import('../../js/core/strati-3d-modello.js');
  assert.deepEqual(assiDaTasti(new Set(['KeyW', 'KeyD'])), { avanti: 1, lato: 0, gira: -1, inclina: 0, zoom: 0 });
  assert.deepEqual(assiDaTasti(new Set(['KeyW', 'ArrowDown'])).avanti, 0);              // opposti si annullano
  assert.deepEqual(assiDaTasti(new Set(['ArrowUp']), true), { avanti: 0, lato: 0, gira: 0, inclina: 1, zoom: 0 }); // Maiusc: inclina
  assert.ok(tastoDiMoto('KeyQ') && !tastoDiMoto('KeyZ'));
  assert.deepEqual(sommaAssi({ avanti: 1 }, { avanti: 0.7, zoom: -0.4 }), { avanti: 1, lato: 0, gira: 0, inclina: 0, zoom: -0.4 });
  // la velocità sale con continuità, senza superare lo scopo, e torna a zero
  const vel = { avanti: 0, lato: 0, gira: 0, inclina: 0, zoom: 0 };
  const v = [];
  for (let i = 0; i < 30; i++) v.push(avvicina(vel, { avanti: 1 }, 1 / 60).avanti);
  assert.ok(v.every((x, i) => i === 0 || x > v[i - 1]) && v.at(-1) < 1 && v.at(-1) > 0.9);
  for (let i = 0; i < 200; i++) avvicina(vel, {}, 1 / 60);
  assert.equal(vel.avanti, 0);
  // joystick: zona morta, pieno sul bordo, su = avanti
  assert.deepEqual(assiJoystick(2, 2, 40), { avanti: 0, lato: 0 });
  const pieno = assiJoystick(0, -40, 40);
  assert.ok(Math.abs(pieno.avanti - 1) < 1e-9 && Math.abs(pieno.lato) < 1e-9);
  assert.ok(assiJoystick(20, 0, 40).lato < 0.5); // curva: a metà corsa meno di metà velocità
  assert.equal(versoNord(30), -30);
  assert.equal(versoNord(350), 10);
  assert.equal(versoNord(-725), 5);
});

test('layerFratelli: i riempimenti invisibili della stessa sorgente', async () => {
  const { layerFratelli } = await import('../../js/core/strati-3d-modello.js');
  const stile = [
    { id: 'confini-circoscrizioni', type: 'line', source: 'confini', 'source-layer': 'circoscrizioni' },
    { id: 'confini-circoscrizioni-hit', type: 'fill', source: 'confini', 'source-layer': 'circoscrizioni' },
    { id: 'confini-quartieri-hit', type: 'fill', source: 'confini', 'source-layer': 'quartieri' },
    { id: 'altro', type: 'line', source: 'confini', 'source-layer': 'circoscrizioni' },
    { id: 'raster', type: 'raster', source: 'r' },
  ];
  assert.deepEqual(layerFratelli(stile, ['confini-circoscrizioni']), ['confini-circoscrizioni-hit']);
  assert.deepEqual(layerFratelli(stile, ['raster']), []);
});

test('attributiFeature: campi parlanti prima, niente id né vuoti, titolo non ripetuto', async () => {
  const { attributiFeature } = await import('../../js/core/strati-3d-modello.js');
  const p = { fid: 3, id: 9, ID1: 9, NOTE: 'x'.repeat(120), TIPO: 'Fascia battigia', DESCRIZION: 'Vincolo di inedificabilità', vuoto: '', obj: { a: 1 }, n: 12345 };
  const a = attributiFeature(p, 4, ['Fascia battigia']);
  assert.deepEqual(a.map(([k]) => k), ['DESCRIZION', 'NOTE', 'n']);
  assert.ok(a[1][1].endsWith('…') && a[1][1].length === 88);
  assert.equal(attributiFeature(p, 1).length, 1);
  assert.deepEqual(attributiFeature(null), []);
});

test('attributiFeature ed etichette: date vuote nascoste, aree in km², campi leggibili', async () => {
  const { attributiFeature, etichettaCampo, etichettaFeature } = await import('../../js/core/strati-3d-modello.js');
  const a = attributiFeature({ Data_dpr: '1899-12-30', Comune: 'Palermo', Area: 20293565.64 }, 4);
  assert.deepEqual(a.map(([k]) => k), ['Comune', 'Area']);
  assert.match(a[1][1], /^20[,.]29 km²$/);
  assert.equal(etichettaCampo('Data_dpr'), 'Data decreto');
  assert.equal(etichettaCampo('foo_bar'), 'foo bar');
  assert.deepEqual(etichettaFeature({ circoscriz: 'III', area: 5 }), { titolo: 'Circoscrizione III', sotto: '' });
});
