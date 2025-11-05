import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats, Environment } from '@react-three/drei';
import './App.css';
import Scene from './components/Scene.jsx';
import * as THREE from "three";

export default function App() {
return (
<div className="bg-slate-900 text-white fixed inset-0">
<Canvas
 style={{ height: 700,}}
 shadows
 dpr={[1, 2]}
 camera={{ position: [0, 30, 44], fov: 50 }}
 gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
 onCreated={({ gl }) => {
 gl.toneMapping = THREE.ACESFilmicToneMapping;
 gl.toneMappingExposure = 1.0;
 gl.outputColorSpace = THREE.SRGBColorSpace;
 }}
 >
 <ambientLight intensity={0.5} />
 <directionalLight position={[6, 12, 6]} intensity={1.2} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
 <Environment preset="sunset" />
 <Scene />
 <OrbitControls makeDefault />
 <Stats />
 </Canvas>
 </div>
);
}
