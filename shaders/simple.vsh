attribute vec4 a_position;

uniform mat4 mvpMatrix;

void main() {
  gl_Position = mvpMatrix * vec4(a_position.xyz, 1.0);
}
