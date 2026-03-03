/**
 * PcPreview3D - Showroom-quality 3D PC builder preview
 *
 * Designed to look like a real product render from a high-end PC brand website.
 *
 * SCENE:        PCFSoftShadowMap, ACESFilmic tonemapping, studio HDRI
 * LIGHTING:     Key light (soft directional), rim light (edge highlight), subtle ambient
 * MATERIALS:    MeshPhysicalMaterial everywhere - glass transmission, metal, plastic
 * ANIMATION:    Slow showroom rotation, spinning GPU/cooler fans, breathing RGB, camera float
 * POSTPROCESS:  Bloom (subtle light spill), Vignette, optional mild DepthOfField
 * GROUND:       Reflective dark plane with ContactShadows
 */

import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls, AdaptiveDpr } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/* ======================================================================= */
/*  Types                                                                   */
/* ======================================================================= */

type BuildPreviewLabels = {
  cpu: string;
  gpu: string;
  motherboard: string;
  case: string;
  ram: string;
  storage: string;
  cooling: string;
};

export type BuildPreviewConfig = {
  cpuTier: number;
  gpuTier: number;
  motherboardTier: number;
  caseTier: number;
  ramTier: number;
  storageTier: number;
  coolingTier: number;
  accessoriesCount: number;
  labels: BuildPreviewLabels;
};

interface PcPreview3DProps {
  open: boolean;
  onClose: () => void;
  totalLabel: string;
  config: BuildPreviewConfig;
}

/* ======================================================================= */
/*  Helpers                                                                 */
/* ======================================================================= */

const getRamStickCount = (t: number) => (t <= 0 ? 0 : t <= 2 ? 1 : t <= 4 ? 2 : 4);
const getStorageCount = (t: number) => (t <= 0 ? 0 : t <= 2 ? 1 : t <= 5 ? 2 : 3);
const getFanCount = (t: number) => (t <= 0 ? 0 : t <= 2 ? 1 : t <= 5 ? 2 : 3);
const isTowerCooler = (label: string) => /air|tower|stock/i.test(label);

/* ======================================================================= */
/*  Texture Factories (RGBA - Three >= r152 safe)                           */
/* ======================================================================= */

const makePCBTexture = (): THREE.DataTexture => {
  const S = 256;
  const d = new Uint8Array(S * S * 4);
  for (let i = 0; i < S * S; i++) {
    const x = i % S, y = (i / S) | 0;
    const trace = (Math.sin(x * 0.45) * Math.cos(y * 0.35) + Math.sin((x + y) * 0.18) + Math.cos((x - y) * 0.12)) * 0.33 + 0.5;
    const via = Math.random() > 0.996 ? 120 : 0;
    const smd = Math.random() > 0.998 ? 60 : 0;
    const g = Math.floor(18 + trace * 28 + via + smd);
    d[i * 4] = Math.floor(g * 0.3);
    d[i * 4 + 1] = g;
    d[i * 4 + 2] = Math.floor(g * 0.2);
    d[i * 4 + 3] = 255;
  }
  const t = new THREE.DataTexture(d, S, S, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 6);
  t.needsUpdate = true;
  return t;
};

const makeNormalMap = (): THREE.DataTexture => {
  const S = 128;
  const d = new Uint8Array(S * S * 4);
  for (let i = 0; i < S * S; i++) {
    const x = i % S, y = (i / S) | 0;
    d[i * 4] = 128 + Math.floor(Math.sin((x / S) * Math.PI * 20) * 10 + Math.cos((y / S) * Math.PI * 16) * 6);
    d[i * 4 + 1] = 128 + Math.floor(Math.cos((y / S) * Math.PI * 20) * 10 + Math.sin((x / S) * Math.PI * 16) * 6);
    d[i * 4 + 2] = 255;
    d[i * 4 + 3] = 255;
  }
  const t = new THREE.DataTexture(d, S, S, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  t.needsUpdate = true;
  return t;
};

const makeRoughnessMap = (): THREE.DataTexture => {
  const S = 128;
  const d = new Uint8Array(S * S * 4);
  for (let i = 0; i < S * S; i++) {
    const x = i % S, y = (i / S) | 0;
    const v = Math.floor(140 + Math.sin(x * 0.3 + y * 0.5) * 25 + Math.random() * 15);
    d[i * 4] = v; d[i * 4 + 1] = v; d[i * 4 + 2] = v; d[i * 4 + 3] = 255;
  }
  const t = new THREE.DataTexture(d, S, S, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  t.needsUpdate = true;
  return t;
};

/* CameraFloat removed – it fights with OrbitControls and makes interaction janky */

/* ======================================================================= */
/*  Spinning fan component (reusable for GPU + cooler + case fans)          */
/* ======================================================================= */

const SpinningFan: React.FC<{
  radius: number;
  blades: number;
  speed: number;
  position?: [number, number, number];
  axis?: "x" | "y" | "z";
  thickness?: number;
  color?: string;
}> = ({ radius, blades, speed, position = [0, 0, 0], axis = "y", thickness = 0.01, color = "#1e1e26" }) => {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (axis === "y") groupRef.current.rotation.y += delta * speed;
    else if (axis === "x") groupRef.current.rotation.x += delta * speed;
    else groupRef.current.rotation.z += delta * speed;
  });
  return (
    <group position={position}>
      <group ref={groupRef}>
        {Array.from({ length: blades }).map((_, i) => {
          const a = (i / blades) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * radius * 0.5, 0, Math.sin(a) * radius * 0.5]} rotation={[0, a + 0.5, 0]}>
              <boxGeometry args={[radius * 0.55, thickness, 0.018]} />
              <meshStandardMaterial color={color} metalness={0} roughness={0.6} />
            </mesh>
          );
        })}
        {/* Hub */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[radius * 0.15, radius * 0.15, thickness * 1.5, 12]} />
          <meshStandardMaterial color="#1a1a22" metalness={0.4} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
};

/* ======================================================================= */
/*  RGB Glow Ring – single color, subtle (for GPU / cooler accents)         */
/* ======================================================================= */

const RgbGlowRing: React.FC<{
  radius: number;
  position?: [number, number, number];
  baseColor?: string;
  intensityBase?: number;
}> = ({ radius, position = [0, 0, 0], baseColor = "#00ccff", intensityBase = 1.2 }) => {
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null);
  useFrame(({ clock }) => {
    if (!matRef.current) return;
    const t = clock.elapsedTime;
    matRef.current.emissiveIntensity = intensityBase + Math.sin(t * 1.5) * 0.35;
  });
  return (
    <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, radius * 0.08, 16, 64]} />
      <meshPhysicalMaterial
        ref={matRef}
        color="#0a0a10"
        emissive={new THREE.Color(baseColor)}
        emissiveIntensity={intensityBase}
        metalness={0.1}
        roughness={0.3}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
};

/* ======================================================================= */
/*  Rainbow Fan Ring – thick multicolor ring like gaming PC fans             */
/*  Each segment is a separate arc with its own emissive hue                */
/* ======================================================================= */

const RAINBOW_SEGMENTS = 24;
const RAINBOW_HUES = Array.from({ length: RAINBOW_SEGMENTS }, (_, i) => i / RAINBOW_SEGMENTS);

