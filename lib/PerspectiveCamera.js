import * as mat4 from "../vendor/gl-matrix/mat4.js";
import * as vec3 from "../vendor/gl-matrix/vec3.js";

export class PerspectiveCamera {
  /**
   * @param {number} fov
   * @param {number} aspect
   * @param {number} near
   * @param {number} far
   */
  constructor(fov, aspect, near, far) {
    this.viewMatrix = mat4.create();
    this.projectionMatrix = mat4.create();
    this.transformMatrix = mat4.create();
    mat4.perspective(this.projectionMatrix, fov, aspect, near, far);
    this.#updateCombinedMatrix();
  }

  /**
   * @param {vec3} position
   * @param {vec3} target
   * @param {vec3} orientation
   */
  lookAt(position, target, orientation) {
    mat4.lookAt(this.viewMatrix, position, target, orientation);
    this.#updateCombinedMatrix();
  }

  #updateCombinedMatrix = () => {
    mat4.mul(this.transformMatrix, this.projectionMatrix, this.viewMatrix);
  }
}
