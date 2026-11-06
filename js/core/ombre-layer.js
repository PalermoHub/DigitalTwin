// Custom layer MapLibre 3D delle ombre (portato dal progetto `ombre`): le ombre sono disegnate su una griglia di triangoli
// che poggia sul terreno. Il vertex shader legge la quota dal DTM (dtm.png) e posiziona i vertici
// con l'inversa pixel -> Web Mercator; il fragment shader risale al pixel del DSM con la mappatura
// diretta (polinomio grado 2) e decide se e' in ombra.
import { ZH, MAX_OMBRA_M } from './ombre-sole.js';
import { SHADOW_GLSL, sunUniforms, program, caricaTexture } from './ombre-shader.js';

const MERC_HALF = 20037508.342789244;
const GRID_STEP = 3;      // un vertice ogni 3 pixel del DSM (15 m): segue il rilievo quasi come la mesh di MapLibre
const MASK_T = 4096;      // lato della texture-maschera (ridotto al limite della GPU)
const MAX_SHADOW_M = MAX_OMBRA_M;
const CLIP_M = 12;        // saturazione del margine d'ombra, in metri (come CLIP nello shader)
const HMAX_M = 127.5;     // fondo scala della quota del raggio d'ombra nella maschera
const LIFT_TETTO_M = 0.25; // i tetti sovrapposti stanno 25 cm sopra quelli di MapLibre (campionamento del DEM diverso)
const LIFT_M = 0.3;       // sollevamento geometrico minimo: piu' di cosi' crea parallasse (3 m = ~7 px a zoom 18, pitch 62); il resto lo fa polygonOffset