const RainbowFanRing: React.FC<{
  radius: number;
  tubeRadius?: number;
  position?: [number, number, number];
  rotationAxis?: "x" | "y" | "z";
  speed?: number;
}> = ({ radius, tubeRadius, position = [0, 0, 0], rotationAxis = "z", speed = 0.4 }) => {
  const groupRef = useRef<THREE.Group>(null);
  const matsRef = useRef<THREE.MeshPhysicalMaterial[]>([]);
  const tube = tubeRadius ?? radius * 0.14;

  // Build materials once
  const mats = useMemo(() => {
    const arr: THREE.MeshPhysicalMaterial[] = [];
    for (let i = 0; i < RAINBOW_SEGMENTS; i++) {
      const c = new THREE.Color();
      c.setHSL(RAINBOW_HUES[i], 1, 0.45);
      arr.push(new THREE.MeshPhysicalMaterial({
        color: "#0a0a10",
        emissive: c,
        emissiveIntensity: 1.5,
        metalness: 0.05,
        roughness: 0.35,
        transparent: true,
        opacity: 0.92,
      }));
    }
    return arr;
  }, []);

  useEffect(() => {
    matsRef.current = mats;
    return () => { mats.forEach(m => m.dispose()); };
  }, [mats]);

  // Rotate the rainbow ring slowly + breathe intensity
  useFrame(({ clock }, delta) => {
    if (groupRef.current) {
      if (rotationAxis === "z") groupRef.current.rotation.z += delta * speed;
      else if (rotationAxis === "x") groupRef.current.rotation.x += delta * speed;
      else groupRef.current.rotation.y += delta * speed;
    }
    const t = clock.elapsedTime;
    const breath = 1.5 + Math.sin(t * 2) * 0.4;
    for (const m of matsRef.current) {
      m.emissiveIntensity = breath;
    }
  });

  const arcAngle = (Math.PI * 2) / RAINBOW_SEGMENTS;

  return (
    <group position={position}>
      <group ref={groupRef}>
        {mats.map((mat, i) => {
          const angle = i * arcAngle;
          const cx = Math.cos(angle + arcAngle / 2) * radius;
          const cy = Math.sin(angle + arcAngle / 2) * radius;
          // Each segment is a small box arc approximation
          const segLen = 2 * radius * Math.sin(arcAngle / 2) * 1.05;
          return (
            <mesh
              key={i}
              position={[cx, cy, 0]}
              rotation={[0, 0, angle + arcAngle / 2 + Math.PI / 2]}
              material={mat}
            >
              <boxGeometry args={[segLen, tube * 2, tube * 2]} />
            </mesh>
          );
        })}
      </group>
      {/* Dark inner ring (fan frame) */}
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[radius - tube * 0.8, tube * 0.3, 8, 48]} />
        <meshStandardMaterial color="#0e0e14" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Dark outer ring (fan frame) */}
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[radius + tube * 0.8, tube * 0.3, 8, 48]} />
        <meshStandardMaterial color="#0e0e14" metalness={0.3} roughness={0.5} />
      </mesh>
    </group>
  );
};

/* ======================================================================= */
/*  Realistic Motherboard (MeshPhysicalMaterial)                            */
/* ======================================================================= */

