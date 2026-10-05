// js/geoimage/scarica.js
// Scarica un file generato nel browser (KMZ, GeoTIFF, JSON…).
export function scarica(blob, nome) {
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href: url, download: nome }).click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
