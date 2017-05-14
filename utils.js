'use strict';

function initGL() {
  const canvas = document.getElementById('canvas');
  const gl = canvas.getContext("webgl");

  if (!gl) {
    throw 'WebGL is not supported';
  }

  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // HAAAAX
  window.gl = gl;

  return gl;
}

function setRenderFunc(func) {
  let prevTime = Date.now();

  function render() {
    let currentTime = Date.now();
    const deltaTime = currentTime - prevTime;
    prevTime = currentTime;

    func(deltaTime);
    requestAnimationFrame(render);
  }

  render();
}

function fetchText(url) {
  return fetch(url).then((res) => res.text());
}

function fetchJson(url) {
  return fetch(url).then((res) => res.json());
}

function loadProgram(gl, vertexShaderUrl, fragmentShaderUrl) {
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
        throw 'Could not compile vertex shader:\n' + gl.getShaderInfoLog(fragmentShader);
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

class PerspectiveCamera {
  constructor(fov, aspect, near, far) {
    this.modelMatrix = mat4.create();
    this.viewMatrix = mat4.create();
    this.projectionMatrix = mat4.create();
    this.transformMatrix = mat4.create();

    mat4.perspective(this.projectionMatrix, fov, aspect, near, far);

    this._updateCombinedMatrix();
  }

  _updateCombinedMatrix() {
    mat4.mul(this.transformMatrix, this.viewMatrix, this.modelMatrix);
    mat4.mul(this.transformMatrix, this.projectionMatrix, this.transformMatrix);
  }

  lookAt(position, target, orientation) {
    mat4.lookAt(
      this.viewMatrix,
      position,
      target,
      orientation
    );
    this._updateCombinedMatrix();
  }
}

class Mesh {
  constructor(data) {
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
    const aPosition = gl.getAttribLocation(program, "aPosition");
    const aNormal = gl.getAttribLocation(program, "aNormal");

    const transformMatrixUniform = gl.getUniformLocation(program, "transformMatrix");

    gl.useProgram(program);
    gl.uniformMatrix4fv(transformMatrixUniform, false, camera.transformMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.enableVertexAttribArray(aNormal);
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);

    gl.drawElements(gl.TRIANGLES, this.facesCount, gl.UNSIGNED_SHORT, 0);

    gl.disableVertexAttribArray(aNormal);
    gl.disableVertexAttribArray(aPosition);
  }
}

function loadObj(modelUrl) {
  const faceFormat = /(\d+)\/\/(\d+)/;

  return fetchText(modelUrl).then((text) => {
    const directives = text.split('\n');
    const vertices = [];
    const normalsRaw = [];
    const normals = [];
    const indices = [];

    for (let i = 0, len = directives.length; i < len; i += 1) {
      const directive = directives[i].split(' ');

      switch(directive[0]) {
        case 'v':
          vertices.push(parseFloat(directive[1]));
          vertices.push(parseFloat(directive[2]));
          vertices.push(parseFloat(directive[3]));
          break;
        case 'vn':
          normalsRaw.push(parseFloat(directive[1]));
          normalsRaw.push(parseFloat(directive[2]));
          normalsRaw.push(parseFloat(directive[3]));
          break;
        case 'f':
          let match;
          let vertexIndex;
          let normalIndex;

          match = faceFormat.exec(directive[1]);
          vertexIndex = parseInt(match[1]) - 1;
          normalIndex = parseInt(match[2]) - 1;
          indices.push(vertexIndex);
          normals[vertexIndex * 3] = normalsRaw[normalIndex * 3];

          match = faceFormat.exec(directive[2]);
          vertexIndex = parseInt(match[1]) - 1;
          normalIndex = parseInt(match[2]) - 1;
          indices.push(vertexIndex);
          normals[vertexIndex * 3 + 1] = normalsRaw[normalIndex * 3 + 1];

          match = faceFormat.exec(directive[3]);
          vertexIndex = parseInt(match[1]) - 1;
          normalIndex = parseInt(match[2]) - 1;
          indices.push(vertexIndex);
          normals[vertexIndex * 3 + 2] = normalsRaw[normalIndex * 3 + 2];
      }
    }

    console.log(vertices, normals);

    return new Mesh({
      vertices: new Float32Array(vertices),
      normals: new Float32Array(normals),
      indices: new Uint16Array(indices),
    });
  });
}
