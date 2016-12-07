#version 330
OJ_INCLUDE_UTILS

in vec2 fragCoord;
out vec4 fragColor;


uniform float tick;
uniform sampler2D noiseP;


#define MAT_BLOCK 1.0
#define MAT_LIGHT 2.0
#define MAT_SPHERE 3.0
#define MAT_WATER 4.0
#define MAT_S2_OBJECT 5.0
#define MAT_DRILL 6.0
#define MAT_S3_BLOCK 7.0
#define MAT_BALL 8.0
#define MAT_S2_BLOCK 9.0
#define MAT_S4_FLOOR 10.0
#define MAT_S4_MIRROR 11.0
#define MAT_S1_TORUS 12.0
#define MAT_S5_BLOB 13.0
#define MAT_S5_FLOOR 14.0
#define MAT_S5_PILLAR 15.0
#define MAT_MORPH 16.0
#define MAT_S6_ROOF 17.0

#define EPS 0.01

#define SCENE_1 30
#define SCENE_2 60
#define SCENE_3 90
#define SCENE_4 120
#define SCENE_5 150
#define SCENE_6 180

vec2 un(vec2 a, vec2 b)
{
	return a.x < b.x ? a : b;
}

vec2 sun(vec2 a, vec2 b)
{
	float sm = smin(a.x,b.x);
	float ca = abs(sm -a.x);
	float cb = abs(sm -b.x);
	
	return ca < cb ? vec2(sm, a.y) : vec2(sm, b.y);
}

vec2 sunk(vec2 a, vec2 b, float k)
{
	float sm = smink(a.x,b.x, k);
	float m = min(a.x, b.x);
	float ca = abs(sm -a.x);
	float cb = abs(sm -b.x);
	
	return ca < cb ? vec2(sm, a.y) : vec2(m, b.y);
}


vec2 unn(vec2 a, float dis, float mat)
{
	return a.x < dis ? a : vec2(dis, mat);
}



mat3 rot(float x, float y, float z)
{
	float cx = cos(x);
	float sx = sin(x);
	float cy = cos(y);
	float sy = sin(y);
	float cz = cos(z);
	float sz = sin(z);
	mat3 xm = mat3(1, 0, 0,
					0, cx, -sx,
					0, sx, cx);
	mat3 ym = mat3(cy, 0, sy,
			  		0, 1, 0,
			  		-sy, 0, cy);
	mat3 zm = mat3(cz, -sz, 0,
					sz, cz, 0,
					0, 0, 1);
	return xm * ym * zm; //inverse(xm * ym * zm);
}




vec2 map(vec3 p, vec3 rd)
{

	//return vec2(sphere(p, 1.0), MAT_BLOCK);
	vec3 s = vec3(1);
	vec3 q = mod(p,s)-0.5*s;
	ivec3 n = ivec3(trunc(p / s));
	float t = trunc(mod(n.z, 1337)); 

	if (true) { 
		//vec3 ms = vec3(20, 15, 40);
		//float dis = sdTorus(mod(n.xzy + vec3(15, 15, 0), ms) - ms * 0.5, vec2(10, 5)); 
		float dis = -sdCylinder(n.xzy, vec3(0, 0, 15));
		dis = min(dis, -sdBox(n, vec3(200)));
		if (dis < 0) {
			return vec2(udRoundBox(q , vec3(0.25), 0.23), MAT_BLOCK);
		} else {
			vec3 d = (s * 0.5 -  sign(rd)* q) / abs(rd);
			float b = min(d.x, min(d.y, d.z));
			float a = max(dis - 1.73, b + EPS);
			return vec2(max(EPS, a), -1);
		}
	} 
	vec3 d = (s * 0.5 -  sign(rd)* q) / abs(rd);
	return vec2(max(EPS, min(d.x, min(d.y, d.z)) + EPS) , -1);
}


