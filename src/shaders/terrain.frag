#version 330

in vec2 fragCoord;
out vec4 fragColor;

uniform int tick;

uniform sampler2D noise;


#define MAX_STEPS 400
#define eps 0.01
#define SCALE 3

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

float height(vec2 p)
{
	float tex = 10.0*length(texture(noise, p/250.0).xyz) + 20.0*length(texture(noise, p/1000.0).xyz) + 3.0*length(texture(noise, p/100.0).xyz) +
	300.0*length(texture(noise, p/2000.0).xyz);
	return max(19.99, tex - 250);
	 //+ sin(p.x/20.0)*3 + sin(p.y/30.0)*7 + sin(p.x/300.0)*20 + sin(p.y/200.0)*10 + sin(p.x/3000.0)*400 + sin(p.y/2000.0)*500);
}

float scene(vec3 p)
{
    //vec3 c = vec3(5);
    //vec3 q = mod(p,c)-0.5*c;
   	//float res = min(sdBox(p + vec3(0, 6, 0), vec3(5)), sdBox(p, vec3(0.5)));
    //res = min(res, sdTorus(p + vec3(2, 0, 0), vec2(0.5, 0.1)));
    
    return p.y - height(vec2(p.x,p.z));
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

float poly3(float x, float a, float b, float c, float d)
{
	return a*x*x*x + b*x*x + c*x + d;
}

float grad3(float x, float a, float b, float c)
{
	return 3*a*x*x + 2*b*x + c;
}


vec3 campos(int tick)
{
	float ft = (tick % (120*4))/120.0;
	float x, y, z;
	if(ft < 1)
	{
		x = poly3(ft, -8.33, 25.0, 33.3, 0);
		y = poly3(ft,33.33, -100.0, 66.66, 100);
		z = poly3(ft,200,-650,500,0);
	}
	else if (ft < 2)
	{
		ft = ft - 1;
		x = poly3(ft,-8.33, 0.0, 58.33, 50);
		y = poly3(ft, 33.33, 0, -33.33, 100);
		z = poly3(ft, 200,-50,-200,50);
	}
	else if (ft < 3)
	{
		ft = ft-2;
		x = poly3(ft, -8.334, -25.0, 33.333, 100);
		y = poly3(ft, -66.66, 100, 66.66, 100);
		z = poly3(ft , -350, 550, 300, 0);
	}
	else
	{
		ft = ft-3;
		x = poly3(ft, -8.333, -50, -41.667, 100);
		y = poly3(ft, -66.66, -100, 66.66, 200);
		z = poly3(ft, -350 ,-500, 350, 500);
	}
	vec3 eye = vec3(x, y, z);
	
	return eye;
}

vec3 camdir(int tick)
{
	float ft = (tick % (120*4))/120.0;
	float x, y, z;
	if(ft < 1)
	{
		x = grad3(ft, -8.33, 25.0, 33.3);
		y = grad3(ft,33.33, -100.0, 66.66);
		z = grad3(ft,200,-650,500);
	}
	else if (ft < 2)
	{
		ft = ft - 1;
		x = grad3(ft,-8.33, 0.0, 58.33);
		y = grad3(ft, 33.33, 0, -33.33);
		z = grad3(ft, 200,-50,-200);
	}
	else if (ft < 3)
	{
		ft = ft-2;
		x = grad3(ft, -8.334, -25.0, 33.333);
		y = grad3(ft, -66.66, 100, 66.66);
		z = grad3(ft , -350, 550, 300);
	}
	else
	{
		ft = ft-3;
		x = grad3(ft, -8.333, -50, -41.667);
		y = grad3(ft, -66.66, -100, 66.66);
		z = grad3(ft, -350 ,-500, 350);
	}
	vec3 eye = vec3(x, y, z);
	
	return eye;
}

vec3 applyFog(vec3 rgb, float dis, vec3 rayDir, vec3 sunDir)
{
	float fogAmount = 1.0 - exp(-dis*0.001);
	float sunAmount = max(0.0, dot(rayDir, sunDir));
	vec3 fogColor = mix(vec3(0.6,0.7,0.5), vec3(1.0,0.9,0.7), pow(sunAmount, 8.0));
	return mix(rgb, fogColor, fogAmount);
}

void main()
{
	float iGlobalTime = float(tick);
    vec2 iResolution = vec2(4, 3);
    
    vec3[] cameraPos = vec3[](vec3(0,100,0), vec3(50,100,50), vec3(100,100,0), vec3(100,200,500), vec3(0,100,0));
    int ticksPerInterval = 60*2;
    int interval = (tick / ticksPerInterval) % cameraPos.length();
    vec3 moveTarget = cameraPos[interval];
    
    //vec3 dir = normalize(cameraPos[(interval + 1) % cameraPos.length()] - cameraPos[interval]);
    float dl = length(cameraPos[(interval + 1)  % cameraPos.length()] - cameraPos[interval]) / ticksPerInterval;
    
    float ts = tick/500.0;
    float mt = 1.0 - ts;
    
    vec3 eye = mt*mt*mt*cameraPos[0] + 3 * ts * mt * mt * cameraPos[1] + 3 * ts * ts * mt * cameraPos[2] + ts*ts*ts*cameraPos[3];
    //vec3 eye = cameraPos[interval] + dir *  dl * (tick % ticksPerInterval); //vec3(tick/1.0, 0, -200);
    //eye.y += 70; //(sin(tick/50.0) + 1) * 20 + 10 + height(vec2(eye.x, eye.z));//max(22, 3 + height(vec2(eye.x, eye.z)));
	vec3 dir = -3*mt*mt *cameraPos[0] + -6*ts*mt*cameraPos[1] + 3*mt*mt*cameraPos[1] + -3*ts*ts*cameraPos[2] + 6*ts*mt*cameraPos[2] + 3*ts*ts*cameraPos[3];
	
	eye = campos(tick);
	dir = camdir(tick);
	vec3 tar = eye + dir;
	vec3 forward = normalize(tar - eye);
    vec3 up = vec3(0, 1, 0);
    vec3 right = cross(forward, up);

    
    float f = 1.5;
    float u = fragCoord.x;
    float v = fragCoord.y;
    //vec3 ro = eye + forward * f + right * u + up * v;
	//vec3 rd = normalize(ro - eye);

    vec3 color = vec3(0.1, 0.2, 0.7); // Sky color
   	vec3 ambient = vec3(0.2, 0.5,0.1);
    vec3 invLight = -normalize(vec3(0,-0.2,-1));
            
    float t = 0.0;
    
    vec3 ro = eye + forward * f + right * u + up * v;
	vec3 rd = normalize(ro - eye);
	
		t = 0;
	 for(int i = 0; i < MAX_STEPS && t < 10000; ++i)
	 {
        vec3 p = ro + rd * t;
        float d = scene(p);
      	
        if(d < eps)
        {
        	// float fogAmount = 1.0 - exp(-distance(eye, p)*0.001);
        	if (p.y > 20.0) {
        		vec3 normal = getNormal(p);
	            //float diffuse = max(0.,dot(invLight, normal));
	           	//color +=  vec3(ambient*(1.0+diffuse));// * shadow(p, invLight, 1.0, 2.5);
	           	float diffuse = max(0.,dot(invLight, normal));
	           	color = vec3(0, (1 - p.y*0.01)*0.5, 0) + diffuse/2;
	           	
	           	vec3 fog = vec3(0.7);
	           	//float fogAmount = 1.0 - exp(-distance(eye, p)*0.001);
	           //	color = mix(color, fog, fogAmount);
	           color = applyFog(color, distance(eye, p), rd, invLight);
        	} else {
		       // float fogAmount = 1.0 - exp(-distance(eye, p)*0.001);
		        vec3 fog = vec3(0.7);    	
        		vec3 normal = getNormal(p); //vec3(0,1,0);
        		color = vec3(0,0,1.0);
        		rd = reflect(rd, normal);
		        ro = p + rd*0.01;
		        t = 0;
        		for(int i = 0; i < MAX_STEPS && t < 1000; ++i)
				 {
			        p = ro + rd * t;
			        d = scene(p);
			      	
			        if(d < eps)
			        {
			        	vec3 normal = getNormal(p);
		        		float diffuse = max(0.,dot(invLight, normal));
	   
			           	vec3 color2 = vec3(0, (1 - p.y*0.01)*0.5, 0) + diffuse/2;

			           	//color2 = mix(color2, fog, fogAmount);
			           	
			        	color = 0.5*color + 0.5*color2;
			        	break;
			        }
			        t += 0.8;//d;
			    }
			    
			    //color = mix(color, fog, fogAmount);
			    color = applyFog(color, distance(eye, p), rd, invLight);
			    
        	}               
           	break;
        }

        t += 0.8;    
    }
    
   	if (color == vec3(0.1, 0.2, 0.7)) {
   	
   	   	color = pow(0.3*color, vec3(0.4545) ); //It's not randomly chose. 0.4545 is 1/2.2, which is the standard gamma value for most monitors.
   		color = vec3(color.x - rd.y, color.y - rd.y, color.z - rd.y);
   	}
    
   
    //color = pow( color, vec3(0.4545) ); //It's not randomly chose. 0.4545 is 1/2.2, which is the standard gamma value for most monitors.
    fragColor = vec4(color, 1.0);
    //fragColor = ;
}


  