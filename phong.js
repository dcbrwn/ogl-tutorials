'use strict';

const gl = initGL();

const camera = new PerspectiveCamera(45, 4/3, 0.1, 100);
camera.lookAt(
  vec3.fromValues(3,2,2),
  vec3.fromValues(0,0,0),
  vec3.fromValues(0,1,0)
);

Promise
  .all([
    loadProgram(gl, 'shaders/phong.vsh', 'shaders/phong.fsh'),
    loadObj('assets/teapot.obj'),
  ])
  .then(([program, mesh]) => {
    setRenderFunc((dt) => {
      mesh.render(program, camera);
    });
  });
