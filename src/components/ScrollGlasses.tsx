import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { MotionValue } from 'motion/react';

const FOV = 30;
const TILT = THREE.MathUtils.degToRad(8);

interface ScrollGlassesProps {
  url: string;
  /** Turn around the vertical axis in degrees (0 = front); the only thing that moves the model */
  yaw: MotionValue<number>;
  /** How much of the viewer's height the model fills */
  fit: number;
}

function Glasses({ url, yaw, fit }: ScrollGlassesProps) {
  const { scene } = useGLTF(url);
  const { camera, size, invalidate } = useThree();
  const pivot = useRef<THREE.Group>(null);

  // Normalise the model to 2 units across, centred on the origin
  const bounds = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const extent = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = 2 / Math.max(extent.x, extent.y, extent.z, 0.0001);
    return { scale, center, radius: (extent.length() / 2) * scale, floor: (extent.y / 2) * scale };
  }, [scene]);

  // Rendering is on demand: redraw only when the scroll changes the pose
  useEffect(() => yaw.on('change', () => invalidate()), [yaw, invalidate]);

  useFrame(() => {
    const aspect = size.width / Math.max(size.height, 1);
    const distance = bounds.radius / (fit * Math.tan(THREE.MathUtils.degToRad(FOV) / 2) * Math.min(1, aspect));
    camera.position.set(0, 0, distance);
    camera.lookAt(0, 0, 0);
    pivot.current?.rotation.set(TILT, THREE.MathUtils.degToRad(yaw.get()), 0, 'YXZ');
  });

  return (
    <>
      <group ref={pivot}>
        <group
          scale={bounds.scale}
          position={[-bounds.center.x * bounds.scale, -bounds.center.y * bounds.scale, -bounds.center.z * bounds.scale]}
        >
          <primitive object={scene} />
        </group>
      </group>
      <ContactShadows
        position={[0, -bounds.floor - 0.08, 0]}
        opacity={0.45}
        scale={bounds.radius * 4}
        blur={2.6}
        far={bounds.floor * 2 + 0.5}
        resolution={512}
      />
    </>
  );
}

/** The wooden frame in 3D with its angle set by the page scroll; no auto-rotation or dragging */
export default function ScrollGlasses(props: ScrollGlassesProps) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ fov: FOV, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
      }}
      style={{ pointerEvents: 'none' }}
    >
      <directionalLight position={[3, 5, 4]} intensity={0.6} />
      <Suspense fallback={null}>
        <Environment preset="studio" />
      </Suspense>
      <Suspense fallback={null}>
        <Glasses {...props} />
      </Suspense>
    </Canvas>
  );
}
