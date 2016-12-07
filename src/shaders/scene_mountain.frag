#version 430


in vec2 fragCoord;
out vec4 fragColor;

uniform float tick;

uniform sampler2D noiseP;

OJ_INCLUDE_UTILS

#define TIME_RAISED 5//5
#define TIME_COLORED 6//6
#define COLORED(p) step(TIME_COLORED, tick - p.x*0.01)

vec2 un(vec2 a, vec2 b)
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

float pyrField(vec2 p, float base, float h )
{
	vec2 pyr = min(mod(p, base), base -  mod(p, base));
	return min(pyr.x, pyr.y) * h;
}

vec2 mountains(vec2 p)
{
	float t = 5 * texture(noiseP, p.xy/50.0).x + 
				50 * texture(noiseP, p.xy/300.0).x + 
				200 * texture(noiseP, p.xy/6000.0).x ;
			
	float pyr = max(pyrField(p, 100, 1.3), pyrField(p + 10, 90, 1.3));
	pyr = max(pyr, pyrField(p + 60, 110, 1.3));
	float h = t + pyr;
	
	h *= smoothstep(0, TIME_RAISED, tick);
	
	return vec2(h, 1.0);
}



vec2 scene(vec3 p, float t, vec3 rd)
{  
	vec2 res = vec2(99999999.0, -1.0);
	if (p.y > 275 || rd.y > 0.2) { 
		return res;
	}
	vec2 m = mountains(p.xz);
	res = un(res, vec2(p.y -m.x, m.y));
    return res;
}

/*float shadow(in vec3 ro, in vec3 rd, float mint, float maxt )
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

} */

vec3 getNormal(vec3 p, float t, vec3 rd)
{
    vec3 normal;
    vec3 ep = vec3(0.1,0,0);
    normal.x = scene(p + ep.xyz, t, rd).x - scene(p - ep.xyz, t, rd).x;
    normal.y = scene(p + ep.yxz, t, rd).x - scene(p - ep.yxz, t, rd).x;
    normal.z = scene(p + ep.yzx, t, rd).x - scene(p - ep.yzx, t, rd).x;
    return normalize(normal);
}

vec3 getNormalEps(vec3 p, float t, vec3 rd, float eps)
{
    vec3 normal;
    vec3 ep = vec3(eps,0,0);
    normal.x = scene(p + ep.xyz, t, rd).x - scene(p - ep.xyz, t, rd).x;
    normal.y = scene(p + ep.yxz, t, rd).x - scene(p - ep.yxz, t, rd).x;
    normal.z = scene(p + ep.yzx, t, rd).x - scene(p - ep.yzx, t, rd).x;
    return normalize(normal);
}


vec3 campos(float tick)
{
	vec2 p = vec2(0, -tick); // -tick * 15
	return vec3(100*sin(tick), 210, 100*cos(tick));  // mountains(p).x + 
}

vec3 camdir(float tick)
{
	return vec3(0,0,-1);//vec3(sin(-tick * 0.02), 0, cos(-tick * 0.02));
}

vec3 applyFog(vec3 rgb, float dis, vec3 rayDir, vec3 sunDir, vec3 p)
{
	float disFog = 1.0 - exp(-dis*0.0015);
	float heightFog = 1 - smoothstep(150, 230, p.y);
	float fogAmount = max(disFog, heightFog);
	float sunAmount = max(0.0, dot(rayDir, sunDir));
	vec3 fogColor = mix(vec3(0.6), vec3(1.0,0.9,0.7), pow(sunAmount,12.0));
	return mix(rgb, fogColor, fogAmount);
}

float specular(vec3 normal, vec3 light, vec3 viewdir, float s)
{
	float nrm = (s + 8.0) / (3.1415 * 8.0);
	float k = max(0.0, dot(viewdir, reflect(light, normal)));
    //return pow(max(dot(reflect(eye,normal),light), 0.0), 8.0);
    return pow(k, s);
}

