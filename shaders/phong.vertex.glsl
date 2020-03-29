precision mediump float;

attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 transformMatrix;

varying vec3 normal;
varying vec3 toLight;
varying vec3 toCamera;

void main() {
  const vec3 lightPos = vec3(0.0, 1.5, 2.0);
  const vec3 cameraPos = vec3(1.5, 1.5, 1.5);

  toLight = lightPos - aPosition;
  toCamera = cameraPos - aPosition;
  normal.xyz = aNormal;
  gl_Position = transformMatrix * vec4(aPosition, 1.0);
}
