import test from 'node:test';
import assert from 'node:assert/strict';
import { campioneZona, campioneAmbito, campioneVincolo } from '../../js/layers/legenda-prg.js';

const file = c => c?.immagine;

test('campione PRG: zone con simbolo proprio e famiglie', () => {
  assert.equal(file(campioneZona('B0a')), 'img/prg/zto-b0a.png');
  assert.equal(file(campioneZona('B4b')), 'img/prg/zto-b4b.png');
  assert.equal(file(campioneZona('F10')), 'img/prg/zto-f.png');
  assert.equal(file(campioneZona('IC3IC5')), 'img/prg/zto-ic.png');
  assert.equal(file(campioneZona('S2')), 'img/prg/zto-istruzione.png');
  assert.equal(file(campioneZona('V3')), 'img/prg/zto-verde.png');
  assert.equal(file(campioneZona('VS')), 'img/prg/zto-verde-storico.png');
  assert.equal(file(campioneZona('Parcheggi')), 'img/prg/zto-parcheggi.png');
  assert.equal(campioneZona('B'), undefined);
  assert.equal(campioneZona(null), undefined);
});

test('campione PRG: ambito e vincoli (anche con apostrofo o accento diversi)', () => {
  assert.equal(file(campioneAmbito('Centro storico')), 'img/prg/cs.png');
  assert.equal(file(campioneVincolo('Aree Qanat')), 'img/prg/va-10.png');
  assert.equal(file(campioneVincolo('Fascia di rispetto corsi d’acqua')), 'img/prg/va-19.png');
  assert.equal(file(campioneVincolo('Attivit?? estrattiva')), 'img/prg/va-13.png');
  assert.equal(file(campioneVincolo('Faglie e Sovrascorrimenti', true)), 'img/prg/vl-2.png');
  assert.equal(campioneVincolo('Inesistente'), undefined);
});
