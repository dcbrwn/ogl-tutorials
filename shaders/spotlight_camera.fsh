#version 300 es

precision highp float;
precision highp int;

uniform sampler2D uShadowMap;

in vec3 normal;
in vec3 toLight;
in vec3 toCamera;
in vec4 fragPosLightSpace;

out vec4 fragColor;

float calcShadow(vec4 fragPosLightSpace)
{
  // perform perspective divide
  vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;

  projCoords = projCoords * 0.5 + 0.5;

  float closestDepth = texture(uShadowMap, projCoords.xy).r;
  float currentDepth = projCoords.z;

  if (currentDepth > 1.0) return 0.0;

  float bias = 0.005;
  float shadow = currentDepth - bias > closestDepth  ? 1.0 : 0.0;

  return shadow;
}

void main() {
  vec3 ambColor = vec3(0.2, 0.1, 0.0);
  vec3 diffColor = vec3(1.0, 0.5, 0.0);
  vec3 specColor = vec3(1.0, 1.0, 1.0);

  vec3 n = normalize(normal);
  vec3 l = normalize(toLight);
  vec3 v = normalize(toCamera);
  vec3 r = reflect(-v, n);

  vec3 diff = max(0.0, dot(n, l)) * diffColor;
  vec3 spec = pow(max(0.0, dot(l, r)), 10.0) * specColor;

  float shadow = 1.0 - calcShadow(fragPosLightSpace);
  fragColor = vec4(ambColor + (diff + spec) * shadow, 1.0);
}
