import test from 'node:test';
import assert from 'node:assert/strict';
import { calcolaSoglie, etichetteClassi, coloriRampa, rilevaAttributi, espressioneAttributo, validaAttributo } from '../../js/core/tema-attributo.js';
import { leggiMatch, riscriviMatch, comeEsadecimale, validaTema, partiStrato, applicaTema, leggiTemi, salvaTemi, esportaTemi, importaTemi } from '../../js/core/tema.js';

function finta(layers) {
  const paint = {};
  return {
    paint,
    getLayer: id => layers[id] && { type: layers[id].type },
    getPaintProperty: (id, p) => (`${id}|${p}` in paint ? paint[`${id}|${p}`] : layers[id].paint?.[p]),
    setPaintProperty: (id, p, v) => { paint[`${id}|${p}`] = v; },
  };
}

test('comeEsadecimale: hex corto, rgb, espressioni e assenti', () => {
  assert.equal(comeEsadecimale('#ABC'), '#aabbcc');
  assert.equal(comeEsadecimale('rgb(255, 0, 16)'), '#ff0010');
  assert.equal(comeEsadecimale(['get', 'c'], '#123456'), '#123456');
  assert.equal(comeEsadecimale(undefined), '#888888');
});

test('validaTema scarta i campi non validi', () => {
  assert.deepEqual(validaTema({ riempimento: '#FF0000', bordo: 'rosso', spessore: 2 }), { riempimento: '#ff0000', spessore: 2 });
  assert.equal(validaTema({ spessore: 99 }), null);
  assert.equal(validaTema(null), null);
});

test('partiStrato: salta i layer di sola selezione (opacità 0) e quelli assenti', () => {
  const map = finta({ f: { type: 'fill', paint: { 'fill-opacity': 0.5 } }, hit: { type: 'fill', paint: { 'fill-opacity': 0 } }, l: { type: 'line' }, c: { type: 'circle' } });
  assert.deepEqual(partiStrato(map, ['f', 'hit', 'l', 'c', 'x']), { riempimenti: ['f'], punti: ['c'], uniformi: ['f', 'c'], categorie: [], linee: ['l'], lineeColore: ['l'] });
});

test('applicaTema colora e ripristina l\'originale', () => {
  const map = finta({ f: { type: 'fill', paint: { 'fill-color': ['get', 'c'] } }, l: { type: 'line', paint: { 'line-width': 2 } } });
  const parti = { riempimenti: ['f'], punti: [], uniformi: [], categorie: [], linee: ['l'], lineeColore: ['l'] };
  const orig = new Map();
  applicaTema(map, parti, undefined, orig);
  assert.deepEqual(map.paint, {}); // niente tema, niente modifiche
  applicaTema(map, parti, { riempimento: '#ff0000', bordo: '#00ff00', spessore: 3 }, orig);
  assert.equal(map.paint['f|fill-color'], undefined); // il colore per dato non si sovrascrive con un colore solo
  assert.equal(map.paint['f|fill-outline-color'], '#00ff00');
  assert.equal(map.paint['l|line-color'], '#00ff00');
  assert.equal(map.paint['l|line-width'], 3);
  applicaTema(map, parti, { bordo: '#0000ff' }, orig);
  assert.equal(map.paint['l|line-width'], 2);
  applicaTema(map, parti, null, orig);
  assert.equal(map.paint['f|fill-outline-color'], null);
});

