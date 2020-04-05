import * as mat4 from "../../vendor/gl-matrix/mat4";
import * as vec4 from "../../vendor/gl-matrix/vec4";

const v0 = vec4.create();

/**
 * @param {Float32Array} out
 * @param {Float32Array} vertices
 * @param {mat4} mvpMatrix
 */
export function projectPoints(out, vertices, mvpMatrix) {
  const len = vertices.length / 3;

  for (let i = 0; i < len; i++) {
    const vertexIndex = i * 3;

    vec4.set(
      v0,
      vertices[vertexIndex],
      vertices[vertexIndex + 1],
      vertices[vertexIndex + 2],
      1.0
    );

    vec4.transformMat4(v0, v0, mvpMatrix);

    const [x, y, z, w] = v0;
    out[vertexIndex] = x;
    out[vertexIndex + 1] = y;
    out[vertexIndex + 2] = z;
  }

  return out;
}
