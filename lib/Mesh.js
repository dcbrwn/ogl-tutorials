export class Mesh {
  constructor(gl, data) {
    this.gl = gl;
    this.indicesBuffer = gl.createBuffer();
    this.vertexBuffer = gl.createBuffer();
    this.normalBuffer = gl.createBuffer();
    this.facesCount = 0;
    if (data) {
      this.setData(data);
    }
  }

  setData(data) {
    const { gl } = this;
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
    const { gl } = this;
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
