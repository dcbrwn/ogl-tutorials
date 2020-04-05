import { createCubeVertices } from "./utils/createCubeVertices.js";
import { calcFlatNormalsForVertices } from "./math.js";
import * as mat4 from "../vendor/gl-matrix/mat4.js";
import { createPlaneVertices } from "./utils/createPlaneVertices.js";

/**
 * @typedef MeshData
 * @property {Float32Array} vertices
 * @property {Uint16Array} indices
 * @property {Float32Array} [normals]
 */

export class Mesh {
  /** @type {MeshData} */
  data;

  /**
   * @public
   * @type {Float32Array}
   */
  modelMatrix;

  /**
   * @param {any} gl
   */
  static cube(gl) {
    const vertices = createCubeVertices();
    const normals = calcFlatNormalsForVertices(vertices);

    return new Mesh(gl, {
      vertices: vertices,
      normals: normals,
      indices: new Uint16Array(vertices.slice(0, vertices.length / 3).map((v, i) => i)),
    });
  }

  static plane(gl, normal) {
    const vertices = createPlaneVertices(normal);
    const normals = calcFlatNormalsForVertices(vertices);

    return new Mesh(gl, {
      vertices: vertices,
      normals: normals,
      indices: new Uint16Array(vertices.slice(0, vertices.length / 3).map((v, i) => i)),
    });
  }

  /**
   * @param {WebGL2RenderingContext} gl
   * @param {MeshData} data
   */
  constructor(gl, data) {
    this.gl = gl;
    this.indicesBuffer = gl.createBuffer();
    this.vertexBuffer = gl.createBuffer();
    this.normalBuffer = gl.createBuffer();
    this.modelMatrix = mat4.create();

    if (data) {
      this.setData(data);
    }
  }

  /**
   * @param {MeshData} data
   */
  setData(data) {
    const { gl } = this;
    this.data = data;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data.vertices.buffer, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.indices.buffer, gl.STATIC_DRAW);

    if (data.normals) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, data.normals.buffer, gl.STATIC_DRAW);
    }
  }

  /**
   * @param {WebGLProgram} program
   * @param {any} camera
   */
  render(program, camera) {
    const { gl, modelMatrix } = this;
    const aPosition = gl.getAttribLocation(program, 'aPosition');
    const aNormal = gl.getAttribLocation(program, 'aNormal');
    const uVPMatrix = gl.getUniformLocation(program, 'transformMatrix');
    const uModelMatrix = gl.getUniformLocation(program, 'uModelMatrix');

    gl.useProgram(program);

    gl.uniformMatrix4fv(uVPMatrix, false, camera.transformMatrix);

    if (uModelMatrix) {
      gl.uniformMatrix4fv(uModelMatrix, false, modelMatrix);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indicesBuffer);

    if (aNormal !== -1) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
      gl.enableVertexAttribArray(aNormal);
      gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
    }

    gl.drawArrays(gl.TRIANGLES, 0, this.data.indices.length);

    if (aNormal !== -1) {
      gl.disableVertexAttribArray(aNormal);
    }

    gl.disableVertexAttribArray(aPosition);
  }
}