test('punti e linee: colore, bordo e spessore senza poligoni', () => {
  const map = finta({
    p: { type: 'circle', paint: { 'circle-color': '#111111', 'circle-stroke-color': '#fff' } },
    hit: { type: 'circle', paint: { 'circle-opacity': 0 } },
    l: { type: 'line', paint: { 'line-color': '#222222', 'line-width': 2 } },
    lh: { type: 'line', paint: { 'line-opacity': 0 } },
    lm: { type: 'line', paint: { 'line-color': ['match', ['get', 'k'], 'A', '#0000ff', '#555555'] } },
  });
  const parti = partiStrato(map, ['p', 'hit', 'l', 'lh', 'lm']);
  assert.deepEqual(parti.punti, ['p']);
  assert.deepEqual(parti.uniformi, ['p']);
  assert.deepEqual(parti.linee, ['l', 'lm']);
  assert.deepEqual(parti.lineeColore, ['l']); // la linea per categoria non si sovrascrive
  assert.equal(parti.categorie[0].id, 'lm');
  const orig = new Map();
  applicaTema(map, parti, { riempimento: '#aa0000', bordo: '#00aa00', spessore: 4, categorie: { A: '#123456' } }, orig);
  assert.equal(map.paint['p|circle-color'], '#aa0000');
  assert.equal(map.paint['p|circle-stroke-color'], '#00aa00');
  assert.equal(map.paint['l|line-color'], '#00aa00');
  assert.equal(map.paint['l|line-width'], 4);
  assert.equal(map.paint['lm|line-color'][3], '#123456');
  applicaTema(map, parti, null, orig);
  assert.equal(map.paint['p|circle-color'], '#111111');
  assert.equal(map.paint['l|line-color'], '#222222');
});

