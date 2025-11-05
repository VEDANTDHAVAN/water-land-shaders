import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { useTexture, useCubeTexture } from "@react-three/drei";
import { createTopMaterial, createSideMaterial } from "./waterCubeMaterial.js";

/**
* WaterCube (40x6x40) — top face ripples, sides SSR refraction, bottom opaque.
* Position is set so TOP surface sits at y = 0 (cube center at y = -height/2).
*/
export default function WaterCube({ ripplesRef, size = [200, 20, 200] }) {
const meshRef = useRef();
const { gl, scene, camera, size: viewport } = useThree();
const waterTopYRef = useRef(0);
const _tmp = useRef(new THREE.Vector3());
useFrame(() => {
   if(!meshRef.current) return;
   _tmp.current.set(0, H*0.5, 0).applyMatrix4(meshRef.current.matrixWorld);
   waterTopYRef.current = _tmp.current.y;
});

// Box geometry with decent top density (width/depth segments), height 1 seg
const [W, H, D] = size;
const geometry = useMemo(() => new THREE.BoxGeometry(W, H, D, 128, 1, 128), [W, H, D]);

// Load DuDv twice to guarantee no cross-binding between top & sides
const baseMap   = useTexture("/textures/water_base.jpg");
const normalMap = useTexture("/textures/water_normal.jpg");
const dudvTop   = useTexture("/textures/water_dudv.png");
const dudvSide  = useTexture("/textures/water_dudv.png");

useMemo(() => {
 [baseMap, normalMap, dudvTop, dudvSide].forEach((tex) => {
 if (!tex) return;
 tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
 tex.anisotropy = 8;
 });
 if (normalMap) normalMap.flipY = false;
}, [baseMap, normalMap, dudvTop, dudvSide]);


// Load a real CubeTexture for the top's samplerCube
const envMap = useCubeTexture(
   ["px.jpg","px.jpg","px.jpg","px.jpg","px.jpg","px.jpg"],
   { path: "/textures/" }
);
envMap.colorSpace = THREE.SRGBColorSpace;

// Create materials: [right, left, top, bottom, front, back]
const topMat = useMemo(() => createTopMaterial({ baseMap, normalMap, dudvMap: dudvTop, envMap }), [baseMap, normalMap, dudvTop, envMap]);
const sideMat = useMemo(() => createSideMaterial({ dudvMap: dudvSide }), [dudvSide]);
const bottomMat = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color(0x0a1a1f), roughness: 1.0, metalness: 0.05, transparent: false }), []);
const materials = useMemo(() => [sideMat, sideMat, topMat, bottomMat, sideMat, sideMat], [sideMat, topMat, bottomMat]);

// Per-cube SSR render target (Pass 1: world without cube)
const rtRef = useRef();
useEffect(() => {
 const rt = new THREE.WebGLRenderTarget(viewport.width, viewport.height, {
 samples: 0,
 depthBuffer: true,
 stencilBuffer: false,
});
rt.texture.colorSpace = THREE.SRGBColorSpace;
rtRef.current = rt;
return () => rt.dispose();
}, []);


// Resize RT when canvas size changes
useEffect(() => {
if (!rtRef.current) return;
rtRef.current.setSize(viewport.width, viewport.height);
}, [viewport.width, viewport.height]);


useFrame(({ clock }) => {
const t = clock.getElapsedTime();


// Update uniforms shared
topMat.uniforms.uTime.value = t;
topMat.uniforms.uCameraPos.value.copy(camera.position);
topMat.uniforms.uFlowSpeed.value = t * 0.05;


sideMat.uniforms.uTime.value = t;
sideMat.uniforms.uResolution.value.set(viewport.width, viewport.height);


// Pack ripples (last 10)
if (ripplesRef && ripplesRef.current) {
 const arr = topMat.uniforms.uRipples.value;
 for (let i = 0; i < arr.length; i++) arr[i] = 0.0;
 const events = ripplesRef?.current ?? [];
 const n = Math.min(10, events.length);
 for (let i = 0; i < n; i++) {
 const r = events[events.length - n + i];
 const base = i * 6;
 arr[base + 0] = r.pos.x;
 arr[base + 1] = r.pos.z;
 arr[base + 2] = r.time;
 arr[base + 3] = Math.min(1, Math.max(0, r.strength ?? 0.5));
 arr[base + 4] = isFinite(r.dirX) ? r.dirX : 0.0;
 arr[base + 5] = isFinite(r.dirZ) ? r.dirZ : 0.0;
 }
 topMat.uniforms.uRipples.needsUpdate = true;
}


// PASS 1: render world WITHOUT cube → rt
const cube = meshRef.current;
if (!rtRef.current || !cube) return;


cube.visible = false; // RefSelf: W
gl.setRenderTarget(rtRef.current);
gl.render(scene, camera);
gl.setRenderTarget(null);
cube.visible = true;


// Feed the captured color to side shader
sideMat.uniforms.uSceneTex.value = rtRef.current.texture;
});


// Position so the top face sits at y = 0 (center at -H/2)
return (
<mesh ref={meshRef} geometry={geometry} material={materials} position={[0, -H / 2, 0]} castShadow receiveShadow />
);
}