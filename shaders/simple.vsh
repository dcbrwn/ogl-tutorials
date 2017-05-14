attribute vec4 aPosition;

uniform mat4 transformMatrix;

void main() {
  gl_Position = transformMatrix * vec4(aPosition.xyz, 1.0);
}
