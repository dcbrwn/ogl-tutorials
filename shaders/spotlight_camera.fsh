#version 300 es

precision highp float;
precision highp int;

uniform sampler2D uShadowMap;

in vec3 normal;
in vec3 lightDir;
in vec3 toLight;
in vec3 toCamera;
in vec4 fragPosLightSpace;

out vec4 fragColor;

float calcShadow(vec4 fragPosLightSpace) {
  // perform perspective divide
  vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
  projCoords = projCoords * 0.5 + 0.5;

  float currentDepth = projCoords.z;
  float bias = 0.005;
  float shadow = 0.0;
  vec2 texelSize = 3.0 / vec2(textureSize(uShadowMap, 0));
  float count = 0.0;

  for (float t = 0.0; t <= 1.0; t += 0.1) {
    vec2 offset = vec2(t * cos(18.0 * t), t * sin(18.0 * t));
    float closestDepth = texture(
      uShadowMap,
      projCoords.xy + offset * texelSize
    ).r;
    shadow += currentDepth - bias > closestDepth ? t * 2.0 : 0.0;
    count += 1.0;
  }

  return shadow / count;
}

void main() {
  vec3 ambColor = vec3(0.1, 0.12, 0.15);
  vec3 diffColor = vec3(0.6, 0.63, 0.65);
  vec3 specColor = vec3(1.0, 1.0, 1.0);

  vec3 n = normalize(normal);
  vec3 l = normalize(toLight);
  vec3 v = normalize(toCamera);
  vec3 r = reflect(-v, n);

  vec3 diff = max(0.0, dot(n, l)) * diffColor;
  vec3 spec = pow(max(0.0, dot(l, r)), 10.0) * specColor;

  float cosine = dot(l, -lightDir);
  float spot = cosine > 0.7 ? pow(cosine, 15.0) : 0.0;

  float shadow = 1.0 - calcShadow(fragPosLightSpace);
  fragColor = vec4(ambColor + (diff + spec) * max(0.05, shadow) * spot, 1.0);
}
