#version 330
OJ_INCLUDE_UTILS

in vec2 fragCoord;
out vec4 fragColor;

uniform float tick;
uniform sampler2D noiseP;

#define MAT_MIRROR 2.0
#define MAT_MORPH 3.0
#define MAT_WALL 4.0
#define MAT_WATER 5.0

/*float scene(vec3 p)
{
	float box = sdBox(p, vec3(1.0));
	float sphere = sphere(p, 1.0);
	float torus = sdTorus(p, vec2(1,0.3));
	float b = BLetter(p, 0.2);
	float i = ILetter(p, 0.2);
	float r = RLetter(p, 0.2);
	float d = DLetter(p, 0.2);
	float e = ELetter(p, 0.2);
	
	float w = (sin(p.x + tick*0.5) + sin(p.z  + tick*0.5)) * 0.1 + 
		length(texture(noiseP, p.xz*0.5 + vec2(0, tick*0.1)))*0.1 + 
		length(texture(noiseP, p.xz*0.5 + vec2(tick*0.13, 0)))*0.1 - 3;
	
	int t = 2;
	float t1 = smoothstep(t*0, t*1, tick);
	float t2 = smoothstep(t*1, t*2, tick); 
	float t3 = smoothstep(t*2, t*3, tick);
	float t4 = smoothstep(t*3, t*4, tick);
	float t5 = smoothstep(t*4, t*5, tick);
	
	float res = b*(1-t1) + i*t1*(1-t2) + r*t2*(1- t3) + d*t3*(1-t4) + i*t4*(1-t5) + e*t5; 
    return res; //min(res, p.y - w);
}*/


vec2 un(vec2 a, vec2 b)
{
	return a.x < b.x ? a : b;
}

vec2 water(vec3 p, vec3 rd)
{
	if(rd.y > 0){
		return vec2(999999, 3.0);
	}
	
	float d = (sin(p.x + tick*0.5) + sin(p.z  + tick*0.5)) * 0.1 + 
	length(texture(noiseP, p.xz*0.5 + vec2(0, tick*0.1)))*0.1 + 
	length(texture(noiseP, p.xz*0.5 + vec2(tick*0.13, 0)))*0.1;


	//float d =  (sin(p.x + tick*0.05) + sin(p.z  + tick*0.05)) * 0.1;
	//return vec2(p.y - 0, 2.0);
	float h = p.y - d * 0.1;//* ((t+ 50)*0.01);
	
	float dis = (0.1 -p.y)/rd.y;
	


	return vec2(max(h, dis), MAT_WATER);
}

vec2 morph(vec3 po)
{
	vec3 cm = vec3(5);
	vec3 q = mod(po, cm)-0.5*cm;
	float dis = length(po.xz);
	vec3 p = vec3(q.x, po.y - min(0, tick*tick*0.3 - dis), q.z);

	float a = sdBox(p, vec3(1.0));
	float b = sdTorus(p, vec2(1,0.3));
	float c = min(sdTorus(p - vec3(2,0,0), vec2(1,0.3)), sdTorus(p + vec3(2,0,0), vec2(1,0.3)));
	float d = sphere(p, 1.0);
	float e = sdBox(p, vec3(1.0));
	float f = sdTorus(p, vec2(1,0.3));
	float g = sphere(p, 2.0);
	
	float t = 3;
	float ti = tick - sqrt(po.x*po.x + po.z*po.z) * 0.1;
	
	float t1 = smoothstep(t*0, t*1, ti);
	float t2 = smoothstep(t*1, t*2, ti); 
	float t3 = smoothstep(t*2, t*3, ti);
	float t4 = smoothstep(t*3, t*4, ti);
	float t5 = smoothstep(t*4, t*5, ti);
	float t6 = smoothstep(t*5, t*6, ti);
	
	float res = a*(1-t1) + b*t1*(1-t2) + c*t2*(1- t3) + d*t3*(1-t4) + e*t4*(1-t5) + f*t5*(1-t6) + g*t6; 
	
	return vec2(res, MAT_MORPH);
}

vec2 mirror(vec3 p)
{
	vec3 c = vec3(5);
	vec3 q = mod(p,c)-0.5*c;	
	return vec2(sdBox(vec3(q.x, q.y,  p.z + 3) , vec3(2, 2, 0.1)), MAT_MIRROR);
}

vec2 scene(vec3 p, vec3 rd)
{
	vec2 res = vec2(9999999.0, -1.0);
	//vec2 sb = vec2(-sdBox(p, vec3(10,10,10)), MAT_WALL);
	//res = un(water(p), morph(p - vec3(0,2,0)));
	//res = un(morph(p - vec3(0,2,0)), mirror(p));
	//return morph(p - vec3(0,2,0));
	return un(water(p, rd), morph(p - vec3(0,2,0)));
}

