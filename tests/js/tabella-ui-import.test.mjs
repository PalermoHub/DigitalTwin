import test from 'node:test';
import assert from 'node:assert/strict';

// Cattura errori di sintassi, import o dipendenze circolari del cassetto.
test('il cassetto Tabella si importa e espone collegaTabella', async () => {
  const indice = await import('../../js/core/tabella/index.js');
  const ui = await import('../../js/core/tabella/ui.js');
  assert.equal(typeof indice.collegaTabella, 'function');
  assert.equal(indice.collegaTabella, ui.collegaTabella);
});
