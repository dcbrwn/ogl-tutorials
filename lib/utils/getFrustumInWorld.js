import { createCubeVertices } from "./createCubeVertices";
import * as mat4 from "../../vendor/gl-matrix/mat4";
import * as vec4 from "../../vendor/gl-matrix/vec4";
import { projectPoints } from "./projectPoints";

const clipCube = createCubeVertices(2);
const frustum = new Float32Array(clipCube.length);
const inverse = mat4.create();

/**
 * @param {mat4} mvpMatrix
 */
export function getFrustumInWorld(mvpMatrix) {
  mat4.invert(inverse, mvpMatrix);
  projectPoints(frustum, clipCube, inverse);
  return frustum;
}
