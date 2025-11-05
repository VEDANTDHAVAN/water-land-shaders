uniform float uTime;
// RD1: 10 ripples × (x, z, startTime, strength, dirX, dirZ) = 60 floats
uniform float uRipples[60];

varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vHeight;
varying vec2 vUv;
varying vec4 vClipPos;

void main() {
  vec3 pos = position;
  vUv = uv;

  // Only displace the top face
  float isTop = step(0.9, normal.y);
  float wave = 0.0;

  if (isTop > 0.5) {
    // Gentle base motion
    wave += sin((pos.x + uTime * 1.2) * 0.5) * 0.06;
    wave += cos((pos.z - uTime * 0.9) * 0.55) * 0.05;

    for (int i = 0; i < 10; i++) {
      int k = i * 6;
      float ix = uRipples[k + 0];
      float iz = uRipples[k + 1];
      float startTime = uRipples[k + 2];
      float strength  = uRipples[k + 3];
      float dirX      = uRipples[k + 4];
      float dirZ      = uRipples[k + 5];

      float age = uTime - startTime;
      if (age > 0.0 && strength > 0.0) {
        vec2 d = vec2(pos.x - ix, pos.z - iz);
        float dist = length(d) + 1e-6;

        // --- Direction-aware wake shaping (RD1) ---
        vec2 nDir = normalize(vec2(dirX, dirZ) + 1e-6);
        vec2 perp = vec2(-nDir.y, nDir.x);
        float parallel = dot(d, nDir);
        float lateral  = dot(d, perp);

        // Anisotropy: stretch laterally (behind cursor) when there is direction
        // More stretch with more strength; still subtle for realism
        float s = clamp(strength, 0.0, 1.0);
        float anis = mix(1.0, 1.6, s); // 1.0 → 1.6 sideways stretch
        float effDist = sqrt(parallel * parallel + (lateral * anis) * (lateral * anis));

        // Back-bias: stronger wake behind motion than ahead (V-wake feel)
        float back = smoothstep(0.0, 1.0, clamp(-parallel / 6.0, 0.0, 1.0));
        float wakeAmpBoost = mix(1.0, 1.25, back * s);

        // --- Base physical params ---
        float baseSpeed = 4.0;
        float baseFreq  = 3.0;
        float baseAmp   = 0.25;
        float baseTimeDecay = 1.2;
        float baseDistDecay = 1.2;

        // R7 (Medium, Physical) boosts
        const float AMP_BOOST   = 1.60;
        const float FREQ_BOOST  = 1.15;
        const float TDECAY_MULT = 0.75;
        const float DDECAY_MULT = 0.85;

        float speed   = mix(baseSpeed,  baseSpeed  * 1.15, s);
        float freq    = mix(baseFreq,   baseFreq   * FREQ_BOOST, s);
        float amp     = mix(baseAmp,    baseAmp    * AMP_BOOST, s) * wakeAmpBoost;
        float tDecay  = mix(baseTimeDecay, baseTimeDecay * TDECAY_MULT, s);
        float dDecay  = mix(baseDistDecay, baseDistDecay * DDECAY_MULT, s);

        // Distance model B: halve the quadratic fade so ripples stay visible farther
        float dist2 = effDist * effDist;
        float distScale = exp(-0.02 * dist2); // was 0.04 for D1

        float ripple =
          sin(effDist * freq - age * speed) *
          exp(-age * tDecay) *
          exp(-effDist * dDecay) *
          distScale;

        wave += ripple * amp;
      }
    }

    pos.y += wave;
  }

  vHeight = pos.y;

  vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
  vWorldPos = worldPosition.xyz;
  vNormal   = normalize(normalMatrix * normal);
  vClipPos  = projectionMatrix * viewMatrix * worldPosition;
  gl_Position = vClipPos;
}
