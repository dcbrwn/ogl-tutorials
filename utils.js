'use strict';

window.canvas = document.getElementById('canvas');

function initGL() {
  window.gl = canvas.getContext("webgl");

  if (!gl) {
    throw 'WebGL is not supported';
  }

  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}
