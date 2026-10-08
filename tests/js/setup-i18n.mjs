// Precarica i dizionari italiani nei test: i moduli che chiamano t() restituiscono così i testi italiani di sempre.
import { readFileSync } from 'node:fs';
import { impostaDizionari } from '../../js/core/i18n.js';

const it = JSON.parse(readFileSync(new URL('../../js/locales/it.json', import.meta.url), 'utf8'));
impostaDizionari('it', it, it);
