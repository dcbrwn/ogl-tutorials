import { initGL, loadProgram, loadObj, setRenderFunc, glsl } from "../lib/utils.js";
import { PerspectiveCamera } from "../lib/PerspectiveCamera.js";
import { calcFlatNormalsForVertices } from "../lib/math.js";
import { DepthFramebuffer, Framebuffer } from "../lib/Framebuffer.js";
import * as vec3 from "../vendor/gl-matrix/vec3.js";
import { toRadian } from "../vendor/gl-matrix/common.js";
import { Material } from "../lib/Material.js";

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

const lightCamera = new PerspectiveCamera(toRadian(90), 1, 1.0, 50);

const camera = new PerspectiveCamera(toRadian(30), 4 / 3, 0.1, 50);
camera.lookAt(
  vec3.fromValues(4, 3, 3),
  vec3.fromValues(0, 0, 0),
  vec3.fromValues(0, 1, 0)
);

async function main() {
  const shadowMapRez = 512;
  const depthFramebuffer = new Framebuffer(gl, shadowMapRez, shadowMapRez);

  const lightMaterial = new Material(gl, {
    attributes: ["aPosition"],
    uniforms: ["transformMatrix"],
    vertexShader: glsl`
      #version 300 es

      precision highp float;
      precision highp int;

      in vec3 aPosition;

      out vec3 position;

      uniform mat4 transformMatrix;

      void main() {
          gl_Position = transformMatrix * vec4(aPosition, 1.0);
          position = gl_Position.xyz;
      }
    `,
    fragmentShader: glsl`
      #version 300 es

      precision highp float;
      precision highp int;

      in vec3 position;
      out vec4 color;

      void main() {
        float moment1 = clamp(length(position.xyz) / 50.0, 0.0, 1.0);
        float moment2 = moment1 * moment1;

        float dx = dFdx(moment1);
        float dy = dFdy(moment1);
        moment2 += 0.25*(dx*dx+dy*dy);

        color = vec4(moment1, moment2, 0.0, 1.0);
      }
    `,
  });

  const sceneMaterial = new Material(gl, {
    attributes: ["aPosition", "aNormal"],
    uniforms: [
      "transformMatrix",
      "uLightPos",
      "uLightMatrix",
      "uShadowMap",
    ],
    vertexShader: glsl`
      #version 300 es

      precision highp float;
      precision highp int;

      in vec3 aPosition;
      in vec3 aNormal;

      uniform vec3 uLightPos;
      uniform mat4 uLightMatrix;
      uniform mat4 transformMatrix;

      out vec3 normal;
      out vec3 toLight;
      out vec3 lightDir;
      out vec3 toCamera;
      out vec4 fragPosLightSpace;

      void main() {
        const vec3 lightTarget = vec3(0.0, 0.0, 0.0);
        const vec3 cameraPos = vec3(4, 3, 3);

        toLight = uLightPos - aPosition;
        lightDir = normalize(lightTarget - uLightPos);
        toCamera = cameraPos - aPosition;
        normal.xyz = aNormal;
        fragPosLightSpace = uLightMatrix * vec4(aPosition, 1.0);
        gl_Position = transformMatrix * vec4(aPosition, 1.0);
      }
    `,
    fragmentShader: glsl`
      #version 300 es

      precision highp float;
      precision highp int;

      uniform sampler2D uShadowMap;

      in vec3 normal;
      in vec3 lightDir;
      in vec3 toLight;
      in vec3 toCamera;
      in vec4 fragPosLightSpace;

      out vec4 fragColor;

      float linstep(float low, float high, float v) {
        return clamp((v - low) / (high - low), 0.0, 1.0);
      }

      float VSM(sampler2D uShadowMap, vec2 uv, float compare) {
        vec2 moments = texture(uShadowMap, uv).xy;
        float p = smoothstep(compare - 0.001, compare, moments.x);
        float variance = max(moments.y - moments.x*moments.x, -0.1);
        float d = compare - moments.x;
        float p_max = linstep(0.2, 1.0, variance / (variance + d*d));
        return clamp(max(p, p_max), 0.0, 1.0);
      }

      float calcShadow(vec4 fragPosLightSpace) {
        vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
        projCoords = projCoords * 0.5 + 0.5;

        float currentDepth = clamp(length(fragPosLightSpace.xyz) / 50.0, 0.0, 1.0);

        return VSM(uShadowMap, projCoords.xy, currentDepth);
      }

      void main() {
        vec3 ambColor = vec3(0.1, 0.12, 0.15);
        vec3 diffColor = vec3(0.6, 0.63, 0.65);
        vec3 specColor = vec3(1.0, 1.0, 1.0);

        vec3 n = normalize(normal);
        vec3 l = normalize(toLight);
        vec3 v = normalize(toCamera);
        vec3 r = reflect(-v, n);

        vec3 diff = max(0.0, dot(n, l)) * diffColor;
        vec3 spec = pow(max(0.0, dot(l, r)), 10.0) * specColor;

        float cosine = dot(l, -lightDir);
        float spot = cosine > 0.7 ? pow(cosine, 15.0) : 0.0;

        float shadow = calcShadow(fragPosLightSpace);
        fragColor = vec4(ambColor + (diff + spec) * max(0.05, shadow) * spot, 1.0);
        // fragColor.rgb = vec3(shadow);
        // fragColor.a = 1.0;
      }
    `,
  });

  const mesh = await loadObj(gl, 'assets/teapot.obj');

  const lightPos = vec3.fromValues(-2, 3, 2);
  const origin = vec3.fromValues(0, 0, 0);

  setRenderFunc((dt) => {
    // Setup
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    vec3.rotateY(lightPos, lightPos, origin, toRadian(dt / 10));

    // Render shadow map
    {
      depthFramebuffer.bind();
      gl.viewport(0, 0, shadowMapRez, shadowMapRez);

      lightCamera.lookAt(
        lightPos,
        vec3.fromValues(0, 0, 0),
        vec3.fromValues(0, 0, 1)
      );

      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.enableVertexAttribArray(lightMaterial.attr.aPosition);
      gl.vertexAttribPointer(lightMaterial.attr.aPosition, 3, gl.FLOAT, false, 0, 0);

      lightMaterial.use();

      gl.uniformMatrix4fv(lightMaterial.uniforms.transformMatrix, false, lightCamera.transformMatrix);

      gl.cullFace(gl.BACK);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      gl.disableVertexAttribArray(lightMaterial.attr.aPosition);

      mesh.render(lightMaterial.getProgram(), lightCamera);

      gl.bindTexture(gl.TEXTURE_2D, depthFramebuffer.targetTexture);
      gl.generateMipmap(gl.TEXTURE_2D);
    }

    // Render scene
    {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, 800, 600);

      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.enableVertexAttribArray(sceneMaterial.attr.aPosition);
      gl.vertexAttribPointer(sceneMaterial.attr.aPosition, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
      gl.enableVertexAttribArray(sceneMaterial.attr.aNormal);
      gl.vertexAttribPointer(sceneMaterial.attr.aNormal, 3, gl.FLOAT, false, 0, 0);

      sceneMaterial.use();

      gl.uniform3fv(sceneMaterial.uniforms.uLightPos, lightPos);
      gl.uniformMatrix4fv(sceneMaterial.uniforms.transformMatrixUniform, false, camera.transformMatrix);
      gl.uniformMatrix4fv(sceneMaterial.uniforms.uLightMatrix, false, lightCamera.transformMatrix);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, depthFramebuffer.targetTexture);
      gl.uniform1i(sceneMaterial.uniforms.uShadowMap, 0);

      gl.cullFace(gl.BACK);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.disableVertexAttribArray(sceneMaterial.attr.aPosition);
      gl.disableVertexAttribArray(sceneMaterial.attr.aNormal);

      mesh.render(sceneMaterial.getProgram(), camera);
    }
  });
}

main();
