#version 330

in vec2 fragCoord;
out vec4 fragColor;

uniform int tick;


#define MAX_STEPS 128
#define eps 0.01
#define SCALE 3

#define _NL_ xpos = 0; ypos + ps;
#define _1_ res = (); xpos + ps;
#define _0_ xpos + ps;
#define _A_ _1_ X O _NL_ X O X _NL_ O X O _NL_ X O X
#define _LETTER_(M) float MLetter float xpos = 0; float ypos = 0; _M_

#define A 010101111101
#define RES(x,y) res = min(res, sdBox(p + vec3(x*2.0, y*2.0, 0), vec3(ps)));

float sphere(vec3 p, float r)
{
	return length(p) - r;
}

float udBox( vec3 p, vec3 b )
{
  return length(max(abs(p)-b,0.0));
}

float sdBox( vec3 p, vec3 b )
{
  vec3 d = abs(p) - b;
  return min(max(d.x,max(d.y,d.z)),0.0) +
         length(max(d,0.0));
}


float sdTorus( vec3 p, vec2 t )
{
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}

float JLetter(vec3 p, float ps)
{
	float res = 0;
	return min(sdBox(p,vec3(ps)), sdBox(p + vec3(0, ps*2.1, 0),vec3(ps)));
}

float ALetter(vec3 p, float ps)
{
	float res = 99999999;
	res = min(res, sdBox(p + vec3(1* ps * 2.1, 0 * ps * 2.1, 0), vec3(ps)));
	res = min(res, sdBox(p + vec3(0* ps * 2.1, 1 * ps * 2.1, 0), vec3(ps)));
	res = min(res, sdBox(p + vec3(2* ps * 2.1, 1 * ps * 2.1, 0), vec3(ps)));
	res = min(res, sdBox(p + vec3(0* ps * 2.1, 2 * ps * 2.1, 0), vec3(ps)));
	res = min(res, sdBox(p + vec3(1* ps * 2.1, 2 * ps * 2.1, 0), vec3(ps)));
	res = min(res, sdBox(p + vec3(2* ps * 2.1, 2 * ps * 2.1, 0), vec3(ps)));
	res = min(res, sdBox(p + vec3(0* ps * 2.1, 3 * ps * 2.1, 0), vec3(ps)));
	res = min(res, sdBox(p + vec3(2* ps * 2.1, 3 * ps * 2.1, 0), vec3(ps)));
	return res;
}




float scene(vec3 p)
{
    vec3 c = vec3(5);
    vec3 q = mod(p,c)-0.5*c;
    float res = sdBox(p + vec3(0, 6, 0), vec3(5)); //min(sdBox(p + vec3(0, 6, 0), vec3(5)), sdBox(p, vec3(0.5)));
    res = min(res, sdTorus(p + vec3(2, 0, 0), vec2(0.5, 0.1)));
    res = min(res, ALetter(p - vec3(0,1,0), 0.1));
    return res;
}

float shadow(in vec3 ro, in vec3 rd, float mint, float maxt )
{
    for( float t=mint; t < maxt; )
    {
        float h = scene(ro + rd*t);
        if( h<0.01 )
            return 0.3;
        t += h;
    }
    return 1.0;
}

float softshadow( in vec3 ro, in vec3 rd, in float mint, in float tmax )
{
	float res = 1.0;
    float t = mint;
    for( int i=0; i<16; i++ )
    {
		float h = scene( ro + rd*t );
        res = min( res, 8.0*h/t );
        t += clamp( h, 0.02, 0.10 );
        if( h<0.001 || t>tmax ) break;
    }
    return clamp( res, 0.0, 1.0 );

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
    vec3 eye = vec3(sin(tick/200.0)*5, 2, cos(tick/200.0)*5 );
	
	vec3 tar = vec3(0, 0, 0);
	vec3 forward = normalize(tar - eye);
    vec3 up = vec3(0, 1, 0);
    vec3 right = cross(forward, up);

    
    float f = 1.5;
    float u = fragCoord.x;
    float v = fragCoord.y;
    //vec3 ro = eye + forward * f + right * u + up * v;
	//vec3 rd = normalize(ro - eye);

    vec3 color = vec3(0.0, 0.0, 0.0); // Sky color
   	vec3 ambient = vec3(0.5, 0.5,0.1);
    vec3 invLight = -normalize(vec3(0.0,-1.0,0.0));
            
    float t = 0.0;
    int N = 1;
    for(int k = 0; k < N; ++k)
    {
        vec3 ro = eye + forward * f + right * u + up * v;
		vec3 rd = normalize(ro - eye) + vec3(k/1000.0);
    	for(int j = 0; j < 2; ++j)
	    {
	    	t = 0;
	    	 for(int i = 0; i < MAX_STEPS && t < 100; ++i)
	   		 {
		        vec3 p = ro + rd * t;
		        float d = scene(p);
		      	
		        if(d < eps)
		        {
		            vec3 normal = getNormal(p);
		            float diffuse = max(0.,dot(invLight, normal));
		            if (j == 0) {
		            	color += 1.0/N * 0.8 * vec3(ambient*(1.0+diffuse)) * shadow(p, invLight, 1.0, 2.5);
		            } else {
		            	color += 1.0/N * 0.2 * vec3(ambient*(1.0+diffuse)) * shadow(p, invLight, 1.0, 2.5);
		            }
		            
		            //color.x *= mod(floor(p.x*3.0) + floor(p.z * 3.0), 2.0);
		            
		            rd = reflect(rd, normal);
		            ro = p + rd*0.01;
		           	break;
		        }
		
		        t += d;
	    	}
	    }
    }
    
    
   
    color = pow( color, vec3(0.4545) ); //It's not randomly chose. 0.4545 is 1/2.2, which is the standard gamma value for most monitors.
    fragColor = vec4(color, 1.0);
}


  