#version 300 es

precision highp float;
precision highp int;

in vec3 aPosition;

uniform mat4 transformMatrix;

void main()
{
    gl_Position = transformMatrix * vec4(aPosition, 1.0);
}
