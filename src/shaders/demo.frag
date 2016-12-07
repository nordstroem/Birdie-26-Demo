#version 330

in vec2 fragCoord;
out vec4 fragColor;

uniform int tick;


#define MAX_STEPS 128
#define eps 0.01
#define SCALE 3

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

float checkComp(float c)
{
	if(c > 1)
	{
		c = 2 - c;
	}
	else if(c < -1)
	{
		c = -2 - c;
	}
	return c;
}

float mandelbox(vec3 c)
{
	vec3 p = vec3(0, 0, 0);
	int max_iter = 100;
	int iter = 0;
	
	while(iter < max_iter && length(p) < 1000)
	{
		p.x = checkComp(p.x);
		p.y = checkComp(p.y);
		p.z = checkComp(p.z);
	
		float mag = length(p);
		if(mag < 0.5)
		{
			p = p * 4;
		}
		else if(mag < 1)
		{
			p = p / (mag * mag);
		}
		p = SCALE * p + c;
		iter++;
	}
	
	return iter/max_iter;
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main()
{
	float iGlobalTime = float(tick);
    vec2 iResolution = vec2(4, 3);
    vec3 eye = vec3(sin(tick/100.0), cos(tick/100.0), 8 );
	
	vec3 tar = vec3(0, 0, 0);
	vec3 forward = normalize(tar - eye);
    vec3 up = vec3(0, 1, 0);
    vec3 right = cross(forward, up);

    
    float f = 1.5;
    float u = fragCoord.x;
    float v = fragCoord.y;
    vec3 ro = eye + forward * f + right * u + up * v;
	vec3 rd = normalize(ro - eye);

    vec4 color = vec4(0.0); // Sky color
   	vec3 ambient = vec3(0.2, 0.5,0.1);
    vec3 invLight = -normalize(vec3(-1.0,2.0,1.0));
            
 
    float t = 0;
    for(int i = 0; i < 500; ++i)
    {
    	t += 0.01;
        vec3 c = ro + rd * t;
  		vec3 p = vec3(0, 0, 0);

		int max_iter = 10;
	    int iter = 0;
	   //	if (c.x > 0.5 || c.x < -0.5 || c.y > 0.5 || c.y < -0.5 || c.z > 0.5 || c.z < -0.5) 
	   //	if(length(c) > 1)
		{
		//	continue;
		} 
		while(iter < max_iter && length(p) < 10)
		{
			p.x = checkComp(p.x);
			p.y = checkComp(p.y);
			p.z = checkComp(p.z);
		
			float mag = length(p);
			if(mag < 0.5) //0.5
			{
				p = p * 4;
			}
			else if(mag < 1)
			{
				p = p / (mag * mag);
			}
			//p = SCALE * p + c;
			p = 2 * p + c;
			iter++;
		}
		if(iter == max_iter)
		{
			//float val = length(p)/5.0;
  			//color = vec4(hsv2rgb(vec3(val, sin(val)*0.5, val)), 1);
  			
  			//color = vec4(abs(p)/10.0, 1);
  			
  			color = vec4((1 - i/100.0)*0.6, (1 - i/100.0) * 0.5, (1 - i /100.0) * 0.4, 1);
			break;
		}

  		
    }
	
		
    fragColor = color;
}


  