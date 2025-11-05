#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif

// Top face (water surface): fresnel + env reflection + normal/dudv flow
uniform vec3 uSeaColor;
uniform vec3 uShallowColor;
uniform vec3 uCameraPos;
uniform samplerCube uEnvMap;
uniform sampler2D uBaseMap; // optional tint texture
uniform sampler2D uNormalMap; // tangent-space normal
uniform sampler2D uDuDvMap; // flow map
uniform float uNormalScale;
uniform float uUVScale;
uniform float uFlowSpeed;

// Foam 
uniform float uFoamIntensity;
uniform vec3 uFoamColor;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vHeight;
varying vec2 vUv;


vec3 getPerturbedNormal(vec2 uv) {
vec3 n = texture2D(uNormalMap, uv).xyz * 2.0 - 1.0;
n.xy *= uNormalScale;
// Approximate TBN for flat top: up ~ Y
vec3 N = normalize(vec3(n.x, 1.0 + n.z * 0.5, n.y));
return N;
}


void main() {
// Flow-distorted UVs
float t = uFlowSpeed;
vec2 flow = texture2D(uDuDvMap, vUv * uUVScale + vec2(t, 0.0)).rg * 2.0 - 1.0;
flow *= 0.03;
vec2 uv = vUv * uUVScale + flow;


// Depth tint
float depthFactor = clamp((vHeight + 0.5) * 1.5, 0.0, 1.0);
vec3 baseTex = texture2D(uBaseMap, uv).rgb;
vec3 baseCol = mix(uSeaColor, uShallowColor, depthFactor) * baseTex;


// View & fresnel
vec3 V = normalize(uCameraPos - vWorldPos);
vec3 N = normalize(mix(vNormal, getPerturbedNormal(uv), 0.8));
float fresnel = pow(1.0 - max(dot(V, N), 0.0), 3.0);


// Cube reflection
vec3 reflDir = reflect(-V, N);
vec3 reflCol = textureCube(uEnvMap, reflDir).rgb;


// Specular sparkle
vec3 L = normalize(vec3(0.5, 1.0, 0.3));
float spec = pow(max(dot(reflect(-L, N), V), 0.0), 32.0);

// Foam: OnRipples
// we detect ripple crests using height field derivatives.
// Requires OES_standard_derivatives (enabled in material).
float foamMask = 0.0;
#ifdef GL_OES_standard_derivatives
    float dh = fwidth(vHeight); // gradient magnitude proxy (higher on sharp ripples)
    // Soft foam edge appears where dh crosses a threshold
    float edgeFoam = smoothstep(0.002, 0.010, dh); // tune if needed

    // Micro-bubbles: high-frequency noise modulated by edge foam
    float microNoise =
      texture2D(uDuDvMap, vUv * (uUVScale * 3.0) + vec2(t * 0.25, 0.0)).r;
    // High-pass the noise so only bright speckles show
    float micro = smoothstep(0.70, 0.95, microNoise);

    // Combine (F4): soft + micro, and bias slightly by fresnel for realism
    foamMask = clamp(edgeFoam * 0.75 + micro * 0.35, 0.0, 1.0);
    foamMask *= (0.6 + 0.4 * fresnel);
  #endif

// Slight fresnel lift (helps readability)
  fresnel *= 1.12;

  // Base water shading with reflection
  vec3 color = mix(baseCol, reflCol, fresnel * 0.9) + vec3(spec) * 0.25 * fresnel;

  // Apply foam only where ripples/crests exist
  color = mix(color, uFoamColor, foamMask * uFoamIntensity);

  gl_FragColor = vec4(color, 0.96);
}