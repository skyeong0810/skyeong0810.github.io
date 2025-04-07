#version 300 es
precision mediump float;

layout(location = 0) in vec3 aPos;

uniform mat4 u_model;

void main() {
    gl_Position = u_model * vec4(aPos, 1.0);
}
