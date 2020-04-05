/**
 * Returns vertices for cube with center at origin
 *
 * @returns {Float32Array}
 * @param {number} [side]
 */
export function createCubeVertices(side = 1.0) {
  const a = side / 2;

  return new Float32Array([
    -a, -a, -a,
    -a, -a, +a,
    -a, +a, +a,
    +a, +a, -a,
    -a, -a, -a,
    -a, +a, -a,
    +a, -a, +a,
    -a, -a, -a,
    +a, -a, -a,
    +a, +a, -a,
    +a, -a, -a,
    -a, -a, -a,
    -a, -a, -a,
    -a, +a, +a,
    -a, +a, -a,
    +a, -a, +a,
    -a, -a, +a,
    -a, -a, -a,
    -a, +a, +a,
    -a, -a, +a,
    +a, -a, +a,
    +a, +a, +a,
    +a, -a, -a,
    +a, +a, -a,
    +a, -a, -a,
    +a, +a, +a,
    +a, -a, +a,
    +a, +a, +a,
    +a, +a, -a,
    -a, +a, -a,
    +a, +a, +a,
    -a, +a, -a,
    -a, +a, +a,
    +a, +a, +a,
    -a, +a, +a,
    +a, -a, +a,
  ]);
}
