import * as mat4 from "../../vendor/gl-matrix/mat4.js";
import * as vec3 from "../../vendor/gl-matrix/vec3.js";

const pivot = vec3.fromValues(0, 1, 0);
const rotationAxis = vec3.create();
const transform = mat4.create();

// TODO: Simplify this utter BS
export function createPlaneVertices(normal) {
  vec3.cross(rotationAxis, normal, pivot);
  const angle = Math.acos(vec3.dot(normal, pivot));
  mat4.identity(transform);
  mat4.rotate(transform, transform, angle, rotationAxis);
  const a = 0.5;
  const vertices = [
    vec3.fromValues(-a, 0, +a),
    vec3.fromValues(+a, 0, -a),
    vec3.fromValues(-a, 0, -a),
    vec3.fromValues(+a, 0, +a),
    vec3.fromValues(+a, 0, -a),
    vec3.fromValues(-a, 0, +a),
  ];

  return new Float32Array(vertices.flatMap((vertex) => {
    return [...vec3.transformMat4(vertex, vertex, transform)];
  }));
}
