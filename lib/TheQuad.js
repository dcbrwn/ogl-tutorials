const quadData = new Float32Array([
  -1.0, -1.0, 0.0,
  1.0, -1.0, 0.0,
  -1.0, 1.0, 0.0,
  1.0, 1.0, 0.0,
]);

export class TheQuad {
  /**
   * @protected
   * @type {WebGL2RenderingContext}
   */
  gl;

  constructor(gl) {
    this.gl = gl;

    this.buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadData.buffer, gl.STATIC_DRAW);
  }

  render() {
    const { gl } = this;

    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
