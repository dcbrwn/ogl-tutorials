'use strict';

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
    const aPosition = gl.getAttribLocation(program, "a_position");

    const projectionMatrix = mat4.create();
    mat4.perspective(
      projectionMatrix,
      45,
      4/3,
      0.1,
      100
    );

    const viewMatrix = mat4.create();
    mat4.lookAt(
      viewMatrix,
      vec3.fromValues(4,3,3),
      vec3.fromValues(0,0,0),
      vec3.fromValues(0,1,0)
    );

    const modelMatrix = mat4.create();

    const mvpMatrix = mat4.create();

    mat4.mul(mvpMatrix, viewMatrix, modelMatrix);
    mat4.mul(mvpMatrix, projectionMatrix, mvpMatrix);

    const mvpMatrixUniform = gl.getUniformLocation(program, "mvpMatrix");

    setRenderFunc((dt) => {
      gl.useProgram(program);
      gl.uniformMatrix4fv(mvpMatrixUniform, false, mvpMatrix);
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disableVertexAttribArray(aPosition);
    });
  });