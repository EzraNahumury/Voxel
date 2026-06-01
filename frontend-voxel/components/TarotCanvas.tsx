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

  // Front-facing, centered — fills the card face flat.
  return (
    <group scale={scale} position={[-offset.x * scale, -offset.y * scale, -offset.z * scale]}>
      <primitive object={cloned} />
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
      <ambientLight intensity={1.15} />
      <directionalLight position={[0, 1, 6]} intensity={1.8} />
      <directionalLight position={[0, 0, 4]} intensity={0.6} />
      <Suspense fallback={null}>
        <Card target={target} />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL);
