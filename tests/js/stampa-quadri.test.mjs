import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { orientamentoQuadro } from '../../js/core/stampa-quadri.js';
import { SCALE_STAMPA } from '../../js/core/stampa.js';

const dati = JSON.parse(readFileSync(new URL('../../dati/qu/quadri-stampa.json', import.meta.url)));

test('la scala 1:500 è tra quelle di stampa, in ordine crescente', () => {
  assert.equal(SCALE_STAMPA[0], 500);
  assert.deepEqual([...SCALE_STAMPA], [...SCALE_STAMPA].sort((a, b) => a - b));
});
test('quadri: ogni scala ha le sue tavole, a Palermo, con nomi unici e anello chiuso', () => {
  assert.deepEqual(Object.keys(dati).map(Number).sort((a, b) => a - b), [500, 2000, 5000, 10000]);
  for (const [scala, tavole] of Object.entries(dati)) {
    assert.ok(tavole.length > 0, scala);
    assert.equal(new Set(tavole.map(t => t.nome)).size, tavole.length, `nomi doppi a ${scala}`);
    for (const t of tavole) {
      assert.ok(t.centro[0] > 13 && t.centro[0] < 13.6 && t.centro[1] > 37.9 && t.centro[1] < 38.4, `${scala} ${t.nome} fuori Palermo`);
      assert.deepEqual(t.anello[0], t.anello.at(-1));
    }
  }
});
test('orientamentoQuadro: dalla forma in metri, non in gradi', () => {
  const a = (w, h) => ({ centro: [13.3, 38.1], anello: [[13.3, 38.1], [13.3 + w, 38.1], [13.3 + w, 38.1 + h], [13.3, 38.1 + h], [13.3, 38.1]] });
  assert.equal(orientamentoQuadro(a(0.02, 0.012)), 'landscape');
  assert.equal(orientamentoQuadro(a(0.01, 0.02)), 'portrait');
  // stessi gradi in lng e lat: a questa latitudine 1° di lng è più corto, quindi la tavola è più alta che larga
  assert.equal(orientamentoQuadro(a(0.01, 0.01)), 'portrait');
});

import { areaMappaMm, FORMATI } from '../../js/core/stampa.js';
import { areaMappaPoster } from '../../js/core/stampa-poster.js';
import { paginaSuMisura, misureTavolaM, FORMATO_TAVOLA } from '../../js/core/stampa-quadri.js';

for (const uscita of ['stampa', 'png']) {
  test(`paginaSuMisura (${uscita}): l'area di mappa del foglio è esattamente quella chiesta`, () => {
    const t = dati['2000'][0];
    const m = misureTavolaM(t);
    const area = { larghezza: m.larghezza * 1000 / 2000, altezza: m.altezza * 1000 / 2000 };
    const p = paginaSuMisura(area, uscita);
    FORMATI[FORMATO_TAVOLA] = [Math.min(p.larghezza, p.altezza), Math.max(p.larghezza, p.altezza)];
    const direzione = p.larghezza >= p.altezza ? 'landscape' : 'portrait';
    const reale = uscita === 'stampa' ? areaMappaMm(FORMATO_TAVOLA, direzione) : areaMappaPoster(FORMATO_TAVOLA, direzione);
    assert.ok(Math.abs(reale.larghezza - area.larghezza) < 0.01 && Math.abs(reale.altezza - area.altezza) < 0.01, JSON.stringify({ reale, area }));
    delete FORMATI[FORMATO_TAVOLA];
  });
}
