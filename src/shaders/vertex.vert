#version 430

layout (location = 0) in vec3 position;
out vec2 fragCoord;

void main()
{
	fragCoord = position.xy;
    gl_Position = vec4(position, 1);
}