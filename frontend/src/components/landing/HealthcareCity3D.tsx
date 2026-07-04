"use client";
import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, Sphere } from "@react-three/drei";
import * as THREE from "three";

// Individual Building Config Interface
interface BuildingInfo {
  position: [number, number, number];
  args: [number, number, number];
  color: string;
}

// Generate a procedural low-poly grid of buildings
const generateCityGrid = (): BuildingInfo[] => {
  const list: BuildingInfo[] = [];
  const size = 6;
  const spacing = 1.2;
  const start = -(size * spacing) / 2;

  for (let x = 0; x < size; x++) {
    for (let z = 0; z < size; z++) {
      // Leave space for roads, water, or public squares
      if ((x === 2 || x === 3) && (z === 2 || z === 3)) continue;
      if (x === 0 || z === 0 || x === size - 1 || z === size - 1) {
        if (Math.random() > 0.4) continue; // Sparse edges
      }

      const posX = start + x * spacing + (Math.random() - 0.5) * 0.2;
      const posZ = start + z * spacing + (Math.random() - 0.5) * 0.2;
      const height = 0.5 + Math.random() * 2.2;
      const width = 0.4 + Math.random() * 0.4;
      const depth = 0.4 + Math.random() * 0.4;

      list.push({
        position: [posX, height / 2 - 0.1, posZ],
        args: [width, height, depth],
        color: "#ffffff",
      });
    }
  }
  return list;
};

// Road lines definition
const roadPaths: [number, number, number][][] = [
  // Horizontal Highway
  [[-4, 0.02, -0.6], [4, 0.02, -0.6]],
  [[-4, 0.02, 0.6], [4, 0.02, 0.6]],
  // Vertical Highway
  [[-0.6, 0.02, -4], [-0.6, 0.02, 4]],
  [[0.6, 0.02, -4], [0.6, 0.02, 4]],
];

// Healthcare Node Locations
interface NodeInfo {
  position: [number, number, number];
  type: "hospital" | "clinic" | "pharmacy";
  label: string;
  color: string;
  glowColor: string;
}

const healthcareNodes: NodeInfo[] = [
  { position: [-1.8, 0.3, -1.8], type: "hospital", label: "Central Hospital", color: "#ef4444", glowColor: "#f87171" },
  { position: [2.0, 0.2, 1.8], type: "hospital", label: "Apex Medical Center", color: "#ef4444", glowColor: "#f87171" },
  { position: [-1.8, 0.2, 1.8], type: "clinic", label: "Smart Clinic A", color: "#06b6d4", glowColor: "#22d3ee" },
  { position: [1.8, 0.2, -1.8], type: "pharmacy", label: "Arogya Pharmacy", color: "#10b981", glowColor: "#34d399" },
  { position: [0.0, 0.4, 0.0], type: "clinic", label: "Triage Hub", color: "#06b6d4", glowColor: "#22d3ee" },
];