/*
mat3 camRot()
{
	vec3 right = cross(playerForward, playerUp);
	return mat3(playerForward.x, playerForward.y, playerForward.z, playerUp.x, playerUp.y, playerUp.z, right.x, right.y, right.z);
}

*/

vec2 water_2(vec3 p, vec3 rd)
{
	float t = tick - SCENE_1;
	if(rd.y > 0){
		return vec2(999999, MAT_WATER);
	}
	
	float wdis = distance(p.xz, vec2(0, 6));
	float w = 0; //t > 1 ? max(0, 5 - t* 0.3 - wdis * 0.3) : 0;
	float d = 
		(sin(-t * 3 + 5 * wdis)) * w + 
		//(sin(p.x + tick*0.5) + sin(p.z  + tick*0.5)) * 0.1 + 
		length(texture(noiseP, p.xz*0.5 + vec2(0, tick*0.1)))*0.1 + 
		length(texture(noiseP, p.xz*0.5 + vec2(tick*0.13, 0)))*0.1;
	d *= 0.1;

	float h = p.y - d * 0.1;
	
	float dis = (0.1 -p.y)/rd.y;

	return vec2(max(h, dis), MAT_WATER);
}


vec2 water_3(vec3 p, vec3 rd)
{
	float t = tick - SCENE_2;
	if(rd.y > 0){
		return vec2(999999, MAT_WATER);
	}
	
	float d = (sin(p.x + tick*0.5) + sin(p.z  + tick*0.5)) * 0.1 + 
	length(texture(noiseP, p.xz*0.5 + vec2(0, tick*0.1)))*0.1 + 
	length(texture(noiseP, p.xz*0.5 + vec2(tick*0.13, 0)))*0.1;
	d *= smoothstep(5, 15, t) * 0.5 + 0.05;

	float h = p.y - d * 0.1;
	
	float dis = (0.1 -p.y)/rd.y;

	return vec2(max(h, dis), MAT_WATER);
}

vec2 water_6(vec3 p, vec3 rd)
{
	float t = tick - SCENE_2;
	if(rd.y > 0){
		return vec2(999999, MAT_WATER);
	}
	
	float d = (sin(p.x + tick*0.5) + sin(p.z  + tick*0.5)) * 0.1 + 
	length(texture(noiseP, p.xz*0.5 + vec2(0, tick*0.1)))*0.1 + 
	length(texture(noiseP, p.xz*0.5 + vec2(tick*0.13, 0)))*0.1;
	d *= 0.1;

	float h = p.y - d * 0.1;
	
	float dis = (0.1 -p.y)/rd.y;

	return vec2(max(h, dis), MAT_WATER);
}

bool inRefraction = false;


vec2 scene_1(vec3 p, vec3 rd){

	float t = tick;
	vec2 res = vec2(99999, -1);
	if (p.z > 23){
		vec3 s = vec3(30, 30, 30);
		vec3 q = mod(p - vec3(15, 15, 5), s)-0.5*s;
		//ivec3 n = ivec3(trunc(p / s));
		res = vec2(sdTorus(q.xzy, vec2(4, 1))/*+
		0.02 * sin(- t * 0.04 + p.y * 0.75 ) +
	  	0.03 * sin( t * 0.02 + p.x*2) +
		0.02 * sin( t * 0.05 + p.z)*/
		, MAT_S1_TORUS);
	}
	
	
	vec3 s = vec3(1);
	vec3 q = mod(p,s)-0.5*s;
	ivec3 n = ivec3(trunc(p / s));
	float dis = -sdCylinder(n.xzy, vec3(0, 0, 15));
	dis = min(dis, -sdBox(n, vec3(200)));
	if (dis < 0) {
		res = un(res, vec2(udRoundBox(q , vec3(0.3), 0.23), MAT_BLOCK));
	} else {
		vec3 d = (s * 0.5 -  sign(rd)* q) / abs(rd);
		float b = min(d.x, min(d.y, d.z));
		float a = max(dis - 1.73, b + EPS);
		res = un(res, vec2(max(EPS, a), -1));
	}
	
	return res;
	//return un(res, water(p - vec3(0, -2, 0), rd));
}

