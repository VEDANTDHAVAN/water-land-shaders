## 📘 **Realistic Water–Land Interaction (Three.js + React + WebGL Shaders)**

This project implements a **physically-inspired interactive water system** using React Three Fiber, custom GLSL shaders, and a GLTF terrain model. It features realistic ripple propagation, hover-based wakes, click-based pebble drops, and dynamic refraction on cube sides.

---

## 🌊 Features

### ✅ **Water Surface (Top Face)**

* Custom GLSL displacement shader
* Physically-inspired ripple propagation
* Directional wakes based on mouse movement (RD1)
* Fresnel reflections + normal mapping + UV distortion (DuDv)
* Dynamic foam on high-energy ripple zones *(optional)*

### 🔁 **Ripple Input System**

| Interaction  | Result                                           |
| ------------ | ------------------------------------------------ |
| **Hover**    | Velocity-controlled trail + V-shaped wake        |
| **Click**    | Pebble-drop effect: 3 concentric pulses          |
| **No Delay** | All ripple responses are instant (no visual lag) |

Features included in the ripple system:

* Motion-based ripple intensity
* Auto-detected water height (**works even if cube moves**)
* RD1: 6-float ripple encoding (pos, time, strength, direction)
* Efficient GPU uniform packing

### 🧊 **Water Cube**

* Full 3D water volume represented as a cube: **200 × 20 × 200**
* Top: animated water shader
* Sides: SSR-like screen-space refraction simulation
* Bottom: darkened opaque depth surface
* Materials assigned per face

### 🌍 **Terrain Integration**

* GLTF terrain loaded with `@react-three/drei/useGLTF`
* Cast & receive shadows enabled for realism
* Can be placed partially inside water

---

## 🧠 Technical Highlights

| Component        | Technology                                   |
| ---------------- | -------------------------------------------- |
| Shaders          | GLSL (custom vertex & fragment)              |
| Scene            | React Three Fiber (`@react-three/fiber`)     |
| Helpers          | `@react-three/drei`                          |
| Textures         | Base map, Normal map, DuDv distortion        |
| Reflection Model | Screen-space sampling (SSR Mode A)           |
| Ripple Encoding  | RD1 (direction-aware, 6 floats × 10 ripples) |

---

## ⚙️ How it Works (High-Level)

### 1. **User Interaction → Ripple Events**

The custom `useRipples` hook listens for pointer input and produces ripple objects:

```js
{
  pos: Vector3,     // where the ripple started
  time: seconds,    // timestamp for propagation
  strength: 0–1,    // amplitude scale
  dirX, dirZ        // normalized direction for wake shaping
}
```

### 2. **GPU Ripple Packing**

The last 10 ripples are packed into a `Float32Array(60)` uniform:

```
[x, z, time, strength, dirX, dirZ] × 10
```

### 3. **Vertex Shader (Top Surface)**

* Computes base waves + ripples
* Applies physical falloff by time & distance
* RD1 directional shaping (V-wake)
* Softened distance fade (DistanceModel B)

### 4. **Side Refraction Pass**

* Water cube hides itself for a frame
* Scene is rendered to a framebuffer
* Sides refract using that texture
* Creates illusion of underwater distortion

### 5. **Auto-Detect Surface Height**

The system computes top face world-Y dynamically so ripples always target the water surface even if:

* The cube moves
* The cube scales
* The water rotates (optional)

---

## 📂 Project Structure

```
src/
 ├─ components/
 │   ├─ land/
 │   │   ├─ Land.jsx
 │   ├─ water/
 │   │   ├─ WaterCube.jsx
 │   │   ├─ waterCubeMaterial.js
 │   │   ├─ shaders/
 │   │   │   ├─ waterCube.vert.glsl
 │   │   │   ├─ waterCube.frag.glsl
 │   │   │   ├─ waterCubeSides.frag.glsl
 │   └─ Scene.jsx
 ├─ hooks/
 │   └─ useRipples.js
 ├─ App.jsx
 └─ main.jsx
```

---

## 🏗 Setup & Run

```bash
npm install
npm run dev
```

Put your textures in:

```
public/textures/
  water_base.jpg
  water_normal.jpg
  water_dudv.png
```

And your terrain model in:

```
public/models/
  terrain.glb
```

---

## 🔮 Possible Enhancements

| Feature                      | Status                 |
| ---------------------------- | ---------------------- |
| Foam rings on strong ripples | Available (F4)         |
| Underwater caustics          | Planned                |
| Infinite ocean tiling        | Optional mode          |
| Multi-water surfaces         | Supported via Mode B/C |
