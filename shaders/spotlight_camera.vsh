#version 300 es

precision highp float;
precision highp int;

in vec3 aPosition;
in vec3 aNormal;

uniform mat4 uLightMatrix;
uniform mat4 transformMatrix;

out vec3 normal;
out vec3 toLight;
out vec3 toCamera;
out vec4 fragPosLightSpace;

void main() {
  const vec3 lightPos = vec3(-2.0, 3.0, 2.0);
  const vec3 cameraPos = vec3(4, 3, 3);

  toLight = lightPos - aPosition;
  toCamera = cameraPos - aPosition;
  normal.xyz = aNormal;
  fragPosLightSpace = uLightMatrix * vec4(aPosition, 1.0);
  gl_Position = transformMatrix * vec4(aPosition, 1.0);
}
