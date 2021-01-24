import { initGL, loadProgram, loadObj, setRenderFunc, glsl } from "../lib/utils.js";
import { PerspectiveCamera } from "../lib/PerspectiveCamera.js";
import { calcFlatNormalsForVertices } from "../lib/math.js";
import { DepthFramebuffer, Framebuffer, DeferredFramebuffer } from "../lib/Framebuffer.js";
import * as vec3 from "../vendor/gl-matrix/vec3.js";
import { toRadian } from "../vendor/gl-matrix/common.js";
import { Material } from "../lib/Material.js";
import { TheQuad } from "../lib/TheQuad.js";

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

const lightCamera = new PerspectiveCamera(toRadian(90), 1, 1.0, 100);
lightCamera.lookAt(
  vec3.fromValues(-2, 3, 2),
  vec3.fromValues(0, 0, 0),
  vec3.fromValues(0, 0, 1)
);

const camera = new PerspectiveCamera(toRadian(30), 4 / 3, 0.1, 50);
camera.lookAt(
  vec3.fromValues(4, 3, 3),
  vec3.fromValues(0, 0, 0),
  vec3.fromValues(0, 1, 0)
);

async function main() {
  const deferredFB = new DeferredFramebuffer(gl, gl.canvas.width, gl.canvas.height);

  const renderMaterial = new Material(gl, {
    attributes: ["aPosition", "aNormal"],
    uniforms: ["transformMatrix"],
    vertexShader: glsl`
      #version 300 es

      precision highp float;
      precision highp int;

      in vec3 aPosition;
      in vec3 aNormal;

      out vec3 vNormal;
      out vec3 vPos;

      uniform mat4 transformMatrix;

      void main() {
        gl_Position = transformMatrix * vec4(aPosition, 1.0);
        vPos = aPosition;
        vNormal = aNormal;
      }
    `,
    fragmentShader: glsl`
      #version 300 es

      precision highp float;
      precision highp int;

      in vec3 vNormal;
      in vec3 vPos;

      layout(location = 0) out vec4 oPos;
      layout(location = 1) out vec4 oNormal;
      layout(location = 2) out vec4 oColor;

      void main() {
        gl_FragDepth = gl_FragCoord.z;
        oPos = vec4(vPos, 1.0);
        oNormal = vec4(vNormal, 1.0);
        oColor = vec4(0.6, 0.63, 0.65, 1.0);
      }
    `,
  });

  const mixMaterial = new Material(gl, {
    attributes: ["aPosition", "aNormal"],
    uniforms: ["transformMatrix", "uResolution", "uPos", "uNormal", "uColor"],
    vertexShader: glsl`
      #version 300 es

      precision highp float;
      precision highp int;

      in vec4 aPosition;

      void main() {
        gl_Position = aPosition;
      }
    `,
    fragmentShader: glsl`
      #version 300 es

      precision highp float;
      precision highp int;

      uniform vec2 uResolution;
      uniform sampler2D uPos;
      uniform sampler2D uNormal;
      uniform sampler2D uColor;

      out vec4 fragColor;

      vec3 light(vec2 uv) {
        vec3 ambColor = vec3(0.1, 0.12, 0.15);
        vec3 diffColor = vec3(0.6, 0.63, 0.65);
        vec3 specColor = vec3(1.0, 1.0, 1.0);

        vec3 lightTarget = vec3(0.0, 0.0, 0.0);
        vec3 lightPos = vec3(-2.0, 3.0, 2.0);
        vec3 cameraPos = vec3(4.0, 3.0, 3.0);
        vec3 pos = texture(uPos, uv).xyz;

        vec3 lightDir = normalize(lightTarget - lightPos);

        vec3 n = normalize(texture(uNormal, uv).xyz);
        vec3 l = normalize(lightPos - pos);
        vec3 v = normalize(cameraPos - pos);
        vec3 r = reflect(-v, n);

        vec3 diff = max(0.0, dot(n, l)) * diffColor;
        vec3 spec = pow(max(0.0, dot(l, r)), 10.0) * specColor;

        float cosine = dot(l, -lightDir);
        float spot = cosine > 0.7 ? pow(cosine, 15.0) : 0.0;

        return ambColor + spot * (diff + spec);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / uResolution.xy;
        uv *= 2.0;

        if (uv.x < 1.0 && uv.y < 1.0)
          fragColor = texture(uPos, uv);
        else if (uv.x >= 1.0 && uv.y < 1.0)
          fragColor = vec4(light(uv - vec2(1.0, 0.0)), 1.0);
        else if (uv.x < 1.0 && uv.y >= 1.0)
          fragColor = texture(uColor, uv - vec2(0.0, 1.0));
        else
          fragColor = texture(uNormal, uv - vec2(1.0, 1.0));
      }
    `,
  });
  const mesh = await loadObj(gl, 'assets/teapot.obj');

  const quad = new TheQuad(gl);

  setRenderFunc((dt) => {
    // Setup
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Render components
    {
      deferredFB.bind();
      gl.viewport(0, 0, 800, 600);

      renderMaterial.use();

      gl.uniformMatrix4fv(renderMaterial.uniforms.transformMatrixUniform, false, camera.transformMatrix);

      gl.drawBuffers([
        gl.COLOR_ATTACHMENT0,
        gl.COLOR_ATTACHMENT1,
        gl.COLOR_ATTACHMENT2,
      ]);

      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.enableVertexAttribArray(renderMaterial.attr.aPosition);
      gl.vertexAttribPointer(renderMaterial.attr.aPosition, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
      gl.enableVertexAttribArray(renderMaterial.attr.aNormal);
      gl.vertexAttribPointer(renderMaterial.attr.aNormal, 3, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.disableVertexAttribArray(renderMaterial.attr.aPosition);
      gl.disableVertexAttribArray(renderMaterial.attr.aNormal);

      mesh.render(renderMaterial.getProgram(), camera);
    }

    // Mix components
    {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, 800, 600);

      mixMaterial.use();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, deferredFB.posTexture);
      gl.uniform1i(mixMaterial.uniforms.uPos, 0);

      gl.activeTexture(gl.TEXTURE0 + 1);
      gl.bindTexture(gl.TEXTURE_2D, deferredFB.normalTexture);
      gl.uniform1i(mixMaterial.uniforms.uNormal, 1);

      gl.activeTexture(gl.TEXTURE0 + 2);
      gl.bindTexture(gl.TEXTURE_2D, deferredFB.colorTexture);
      gl.uniform1i(mixMaterial.uniforms.uColor, 2);

      gl.uniform2fv(mixMaterial.uniforms.uResolution, [800, 600]);

      quad.render(mixMaterial.getProgram());
    }
  });
}

main();
