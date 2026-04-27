"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, OrbitControls, Text } from "@react-three/drei";
import { useMemo, useRef, Suspense } from "react";
import * as THREE from "three";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Suppress THREE.Clock deprecation warning caused by @react-three/drei
if (typeof console !== "undefined") {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (typeof args[0] === "string" && args[0].includes("THREE.Clock")) return;
    originalWarn(...args);
  };
}

/**
 * Stylised hotpot bowl rendered with primitives — no external model needed.
 * Brand-coloured: maroon outer, cream inner, tan rim. Crossed chopsticks above.
 */
function Bowl() {
  const group = useRef<THREE.Group>(null!);
  const time = useRef(0);
  useFrame((_, delta) => {
    time.current += delta;
    if (!group.current) return;
    group.current.rotation.y = Math.sin(time.current * 0.3) * 0.25;
  });

  return (
    <group ref={group} position={[0, -0.3, 0]}>
      {/* Outer bowl shell (Bottom hemisphere) */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1.4, 64, 64, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#5C1A2E"
          roughness={0.35}
          metalness={0.15}
          clearcoat={0.6}
          clearcoatRoughness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Inner cream cavity */}
      <mesh position={[0, -0.005, 0]}>
        <sphereGeometry args={[1.32, 64, 64, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial color="#F5F0DC" roughness={0.6} side={THREE.BackSide} />
      </mesh>
      {/* Broth surface */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.28, 64]} />
        <meshPhysicalMaterial
          color="#3D0E1D"
          roughness={0.15}
          metalness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.05}
          emissive="#5C1A2E"
          emissiveIntensity={0.18}
        />
      </mesh>
      {/* Tan rim */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.3, 1.42, 64]} />
        <meshStandardMaterial color="#D4A07A" roughness={0.4} metalness={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* MOOSA MINISTRY Logo Text */}
      <group position={[0, -0.4, 1.4]} rotation={[-0.2, 0, 0]}>
        <mesh position={[0, 0.28, 0]}>
          <boxGeometry args={[1.9, 0.02, 0.05]} />
          <meshStandardMaterial color="#D4A07A" />
        </mesh>
        
        <Text
          position={[0, 0, 0]}
          fontSize={0.25}
          color="#D4A07A"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.15}
        >
          MOOSA MINISTRY
        </Text>

        <mesh position={[0, -0.28, 0]}>
          <boxGeometry args={[1.9, 0.02, 0.05]} />
          <meshStandardMaterial color="#D4A07A" />
        </mesh>
      </group>

      {/* Noodles on the left (arches) */}
      <group position={[-0.45, -0.05, 0.1]}>
        <mesh rotation={[0, Math.PI / 4, 0]}>
          <torusGeometry args={[0.3, 0.035, 16, 48, Math.PI]} />
          <meshStandardMaterial color="#F5F0DC" roughness={0.7} />
        </mesh>
        <mesh rotation={[0, Math.PI / 3, 0]} position={[-0.15, 0, 0.15]}>
          <torusGeometry args={[0.22, 0.035, 16, 48, Math.PI]} />
          <meshStandardMaterial color="#F5F0DC" roughness={0.7} />
        </mesh>
        <mesh rotation={[0, Math.PI / 6, 0]} position={[0.15, 0, -0.1]}>
          <torusGeometry args={[0.35, 0.035, 16, 48, Math.PI]} />
          <meshStandardMaterial color="#F5F0DC" roughness={0.7} />
        </mesh>
        <mesh rotation={[0.2, Math.PI / 2, 0]} position={[0, 0, -0.15]}>
          <torusGeometry args={[0.2, 0.035, 16, 48, Math.PI]} />
          <meshStandardMaterial color="#F5F0DC" roughness={0.7} />
        </mesh>
        <mesh rotation={[-0.1, 0, 0]} position={[-0.1, 0, 0.05]}>
          <torusGeometry args={[0.25, 0.035, 16, 48, Math.PI]} />
          <meshStandardMaterial color="#F5F0DC" roughness={0.7} />
        </mesh>
      </group>

      {/* Dumplings on the right */}
      {[
        [0.45, -0.05, 0.1],
        [0.85, -0.05, -0.2],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} castShadow>
          <sphereGeometry args={[0.35, 24, 24]} />
          <meshStandardMaterial color="#F5F0DC" roughness={0.7} />
        </mesh>
      ))}

      {/* Chopsticks angled from left (noodles) to top-right */}
      <group position={[0, 0.45, 0]} rotation={[0.1, 0, -Math.PI / 4]}>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.02, 0.035, 2.4, 16]} />
          <meshStandardMaterial color="#3A1F12" roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.06, 0]}>
          <cylinderGeometry args={[0.02, 0.035, 2.4, 16]} />
          <meshStandardMaterial color="#3A1F12" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

function Steam() {
  const ref = useRef<THREE.Points>(null!);
  const time = useRef(0);
  const count = 220;
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
    time.current += delta;
    const t = time.current;
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] = ((seeds[i] * 4 + t * 0.4) % 4) - 0.2;
      arr[i * 3] += Math.sin(t * 0.5 + seeds[i] * 10) * 0.0006;
      arr[i * 3 + 2] += Math.cos(t * 0.5 + seeds[i] * 10) * 0.0006;
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

function Scene() {
  return (
    <>
      {/* Background and fog removed so HTML radial glow shows through */}
      <ambientLight intensity={0.35} />
      <pointLight position={[3, 4, 3]} intensity={20} color="#FF2D55" distance={10} />
      <pointLight position={[-4, 2, -2]} intensity={15} color="#FFD700" distance={10} />
      <directionalLight position={[0, 5, 5]} intensity={0.6} />
      
      {/* Shift entire scene up by 0.4 units so it's fully visible above text */}
      <group position={[0, 0.4, 0]}>
        <Float floatIntensity={0.4} rotationIntensity={0.3} speed={1.2}>
          <Bowl />
        </Float>
        <Steam />
      </group>
      <Environment preset="night" />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={false}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 3}
      />
    </>
  );
}

export function Hero3D() {
  return (
    <section className="relative h-[100vh] w-full overflow-hidden bg-[#0A0A0A]">
      {/* Radial maroon glow behind the canvas to highlight the smoke */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,_#4A1224_0%,_#0A0A0A_65%)] opacity-80" />

      {/* 3D canvas on top of everything */}
      <Canvas
        className="absolute inset-0"
        camera={{ position: [0, 1.6, 4.2], fov: 42 }}
        dpr={[1, 1.6]}
        shadows
        style={{ zIndex: 10 }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      {/* Vignette + content overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0A0A0A]" />

      <div className="relative z-20 h-full flex flex-col items-center justify-end pb-24 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl"
        >
          <span className="text-xs uppercase tracking-[0.4em] text-[var(--mm-tan)] flicker">
            Gulshan-e-Maymar · Karachi
          </span>
          <h1 className="mt-5 font-display text-5xl md:text-7xl leading-[1.05] brand-gradient-text">
            Korean ASMR Cravings —<br />
            <span className="neon-text font-display">Served Hot.</span>
          </h1>
          <p className="mt-6 text-sm md:text-base text-[var(--mm-cream)]/70 max-w-xl mx-auto">
            Live hotpots, hand-folded dumplings, fire-glazed gimbap, and noodles that
            sing. Step into Seoul-at-midnight, in Karachi.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            <Button asChild size="lg" variant="neon" className="pulse-neon">
              <Link href="/menu">Order Now</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/menu">Explore Menu</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.4em] text-[var(--mm-cream)]/40"
        >
          Scroll to feast ↓
        </motion.div>
      </div>
    </section>
  );
}
