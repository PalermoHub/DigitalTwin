// Indirizzi per condividere un link sulle reti più usate. Puro.
export const TESTO_CONDIVISIONE = 'Palermo Digital Twin: la mia vista della mappa';

const enc = encodeURIComponent;
export const RETI = [
  { id: 'whatsapp', nome: 'WhatsApp', url: (l, t) => `https://wa.me/?text=${enc(`${t} ${l}`)}` },
  { id: 'telegram', nome: 'Telegram', url: (l, t) => `https://t.me/share/url?url=${enc(l)}&text=${enc(t)}` },
  { id: 'facebook', nome: 'Facebook', url: l => `https://www.facebook.com/sharer/sharer.php?u=${enc(l)}` },
  { id: 'x', nome: 'X', url: (l, t) => `https://twitter.com/intent/tweet?url=${enc(l)}&text=${enc(t)}` },
  { id: 'linkedin', nome: 'LinkedIn', url: l => `https://www.linkedin.com/sharing/share-offsite/?url=${enc(l)}` },
  { id: 'email', nome: 'Email', url: (l, t) => `mailto:?subject=${enc(t)}&body=${enc(`${t}\n${l}`)}` },
];
