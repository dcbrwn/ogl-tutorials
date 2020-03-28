#version 300 es

precision highp float;
precision highp int;

in float depth;

void main() {
  gl_FragDepth = gl_FragCoord.z;
}
