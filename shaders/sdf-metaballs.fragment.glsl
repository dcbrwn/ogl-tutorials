precision mediump float;

const int MAX_MARCHING_STEPS = 100;
const float MIN_DIST = 0.0;
const float MAX_DIST = 100.0;
const float EPSILON = 0.001;

uniform sampler2D uSampler;
uniform float uTime;
uniform vec2 uResolution;

/**
 * Rotation matrix around the Y axis.
 */
mat3 rotateY(float theta) {
  float c = cos(theta);
  float s = sin(theta);
  return mat3(
    vec3(c, 0, s),
    vec3(0, 1, 0),
    vec3(-s, 0, c)
  );
}

/**
 * Signed distance function for a sphere centered at the origin with radius r.
 */
float sphereSDF(vec3 p, float r) {
  return length(p) - r;
}

// polynomial smooth min (k = 0.1);
float smin(float a, float b, float k) {
  float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
  return mix( b, a, h ) - k*h*(1.0-h);
}

/**
 * Signed distance function describing the scene.
 */
float sceneSDF(vec3 samplePoint) {
  float ballRadius = 1.0;
  float t = uTime / 10000.0 + 10500.0;
  float balls = MAX_DIST;
  for (float i = 1.0; i < 4.0; i += 1.3) {
    for (float j = 1.0; j < 4.0; j += 1.3) {
      balls = smin(balls, sphereSDF(samplePoint + vec3(sin(t * i) * j, cos(t * j) * i, cos(t * i) * j), ballRadius), 0.7);
    }
  }

  return balls;
}

/**
 * Return the shortest distance from the eyepoint to the scene surface along
 * the marching direction. If no part of the surface is found between start and end,
 * return end.
 *
 * eye: the eye point, acting as the origin of the ray
 * marchingDirection: the normalized direction to march in
 * start: the starting distance away from the eye
 * end: the max distance away from the ey to march before giving up
 */
float shortestDistanceToSurface(vec3 eye, vec3 marchingDirection, float start, float end) {
  float depth = start;
  for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
    float dist = sceneSDF(eye + depth * marchingDirection);
    if (dist > 0.000001 && dist < EPSILON) {
      return depth;
    }
    depth += dist;
    if (depth >= end) {
      return end;
    }
  }
  return end;
}

vec3 rayDirection(float fieldOfView, vec2 size, vec2 fragCoord) {
  vec2 xy = fragCoord - size / 2.0;
  float z = size.y / tan(radians(fieldOfView) / 2.0);
  return normalize(vec3(xy, -z));
}

/**
 * Using the gradient of the SDF, estimate the normal on the surface at point p.
 */
vec3 estimateNormal(vec3 p) {
  return normalize(vec3(
    sceneSDF(vec3(p.x + EPSILON, p.y, p.z)) - sceneSDF(vec3(p.x - EPSILON, p.y, p.z)),
    sceneSDF(vec3(p.x, p.y + EPSILON, p.z)) - sceneSDF(vec3(p.x, p.y - EPSILON, p.z)),
    sceneSDF(vec3(p.x, p.y, p.z  + EPSILON)) - sceneSDF(vec3(p.x, p.y, p.z - EPSILON))
  ));
}

mat3 viewMatrix(vec3 eye, vec3 center, vec3 up) {
  // Based on gluLookAt man page
  vec3 f = normalize(center - eye);
  vec3 s = normalize(cross(f, up));
  vec3 u = cross(s, f);
  return mat3(s, u, -f);
}

vec2 projectER(vec3 dir) {
  float pi = 3.1415926;
	vec2 uv;
	uv.x = atan( dir.z, dir.x );
	uv.y = acos( dir.y );
	uv /= vec2( 2.0 * pi, pi );
  return uv;
}

vec4 refractColor(vec3 eye, vec3 dir) {
  float dist = MAX_DIST;
  vec3 origin = eye;
  vec3 direction = dir;

  for (int i = 0; i < 8; i++) {
    dist = shortestDistanceToSurface(origin, direction, MIN_DIST, MAX_DIST);

    if (dist > MAX_DIST - EPSILON) {
      return texture2D(uSampler, projectER(direction));
    }

    origin = origin + (dist + 4.0 * EPSILON) * direction;
    direction = refract(direction, estimateNormal(origin), 0.9);
  }

  return vec4(0.0);
}

vec4 reflectColor(vec3 eye, vec3 dir) {
  float dist = MAX_DIST;
  vec3 origin = eye;
  vec3 direction = dir;

  for (int i = 0; i < 6; i++) {
    dist = shortestDistanceToSurface(origin, direction, MIN_DIST, MAX_DIST);

    if (dist > MAX_DIST - EPSILON) {
      return texture2D(uSampler, projectER(direction));
    }

    origin = origin + (dist - EPSILON) * direction;
    direction = reflect(direction, estimateNormal(origin));
  }

  return vec4(0.0);
}

void main()
{
  vec3 viewDir = rayDirection(90.0, uResolution.xy, gl_FragCoord.xy);
  vec3 eye = rotateY(uTime / 10000.0) * vec3(10.0, 3.0, 3.0);
  mat3 viewToWorld = viewMatrix(eye, vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0));
  vec3 worldDir = viewToWorld * viewDir;
  gl_FragColor = reflectColor(eye, worldDir);
}
