#version 330

in vec2 fragCoord;
out vec4 fragColor;

uniform float tick;


#define MAX_STEPS 64
#define eps 0.01

float sphere(vec3 p, float r)
{
	return length(p) - r;
}

float scene(vec3 p)
{
    vec3 c = vec3(2.0);
    vec3 q = mod(p,c)-0.5*c;
    return sphere( q, 0.5 );
}

vec3 getNormal(vec3 p)
{
    vec3 normal;
    vec3 ep = vec3(eps,0,0);
    normal.x = scene(p + ep.xyz) - scene(p - ep.xyz);
    normal.y = scene(p + ep.yxz) - scene(p - ep.yxz);
    normal.z = scene(p + ep.yzx) - scene(p - ep.yzx);
    return normalize(normal);
}

void main()
{
	float iGlobalTime = float(tick);
    vec2 iResolution = vec2(4, 3);
    vec3 eye = vec3(0, 0, -2);
    eye = eye + vec3(tick, 0.0, 0.0);
    vec3 up = vec3(0, 1, 0);
    vec3 right = vec3(1, 0, 0);
	vec3 forward = vec3(0, 0, 1);
    
    float f = 1.0;
    float u = fragCoord.x;
    float v = 9.0/16*fragCoord.y;
    vec3 ro = eye + forward * f + right * u + up * v;
	vec3 rd = normalize(ro - eye);

    vec4 color = vec4(0.0); // Sky color
   	vec3 ambient = vec3(0.2, 0.5,0.1);
    vec3 invLight = -normalize(vec3(-1.0,2.0,1.0));
            
    
    float t = 0.0;
    for(int i = 0; i < MAX_STEPS; ++i)
    {
        vec3 p = ro + rd * t;
        float d = scene(p);
      	
        if(d < eps)
        {
            vec3 normal = getNormal(p);
            float diffuse = max(0.,dot(invLight, normal));
            color = vec4(ambient*(1.0+diffuse),1.0);
            break;
        }

        t += d;
    }
	
    fragColor = color;
}

