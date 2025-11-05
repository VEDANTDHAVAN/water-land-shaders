// Side walls: screen-space refraction with tropical tint
uniform sampler2D uSceneTex; // pass 1 color buffer
uniform vec2 uResolution; // viewport size
uniform float uTime;
uniform sampler2D uDuDvMap; // wavy distortion
uniform float uRefractStrength; // 0.0..1.0
uniform vec3 uTintColor; // turquoise tint
uniform float uOpacity; // side opacity


varying vec4 vClipPos;
varying vec3 vNormal;


void main() {
// Project to screen UV
vec2 ndc = vClipPos.xy / vClipPos.w; // -1..1
vec2 uv = ndc * 0.5 + 0.5; // 0..1


// Subtle edge falloff by view-facing normal
float facing = clamp(abs(normalize(vNormal).x) + abs(normalize(vNormal).z), 0.0, 1.0);


// Flow-based refraction offset
vec2 flow = texture2D(uDuDvMap, uv * 3.0 + vec2(uTime * 0.05, 0.0)).rg * 2.0 - 1.0;
flow *= 0.015 * uRefractStrength;


vec2 refrUv = uv + flow;
vec3 sceneCol = texture2D(uSceneTex, refrUv).rgb;


// Tropical tint blend
vec3 tinted = mix(sceneCol, uTintColor, 0.25);


gl_FragColor = vec4(tinted, uOpacity);
}