test('attributo: classi, rampe, espressioni e validazione', () => {
  assert.deepEqual(calcolaSoglie([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5, 'intervalli'), [2.8, 4.6, 6.4, 8.2]);
  assert.deepEqual(calcolaSoglie([1, 1, 1, 9, 9, 9], 3, 'quantili'), [9]); // soglie ripetute o pari al minimo scartate
  assert.deepEqual(calcolaSoglie([5, 5, 5], 4), []);
  assert.deepEqual(etichetteClassi([10, 20]), ['< 10', '10 – 20', '≥ 20']);
  assert.equal(coloriRampa('Blu', 3).length, 3);
  const campi = rilevaAttributi([{ properties: { a: 'x', n: 1, m: 2, nul: null } }, { properties: { a: 'y', n: 5, m: 'z' } }]);
  assert.deepEqual([...campi.get('a').valori], ['x', 'y']);
  assert.equal(campi.get('n').numerico, true);
  assert.equal(campi.get('m').numerico, false);
  assert.equal(campi.has('nul'), false);
  assert.deepEqual(espressioneAttributo({ campo: 'a', tipo: 'categorie', colori: { x: '#ff0000' } }), ['match', ['to-string', ['get', 'a']], 'x', '#ff0000', '#cccccc']);
  const g = espressioneAttributo({ campo: 'n', tipo: 'graduata', rampa: 'Blu', soglie: [2, 4] });
  assert.equal(g[0], 'case');
  assert.deepEqual(g[2].slice(0, 2), ['step', ['get', 'n']]);
  assert.equal(validaAttributo({ campo: 'n', tipo: 'graduata', soglie: [3, 2] }), null);
  assert.equal(validaAttributo({ campo: 'a', tipo: 'categorie', colori: { x: 'rosso' } }), null);
  assert.equal(validaAttributo({ campo: 'n', tipo: 'graduata', rampa: 'Boh', soglie: [1] }).rampa, 'Blu');
  const t = { attributo: { campo: 'a', tipo: 'categorie', colori: { x: '#FF0000' } } };
  assert.deepEqual(importaTemi(esportaTemi({ m: t })), { m: { attributo: { campo: 'a', tipo: 'categorie', colori: { x: '#FF0000' } } } });
});

test('attributo prevale su riempimento e categorie e si ripristina', () => {
  const map = finta({
    f: { type: 'fill', paint: { 'fill-color': MATCH, 'fill-opacity': 0.8 } },
    g: { type: 'fill', paint: { 'fill-color': '#111111' } },
    l: { type: 'line', paint: { 'line-color': '#222222' } },
  });
  const parti = partiStrato(map, ['f', 'g', 'l']);
  const orig = new Map();
  const attributo = { campo: 'a', tipo: 'categorie', colori: { x: '#ff0000' } };
  applicaTema(map, parti, { riempimento: '#abcdef', bordo: '#00ff00', attributo }, orig);
  assert.equal(map.paint['f|fill-color'][0], 'match');
  assert.deepEqual(map.paint['g|fill-color'], map.paint['f|fill-color']);
  assert.equal(map.paint['l|line-color'], '#00ff00'); // con i poligoni la linea resta un bordo
  applicaTema(map, parti, { riempimento: '#abcdef' }, orig);
  assert.deepEqual(map.paint['f|fill-color'], MATCH);
  assert.equal(map.paint['g|fill-color'], '#abcdef');
  const soloLinee = finta({ l: { type: 'line', paint: { 'line-color': '#222222' } } });
  const p2 = partiStrato(soloLinee, ['l']);
  applicaTema(soloLinee, p2, { attributo }, new Map());
  assert.equal(soloLinee.paint['l|line-color'][0], 'match');
});

test('salvataggio: round trip e storage assente o rotto', () => {
  const dati = {};
  const storage = { getItem: k => dati[k] ?? null, setItem: (k, v) => { dati[k] = v; } };
  salvaTemi(storage, { a: { riempimento: '#ff0000' } });
  assert.deepEqual(leggiTemi(storage), { a: { riempimento: '#ff0000' } });
  assert.deepEqual(leggiTemi(null), {});
  assert.doesNotThrow(() => salvaTemi(null, {}));
  assert.deepEqual(leggiTemi({ getItem: () => '{rotto' }), {});
});

test('file JSON: export e import validano il contenuto', () => {
  const t = { a: { riempimento: '#ff0000', spessore: 1.5 } };
  assert.deepEqual(importaTemi(esportaTemi(t)), t);
  assert.throws(() => importaTemi('non json'), /non è un JSON/);
  assert.throws(() => importaTemi('{"versione":2,"strati":{}}'), /non è un tema/);
  assert.throws(() => importaTemi('{"versione":1,"strati":{"a":{"bordo":"x"}}}'), /nessun|non contiene/i);
});

const MATCH = ['match', ['get', 'cat'], 'A', '#111111', 'B', '#222222', '#555'];

test('leggiMatch riconosce il colore per categoria e scarta il resto', () => {
  assert.deepEqual(leggiMatch(MATCH), { campo: 'cat', voci: [['A', '#111111'], ['B', '#222222']], ripiego: '#555' });
  assert.equal(leggiMatch('#fff'), null);
  assert.equal(leggiMatch(['interpolate', ['linear'], ['zoom'], 1, '#000', 2, '#fff']), null);
  assert.equal(leggiMatch(['match', ['zoom'], 1, '#000', '#fff']), null);
});

test('riscriviMatch cambia solo le categorie indicate', () => {
  assert.deepEqual(riscriviMatch(MATCH, { B: '#ff0000' }), ['match', ['get', 'cat'], 'A', '#111111', 'B', '#ff0000', '#555']);
  assert.deepEqual(MATCH[5], '#222222'); // l'originale non cambia
});

test('categorie: ogni categoria ha il suo colore e le altre restano', () => {
  const map = finta({ f: { type: 'fill', paint: { 'fill-color': MATCH, 'fill-opacity': 0.8 } }, p: { type: 'circle', paint: { 'circle-color': MATCH } } });
  const parti = partiStrato(map, ['f', 'p']);
  assert.deepEqual(parti.uniformi, []);
  assert.equal(parti.categorie.length, 2);
  const orig = new Map();
  applicaTema(map, parti, { riempimento: '#abcdef', categorie: { A: '#00ff00' } }, orig);
  assert.deepEqual(map.paint['f|fill-color'], ['match', ['get', 'cat'], 'A', '#00ff00', 'B', '#222222', '#555']);
  assert.deepEqual(map.paint['p|circle-color'], ['match', ['get', 'cat'], 'A', '#00ff00', 'B', '#222222', '#555']);
  applicaTema(map, parti, null, orig);
  assert.deepEqual(map.paint['f|fill-color'], MATCH);
});

test('validaTema e file JSON conservano i colori per categoria', () => {
  const t = { m: { categorie: { Chiese: '#ff0000', Rotto: 'x' } } };
  assert.deepEqual(validaTema(t.m), { categorie: { Chiese: '#ff0000' } });
  assert.deepEqual(importaTemi(esportaTemi({ m: { categorie: { Chiese: '#ff0000' } } })), { m: { categorie: { Chiese: '#ff0000' } } });
});
