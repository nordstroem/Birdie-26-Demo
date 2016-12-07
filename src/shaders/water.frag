#version 330

in vec2 fragCoord;
out vec4 fragColor;

uniform int tick;

uniform sampler2D noiseP;

float hash( float n ) {
    return fract(sin(n)*687.3123);
}

float noise( in vec2 x ) {
    vec2 p = floor(x);
    vec2 f = fract(x);
    f = f*f*(3.0-2.0*f);
    float n = p.x + p.y*157.0;
    return mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
               mix( hash(n+157.0), hash(n+158.0),f.x),f.y);
}

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

float ALetter(vec3 p, float ps)
{
	float res = 99999999;
	res = min(res, sdBox(p + vec3(1* ps * 2.0, 0 * ps * 2.0, 0), vec3(ps)));
	res = min(res, sdBox(p + vec3(0* ps * 2.0, 1 * ps * 2.0, 0), vec3(ps)));
	res = min(res, sdBox(p + vec3(2* ps * 2.0, 1 * ps * 2.0, 0), vec3(ps)));
	res = min(res, sdBox(p + vec3(0* ps * 2.0, 2 * ps * 2.0, 0), vec3(ps)));
	res = min(res, sdBox(p + vec3(1* ps * 2.0, 2 * ps * 2.0, 0), vec3(ps)));
	res = min(res, sdBox(p + vec3(2* ps * 2.0, 2 * ps * 2.0, 0), vec3(ps)));
	res = min(res, sdBox(p + vec3(0* ps * 2.0, 3 * ps * 2.0, 0), vec3(ps)));
	res = min(res, sdBox(p + vec3(2* ps * 2.0, 3 * ps * 2.0, 0), vec3(ps)));
	return res;
}



float height(vec2 p, float t)
{	
	return (sin(p.x + tick*0.05) + sin(p.y  + tick*0.05))* 0.1 + length(texture(noiseP, p*0.5 + vec2(0, tick*0.01))) * 0.1
	+ length(texture(noiseP, p*0.5 + vec2(tick*0.013, 0))) * 0.1;
}

float scene(vec3 p, float t)
{  
    return min(p.y - height(vec2(p.x,p.z), t), ALetter(p - vec3(0, 4, -20), 0.3));
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

vec3 getNormal(vec3 p, float t)
{
    vec3 normal;
    vec3 ep = vec3(0.1,0,0);
    normal.x = scene(p + ep.xyz, t) - scene(p - ep.xyz, t);
    normal.y = scene(p + ep.yxz, t) - scene(p - ep.yxz, t);
    normal.z = scene(p + ep.yzx, t) - scene(p - ep.yzx, t);
    return normalize(normal);
}



vec3 campos(int tick)
{
	return vec3(0, 3.0, -tick*0.1);
}

vec3 camdir(int tick)
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
    vec2 iResolution = vec2(4, 3);
    
    
	
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
    float v = floor(fragCoord.y*pt)/pt;
    //vec3 ro = eye + forward * f + right * u + up * v;
	//vec3 rd = normalize(ro - eye);

	vec3 skyColor = vec3(0.7);
    vec3 color = skyColor; // Sky color
   	vec3 ambient = vec3(0.2, 0.5,0.1);
    vec3 invLight = -normalize(vec3(0,-0.17, 1)); 
            
    float t = 0.0;
    
    vec3 ro = eye + forward * f + right * u + up * v;
	vec3 rd = normalize(ro - eye);
	
	t = 0.1;
	 for(int i = 0; i < 300 && t < 10000; ++i)
	 {
       	vec3 p = ro + rd * t;
        float d = scene(p, iGlobalTime);
      	if (rd.y > 0) {
      		//break;
      	}
        if(d < 0.01)
        {
	        vec3 fog = vec3(0.7);    	
    		vec3 normal = getNormal(p, iGlobalTime);
    		float diffuse = max(0., dot(invLight, normal)); 
    		color = vec3(0.05, 0.1, 0.3);
    		
    		color = mix(color, vec3(0.4,0.8,0.8), diffuse); //diffuse
		    color = applyFog(color, distance(eye, p), rd, invLight);
			color += vec3(specular(normal, -invLight, normalize(eye - p), 70.0));    
        	              
           	break;
        }

        t += d;    
    }
    
   	if (color == skyColor) {
   	
   	   //	color = pow(0.3*color, vec3(0.4545) ); //It's not randomly chose. 0.4545 is 1/2.2, which is the standard gamma value for most monitors.
   	   float sunAmount = max(0.0, dot(rd, invLight));
   	   vec3 sunColor = vec3(1.0, 1.0, 0.6);
   		color = vec3(color.x - rd.y, color.y - rd.y, color.z - rd.y);
   		color = mix(color, sunColor, pow(sunAmount,90.0));
   	}
    
      // Rain (by Dave Hoskins)
    vec2 p = vec2(u, v);
    vec2 q = p/2;
	vec2 st = 256. * ( p* vec2(.5, .01)+vec2(tick*.13-q.y*.6, tick*.13) );
    float fr = noise( st ) * noise( st*0.773) * 1.55;
	fr = 0.25+ clamp(pow(abs(fr), 13.0) * 13.0, 0.0, q.y*.14);
  
  /*
    if( lint1.w > 0. ) {
        col += (fr*LIGHTINTENSITY*exp(-lint1.w*7.0)) * getLightColor(lint1.xyz);
    }  
    */
	color += 1.0*fr*(0.2+vec3(0.5));
	
    //color = pow( color, vec3(0.4545) ); //It's not randomly chose. 0.4545 is 1/2.2, which is the standard gamma value for most monitors.
    fragColor = vec4(color, 1.0);
    //fragColor = ;
}


  