const Motherboard: React.FC<{ pcbTex: THREE.Texture; normalMap: THREE.Texture; roughnessMap: THREE.Texture }> = ({ pcbTex, normalMap, roughnessMap }) => {
  const W = 1.7, H = 1.9, D = 0.08;
  return (
    <group position={[0, 0, -0.86]}>
      {/* PCB board */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[W, H, D]} />
        <meshPhysicalMaterial
          map={pcbTex}
          normalMap={normalMap}
          roughnessMap={roughnessMap}
          color="#1a5c2a"
          metalness={0.15}
          roughness={0.55}
          clearcoat={0.2}
          clearcoatRoughness={0.8}
        />
      </mesh>

      {/* CPU socket + retention frame */}
      <mesh position={[-0.15, 0.25, 0.05]} castShadow receiveShadow>
        <boxGeometry args={[0.52, 0.52, 0.025]} />
        <meshPhysicalMaterial color="#303030" metalness={1} roughness={0.25} normalMap={normalMap} />
      </mesh>
      {[[-0.15, 0.51, 0.065], [-0.15, -0.01, 0.065], [0.11, 0.25, 0.065], [-0.41, 0.25, 0.065]].map((p, i) => (
        <mesh key={`ret-${i}`} position={p as [number, number, number]} castShadow>
          <boxGeometry args={[i < 2 ? 0.55 : 0.03, i < 2 ? 0.025 : 0.52, 0.015]} />
          <meshPhysicalMaterial color="#8a8a8a" metalness={1} roughness={0.2} />
        </mesh>
      ))}

      {/* Chipset heatsink */}
      <mesh position={[0.25, -0.45, 0.09]} castShadow>
        <boxGeometry args={[0.35, 0.25, 0.1]} />
        <meshPhysicalMaterial color="#1e1e22" metalness={1} roughness={0.25} clearcoat={0.5} clearcoatRoughness={0.1} />
      </mesh>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`chf-${i}`} position={[0.25, -0.345 + i * 0.035, 0.145]}>
          <boxGeometry args={[0.33, 0.004, 0.035]} />
          <meshPhysicalMaterial color="#2a2a30" metalness={1} roughness={0.2} />
        </mesh>
      ))}

      {/* VRM heatsinks */}
      <mesh position={[-0.65, 0.5, 0.09]} castShadow>
        <boxGeometry args={[0.2, 0.8, 0.1]} />
        <meshPhysicalMaterial color="#1e1e24" metalness={1} roughness={0.28} clearcoat={0.4} clearcoatRoughness={0.15} />
      </mesh>
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={`vf-${i}`} position={[-0.65, 0.14 + i * 0.075, 0.145]}>
          <boxGeometry args={[0.18, 0.004, 0.035]} />
          <meshPhysicalMaterial color="#2a2a30" metalness={1} roughness={0.2} />
        </mesh>
      ))}
      <mesh position={[-0.15, 0.78, 0.09]} castShadow>
        <boxGeometry args={[0.8, 0.18, 0.1]} />
        <meshPhysicalMaterial color="#1e1e24" metalness={1} roughness={0.28} clearcoat={0.4} />
      </mesh>

      {/* DIMM slots */}
      {[0.35, 0.42, 0.49, 0.56].map((x, i) => (
        <group key={`dimm-${i}`}>
          <mesh position={[x, 0.25, 0.052]}>
            <boxGeometry args={[0.035, 0.9, 0.04]} />
            <meshPhysicalMaterial color="#0e0e10" metalness={0.2} roughness={0.7} />
          </mesh>
          {[0.72, -0.22].map((y, j) => (
            <mesh key={j} position={[x, y, 0.065]}>
              <boxGeometry args={[0.04, 0.03, 0.018]} />
              <meshPhysicalMaterial color="#d8d8d8" metalness={1} roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}

      {/* PCIe x16 slot */}
      <mesh position={[-0.12, -0.2, 0.055]}>
        <boxGeometry args={[0.85, 0.04, 0.035]} />
        <meshPhysicalMaterial color="#0e0e10" metalness={0.2} roughness={0.6} />
      </mesh>
      <mesh position={[0.3, -0.2, 0.065]}>
        <boxGeometry args={[0.04, 0.04, 0.015]} />
        <meshPhysicalMaterial color="#d0d0d0" metalness={1} roughness={0.3} />
      </mesh>

      {/* M.2 slot + standoff */}
      <mesh position={[-0.15, -0.55, 0.055]}>
        <boxGeometry args={[0.5, 0.04, 0.02]} />
        <meshPhysicalMaterial color="#0e0e10" metalness={0.2} roughness={0.6} />
      </mesh>
      <mesh position={[0.1, -0.55, 0.065]}>
        <cylinderGeometry args={[0.012, 0.012, 0.025, 12]} />
        <meshPhysicalMaterial color="#d4a560" metalness={1} roughness={0.1} />
      </mesh>

      {/* I/O shield */}
      <mesh position={[-0.72, 0.7, 0.04]} castShadow>
        <boxGeometry args={[0.22, 0.45, 0.06]} />
        <meshPhysicalMaterial color="#b8b8b8" metalness={1} roughness={0.2} />
      </mesh>
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={`usb-${i}`} position={[-0.72, 0.57 + i * 0.08, 0.075]}>
          <boxGeometry args={[0.08, 0.04, 0.018]} />
          <meshPhysicalMaterial color="#1a1a1a" metalness={0.3} roughness={0.5} />
        </mesh>
      ))}

      {/* Surface mount components */}
      {Array.from({ length: 18 }).map((_, i) => {
        const cx = -0.6 + (i % 9) * 0.12 + Math.sin(i * 2.3) * 0.06;
        const cy = -0.65 + Math.floor(i / 9) * 0.6 + Math.cos(i * 1.4) * 0.1;
        return (
          <mesh key={`cap-${i}`} position={[cx, cy, 0.052]}>
            <cylinderGeometry args={[0.012, 0.012, 0.025, 8]} />
            <meshPhysicalMaterial color="#222225" metalness={0.4} roughness={0.5} />
          </mesh>
        );
      })}

      {/* Power connectors */}
      <mesh position={[0.72, 0.0, 0.065]} castShadow>
        <boxGeometry args={[0.12, 0.4, 0.06]} />
        <meshPhysicalMaterial color="#e0e0e0" metalness={0} roughness={0.6} />
      </mesh>
      <mesh position={[-0.6, 0.88, 0.065]}>
        <boxGeometry args={[0.12, 0.08, 0.06]} />
        <meshPhysicalMaterial color="#e0e0e0" metalness={0} roughness={0.6} />
      </mesh>

      {/* SATA ports */}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={`sata-${i}`} position={[0.6, -0.55 - i * 0.06, 0.055]}>
          <boxGeometry args={[0.08, 0.035, 0.025]} />
          <meshPhysicalMaterial color="#0e0e10" metalness={0.2} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
};

/* ======================================================================= */
/*  Realistic GPU (MeshPhysicalMaterial, spinning fans, RGB rings)          */
/* ======================================================================= */

const GpuCard: React.FC<{
  tier: number;
  rgbMats: React.MutableRefObject<THREE.MeshPhysicalMaterial[]>;
  normalMap: THREE.Texture;
}> = ({ tier, rgbMats, normalMap }) => {
  /* ---------- dimensions scale with tier ---------- */
  const len   = 1.15 + Math.min(tier, 5) * 0.18;       // longer card
  const depth = 0.56 + Math.min(tier, 3) * 0.02;       // card depth (z)
  const pcbH  = 0.055;
  const shroudH = 0.17 + Math.min(tier, 4) * 0.018;    // thicker shroud
  const fanR  = Math.min((len - 0.12) / 6 - 0.01, 0.22); // fit 3 fans
  const fanY  = -pcbH / 2 - shroudH - 0.015;            // bottom of shroud

  /* --- fan positions (3 evenly spaced) --- */
  const fanSpacing = (len - 0.08) / 3;
  const fanXs = [
    -fanSpacing,          // left fan
    0,                    // center fan
    fanSpacing,           // right fan
  ];

  /* Subtle accent material (keep ref for potential future RGB) */
  const accentMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#0a0a10",
    emissive: new THREE.Color("#00ccff"),
    emissiveIntensity: 0.3,
    metalness: 0.1,
    roughness: 0.4,
  }), []);

  useEffect(() => {
    rgbMats.current = [accentMat];
    return () => { rgbMats.current = []; };
  }, [accentMat, rgbMats]);

  return (
    <group position={[0.05, -0.2, 0.12]}>

      {/* ============ PCB ============ */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[len, pcbH, depth]} />
        <meshPhysicalMaterial color="#141820" metalness={0.3} roughness={0.4} normalMap={normalMap} />
      </mesh>

      {/* Gold PCIe edge connector strip */}
      <mesh position={[0.06, -pcbH / 2 + 0.002, -depth / 2 + 0.015]}>
        <boxGeometry args={[len * 0.55, 0.008, 0.025]} />
        <meshPhysicalMaterial color="#c5a23e" metalness={1} roughness={0.12} />
      </mesh>

      {/* ============ SHROUD BODY ============ */}
      {/* Main shroud block – dark matte with clearcoat */}
      <mesh position={[0, -pcbH / 2 - shroudH / 2, 0]} castShadow>
        <boxGeometry args={[len - 0.03, shroudH, depth - 0.02]} />
        <meshPhysicalMaterial
          color="#1a1c22"
          metalness={0.05}
          roughness={0.55}
          clearcoat={0.5}
          clearcoatRoughness={0.2}
        />
      </mesh>

      {/* Outer shroud shell – slightly larger, framing layer */}
      <mesh position={[0, -pcbH / 2 - shroudH / 2, 0]} castShadow>
        <boxGeometry args={[len, shroudH + 0.005, depth + 0.01]} />
        <meshPhysicalMaterial color="#111318" metalness={0.1} roughness={0.6} transparent opacity={0.6} />
      </mesh>

      {/* Angular accent ridges across shroud (horizontal) */}
      {[-0.18, -0.06, 0.06, 0.18].map((z, i) => (
        <mesh key={`ridge-${i}`} position={[0, -pcbH / 2 - shroudH / 2, z]} castShadow>
          <boxGeometry args={[len - 0.05, shroudH + 0.006, 0.008]} />
          <meshPhysicalMaterial color="#26283a" metalness={0.9} roughness={0.25} />
        </mesh>
      ))}

      {/* Diagonal accent cuts on shroud (angular design like reference) */}
      {[0.25, -0.25].map((xOff, i) => (
        <mesh
          key={`diag-${i}`}
          position={[xOff * len * 0.6, -pcbH / 2 - shroudH * 0.75, depth / 2 - 0.005]}
          rotation={[0, 0, (i === 0 ? 0.3 : -0.3)]}
        >
          <boxGeometry args={[0.15, 0.025, 0.004]} />
          <meshPhysicalMaterial color="#2e3040" metalness={1} roughness={0.2} />
        </mesh>
      ))}

      {/* ============ TRIPLE FANS ============ */}
      {fanXs.map((fx, i) => (
        <group key={`gpufan-${i}`}>
          {/* Fan circular housing (dark ring frame) */}
          <mesh position={[fx, fanY, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[fanR + 0.01, 0.018, 12, 48]} />
            <meshPhysicalMaterial color="#0e0f14" metalness={0.2} roughness={0.5} />
          </mesh>

          {/* Fan hub (center circle) */}
          <mesh position={[fx, fanY - 0.005, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[fanR * 0.22, fanR * 0.22, 0.018, 24]} />
            <meshPhysicalMaterial color="#1a1c24" metalness={0.3} roughness={0.4} clearcoat={0.4} />
          </mesh>
          {/* Hub cap detail */}
          <mesh position={[fx, fanY - 0.016, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[fanR * 0.1, fanR * 0.1, 0.006, 16]} />
            <meshPhysicalMaterial color="#2a2c38" metalness={0.5} roughness={0.3} />
          </mesh>

          {/* Spinning blades */}
          <SpinningFan
            radius={fanR}
            blades={11}
            speed={i % 2 === 0 ? 11 : -11}
            position={[fx, fanY, 0]}
            axis="y"
          />

          {/* Subtle dark torus separator between fans */}
          {i < 2 && (
            <mesh position={[(fx + fanXs[i + 1]) / 2, fanY, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <boxGeometry args={[0.03, 0.01, fanR * 2 + 0.02]} />
              <meshPhysicalMaterial color="#15161e" metalness={0.1} roughness={0.6} />
            </mesh>
          )}
        </group>
      ))}

      {/* Fan bottom plate (just below blade tips) */}
      <mesh position={[0, fanY + 0.008, 0]} castShadow>
        <boxGeometry args={[len - 0.04, 0.008, depth - 0.04]} />
        <meshPhysicalMaterial color="#111318" metalness={0.15} roughness={0.5} />
      </mesh>

      {/* ============ BACKPLATE ============ */}
      <mesh position={[0, pcbH / 2 + 0.012, 0]} castShadow>
        <boxGeometry args={[len - 0.01, 0.018, depth + 0.005]} />
        <meshPhysicalMaterial color="#1e2030" metalness={1} roughness={0.3} normalMap={normalMap} />
      </mesh>
      {/* Backplate accent groove */}
      <mesh position={[0, pcbH / 2 + 0.024, 0]}>
        <boxGeometry args={[len * 0.6, 0.003, depth * 0.4]} />
        <meshPhysicalMaterial color="#282c42" metalness={1} roughness={0.2} />
      </mesh>
      {/* Backplate brand area (embossed rectangle) */}
      <mesh position={[-len * 0.15, pcbH / 2 + 0.023, 0]}>
        <boxGeometry args={[len * 0.25, 0.003, 0.12]} />
        <meshPhysicalMaterial color="#22253a" metalness={0.8} roughness={0.25} />
      </mesh>

      {/* ============ COPPER HEATPIPES ============ */}
      {[-0.1, -0.04, 0.02, 0.08].map((zz, i) => (
        <mesh key={`hp-${i}`} position={[0, -pcbH / 2 - 0.04, zz]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.013, 0.013, len - 0.1, 12]} />
          <meshPhysicalMaterial color="#d4a560" metalness={1} roughness={0.08} />
        </mesh>
      ))}

      {/* ============ PCIe BRACKET ============ */}
      {/* Main bracket plate */}
      <mesh position={[-len / 2 - 0.014, -0.04, 0]} castShadow>
        <boxGeometry args={[0.02, 0.38, depth + 0.02]} />
        <meshPhysicalMaterial color="#b8b8b8" metalness={1} roughness={0.22} />
      </mesh>
      {/* Bracket top fold */}
      <mesh position={[-len / 2 - 0.005, 0.15, 0]}>
        <boxGeometry args={[0.04, 0.015, depth + 0.02]} />
        <meshPhysicalMaterial color="#a8a8a8" metalness={1} roughness={0.25} />
      </mesh>

      {/* Display ports (HDMI + 3x DP) */}
      {[
        { z: 0.16, w: 0.065, h: 0.02, label: "HDMI" },
        { z: 0.06, w: 0.055, h: 0.018, label: "DP" },
        { z: -0.04, w: 0.055, h: 0.018, label: "DP" },
        { z: -0.14, w: 0.055, h: 0.018, label: "DP" },
      ].map((port, i) => (
        <group key={`port-${i}`}>
          {/* Port housing */}
          <mesh position={[-len / 2 - 0.028, -0.06, port.z]}>
            <boxGeometry args={[0.016, port.h, port.w]} />
            <meshPhysicalMaterial color="#0a0a0e" metalness={0.3} roughness={0.5} />
          </mesh>
          {/* Port inner (gold contact) */}
          <mesh position={[-len / 2 - 0.034, -0.06, port.z]}>
            <boxGeometry args={[0.004, port.h * 0.6, port.w * 0.7]} />
            <meshPhysicalMaterial color="#b8952e" metalness={1} roughness={0.15} />
          </mesh>
        </group>
      ))}

      {/* Vent slots in bracket */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`vent-${i}`} position={[-len / 2 - 0.028, -0.14 - i * 0.025, 0]}>
          <boxGeometry args={[0.012, 0.008, depth * 0.55]} />
          <meshPhysicalMaterial color="#1a1a1e" metalness={0.2} roughness={0.6} />
        </mesh>
      ))}

      {/* ============ POWER CONNECTORS ============ */}
      {/* 8-pin + 8-pin (or 12-pin for high tier) */}
      {[0.12, -0.02].map((z, i) => (
        <group key={`pwr-${i}`}>
          <mesh position={[len / 2 - 0.2, pcbH / 2 + 0.025, z]}>
            <boxGeometry args={[0.1, 0.04, 0.08]} />
            <meshPhysicalMaterial color="#111115" metalness={0} roughness={0.65} />
          </mesh>
          {/* Pin holes */}
          {Array.from({ length: 4 }).map((_, j) => (
            <mesh key={`pin-${i}-${j}`} position={[len / 2 - 0.22 + j * 0.022, pcbH / 2 + 0.047, z]}>
              <cylinderGeometry args={[0.004, 0.004, 0.006, 8]} />
              <meshPhysicalMaterial color="#c5a23e" metalness={1} roughness={0.15} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ============ SIDE SHROUD ENDCAP VENTS ============ */}
      <mesh position={[len / 2 - 0.01, -pcbH / 2 - shroudH / 2, 0]} castShadow>
        <boxGeometry args={[0.025, shroudH * 0.8, depth * 0.6]} />
        <meshPhysicalMaterial color="#18192a" metalness={0.2} roughness={0.5} />
      </mesh>
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={`sv-${i}`} position={[len / 2, -pcbH / 2 - shroudH * 0.3 - i * (shroudH * 0.15), 0]}>
          <boxGeometry args={[0.008, 0.01, depth * 0.45]} />
          <meshPhysicalMaterial color="#0e0e14" metalness={0.1} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
};

/* ======================================================================= */
/*  CPU (MeshPhysicalMaterial)                                              */
/* ======================================================================= */

const CpuChip: React.FC = () => (
  <group position={[-0.15, 0.25, -0.78]}>
    {/* IHS - polished nickel */}
    <mesh castShadow receiveShadow>
      <boxGeometry args={[0.38, 0.38, 0.05]} />
      <meshPhysicalMaterial color="#c0c0c0" metalness={1} roughness={0.12} clearcoat={0.8} clearcoatRoughness={0.05} />
    </mesh>
    {/* Text/marking area */}
    <mesh position={[0, 0, 0.028]}>
      <boxGeometry args={[0.28, 0.2, 0.002]} />
      <meshPhysicalMaterial color="#a5a5a5" metalness={1} roughness={0.18} />
    </mesh>
    {/* Substrate */}
    <mesh position={[0, 0, -0.035]} castShadow>
      <boxGeometry args={[0.42, 0.42, 0.02]} />
      <meshPhysicalMaterial color="#1a5028" metalness={0.15} roughness={0.6} />
    </mesh>
    {/* Contact pads (gold) */}
    <mesh position={[0, 0, -0.048]}>
      <boxGeometry args={[0.36, 0.36, 0.004]} />
      <meshPhysicalMaterial color="#d4a560" metalness={1} roughness={0.08} />
    </mesh>
  </group>
);

/* ======================================================================= */
/*  RAM Stick (MeshPhysicalMaterial, RGB strip with breathing)              */
/* ======================================================================= */

const RamStick: React.FC<{ x: number; rgbColor: THREE.Color }> = ({ x, rgbColor }) => (
  <group position={[x, 0.25, -0.82]}>
    {/* PCB */}
    <mesh castShadow>
      <boxGeometry args={[0.04, 0.85, 0.06]} />
      <meshPhysicalMaterial color="#1a4a28" metalness={0.15} roughness={0.55} />
    </mesh>
    {/* Heatspreader front */}
    <mesh position={[0, 0.03, 0.032]}>
      <boxGeometry args={[0.042, 0.8, 0.004]} />
      <meshPhysicalMaterial color="#2e2e38" metalness={1} roughness={0.25} clearcoat={0.4} clearcoatRoughness={0.1} />
    </mesh>
    {/* Heatspreader back */}
    <mesh position={[0, 0.03, -0.032]}>
      <boxGeometry args={[0.042, 0.8, 0.004]} />
      <meshPhysicalMaterial color="#2e2e38" metalness={1} roughness={0.25} clearcoat={0.4} clearcoatRoughness={0.1} />
    </mesh>
    {/* Top fin */}
    <mesh position={[0, 0.46, 0]}>
      <boxGeometry args={[0.042, 0.04, 0.068]} />
      <meshPhysicalMaterial color="#222230" metalness={1} roughness={0.2} clearcoat={0.5} />
    </mesh>
    {/* RGB light strip - subtle, bloom handles spill */}
    <mesh position={[0, 0.49, 0]}>
      <boxGeometry args={[0.036, 0.012, 0.062]} />
      <meshPhysicalMaterial
        color="#080810"
        emissive={rgbColor}
        emissiveIntensity={1.0}
        metalness={0}
        roughness={0.4}
        transparent
        opacity={0.95}
      />
    </mesh>
    {/* DRAM chips */}
    {Array.from({ length: 8 }).map((_, i) => (
      <mesh key={i} position={[0.022, -0.3 + i * 0.085, 0.025]}>
        <boxGeometry args={[0.003, 0.055, 0.032]} />
        <meshPhysicalMaterial color="#111114" metalness={0.3} roughness={0.5} />
      </mesh>
    ))}
  </group>
);

/* ======================================================================= */
/*  NVMe SSD (MeshPhysicalMaterial, metallic surface + label)               */
/* ======================================================================= */

const NvmeDrive: React.FC<{ pos: [number, number, number] }> = ({ pos }) => (
  <group position={pos}>
    <mesh castShadow>
      <boxGeometry args={[0.45, 0.03, 0.09]} />
      <meshPhysicalMaterial color="#0f6a35" metalness={0.15} roughness={0.55} />
    </mesh>
    {/* Controller */}
    <mesh position={[-0.1, 0.018, 0]}>
      <boxGeometry args={[0.08, 0.008, 0.06]} />
      <meshPhysicalMaterial color="#141418" metalness={0.5} roughness={0.35} />
    </mesh>
    {/* NAND packages */}
    {[0.05, 0.14].map((xo, i) => (
      <mesh key={i} position={[xo, 0.018, 0]}>
        <boxGeometry args={[0.065, 0.006, 0.06]} />
        <meshPhysicalMaterial color="#1a1a1e" metalness={0.3} roughness={0.5} />
      </mesh>
    ))}
    {/* Label/heatsink cover (metallic) */}
    <mesh position={[0.05, 0.022, 0]}>
      <boxGeometry args={[0.38, 0.003, 0.075]} />
      <meshPhysicalMaterial color="#2a2a35" metalness={1} roughness={0.3} clearcoat={0.3} />
    </mesh>
    {/* M.2 connector (gold) */}
    <mesh position={[-0.225, 0, 0]}>
      <boxGeometry args={[0.02, 0.032, 0.08]} />
      <meshPhysicalMaterial color="#d4a560" metalness={1} roughness={0.08} />
    </mesh>
  </group>
);

/* ======================================================================= */
/*  Tower Air Cooler (spinning fan, breathing RGB, copper pipes)            */
/* ======================================================================= */

const TowerCooler: React.FC<{ tier: number }> = ({ tier }) => {
  const finCount = 22 + Math.min(tier, 5) * 5;
  const towerH = 0.55 + Math.min(tier, 5) * 0.04;
  return (
    <group position={[-0.15, 0.25, -0.78]}>
      {/* Copper base */}
      <mesh position={[0, 0, 0.06]} castShadow>
        <boxGeometry args={[0.32, 0.32, 0.04]} />
        <meshPhysicalMaterial color="#d4a560" metalness={1} roughness={0.06} clearcoat={0.4} />
      </mesh>

      {/* Heatpipes */}
      {[-0.06, -0.02, 0.02, 0.06].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0, 0.06 + towerH / 2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.018, 0.018, towerH, 16]} />
            <meshPhysicalMaterial color="#d4a560" metalness={1} roughness={0.06} />
          </mesh>
          <mesh position={[x, 0, 0.06 + towerH]}>
            <sphereGeometry args={[0.018, 16, 16]} />
            <meshPhysicalMaterial color="#d4a560" metalness={1} roughness={0.06} />
          </mesh>
        </group>
      ))}

      {/* Aluminium fin stack */}
      {Array.from({ length: finCount }).map((_, i) => (
        <mesh key={i} position={[0, 0, 0.12 + (i / finCount) * (towerH - 0.08)]}>
          <boxGeometry args={[0.48, 0.45, 0.006]} />
          <meshPhysicalMaterial color="#a0a0a8" metalness={1} roughness={0.3} />
        </mesh>
      ))}

      {/* Top plate */}
      <mesh position={[0, 0, 0.06 + towerH + 0.01]} castShadow>
        <boxGeometry args={[0.5, 0.47, 0.012]} />
        <meshPhysicalMaterial color="#222230" metalness={1} roughness={0.3} clearcoat={0.5} />
      </mesh>

      {/* 120mm fan shell */}
      <group position={[0, 0.28, 0.06 + towerH / 2]}>
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.035, towerH - 0.05]} />
          <meshPhysicalMaterial color="#141420" metalness={0} roughness={0.6} />
        </mesh>
        {/* Spinning fan blades */}
        <SpinningFan
          radius={0.21}
          blades={9}
          speed={15}
          position={[0, 0.02, 0]}
          axis="y"
          color="#1e1e28"
        />
        {/* RGB ring on fan */}
        <RgbGlowRing radius={0.22} position={[0, 0.025, 0]} baseColor="#00ccff" intensityBase={1.2} />
      </group>
    </group>
  );
};

