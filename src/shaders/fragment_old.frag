#version 330

#define product(a, b) vec2(a.x*b.x-a.y*b.y, a.x*b.y+a.y*b.x)
#define conjugate(a) vec2(a.x,-a.y)
#define divide(a, b) vec2(((a.x*b.x+a.y*b.y)/(b.x*b.x+b.y*b.y)),((a.y*b.x-a.x*b.y)/(b.x*b.x+b.y*b.y)))
#define STEPS 50
#define MAX_STEPS 64
#define eps 0.01
#define SCALE -1.5

in vec2 fragCoord;
out vec4 fragColor;

uniform int tick;



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
	
	while(iter < max_iter && length(p) < 10)
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


void main()
{
	float tf = float(tick);

	float u = fragCoord.x*2;
	float v = fragCoord.y*1.5;
	
	vec2 c = vec2(sin(tf/100), cos(tf/200));
	vec2 z = vec2(u, v);
	vec4 color = vec4(1, 1, 1, 1);
	
	float val = mandelbox(vec3(u,v,0));
	color = vec4(val, val, val, 1);
	
	/*float max_iter = 50;
	float iter = 0;

	while(iter < max_iter && length(z) < 2)
	{
		z = product(z, z) + c;
		iter++;
	}
	float val = max(iter,7)/max_iter;
	color = vec4(val, val*0.5, val*(cos(tf/100.0) + 1)/2, 1);
	*/
    fragColor = color;
}

