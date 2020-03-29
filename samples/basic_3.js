import { initGL, loadProgram, setRenderFunc } from "../lib/utils.js";
import * as mat4 from "../vendor/gl-matrix/mat4";
import * as vec3 from "../vendor/gl-matrix/vec3";

const gl = initGL();

const triangleData = new Float32Array([
  -1.0, -1.0, 0.0,
  1.0, -1.0, 0.0,
  0.0, 1.0, 0.0,
]);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, triangleData.buffer, gl.STATIC_DRAW);

loadProgram(gl, 'shaders/simple.vsh', 'shaders/simple.fsh')
  .then((program) => {
    const aPosition = gl.getAttribLocation(program, "aPosition");

    const projectionMatrix = mat4.create();
    mat4.perspective(
      projectionMatrix,
      45,
      4 / 3,
      0.1,
      100
    );

    const viewMatrix = mat4.create();
    mat4.lookAt(
      viewMatrix,
      vec3.fromValues(4, 3, 3),
      vec3.fromValues(0, 0, 0),
      vec3.fromValues(0, 1, 0)
    );

    const modelMatrix = mat4.create();

    const transformMatrix = mat4.create();

    mat4.mul(transformMatrix, viewMatrix, modelMatrix);
    mat4.mul(transformMatrix, projectionMatrix, transformMatrix);

    const transformMatrixUniform = gl.getUniformLocation(program, "transformMatrix");

    setRenderFunc((dt) => {
      gl.useProgram(program);
      gl.uniformMatrix4fv(transformMatrixUniform, false, transformMatrix);
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disableVertexAttribArray(aPosition);
    });
  });
