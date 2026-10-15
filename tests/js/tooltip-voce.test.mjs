import test from 'node:test';
import assert from 'node:assert/strict';

// document finto: basta per vedere la struttura prodotta, senza browser
class Nodo {
  constructor(tag) { this.tag = tag; this.className = ''; this.textContent = ''; this.figli = []; this.style = { setProperty: (k, v) => { this.vars = { ...this.vars, [k]: v }; } }; }
  append(...x) { this.figli.push(...x); }
}
globalThis.document = { createElement: tag => new Nodo(tag) };
const { disegnaVoceTooltip } = await import('../../js/core/tooltip.js');
const testi = n => (typeof n === 'string' ? [n] : [n.textContent, ...n.figli.flatMap(testi)].filter(Boolean));

test('senza pallino né badge: titolo e sottotitolo come prima', () => {
  const v = disegnaVoceTooltip({ titolo: 'Via Roma', sottotitolo: 'Strada' });
  assert.deepEqual(testi(v), ['Via Roma', 'Strada']);
  assert.equal(v.figli.length, 2);
});

test('con pallino e badge: pallino nel titolo, badge dopo il titolo', () => {
  const v = disegnaVoceTooltip({ titolo: 'U_16 – Nome', pallino: '#e69f00', badge: { testo: 'Accessibile', colore: '#003' } });
  const titolo = v.figli[0];
  assert.equal(titolo.figli[0].className, 'tooltip-pallino');
  assert.equal(titolo.figli[0].style.background, '#e69f00');
  assert.equal(titolo.figli[1], 'U_16 – Nome');
  assert.equal(v.figli[1].className, 'tooltip-badge');
  assert.equal(v.figli[1].textContent, 'Accessibile');
  assert.equal(v.figli[1].vars['--colore'], '#003');
});

test('con un elemento pronto (dom): compare dopo il titolo e il badge', () => {
  const grafico = new Nodo('svg');
  const v = disegnaVoceTooltip({ titolo: 'Kalsa', badge: { testo: 'Trend +27%', colore: '#2e8b2e' }, dom: grafico });
  assert.equal(v.figli.at(-1), grafico);
  assert.equal(disegnaVoceTooltip({ titolo: 'Kalsa' }).figli.length, 1);
});

test('registraTooltipStrati: il simbolo di legenda sta accanto al sottotitolo, non al titolo', async () => {
  const { registraTooltipStrati, contenutoTooltip, campioneTooltip } = await import('../../js/core/tooltip.js');
  const map = {
    on() {}, getLayer: () => true, getLayoutProperty: () => 'visible',
    queryRenderedFeatures: () => [{ properties: { cls: 'P4' }, layer: { id: 'a' } }],
  };
  registraTooltipStrati(map, [{ layers: ['a'], modello: p => ({ titolo: 'PAI', sottotitolo: p.cls }), campione: (p, id) => (p.cls === 'P4' && id === 'a' ? campioneTooltip('legenda-pai', ['pai-campione', { background: '#c00' }]) : null) }]);
  const { corpo } = contenutoTooltip({ point: { x: 0, y: 0 } });
  const voce = corpo.figli[0].figli[0].figli[0];
  const [titolo, dettaglio] = voce.figli;
  assert.equal(titolo.figli.length, 1); // solo il testo del titolo
  const involucro = dettaglio.figli[0];
  assert.match(involucro.className, /legenda legenda-pai/);
  assert.equal(involucro.figli[0].className, 'pai-campione');
  assert.equal(involucro.figli[0].style.background, '#c00');
  assert.equal(dettaglio.figli[1], 'P4');
});

test('con un elenco: una riga di testo per voce sotto il sottotitolo; senza elenco nulla in più', () => {
  const v = disegnaVoceTooltip({ titolo: '3 progetti', sottotitolo: 'Via Roma', elenco: ['M4 · Scuola A', 'M1 · App B'] });
  assert.deepEqual(testi(v), ['3 progetti', 'Via Roma', 'M4 · Scuola A', 'M1 · App B']);
  assert.equal(v.figli.at(-1).className, 'tooltip-elenco');
  assert.equal(disegnaVoceTooltip({ titolo: 'x', elenco: [] }).figli.length, 1);
});

test('elenco con pallino colorato e suggerimento in fondo', () => {
  const v = disegnaVoceTooltip({ titolo: 'T', elenco: [{ testo: 'M4 · A', pallino: '#7048e8' }, 'B'], suggerimento: 'Clicca' });
  const riga = v.figli[1].figli[0];
  assert.equal(riga.figli[0].className, 'tooltip-pallino');
  assert.equal(riga.figli[0].style.background, '#7048e8');
  assert.deepEqual(testi(v), ['T', 'M4 · A', 'B', 'Clicca']);
  assert.equal(v.figli.at(-1).className, 'tooltip-suggerimento');
});
