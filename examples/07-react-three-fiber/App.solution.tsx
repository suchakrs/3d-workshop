import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useControls } from "leva";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Hero torus-knot with leva-driven animation
// ---------------------------------------------------------------------------
function HeroKnot(): React.ReactElement {
  const meshRef = useRef<THREE.Mesh>(null);

  const { speed, wireframe } = useControls("Hero Knot", {
    speed: { value: 0.5, min: 0, max: 3, step: 0.05, label: "Rotation speed" },
    wireframe: { value: false, label: "Wireframe" },
  });

  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += speed * delta;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0.5, 0]} castShadow>
      <torusKnotGeometry args={[0.7, 0.25, 128, 32]} />
      <meshStandardMaterial
        color={0x6699ff}
        metalness={0.3}
        roughness={0.4}
        wireframe={wireframe}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// App — SOLUTION: E3 box filled in
// ---------------------------------------------------------------------------
export default function App(): React.ReactElement {
  return (
    <Canvas
      shadows
      camera={{ fov: 50, position: [4, 3, 6], near: 0.1, far: 100 }}
    >
      {/* Background colour */}
      <color attach="background" args={[0x0b0e14]} />
      {/* Fog */}
      <fog attach="fog" args={[0x0b0e14, 10, 30]} />

      {/* Lights */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={2.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* Ground plane */}
      <mesh rotation-x={-Math.PI / 2} position-y={-1} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color={0x444444} />
      </mesh>

      {/* Hero */}
      <HeroKnot />

      {/* E3 SOLUTION — box mesh A */}
      <mesh position={[-2.5, 0, 0]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={0xff6688} />
      </mesh>

      {/* Supporting sphere B */}
      <mesh position={[2.5, 0, 0]} castShadow>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial color={0x66ddaa} />
      </mesh>

      <OrbitControls enableDamping />
    </Canvas>
  );
}
