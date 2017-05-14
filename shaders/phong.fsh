precision mediump float;

varying vec4 normal;

void main() {
  gl_FragColor = vec4(normal.xyz, 1.0);
}
