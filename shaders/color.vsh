attribute vec3 aPosition;
attribute vec3 aColor;

uniform mat4 transformMatrix;

varying vec3 fragmentColor;

void main() {
  gl_Position = transformMatrix * vec4(aPosition.xyz, 1.0);
  fragmentColor = aColor;
}
