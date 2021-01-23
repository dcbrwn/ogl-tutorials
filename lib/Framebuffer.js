export class Framebuffer {
  /** @type {WebGLTexture} */
  targetTexture;

  /**
   * @param {WebGL2RenderingContext} gl
   * @param {number} width
   * @param {number} height
   */
  constructor(gl, width, height) {
    this.gl = gl;
    this.width = width;
    this.height = height;

    this.targetTexture;

    this.createTexture();

    this.fb = gl.createFramebuffer();

    this.bind();
    this.attachTexture();
  }

  createTexture() {
    const { gl, width, height } = this;
    this.targetTexture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, this.targetTexture);

    {
      gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA16F,
        width, height, 0,
        gl.RGBA, gl.FLOAT, null
      );

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_LOD, 0.0);
      gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAX_LOD, 10.0);
    }
  }

  bind() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fb);
  }

  attachTexture() {
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      this.targetTexture,
      0
    );
  }

  destroy() {
    // TODO
  }
}

export class DepthFramebuffer extends Framebuffer {
  createTexture() {
    const { gl, width, height } = this;

    this.targetTexture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, this.targetTexture);

    {
      gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F,
        width, height, 0,
        gl.DEPTH_COMPONENT, gl.FLOAT, null
      );

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    }
  }

  attachTexture() {
    const gl = this.gl;

    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.TEXTURE_2D,
      this.targetTexture,
      0
    );

    gl.drawBuffers([gl.NONE]);
    gl.readBuffer(gl.NONE);
  }
}

export class DeferredFramebuffer {
  /** @type {WebGLTexture} */
  depthTexture;

  /** @type {WebGLTexture} */
  posTexture;

  /** @type {WebGLTexture} */
  normalTexture;

  /** @type {WebGLTexture} */
  colorTexture;

  /**
   * @param {WebGL2RenderingContext} gl
   * @param {number} width
   * @param {number} height
   */
  constructor(gl, width, height) {
    this.gl = gl;
    this.width = width;
    this.height = height;

    this.createTextures();

    this.fb = gl.createFramebuffer();

    this.bind();
    this.attachTextures();
  }

  createTextures() {
    this.depthTexture = this.createDepthTexture();
    this.posTexture = this.createVecTexture();
    this.normalTexture = this.createVecTexture();
    this.colorTexture = this.createColorTexture();
  }

  createDepthTexture() {
    const { gl, width, height } = this;

    const result = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, result);

    {
      gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F,
        width, height, 0,
        gl.DEPTH_COMPONENT, gl.FLOAT, null
      );

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    }

    return result;
  }

  createVecTexture() {
    const { gl, width, height } = this;
    const result = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, result);

    {
      gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA16F,
        width, height, 0,
        gl.RGBA, gl.FLOAT, null
      );

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_LOD, 0.0);
      gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAX_LOD, 10.0);
    }

    return result;
  }

  createColorTexture() {
    const { gl, width, height } = this;
    const result = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, result);

    {
      gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA16F,
        width, height, 0,
        gl.RGBA, gl.FLOAT, null
      );

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_LOD, 0.0);
      gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAX_LOD, 10.0);
    }

    return result;
  }

  bind() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fb);
  }

  attachTextures() {
    const { gl } = this;

    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.TEXTURE_2D,
      this.depthTexture,
      0
    );

    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.posTexture,
      0
    );

    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT1,
      gl.TEXTURE_2D,
      this.normalTexture,
      0
    );

    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT2,
      gl.TEXTURE_2D,
      this.colorTexture,
      0
    );
  }

  destroy() {
    // TODO
  }
}
