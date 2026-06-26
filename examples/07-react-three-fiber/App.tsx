import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useControls } from "leva";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Scene-level environment: background colour + fog
// ---------------------------------------------------------------------------
function SceneSetup(): null {
  return null;
}

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
// App
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

      {/* TODO(E3): convert this vanilla three.js snippet into R3F JSX and render it here:
           const geo = new THREE.BoxGeometry(1, 1, 1);
           const mat = new THREE.MeshStandardMaterial({ color: 0xff6688 });
           const box = new THREE.Mesh(geo, mat);
           box.position.set(-2.5, 0, 0);
           box.castShadow = true;
           scene.add(box);
         Replace this comment with the equivalent <mesh>...</mesh>. */}

      {/* Supporting sphere B */}
      <mesh position={[2.5, 0, 0]} castShadow>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial color={0x66ddaa} />
      </mesh>

      <OrbitControls enableDamping />
    </Canvas>
  );
}
