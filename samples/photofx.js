import { initGL, loadProgram, setRenderFunc } from "../lib/utils.js";
import { TheQuad } from "../lib/TheQuad.js";

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
  const quad = new TheQuad(gl);

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  const program = await loadProgram(gl, 'shaders/passthrough.vertex.glsl', 'shaders/holgaart.fragment.glsl');

  const imageTextureId = await loadImage(gl, "/assets/Lenna.png");

  const aPosition = gl.getAttribLocation(program, 'aPosition');
  const uTime = gl.getUniformLocation(program, 'uTime');
  const uSampler = gl.getUniformLocation(program, 'uSampler');
  const uResolution = gl.getUniformLocation(program, 'uResolution');

  let time = 0;

  setRenderFunc((deltaTime) => {
    time += deltaTime;

    gl.useProgram(program);

    gl.uniform1f(uTime, time);
    gl.bindTexture(gl.TEXTURE_2D, imageTextureId);
    gl.uniform1i(uSampler, imageTextureId);
    gl.uniform2fv(uResolution, [800, 600]);

    gl.enableVertexAttribArray(aPosition);

    quad.render();

    gl.disableVertexAttribArray(aPosition);
  });
}

main();
