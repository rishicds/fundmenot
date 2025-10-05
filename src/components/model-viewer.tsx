'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as THREE from 'three';

interface ModelProps {
  modelPath: string;
  scale?: number;
  rotation?: [number, number, number];
  autoRotate?: boolean;
  color?: string;
}

function Model({ modelPath, scale = 1, rotation = [0, 0, 0], autoRotate = false, color }: ModelProps) {
  const { scene } = useGLTF(modelPath);
  const modelRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (modelRef.current && autoRotate) {
      modelRef.current.rotation.y += 0.01;
    }
  });

  // Apply color tint if specified
  if (color && scene) {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material) {
          const material = child.material as THREE.MeshStandardMaterial;
          material.color.set(color);
        }
      }
    });
  }

  return (
    <primitive 
      ref={modelRef}
      object={scene} 
      scale={scale} 
      rotation={rotation}
    />
  );
}

interface ModelViewerProps {
  modelPath: string;
  className?: string;
  scale?: number;
  rotation?: [number, number, number];
  autoRotate?: boolean;
  showControls?: boolean;
  cameraPosition?: [number, number, number];
  isGlitched?: boolean;
  modelVariation?: {
    scale?: number;
    rotation?: [number, number, number];
    color?: string;
    position?: [number, number, number];
  };
}

export default function ModelViewer({
  modelPath,
  className,
  scale = 1.5,
  rotation = [0, 0, 0],
  autoRotate = true,
  showControls = false,
  cameraPosition = [0, 0, 5],
  isGlitched = false,
  modelVariation,
}: ModelViewerProps) {
  // Use variation properties if provided, otherwise use defaults
  const finalScale = modelVariation?.scale ?? scale;
  const finalRotation = modelVariation?.rotation ?? rotation;
  const finalColor = modelVariation?.color;

  return (
    <div className={cn('relative', className, isGlitched && 'glitch-container')}>
      <Canvas
        camera={{ position: cameraPosition, fov: 50 }}
        className={cn('bg-transparent', isGlitched && 'glitch-canvas')}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <directionalLight position={[-5, -5, -5]} intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={0.8} />
        <Suspense fallback={null}>
          <Model 
            modelPath={modelPath} 
            scale={finalScale} 
            rotation={finalRotation}
            autoRotate={autoRotate}
            color={finalColor}
          />
        </Suspense>
        {showControls && (
          <OrbitControls 
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.5}
          />
        )}
      </Canvas>
      {isGlitched && (
        <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-screen bg-gradient-to-r from-red-500 via-transparent to-blue-500 animate-pulse" />
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export { LoadingFallback };
