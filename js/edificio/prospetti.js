// Prospetti sulle facciate: un layer MapLibre «custom» che disegna con three.js i disegni dei prospetti (solo le linee,
// il bianco è trasparente) come pareti verticali appena fuori dal filo dei muri estrusi. Dati: prospetti.json, scritto
// da scripts/edificio/crociferi.py (spigoli sinistro e destro visti da fuori, altezza in metri, immagine PNG).
// three.js si carica solo qui, alla prima accensione.

export const ID_PROSPETTI = 'edificio-prospetti';

// Vertici di una facciata in coordinate Mercator relative all'origine: [sinistra terra, destra terra, destra cima, sinistra cima].
export function verticiFacciata(da, a, altezza, origine, mercator) {
  const p = (lnglat, z) => {
    const m = mercator(lnglat, z);
    return [m.x - origine.x, m.y - origine.y, m.z - origine.z];
  };
  return [p(da, 0), p(a, 0), p(a, altezza), p(da, altezza)];
}

export async function creaLayerProspetti(base, prospetti, centro) {
  const THREE = await import('../vendor/three.module.min.js');
  const mercator = (ll, z) => maplibregl.MercatorCoordinate.fromLngLat(ll, z);
  const origine = mercator(centro, 0);
  let renderer, scena, camera;
  return {
    id: ID_PROSPETTI,
    type: 'custom',
    renderingMode: '3d',
    onAdd(map, gl) {
      camera = new THREE.Camera();
      scena = new THREE.Scene();
      const caricatore = new THREE.TextureLoader();
      for (const f of prospetti) {
        const v = verticiFacciata(f.da, f.a, f.altezza, origine, mercator).flat();
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
        g.setIndex([0, 1, 2, 0, 2, 3]);
        const tex = caricatore.load(base + f.immagine, () => map.triggerRepaint());
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide });
        scena.add(new THREE.Mesh(g, mat));
      }
      renderer = new THREE.WebGLRenderer({ canvas: map.getCanvas(), context: gl, antialias: true });
      renderer.autoClear = false;
    },
    render(gl, matrice) {
      camera.projectionMatrix = new THREE.Matrix4().fromArray(matrice)
        .multiply(new THREE.Matrix4().makeTranslation(origine.x, origine.y, origine.z));
      renderer.resetState();
      renderer.render(scena, camera);
    },
    onRemove() {
      scena?.traverse(o => { o.geometry?.dispose(); o.material?.map?.dispose(); o.material?.dispose(); });
    },
  };
}
