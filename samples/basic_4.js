import { initGL, loadProgram, setRenderFunc } from "../lib/utils.js";
import { PerspectiveCamera } from "../lib/PerspectiveCamera.js";
import * as vec3 from "../vendor/gl-matrix/vec3.js";

const gl = initGL();

const cubeData = new Float32Array([
  -1.0, -1.0, -1.0,
  -1.0, -1.0, 1.0,
  -1.0, 1.0, 1.0,
  1.0, 1.0, -1.0,
  -1.0, -1.0, -1.0,
  -1.0, 1.0, -1.0,
  1.0, -1.0, 1.0,
  -1.0, -1.0, -1.0,
  1.0, -1.0, -1.0,
  1.0, 1.0, -1.0,
  1.0, -1.0, -1.0,
  -1.0, -1.0, -1.0,
  -1.0, -1.0, -1.0,
  -1.0, 1.0, 1.0,
  -1.0, 1.0, -1.0,
  1.0, -1.0, 1.0,
  -1.0, -1.0, 1.0,
  -1.0, -1.0, -1.0,
  -1.0, 1.0, 1.0,
  -1.0, -1.0, 1.0,
  1.0, -1.0, 1.0,
  1.0, 1.0, 1.0,
  1.0, -1.0, -1.0,
  1.0, 1.0, -1.0,
  1.0, -1.0, -1.0,
  1.0, 1.0, 1.0,
  1.0, -1.0, 1.0,
  1.0, 1.0, 1.0,
  1.0, 1.0, -1.0,
  -1.0, 1.0, -1.0,
  1.0, 1.0, 1.0,
  -1.0, 1.0, -1.0,
  -1.0, 1.0, 1.0,
  1.0, 1.0, 1.0,
  -1.0, 1.0, 1.0,
  1.0, -1.0, 1.0,
]);

const cubeColorData = new Float32Array([
  0.583, 0.771, 0.014,
  0.609, 0.115, 0.436,
  0.327, 0.483, 0.844,
  0.822, 0.569, 0.201,
  0.435, 0.602, 0.223,
  0.310, 0.747, 0.185,
  0.597, 0.770, 0.761,
  0.559, 0.436, 0.730,
  0.359, 0.583, 0.152,
  0.483, 0.596, 0.789,
  0.559, 0.861, 0.639,
  0.195, 0.548, 0.859,
  0.014, 0.184, 0.576,
  0.771, 0.328, 0.970,
  0.406, 0.615, 0.116,
  0.676, 0.977, 0.133,
  0.971, 0.572, 0.833,
  0.140, 0.616, 0.489,
  0.997, 0.513, 0.064,
  0.945, 0.719, 0.592,
  0.543, 0.021, 0.978,
  0.279, 0.317, 0.505,
  0.167, 0.620, 0.077,
  0.347, 0.857, 0.137,
  0.055, 0.953, 0.042,
  0.714, 0.505, 0.345,
  0.783, 0.290, 0.734,
  0.722, 0.645, 0.174,
  0.302, 0.455, 0.848,
  0.225, 0.587, 0.040,
  0.517, 0.713, 0.338,
  0.053, 0.959, 0.120,
  0.393, 0.621, 0.362,
  0.673, 0.211, 0.457,
  0.820, 0.883, 0.371,
  0.982, 0.099, 0.879,
]);

const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, cubeData.buffer, gl.STATIC_DRAW);

const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, cubeColorData.buffer, gl.STATIC_DRAW);

const camera = new PerspectiveCamera(45, 4 / 3, 0.1, 100);
camera.lookAt(
  vec3.fromValues(4, 3, 3),
  vec3.fromValues(0, 0, 0),
  vec3.fromValues(0, 1, 0)
);

loadProgram(gl, 'shaders/color.vertex.glsl', 'shaders/color.fragment.glsl')
  .then((program) => {
    const aPosition = gl.getAttribLocation(program, "aPosition");
    const aColor = gl.getAttribLocation(program, "aColor");

    const transformMatrixUniform = gl.getUniformLocation(program, "transformMatrix");

    setRenderFunc((dt) => {
      gl.useProgram(program);
      gl.uniformMatrix4fv(transformMatrixUniform, false, camera.transformMatrix);

      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.enableVertexAttribArray(aColor);
      gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLES, 0, 6 * 2 * 3);

      gl.disableVertexAttribArray(aColor);
      gl.disableVertexAttribArray(aPosition);
    });
  });