vec2 scene_2(vec3 p, vec3 rd) {
	float t = tick - SCENE_1;
	vec3 s = vec3(1);
	vec3 q = mod(p, s) - 0.5 * s;
	ivec3 n = ivec3(trunc(p / s));
	
	vec3 s2 = vec3(3);
	vec3 q2 = mod(p, s2) - 0.5 * s2;
	q2.y = p.y;	
	ivec3 n2 = ivec3(trunc(p / s2));
	
	vec2 res = sunk(
		water_2(p, rd), 
		vec2(sphere(q2 - vec3(0, texture(noiseP, n2.xz * 0.1).x * 150 + 2 - t * 4, 0), 0.3), MAT_BALL),
		 0.8);
	
	float roomDis = -sdBox(n - vec3(0, 10, 0), vec3(50, 10, 50));
	if (roomDis < 0) {
		res = un(res, vec2(udRoundBox(q, vec3(0.3), 0.2), MAT_S2_BLOCK));
	} else {
		vec3 d = (s * 0.5 -  sign(rd)* q) / abs(rd);
		float b = min(d.x, min(d.y, d.z));
		float a = max(roomDis - 1.73, b + EPS); // TODO 1.73 kan vara for mycket 
		res = un(res, vec2(max(EPS, a), -1));
	}
	return res;
}

vec2 scene_3(vec3 p, vec3 rd) {
	float t = tick - SCENE_2;
	vec2 res = water_3(p - vec3(0, 0, 0), rd);
	vec3 s = vec3(1);
	vec3 q = mod(p, s) - 0.5 * s;
	ivec3 n = ivec3(trunc(p / s));
	
	float roomDis = -sdBox(n, vec3(15, 10, 15));
	if (roomDis < 0) {
		res = un(res, vec2(udRoundBox(q, vec3(0.3), 0.2), MAT_S3_BLOCK));
	} else {
		vec3 d = (s * 0.5 -  sign(rd)* q) / abs(rd);
		float b = min(d.x, min(d.y, d.z));
		float a = max(roomDis - 1.73, b + EPS); // TODO 1.73 kan vara for mycket 
		res = un(res, vec2(max(EPS, a), -1));
	}
	
	float dis = sdBox(n - vec3(0, 0, 2), vec3(10, 3, 5));
	if (dis < 0) {
		res = un(res, vec2(sdHexPrism(q.xzy * rot(0, 0, p.y *  6 +  smoothstep(3, 13, t) * 1.5 * t), vec2(0.15, 999)), MAT_DRILL));
		//res = un(res, vec2(sphere(q, 1), MAT_BLOCK));
	} else {
		vec3 d = (s * 0.5 -  sign(rd)* q) / abs(rd);
		float b = min(d.x, min(d.y, d.z));
		float a = max(dis - 1.73, b + EPS); // TODO 1.73 kan vara for mycket 
		res = un(res, vec2(max(EPS, a), -1));
	}
	return res;
}

