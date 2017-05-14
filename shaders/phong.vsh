precision mediump float;

attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 transformMatrix;
varying vec4 normal;

void main() {
  normal.xyz = aNormal;
  gl_Position = transformMatrix * vec4(aPosition, 1.0);
}
