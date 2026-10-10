import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESET, CAMPI, CAMPI_EXTRA, FONT, DIMENSIONE, TIPOGRAFIA_STANDARD, normalizza, mescola, contrasto, variabili, NOMI_VARIABILI, controlli, validaColori, validaTipografia, variabiliTipografia, applica, applicaTipografia, leggi, leggiTipografia, salva, esporta, importa } from '../../js/core/tema-interfaccia.js';

const memoria = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k) }; };
const radiceFinta = () => { const p = new Map(); return { p, style: { setProperty: (k, v) => p.set(k, v), removeProperty: k => p.delete(k) } }; };

test('normalizza: hex corto e maiuscolo, rifiuta il resto', () => {
  assert.equal(normalizza('#ABC'), '#aabbcc');
  assert.equal(normalizza(' #1B1F24 '), '#1b1f24');
  assert.equal(normalizza('rosso'), null);
  assert.equal(normalizza(12), null);
});

test('contrasto: bianco su nero è 21, uguale a sé stesso è 1', () => {
  assert.ok(Math.abs(contrasto('#ffffff', '#000000') - 21) < 0.01);
  assert.equal(contrasto('#336699', '#336699'), 1);
  assert.equal(mescola('#000000', '#ffffff', 0.5), '#808080');
});

test('ogni preset ha i cinque colori validi e testo e link leggibili sullo sfondo', () => {
  assert.ok(Object.keys(PRESET).length >= 20);
  for (const [nome, c] of Object.entries(PRESET)) {
    assert.deepEqual(validaColori(c), c, nome);
    for (const k of controlli(c).filter(x => x.id !== 'accento')) assert.ok(k.ok, `${nome}: ${k.id} ${k.rapporto.toFixed(2)}`);
  }
});

test('variabili: tutte le derivate sono definite e il testo sull\'accento si legge', () => {
  for (const [nome, c] of Object.entries(PRESET)) {
    const v = variabili(c);
    assert.deepEqual(Object.keys(v), NOMI_VARIABILI);
    assert.equal(v['--surface'], c.sfondo);
    assert.ok(contrasto(v['--accent-ink'], c.accento) >= 4.5, `${nome}: testo su accento`);
    assert.ok(contrasto(v['--accent-strong'], c.sfondo) >= 4.5 || contrasto(v['--accent-strong'], c.sfondo) >= contrasto(c.accento, c.sfondo), `${nome}: accento forte`);
  }
});

test('controlli segnala testo illeggibile', () => {
  const c = controlli({ ...PRESET.chiaro, testo: '#f0f0f0' });
  assert.equal(c.find(x => x.id === 'testo').ok, false);
});

test('validaColori scarta temi incompleti o con colori non validi', () => {
  assert.equal(validaColori({ ...PRESET.chiaro, link: 'blu' }), null);
  assert.equal(validaColori({ sfondo: '#fff' }), null);
  assert.equal(validaColori(null), null);
  assert.equal(validaColori({ ...PRESET.chiaro, testo: '#ABC' }).testo, '#aabbcc');
});

test('applica imposta e toglie le variabili; dice se lo sfondo è scuro', () => {
  const r = radiceFinta();
  assert.equal(applica(r, PRESET.scuro), true);
  assert.equal(r.p.get('--surface'), '#1c2128');
  assert.equal(r.p.size, NOMI_VARIABILI.length);
  assert.equal(applica(r, PRESET.chiaro), false);
  assert.equal(applica(r, null), null);
  assert.equal(r.p.size, 0);
});

test('salva/leggi nel browser e pulizia', () => {
  const m = memoria();
  assert.equal(leggi(m), null);
  salva(m, PRESET.mare);
  assert.deepEqual(leggi(m), PRESET.mare);
  assert.deepEqual(leggiTipografia(m), TIPOGRAFIA_STANDARD);
  const grezzo = JSON.parse(m.getItem('dt-tema-ui'));
  assert.equal(grezzo.scuro, false); // lo legge lo script in <head>
  assert.equal(grezzo.vars['--surface'], PRESET.mare.sfondo);
  salva(m, null);
  assert.equal(leggi(m), null);
  assert.equal(leggi({ getItem: () => '{rotto' }), null);
});

