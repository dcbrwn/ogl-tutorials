import { initGL, loadProgram, setRenderFunc } from "../lib/utils.js";

const gl = initGL();

const triangleData = new Float32Array([
  -1.0, -1.0, 0.0,
  1.0, -1.0, 0.0,
  0.0, 1.0, 0.0,
]);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, triangleData.buffer, gl.STATIC_DRAW);

loadProgram(gl, 'shaders/passthrough.vertex.glsl', 'shaders/simple.fragment.glsl')
  .then((program) => {
    const aPosition = gl.getAttribLocation(program, "aPosition");

    setRenderFunc(() => {
      gl.useProgram(program);
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disableVertexAttribArray(aPosition);
    });
  });