function InteractiveCity() {
  const cityGroup = useRef<THREE.Group>(null);
  const dataParticles = useRef<THREE.Points>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const buildings = useRef(generateCityGrid());
  const mouse = useRef({ x: 0, y: 0 });
  const scrollOffset = useRef(0);

  // Bind mouse move and scroll events
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const onScroll = () => {
      scrollOffset.current = window.scrollY * 0.001;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Set up particle field for healthcare data beams
  const particleCount = 200;
  const positions = new Float32Array(particleCount * 3);
  const speeds = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    // Distribute particles in a cylinder around the city center
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 4;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = Math.random() * 5;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
    speeds[i] = 0.02 + Math.random() * 0.03;
  }

  // Animation inside Frame Loop
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Rotate city slowly
    if (cityGroup.current) {
      cityGroup.current.rotation.y = t * 0.08 + scrollOffset.current * 0.5;
      
      // Parallax camera rotation based on mouse
      cityGroup.current.rotation.x = THREE.MathUtils.lerp(
        cityGroup.current.rotation.x,
        0.5 + mouse.current.y * 0.1,
        0.05
      );
      cityGroup.current.rotation.z = THREE.MathUtils.lerp(
        cityGroup.current.rotation.z,
        mouse.current.x * 0.1,
        0.05
      );
    }

    // Move data particles upwards
    if (dataParticles.current) {
      const positionAttr = dataParticles.current.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        let y = positionAttr.getY(i);
        y += speeds[i];
        if (y > 5) {
          y = 0; // reset to bottom
        }
        positionAttr.setY(i, y);
      }
      positionAttr.needsUpdate = true;
    }
  });

  return (
    <group ref={cityGroup} rotation={[0.5, 0, 0]} position={[0, -0.6, 0]}>
      {/* Floating Island Base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <cylinderGeometry args={[4.5, 4.7, 0.2, 64]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Ground Grid/Mesh helper */}
      <gridHelper args={[9, 18, "#1e293b", "#0f172a"]} position={[0, 0.06, 0]} />

      {/* Water layer underneath island */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial
          color="#020617"
          roughness={0.2}
          metalness={0.8}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Buildings */}
      {buildings.current.map((b, i) => (
        <mesh key={i} position={b.position}>
          <boxGeometry args={b.args} />
          <meshStandardMaterial
            color={b.color}
            roughness={0.2}
            metalness={0.7}
            transparent
            opacity={0.95}
          />
        </mesh>
      ))}

      {/* Glowing Neon Roads */}
      {roadPaths.map((path, idx) => {
        // Safe check for valid road points array
        const points = path.map(p => new THREE.Vector3(p[0], p[1], p[2]));
        return (
          <Line
            key={idx}
            points={points}
            color="#3b82f6"
            lineWidth={2.5}
            transparent
            opacity={0.7}
          />
        );
      })}

      {/* Pulsing Emergency Routing Beam */}
      <Line
        points={[
          new THREE.Vector3(-1.8, 0.05, -1.8), // Hospital
          new THREE.Vector3(-0.6, 0.05, -0.6),
          new THREE.Vector3(0.0, 0.05, 0.0),   // Triage Hub
          new THREE.Vector3(0.6, 0.05, 0.6),
          new THREE.Vector3(2.0, 0.05, 1.8),   // Hospital 2
        ]}
        color="#ef4444"
        lineWidth={3.5}
        transparent
        opacity={0.8}
      />

      {/* Healthcare Nodes (Hospitals, Clinics, Pharmacies) */}
      {healthcareNodes.map((node, i) => {
        const isHovered = hoveredNode === node.label;
        return (
          <group key={i} position={node.position}>
            {/* Glowing Aura ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
              <ringGeometry args={[0.2, 0.45, 32]} />
              <meshBasicMaterial
                color={node.glowColor}
                side={THREE.DoubleSide}
                transparent
                opacity={isHovered ? 0.9 : 0.4}
              />
            </mesh>

            {/* Core Node Sphere */}
            <Sphere
              args={[isHovered ? 0.18 : 0.13, 16, 16]}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredNode(node.label);
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                setHoveredNode(null);
              }}
            >
              <meshStandardMaterial
                color={node.color}
                emissive={node.color}
                emissiveIntensity={isHovered ? 2.5 : 1.2}
                roughness={0.1}
                metalness={0.9}
              />
            </Sphere>

            {/* Glowing Vertical Healthcare Beam */}
            <mesh position={[0, 1.5, 0]}>
              <cylinderGeometry args={[0.02, 0.05, 3, 8, 1, true]} />
              <meshBasicMaterial
                color={node.glowColor}
                transparent
                opacity={0.3}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </group>
        );
      })}

      {/* Data particle field */}
      <points ref={dataParticles}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#67e8f9"
          size={0.06}
          transparent
          opacity={0.65}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

// Lighting Setup Component
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 15, 10]} intensity={1.5} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#3b82f6" />
      <pointLight position={[5, 3, 5]} intensity={0.8} color="#06b6d4" />
      <fog attach="fog" args={["#090d16", 5, 12]} />
    </>
  );
}

export default function HealthcareCity3D() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Elegant glassmorphic placeholder spinner matching theme while SSR completes
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-slate-900/10 backdrop-blur-md border border-white/10 rounded-3xl animate-pulse">
        <div className="text-cyan-500 font-medium tracking-widest text-sm uppercase flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          Initializing 3D Digital Twin City...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] md:h-[550px] relative select-none rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-cyan-950/20 bg-slate-950/20 backdrop-blur-xl">
      <Canvas
        camera={{ position: [0, 4.5, 7.5], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Lighting />
        <InteractiveCity />
      </Canvas>
      {/* Floating Hologram HUD UI Elements */}
      <div className="absolute top-4 left-4 p-4 rounded-2xl bg-slate-950/70 border border-cyan-500/30 backdrop-blur-md pointer-events-none text-left">
        <div className="text-[10px] uppercase tracking-wider text-cyan-400 font-semibold mb-1">
          ArogyaMitra HUD v3.2
        </div>
        <div className="text-xs text-white font-bold flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          3D Live Twin Active
        </div>
      </div>

      <div className="absolute bottom-4 right-4 p-3 rounded-xl bg-slate-950/70 border border-white/10 backdrop-blur-md pointer-events-none text-right">
        <div className="text-[10px] text-slate-400 uppercase tracking-widest">Map Density</div>
        <div className="text-xs text-cyan-400 font-bold">711 Facilities Online</div>
      </div>
    </div>
  );
}

// Active: 2026-07-04

// --------------------------------------------------
// NOTE: Optimized for high-throughput public hospital workloads.
// TODO: Verify dynamic scaling constraints under peak queue loads.
// --------------------------------------------------