vec2 scene_4(vec3 p, vec3 rd)
{
	float t = tick - SCENE_3;
	vec2 res = vec2(99999, -1);
	vec3 s = vec3(1);
	vec3 q = mod(p, s) - 0.5 * s;
	ivec3 n = ivec3(trunc(p / s));
	
	float roomDis = -sdBox(n - vec3(0, 5, 0), vec3(15, 5, 15));
	if (roomDis < 0) {
		float box = sdBox(q, vec3(0.5));//udRoundBox(q, vec3(0.3), 0.2);
		box = max(box, -sphere(q, 0.55 + 0.05 *  sin(t)));
		res = un(res, vec2(box, MAT_S4_FLOOR));
	} else {
		vec3 d = (s * 0.5 -  sign(rd)* q) / abs(rd);
		float b = min(d.x, min(d.y, d.z));
		float a = max(roomDis - 1.73, b + EPS); // TODO 1.73 kan vara for mycket 
		res = un(res, vec2(max(EPS, a), -1));
	}
	
	//Mirrors
	{
		vec3 s = vec3(5, 20, 5);
		vec3 q = mod(p - vec3(0, -8, 0), s) - 0.5 * s;
		vec3 n = vec3(trunc(p / s));
		vec3 bot = vec3(0.4 * sin(n.x + t* 0.5), -1, 0.4 * cos(n.z + t * 0.5));
		float mdis = sdCapsule(q, bot , -bot, 0.6);
		res = un(res, vec2(mdis, MAT_S4_MIRROR));
	}
	return res;
}

vec2 scene_5(vec3 p, vec3 rd)
{
	float t = tick - SCENE_4;
	vec2 res = vec2(99999, -1);
	vec3 s = vec3(1);
	vec3 q = mod(p, s) - 0.5 * s;
	ivec3 n = ivec3(trunc(p / s));
	
	float blob = sphere(p, 4);
	blob +=  0.3 * sin(- t * 4 + p.y * 0.75 ) +
	  	0.2 * sin( t * 2 + p.x*2) +
		0.4 * sin( t * 5 + p.z);
	res = un(res, vec2(blob, MAT_S5_BLOB));
	
	
	float roomDis = -sdBox(n, vec3(60, 15, 60));
	if (roomDis < 0) {
		float box = udRoundBox(q, vec3(0.4), 0.1);
		res = un(res, vec2(box, MAT_S5_FLOOR));
	} else {
		vec3 d = (s * 0.5 -  sign(rd)* q) / abs(rd);
		float b = min(d.x, min(d.y, d.z));
		float a = max(roomDis - 1.73, b + EPS); // TODO 1.73 kan vara for mycket 
		res = un(res, vec2(max(EPS, a), -1));
	}
	
	{
		vec3 s2 = vec3(30, 10, 30);
		vec3 q2 = mod(n, s2) - 0.5 * s2;
		float pDis = sdCylinder(vec3(q2.x, n.y, q2.z), vec3(0, 0, 4));
		if (pDis < 0) {
			float box = udRoundBox(q, vec3(0.4), 0.1);
			res = un(res, vec2(box, MAT_S5_PILLAR));
		} else {
			vec3 d = (s * 0.5 -  sign(rd)* q) / abs(rd);
			float b = min(d.x, min(d.y, d.z));
			float a = max(pDis - 1.73, b + EPS); // TODO 1.73 kan vara for mycket 
			res = un(res, vec2(max(EPS, a), -1));
		}
	}
	
	return res;
}