/* ======================================================================= */
/*  AIO Cooler (pump head RGB, spinning radiator fans)                      */
/* ======================================================================= */

const AioCooler: React.FC<{ tier: number }> = ({ tier }) => {
  const fanSlots = tier <= 4 ? 1 : tier <= 5 ? 2 : 3;
  const radW = fanSlots * 0.5;
  return (
    <group position={[-0.15, 0.25, -0.78]}>
      {/* Pump head body */}
      <mesh position={[0, 0, 0.08]} castShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.08, 32]} />
        <meshPhysicalMaterial color="#141420" metalness={0} roughness={0.5} clearcoat={0.8} clearcoatRoughness={0.1} />
      </mesh>
      {/* Pump head top - RGB */}
      <mesh position={[0, 0, 0.13]}>
        <cylinderGeometry args={[0.12, 0.12, 0.015, 32]} />
        <meshPhysicalMaterial
          color="#0a0a12"
          emissive={new THREE.Color("#00ccff")}
          emissiveIntensity={1.0}
          metalness={0.1}
          roughness={0.4}
        />
      </mesh>
      <RgbGlowRing radius={0.1} position={[0, 0, 0.14]} baseColor="#00ccff" />

      {/* Tubes */}
      {[-0.07, 0.07].map((x, i) => (
        <mesh key={i} position={[x, 0.7, 0.08]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 1.0, 16]} />
          <meshPhysicalMaterial color="#0e0e14" metalness={0} roughness={0.65} />
        </mesh>
      ))}

      {/* Radiator */}
      <group position={[0, 1.45, 0.08]}>
        <mesh castShadow>
          <boxGeometry args={[radW, 0.08, 0.5]} />
          <meshPhysicalMaterial color="#141420" metalness={1} roughness={0.35} />
        </mesh>
        {Array.from({ length: Math.floor(radW * 40) }).map((_, i) => (
          <mesh key={i} position={[-radW / 2 + 0.025 + i * 0.025, 0, 0]}>
            <boxGeometry args={[0.003, 0.07, 0.48]} />
            <meshPhysicalMaterial color="#222230" metalness={1} roughness={0.4} />
          </mesh>
        ))}
        {/* Spinning fans */}
        {Array.from({ length: fanSlots }).map((_, i) => (
          <group key={i} position={[-radW / 2 + 0.25 + i * 0.5, -0.065, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.48, 0.035, 0.48]} />
              <meshPhysicalMaterial color="#141420" metalness={0} roughness={0.6} />
            </mesh>
            <SpinningFan radius={0.2} blades={9} speed={10} position={[0, -0.02, 0]} axis="y" />
            <RgbGlowRing radius={0.2} position={[0, -0.025, 0]} baseColor="#00ccff" />
          </group>
        ))}
      </group>
    </group>
  );
};