float shadow(in vec3 ro, in vec3 rd, float mint, float maxt )
{
    for( float t=mint; t < maxt; )
    {
        float h = scene(ro + rd*t, rd).x;
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
		float h = scene( ro + rd*t, rd).x;
        res = min( res, 8.0*h/t );
        t += clamp( h, 0.02, 0.10 );
        if( h<0.001 || t>tmax ) break;
    }
    return clamp( res, 0.0, 1.0 );

}

vec3 getNormal(vec3 p, vec3 rd)
{
    vec3 normal;
    vec3 ep = vec3(0.01,0,0);
    normal.x = scene(p + ep.xyz, rd).x - scene(p - ep.xyz, rd).x;
    normal.y = scene(p + ep.yxz, rd).x - scene(p - ep.yxz, rd).x;
    normal.z = scene(p + ep.yzx, rd).x - scene(p - ep.yzx, rd).x;
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
	float fogAmount = 1.0 - exp(-dis*0.008);
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
    vec2 iResolution = vec2(4, 3);
    vec3 eye = vec3(8*cos(tick/5.0), 5, 8*sin(tick/5.0));
	//vec3 eye = vec3(0, 2, 6);
	vec3 tar = vec3(0, 0, 0);
	vec3 forward = normalize(tar - eye);
    vec3 up = vec3(0, 1, 0);
    vec3 right = cross(forward, up);

    
    float f = 1;
    float u = fragCoord.x;
    float v = 9.0/16.0*fragCoord.y;
    //vec3 ro = eye + forward * f + right * u + up * v;
	//vec3 rd = normalize(ro - eye);

    vec3 color = vec3(0.01, 0.01, 0.3); // Sky color
    vec3 skyColor = color;
   	vec3 ambient = vec3(0.5, 0.5,0.1);
    vec3 invLight = -normalize(vec3(0, -0.06, 1)); 
            
    float t = 0.0;
    int N = 1;

    vec3 ro = eye + forward * f + right * u + up * v;
	vec3 rd = normalize(ro - eye);
	vec3 rdStart = rd;
	float ref = 1.0;

	for(int j = 0; j < 3; ++j)
    {
    	t = 0;
    	 for(int i = 0; i < 1000 && t < 1000; ++i)
   		 {
	        vec3 p = ro + rd * t;
	        vec2 dm = scene(p, rd);
	        float d = dm.x;
	        float m = dm.y;

	        if(d < 0.01)
	        {
	        	 vec3 normal = getNormal(p, rd);
	        	float diffuse = max(0.,dot(invLight, normal));
				if (m == MAT_MIRROR) {
					diffuse = 0;
	        		color = mix(color, vec3(0.1, 0.1, 0.1) * (1.0 + diffuse), ref);
	        	} else if (m == MAT_MORPH) {
	        		vec3 pc = p + vec3(90);
	        		vec3 matCol = vec3(pc.x/20.0, (pc.x + pc.z) / 10.0, pc.z/15.0);
	        		matCol = (sin(matCol) + 1.0) * 0.5;
	        		color = mix(color, matCol * (1.0 + diffuse), ref);
	        		color += ref * vec3(specular(normal, -invLight, normalize(eye - p), 10.0));

	        	} else if (m == MAT_WALL) {
	        		//diffuse = 0;
	        		color = mix(color, vec3(0.1, 0.1, 0.1) * (1.0 + diffuse), ref);
	        	} else if (m == MAT_WATER) {
	        		color = mix(color, vec3(0.01,0.03,0.3) * (1.0 + 0), ref); 
	        		color += ref*vec3(specular(normal, -invLight, normalize(eye - p), 70.0));
	        	}
				color = applyFog(color, 0.001*distance(eye, p)*distance(eye, p), rd, invLight);

	            rd = reflect(rd, normal);
	            ro = p + rd*0.01;
	            
	            if (m == MAT_MIRROR) {
	        		ref *= 0.5;
	        	} else if (m == MAT_MORPH) {
	        		ref *= 0.4;
	        	} else if (m == MAT_WALL) {
	        		ref = 0.0;
	        	} else if (m == MAT_WATER) {
	        		ref *= 0.5;
	        	}
	           	break;
	        }
	
	        t += d;
    	}
    }
    
       	if (color == skyColor) {
   	
   	   //	color = pow(0.3*color, vec3(0.4545) ); //It's not randomly chose. 0.4545 is 1/2.2, which is the standard gamma value for most monitors.
   	   float sunAmount = max(0.0, dot(rdStart, invLight));
   	   vec3 sunColor = vec3(1.0, 1.0, 0.6);
   	   	float fcc = 0.6;
   		color = vec3(color.x - rdStart.y*fcc, color.y - rdStart.y*fcc, color.z - rdStart.y*fcc);
   		color = mix(color, sunColor, pow(sunAmount,10.0 * (2-smoothstep(0, 12*5, iGlobalTime))));
   		color += 0.3*(0.2+vec3(0.5));
   	}
    
   
   	color = pow( color, vec3(0.4545) ); //It's not randomly chose. 0.4545 is 1/2.2, which is the standard gamma value for most monitors.
    fragColor = vec4(color, 1.0);
}


  