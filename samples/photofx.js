import { initGL, loadProgram, setRenderFunc } from "../lib/utils.js";

const triangleData = new Float32Array([
  -1.0, -1.0, 0.0,
  1.0, -1.0, 0.0,
  -1.0, 1.0, 0.0,
  1.0, 1.0, 0.0,
]);

function loadImage(gl, imageUrl) {
  return new Promise((resolve) => {
    const sampleImage = new Image();
    sampleImage.onload = function () {
      console.info('Image loaded...');
      const sampleTextureId = gl.createTexture();

      gl.bindTexture(gl.TEXTURE_2D, sampleTextureId);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sampleImage);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.bindTexture(gl.TEXTURE_2D, null);

      resolve(sampleTextureId);
    }
    sampleImage.src = imageUrl;
  });
}

async function main() {
  const gl = initGL();

  const buffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, triangleData.buffer, gl.STATIC_DRAW);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  const program = await loadProgram(gl, 'shaders/passthrough.vsh', 'shaders/holgaart.fsh');

  const imageTextureId = await loadImage(gl, "/assets/Lenna.png");

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

    gl.bindTexture(gl.TEXTURE_2D, imageTextureId);
    gl.uniform1i(uSampler, imageTextureId);

    gl.uniform2fv(uResolution, [800, 600]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disableVertexAttribArray(aPosition);
  });
}

main();
