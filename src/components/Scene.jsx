import { useThree } from "@react-three/fiber";
import { Land } from "./land";
import { Water } from "./water";
import useRipples from "../hooks/useRipples.js";


export default function Scene() {
 const { gl, camera } = useThree();
 const ripplesRef = useRipples(gl, camera);

 return (
  <group>
   {/* GLTF terrain model (adjust url/scale/rotation as needed) */}
   <Land url="/models/terrain.glb" scale={1.0} position={[-10, -10, -1]} />

   {/* Textured water with shader-based waves & fresnel */}
   <Water
    ripplesRef={ripplesRef} size={[150, 10, 150]}
    baseMapUrl="/textures/water_base.jpg"
    normalMapUrl="/textures/water_normal.jpg"
    dudvMapUrl="/textures/water_dudv.jpg"
   />
  </group>
 );
}