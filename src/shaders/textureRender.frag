#version 330

in vec2 fragCoord;
out vec4 fragColor;

uniform sampler2D tex;
uniform float tick;

#define SCENE_1 30
#define SCENE_2 60
#define SCENE_3 90
#define SCENE_4 120
#define SCENE_5 150
#define SCENE_6 180

vec3 laplacian(vec3 center, vec3 up, vec3 down, vec3 right, vec3 left)
{
	return 4*center -up - left - right - down;
}

vec3 blur(vec3 center, vec3 up, vec3 down, vec3 right, vec3 left)
{
	return 0.333*center + 0.166*up + 0.166*left + 0.166*right + 0.166*down;
}

vec3 sharpen(vec3 center, vec3 up, vec3 down, vec3 right, vec3 left)
{
	return 5*center -up - left - right - down;
}

void main()
{	float xd = 0.5/640.0;
	float yd = 0.5/360.0;
	vec2 uv = 0.5*(fragCoord + vec2(1));
	vec3 center = texture(tex, uv).xyz;
	vec3 up = texture(tex, vec2(uv.x, uv.y + yd)).xyz; 
	vec3 left = texture(tex, vec2(uv.x - xd, uv.y)).xyz; 
	vec3 right = texture(tex, vec2(uv.x + xd, uv.y)).xyz; 
	vec3 down = texture(tex, vec2(uv.x, uv.y - yd)).xyz; 
	/*vec3 upLeftColor = texture(tex, vec2(uv.x - xd, uv.y + yd)).xyz;
	vec3 upRightColor = texture(tex, vec2(uv.x + xd, uv.y + yd)).xyz;
	vec3 downLeftColor = texture(tex, vec2(uv.x - xd, uv.y - yd)).xyz;
	vec3 downRightColor = texture(tex, vec2(uv.x + xd, uv.y - yd)).xyz;*/	
	
	//vec3 shar = sharpen(center, up, down, right, left);
	vec3 blu = blur(center, up, down, right, left);
	//vec3 lapl = laplacian(center, up, down, right, left);
    //fragColor = vec4(center, 1.0) * (1 - 0.6*length(laplacian(center, up, down, right ,left)));
    //fragColor = vec4(vec3(length(laplacian(center, up, down, right ,left))), 1.0);
    //fragColor = vec4(shar, 1.0);
    if(tick < 2){
    	  	fragColor = vec4(1-center, 1.0);
    }else {
      	fragColor = vec4(center, 1.0);
    }

}