const VS = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
// Posizione calcolata RELATIVA al centro della mappa: la parte grande della trasformazione (matrice per
// coordinate Mercator globali, valori di decine di milioni) si fa in doppia precisione in JS e arriva come
// u_clipC; allo shader restano solo scarti piccoli. Cosi' il risultato (e la profondita') non dipende da
// come una GPU fa le moltiplicazioni in float32.
uniform vec4 u_clipC;         // matrice * (centro mappa, z = 0, 1), calcolato in JS
uniform vec4 u_m0, u_m1, u_m2; // prime tre colonne della matrice
uniform vec2 u_rel_c;         // centro mappa in metri Mercator relativi al centro del fit (est, nord)
uniform sampler2D u_dtm;
uniform ivec2 u_size;
uniform int u_nx;
uniform int u_gstep;
uniform float u_unit_per_m;   // unita' mercator per metro Web Mercator (orizzontale)
uniform float u_z_unit_per_m; // unita' mercator per metro di quota
uniform float u_exag;         // esagerazione del rilievo di MapLibre (0 = rilievo spento: terreno a quota 0)
uniform float u_scale;
uniform float u_px[6];
uniform float u_py[6];
uniform float u_lift;
out vec2 v_rel;
void main() {
  int i = gl_VertexID % u_nx;
  int j = gl_VertexID / u_nx;
  int c = min(i * u_gstep, u_size.x - 1);
  int r = min(j * u_gstep, u_size.y - 1);
  vec2 uv = vec2(float(min(i * u_gstep, u_size.x)), float(min(j * u_gstep, u_size.y))) / vec2(u_size);
  float t[6] = float[6](1.0, uv.y, uv.y * uv.y, uv.x, uv.x * uv.y, uv.x * uv.x);
  vec2 rel = vec2(0.0);
  for (int k = 0; k < 6; k++) rel += vec2(u_px[k], u_py[k]) * t[k];
  rel *= u_scale;                                   // metri Web Mercator dal centro
  vec4 h = texelFetch(u_dtm, ivec2(c, r), 0);
  float z = (floor(h.r * 255.0 + 0.5) * 256.0 + floor(h.g * 255.0 + 0.5)) * 0.1;
  v_rel = rel;
  vec2 d = vec2(rel.x - u_rel_c.x, -(rel.y - u_rel_c.y)) * u_unit_per_m;   // scarto piccolo, in unita' Mercator
  gl_Position = u_clipC + u_m0 * d.x + u_m1 * d.y + u_m2 * ((z * u_exag + u_lift) * u_z_unit_per_m);
}`;

// Ombre degli edifici, vettoriali: ogni spigolo di muro A-B, spostato lungo la direzione opposta al sole
// di h / tan(elevazione), e' un quadrilatero; l'unione dei quadrilateri e' l'ombra esatta di un prisma.
// Si disegna in una texture "maschera" allineata al nord (spazio mappa), con blend MAX per non
// sommare le sovrapposizioni. Bordi dritti e nitidi, costo indipendente dal ray-march.
const VS_MASK = `#version 300 es
precision highp float;
precision highp int;
layout(location = 0) in ivec2 a_a;   // punto A, centimetri, relativo al centro del fit (est, nord)
layout(location = 1) in ivec2 a_d;   // B - A, centimetri
layout(location = 2) in uint a_h;    // altezza, decimetri
uniform vec2 u_origin;               // angolo sud-ovest della finestra, metri
uniform float u_win;                 // lato della finestra, metri
uniform vec2 u_off;                  // metri Web Mercator di spostamento per metro di altezza
uniform float u_maxlen;
out float v_h;                       // quota (m) del raggio d'ombra: h sullo spigolo, 0 in punta
void main() {
  vec2 A = vec2(a_a) * 0.01;
  vec2 B = A + vec2(a_d) * 0.01;
  // Solo gli spigoli sul lato in ombra: normale uscente (dy, -dx) concorde con la direzione dell'ombra.
  // I loro quadrilateri coprono l'ombra fuori dall'impronta; quelli sul lato del sole spazzerebbero l'impronta.
  if (dot(vec2(a_d.y, -a_d.x), u_off) <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  vec2 off = u_off * float(a_h) * 0.1;
  float l = length(off);
  if (l > u_maxlen) off *= u_maxlen / l;
  int id = gl_VertexID;
  vec2 p = id == 0 ? A : id == 1 ? B : id == 2 ? A + off : B + off;
  v_h = id < 2 ? float(a_h) * 0.1 : 0.0;
  gl_Position = vec4((p - u_origin) / u_win * 2.0 - 1.0, 0.0, 1.0);
}`;

// R = copertura (ombra a terra), G = quota del raggio d'ombra in unita' di 1/HMAX_M (per le ombre sui tetti).
// Il blend MAX tiene, per ogni cella, il raggio piu' alto fra tutti gli edifici.
const FS_MASK = `#version 300 es
precision highp float;
in float v_h;
out vec4 o;
void main() { o = vec4(1.0, min(v_h * ${1 / HMAX_M}, 1.0), 0.0, 1.0); }`;

// Passaggio offscreen: per ogni cella della texture del margine (a risoluzione piena o dimezzata)
// calcola il margine d'ombra col ray-march e lo scrive in 8 bit, riscalato da [-CLIP, +CLIP] a [0, 1].
const VS_CALC = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));  // triangolo a tutto schermo
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FS_CALC = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
${SHADOW_GLSL}
uniform float u_inv_scale;   // 1 / risoluzione relativa della texture del margine
uniform float u_clip;
out vec4 o;
void main() {
  ivec2 p = min(ivec2(floor(gl_FragCoord.xy * u_inv_scale)), u_size - 1);
  float m = shadowMargin(p.x, p.y, u_clip);
  o = vec4((m + u_clip) / (2.0 * u_clip), 0.0, 0.0, 1.0);
}`;

// Passaggio di disegno (a ogni frame): legge il margine gia' calcolato. Il filtro bilineare della
// texture da' bordi lisci, e il costo non dipende dalla lunghezza dell'ombra ne' dalla camera.
const FS = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
in vec2 v_rel;
uniform ivec2 u_size;
uniform float u_scale;
uniform float u_col[6];
uniform float u_row[6];
uniform vec4 u_color;
uniform sampler2D u_margin;
uniform sampler2D u_mask0;   // ombre degli edifici, dettaglio fine (vicino alla camera)
uniform sampler2D u_mask1;   // idem, 4 volte piu' larga e meno fine
uniform vec3 u_win0;         // origine est, origine nord, lato (metri) della finestra fine
uniform vec3 u_win1;
uniform bool u_terr;         // ombra del rilievo attiva (sole sopra l'orizzonte)
out vec4 o;

const float CLIP = 12.0;  // metri: saturazione del margine (deve coincidere con CLIP_M in JS)

void main() {
  float x = v_rel.x / u_scale, y = v_rel.y / u_scale;
  float t[6] = float[6](1.0, y, y * y, x, x * y, x * x);
  float col = 0.0, row = 0.0;
  for (int i = 0; i < 6; i++) { col += u_col[i] * t[i]; row += u_row[i] * t[i]; }
  if (col < 0.0 || row < 0.0 || col >= float(u_size.x) || row >= float(u_size.y)) discard;
  float m = -CLIP;
  if (u_terr) m = texture(u_margin, vec2(col, row) / vec2(u_size)).r * (2.0 * CLIP) - CLIP;
  float aa = max(fwidth(m) * 0.75, 0.01);
  float alpha = smoothstep(-aa, aa, m);
  // Edifici: maschera fine se la posizione ci sta dentro, altrimenti quella larga.
  vec2 g0 = (v_rel - u_win0.xy) / u_win0.z;
  vec2 g1 = (v_rel - u_win1.xy) / u_win1.z;
  float b = 0.0;
  if (all(greaterThan(g0, vec2(0.02))) && all(lessThan(g0, vec2(0.98)))) b = texture(u_mask0, g0).r;
  else if (all(greaterThan(g1, vec2(0.0))) && all(lessThan(g1, vec2(1.0)))) b = texture(u_mask1, g1).r;
  alpha = max(alpha, b);
  if (alpha <= 0.0) discard;
  o = vec4(u_color.rgb * u_color.a * alpha, u_color.a * alpha);  // alpha premoltiplicato
}`;

// Ombre sui tetti: la mesh di ogni tetto (piatto) sta alla quota del terreno al baricentro + altezza, come
// le estrusioni di MapLibre. Il fragment legge la maschera (R copertura, G quota del raggio d'ombra) e
// scurisce il tetto dove il raggio sta piu' in alto del tetto.
const VS_TETTI = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
layout(location = 0) in ivec2 a_p;   // vertice, centimetri, relativo al centro del fit (est, nord)
layout(location = 1) in uint a_h;    // altezza del tetto, decimetri
layout(location = 2) in ivec2 a_o;   // baricentro - vertice, decimetri
uniform vec4 u_clipC;
uniform vec4 u_m0, u_m1, u_m2;
uniform vec2 u_rel_c;
uniform sampler2D u_dtm;
uniform ivec2 u_size;
uniform float u_unit_per_m;
uniform float u_z_unit_per_m;
uniform float u_exag;
uniform float u_scale;
uniform float u_col[6];
uniform float u_row[6];
uniform float u_lift;
out vec2 v_rel;
out float v_h;
void main() {
  vec2 rel = vec2(a_p) * 0.01;
  vec2 cen = (rel + vec2(a_o) * 0.1) / u_scale;
  float t[6] = float[6](1.0, cen.y, cen.y * cen.y, cen.x, cen.x * cen.y, cen.x * cen.x);
  float col = 0.0, row = 0.0;
  for (int i = 0; i < 6; i++) { col += u_col[i] * t[i]; row += u_row[i] * t[i]; }
  ivec2 c = clamp(ivec2(floor(vec2(col, row))), ivec2(0), u_size - 1);
  vec4 q = texelFetch(u_dtm, c, 0);
  float z = (floor(q.r * 255.0 + 0.5) * 256.0 + floor(q.g * 255.0 + 0.5)) * 0.1;
  float h = float(a_h) * 0.1;
  v_rel = rel;
  v_h = h;
  vec2 d = vec2(rel.x - u_rel_c.x, -(rel.y - u_rel_c.y)) * u_unit_per_m;
  gl_Position = u_clipC + u_m0 * d.x + u_m1 * d.y + u_m2 * ((z * u_exag + h + u_lift) * u_z_unit_per_m);
}`;

const FS_TETTI = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 v_rel;
in float v_h;
uniform sampler2D u_mask0;
uniform sampler2D u_mask1;
uniform vec3 u_win0;
uniform vec3 u_win1;
uniform vec4 u_color;
out vec4 o;
void main() {
  vec2 g0 = (v_rel - u_win0.xy) / u_win0.z;
  vec2 g1 = (v_rel - u_win1.xy) / u_win1.z;
  vec2 s;
  if (all(greaterThan(g0, vec2(0.02))) && all(lessThan(g0, vec2(0.98)))) s = texture(u_mask0, g0).rg;
  else if (all(greaterThan(g1, vec2(0.0))) && all(lessThan(g1, vec2(1.0)))) s = texture(u_mask1, g1).rg;
  else discard;
  float d = s.g * ${HMAX_M} - v_h - 0.1;   // metri di raggio d'ombra sopra il tetto
  float aa = max(fwidth(d) * 0.75, 0.05);
  float alpha = smoothstep(-aa, aa, d) * step(0.001, s.r);
  if (alpha <= 0.0) discard;
  o = vec4(u_color.rgb * u_color.a * alpha, u_color.a * alpha);
}`;

export class ShadowLayer {
  constructor(meta, urls, mercatorCoordinate) {
    this.id = 'ombre';
    this.type = 'custom';
    this.renderingMode = '3d';
    this.meta = meta;
    this.urls = urls; // { dtm, spigoli, tetti }
    this.MercatorCoordinate = mercatorCoordinate;
    this.sun = { az: 180, el: 45 };
    this.color = [0.04, 0.06, 0.2, 0.5];
    this.maxSteps = 1024;
    this.scale = 0.5;
    this.dirty = true;
    this.maskKey = '';
    this.nSpigoli = 0;
    this.marg = {};  // texture del margine per risoluzione: { 1: {tex, fbo, w, h, ok}, 0.5: ... }
    this.ready = false;
    this.pronto = new Promise((ok, no) => { this._ok = ok; this._no = no; }); // risolta quando DTM, spigoli e tetti sono caricati
    this.exag = 0;     // esagerazione del rilievo corrente (0 = rilievo spento)
    this.lift = LIFT_M;
    // Scala verticale dei custom layer con rilievo. Misurata in browser (4 punti, pitch 60) confrontando la
    // proiezione della griglia con map.project() di MapLibre: con maplibre-gl 4.7.1 vale 1 (scarto < 0,1 px);
    // con 1/cos(lat) la griglia saliva di 8-12 m sopra il terreno (valeva per la 5.x). Versione pinnata in js/.
    this.zk = 1;
  }

  // Durante lo slider o il play (cambi ravvicinati) il margine si calcola a meta' risoluzione; a sole
  // fermo da 250 ms si rifinisce a risoluzione di base.
  setSun(az, el) {
    const ora = performance.now();
    const rapido = ora - (this.lastSet ?? -1e9) < 400;
    this.lastSet = ora;
    this.sun = { az, el };
    this.scale = rapido ? 0.25 : 0.5;
    this.dirty = true;
    clearTimeout(this.refineTimer);
    if (this.scale < 0.5) {
      this.refineTimer = setTimeout(() => { this.scale = 0.5; this.dirty = true; this.map?.triggerRepaint(); }, 250);
    }
    this.map?.triggerRepaint();
  }

  setColor(rgba) {
    this.color = rgba;
    this.map?.triggerRepaint();
  }

  // Mesh dei tetti: si scarica solo quando le ombre si accendono (10 MB compressi).
  async caricaTetti() {
    if (!this.gl || !this.urls.tetti || this.tettiPromessa) return;
    this.tettiPromessa = (async () => {
      try {
        const gl = this.gl;
        const r = await fetch(this.urls.tetti);
        if (!r.ok) throw new Error('tetti ' + r.status);
        const buf = await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
        const [nv, ni] = new Uint32Array(buf, 0, 2);
        this.progTetti = program(gl, VS_TETTI, FS_TETTI);
        this.vaoTetti = gl.createVertexArray();
        gl.bindVertexArray(this.vaoTetti);
        this.vboTetti = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vboTetti);
        gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(buf, 8, nv * 16), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0); gl.vertexAttribIPointer(0, 2, gl.INT, 16, 0);
        gl.enableVertexAttribArray(1); gl.vertexAttribIPointer(1, 1, gl.UNSIGNED_SHORT, 16, 8);
        gl.enableVertexAttribArray(2); gl.vertexAttribIPointer(2, 2, gl.SHORT, 16, 10);
        this.iboTetti = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iboTetti);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(buf, 8 + nv * 16, ni * 4), gl.STATIC_DRAW);
        gl.bindVertexArray(null);
        this.nIndiciTetti = ni;
        this.map?.triggerRepaint();
      } catch (e) {
        console.warn('ombre sui tetti non disponibili:', e); // i18n-ok
        this.nIndiciTetti = 0;
      }
    })();
    return this.tettiPromessa;
  }

  // Secondo passaggio, da chiamare dopo gli edifici estrusi: scurisce i tetti in ombra.
  renderTetti(gl, matrix) {
    if (!this.ready || !this.nIndiciTetti || !this.nSpigoli || this.sun.el <= 0) return;
    this._leggiRilievo();
    const m = matrix?.defaultProjectionData ? matrix.defaultProjectionData.mainMatrix : matrix;
    const mp = this.meta.mercator_to_pixel;
    const [cx, cy] = mp.centro_mercator;
    const center = this.MercatorCoordinate.fromLngLat([13.348, 38.137]);
    const mc = this.MercatorCoordinate.fromLngLat(this.map.getCenter());
    const cu = [0.5 + cx / (2 * MERC_HALF), 0.5 - cy / (2 * MERC_HALF)];
    const clipC = [0, 1, 2, 3].map((i) => m[i] * mc.x + m[4 + i] * mc.y + m[12 + i]);
    gl.useProgram(this.progTetti);
    const U = (n) => gl.getUniformLocation(this.progTetti, n);
    gl.uniform4f(U('u_clipC'), clipC[0], clipC[1], clipC[2], clipC[3]);
    gl.uniform4f(U('u_m0'), m[0], m[1], m[2], m[3]);
    gl.uniform4f(U('u_m1'), m[4], m[5], m[6], m[7]);
    gl.uniform4f(U('u_m2'), m[8], m[9], m[10], m[11]);
    gl.uniform2f(U('u_rel_c'), (mc.x - cu[0]) * 2 * MERC_HALF, -(mc.y - cu[1]) * 2 * MERC_HALF);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.dtm); gl.uniform1i(U('u_dtm'), 0);
    gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, this.mask[0].tex); gl.uniform1i(U('u_mask0'), 4);
    gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, this.mask[1].tex); gl.uniform1i(U('u_mask1'), 5);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform3fv(U('u_win0'), this.mask[0].win);
    gl.uniform3fv(U('u_win1'), this.mask[1].win);
    gl.uniform2i(U('u_size'), this.meta.width, this.meta.height);
    gl.uniform1f(U('u_unit_per_m'), 1 / (2 * MERC_HALF));
    gl.uniform1f(U('u_z_unit_per_m'), center.meterInMercatorCoordinateUnits() * this.zk);
    gl.uniform1f(U('u_exag'), this.exag);
    gl.uniform1f(U('u_scale'), mp.scala);
    gl.uniform1fv(U('u_col'), mp.col);
    gl.uniform1fv(U('u_row'), mp.row);
    gl.uniform1f(U('u_lift'), LIFT_TETTO_M);
    const fade = Math.min(1, this.sun.el / 3);
    gl.uniform4f(U('u_color'), this.color[0], this.color[1], this.color[2], this.color[3] * fade);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(-1, -4);
    gl.bindVertexArray(this.vaoTetti);
    gl.drawElements(gl.TRIANGLES, this.nIndiciTetti, gl.UNSIGNED_INT, 0);
    gl.bindVertexArray(null);
    gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.depthMask(true);
  }

  async onAdd(map, gl) {
    try { await this._avvia(map, gl); } catch (e) { this._no(e); throw e; }
  }

  async _avvia(map, gl) {
    this.map = map;
    this.gl = gl;
    this.prog = program(gl, VS, FS);
    this.progCalc = program(gl, VS_CALC, FS_CALC);
    this.vaoVuoto = gl.createVertexArray();
    this.progMask = program(gl, VS_MASK, FS_MASK);
    this.maskT = Math.min(MASK_T, gl.getParameter(gl.MAX_TEXTURE_SIZE));
    this.maskFloat = !!(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'));
    const { width: W, height: H } = this.meta;
    const nx = Math.ceil(W / GRID_STEP) + 1;
    const ny = Math.ceil(H / GRID_STEP) + 1;
    this.nx = nx;
    const idx = new Uint32Array((nx - 1) * (ny - 1) * 6);
    let k = 0;
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
        idx[k++] = a; idx[k++] = b; idx[k++] = c;
        idx[k++] = b; idx[k++] = d; idx[k++] = c;
      }
    }
    this.count = idx.length;
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    this.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    this.dtm = await caricaTexture(gl, this.urls.dtm);
    await this._caricaSpigoli(gl);
    this.ready = true;
    this._ok();
    this.caricaTetti();
    map.triggerRepaint();
  }

  async _caricaSpigoli(gl) {
    const r = await fetch(this.urls.spigoli);
    if (!r.ok) throw new Error('spigoli ' + r.status);
    const buf = await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    this.spigoliBuf = buf;
    this.nSpigoli = buf.byteLength / 16;
    this.vboSpigoli = gl.createBuffer();
    this.vaoSpigoli = gl.createVertexArray();
    gl.bindVertexArray(this.vaoSpigoli);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboSpigoli);
    gl.bufferData(gl.ARRAY_BUFFER, buf, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribIPointer(0, 2, gl.INT, 16, 0); gl.vertexAttribDivisor(0, 1);
    gl.enableVertexAttribArray(1); gl.vertexAttribIPointer(1, 2, gl.SHORT, 16, 8); gl.vertexAttribDivisor(1, 1);
    gl.enableVertexAttribArray(2); gl.vertexAttribIPointer(2, 1, gl.UNSIGNED_SHORT, 16, 12); gl.vertexAttribDivisor(2, 1);
    gl.bindVertexArray(null);
    // Due livelli: uno fine attorno alla camera e uno 4 volte piu' largo.
    this.mask = [0, 1].map(() => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      // RG16F se la GPU lo rende (quota senza scalini); altrimenti RG8 (scalini da 0,5 m).
      if (this.maskFloat) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG16F, this.maskT, this.maskT, 0, gl.RG, gl.HALF_FLOAT, null);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG8, this.maskT, this.maskT, 0, gl.RG, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      return { tex, fbo, win: [0, 0, 1] };
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  // Esagerazione del rilievo di MapLibre in questo istante (0 se il rilievo 3D e' spento).
  _leggiRilievo() {
    const t = this.map.getTerrain?.();
    this.exag = t ? (t.exaggeration ?? 1) : 0;
  }

  // Finestre delle due maschere attorno al centro della mappa, agganciate a una griglia per non ridisegnare a ogni pixel di pan.
  _finestre() {
    const [cx0, cy0] = this.meta.mercator_to_pixel.centro_mercator;
    const c = this.MercatorCoordinate.fromLngLat(this.map.getCenter());
    const e = (c.x - 0.5) * 2 * MERC_HALF - cx0, n = (0.5 - c.y) * 2 * MERC_HALF - cy0;
    const mpp = (2 * MERC_HALF) / (512 * 2 ** this.map.getZoom());   // metri Web Mercator per pixel CSS
    const r0 = Math.min(2, Math.max(0.125, 2 ** (Math.round(Math.log2(mpp * 0.7) * 2) / 2)));
    return [r0, r0 * 4].map((r) => {
      const w = this.maskT * r, snap = w / 8;
      return [Math.floor((e - w / 2) / snap) * snap, Math.floor((n - w / 2) / snap) * snap, w];
    });
  }

  // Ridisegna le maschere se il sole o la finestra sono cambiati.
  _aggiornaMaschere(gl) {
    const fin = this._finestre();
    const key = `${this.sun.az.toFixed(3)}|${this.sun.el.toFixed(3)}|${fin.flat().join(',')}`;
    if (key === this.maskKey) return;
    this.maskKey = key;
    const prevFbo = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    const prevVp = gl.getParameter(gl.VIEWPORT);
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.disable(gl.SCISSOR_TEST);
    gl.viewport(0, 0, this.maskT, this.maskT);
    gl.useProgram(this.progMask);
    const U = (n) => gl.getUniformLocation(this.progMask, n);
    const az = (this.sun.az * Math.PI) / 180;
    const k = ZH / Math.tan((Math.max(this.sun.el, 0.3) * Math.PI) / 180);   // metri Mercator di ombra per metro di altezza
    gl.uniform2f(U('u_off'), -Math.sin(az) * k, -Math.cos(az) * k);          // direzione opposta al sole (est, nord)
    gl.uniform1f(U('u_maxlen'), MAX_SHADOW_M);
    gl.bindVertexArray(this.vaoSpigoli);
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.MAX);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.colorMask(true, true, true, true);
    gl.clearColor(0, 0, 0, 0);
    this.mask.forEach((m, i) => {
      m.win = fin[i];
      gl.bindFramebuffer(gl.FRAMEBUFFER, m.fbo);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(U('u_origin'), fin[i][0], fin[i][1]);
      gl.uniform1f(U('u_win'), fin[i][2]);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.nSpigoli);
    });
    gl.blendEquation(gl.FUNC_ADD);
    gl.bindVertexArray(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, prevFbo);
    gl.viewport(prevVp[0], prevVp[1], prevVp[2], prevVp[3]);
  }

  // Texture R8 (+ framebuffer) per il margine, alla risoluzione relativa `sc`.
  _margineTex(gl, sc) {
    if (this.marg[sc]) return this.marg[sc];
    const w = Math.ceil(this.meta.width * sc), h = Math.ceil(this.meta.height * sc);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, w, h, 0, gl.RED, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return (this.marg[sc] = { tex, fbo, w, h });
  }

  // Ray-march sull'intero DSM verso il sole corrente, scritto nella texture del margine.
  _calcolaMargine(gl) {
    const sc = this.scale;
    const prevFbo = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    const prevVp = gl.getParameter(gl.VIEWPORT);
    const m = this._margineTex(gl, sc);
    gl.bindFramebuffer(gl.FRAMEBUFFER, m.fbo);
    gl.viewport(0, 0, m.w, m.h);
    gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.disable(gl.SCISSOR_TEST);
    gl.useProgram(this.progCalc);
    const U = (n) => gl.getUniformLocation(this.progCalc, n);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.dtm);  // il ray-march sul DTM ombreggia solo il rilievo; gli edifici sono vettoriali
    gl.uniform1i(U('u_dsm'), 0);
    gl.uniform2i(U('u_size'), this.meta.width, this.meta.height);
    const u = sunUniforms(this.meta, this.sun.az, this.sun.el, this.maxSteps);
    gl.uniform2f(U('u_step'), u.step[0], u.step[1]);
    gl.uniform1f(U('u_drop'), Math.max(u.drop, 1e-6));
    gl.uniform1f(U('u_maxh'), u.maxh);
    gl.uniform1i(U('u_maxsteps'), u.maxsteps);
    gl.uniform1f(U('u_inv_scale'), 1 / sc);
    gl.uniform1f(U('u_clip'), CLIP_M);
    gl.bindVertexArray(this.vaoVuoto);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, prevFbo);
    gl.viewport(prevVp[0], prevVp[1], prevVp[2], prevVp[3]);
    this.margineScala = sc;
    this.dirty = false;
  }

  render(gl, matrix) {
    if (!this.ready) return;
    // Sole sotto l'orizzonte: niente ombre solari (e niente velo a tutto schermo).
    if (this.sun.el <= 0) return;
    this._leggiRilievo();
    if (this.dirty) this._calcolaMargine(gl);
    this._aggiornaMaschere(gl);
    const m = matrix?.defaultProjectionData ? matrix.defaultProjectionData.mainMatrix : matrix;
    this.lastMatrix = m;
    const mp = this.meta.mercator_to_pixel, inv = this.meta.pixel_to_mercator;
    const U = (n) => gl.getUniformLocation(this.prog, n);
    const [cx, cy] = mp.centro_mercator;
    const center = this.MercatorCoordinate.fromLngLat([13.348, 38.137]);
    gl.useProgram(this.prog);
    // Trasformazione in doppia precisione: centro mappa -> clip, e centro mappa in metri relativi al fit.
    const mc = this.MercatorCoordinate.fromLngLat(this.map.getCenter());
    const cu = [0.5 + cx / (2 * MERC_HALF), 0.5 - cy / (2 * MERC_HALF)];   // centro del fit, unita' Mercator
    const clipC = [0, 1, 2, 3].map((i) => m[i] * mc.x + m[4 + i] * mc.y + m[12 + i]);
    gl.uniform4f(U('u_clipC'), clipC[0], clipC[1], clipC[2], clipC[3]);
    gl.uniform4f(U('u_m0'), m[0], m[1], m[2], m[3]);
    gl.uniform4f(U('u_m1'), m[4], m[5], m[6], m[7]);
    gl.uniform4f(U('u_m2'), m[8], m[9], m[10], m[11]);
    gl.uniform2f(U('u_rel_c'), (mc.x - cu[0]) * 2 * MERC_HALF, -(mc.y - cu[1]) * 2 * MERC_HALF);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, (this.marg[this.margineScala] ?? this._margineTex(gl, 1)).tex);
    gl.uniform1i(U('u_margin'), 3);
    gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, this.mask[0].tex); gl.uniform1i(U('u_mask0'), 4);
    gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, this.mask[1].tex); gl.uniform1i(U('u_mask1'), 5);
    gl.uniform3fv(U('u_win0'), this.mask[0].win);
    gl.uniform3fv(U('u_win1'), this.mask[1].win);
    gl.uniform1i(U('u_terr'), 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.dtm);
    gl.uniform1i(U('u_dtm'), 2);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform2i(U('u_size'), this.meta.width, this.meta.height);
    gl.uniform1i(U('u_nx'), this.nx);
    gl.uniform1i(U('u_gstep'), GRID_STEP);
    gl.uniform1f(U('u_unit_per_m'), 1 / (2 * MERC_HALF));
    gl.uniform1f(U('u_z_unit_per_m'), center.meterInMercatorCoordinateUnits() * this.zk);
    gl.uniform1f(U('u_exag'), this.exag);
    gl.uniform1f(U('u_lift'), this.lift);
    gl.uniform1f(U('u_scale'), mp.scala);
    gl.uniform1fv(U('u_px'), inv.x);
    gl.uniform1fv(U('u_py'), inv.y);
    gl.uniform1fv(U('u_col'), mp.col);
    gl.uniform1fv(U('u_row'), mp.row);
    // Crepuscolo: le ombre si dissolvono negli ultimi 3 gradi prima dell'orizzonte (sole radente = ombre lunghissime e tenui).
    const fade = Math.min(1, this.sun.el / 3);
    gl.uniform4f(U('u_color'), this.color[0], this.color[1], this.color[2], this.color[3] * fade);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    // Scarto di profondita' (non di posizione): evita che la griglia affondi nel rilievo senza spostare l'ombra sullo schermo.
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(-1, -4);
    gl.bindVertexArray(this.vao);
    gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_INT, 0);
    gl.bindVertexArray(null);
    gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.depthMask(true);
  }

  onRemove(map, gl) {
    if (this.dtm) gl.deleteTexture(this.dtm);
    for (const m of Object.values(this.marg)) { gl.deleteTexture(m.tex); gl.deleteFramebuffer(m.fbo); }
    gl.deleteProgram(this.progCalc);
    gl.deleteProgram(this.progMask);
    for (const m of this.mask ?? []) { gl.deleteTexture(m.tex); gl.deleteFramebuffer(m.fbo); }
    if (this.vboSpigoli) { gl.deleteBuffer(this.vboSpigoli); gl.deleteVertexArray(this.vaoSpigoli); }
    if (this.progTetti) {
      gl.deleteProgram(this.progTetti); gl.deleteBuffer(this.vboTetti); gl.deleteBuffer(this.iboTetti);
      gl.deleteVertexArray(this.vaoTetti);
    }
    gl.deleteVertexArray(this.vaoVuoto);
    clearTimeout(this.refineTimer);
    gl.deleteBuffer(this.ibo);
    gl.deleteVertexArray(this.vao);
    gl.deleteProgram(this.prog);
  }
}

// Layer da aggiungere DOPO gli edifici estrusi: disegna l'ombra sui tetti usando le maschere di ShadowLayer.
export class RoofShadowLayer {
  constructor(shadow) {
    this.id = 'ombre-tetti';
    this.type = 'custom';
    this.renderingMode = '3d';
    this.shadow = shadow;
  }
  onAdd() {}
  render(gl, matrix) { this.shadow.renderTetti(gl, matrix); }
}
