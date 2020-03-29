'use strict';

const requiredExtensions = [
  // 'OES_texture_float',
  // 'WEBGL_depth_texture',
];

const animationStoppers = new Set();

export function initGLCanvas() {
  console.log('Initializing GL context...')
  const canvas = document.getElementById('canvas');
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

  // HAAAAX
  window.gl = gl;

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

export class PerspectiveCamera {
  constructor(fov, aspect, near, far) {
    this.viewMatrix = mat4.create();
    this.projectionMatrix = mat4.create();
    this.transformMatrix = mat4.create();

    mat4.perspective(this.projectionMatrix, fov, aspect, near, far);

    this._updateCombinedMatrix();
  }

  _updateCombinedMatrix() {
    mat4.mul(this.transformMatrix, this.projectionMatrix, this.viewMatrix);
  }

  lookAt(position, target, orientation) {
    mat4.lookAt(this.viewMatrix, position, target, orientation);
    this._updateCombinedMatrix();
  }
}

class Mesh {
  constructor(data) {
    // TODO: move model matrix here

    this.indicesBuffer = gl.createBuffer();
    this.vertexBuffer = gl.createBuffer();
    this.normalBuffer = gl.createBuffer();
    this.facesCount = 0;

    if (data) {
      this.setData(data);
    }
  }

  setData(data) {
    // TODO: Check length match

    data = data || {};

    if (data.vertices) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, data.vertices.buffer, gl.STATIC_DRAW);
    }

    if (data.normals) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, data.normals.buffer, gl.STATIC_DRAW);
    }

    if (data.indices) {
      this.facesCount = data.indices.length;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.indices.buffer, gl.STATIC_DRAW);
    }
  }

  render(program, camera) {
    const aPosition = gl.getAttribLocation(program, 'aPosition');
    const aNormal = gl.getAttribLocation(program, 'aNormal');

    const transformMatrixUniform = gl.getUniformLocation(program, 'transformMatrix');

    gl.useProgram(program);
    gl.uniformMatrix4fv(transformMatrixUniform, false, camera.transformMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);

    if (aNormal !== -1) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
      gl.enableVertexAttribArray(aNormal);
      gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
    }

    // gl.drawElements(gl.TRIANGLES, this.facesCount, gl.UNSIGNED_SHORT, 0);
    gl.drawArrays(gl.TRIANGLES, 0, this.facesCount);

    if (aNormal !== -1) {
      gl.disableVertexAttribArray(aNormal);
    }

    gl.disableVertexAttribArray(aPosition);
  }
}

export function loadObj(modelUrl) {
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

    return new Mesh({
      vertices: new Float32Array(vertices),
      normals: new Float32Array(normals),
      indices: new Uint16Array(indices),
    });
  });
}
