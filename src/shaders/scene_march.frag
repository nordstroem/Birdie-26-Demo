#version 330
OJ_INCLUDE_UTILS

in vec2 fragCoord;
out vec4 fragColor;

uniform float tick;

uniform sampler2D noiseP;


vec2 mod2(vec2 a, vec2 b)
{
	return vec2(a.x - b.x * floor(a.x/b.x), a.y - b.y * floor(a.y/b.y));
}

vec2 ground(vec3 p)
{
	float tex = 10.0*length(texture(noiseP, p.xz/250.0).xyz) + 30.0*length(texture(noiseP, p.xz/1000.0).xyz) + 5.0*length(texture(noiseP, p.xz/100.0).xyz) +
	100.0*length(texture(noiseP, p.xz/2000.0).xyz);
	float d = p.y - tex + 120;
	return vec2(d, 1.0);
	//return vec2(p.y - (sin(p.x * 0.1) * 3 + sin(p.z * 0.1) * 3), 1.0);
}

vec2 union(vec2 a, vec2 b)
{
	if(a.x < b.x) 
	{
		return a;
	}
	else
	{
		return b;
	}
}

vec2 nuke(vec3 p)
{
	vec3 pos = vec3(0, 0, 500);
	float size = tick * 1000;
	return vec2(sphere(p - pos, 1+smoothstep(1, 5, tick)*500) + length(sin(p)), 4.0);
}

vec2 scene(vec3 p)
{
    vec2 res = vec2(9999999999.0, -1.0);
    //res = min(res, sdTorus(p + vec3(2, 0, 0), vec2(0.5, 0.1)));
    //res = min(res, ALetter(p - vec3(0,1,0), 0.1));
    
    vec2 g = ground(p);
    //vec2 n = nuke(p);
    
    
    
    vec2 c1 = vec2(12); 
    vec2 m1 = mod(vec2(p.x, p.z + tick * 0.4), c1) - 0.5 * c1;
    vec2 d1 = floor(vec2(p.x, p.z + tick * 0.4) / c1) - 0.5 * c1;
    vec3 q1 = vec3(m1.x, g.x, m1.y);
    
    vec2 c = vec2(1); 
    vec2 m = mod(q1.xz, c) - 0.5 * c;
    vec2 d = q1.xz / c - 0.5 * c;
    vec3 q = vec3(m.x, q1.y, m.y);
    float a = 0; //d.x + d.y; //d1.x + d1.y;//tick;
    mat3 ma = mat3(	cos(a), 0, sin(a),
					0, 1, 0,
					-sin(a), 0,cos(a));
	vec3 qr = inverse(ma)*q;
    res = union(res, vec2(max(Marcher(qr - vec3(0.25, 1, 0.0), 0.08 + sin(d1.x + d1.y) * 0.06), sdBox(q1, vec3(5.0, 99999999,5.0))), 2.0));
    res = union(res, g);
    //res = union(res, n);
    //res = min(res, max(sdBox(q, vec3(0.3)), sdBox(q1, vec3(5.0))));
    return res;
}

float shadow(in vec3 ro, in vec3 rd, float mint, float maxt )
{
    for( float t=mint; t < maxt; )
    {
        float h = scene(ro + rd*t).x;
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
		float h = scene( ro + rd*t ).x;
        res = min( res, 8.0*h/t );
        t += clamp( h, 0.02, 0.10 );
        if( h<0.001 || t>tmax ) break;
    }
    return clamp( res, 0.0, 1.0 );

} 

vec3 getNormal(vec3 p)
{
    vec3 normal;
    vec3 ep = vec3(0.01,0,0);
    normal.x = scene(p + ep.xyz).x - scene(p - ep.xyz).x;
    normal.y = scene(p + ep.yxz).x - scene(p - ep.yxz).x;
    normal.z = scene(p + ep.yzx).x - scene(p - ep.yzx).x;
    return normalize(normal);
}


vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 applyFog(vec3 rgb, float dis, vec3 rayDir, vec3 sunDir)
{
	float fogAmount = 1.0 - exp(-dis*0.003);
	float sunAmount = max(0.0, dot(rayDir, sunDir));
	vec3 fogColor = mix(vec3(0.6), vec3(1.0,0.9,0.7), pow(sunAmount,12.0));
	return mix(rgb, fogColor, fogAmount);
}

void main()
{
    vec3 eye = vec3(5.0, 30, 10);
	
	vec3 tar = eye + vec3(0.0, -0.3, 1.0);
	vec3 forward = normalize(tar - eye);
    vec3 up = vec3(0, 1, 0);
    vec3 right = cross(forward, up);

    
    float f = 1.5;
    float u = fragCoord.x;
    float v = 9.0/16.0*fragCoord.y;
    //vec3 ro = eye + forward * f + right * u + up * v;
	//vec3 rd = normalize(ro - eye);

    vec3 color = vec3(0.0, 0.0, 0.0); // Sky color
   	vec3 ambient = vec3(0.5, 0.5,0.1);
    vec3 invLight = -normalize(vec3(0,-0.5, 1));
            
    float t = 0.0;
    int N = 1;
    float eps = 0.01;
    for(int k = 0; k < N; ++k)
    {
        vec3 ro = eye + forward * f + right * u + up * v;
		vec3 rd = normalize(ro - eye) + vec3(k/1000.0);
    	for(int j = 0; j < 1; ++j)
	    {
	    	t = 0;
	    	 for(int i = 0; i < 2000 && t < 10000; ++i)
	   		 {
		        vec3 p = ro + rd * t;
		        vec2 dm = scene(p);
		        float d = dm.x;
		        float m = dm.y;
		      	
		        if(d < eps)
		        {
		           vec3 normal = getNormal(p);
		            float diffuse = max(0.,dot(invLight, normal));
		            if (m == 2.0) {
			            if (j == 0) {
			            	color += 1.0/N * 0.8 * vec3(ambient*(1.0+diffuse));
			            } else {
			            	color += 1.0/N * 0.2 * vec3(ambient*(1.0+diffuse));
			            } 
		            } else if (m == 1.0) {
		            	color = (1.0 + diffuse)*vec3(0, 0.3, 0) * shadow(p, invLight, 0.1, 5); //(1.0 + diffuse)*
		            	//color*=(1 + diffuse*0.1);
		            	//color = mix(color, vec3(1.0), diffuse); 
		            	
		            } else if (m == 4.0) { // nuke
		            	float tex = length(texture(noiseP, p.xy*0.01 + tick*10.0).xyz);
		            	float dist = ground(p).x;
		            	color = vec3(clamp(1 - dist/300.0, 0.0, 1.0), 0.0, 0.0);
		            	color = mix(color, vec3(1.0, 0.4, 0.0), tex);
		            }
		         	//color = applyFog(color, distance(eye, p), rd, invLight);
		            //color = vec3(1, 0, 1);
		            //color.x *= mod(floor(p.x*3.0) + floor(p.z * 3.0), 2.0);
		            
		            //rd = reflect(rd, normal);
		            //ro = p + rd*0.01;
		           	break;
		        }
				
				t += d;
		        
	    	}
	    }
    }
    
    
   
    color = pow( color, vec3(0.4545) ); //It's not randomly chose. 0.4545 is 1/2.2, which is the standard gamma value for most monitors.
    fragColor = vec4(color, 1.0);
}


  