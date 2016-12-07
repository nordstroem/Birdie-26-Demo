#version 330
OJ_INCLUDE_UTILS

in vec2 fragCoord;
out vec4 fragColor;

uniform float tick;

uniform sampler2D noiseP;







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

vec2 mountains(vec3 p, vec3 rd)
{
	float close = 0;
	if (p.z > -400) {
		return vec2(400, 1.0);
		//close = -p.z;
	}
	float tex = 20.0*texture(noiseP, p.xz/250.0).x + 30.0*texture(noiseP, p.xz/1000.0).x + 4.0*texture(noiseP, p.xz/100.0).x +
	530.0*texture(noiseP, p.xz/2000.0).x;
	/*float tex = 10.0*noise(p.xz/250.0) + 20.0*noise(p.xz/1000.0) + 3.0*noise(p.xz/100.0) +
	300.0*noise(p.xz/2000.0);*/
	
	float h = p.y - (tex - 350 - close);
	float m = 2.0; 
	float d = h / m;
	if (rd.y > m) {
		d = 999999;
	}
	return vec2(d, 1.0); //tex - 250 
	//return vec2(p.y - -5.0, 1.0);
}

vec2 water(vec3 p, float t, vec3 rd)
{
	if(rd.y > 0){
		return vec2(999999, 3.0);
	}
	
	float d = (sin(p.x + tick*0.5) + sin(p.z  + tick*0.5)) * 0.1 + 
	length(texture(noiseP, p.xz*0.5 + vec2(0, tick*0.1)))*0.1 + 
	length(texture(noiseP, p.xz*0.5 + vec2(tick*0.13, 0)))*0.1;


	//float d =  (sin(p.x + tick*0.05) + sin(p.z  + tick*0.05)) * 0.1;
	//return vec2(p.y - 0, 2.0);
	float h = p.y - d * 0.2;//* ((t+ 50)*0.01);
	
	float dis = (0.1 -p.y)/rd.y;
	


	return vec2(max(h, dis), 2.0);
}


vec2 scene(vec3 p, float t, vec3 rd)
{  

	vec2 res = vec2(99999999.0, -1.0);
	if (p.z > -40) {
		float s = sphere(p - vec3(0, 3, -40), 10);
		if (s <= 0) {
			res = union(res, vec2(BLetter(p -  vec3(-5, 3, -40), 0.3), 3.0));
			res = union(res, vec2(ILetter(p -  vec3(-3, 3, -40), 0.3), 3.0));
			res = union(res, vec2(RLetter(p -  vec3(-1, 3, -40), 0.3), 3.0));
			res = union(res, vec2(DLetter(p -  vec3(1, 3, -40), 0.3), 3.0));
			res = union(res, vec2(ILetter(p -  vec3(3, 3, -40), 0.3), 3.0));
			res = union(res, vec2(ELetter(p -  vec3(5, 3, -40), 0.3), 3.0));
		} else {
			res.x = min(res.x, max(s, 1.0));
		}
	}
	
	res = union(res, water(p, t, rd));
	res = union(res, mountains(p, rd));
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



vec3 campos(float tick)
{
	return vec3(0, 3.0, -tick); 
}

vec3 camdir(float tick)
{
	return vec3(0,0,-1);//vec3(sin(-tick * 0.02), 0, cos(-tick * 0.02));
}

vec3 applyFog(vec3 rgb, float dis, vec3 rayDir, vec3 sunDir)
{
	float fogAmount = 1.0 - exp(-dis*0.03);
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
	vec3 tar = eye + dir;
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

	vec3 skyColor = vec3(0.7);
    vec3 color = skyColor; // Sky color
   	vec3 ambient = vec3(0.2, 0.5,0.1);
    vec3 invLight = -normalize(vec3(0, smoothstep(0, 15, tick)*-0.17, 1)); 
            
    float t = 0.0;
    
    vec3 ro = eye + forward * f + right * u + up * v;
	vec3 rd = normalize(ro - eye);

	//t = -ro.y/rd.y < 0 ? 0 : -ro.y/rd.y*0.8;
	float ref = 0.0;
	for(int j = 0; j < 2; j++)
	{
	 for(int i = 0; i < 2000 && t < 3000; ++i) // i < 2000
	 {
       	vec3 p = ro + rd * t;
        vec2 dm = scene(p, iGlobalTime, rd);
        float d = dm.x;
        float m = dm.y;
      	if (v > 0.2 || normalize(rd).y > 0.1) {
      	//	break;
      	}
        if(d < 0.01) //0.01
        {
        	vec3 tempCol = vec3(0);
        	float spec = smoothstep(0, 1, iGlobalTime)*0.4;//0.3
        	
        	if (m == 1.0) //mountain
        	{
        		ref += (1-j) * 0.0;
        		spec = 0.0;
        		
        		tempCol = vec3(0.0, clamp((1 - p.y*0.01), 0.0, 1.0), 0.0);
        		j += 2;

        	}
        	else if (m == 2.0) //water
        	{
				ref += (1-j) * 0.3;
	    		tempCol = vec3(0.05, 0.1, 0.3);
	    		//j = 2; // no reflection
        	}
        	else if (m == 3.0) // Letter
        	{
        		ref += (1-j) * 0.0;
        		if (mod(floor(p.x*3.0) + floor(p.y*3.0), 2.0) == 1.0) {
        			tempCol = vec3(1, 0.8, 0.1);
        		} else {
        			tempCol = vec3(0.9, 0.6, 0.4);
        		}
        		//tempCol = vec3(1, 0.8, 0.1);
        		j += 2; // no reflection
        	}
        	
        	vec3 fog = vec3(0.7);    	
    		vec3 normal = getNormal(p, iGlobalTime, rd);
    		
    		float diffuse = max(0., dot(invLight, normal)); 
         	tempCol = mix(tempCol, vec3(0.4,0.8,0.8), diffuse); //diffuse
		    tempCol = applyFog(tempCol, distance(eye, p), rd, invLight);
			tempCol += spec*vec3(specular(normal, -invLight, normalize(eye - p), 70.0));
			
        	
        	if (j % 2 == 0) {
        		color = tempCol;
        	}else {
        		color = mix(color, tempCol, ref);
        	}
        	//rd = reflect(rd, vec3(0, 1, 0)); //TODO alltid up
        	rd = reflect(rd, normal);
            ro = p + rd*0.01;
            t = 0;
           	break;
        }
        t += max(d, 0.01);
     }
    }
   	if (color == skyColor) {
   	
   	   //	color = pow(0.3*color, vec3(0.4545) ); //It's not randomly chose. 0.4545 is 1/2.2, which is the standard gamma value for most monitors.
   	   float sunAmount = max(0.0, dot(rd, invLight));
   	   vec3 sunColor = vec3(1.0, 1.0, 0.6);
   	   	float fcc = 0.6;
   		color = vec3(color.x - rd.y*fcc, color.y - rd.y*fcc, color.z - rd.y*fcc);
   		color = mix(color, sunColor, pow(sunAmount,270.0 * (2-smoothstep(0, 12*5, iGlobalTime))));
   		color += 0.3*(0.2+vec3(0.5));
   	}

    	
    //color = pow( color, vec3(0.4545) ); //It's not randomly chose. 0.4545 is 1/2.2, which is the standard gamma value for most monitors.
    fragColor = vec4(color, 1.0);
    //fragColor = ;
}


  