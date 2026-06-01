"use client";

import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import * as THREE from "three";

const MODEL = "/assetcard/three_of_swords.glb";

function Card({ target = 3.2 }: { target?: number }) {
  const { scene } = useGLTF(MODEL);
  const cloned = useMemo(() => scene.clone(true), [scene]);

  const { scale, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    return { scale: target / maxDim, offset: center };
  }, [cloned, target]);

  // Static, gently angled pose for depth — no rotation.
  return (
    <group rotation={[0.07, -0.36, 0]}>
      <group scale={scale} position={[-offset.x * scale, -offset.y * scale, -offset.z * scale]}>
        <primitive object={cloned} />
      </group>
    </group>
  );
}

export default function TarotCanvas({
  className,
  target = 3.2,
}: {
  className?: string;
  target?: number;
}) {
  return (
    <Canvas
      className={className}
      dpr={[1, 2]}
      camera={{ position: [0, 0, 6], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 6, 5]} intensity={2.4} />
      <pointLight position={[-5, -2, 4]} color="#35d07f" intensity={9} distance={16} />
      <pointLight position={[5, 4, -3]} color="#fcff52" intensity={4} distance={16} />
      <Suspense fallback={null}>
        <Card target={target} />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL);
