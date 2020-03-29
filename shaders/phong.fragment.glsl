precision mediump float;

varying vec3 normal;
varying vec3 toLight;
varying vec3 toCamera;

void main() {
  vec3 ambColor = vec3(0.2, 0.1, 0.0);
  vec3 diffColor = vec3(1.0, 0.5, 0.0);
  vec3 specColor = vec3(1.0, 1.0, 1.0);

  vec3 n = normalize(normal);
  vec3 l = normalize(toLight);
  vec3 v = normalize(toCamera);
  vec3 r = reflect(-v, n);

  vec3 diff = max(0.0, dot(n, l)) * diffColor;
  vec3 spec = pow(max(0.0, dot(l, r)), 10.0) * specColor;

  gl_FragColor = vec4(ambColor + diff + spec, 1.0);
}