/* ======================================================================= */
/*  Realistic PC Case (MeshPhysicalMaterial glass, steel, mesh panels)      */
/* ======================================================================= */

const PcCase: React.FC<{
  tier: number;
  glassMat: THREE.MeshPhysicalMaterial;
  fanCount: number;
  rgbStripRef: React.MutableRefObject<THREE.MeshPhysicalMaterial | null>;
}> = ({ tier, glassMat, fanCount, rgbStripRef }) => {
  const W = 2.45, H = 3.95, D = 1.8 + Math.min(tier, 4) * 0.12;

  const rgbMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#080810",
    emissive: new THREE.Color("#00ccff"),
    emissiveIntensity: 1.5,
    metalness: 0,
    roughness: 0.4,
    transparent: true,
    opacity: 0.95,
  }), []);

  useEffect(() => {
    rgbStripRef.current = rgbMat;
    return () => { rgbStripRef.current = null; };
  }, [rgbMat, rgbStripRef]);

  return (
    <group>
      {/* Back panel */}
      <mesh position={[-W / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.04, H, D]} />
        <meshPhysicalMaterial color="#1a1c22" metalness={1} roughness={0.35} />
      </mesh>

      {/* Right side panel */}
      <mesh position={[0, 0, -D / 2]} castShadow receiveShadow>
        <boxGeometry args={[W, H, 0.04]} />
        <meshPhysicalMaterial color="#1c1e26" metalness={1} roughness={0.35} />
      </mesh>

      {/* Top panel */}
      <mesh position={[0, H / 2, 0]} castShadow>
        <boxGeometry args={[W, 0.04, D]} />
        <meshPhysicalMaterial color="#1c1e26" metalness={1} roughness={0.35} />
      </mesh>
      {/* Top mesh vents */}
      {Array.from({ length: 14 }).map((_, i) => (
        <mesh key={`tmesh-${i}`} position={[-0.85 + i * 0.12, H / 2 + 0.004, 0]}>
          <boxGeometry args={[0.05, 0.006, D * 0.65]} />
          <meshPhysicalMaterial color="#252830" metalness={1} roughness={0.4} />
        </mesh>
      ))}

      {/* Bottom panel */}
      <mesh position={[0, -H / 2, 0]} castShadow>
        <boxGeometry args={[W, 0.04, D]} />
        <meshPhysicalMaterial color="#121418" metalness={1} roughness={0.35} />
      </mesh>
      {/* Rubber feet */}
      {[[-0.85, -0.035, -0.55], [0.85, -0.035, -0.55], [-0.85, -0.035, 0.55], [0.85, -0.035, 0.55]].map((p, i) => (
        <mesh key={`ft-${i}`} position={[p[0], -H / 2 + p[1], p[2]]}>
          <cylinderGeometry args={[0.06, 0.07, 0.04, 16]} />
          <meshPhysicalMaterial color="#050508" metalness={0} roughness={0.85} />
        </mesh>
      ))}

      {/* PSU shroud */}
      <mesh position={[0, -1.4, 0.15]}>
        <boxGeometry args={[2.3, 0.06, D - 0.3]} />
        <meshPhysicalMaterial color="#151820" metalness={0} roughness={0.6} />
      </mesh>
      <mesh position={[-0.5, -1.7, 0.2]} castShadow>
        <boxGeometry args={[0.65, 0.5, 0.58]} />
        <meshPhysicalMaterial color="#0e0e12" metalness={0} roughness={0.55} />
      </mesh>

      {/* Front panel – open mesh so rainbow fans are fully visible */}
      {/* Top solid section above fans */}
      <mesh position={[0, H / 2 - 0.2, D / 2]} castShadow>
        <boxGeometry args={[W, 0.35, 0.02]} />
        <meshPhysicalMaterial color="#0e1018" metalness={1} roughness={0.45} />
      </mesh>
      {/* Bottom solid section below fans */}
      <mesh position={[0, -H / 2 + 0.3, D / 2]} castShadow>
        <boxGeometry args={[W, 0.55, 0.02]} />
        <meshPhysicalMaterial color="#0e1018" metalness={1} roughness={0.45} />
      </mesh>
      {/* Left / right vertical frame strips beside fans */}
      {[-0.88, 0.88].map((x, idx) => (
        <mesh key={`fside-${idx}`} position={[x, 0.3, D / 2]}>
          <boxGeometry args={[0.65, 2.6, 0.02]} />
          <meshPhysicalMaterial color="#0e1018" metalness={1} roughness={0.45} />
        </mesh>
      ))}
      {/* Ultra-thin mesh overlay so fans peek through */}
      <mesh position={[0, 0.3, D / 2 + 0.005]}>
        <boxGeometry args={[1.15, 2.4, 0.003]} />
        <meshPhysicalMaterial color="#0e1018" metalness={0.5} roughness={0.5} transparent opacity={0.15} />
      </mesh>
      {/* Power button */}
      <mesh position={[0.6, 1.6, D / 2 + 0.012]}>
        <cylinderGeometry args={[0.028, 0.028, 0.01, 24]} />
        <meshPhysicalMaterial color="#404050" metalness={1} roughness={0.3} />
      </mesh>

      {/* TEMPERED GLASS - physically correct glass */}
      <mesh position={[W / 2 - 0.008, 0, 0.05]} material={glassMat} castShadow receiveShadow>
        <boxGeometry args={[0.04, H - 0.08, D - 0.1]} />
      </mesh>

      {/* Frame edges around glass */}
      {[[W / 2 - 0.008, 0, D / 2 - 0.06], [W / 2 - 0.008, 0, -D / 2 + 0.06]].map((p, i) => (
        <mesh key={`ve-${i}`} position={p as [number, number, number]} castShadow>
          <boxGeometry args={[0.045, H, 0.045]} />
          <meshPhysicalMaterial color="#222830" metalness={1} roughness={0.2} />
        </mesh>
      ))}
      {[[W / 2 - 0.008, H / 2 - 0.02, 0.05], [W / 2 - 0.008, -H / 2 + 0.02, 0.05]].map((p, i) => (
        <mesh key={`he-${i}`} position={p as [number, number, number]} castShadow>
          <boxGeometry args={[0.045, 0.045, D - 0.2]} />
          <meshPhysicalMaterial color="#222830" metalness={1} roughness={0.2} />
        </mesh>
      ))}

      {/* RGB strip along glass edge - cyan breathing */}
      <mesh position={[W / 2 + 0.003, 0, D / 2 - 0.08]} material={rgbMat}>
        <boxGeometry args={[0.012, H - 0.15, 0.012]} />
      </mesh>
      {/* Second RGB strip along bottom glass edge */}
      <mesh position={[W / 2 + 0.003, -H / 2 + 0.04, 0]} material={rgbMat}>
        <boxGeometry args={[0.012, 0.012, D - 0.25]} />
      </mesh>

      {/* === FRONT INTAKE FANS (3x, large rainbow RGB ring fans) === */}
      {Array.from({ length: 3 }).map((_, i) => (
        <group key={`frontfan-${i}`} position={[0, 1.05 - i * 0.75, D / 2 - 0.025]}>
          {/* Fan square frame (dark plastic) */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <boxGeometry args={[0.7, 0.04, 0.7]} />
            <meshPhysicalMaterial color="#0e1018" metalness={0} roughness={0.6} />
          </mesh>
          {/* Fan inner housing (cylinder) */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.32, 0.32, 0.035, 32]} />
            <meshPhysicalMaterial color="#0a0c12" metalness={0} roughness={0.55} />
          </mesh>
          {/* Spinning blades – larger, visible inside the ring */}
          <SpinningFan radius={0.25} blades={9} speed={i % 2 === 0 ? 10 : -10} position={[0, 0, 0]} axis="z" />
          {/* THICK RAINBOW RGB RING – the main visual like the reference */}
          <RainbowFanRing
            radius={0.3}
            tubeRadius={0.04}
            position={[0, 0.022, 0]}
            rotationAxis="z"
            speed={0.3 + i * 0.1}
          />
        </group>
      ))}

      {/* Rear exhaust fans (spinning + rainbow RGB rings) */}
      {Array.from({ length: Math.min(fanCount, 2) }).map((_, i) => (
        <group key={`rearfan-${i}`} position={[-W / 2 - 0.005, 0.5 - i * 0.55, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.24, 0.24, 0.015, 32]} />
            <meshPhysicalMaterial color="#0e1018" metalness={0} roughness={0.6} />
          </mesh>
          <SpinningFan radius={0.18} blades={7} speed={8} position={[0, 0, 0]} axis="x" />
          {/* Rainbow ring on rear fan */}
          <RainbowFanRing
            radius={0.21}
            tubeRadius={0.03}
            position={[0, 0, 0]}
            rotationAxis="x"
            speed={0.25}
          />
        </group>
      ))}

      {/* Rear I/O cutout + PCIe slot covers */}
      <mesh position={[-W / 2 - 0.005, 1.4, -0.35]}>
        <boxGeometry args={[0.018, 0.5, 0.3]} />
        <meshPhysicalMaterial color="#222830" metalness={1} roughness={0.35} />
      </mesh>
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={`pcie-${i}`} position={[-W / 2 - 0.005, 0.8 - i * 0.15, -0.1]}>
          <boxGeometry args={[0.018, 0.1, 0.018]} />
          <meshPhysicalMaterial color="#303040" metalness={1} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
};

