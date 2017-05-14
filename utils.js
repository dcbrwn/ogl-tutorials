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

function loadProgram(gl, vertexShaderUrl, fragmentShaderUrl) {
  const program = gl.createProgram();
  let vertexShader;
  let fragmentShader;

  return Promise
    .all([
      fetch(vertexShaderUrl).then((res) => res.text()),
      fetch(fragmentShaderUrl).then((res) => res.text()),
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
