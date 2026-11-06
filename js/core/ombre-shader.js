// GLSL condiviso tra il layer della mappa e la pagina di validazione.
// Ray-march verso il sole sul DSM (texture RG = quota in decimetri, 16 bit): un pixel per passo
// lungo l'asse dominante della direzione del sole, interpolazione lineare sulla coordinata
// trasversale. Stessa geometria dello sweep Python in pipeline/shadow.py.

export const SHADOW_GLSL = `
uniform sampler2D u_dsm;   // qui: il DTM (terreno nudo)
uniform ivec2 u_size;      // larghezza, altezza della texture
uniform vec2 u_step;       // (colonne, righe) per passo; la componente dominante vale +-1
uniform float u_drop;      // caduta del raggio per passo, in metri (tan(elev) * lunghezza passo)
uniform float u_maxh;      // quota massima del DSM
uniform int u_maxsteps;

const float NO_OBSTACLE = -1e9;

float dsmAt(int c, int r) {
  if (c < 0 || r < 0 || c >= u_size.x || r >= u_size.y) return NO_OBSTACLE;
  vec4 t = texelFetch(u_dsm, ivec2(c, r), 0);
  return (floor(t.r * 255.0 + 0.5) * 256.0 + floor(t.g * 255.0 + 0.5)) * 0.1;
}

// Vero se il pixel (c, r) della texture e' in ombra.
bool inShadow(int c, int r) {
  float d0 = dsmAt(c, r);
  bool colDominant = abs(u_step.x) >= abs(u_step.y);
  for (int k = 1; k <= u_maxsteps; k++) {
    float drop = float(k) * u_drop;
    if (drop > u_maxh - d0) return false;  // il raggio ha superato ogni ostacolo possibile
    float h;
    if (colDominant) {
      float y = float(r) + float(k) * u_step.y;
      int cc = c + k * int(u_step.x);
      int y0 = int(floor(y));
      float f = y - float(y0);
      float a = dsmAt(cc, y0), b = dsmAt(cc, y0 + 1);
      h = (a <= NO_OBSTACLE || b <= NO_OBSTACLE) ? NO_OBSTACLE : mix(a, b, f);
    } else {
      float x = float(c) + float(k) * u_step.x;
      int rr = r + k * int(u_step.y);
      int x0 = int(floor(x));
      float f = x - float(x0);
      float a = dsmAt(x0, rr), b = dsmAt(x0 + 1, rr);
      h = (a <= NO_OBSTACLE || b <= NO_OBSTACLE) ? NO_OBSTACLE : mix(a, b, f);
    }
    if (h - drop > d0) return true;
  }
  return false;
}

// Margine continuo (metri): di quanto il raggio piu alto verso il sole supera la quota del pixel.
// > 0 = in ombra (stesso criterio di inShadow), < 0 = illuminato. Saturato a +-clipM.
float shadowMargin(int c, int r, float clipM) {
  float d0 = dsmAt(c, r);
  float best = -clipM;
  bool colDominant = abs(u_step.x) >= abs(u_step.y);
  for (int k = 1; k <= u_maxsteps; k++) {
    float drop = float(k) * u_drop;
    if (drop > u_maxh - d0) break;
    float h;
    if (colDominant) {
      float y = float(r) + float(k) * u_step.y;
      int cc = c + k * int(u_step.x);
      int y0 = int(floor(y));
      float f = y - float(y0);
      float a = dsmAt(cc, y0), b = dsmAt(cc, y0 + 1);
      h = (a <= NO_OBSTACLE || b <= NO_OBSTACLE) ? NO_OBSTACLE : mix(a, b, f);
    } else {
      float x = float(c) + float(k) * u_step.x;
      int rr = r + k * int(u_step.y);
      int x0 = int(floor(x));
      float f = x - float(x0);
      float a = dsmAt(x0, rr), b = dsmAt(x0 + 1, rr);
      h = (a <= NO_OBSTACLE || b <= NO_OBSTACLE) ? NO_OBSTACLE : mix(a, b, f);
    }
    if (h > NO_OBSTACLE) {
      best = max(best, h - drop - d0);
      if (best >= clipM) return clipM;
    }
  }
  return best;
}
`;

// Parametri dei uniform per un dato sole. azimuth: gradi dal nord vero (orario); elevation: gradi.
export function sunUniforms(meta, azimuth, elevation, maxSteps = 1024) {
  const az = ((azimuth + meta.north_rotation_deg) * Math.PI) / 180;
  const dcol = Math.sin(az);
  const drow = -Math.cos(az);
  const dom = Math.max(Math.abs(dcol), Math.abs(drow));
  const step = [dcol / dom, drow / dom];
  const [px, py] = meta.pixel_m;
  const lung = Math.hypot(px * step[0], py * step[1]);
  return {
    step,
    drop: Math.tan((elevation * Math.PI) / 180) * lung,
    maxh: meta.quota_max_m,
    maxsteps: maxSteps,
  };
}

export function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

export function program(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}

// Carica un PNG a 16 bit (R,G) come texture senza alcuna conversione di colore, filtro NEAREST.
export async function caricaTexture(gl, url) {
  const blob = await (await fetch(url)).blob();
  const img = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}
