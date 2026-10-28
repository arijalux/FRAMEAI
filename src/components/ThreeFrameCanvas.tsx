import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OpticalFrame, FrameColorOption } from '../types';
import { RotateCw, ZoomIn, ZoomOut, Eye, Sparkles, Layers, Sliders } from 'lucide-react';

export type LensTint = 'clear' | 'blue_light' | 'dark_sun' | 'gradient_amber' | 'photochromic';

interface ThreeFrameCanvasProps {
  frame: OpticalFrame;
  selectedColor: FrameColorOption;
  lensTint: LensTint;
  onLensTintChange?: (tint: LensTint) => void;
}

export const ThreeFrameCanvas: React.FC<ThreeFrameCanvasProps> = ({
  frame,
  selectedColor,
  lensTint,
  onLensTintChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameGroupRef = useRef<THREE.Group | null>(null);
  const leftTempleRef = useRef<THREE.Group | null>(null);
  const rightTempleRef = useRef<THREE.Group | null>(null);

  const [isRotating, setIsRotating] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [explodedView, setExplodedView] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Mouse interaction state
  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });
  const rotationEuler = useRef({ x: 0.1, y: 0.3 });

  // Generate procedural tortoise texture
  const getTortoiseTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#4a2c14';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = 5 + Math.random() * 25;
      const colors = ['#23120b', '#7a4b1e', '#c88636', '#140a05'];
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * (0.5 + Math.random() * 0.8), Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 450;

    // Create Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);
    cameraRef.current = camera;

    // Create Renderer with antialiasing
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(5, 6, 8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xd4af37, 1.0);
    fillLight.position.set(-6, -2, 4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x88ccff, 1.8);
    rimLight.position.set(0, 8, -6);
    scene.add(rimLight);

    // Build 3D Eyewear Frame
    const frameGroup = new THREE.Group();
    scene.add(frameGroup);
    frameGroupRef.current = frameGroup;

    // Resolve materials based on selected color and frame material
    const isMetallic = selectedColor.acetateTexture === 'metallic' || frame.material.includes('Titanium');
    const isTortoise = selectedColor.acetateTexture === 'tortoise';
    const isCrystal = selectedColor.acetateTexture === 'crystal';

    let frameMaterial: THREE.Material;

    if (isTortoise) {
      const tortTex = getTortoiseTexture();
      frameMaterial = new THREE.MeshPhysicalMaterial({
        map: tortTex,
        roughness: 0.15,
        metalness: 0.05,
        clearcoat: 0.95,
        clearcoatRoughness: 0.1,
      });
    } else if (isCrystal) {
      frameMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(selectedColor.hex),
        transmission: 0.75,
        opacity: 0.85,
        transparent: true,
        roughness: 0.12,
        ior: 1.52,
        clearcoat: 1.0,
      });
    } else if (isMetallic) {
      frameMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(selectedColor.hex),
        metalness: 0.88,
        roughness: 0.22,
      });
    } else {
      frameMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(selectedColor.hex),
        roughness: 0.2,
        metalness: 0.05,
        clearcoat: 0.9,
      });
    }

    // Lens material configuration
    let lensColor = 0xffffff;
    let lensTransmission = 0.95;
    let lensRoughness = 0.05;
    let lensOpacity = 0.35;

    if (lensTint === 'blue_light') {
      lensColor = 0xf5f3ea;
      lensTransmission = 0.92;
      lensOpacity = 0.45;
    } else if (lensTint === 'dark_sun') {
      lensColor = 0x222428;
      lensTransmission = 0.25;
      lensOpacity = 0.85;
    } else if (lensTint === 'gradient_amber') {
      lensColor = 0x9c5c24;
      lensTransmission = 0.45;
      lensOpacity = 0.7;
    } else if (lensTint === 'photochromic') {
      lensColor = 0x5a5563;
      lensTransmission = 0.55;
      lensOpacity = 0.65;
    }

    const lensMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(lensColor),
      transmission: lensTransmission,
      opacity: lensOpacity,
      transparent: true,
      roughness: lensRoughness,
      ior: 1.53,
      reflectivity: 0.6,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });

    // Helper: create rim geometry based on preset
    const createRimCurve = (isRight: boolean) => {
      const shape = new THREE.Shape();
      const xOffset = isRight ? 1.15 : -1.15;
      const scaleX = 0.95;
      const scaleY = frame.shape === 'Aviator' ? 0.95 : 0.85;

      if (frame.shape === 'Geometric') {
        // Hexagonal / Octagonal polygon
        const sides = 8;
        const radius = 0.95;
        for (let i = 0; i <= sides; i++) {
          const angle = (i / sides) * Math.PI * 2;
          const px = xOffset + Math.cos(angle) * radius * scaleX;
          const py = Math.sin(angle) * radius * scaleY;
          if (i === 0) shape.moveTo(px, py);
          else shape.lineTo(px, py);
        }
      } else if (frame.shape === 'Square') {
        const w = 1.0;
        const h = 0.85;
        const r = 0.2;
        shape.moveTo(xOffset - w + r, -h);
        shape.lineTo(xOffset + w - r, -h);
        shape.quadraticCurveTo(xOffset + w, -h, xOffset + w, -h + r);
        shape.lineTo(xOffset + w, h - r);
        shape.quadraticCurveTo(xOffset + w, h, xOffset + w - r, h);
        shape.lineTo(xOffset - w + r, h);
        shape.quadraticCurveTo(xOffset - w, h, xOffset - w, h - r);
        shape.lineTo(xOffset - w, -h + r);
        shape.quadraticCurveTo(xOffset - w, -h, xOffset - w + r, -h);
      } else if (frame.shape === 'Cat-Eye') {
        const w = 0.98;
        const h = 0.82;
        shape.moveTo(xOffset - w, -h * 0.7);
        shape.quadraticCurveTo(xOffset, -h, xOffset + w, -h * 0.7);
        shape.quadraticCurveTo(xOffset + (isRight ? w * 1.3 : w * 0.9), h * 0.3, xOffset + (isRight ? w * 1.25 : w), h * 1.1);
        shape.quadraticCurveTo(xOffset, h * 0.8, xOffset - (isRight ? w : w * 1.25), h * 1.1);
        shape.quadraticCurveTo(xOffset - (isRight ? w * 0.9 : w * 1.3), h * 0.3, xOffset - w, -h * 0.7);
      } else if (frame.shape === 'Aviator') {
        // Tear-drop aviator shape
        shape.moveTo(xOffset - 0.9, 0.7);
        shape.quadraticCurveTo(xOffset, 0.85, xOffset + 0.9, 0.7);
        shape.quadraticCurveTo(xOffset + 1.05, -0.2, xOffset + 0.6, -0.9);
        shape.quadraticCurveTo(xOffset, -1.15, xOffset - 0.6, -0.9);
        shape.quadraticCurveTo(xOffset - 1.05, -0.2, xOffset - 0.9, 0.7);
      } else {
        // Smooth Round / Oval
        shape.absellipse(xOffset, 0, 0.95 * scaleX, 0.92 * scaleY, 0, Math.PI * 2, false, 0);
      }
      return shape;
    };

    // Construct Rims
    const leftShape = createRimCurve(false);
    const rightShape = createRimCurve(true);

    const extrudeSettings = {
      depth: 0.16,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.03,
      bevelThickness: 0.03,
    };

    // Hollow rim frames
    const createHollowRim = (shape: THREE.Shape, isRight: boolean) => {
      const rimGroup = new THREE.Group();
      const xOffset = isRight ? 1.15 : -1.15;

      const innerHole = new THREE.Path();
      innerHole.absellipse(xOffset, 0, 0.84, 0.76, 0, Math.PI * 2, true, 0);
      shape.holes = [innerHole];

      const rimGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const rimMesh = new THREE.Mesh(rimGeo, frameMaterial);
      rimGroup.add(rimMesh);

      // Lens Glass Disk
      const lensShape = new THREE.Shape();
      lensShape.absellipse(xOffset, 0, 0.85, 0.77, 0, Math.PI * 2, false, 0);
      const lensGeo = new THREE.ExtrudeGeometry(lensShape, { depth: 0.02, bevelEnabled: false });
      const lensMesh = new THREE.Mesh(lensGeo, lensMaterial);
      lensMesh.position.z = 0.07;
      rimGroup.add(lensMesh);

      return rimGroup;
    };

    frameGroup.add(createHollowRim(leftShape, false));
    frameGroup.add(createHollowRim(rightShape, true));

    // Nose Bridge
    const bridgeCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-0.35, 0.15, 0.08),
      new THREE.Vector3(-0.15, 0.38, 0.14),
      new THREE.Vector3(0.15, 0.38, 0.14),
      new THREE.Vector3(0.35, 0.15, 0.08)
    );
    const bridgeGeo = new THREE.TubeGeometry(bridgeCurve, 20, 0.045, 8, false);
    const bridgeMesh = new THREE.Mesh(bridgeGeo, frameMaterial);
    frameGroup.add(bridgeMesh);

    // Double bridge for Aviator
    if (frame.shape === 'Aviator') {
      const topBridgeCurve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(-0.7, 0.72, 0.08),
        new THREE.Vector3(-0.2, 0.76, 0.1),
        new THREE.Vector3(0.2, 0.76, 0.1),
        new THREE.Vector3(0.7, 0.72, 0.08)
      );
      const topBridgeGeo = new THREE.TubeGeometry(topBridgeCurve, 16, 0.035, 8, false);
      const topBridgeMesh = new THREE.Mesh(topBridgeGeo, frameMaterial);
      frameGroup.add(topBridgeMesh);
    }

    // Nose pads
    const padMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.7,
      roughness: 0.3,
      transparent: true,
      opacity: 0.8,
    });
    [-0.32, 0.32].forEach((x) => {
      const padGeo = new THREE.CapsuleGeometry(0.045, 0.14, 4, 8);
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(x, -0.15, -0.15);
      pad.rotation.z = x > 0 ? -0.4 : 0.4;
      pad.rotation.y = x > 0 ? 0.3 : -0.3;
      frameGroup.add(pad);
    });

    // Left and Right Temples (Hinged arms)
    const createTemple = (isRight: boolean) => {
      const templeGroup = new THREE.Group();
      const xPivot = isRight ? 2.15 : -2.15;
      templeGroup.position.set(xPivot, 0.22, 0.05);

      // Hinge metal barrel
      const hingeGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.1, 12);
      const hingeMesh = new THREE.Mesh(hingeGeo, new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.95 }));
      templeGroup.add(hingeMesh);

      // Temple arm curving backwards
      const templeCurve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(isRight ? 0.05 : -0.05, 0, -1.8),
        new THREE.Vector3(isRight ? 0.02 : -0.02, -0.05, -3.2),
        new THREE.Vector3(isRight ? -0.08 : 0.08, -0.55, -4.0) // curved ear wrap
      );
      const armGeo = new THREE.TubeGeometry(templeCurve, 24, 0.048, 8, false);
      const armMesh = new THREE.Mesh(armGeo, frameMaterial);
      templeGroup.add(armMesh);

      return templeGroup;
    };

    const leftTemple = createTemple(false);
    const rightTemple = createTemple(true);
    frameGroup.add(leftTemple);
    frameGroup.add(rightTemple);
    leftTempleRef.current = leftTemple;
    rightTempleRef.current = rightTemple;

    // Center pivot of entire glasses
    frameGroup.position.set(0, 0, 0);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (frameGroupRef.current) {
        if (isRotating && !isDragging.current) {
          rotationEuler.current.y += delta * 0.45;
        }

        frameGroupRef.current.rotation.x = rotationEuler.current.x;
        frameGroupRef.current.rotation.y = rotationEuler.current.y;
      }

      // Exploded hinge animation handling
      const targetTempleOffset = explodedView ? 0.4 : 0;
      if (leftTempleRef.current && rightTempleRef.current) {
        leftTempleRef.current.position.x = THREE.MathUtils.lerp(
          leftTempleRef.current.position.x,
          -2.15 - targetTempleOffset,
          0.1
        );
        rightTempleRef.current.position.x = THREE.MathUtils.lerp(
          rightTempleRef.current.position.x,
          2.15 + targetTempleOffset,
          0.1
        );
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 450;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [frame, selectedColor, lensTint, isRotating, explodedView]);

  // Handle Drag to Rotate
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    prevMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - prevMouse.current.x;
    const deltaY = e.clientY - prevMouse.current.y;

    rotationEuler.current.y += deltaX * 0.01;
    rotationEuler.current.x = Math.max(-0.6, Math.min(0.6, rotationEuler.current.x + deltaY * 0.01));

    prevMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const adjustZoom = (delta: number) => {
    if (!cameraRef.current) return;
    const newZ = Math.max(4.5, Math.min(10.5, cameraRef.current.position.z + delta));
    cameraRef.current.position.z = newZ;
    setZoomLevel(Number(((7.5 / newZ) * 100).toFixed(0)));
  };

  return (
    <div className="relative w-full h-[460px] bg-gradient-to-b from-neutral-900/80 via-neutral-950 to-neutral-900 rounded-2xl border border-neutral-800/80 overflow-hidden select-none shadow-2xl backdrop-blur-md">
      {/* 3D Canvas Mount */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Top Floating Badges */}
      <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 pointer-events-none">
        <span className="px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 backdrop-blur-md">
          {frame.material}
        </span>
        <span className="px-2.5 py-1 rounded-full text-xs text-neutral-400 bg-neutral-900/80 border border-neutral-800 backdrop-blur-md">
          {frame.weightGrams}g Featherlight
        </span>
      </div>

      {/* Optical Millimeter Dimension HUD Overlay */}
      {showDimensions && (
        <div className="absolute top-4 right-4 bg-neutral-950/85 backdrop-blur-md border border-neutral-800/80 p-3 rounded-xl text-xs space-y-1.5 shadow-xl pointer-events-none font-mono">
          <div className="text-amber-400 font-semibold tracking-wide text-[11px] mb-1 font-sans flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            OPHTHALMIC CALIBRATION
          </div>
          <div className="flex justify-between gap-4 text-neutral-300">
            <span>Lens Width:</span>
            <span className="font-bold text-white">{frame.dimensions.lensWidth} mm</span>
          </div>
          <div className="flex justify-between gap-4 text-neutral-300">
            <span>Bridge Distance:</span>
            <span className="font-bold text-white">{frame.dimensions.bridgeWidth} mm</span>
          </div>
          <div className="flex justify-between gap-4 text-neutral-300">
            <span>Temple Length:</span>
            <span className="font-bold text-white">{frame.dimensions.templeLength} mm</span>
          </div>
          <div className="flex justify-between gap-4 text-neutral-300">
            <span>Lens Height:</span>
            <span className="font-bold text-white">{frame.dimensions.lensHeight} mm</span>
          </div>
        </div>
      )}

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 bg-neutral-950/80 backdrop-blur-lg border border-neutral-800/80 p-2.5 rounded-xl shadow-2xl">
        {/* Lens Tint Selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-neutral-400 mr-1 hidden sm:inline">Lens Optics:</span>
          {(
            [
              { id: 'clear', label: 'Clear AR', desc: 'Anti-Reflective' },
              { id: 'blue_light', label: 'Blue Shield', desc: '420nm Filter' },
              { id: 'dark_sun', label: 'Polarized', desc: 'Category 3' },
              { id: 'gradient_amber', label: 'Gradient', desc: 'Sunset Tint' },
              { id: 'photochromic', label: 'Transition', desc: 'UV Reactive' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => onLensTintChange?.(t.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                lensTint === t.id
                  ? 'bg-amber-500 text-neutral-950 shadow-md font-semibold'
                  : 'bg-neutral-900/80 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 3D Action Tools */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsRotating((prev) => !prev)}
            title={isRotating ? 'Pause 360° rotation' : 'Start 360° rotation'}
            aria-label="Toggle 360 degree rotation"
            className={`p-2 rounded-lg transition-colors ${
              isRotating ? 'bg-amber-500/20 text-amber-400' : 'text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => adjustZoom(-0.8)}
            title="Zoom In"
            aria-label="Zoom In"
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => adjustZoom(0.8)}
            title="Zoom Out"
            aria-label="Zoom Out"
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setExplodedView((prev) => !prev)}
            title={explodedView ? 'Standard View' : 'Explode Hinge Components'}
            aria-label="Toggle exploded view"
            className={`p-2 rounded-lg transition-colors ${
              explodedView ? 'bg-amber-500/20 text-amber-400' : 'text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDimensions((prev) => !prev)}
            title="Toggle Specs HUD"
            aria-label="Toggle dimensions HUD"
            className={`p-2 rounded-lg transition-colors ${
              showDimensions ? 'bg-amber-500/20 text-amber-400' : 'text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