vec2 scene_6(vec3 po, vec3 rd) {
	float tic = tick - SCENE_5;
	vec3 cm = vec3(5);
	vec3 q = mod(po, cm)-0.5*cm;
	float dis = length(po.xz);
	vec3 p = vec3(q.x, po.y - min(0, tic*tic*0.3 - dis), q.z);

	float a = sdBox(p, vec3(1.0));
	float b = sdTorus(p, vec2(1,0.3));
	float c = min(sdTorus(p - vec3(2,0,0), vec2(1,0.3)), sdTorus(p + vec3(2,0,0), vec2(1,0.3)));
	float d = sphere(p, 1.0);
	float e = sdBox(p, vec3(1.0));
	float f = sdTorus(p, vec2(1,0.3));
	float g = sphere(p, 2.0);
	
	float t = 3;
	float ti = tic - sqrt(po.x*po.x + po.z*po.z) * 0.1;
	
	float t1 = smoothstep(t*0, t*1, ti);
	float t2 = smoothstep(t*1, t*2, ti); 
	float t3 = smoothstep(t*2, t*3, ti);
	float t4 = smoothstep(t*3, t*4, ti);
	float t5 = smoothstep(t*4, t*5, ti);
	float t6 = smoothstep(t*5, t*6, ti);
	
	float res = a*(1-t1) + b*t1*(1-t2) + c*t2*(1- t3) + d*t3*(1-t4) + e*t4*(1-t5) + f*t5*(1-t6) + g*t6; 
	
	vec2 roofRes = vec2(99999, -1);
	/*{
		vec3 s = vec3(1);
		vec3 q = mod(po, s) - 0.5 * s;
		ivec3 n = ivec3(trunc(po / s));
		float roofDis = -sdBox(n - vec3(0, 0, 0), vec3(150, 4, 150));
		if (roofDis < 0) {
			float box = udRoundBox(q, vec3(0.4), 0.1);
			roofRes = un(roofRes, vec2(box, MAT_S6_ROOF));
		} else {
			vec3 d = (s * 0.5 -  sign(rd)* q) / abs(rd);
			float b = min(d.x, min(d.y, d.z));
			float a = max(roofDis - 1.73, b + EPS); // TODO 1.73 kan vara for mycket 
			roofRes = un(roofRes, vec2(max(EPS, a), -1));
		}
	}*/
	return un(roofRes , un(water_6(po - vec3(0, -1, 0), rd), vec2(res, MAT_MORPH)));
}

vec2 scene(vec3 p, vec3 rd)
{
	//float ms = 8;
	//vec3 q = mod(p, ms) - 0.5 * ms;
	//vec3 n = ivec3(trunc(p / ms));
	//vec2 li = vec2(udRoundBox(q, vec3(0.5), 0.5), MAT_BLOCK);
	//vec2 li = vec2(sphere(q, 0.5), MAT_BLOCK);
	//vec2 o = vec2(sdTorus(q.zxy, vec2(2, 0.5)), MAT_SPHERE);
	vec2 res = vec2(999999, -1);
	if(tick < SCENE_1){
		res = scene_1(p, rd);
	}else if (tick < SCENE_2) {
		res = scene_2(p, rd); 
	} else if (tick < SCENE_3) {
		res = scene_3(p, rd);
	} else if (tick < SCENE_4) {
		res = scene_4(p, rd);
	} else if (tick < SCENE_5) {
		res = scene_5(p, rd);
	} else if (tick < SCENE_6) {
		res = scene_6(p, rd);
	}

	//res = un(res, vec2(sdTorus(p.xzy - vec3(0,sin(tick) * 2, -10).xzy, vec2(2, 1)), MAT_BLOCK));
	//if (!inRefraction) {
		//res = un(res, water(p, rd));
	//} 
	
	return res;
}

