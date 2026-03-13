import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Torus, Octahedron } from '@react-three/drei';
import * as THREE from 'three';

function HolographicOrb({ position, color, speed = 1, size = 1 }: {
  position: [number, number, number]; color: string; speed?: number; size?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = state.clock.elapsedTime * 0.1 * speed;
    ref.current.rotation.y = state.clock.elapsedTime * 0.15 * speed;
  });

  return (
    <Float speed={speed * 1.2} rotationIntensity={0.3} floatIntensity={1.8}>
      <Sphere ref={ref} args={[size, 48, 48]} position={position}>
        <MeshDistortMaterial
          color={color}
          roughness={0.1}
          metalness={0.9}
          distort={0.35}
          speed={1.2}
          transparent
          opacity={0.2}
          emissive={color}
          emissiveIntensity={0.15}
        />
      </Sphere>
    </Float>
  );
}

function NeonRing({ position, color, speed = 1, radius = 0.8 }: {
  position: [number, number, number]; color: string; speed?: number; radius?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = state.clock.elapsedTime * 0.2 * speed;
    ref.current.rotation.z = state.clock.elapsedTime * 0.12 * speed;
  });

  return (
    <Float speed={speed * 1.5} rotationIntensity={0.8} floatIntensity={2}>
      <Torus ref={ref} args={[radius, 0.04, 16, 64]} position={position}>
        <meshStandardMaterial
          color={color}
          roughness={0.1}
          metalness={0.95}
          transparent
          opacity={0.35}
          emissive={color}
          emissiveIntensity={0.4}
        />
      </Torus>
    </Float>
  );
}

function DataCrystal({ position, color, speed = 1 }: {
  position: [number, number, number]; color: string; speed?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.3 * speed;
    ref.current.rotation.z = state.clock.elapsedTime * 0.15 * speed;
  });

  return (
    <Float speed={speed * 1.8} rotationIntensity={0.6} floatIntensity={1.5}>
      <Octahedron ref={ref} args={[0.35, 0]} position={position}>
        <meshStandardMaterial
          color={color}
          roughness={0.05}
          metalness={0.95}
          transparent
          opacity={0.25}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </Octahedron>
    </Float>
  );
}

function CyberGrid() {
  const count = 300;
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.008;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.025} color="#00d4ff" transparent opacity={0.3} sizeAttenuation />
    </points>
  );
}

export default function Scene3D() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.25} />
        <directionalLight position={[5, 5, 5]} intensity={0.3} color="#3b82f6" />
        <directionalLight position={[-5, -5, 5]} intensity={0.2} color="#00d4ff" />
        <pointLight position={[0, 0, 5]} intensity={0.15} color="#8b5cf6" />

        <HolographicOrb position={[-5, 3, -4]} color="#3b82f6" speed={0.6} size={0.8} />
        <HolographicOrb position={[5, -2.5, -5]} color="#00d4ff" speed={0.4} size={1} />
        <HolographicOrb position={[2, 4, -6]} color="#8b5cf6" speed={0.7} size={0.5} />

        <NeonRing position={[-3, -3, -3]} color="#00d4ff" speed={0.5} radius={1} />
        <NeonRing position={[4, 2.5, -5]} color="#3b82f6" speed={0.3} radius={0.6} />

        <DataCrystal position={[-4.5, 1, -3]} color="#8b5cf6" speed={0.7} />
        <DataCrystal position={[3, -3.5, -4]} color="#00d4ff" speed={0.5} />
        <DataCrystal position={[1, 3, -3]} color="#ec4899" speed={0.6} />

        <CyberGrid />
      </Canvas>
    </div>
  );
}
