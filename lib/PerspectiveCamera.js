import * as mat4 from "../vendor/gl-matrix/mat4.js";

export class PerspectiveCamera {
  constructor(fov, aspect, near, far) {
    this.viewMatrix = mat4.create();
    this.projectionMatrix = mat4.create();
    this.transformMatrix = mat4.create();
    mat4.perspective(this.projectionMatrix, fov, aspect, near, far);
    this._updateCombinedMatrix();
  }
  _updateCombinedMatrix() {
    mat4.mul(this.transformMatrix, this.projectionMatrix, this.viewMatrix);
  }
  lookAt(position, target, orientation) {
    mat4.lookAt(this.viewMatrix, position, target, orientation);
    this._updateCombinedMatrix();
  }
}
