import { initGL, loadProgram, loadObj, setRenderFunc } from "../lib/utils.js";
import { PerspectiveCamera } from "../lib/PerspectiveCamera.js";
import { calcFlatNormalsForVertices, toRad } from "../lib/math.js";
import { DepthFramebuffer } from "../lib/Framebuffer.js";
import * as vec3 from "../vendor/gl-matrix/vec3.js";


const gl = initGL();

const floorHeight = 0;

const sceneVertices = new Float32Array([

  // FLOOR
  -20.0, floorHeight, 20.0,
  20.0, floorHeight, -20.0,
  -20.0, floorHeight, -20.0,
  20.0, floorHeight, 20.0,
  20.0, floorHeight, -20.0,
  -20.0, floorHeight, 20.0,
]);

const sceneNormals = new Float32Array(calcFlatNormalsForVertices(sceneVertices));

const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, sceneVertices.buffer, gl.STATIC_DRAW);

const normalsBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
gl.bufferData(gl.ARRAY_BUFFER, sceneNormals.buffer, gl.STATIC_DRAW);

const lightCamera = new PerspectiveCamera(toRad(90), 1, 1.0, 100);
lightCamera.lookAt(
  vec3.fromValues(-2, 3, 2),
  vec3.fromValues(0, 0, 0),
  vec3.fromValues(0, 0, 1)
);

const camera = new PerspectiveCamera(toRad(30), 4 / 3, 0.1, 50);
camera.lookAt(
  vec3.fromValues(4, 3, 3),
  vec3.fromValues(0, 0, 0),
  vec3.fromValues(0, 1, 0)
);

async function start() {
  const shadowMapRez = 512;
  const depthFramebuffer = new DepthFramebuffer(gl, shadowMapRez, shadowMapRez);

  const lightProgram = await loadProgram(
    gl,
    'shaders/spotlight_light.vsh',
    'shaders/spotlight_light.fsh'
  );

  const cameraProgram = await loadProgram(
    gl,
    'shaders/spotlight_camera.vsh',
    'shaders/spotlight_camera.fsh'
  );

  const mesh = await loadObj(gl, 'assets/teapot.obj');

  const aPosition = gl.getAttribLocation(cameraProgram, "aPosition");
  const aNormal = gl.getAttribLocation(cameraProgram, "aNormal");

  const laPosition = gl.getAttribLocation(lightProgram, "aPosition");

  const lightTransformation = gl.getUniformLocation(lightProgram, "transformMatrix");

  const transformMatrixUniform = gl.getUniformLocation(cameraProgram, "transformMatrix");
  const uLightMatrix = gl.getUniformLocation(cameraProgram, "uLightMatrix");
  const uShadowMap = gl.getUniformLocation(cameraProgram, "uShadowMap");

  setRenderFunc((dt) => {
    // Setup
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Render shadow map
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.enableVertexAttribArray(laPosition);
    gl.vertexAttribPointer(laPosition, 3, gl.FLOAT, false, 0, 0);

    depthFramebuffer.bind();
    gl.viewport(0, 0, shadowMapRez, shadowMapRez);

    gl.useProgram(lightProgram);
    gl.uniformMatrix4fv(lightTransformation, false, lightCamera.transformMatrix);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.disableVertexAttribArray(laPosition);

    mesh.render(lightProgram, lightCamera);

    // Render scene
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
    gl.enableVertexAttribArray(aNormal);
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, 800, 600);

    gl.useProgram(cameraProgram);
    gl.uniformMatrix4fv(transformMatrixUniform, false, camera.transformMatrix);
    gl.uniformMatrix4fv(uLightMatrix, false, lightCamera.transformMatrix);
    gl.uniform1i(uShadowMap, /** @type {number} */ (depthFramebuffer.targetTexture));

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.disableVertexAttribArray(aPosition);
    gl.disableVertexAttribArray(aNormal);

    mesh.render(cameraProgram, camera);
  });
}

start();