void main()
{
	float iGlobalTime = float(tick);
    
    
	
	vec3 eye = campos(tick);
	vec3 dir = camdir(tick);
	//vec3 tar = eye + dir;
	vec3 tar = vec3(0, 200, 0);
	vec3 forward = normalize(tar - eye);
    vec3 up = vec3(0, 1, 0);
    vec3 right = cross(forward, up);

    
    float f = 1.5;
    //float pt = 1000.0*smoothstep(0.0, 60*10.0, float(tick));
    float pt = 40.0;
    //if (fragCoord.y + fragCoord.x + tick*0.01 > 1) {
    	pt = 10000.0;
    //}
    float u = floor(fragCoord.x*pt)/pt;
    float v = 9.0/16.0*floor(fragCoord.y*pt)/pt;
    //vec3 ro = eye + forward * f + right * u + up * v;
	//vec3 rd = normalize(ro - eye);

	vec3 skyColor = vec3(0.1, 0.1, 0.7);
    vec3 color = skyColor; // Sky color
   	vec3 ambient = vec3(0.2, 0.5,0.1);
     vec3 invLight = -normalize(vec3(0, 0.5, -1)); 
    bool sky = true;
           
    float t = 0.0;
    
    vec3 ro = eye + forward * f + right * u + up * v;
	vec3 rd = normalize(ro - eye);

	//t = -ro.y/rd.y < 0 ? 0 : -ro.y/rd.y*0.8;
	float ref = 0.0;

	 for(int i = 0; i < 1500 && t < 5000; ++i) // i < 2000
	 {
	   	vec3 p = ro + rd * t;
	    vec2 dm = scene(p, iGlobalTime, rd);
	    float d = dm.x;
	    float m = dm.y;
	
	    if(d < 0.01) //0.01
	    {
	    	float spec = 1;
	    	vec3 normal = getNormal(p, iGlobalTime, rd);
	    	
	    	if (m == 1.0) //mountain
	    	{
	    		
	    		vec3 n = getNormalEps(p, iGlobalTime, rd, 1);		
	    		color = mix(vec3(normal.y > 0.38 ? 0.9 : 0), vec3(n.y), 0.5); //mountain //0.38
	    		vec3 grid = mod(floor(p.x) + floor(p.z), 2) == 1.0 ? vec3(0) : vec3(0.5, 0, 0.5); // grid
	    		color = mix(grid, color, COLORED(p));
	
	    	}
	    	
	    	
	
			
			float diffuse = COLORED(p) * max(0., dot(invLight, normal)); 
	     	//color =  mix(color, vec3(0.5), diffuse); //diffuse //vec3(0.4,0.8,0.8)
			color = color*(1.0 + diffuse);
		   	color = mix(color, applyFog(color, distance(eye, p), rd, invLight, p) * smoothstep(0, TIME_RAISED, tick), COLORED(p));
	
			//color += COLORED(p) * spec*vec3(specular(normal, -normalize(vec3(0, 1, 1)), normalize(eye - p), 20.0));
			
	    	
	    	//rd = reflect(rd, vec3(0, 1, 0)); //TODO alltid up
	    	//rd = reflect(rd, normal);
	        //ro = p + rd*0.01;
	        //t = 0;
	        sky = false;
	       	break;
	    }
	    t += max(d*0.2*(2 - smoothstep(0, TIME_RAISED, tick)), 0.01);
	 }
	
	if (sky) {
		t = (2000 - ro.y)/rd.y;
		if(t > 0) {
			float px = ro.x + t * rd.x;
			float pz = ro.z + t * rd.z;
			float realTex = texture(noiseP, vec2(px, pz)*0.0001).x;
			float dis = 0.02*sqrt(px*px + pz*pz);
			realTex = smoothstep(0.6, 0.8, realTex);
			color = vec3(realTex);
			
			color = mix(color, vec3(0.4, 0.4, 1), 0.8)*2;
			color = applyFog(color, dis, rd, invLight, ro + t*rd);
			
			
		} else {
			color = vec3(0.5,0,0.5);
		}
		
	}
	
    //color = pow( color, vec3(0.4545) ); //It's not randomly chose. 0.4545 is 1/2.2, which is the standard gamma value for most monitors.
    fragColor = vec4(color, 0.0);
    //fragColor = ;
}


  