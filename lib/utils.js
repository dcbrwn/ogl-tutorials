import { Mesh } from "./Mesh.js";

const requiredExtensions = [
  // 'OES_texture_float',
  // 'WEBGL_depth_texture',
];

/** @type {Set<() => void>} */
const animationStoppers = new Set();

export function initGLCanvas() {
  console.log('Initializing GL context...')
  const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('canvas'));
  const gl = canvas.getContext('webgl2');

  if (!gl) {
    throw 'WebGL is not supported';
  }

  for (const extensionId of requiredExtensions) {
    const extension = gl.getExtension(extensionId);

    if (!extension) {
      throw `GL context doesn\'t support ${extensionId}`;
    }

    console.log(`${extensionId} supported`);
  }

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  console.log("GL ready");

  window.onbeforeunload = () => {
    console.log("Releasing GL context...");

    for (const animationStopper of animationStoppers) {
      animationStopper();
    }

    const ext = gl.getExtension("WEBGL_lose_context");
    ext.loseContext();
  }

  return { gl, canvas };
}

export function initGL() {
  const { gl } = initGLCanvas();

  return gl;
}

export function setRenderFunc(func) {
  let prevTime = Date.now();
  let handlerId;

  function render() {
    let currentTime = Date.now();
    const deltaTime = currentTime - prevTime;
    prevTime = currentTime;

    func(deltaTime);
    handlerId = requestAnimationFrame(render);
  }

  render();

  function animationStopper() {
    animationStoppers.delete(animationStopper);
    cancelAnimationFrame(handlerId);
  }

  animationStoppers.add(animationStopper);

  return animationStopper;
}

export function fetchText(url) {
  return fetch(url).then((res) => res.text());
}

export function fetchJson(url) {
  return fetch(url).then((res) => res.json());
}

export function loadProgram(gl, vertexShaderUrl, fragmentShaderUrl) {
  const program = gl.createProgram();
  let vertexShader;
  let fragmentShader;

  return Promise
    .all([
      fetchText(vertexShaderUrl),
      fetchText(fragmentShaderUrl),
    ])
    .then((shaders) => {
      vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, shaders[0]);
      gl.compileShader(vertexShader);

      if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        throw 'Could not compile vertex shader:\n' + gl.getShaderInfoLog(vertexShader);
      }

      fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader, shaders[1]);
      gl.compileShader(fragmentShader);

      if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        throw 'Could not compile fragment shader:\n' + gl.getShaderInfoLog(fragmentShader);
      }

      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw 'Could not compile WebGL program:\n' + gl.getProgramInfoLog(program);
      }

      return program;
    })
    .catch((error) => {
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      throw error;
    });
}

/**
 *
 * @param {WebGL2RenderingContext} gl
 * @param {string} modelUrl
 */
export function loadObj(gl, modelUrl) {
  // TODO: Support multiobject .obj

  const faceFormat = /(\d+)\/(?:\d+)?\/(\d+)/;

  return fetchText(modelUrl).then((text) => {
    function directivePriority(directive) {
      if (directive.indexOf('v ') === 0) {
        return 0;
      } else if (directive.indexOf('vn ') === 0) {
        return 1;
      } else if (directive.indexOf('f ') === 0) {
        return 2;
      }

      return 3;
    }
    const directives = text.split('\n');
    const rawVertices = [];
    const rawNormals = [];

    const vertices = [];
    const normals = [];
    const indices = [];

    function addVertex(x, y, z) {
      rawVertices.push([x, y, z]);
    }

    function addNormal(x, y, z) {
      rawNormals.push([x, y, z]);
    }

    function addAttributes(vertexIndex, textureIndex, normalIndex) {
      // TODO: Handle duplicate vertices to enable drawElements

      vertices.push(rawVertices[vertexIndex][0]);
      vertices.push(rawVertices[vertexIndex][1]);
      vertices.push(rawVertices[vertexIndex][2]);

      normals.push(rawNormals[normalIndex][0]);
      normals.push(rawNormals[normalIndex][1]);
      normals.push(rawNormals[normalIndex][2]);

      indices.push(indices.length);
    }

    for (let i = 0, len = directives.length; i < len; i += 1) {
      const directive = directives[i].split(' ');

      switch(directive[0]) {
        case 'v':
          addVertex(
            parseFloat(directive[1]),
            parseFloat(directive[2]),
            parseFloat(directive[3]));
          break;
        case 'vn':
          addNormal(
            parseFloat(directive[1]),
            parseFloat(directive[2]),
            parseFloat(directive[3]));
          break;
        case 'f':
          let match;
          let vertexIndex;
          let textureIndex;
          let normalIndex;

          match = faceFormat.exec(directive[1]);
          vertexIndex = parseInt(match[1]) - 1;
          textureIndex = null;
          normalIndex = parseInt(match[2]) - 1;
          addAttributes(vertexIndex, textureIndex, normalIndex);

          match = faceFormat.exec(directive[2]);
          vertexIndex = parseInt(match[1]) - 1;
          textureIndex = null;
          normalIndex = parseInt(match[2]) - 1;
          addAttributes(vertexIndex, textureIndex, normalIndex);

          match = faceFormat.exec(directive[3]);
          vertexIndex = parseInt(match[1]) - 1;
          textureIndex = null;
          normalIndex = parseInt(match[2]) - 1;
          addAttributes(vertexIndex, textureIndex, normalIndex);
      }
    }

    return new Mesh(gl, {
      vertices: new Float32Array(vertices),
      normals: new Float32Array(normals),
      indices: new Uint16Array(indices),
    });
  });
}
