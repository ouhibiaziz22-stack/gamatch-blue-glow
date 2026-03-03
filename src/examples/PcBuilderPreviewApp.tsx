/**
 * PcBuilderPreview – Production-ready 3D PC builder preview
 *
 * Built with React Three Fiber, @react-three/drei, and @react-three/postprocessing.
 * All parts are rendered with procedural geometry (no external GLTF files needed).
 * A commented-out model catalog shows how to swap in real GLTF assets.
 *
 * Features:
 *   • Semi-transparent glass PC case (MeshPhysicalMaterial, transmission 0.9)
 *   • Animated RGB breathing on GPU fans (sine-wave hue cycling)
 *   • Custom GLSL cooler fan with pulsing HSV color shifting
 *   • "Show Internals" toggle animates case opacity 1→0.2, fades in internals
 *   • Bloom post-processing for emissive glow
 *   • Responsive canvas with mobile-friendly orbit controls
 *   • Wireframe skeleton fallback when no parts are selected
 *   • Total cost overlay
 *
 * Usage:
 *   import App from "./PcBuilderPreviewApp";
 *   // or: import { PcBuilderPreview } from "./PcBuilderPreviewApp";
 */

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

export type PcSelections = {
  cpu?: string;
  gpu?: string;
  motherboard?: string;
  storage?: string;
  case?: string;
  cooler?: string;
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  GLTF Model Catalog (opt-in – enable when real .gltf files are available) */
/* ═══════════════════════════════════════════════════════════════════════════ */
//
// To use real GLTF models instead of procedural geometry:
//   1. Uncomment the imports and catalog below.
//   2. Place .gltf files in public/models/ matching the paths.
//   3. Replace procedural meshes with <primitive object={gltf.scene} />.
//
// import { useGLTF } from "@react-three/drei";
//
// const MODEL_CATALOG = {
//   cpu:         { "Intel Core i7 13700": "/models/cpu/intel-i7-13700.gltf" },
//   gpu:         { "NVIDIA RTX 4070":     "/models/gpu/rtx4070.gltf" },
//   motherboard: { "Gigabyte Z790":       "/models/motherboard/z790.gltf" },
//   storage:     { "2TB NVMe SSD":        "/models/storage/nvme-2tb.gltf" },
//   case:        { "Premium Tempered Glass": "/models/cases/premium-tempered-glass.gltf" },
//   cooler:      { "Air Cooler with RGB": "/models/cooler/air-cooler-rgb.gltf" },
// };
//
// // Preload every model path at module level for instant rendering
// Object.values(MODEL_CATALOG)
//   .flatMap((group) => Object.values(group))
//   .forEach((path) => useGLTF.preload(path));

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Price Table & Helpers                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

const PRICE_TABLE: Record<keyof PcSelections, Record<string, number>> = {
  cpu: {
    "Intel Core i7 13700": 380,
    "Intel Core i9 14900K": 620,
    "AMD Ryzen 7 7800X3D": 420,
  },
  gpu: {
    "NVIDIA RTX 4070": 620,
    "NVIDIA RTX 4080": 1120,
    "AMD RX 7900 XTX": 980,
  },
  motherboard: {
    "Gigabyte Z790": 420,
    "ASUS B760": 230,
    "MSI X670": 320,
  },
  storage: {
    "1TB NVMe SSD": 90,
    "2TB NVMe SSD": 165,
    "4TB NVMe SSD": 340,
  },
  case: {
    "Premium Tempered Glass": 220,
    "ATX Airflow": 145,
    "Mid Tower Basic": 65,
  },
  cooler: {
    "Air Cooler with RGB": 75,
    "AIO 240mm": 115,
    "AIO 360mm": 170,
  },
};

const computeTotalCost = (s: PcSelections): number =>
  (Object.keys(s) as Array<keyof PcSelections>).reduce(
    (sum, k) => sum + (s[k] ? (PRICE_TABLE[k]?.[s[k]!] ?? 0) : 0),
    0,
  );

/** true when the value is a non-empty, non-"None" string */
const has = (v?: string): boolean => Boolean(v && !/^none$/i.test(v));

const anySelected = (s: PcSelections): boolean =>
  has(s.cpu) || has(s.gpu) || has(s.motherboard) ||
  has(s.storage) || has(s.case) || has(s.cooler);

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Texture Factories (RGBA – compatible with Three.js ≥ r152)               */
/* ═══════════════════════════════════════════════════════════════════════════ */

const createEmissiveMap = (): THREE.DataTexture => {
  const S = 64;
  const data = new Uint8Array(S * S * 4);
  for (let i = 0; i < S * S; i++) {
    const x = i % S;
    const y = (i / S) | 0;
    const v = Math.floor(
      ((Math.sin((x / S) * Math.PI * 6) + Math.cos((y / S) * Math.PI * 4)) * 0.5 + 0.5) * 255,
    );
    data[i * 4] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  const t = new THREE.DataTexture(data, S, S, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  t.needsUpdate = true;
  return t;
};

const createNormalMap = (): THREE.DataTexture => {
  const S = 64;
  const data = new Uint8Array(S * S * 4);
  for (let i = 0; i < S * S; i++) {
    const x = i % S;
    const y = (i / S) | 0;
    data[i * 4] = 128 + Math.floor(Math.sin((x / S) * Math.PI * 12) * 18);
    data[i * 4 + 1] = 128 + Math.floor(Math.cos((y / S) * Math.PI * 12) * 18);
    data[i * 4 + 2] = 255;
    data[i * 4 + 3] = 255;
  }
  const t = new THREE.DataTexture(data, S, S, THREE.RGBAFormat);
  t.needsUpdate = true;
  return t;
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Material Factory                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */
/*  All materials are created once via useMemo and mutated in useFrame.        */
/*  This avoids React reconciliation flicker and rule-of-hooks issues.        */

function buildMaterials() {
  const emissiveMap = createEmissiveMap();
  const normalMap = createNormalMap();

  /* ── Case glass ── */
  const caseBody = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#d7e9ff"),
    opacity: 1,
    transparent: true,
    transmission: 0.9,
    roughness: 0.08,
    metalness: 0.12,
    side: THREE.DoubleSide,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  });

  const caseSide = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#d7e9ff"),
    opacity: 0.15,
    transparent: true,
    transmission: 0.95,
    roughness: 0.05,
    side: THREE.DoubleSide,
  });

  /* ── Internal-part helper (starts invisible, fades in) ── */
  const mkInt = (opts: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial =>
    new THREE.MeshStandardMaterial({ ...opts, transparent: true, opacity: 0 });

  /* ── Motherboard ── */
  const moboBoard   = mkInt({ color: "#1a5c2a", metalness: 0.65, roughness: 0.35, normalMap });
  const moboChip    = mkInt({ color: "#3a3a3a", metalness: 0.8, roughness: 0.2 });
  const moboSlot    = mkInt({ color: "#222222", metalness: 0.5, roughness: 0.4 });
  const moboSocket  = mkInt({ color: "#444444", metalness: 0.7, roughness: 0.3 });

  /* ── GPU ── */
  const gpuBoard = mkInt({
    color: "#1a1f29",
    metalness: 0.6,
    roughness: 0.35,
    emissiveMap,
    emissive: new THREE.Color("#00ff00"),
    emissiveIntensity: 1.5,
  });
  const gpuShroud    = mkInt({ color: "#0d0e12", metalness: 0.5, roughness: 0.4 });
  const gpuFan       = mkInt({ color: "#0a0a0e", emissive: new THREE.Color("#00ff00"), emissiveIntensity: 1.5 });
  const gpuConnector = mkInt({ color: "#2a2a30", metalness: 0.5, roughness: 0.5 });

  /* ── CPU ── */
  const cpuIhs = mkInt({ color: "#b8b8b8", metalness: 0.85, roughness: 0.15 });
  const cpuSub = mkInt({ color: "#1a5c2a", metalness: 0.3,  roughness: 0.6 });

  /* ── Cooler ── */
  const coolerBody = mkInt({ color: "#8c8c8c", metalness: 0.6, roughness: 0.3 });
  const coolerFin  = mkInt({ color: "#999999", metalness: 0.7, roughness: 0.25 });
  const coolerBase = mkInt({ color: "#d4a560", metalness: 0.9, roughness: 0.15 });

  /* ── Storage ── */
  const storageDrive = mkInt({ color: "#222832", metalness: 0.5, roughness: 0.35 });
  const storagePcb   = mkInt({ color: "#0f7a3f", metalness: 0.3, roughness: 0.5 });

  /* All internal materials – iterated in useFrame for opacity */
  const internals = [
    moboBoard, moboChip, moboSlot, moboSocket,
    gpuBoard, gpuShroud, gpuFan, gpuConnector,
    cpuIhs, cpuSub,
    coolerBody, coolerFin, coolerBase,
    storageDrive, storagePcb,
  ];

  /* Everything that needs GPU disposal on unmount */
  const disposables: THREE.Material[] = [caseBody, caseSide, ...internals];

  return {
    emissiveMap, normalMap,
    caseBody, caseSide,
    moboBoard, moboChip, moboSlot, moboSocket,
    gpuBoard, gpuShroud, gpuFan, gpuConnector,
    cpuIhs, cpuSub,
    coolerBody, coolerFin, coolerBase,
    storageDrive, storagePcb,
    internals, disposables,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Wireframe Skeleton (shown when nothing is selected)                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

const WireframeSkeleton: React.FC = () => (
  <group>
    <mesh>
      <boxGeometry args={[2.5, 4, 2]} />
      <meshStandardMaterial color="#4b5568" wireframe />
    </mesh>
    <mesh position={[0, 0, 1.01]}>
      <planeGeometry args={[2.1, 3.4]} />
      <meshStandardMaterial color="#546074" wireframe />
    </mesh>
    <mesh position={[0, -1.8, 0]}>
      <boxGeometry args={[2.1, 0.15, 1.6]} />
      <meshStandardMaterial color="#5a6476" wireframe />
    </mesh>
  </group>
);

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Cooler RGB Fan – Custom GLSL shader with HSV cycling                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

const COOLER_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const COOLER_FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform float hsvShift;
  uniform vec3 baseColor;

  vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
  }

  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  void main() {
    vec2 centered = vUv - 0.5;
    float ring = smoothstep(0.49, 0.35, length(centered));
    vec3 hsv = rgb2hsv(baseColor);
    hsv.x = fract(hsv.x + hsvShift * 0.5 + sin(uTime * 0.8) * 0.03);
    hsv.z = clamp(0.85 + sin(uTime * 2.4) * 0.15, 0.5, 1.0);
    vec3 rgb = hsv2rgb(hsv);
    gl_FragColor = vec4(rgb, ring * 0.85);
  }
`;

const CoolerGlowFan: React.FC = () => {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const hsvRef = useRef(0);

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    const t = clock.elapsedTime;
    hsvRef.current = Math.sin(t * 1.8) * 0.5;
    matRef.current.uniforms.uTime.value = t;
    matRef.current.uniforms.hsvShift.value = hsvRef.current;
  });

  return (
    <mesh position={[0, 0.23, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.16, 0.26, 48]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uTime:     { value: 0 },
          hsvShift:  { value: 0 },
          baseColor: { value: new THREE.Color("#00ff99") },
        }}
        vertexShader={COOLER_VERT}
        fragmentShader={COOLER_FRAG}
      />
    </mesh>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Frame edge data for the case                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

const FRAME_EDGES: { p: [number, number, number]; s: [number, number, number] }[] = [
  { p: [0,  2.02, 0],  s: [2.5, 0.06, 2] },
  { p: [0, -2.02, 0],  s: [2.5, 0.06, 2] },
  { p: [ 1.25, 0,  1], s: [0.06, 4, 0.06] },
  { p: [ 1.25, 0, -1], s: [0.06, 4, 0.06] },
  { p: [-1.25, 0,  1], s: [0.06, 4, 0.06] },
  { p: [-1.25, 0, -1], s: [0.06, 4, 0.06] },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  PcAssembly – all 3D parts, material animation, RGB breathing             */
/* ═══════════════════════════════════════════════════════════════════════════ */

type PcAssemblyProps = {
  selections: PcSelections;
  showInternals: boolean;
};

const PcAssembly: React.FC<PcAssemblyProps> = ({ selections, showInternals }) => {
  const pcGroup = useRef<THREE.Group>(null);

  /* ── Animated values ── */
  const caseOpacity = useRef(1);
  const internalsOpacity = useRef(0);

  /* ── Materials (stable across renders – mutated in useFrame) ── */
  const mats = useMemo(buildMaterials, []);

  /* ── Dispose GPU resources on unmount ── */
  useEffect(() => {
    return () => {
      mats.disposables.forEach((m) => m.dispose());
      mats.emissiveMap.dispose();
      mats.normalMap.dispose();
    };
  }, [mats]);

  const hasParts = anySelected(selections);
  const hasCase = has(selections.case);

  /* ── Per-frame animation ── */
  useFrame(({ clock }, delta) => {
    if (!pcGroup.current) return;

    // Slow auto-rotation
    pcGroup.current.rotation.y += delta * 0.22;

    // Case: animate opacity 1.0 ↔ 0.2
    const targetCase = showInternals ? 0.2 : 1.0;
    caseOpacity.current = THREE.MathUtils.damp(caseOpacity.current, targetCase, 5, delta);
    mats.caseBody.opacity = caseOpacity.current;
    mats.caseSide.opacity = caseOpacity.current * 0.15;

    // Internals: animate opacity 0 ↔ 1.0
    // When there is no case, internals are always fully visible
    const targetInt = hasCase ? (showInternals ? 1.0 : 0) : 1.0;
    internalsOpacity.current = THREE.MathUtils.damp(internalsOpacity.current, targetInt, 5, delta);
    const depthWrite = internalsOpacity.current > 0.95;
    for (const mat of mats.internals) {
      mat.opacity = internalsOpacity.current;
      mat.depthWrite = depthWrite;
    }

    // GPU RGB breathing: hue = sin(t) * 0.5 cycling through the spectrum
    const hue = (Math.sin(clock.elapsedTime * 1.7) * 0.5 + 0.5) * 0.5;
    const rgbI = 1.1 + Math.sin(clock.elapsedTime * 2.2) * 0.4;
    mats.gpuBoard.emissive.setHSL(hue, 1, 0.5);
    mats.gpuBoard.emissiveIntensity = 1.5 * rgbI;
    mats.gpuFan.emissive.setHSL(hue, 1, 0.5);
    mats.gpuFan.emissiveIntensity = 1.5 * rgbI;
  });

  return (
    <group ref={pcGroup}>
      {/* Wireframe skeleton (no selections at all) */}
      {!hasParts && <WireframeSkeleton />}

      {/* ════════════════ CASE (semi-transparent glass) ════════════════ */}
      {hasCase && (
        <group>
          {/* Glass body */}
          <mesh castShadow receiveShadow material={mats.caseBody}>
            <boxGeometry args={[2.5, 4, 2]} />
          </mesh>

          {/* Side glass panel */}
          <mesh position={[1.26, 0, 0]} material={mats.caseSide}>
            <boxGeometry args={[0.03, 3.9, 1.9]} />
          </mesh>

          {/* Back panel (opaque metal) */}
          <mesh position={[-1.24, 0, 0]} castShadow>
            <boxGeometry args={[0.04, 3.9, 1.9]} />
            <meshStandardMaterial color="#1c2028" metalness={0.7} roughness={0.3} />
          </mesh>

          {/* Metal frame edges */}
          {FRAME_EDGES.map((e, i) => (
            <mesh key={i} position={e.p} castShadow>
              <boxGeometry args={e.s} />
              <meshStandardMaterial color="#2a2f3a" metalness={0.7} roughness={0.25} />
            </mesh>
          ))}
        </group>
      )}

      {/* ════════════════ MOTHERBOARD (flat, y = 0) ════════════════ */}
      {has(selections.motherboard) && (
        <group position={[0, 0, -0.85]}>
          {/* PCB with normalMap */}
          <mesh castShadow receiveShadow material={mats.moboBoard}>
            <boxGeometry args={[1.8, 2.2, 0.08]} />
          </mesh>

          {/* Surface-mount chips */}
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh
              key={`chip-${i}`}
              position={[-0.6 + (i % 4) * 0.4, -0.8 + Math.floor(i / 4) * 1.6, 0.05]}
              material={mats.moboChip}
            >
              <boxGeometry args={[0.12, 0.08, 0.04]} />
            </mesh>
          ))}

          {/* RAM slots */}
          {[0.55, 0.65, 0.75, 0.85].map((x, i) => (
            <mesh key={`ram-${i}`} position={[x, 0.15, 0.06]} material={mats.moboSlot}>
              <boxGeometry args={[0.05, 0.8, 0.04]} />
            </mesh>
          ))}

          {/* CPU socket outline */}
          <mesh position={[0, 0.2, 0.05]} material={mats.moboSocket}>
            <boxGeometry args={[0.5, 0.5, 0.02]} />
          </mesh>
        </group>
      )}

      {/* ════════════════ GPU (bottom slot, y = -0.5) ════════════════ */}
      {has(selections.gpu) && (
        <group position={[0, -0.5, 0.2]}>
          {/* GPU PCB (emissiveMap for RGB fans) */}
          <mesh castShadow material={mats.gpuBoard}>
            <boxGeometry args={[1.6, 0.08, 0.6]} />
          </mesh>

          {/* Shroud / heatsink */}
          <mesh position={[0, -0.12, 0]} castShadow material={mats.gpuShroud}>
            <boxGeometry args={[1.5, 0.16, 0.55]} />
          </mesh>

          {/* RGB fans (×2) – hue animated in useFrame */}
          {[-0.4, 0.4].map((x, i) => (
            <mesh
              key={i}
              position={[x, -0.21, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              material={mats.gpuFan}
            >
              <cylinderGeometry args={[0.22, 0.22, 0.03, 32]} />
            </mesh>
          ))}

          {/* Power connector */}
          <mesh position={[0.88, 0.03, 0]} material={mats.gpuConnector}>
            <boxGeometry args={[0.12, 0.08, 0.15]} />
          </mesh>
        </group>
      )}

      {/* ════════════════ CPU on socket (x=0, y=0.2, z=0) ════════════════ */}
      {has(selections.cpu) && (
        <group position={[0, 0.2, 0]}>
          {/* IHS (Integrated Heat Spreader) */}
          <mesh castShadow material={mats.cpuIhs}>
            <boxGeometry args={[0.4, 0.06, 0.35]} />
          </mesh>
          {/* Substrate */}
          <mesh position={[0, -0.04, 0]} material={mats.cpuSub}>
            <boxGeometry args={[0.44, 0.02, 0.39]} />
          </mesh>
        </group>
      )}

      {/* ════════════════ COOLER (on CPU socket) ════════════════ */}
      {has(selections.cooler) && (
        <group position={[0, 0.2, 0]}>
          {/* Heatsink tower */}
          <mesh position={[0, 0.35, 0]} castShadow material={mats.coolerBody}>
            <boxGeometry args={[0.5, 0.5, 0.45]} />
          </mesh>

          {/* Aluminium fins */}
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh key={i} position={[0, 0.35, -0.2 + i * 0.08]} material={mats.coolerFin}>
              <boxGeometry args={[0.48, 0.48, 0.015]} />
            </mesh>
          ))}

          {/* Copper base plate */}
          <mesh position={[0, 0.07, 0]} material={mats.coolerBase}>
            <boxGeometry args={[0.3, 0.04, 0.3]} />
          </mesh>

          {/* RGB glow ring (custom GLSL, pulsing hsvShift) */}
          <CoolerGlowFan />
        </group>
      )}

      {/* ════════════════ STORAGE SSDs (beside GPU) ════════════════ */}
      {has(selections.storage) && (
        <>
          {/* Drive bay 1 */}
          <mesh position={[0.85, -0.65, 0.1]} castShadow material={mats.storageDrive}>
            <boxGeometry args={[0.08, 0.25, 0.55]} />
          </mesh>
          <mesh position={[0.89, -0.65, 0.1]} material={mats.storagePcb}>
            <boxGeometry args={[0.04, 0.18, 0.5]} />
          </mesh>

          {/* Drive bay 2 */}
          <mesh position={[0.85, -0.95, 0.1]} castShadow material={mats.storageDrive}>
            <boxGeometry args={[0.08, 0.25, 0.55]} />
          </mesh>
          <mesh position={[0.89, -0.95, 0.1]} material={mats.storagePcb}>
            <boxGeometry args={[0.04, 0.18, 0.5]} />
          </mesh>
        </>
      )}

      {/* ════════════════ Internal lighting ════════════════ */}
      <pointLight position={[0.5, 0.5, 0.5]}   intensity={1.5} color="#ffd84a" distance={5} />
      <pointLight position={[-0.6, -0.4, -0.3]} intensity={0.7} color="#75a7ff" distance={4} />
    </group>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  PcBuilderPreview – Canvas, controls, overlay UI                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

export type PcBuilderPreviewProps = {
  selections: PcSelections;
};

export const PcBuilderPreview: React.FC<PcBuilderPreviewProps> = ({ selections }) => {
  const [showInternals, setShowInternals] = useState(false);
  const total = useMemo(() => computeTotalCost(selections), [selections]);
  const hasCase = has(selections.case);

  return (
    <div style={styles.wrapper}>
      <div style={styles.canvasBox}>
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [6, 2.8, 6], fov: 38 }}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
        >
          <ambientLight intensity={0.45} />
          <directionalLight
            castShadow
            intensity={2}
            position={[7, 9, 5]}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-bias={-0.0001}
          />

          {/* drei studio HDR environment (studio.hdr) */}
          <Environment preset="studio" />

          <Suspense fallback={null}>
            <PcAssembly selections={selections} showInternals={showInternals} />
          </Suspense>

          {/* Ground plane */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.05, 0]} receiveShadow>
            <circleGeometry args={[10, 64]} />
            <meshStandardMaterial color="#151820" />
          </mesh>

          {/* Orbit controls – touch-friendly for mobile */}
          <OrbitControls
            enablePan={false}
            enableDamping
            dampingFactor={0.08}
            minDistance={4}
            maxDistance={10}
            minPolarAngle={0.45}
            maxPolarAngle={Math.PI / 2.05}
            touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }}
          />

          {/* Post-processing: Bloom for emissive glow (BloomPass) */}
          <EffectComposer multisampling={4}>
            <Bloom
              intensity={0.85}
              luminanceThreshold={0.2}
              luminanceSmoothing={0.35}
              mipmapBlur
            />
          </EffectComposer>
        </Canvas>

        {/* Total cost text overlay */}
        <div style={styles.overlay}>
          <h3 style={styles.title}>3D Build Preview</h3>
          <p style={styles.cost}>
            Total Cost: <strong>{total > 0 ? `${total.toLocaleString()} DT` : "—"}</strong>
          </p>
        </div>
      </div>

      {/* Show / Hide internals toggle – only relevant when a case is selected */}
      {hasCase && (
        <button
          style={styles.button}
          onClick={() => setShowInternals((v) => !v)}
          type="button"
        >
          {showInternals ? "Hide Internals" : "Show Internals"}
        </button>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Example App – copy-pasteable                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

const App: React.FC = () => {
  const selections: PcSelections = {
    cpu: "Intel Core i7 13700",
    gpu: "NVIDIA RTX 4070",
    motherboard: "Gigabyte Z790",
    storage: "2TB NVMe SSD",
    case: "Premium Tempered Glass",
    cooler: "Air Cooler with RGB",
  };

  return (
    <div style={styles.page}>
      <PcBuilderPreview selections={selections} />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Styles                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: 16,
    background: "radial-gradient(circle at 10% 0%, #2d2411, #0c0f14 45%, #0a0a0e 100%)",
    color: "#f7f7f8",
    boxSizing: "border-box",
  },
  wrapper: {
    width: "100%",
    maxWidth: 1200,
    margin: "0 auto",
  },
  canvasBox: {
    position: "relative",
    width: "100%",
    height: "clamp(420px, 70vh, 760px)",
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid rgba(255,215,64,0.35)",
    background: "linear-gradient(180deg, rgba(14,16,21,0.95), rgba(9,10,14,0.98))",
  },
  overlay: {
    position: "absolute",
    left: 16,
    bottom: 14,
    background: "rgba(7,8,11,0.68)",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,215,64,0.25)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    pointerEvents: "none",
  },
  title: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: 0.3,
  },
  cost: {
    margin: "4px 0 0 0",
    color: "#f6d437",
    fontSize: 14,
    fontWeight: 600,
  },
  button: {
    marginTop: 14,
    height: 42,
    padding: "0 20px",
    borderRadius: 10,
    border: "1px solid #f6d437",
    background: "linear-gradient(135deg, #ffd540, #f0b90d)",
    color: "#161310",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    transition: "transform 0.15s, box-shadow 0.15s",
  },
};

export default App;
