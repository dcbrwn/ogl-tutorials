attribute vec4 aPosition;

uniform mat4 mvpMatrix;

void main() {
  gl_Position = mvpMatrix * vec4(aPosition.xyz, 1.0);
}
