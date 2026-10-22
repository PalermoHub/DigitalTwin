// tests/js/esporta-formule.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { csv } from '../../js/core/tabella/esporta.js';

test('csv: i testi che iniziano come una formula hanno un apice, i numeri no', () => {
  const righe = [{ proprieta: { nome: '=1+1', altro: '-ciao', n: -5, ok: 'Nave' } }];
  const colonne = ['nome', 'altro', 'n', 'ok'].map(campo => ({ campo }));
  const [, corpo] = csv(righe, colonne).replace('﻿', '').trim().split('\r\n');
  assert.equal(corpo, "'=1+1,'-ciao,-5,Nave");
});
