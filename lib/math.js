import * as vec3 from "../vendor/gl-matrix/vec3.js";

const v0 = vec3.create();
const v1 = vec3.create();
const v2 = vec3.create();
const d0 = vec3.create();
const d1 = vec3.create();

export function calcFlatNormalsForVertices(vertices) {
  const result = vertices.reduce((memo, coord, index) => {
    const i = index % 9;

    if (i === 0) {
      memo.v0 = [];
      memo.v1 = [];
      memo.v2 = [];
    }

    if (i < 3) {
      memo.v0.push(coord);
    } else if (i < 6) {
      memo.v1.push(coord);
    } else if (i < 9) {
      memo.v2.push(coord);
    }

    if (i === 8) {
      vec3.set(v0, memo.v0[0], memo.v0[1], memo.v0[2]);
      vec3.set(v1, memo.v1[0], memo.v1[1], memo.v1[2]);
      vec3.set(v2, memo.v2[0], memo.v2[1], memo.v2[2]);
      vec3.sub(d0, v1, v0);
      vec3.sub(d1, v2, v0);
      vec3.cross(d0, d0, d1);
      vec3.normalize(d0, d0);

      for (let i = 0; i < 3; i++)
        memo.normals.push(...d0);
    }

    return memo;
  }, {
    normals: [],
  });

  return result.normals;
}

export function toRad(deg) {
  return deg * Math.PI / 180;
}