void setCamera(inout vec3 eye, inout vec3 tar, inout vec3 light, inout bool waterRefract, inout float lightInvSize, inout float shadowAmbient, inout float lightIntensity,
	inout int jumps, inout bool lightCollision, inout float refJumpDistance, inout bool shadows){
	waterRefract = false;
	if(tick < SCENE_1){
		 eye = vec3(0, -7, tick*0.4);
		 tar = eye + vec3(0.01*cos(tick), 0.02*sin(tick), 1 + 0.02*cos(tick));
		 if(tick < 5){
			light = vec3(0, 0 + -7*smoothstep(0,4,tick), -20 + 60*smoothstep(0, 4, tick));	
		 } else if (tick < 20){
		    float r = 13*smoothstep(5, 15, tick);
		  	light = vec3(r*cos(tick*2), -7 + 7*smoothstep(5,10,tick)+ r*sin(tick*2), 40);
		 } else if (tick < 25){
			float r = 13 - 13*smoothstep(20, 25, tick);
		  	light = vec3(r*cos(tick*2), -7 + 7*smoothstep(5,10,tick) + r*sin(tick*2), 40);
		 } else {
		 	lightCollision = true;
		 	light = vec3(0,0, 40 + 70*smoothstep(25,30, tick));
		 } 

	} else if (tick < SCENE_2) {
		float t = tick - SCENE_1;
		eye = vec3(-5, 1, -5);
		tar = eye + vec3(0, 0, 1);
		light = vec3(-10, 5, -10);
		lightIntensity = 0.0001;
		
	} else if (tick < SCENE_3) {
		float t = tick - SCENE_2;
		eye = vec3(0, 4, -10);
		tar = vec3(0, 0, 5);
		light = vec3(1*sin(tick), 6 - 0.1*cos(2*tick), -1);
		tar = vec3(light.x/3, 2 - cos(tick/3), light.z/3);
		lightInvSize = 30 - 20*smoothstep(3, 15, t);;
		shadowAmbient = 0.7;
		lightIntensity = 0.2 - 0.182*smoothstep(3, 15, t);
		
	} else if (tick < SCENE_4) {
		float t = tick - SCENE_3;
		eye = vec3(0, 3, -10);
		tar = eye + vec3(0, 0, 1);
		light = vec3(0, 10, -15);
		shadowAmbient = 0.7;
		jumps = 10;
	} else  if (tick < SCENE_5) {
		float t = tick - SCENE_4;
		eye = vec3(15*sin(tick/5), 3, 15*cos(tick/5));
		tar = vec3(0, 0, 0);
		light = vec3(0, 10, -15);
		float r = 6;
		float azi = t;
		float pol = 0.5 * t;
		float x = r*cos(pol)*sin(azi);
		float y = r*sin(pol)*sin(azi);
		float z = r*cos(azi);
		
		light = vec3(x, y, z);
		light = vec3(0.5*cos(tick), 6 + 0.5*sin(tick), sin(tick)*cos(tick)*0.5);
		//light = vec3(0, 0, 0);
		shadowAmbient = 0.7;
		lightInvSize = 30;
		lightCollision = true;
		lightIntensity = 0.01;
		shadowAmbient = 0.7;
		jumps = 2;
		refJumpDistance = 3;
	} else if (tick < SCENE_6) {
		float t = tick - SCENE_1;
		eye = vec3(0, 4, 0);
		tar = eye + vec3(0, -0.5, 1);
		light = vec3(0, 0, -3);
		jumps = 3;
		shadows = false;
		lightIntensity = 0.001;
		lightInvSize = 100;
	}
	
}

vec3 getNormal(vec3 p, vec3 rd, vec3 ro)
{
    vec3 normal;
    vec3 ep = vec3(0.01, 0, 0);
    normal.x = scene(p + ep.xyz, rd).x - scene(p - ep.xyz, rd).x;
    normal.y = scene(p + ep.yxz, rd).x - scene(p - ep.yxz, rd).x;
    normal.z = scene(p + ep.yzx, rd).x - scene(p - ep.yzx, rd).x;
    return normalize(normal);
}


float specular(vec3 normal, vec3 light, vec3 viewdir, float s)
{
	float nrm = (s + 8.0) / (3.1415 * 8.0);
	float k = max(0.0, dot(viewdir, reflect(light, normal)));
    return  pow(k, s);
}

