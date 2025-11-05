import * as THREE from "three";
import topVertex from "./shaders/waterCube.vert.glsl?raw";
import topFragment from "./shaders/waterCube.frag.glsl?raw";
import sidesFragment from "./shaders/waterCubeSides.frag.glsl?raw";

export function createTopMaterial({ baseMap, normalMap, dudvMap, envMap }) {
const uniforms = {
uTime: { value: 0 },
uRipples: { value: new Float32Array(60) },
uCameraPos: { value: new THREE.Vector3() },
uSeaColor: { value: new THREE.Color(0x135e8a) },
uShallowColor: { value: new THREE.Color(0x42e3d1) }, // brighter tropical shallow
uEnvMap: { value: envMap || null },
uBaseMap: { value: baseMap || null },
uNormalMap: { value: normalMap || null },
uDuDvMap: { value: dudvMap || null },
uNormalScale: { value: 1.0 },
uUVScale: { value: 6.0 },
uFlowSpeed: { value: 0.0 },
// Foam controls
uFoamIntensity: { value: 0.6 },
uFoamColor: { value: new THREE.Color(0xffffff) },
};
const mat = new THREE.ShaderMaterial({
uniforms,
vertexShader: topVertex,
fragmentShader: topFragment,
transparent: true,
depthWrite: false,
extensions: { derivatives: true },
});
return mat;
}


export function createSideMaterial({ dudvMap, tint = new THREE.Color(0x149e92) }) {
const uniforms = {
uSceneTex: { value: null },
uResolution: { value: new THREE.Vector2(1, 1) },
uTime: { value: 0 },
uDuDvMap: { value: dudvMap || null },
uRefractStrength: { value: 1.0 },
uTintColor: { value: tint },
uOpacity: { value: 0.55 }, // semi-transparent
};
const mat = new THREE.ShaderMaterial({
uniforms,
vertexShader: topVertex, // reuse same vertex stage (provides vClipPos)
fragmentShader: sidesFragment,
transparent: true,
depthWrite: false,
});
return mat;
}