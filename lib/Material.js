export class Material {
  /** @type {{ [key: string]: number }} */
  attr = {};

  /** @type {{ [key: string]: WebGLUniformLocation }} */
  uniforms = {};

  /**
   * @private
   * @type {WebGL2RenderingContext}
   */
  _gl;

  /**
   * @private
   * @type {WebGLProgram}
   */
  _program;

  /**
   * @param {WebGL2RenderingContext} gl
   * @param {object} [options]
   * @param {string} [options.vertexShader]
   * @param {string} [options.fragmentShader]
   * @param {string[]} [options.attributes]
   * @param {string[]} [options.uniforms]
   */
  constructor(gl, options = {}) {
    let program = gl.createProgram();
    let vertexShader;
    let fragmentShader;

    let vertexShaderSource = options.vertexShader || `
      attribute vec4 aPosition;

      void main() {
        gl_Position = aPosition;
      }
    `;
    let fragmentShaderSource = options.fragmentShader || `
      void main() {
        gl_FragColor = vec4(1.0, 0.5, 0.0, 1.0);
      }
    `;

    try {
      vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, vertexShaderSource);
      gl.compileShader(vertexShader);

      if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        throw 'Could not compile vertex shader:\n' + gl.getShaderInfoLog(vertexShader);
      }

      fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader, fragmentShaderSource);
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

      if (options.attributes) {
        for (const attribute of options.attributes) {
          this.attr[attribute] = gl.getAttribLocation(program, attribute);
        }
      }

      if (options.uniforms) {
        for (const uniform of options.uniforms) {
          this.uniforms[uniform] = gl.getUniformLocation(program, uniform);
        }
      }

      this._gl = gl;
      this._program = program;
    } catch (error) {
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      throw error;
    }
  }

  use() {
    this._gl.useProgram(this._program);
  }

  getProgram() {
    return this._program;
  }
}
