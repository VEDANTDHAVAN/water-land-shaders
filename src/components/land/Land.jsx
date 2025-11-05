import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export default function Land({ url= "/models/terrain.glb", ...props }) {
   const { scene } = useGLTF(url);
   
   useMemo(() => {
    let minY = Infinity;
    const box = new THREE.Box3().setFromObject(scene);
    minY = box.min.y;
    // If terrain sits below world origin, lift it up
    if(minY !== 0) {
        scene.position.y = scene.position.y - minY;
    }

    scene.traverse((obj) => {
        if(obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
        }
    });
   }, [scene]);
   return <primitive object={scene} {...props} />
}

useGLTF.preload("/models/terrain.glb");