test('file JSON: esporta e importa danno gli stessi colori; file estranei rifiutati', () => {
  assert.deepEqual(importa(esporta(PRESET.notte)).colori, PRESET.notte);
  assert.throws(() => importa('non json'), /JSON/);
  assert.throws(() => importa('{"tipo":"altro","versione":1}'), /tema dell'interfaccia/);
  assert.throws(() => importa(JSON.stringify({ tipo: 'dt-tema-interfaccia', versione: 2, colori: { sfondo: '#fff' } })), /colori validi/);
  assert.deepEqual(CAMPI, Object.keys(PRESET.chiaro));
});

test('colori avanzati: opzionali, validati, sempre presenti tra le variabili', () => {
  assert.deepEqual(CAMPI_EXTRA, ['positivo', 'pericolo', 'avviso', 'evidenza', 'dati']);
  const c = validaColori({ ...PRESET.chiaro, pericolo: '#ABC', evidenza: 'rosa' });
  assert.equal(c.pericolo, '#aabbcc');
  assert.equal('evidenza' in c, false); // valore non valido: si scarta, il tema resta valido
  assert.equal(variabili(c)['--pericolo'], '#aabbcc');
  assert.equal(variabili(PRESET.chiaro)['--evidenza'], '#e6007e');
  assert.equal(variabili(PRESET.scuro)['--pericolo'], '#f87171'); // senza scelta, il valore dipende da sfondo chiaro/scuro
  for (const n of ['--positivo', '--pericolo', '--avviso', '--evidenza', '--blu-dati']) assert.ok(NOMI_VARIABILI.includes(n), n);
});

test('tipografia: dimensione limitata a 85-150 a passi interi, font solo tra quelli noti', () => {
  assert.deepEqual(validaTipografia(null), TIPOGRAFIA_STANDARD);
  assert.equal(validaTipografia({ dimensione: 500, font: 'montserrat' }).dimensione, DIMENSIONE.max);
  assert.equal(validaTipografia({ dimensione: 10, font: 'montserrat' }).dimensione, DIMENSIONE.min);
  assert.equal(validaTipografia({ dimensione: 'x', font: 'montserrat' }).dimensione, 100);
  assert.equal(validaTipografia({ dimensione: 112.6, font: 'montserrat' }).dimensione, 113);
  assert.equal(validaTipografia({ dimensione: 100, font: 'comic' }).font, 'montserrat');
  for (const f of ['montserrat', 'sistema', 'serif', 'mono', 'atkinson']) assert.ok(FONT[f], f);
});

test('tipografia: variabili CSS solo se diversa dallo standard; applicaTipografia le imposta e toglie', () => {
  assert.deepEqual(variabiliTipografia(TIPOGRAFIA_STANDARD), {});
  assert.deepEqual(variabiliTipografia({ dimensione: 120, font: 'montserrat' }), { '--scala-testo': '1.2' });
  const v = variabiliTipografia({ dimensione: 100, font: 'serif' });
  assert.match(v['--font-ui'], /Georgia/);
  const r = radiceFinta();
  applicaTipografia(r, { dimensione: 130, font: 'mono' });
  assert.equal(r.p.get('--scala-testo'), '1.3');
  applicaTipografia(r, TIPOGRAFIA_STANDARD);
  assert.equal(r.p.size, 0);
});

test('memoria: tipografia sola, senza colori, e script in <head> non tocca il tema chiaro/scuro', () => {
  const m = memoria();
  salva(m, null, { dimensione: 125, font: 'atkinson' });
  assert.equal(leggi(m), null);
  assert.deepEqual(leggiTipografia(m), { dimensione: 125, font: 'atkinson' });
  const g = JSON.parse(m.getItem('dt-tema-ui'));
  assert.equal(g.scuro, null);
  assert.equal(g.vars['--scala-testo'], '1.25');
  assert.equal(g.versione, 2);
  salva(m, null, TIPOGRAFIA_STANDARD);
  assert.equal(m.getItem('dt-tema-ui'), null);
});

test('compatibilità: la memoria e i file della versione 1 si leggono ancora', () => {
  const m = memoria();
  m.setItem('dt-tema-ui', JSON.stringify({ versione: 1, colori: PRESET.mare, vars: {}, scuro: false }));
  assert.deepEqual(leggi(m), PRESET.mare);
  assert.deepEqual(leggiTipografia(m), TIPOGRAFIA_STANDARD);
  const r = importa(JSON.stringify({ tipo: 'dt-tema-interfaccia', versione: 1, colori: PRESET.bosco }));
  assert.deepEqual(r.colori, PRESET.bosco);
  assert.deepEqual(r.tipografia, TIPOGRAFIA_STANDARD);
});

test('file JSON versione 2: porta anche tipografia e colori avanzati', () => {
  const colori = { ...PRESET.sepia, positivo: '#00aa00' };
  const r = importa(esporta(colori, { dimensione: 110, font: 'serif' }));
  assert.deepEqual(r.colori, colori);
  assert.deepEqual(r.tipografia, { dimensione: 110, font: 'serif' });
});
