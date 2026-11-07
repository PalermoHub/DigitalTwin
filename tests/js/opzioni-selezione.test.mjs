import test from 'node:test';
import assert from 'node:assert/strict';
import {
  caricaOpzioniSelezione, impostaTooltipSelezione, impostaVoci, tooltipSelezioneAttivo, vociSpente, vocePresente,
  leggiTooltipMappa, salvaTooltipMappa, CHIAVE_TOOLTIP_SELEZIONE, CHIAVE_VOCI_SPENTE, CHIAVE_TOOLTIP_MAPPA,
} from '../../js/core/opzioni-selezione.js';

const finto = (iniziale = {}) => { const m = new Map(Object.entries(iniziale)); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), m }; };

test('senza nulla salvato: dettagli accesi, nessuna voce spenta', () => {
  caricaOpzioniSelezione(finto());
  assert.equal(tooltipSelezioneAttivo(), true);
  assert.equal(vociSpente().size, 0);
});

test('le scelte si salvano e si ritrovano al caricamento successivo', () => {
  const s = finto();
  caricaOpzioniSelezione(s);
  impostaTooltipSelezione(false, s);
  impostaVoci(['Edificio', 'Civico'], false, s);
  impostaVoci(['Civico'], true, s);
  assert.equal(s.m.get(CHIAVE_TOOLTIP_SELEZIONE), '0');
  assert.deepEqual(JSON.parse(s.m.get(CHIAVE_VOCI_SPENTE)), ['Edificio']);
  caricaOpzioniSelezione(finto(Object.fromEntries(s.m)));
  assert.equal(tooltipSelezioneAttivo(), false);
  assert.equal(vocePresente('Edificio'), false);
  assert.equal(vocePresente('Civico'), true);
});

test('dato salvato rovinato o storage bloccato: valori iniziali, nessun errore', () => {
  caricaOpzioniSelezione(finto({ [CHIAVE_VOCI_SPENTE]: '{non json' }));
  assert.equal(vociSpente().size, 0);
  caricaOpzioniSelezione(finto({ [CHIAVE_VOCI_SPENTE]: '"testo"' }));
  assert.equal(vociSpente().size, 0);
  const bloccato = { getItem() { throw new Error('no'); }, setItem() { throw new Error('no'); } };
  caricaOpzioniSelezione(bloccato);
  assert.equal(tooltipSelezioneAttivo(), true);
  impostaVoci(['X'], false, bloccato); // non deve lanciare: vale per la sessione
  assert.equal(vocePresente('X'), false);
  caricaOpzioniSelezione(null);
});

test('tooltip sulla mappa: acceso di default, spento si ricorda', () => {
  const s = finto();
  assert.equal(leggiTooltipMappa(s), true);
  salvaTooltipMappa(false, s);
  assert.equal(s.m.get(CHIAVE_TOOLTIP_MAPPA), '0');
  assert.equal(leggiTooltipMappa(s), false);
});
