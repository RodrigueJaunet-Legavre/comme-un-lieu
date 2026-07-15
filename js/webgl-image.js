// ═══════════════════════════════════════════
// WEBGL IMAGE ENGINE — Comme un Lieu
// ═══════════════════════════════════════════
const GLEngine = (() => {
  const VERT_SRC = `
    attribute vec2 aPosition;
    attribute vec2 aUv;
    varying vec2 vUv;
    void main() {
      vUv = aUv;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const HOVER_FRAG_SRC = `
    precision highp float;
    uniform sampler2D uTexture;
    uniform vec2 uMouse;
    uniform float uHover;
    uniform float uTime;
    varying vec2 vUv;
    void main() {
      vec2 uv = vUv;
      float dist = distance(uv, uMouse);
      float ripple = sin(dist * 35.0 - uTime * 3.0) * 0.015 * uHover * smoothstep(0.6, 0.0, dist);
      vec2 dir = normalize(uv - uMouse + 0.0001);
      vec2 distortedUv = uv + dir * ripple;
      gl_FragColor = texture2D(uTexture, clamp(distortedUv, 0.0, 1.0));
    }
  `;

  const DISSOLVE_FRAG_SRC = `
    precision highp float;
    uniform sampler2D uTextureA;
    uniform sampler2D uTextureB;
    uniform float uProgress;
    varying vec2 vUv;
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    void main() {
      vec2 uv = vUv;
      float noiseEdge = (random(vec2(floor(uv.y * 30.0), 1.0)) - 0.5) * 0.06;
      float edge = uProgress + noiseEdge;
      float mixFactor = smoothstep(edge - 0.015, edge + 0.015, uv.x);
      vec4 colA = texture2D(uTextureA, uv);
      vec4 colB = texture2D(uTextureB, uv);
      gl_FragColor = mix(colA, colB, mixFactor);
    }
  `;

  function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('Erreur shader:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createProgram(gl, vertSrc, fragSrc) {
    const vert = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
    if (!vert || !frag) return null;
    const program = gl.createProgram();
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('Erreur programme:', gl.getProgramInfoLog(program));
      return null;
    }
    return program;
  }

  function createQuad(gl, program) {
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const uvs = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    const aUv = gl.getAttribLocation(program, 'aUv');
    gl.enableVertexAttribArray(aUv);
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);
  }

  function loadTexture(gl, image) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return texture;
  }

  const DPR_CAP = 1.5;
  const supportsWebGL = (() => {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && c.getContext('webgl'));
    } catch (e) { return false; }
  })();

  return { supportsWebGL, VERT_SRC, HOVER_FRAG_SRC, DISSOLVE_FRAG_SRC, compileShader, createProgram, createQuad, loadTexture, DPR_CAP };
})();
