"use client";

/**
 * Heavy 3D scene — code-split via next/dynamic so the hero text/CTAs render
 * before three.js is on the wire.
 *
 * Optimisations vs. previous version:
 *  - No <Environment /> (saves ~1MB HDR fetch + env-map sampling per frame)
 *  - No drei <Text /> (saves troika-text bundle + font fetch). Wordmark moved to HTML overlay.
 *  - No OrbitControls (was effectively disabled)
 *  - No shadows (invisible at this lighting; expensive to render)
 *  - Halved geometry (sphere 64→32, ring 64→48, particles 220→120)
 *  - DPR clamped to 1.4 max
 */
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { useMemo, useRef, Suspense } from "react";
import * as THREE from "three";

function Bowl() {
  const group = useRef<THREE.Group>(null!);
  const t = useRef(0);
  useFrame((_, delta) => {
    t.current += delta;
    if (group.current) group.current.rotation.y = Math.sin(t.current * 0.3) * 0.25;
  });

  return (
    <group ref={group} position={[0, -0.3, 0]}>
      {/* Outer maroon shell (bottom hemisphere) */}
      <mesh>
        <sphereGeometry args={[1.4, 32, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial
          color="#5C1A2E"
          roughness={0.4}
          metalness={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Inner cream cavity */}
      <mesh position={[0, -0.005, 0]}>
        <sphereGeometry args={[1.32, 32, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial color="#F5F0DC" roughness={0.6} side={THREE.BackSide} />
      </mesh>
      {/* Broth surface */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.28, 48]} />
        <meshStandardMaterial
          color="#3D0E1D"
          roughness={0.2}
          metalness={0.25}
          emissive="#5C1A2E"
          emissiveIntensity={0.18}
        />
      </mesh>
      {/* Tan rim */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.3, 1.42, 48]} />
        <meshStandardMaterial color="#D4A07A" roughness={0.45} metalness={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* Noodles on the left */}
      <group position={[-0.45, -0.05, 0.1]}>
        {[
          { args: [0.3, 0.035, 8, 24, Math.PI] as const, rot: [0, Math.PI / 4, 0] as const, pos: [0, 0, 0] as const },
          { args: [0.22, 0.035, 8, 24, Math.PI] as const, rot: [0, Math.PI / 3, 0] as const, pos: [-0.15, 0, 0.15] as const },
          { args: [0.35, 0.035, 8, 24, Math.PI] as const, rot: [0, Math.PI / 6, 0] as const, pos: [0.15, 0, -0.1] as const },
          { args: [0.25, 0.035, 8, 24, Math.PI] as const, rot: [-0.1, 0, 0] as const, pos: [-0.1, 0, 0.05] as const },
        ].map((m, i) => (
          <mesh key={i} rotation={m.rot} position={m.pos}>
            <torusGeometry args={m.args} />
            <meshStandardMaterial color="#F5F0DC" roughness={0.7} />
          </mesh>
        ))}
      </group>

      {/* Dumplings on the right */}
      {([
        [0.45, -0.05, 0.1],
        [0.85, -0.05, -0.2],
      ] as const).map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.35, 18, 18]} />
          <meshStandardMaterial color="#F5F0DC" roughness={0.7} />
        </mesh>
      ))}

      {/* Crossed chopsticks */}
      <group position={[0, 0.45, 0]} rotation={[0.1, 0, -Math.PI / 4]}>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.02, 0.035, 2.4, 10]} />
          <meshStandardMaterial color="#3A1F12" roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.06, 0]}>
          <cylinderGeometry args={[0.02, 0.035, 2.4, 10]} />
          <meshStandardMaterial color="#3A1F12" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

function Steam() {
  const ref = useRef<THREE.Points>(null!);
  const t = useRef(0);
  const count = 120;
  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.9;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = Math.random() * 2;
      positions[i * 3 + 2] = Math.sin(a) * r;
      seeds[i] = Math.random();
    }
    return { positions, seeds };
  }, []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    t.current += delta;
    const time = t.current;
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] = ((seeds[i] * 4 + time * 0.4) % 4) - 0.2;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#F5F0DC"
        transparent
        opacity={0.35}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

export default function BowlScene() {
  return (
    <Canvas
      className="absolute inset-0"
      camera={{ position: [0, 1.6, 4.2], fov: 42 }}
      dpr={[1, 1.4]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ zIndex: 10 }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.45} />
        <pointLight position={[3, 4, 3]} intensity={20} color="#FF2D55" distance={10} />
        <pointLight position={[-4, 2, -2]} intensity={15} color="#FFD700" distance={10} />
        <directionalLight position={[0, 5, 5]} intensity={0.7} />
        <group position={[0, 0.4, 0]}>
          <Float floatIntensity={0.4} rotationIntensity={0.3} speed={1.2}>
            <Bowl />
          </Float>
          <Steam />
        </group>
      </Suspense>
    </Canvas>
  );
}
