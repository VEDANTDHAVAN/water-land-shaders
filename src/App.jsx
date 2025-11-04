import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import './App.css';
import Scene from './components/Scene.jsx';

function App() {
  return (
    <>
      <div className="w-screen h-screen bg-slate-900 text-white">
       <div className="absolute inset-0 pointer-events-none flex items-start justify-center p-6 z-10">
        <div className="bg-black/40 rounded-md px-4 py-2 pointer-events-auto">
         <strong className="block">Interactive Water ↔ Land (Three.js + React)</strong>
         <small className="block text-xs text-gray-300">Move the mouse or click to create ripples. Scroll to zoom.</small>
        </div>
        <Canvas camera={{ position: [0, 6, 10], fov: 50 }}>
         <ambientLight intensity={0.6} />
         <directionalLight position={[5, 10, 5]} intensity={1.0} />
         <Scene />
         <OrbitControls makeDefault />
         <Stats />
        </Canvas>
       </div>
      </div>
    </>
  )
}

export default App