/* ======================================================================= */
/*  Reflective Ground Plane                                                 */
/* ======================================================================= */

const GroundPlane: React.FC = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.05, 0]} receiveShadow>
    <circleGeometry args={[10, 48]} />
    <meshStandardMaterial
      color="#060810"
      metalness={0.6}
      roughness={0.12}
      envMapIntensity={0.25}
    />
  </mesh>
);

/* ======================================================================= */
/*  Main PC Tower Assembly                                                  */
/* ======================================================================= */

const CustomPcTower: React.FC<{ config: BuildPreviewConfig }> = ({ config }) => {
  const groupRef = useRef<THREE.Group>(null);
  const gpuRgbMats = useRef<THREE.MeshPhysicalMaterial[]>([]);
  const caseRgbStripRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const ramRgbColor = useMemo(() => new THREE.Color("#00ccff"), []);

  const fanCount = getFanCount(config.coolingTier);
  const ramStickCount = getRamStickCount(config.ramTier);
  const storageCount = getStorageCount(config.storageTier);

  const pcbTex = useMemo(makePCBTexture, []);
  const normalMap = useMemo(makeNormalMap, []);
  const roughnessMap = useMemo(makeRoughnessMap, []);

  /* Tempered glass - physically correct */
  const glassMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xe8eef5).multiplyScalar(0.95),
    metalness: 0,
    roughness: 0.05,
    transmission: 1,
    thickness: 0.5,
    transparent: true,
    opacity: 1,
    side: THREE.DoubleSide,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    envMapIntensity: 1.5,
    ior: 1.5,
  }), []);

  useEffect(() => {
    return () => {
      glassMat.dispose();
      pcbTex.dispose();
      normalMap.dispose();
      roughnessMap.dispose();
    };
  }, [glassMat, pcbTex, normalMap, roughnessMap]);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;

    // Very slow showroom rotation
    groupRef.current.rotation.y += delta * 0.1;

    const t = clock.elapsedTime;

    // GPU RGB breathing: fixed cyan, intensity pulsing only
    const gpuIntensity = 1.2 + Math.sin(t) * 0.35;
    for (const mat of gpuRgbMats.current) {
      mat.emissiveIntensity = gpuIntensity;
    }

    // RAM RGB breathing – fixed cyan, intensity only
    // (ramRgbColor is constant #00ccff, no mutation needed)

    // Case RGB strip breathing – fixed cyan
    if (caseRgbStripRef.current) {
      caseRgbStripRef.current.emissiveIntensity = 1.5 + Math.sin(t * 1.2) * 0.4;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.05, 0]}>
      {/* Interior fill lights – cyan tinted to match RGB theme */}
      <pointLight position={[0.5, 0.5, 0.5]} intensity={0.8} color="#00ccff" distance={5} decay={2} />
      <pointLight position={[-0.5, -0.3, -0.2]} intensity={0.4} color="#00aadd" distance={4} decay={2} />
      <pointLight position={[0, -1.0, 0.5]} intensity={0.3} color="#00ccff" distance={3} decay={2} />

      {config.caseTier > 0 && (
        <PcCase tier={config.caseTier} glassMat={glassMat} fanCount={fanCount} rgbStripRef={caseRgbStripRef} />
      )}

      {config.motherboardTier > 0 && (
        <Motherboard pcbTex={pcbTex} normalMap={normalMap} roughnessMap={roughnessMap} />
      )}

      {config.gpuTier > 0 && (
        <GpuCard tier={config.gpuTier} rgbMats={gpuRgbMats} normalMap={normalMap} />
      )}

      {config.cpuTier > 0 && <CpuChip />}

      {config.coolingTier > 0 && (
        isTowerCooler(config.labels.cooling) || config.coolingTier <= 3
          ? <TowerCooler tier={config.coolingTier} />
          : <AioCooler tier={config.coolingTier} />
      )}

      {Array.from({ length: ramStickCount }).map((_, i) => (
        <RamStick key={i} x={0.35 + i * 0.07} rgbColor={ramRgbColor} />
      ))}

      {Array.from({ length: storageCount }).map((_, i) => (
        <NvmeDrive key={i} pos={[0.65, -1.0 + i * 0.2, -0.7]} />
      ))}

      {/* Decorative cable */}
      {config.gpuTier > 0 && (
        <mesh position={[0.55, -0.08, -0.25]} rotation={[0.2, 0, 0.1]}>
          <cylinderGeometry args={[0.012, 0.012, 0.75, 8]} />
          <meshPhysicalMaterial color="#0e0e12" metalness={0} roughness={0.7} />
        </mesh>
      )}
    </group>
  );
};