mat4 rotationMatrix(vec3 axis, float angle)
{
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

float shadow(in vec3 ro, in vec3 rd, float mint, float maxt, float shadowAmbient)
{
    for( float t=mint; t < maxt; )
    {
        float h = scene(ro + rd*t, rd).x;
        if( h<0.01 )
            return shadowAmbient;
        t += h;
    }
    return 1.0;
}


float softshadow( in vec3 ro, in vec3 rd, in float mint, in float maxt )
{
	float res = 1.0;
    float t = mint;
   for( float t=mint; t < maxt; )
    {
		vec2 res = scene( ro + rd*t, rd );
		float h = res.x;
		float m = res.y;
		if (m  > 0.0) {
       	 res = min( res, h );
		}
		t += h;
        if( h<0.01 || t>maxt ) break;
    }
    return clamp( res, 0.0, 1.0 );

}

vec3 applyFog(vec3 rgb, float dis, vec3 rayDir, vec3 sunDir, vec3 p)
{
	float fogAmount = 1.0 - exp(-dis*0.005);
	float sunAmount = 0; //max(0.0, dot(rayDir, sunDir));
	vec3 fogColor = mix(vec3(0.3), vec3(1.0,0.9,0.7), pow(sunAmount,12.0));
	return mix(rgb, fogColor, fogAmount);
}

void main()
{
	vec3 eye = vec3(0);
	vec3 light = vec3(0);
	vec3 tar = vec3(0);
	bool waterRefract = false;
	float lightInvSize = 0.5;
	float shadowAmbient = 0.3;
	float lightIntensity = 0.004;
	bool lightCollision = false;
	int jumps = 2;
	float refJumpDistance = 0.02;
	bool shadows = true;
	setCamera(eye, tar, light, waterRefract, lightInvSize, shadowAmbient, lightIntensity, jumps, lightCollision, refJumpDistance, shadows);
	
	vec3 dir = normalize(tar - eye);
	vec3 right = normalize(cross(vec3(0, 1, 0), dir));
 	vec3 up = cross(dir, right);
    
    float u = fragCoord.x;
    float v = 9.0/16.0*fragCoord.y; //TODO window size

    vec3 color = vec3(0);//vec3(0.3);
      
    float t = 0.0;
    //vec3 ro = eye + forward * 1 + right * u + up * v;
	vec3 ro = eye;
	vec3 rd = normalize(dir + right*u + up*v);
	int imax = 600;
	float tmax = 800;
	float ref = 1;
	float lightAura = 0;
	for(int j = 0; j < jumps; ++j)
    {
    	t = 0;
    	 for(int i = 0; i < imax && t < tmax; ++i)
   		 {
	        vec3 p = ro + rd * t;
	        vec2 dm = scene(p, rd);
	        float d = dm.x;
	        float m = dm.y;
			
			
	        if(d < EPS || i == imax || t >= tmax) //d < 0.001 
	        {
	        	//float ls = 50.0;
	        	//vec3 lp = ls * floor(p/ls) + ls/2;
	        	//light = vec3(0, -13, lp.z); //10 * sin(tick + lp.z)
	        	vec3 x0 = light;
	        	vec3 x1 = ro;
	        	vec3 x2 = ro + rd;
	        	float ldis = pow(length(cross(x2 - x1, x1 - x0)),2) / pow( distance(x2, x1), 2); 
	        	vec3 normal = getNormal(p, rd, ro);
				
				vec3 invLight = normalize(light - p);
	        	float diffuse = max(0.,dot(invLight, normal));
	        	vec3 refrd = reflect(rd, normal);
	        	

	        	vec3 n = trunc(p);
				vec3 c = vec3(0.5);
				
				if(m == MAT_BLOCK){
					c = vec3(sin(n.y) * 0.1 + 0.3, sin(n.y) * 0.1 +0.1, sin(n.y) * 0.1 + 0.1)*1.1;
				}
				else if(m == MAT_SPHERE){
					c = vec3(0, 0.5, 0);
				}
				else if(m == MAT_WATER){
	        		c = vec3(1); 
				}
				else if (m == MAT_S2_OBJECT) {
					c = vec3(1, 0, 0);
				} else if (m == MAT_DRILL) {
					c = vec3(0.3, 0.4, 0.5);
				} else  if (m == MAT_S3_BLOCK) {
					if (n.z == 16) {
						c = sin(2*distance(vec2(n.xy), vec2(0, 0)) ) > 0 ? vec3(0.1, 0.2, 0.6) : vec3(0.01, 0.01, 0.01);
					} else {
						c = vec3(0.1, 0.2, 0.6);
					}
				} else if (m == MAT_BALL) {
					c = vec3(1, 0, 0);
				} else if (m == MAT_S2_BLOCK) {
					c = vec3(sin(n) * 0.1);
				} else if (m == MAT_S4_FLOOR) {
					c = vec3(1, 0, 0);
				} else if (m == MAT_S4_MIRROR) {
					c = vec3(1);
				} else if (m == MAT_S1_TORUS) {
					c = vec3(0.4, 0.4, 0.4) + 0.7 * vec3(texture(noiseP, vec2(p.xy * 0.1)));
				} else if (m == MAT_S5_BLOB) {
					c = vec3(1);
				} else if (m == MAT_S5_FLOOR) {
					c = vec3(0.9);
				} else if (m == MAT_S5_PILLAR) {
					c = vec3(0.8, 0, 0);
				} else if (m == MAT_MORPH) {
					vec3 pc = p + vec3(90);
	        		vec3 matCol = vec3(pc.x/20.0, (pc.x + pc.z) / 10.0, pc.z/15.0);
	        		c = (sin(matCol) + 1.0) * 0.5;
				} else if (m == MAT_S6_ROOF) {
					c = vec3(0, 0, 1);
				}
				
	        	//color = mix(color, 0.7*c* (1.0 + diffuse)*shadow(p, normalize(light - p), 0.1, length(light - p) - 1), ref);
	        	if (inRefraction) {
					c = 0.7*c* (1.0 + diffuse);
					if(shadows){
						c *= shadow(p, normalize(light - p), 0.1, length(light - p) - 1, shadowAmbient);
					}
	        	} else {
					c = 0.7*c* (1.0 + diffuse);
					if(shadows){
						c *= shadow(p, normalize(light - p), 0.1, length(light - p) - 1, shadowAmbient);
					}
		        	c += specular(normal, -invLight, normalize(eye - p), 70.0);
	        	}
	            
	            float dis = length(light - p);
	            float disFact = 1.0 / (1.0 + lightIntensity*dis*dis);
	            c *= disFact;
				
					        	
	        	float tl = -dot(x1 - x0, x2 - x1)/pow(distance(x2,x1),2);
	        	if(tl > 0 && ((lightCollision && distance(eye, light) < distance(eye, p)) || !lightCollision)){
	        		lightAura = max(lightAura, 1/(0.01 + lightInvSize*ldis));
	        	}
				//color = applyFog(color, distance(eye, p), rd, vec3(0, 0, 1), p);

				color = mix(color, c, ref);
				
				if(m == MAT_WATER){
					if (waterRefract) {
						rd = refract(rd, normal, 1/1.333); 
						ro = p + rd*0.02;
						inRefraction = true;
					} else {
						rd = reflect(rd, normal);
						ro = p + rd*0.02;
					}
				} else {
					rd = reflect(rd, normal);
	         		//ro = p + rd*0.02;
	         		ro = p + rd*refJumpDistance;
				}

				
	            if(m == MAT_LIGHT){
	            	color = vec3(0.5, 0.5, 0.5);
	            }

	        	
	        	if (m == MAT_WATER) {
	        		//inRefraction = true;
	        		ref = 0.8;
	        	} else if (m == MAT_S5_BLOB) {
	        		ref = 0.7;
	        	} else if (m == MAT_S4_MIRROR) {
	        		ref = 0.9;
        		} else if (m == MAT_MORPH) {
	        		ref *= 0.4;
	        	} else {
		        	ref = 0;
	        	}
	        	if (ref <= 0.01) {
	        		j = 10000;
					//	ref = 1.0 * disFact;	        		
	        	} 
	           	break;
	        }
	
	        t += d;
    	}
    }
    
   
    fragColor = vec4(color + vec3(lightAura),  1.0); 
}


  