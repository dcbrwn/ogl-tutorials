import { initGL, loadProgram, setRenderFunc } from "../lib/utils.js";

const gl = initGL();

const triangleData = new Float32Array([
  -1.0, -1.0, 0.0,
  1.0, -1.0, 0.0,
  -1.0, 1.0, 0.0,
  1.0, 1.0, 0.0,
]);

const buffer = gl.createBuffer();

gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, triangleData.buffer, gl.STATIC_DRAW);

let cubeTexture, cubeImage;

initTextures();

function initTextures() {
  cubeTexture = gl.createTexture();
  cubeImage = new Image();
  cubeImage.crossOrigin = 'anonymous';
  cubeImage.onload = function () { handleTextureLoaded(cubeImage, cubeTexture); }
  cubeImage.src = 'assets/textures/envmap1.jpg';
}

function handleTextureLoaded(image, texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);
  // gl.bindTexture(gl.TEXTURE_2D, null);
}

loadProgram(gl, 'shaders/passthrough.vertex.glsl', 'shaders/sdf-metaballs.fragment.glsl')
  .then((program) => {
    const aPosition = gl.getAttribLocation(program, 'aPosition');
    const uTime = gl.getUniformLocation(program, 'uTime');
    const uSampler = gl.getUniformLocation(program, 'uSampler');
    const uResolution = gl.getUniformLocation(program, 'uResolution');

    let time = 0;

    setRenderFunc((deltaTime) => {
      time += deltaTime;

      gl.useProgram(program);
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.uniform1f(uTime, time);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
      gl.uniform1i(uSampler, 0);
      gl.uniform2fv(uResolution, [800, 600]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.disableVertexAttribArray(aPosition);
    });
  });