/* ======================================================================= */
/*  PcPreview3D Dialog                                                      */
/* ======================================================================= */

const PcPreview3D: React.FC<PcPreview3DProps> = ({ open, onClose, totalLabel, config }) => {
  const selectedSummary = Object.entries(config.labels);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-4xl border-border bg-card">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">3D Build Preview</DialogTitle>
          <DialogDescription>Interactive showroom render of your custom PC build.</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border bg-secondary/20 p-4">
          <div className="h-[480px] w-full overflow-hidden rounded-lg border border-primary/20 bg-gradient-to-b from-zinc-900/60 via-zinc-950/80 to-black/95">
            <Canvas
              shadows
              dpr={[1, 1.5]}
              camera={{ position: [4.5, 2.2, 5.0], fov: 36 }}
              performance={{ min: 0.5 }}
              gl={{
                antialias: true,
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 0.85,
                outputColorSpace: THREE.SRGBColorSpace,
                powerPreference: "high-performance",
              }}
              onCreated={({ gl }) => {
                gl.shadowMap.enabled = true;
                gl.shadowMap.type = THREE.PCFSoftShadowMap;
              }}
            >
              {/* LIGHTING: Showroom studio setup */}

              {/* Very low ambient – dark moody scene, RGB is main interior light */}
              <ambientLight intensity={0.06} color="#a0b0c0" />

              {/* Key light – softer, cooler to keep scene dark/moody */}
              <directionalLight
                castShadow
                position={[5, 8, 4]}
                intensity={1.6}
                color="#e0eaff"
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
                shadow-bias={-0.0002}
                shadow-normalBias={0.02}
                shadow-radius={4}
              >
                <orthographicCamera attach="shadow-camera" args={[-6, 6, 6, -6, 0.1, 25]} />
              </directionalLight>

              {/* Rim light – subtle cool edge highlight */}
              <directionalLight
                position={[-4, 5, -6]}
                intensity={0.8}
                color="#6090cc"
              />

              {/* Very faint fill from below */}
              <directionalLight position={[2, -3, 3]} intensity={0.1} color="#405060" />

              {/* Studio HDRI environment */}
              <Environment preset="studio" background={false} />

              {/* SCENE */}
              <CustomPcTower config={config} />

              {/* Reflective ground plane */}
              <GroundPlane />

              {/* Contact shadows for soft shadow under PC */}
              <ContactShadows
                position={[0, -2.04, 0]}
                opacity={0.5}
                scale={10}
                blur={2}
                far={4}
                resolution={256}
                color="#000000"
              />

              {/* Adaptive DPR – lowers resolution while interacting for smooth FPS */}
              <AdaptiveDpr pixelated />

              {/* Orbit controls – smooth, easy to use, centered on PC */}
              <OrbitControls
                makeDefault
                target={[0, 0, 0]}
                enablePan={false}
                enableDamping
                dampingFactor={0.08}
                rotateSpeed={0.6}
                zoomSpeed={0.7}
                minDistance={4.5}
                maxDistance={10}
                minPolarAngle={0.4}
                maxPolarAngle={Math.PI / 2.15}
                minAzimuthAngle={-Math.PI}
                maxAzimuthAngle={Math.PI}
                autoRotate={false}
                touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }}
              />

              {/* POSTPROCESSING – lightweight for performance */}
              <EffectComposer multisampling={2}>
                {/* Bloom – cyan RGB glow */}
                <Bloom
                  intensity={0.7}
                  luminanceThreshold={0.2}
                  luminanceSmoothing={0.5}
                  mipmapBlur
                />
                {/* Vignette – dramatic edges */}
                <Vignette
                  offset={0.25}
                  darkness={0.7}
                />
              </EffectComposer>
            </Canvas>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {selectedSummary.map(([part, label]) => (
              <p key={part} className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{part.toUpperCase()}:</span> {label}
              </p>
            ))}
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Estimated build total: <span className="font-semibold text-primary">{totalLabel}</span>
          </p>
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PcPreview3D;
