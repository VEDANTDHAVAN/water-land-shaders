import { useRef, useEffect } from "react";
import * as THREE from "three";

/**
 * useRipples v4 (RD1 + auto waterY):
 * - Hover H4 hybrid: velocity-based trailing ripple + V-wake (no lag)
 * - Click C2: 3 pulses with NO visible delay (encoded as slightly past timestamps)
 * - Auto raycast plane uses current water top Y from waterTopYRef
 * - Emits { pos, time, strength, dirX, dirZ } ; S1 clamped
 */
export default function useRipples(gl, camera, maxRipples = 36, waterTopYRef) {
  const ripplesRef = useRef([]);
  const last = useRef({ world: null, t: 0, spawnT: 0 });

  useEffect(() => {
    if (!gl || !camera) return;

    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    function intersectWater(e, out) {
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera({ x, y }, camera);

      // Update plane to current water-top Y (auto)
      const waterY = (waterTopYRef?.current ?? 0);
      plane.constant = waterY;

      const hit = out || new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, hit);
      if (!isFinite(hit.x) || !isFinite(hit.z)) return null;
      hit.y = waterY;
      return hit;
    }

    function pushRipple(pos, strength, dirX, dirZ, tSec) {
      const s = Math.min(1, Math.max(0, strength || 0));
      const len = Math.hypot(dirX || 0, dirZ || 0) || 1e-6;
      const dx = (dirX || 0) / len, dz = (dirZ || 0) / len;

      ripplesRef.current.push({
        pos: pos.clone(),
        time: tSec ?? performance.now() / 1000,
        strength: s,
        dirX: dx,
        dirZ: dz,
      });
      if (ripplesRef.current.length > maxRipples) {
        ripplesRef.current.splice(0, ripplesRef.current.length - maxRipples);
      }
    }

    // CLICK: C2 pebble – 3 pulses with *no visible delay*
    // tip: encode immediate visibility by backdating time a hair
    function onClick(e) {
      const p = intersectWater(e);
      if (!p) return;
      const now = performance.now() / 1000;

      // First ring visible NOW; subsequent rings also visible immediately
      // (phase progression simulated by slightly earlier timestamps)
      pushRipple(p, 1.0, 0, 0, now - 0.00);
      pushRipple(p, 0.72, 0, 0, now - 0.06);
      pushRipple(p, 0.48, 0, 0, now - 0.12);
    }

    // HOVER: H4 (trail + V-wake), MS2 mapping, zero-lag
    function onPointerMove(e) {
      const nowMs = performance.now();
      const p = intersectWater(e);
      if (!p) return;

      if (!last.current.world) {
        last.current.world = p.clone();
        last.current.t = nowMs;
        last.current.spawnT = nowMs;
        return;
      }

      const dtMs = Math.max(1, nowMs - last.current.t);
      const dt = dtMs / 1000;
      const dx = p.x - last.current.world.x;
      const dz = p.z - last.current.world.z;
      const dist = Math.hypot(dx, dz);
      const speed = dist / dt; // wu/s

      const dirX = dx, dirZ = dz;

      // Dynamic throttle (faster -> more frequent); tighter for zero-lag feel
      // ~80ms (slow) -> ~16ms (fast)
      const vNorm = Math.min(1, speed / 18.0);
      const intervalMs = 80 - 64 * vNorm;
      if (nowMs - last.current.spawnT < intervalMs) {
        last.current.world.copy(p);
        last.current.t = nowMs;
        return;
      }

      // Strength mapping (more visible baseline)
      // 0.35 .. 0.85 across normal speeds
      const base = 0.35, range = 0.50;
      const strength = Math.min(0.85, base + range * vNorm);
      const nowSec = nowMs / 1000;

      // 1) Trail ripple at cursor (instant)
      pushRipple(p, strength, dirX, dirZ, nowSec);

      // 2) Subtle V-wake (stronger than before for visibility)
      const len = Math.hypot(dirX, dirZ);
      if (len > 1e-6) {
        const ndx = dirX / len, ndz = dirZ / len;
        const rightX = ndz, rightZ = -ndx;

        const back = THREE.MathUtils.clamp(0.55 + 0.65 * vNorm, 0.55, 1.2);
        const spread = THREE.MathUtils.clamp(0.35 + 0.55 * vNorm, 0.35, 0.9);

        const centerBack = new THREE.Vector3(p.x - ndx * back, p.y, p.z - ndz * back);
        const pL = new THREE.Vector3(centerBack.x - rightX * spread, p.y, centerBack.z - rightZ * spread);
        const pR = new THREE.Vector3(centerBack.x + rightX * spread, p.y, centerBack.z + rightZ * spread);

        const sideStrength = strength * 0.7; // louder than before
        pushRipple(pL, sideStrength, dirX, dirZ, nowSec);
        pushRipple(pR, sideStrength, dirX, dirZ, nowSec);
      }

      last.current.world.copy(p);
      last.current.t = nowMs;
      last.current.spawnT = nowMs;
    }

    gl.domElement.addEventListener("click", onClick, { passive: true });
    gl.domElement.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      gl.domElement.removeEventListener("click", onClick);
      gl.domElement.removeEventListener("pointermove", onPointerMove);
    };
  }, [gl, camera, maxRipples, waterTopYRef]);

  return ripplesRef;
}
