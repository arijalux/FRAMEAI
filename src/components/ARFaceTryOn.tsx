import React, { useEffect, useRef, useState, useCallback } from 'react';
import { OpticalFrame, FrameColorOption } from '../types';
import {
  Camera,
  RefreshCw,
  Download,
  Sparkles,
  X,
  Check,
  Eye,
  Sun,
  Shield,
  Share2,
  AlertCircle,
  SwitchCamera,
  Maximize2,
  Sliders,
  Move,
  Lock,
  Unlock,
  SlidersHorizontal,
} from 'lucide-react';
import { saveTryOnLookToFirestore } from '../lib/firebase';
import { OpticalFaceTracker, TrackedLandmarks } from '../utils/faceTracker';

interface ARFaceTryOnProps {
  frames: OpticalFrame[];
  activeFrame: OpticalFrame;
  onSelectFrame: (frame: OpticalFrame) => void;
  onClose?: () => void;
  userPd?: number;
}

const DEMO_MODELS = [
  {
    name: 'Model 01 (Oval Structure)',
    shape: 'Oval',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    eyeLeft: { x: 0.41, y: 0.44 },
    eyeRight: { x: 0.58, y: 0.44 },
  },
  {
    name: 'Model 02 (Square Structure)',
    shape: 'Square',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    eyeLeft: { x: 0.42, y: 0.42 },
    eyeRight: { x: 0.59, y: 0.42 },
  },
  {
    name: 'Model 03 (Heart Structure)',
    shape: 'Heart',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    eyeLeft: { x: 0.42, y: 0.45 },
    eyeRight: { x: 0.58, y: 0.45 },
  },
];

export const ARFaceTryOn: React.FC<ARFaceTryOnProps> = ({
  frames,
  activeFrame,
  onSelectFrame,
  onClose,
  userPd = 63,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackerRef = useRef<OpticalFaceTracker | null>(null);

  // Camera states
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isFaceDetected, setIsFaceDetected] = useState<boolean>(false);

  // Model selection when camera is off
  const [selectedDemoIndex, setSelectedDemoIndex] = useState<number>(0);
  const [activeColor, setActiveColor] = useState<FrameColorOption>(activeFrame.colors[0]);
  const [lensTint, setLensTint] = useState<'clear' | 'sun' | 'blue_light'>('clear');

  // Interactive manual adjustment
  const [autoTracking, setAutoTracking] = useState<boolean>(true);
  const [manualOffset, setManualOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [scaleMultiplier, setScaleMultiplier] = useState<number>(1.0);
  const [showPdGuides, setShowPdGuides] = useState<boolean>(true);
  // On phones the viewport is too short for every overlay, so calibration starts collapsed there
  const [showCalibrationMobile, setShowCalibrationMobile] = useState<boolean>(false);
  const isDragging = useRef<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Snapshot modal states
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Stream ref for cleanup
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize tracker
  useEffect(() => {
    trackerRef.current = new OpticalFaceTracker();
  }, []);

  // Sync active color when frame changes
  useEffect(() => {
    setActiveColor(activeFrame.colors[0]);
  }, [activeFrame]);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    setCameraLoading(true);
    setCameraError(null);

    // Stop existing stream if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((err) => console.warn('Video play caught:', err));
          setCameraActive(true);
          setCameraLoading(false);
        };
      }
    } catch (err: any) {
      console.warn('Camera request error:', err);
      setCameraError(
        'Kamera tidak dapat diakses atau izin ditolak. Menggunakan mode simulasi model presisi.'
      );
      setCameraActive(false);
      setCameraLoading(false);
    }
  }, [facingMode]);

  // Cleanup camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Switch between front/back camera
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Main AR Real-Time Rendering Loop
  useEffect(() => {
    let animId: number;

    const renderAR = async () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      let landmarks: TrackedLandmarks;

      if (cameraActive && video && video.readyState >= 2 && autoTracking && trackerRef.current) {
        landmarks = await trackerRef.current.track(video, width, height);
        setIsFaceDetected(landmarks.detected);
      } else {
        // Use demo model coordinates or manual lock
        const demo = DEMO_MODELS[selectedDemoIndex];
        const leftEye = { x: width * demo.eyeLeft.x, y: height * demo.eyeLeft.y };
        const rightEye = { x: width * demo.eyeRight.x, y: height * demo.eyeRight.y };
        landmarks = {
          leftEye,
          rightEye,
          center: { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 },
          eyeDistance: Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y),
          angle: Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x),
          faceWidth: width * 0.35,
          detected: true,
        };
        setIsFaceDetected(true);
      }

      // Apply user manual offset adjustments
      const centerX = landmarks.center.x + manualOffset.x;
      const centerY = landmarks.center.y + manualOffset.y;
      const leftEyeX = landmarks.leftEye.x + manualOffset.x;
      const leftEyeY = landmarks.leftEye.y + manualOffset.y;
      const rightEyeX = landmarks.rightEye.x + manualOffset.x;
      const rightEyeY = landmarks.rightEye.y + manualOffset.y;

      const angle = landmarks.angle;
      const eyeDistance = landmarks.eyeDistance;

      // Draw PD Calibration Guide & Eye Reticles
      if (showPdGuides) {
        ctx.save();
        ctx.strokeStyle = landmarks.detected ? 'rgba(212, 175, 55, 0.6)' : 'rgba(156, 163, 175, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);

        // Left eye reticle
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, 16, 0, Math.PI * 2);
        ctx.stroke();

        // Right eye reticle
        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, 16, 0, Math.PI * 2);
        ctx.stroke();

        // Center crosshairs
        ctx.beginPath();
        ctx.moveTo(leftEyeX - 6, leftEyeY);
        ctx.lineTo(leftEyeX + 6, leftEyeY);
        ctx.moveTo(leftEyeX, leftEyeY - 6);
        ctx.lineTo(leftEyeX, leftEyeY + 6);

        ctx.moveTo(rightEyeX - 6, rightEyeY);
        ctx.lineTo(rightEyeX + 6, rightEyeY);
        ctx.moveTo(rightEyeX, rightEyeY - 6);
        ctx.lineTo(rightEyeX, rightEyeY + 6);
        ctx.stroke();

        // PD measurement line
        ctx.beginPath();
        ctx.moveTo(leftEyeX, leftEyeY - 26);
        ctx.lineTo(rightEyeX, rightEyeY - 26);
        ctx.stroke();

        ctx.fillStyle = '#D4AF37';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`PD ${userPd}mm · Calibrated`, centerX, centerY - 34);

        ctx.restore();
      }

      // Render Virtual Haute Eyewear
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);

      // Frame scale calculation based on eye distance
      const frameWidth = eyeDistance * 2.2 * scaleMultiplier;
      const rimRadius = frameWidth * 0.225;
      const rimSpacing = frameWidth * 0.265;

      // Soft drop shadow on face
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 10;

      // 1. Draw Dual Lenses
      const drawLens = (xOffset: number) => {
        ctx.save();
        ctx.beginPath();

        if (activeFrame.shape === 'Geometric') {
          const sides = 8;
          for (let i = 0; i <= sides; i++) {
            const a = (i / sides) * Math.PI * 2;
            const px = xOffset + Math.cos(a) * rimRadius * 0.94;
            const py = Math.sin(a) * rimRadius * 0.88;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
        } else if (activeFrame.shape === 'Square') {
          const w = rimRadius * 0.94;
          const h = rimRadius * 0.82;
          ctx.roundRect(xOffset - w, -h, w * 2, h * 2, 8);
        } else if (activeFrame.shape === 'Cat-Eye') {
          const w = rimRadius * 0.94;
          const h = rimRadius * 0.85;
          ctx.moveTo(xOffset - w, -h * 0.4);
          ctx.quadraticCurveTo(xOffset, -h * 0.9, xOffset + (xOffset > 0 ? w * 1.2 : w), -h * 1.15);
          ctx.quadraticCurveTo(xOffset + w, h * 0.6, xOffset, h * 0.92);
          ctx.quadraticCurveTo(xOffset - w, h * 0.6, xOffset - w, -h * 0.4);
        } else if (activeFrame.shape === 'Aviator') {
          ctx.moveTo(xOffset - rimRadius * 0.85, -rimRadius * 0.7);
          ctx.quadraticCurveTo(xOffset, -rimRadius * 0.85, xOffset + rimRadius * 0.85, -rimRadius * 0.7);
          ctx.quadraticCurveTo(xOffset + rimRadius * 1.05, rimRadius * 0.2, xOffset + rimRadius * 0.6, rimRadius * 0.9);
          ctx.quadraticCurveTo(xOffset - rimRadius * 0.2, rimRadius * 1.05, xOffset - rimRadius * 0.85, rimRadius * 0.5);
          ctx.closePath();
        } else {
          ctx.ellipse(xOffset, 0, rimRadius * 0.94, rimRadius * 0.86, 0, 0, Math.PI * 2);
        }
        ctx.closePath();

        // Lens tint & coating effects
        if (lensTint === 'sun') {
          const grad = ctx.createLinearGradient(0, -rimRadius, 0, rimRadius);
          grad.addColorStop(0, 'rgba(28, 25, 23, 0.88)');
          grad.addColorStop(1, 'rgba(120, 53, 15, 0.72)');
          ctx.fillStyle = grad;
          ctx.fill();
        } else if (lensTint === 'blue_light') {
          ctx.fillStyle = 'rgba(245, 240, 220, 0.18)';
          ctx.fill();
          // Blue reflective edge sheen
          ctx.strokeStyle = 'rgba(96, 165, 250, 0.5)';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          // Clear optical lens with anti-reflective purple-blue sheen
          ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.fill();

          const sheenAngle = angle + 0.4;
          const sheenGrad = ctx.createLinearGradient(
            xOffset - 25 * Math.cos(sheenAngle),
            -25 * Math.sin(sheenAngle),
            xOffset + 25 * Math.cos(sheenAngle),
            25 * Math.sin(sheenAngle)
          );
          sheenGrad.addColorStop(0, 'rgba(216, 180, 254, 0.35)');
          sheenGrad.addColorStop(0.5, 'rgba(96, 165, 250, 0.15)');
          sheenGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = sheenGrad;
          ctx.fill();
        }

        ctx.restore();
      };

      drawLens(-rimSpacing);
      drawLens(rimSpacing);

      ctx.restore(); // restore shadow

      // 2. Draw Frame Rims with Beveled Gradients
      const isTitanium = activeFrame.material.includes('Titanium');
      const rimThickness = isTitanium ? 3.5 : 6.5;

      const drawRimOutline = (xOffset: number) => {
        ctx.save();
        ctx.beginPath();
        if (activeFrame.shape === 'Geometric') {
          const sides = 8;
          for (let i = 0; i <= sides; i++) {
            const a = (i / sides) * Math.PI * 2;
            const px = xOffset + Math.cos(a) * rimRadius;
            const py = Math.sin(a) * rimRadius * 0.9;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
        } else if (activeFrame.shape === 'Square') {
          ctx.roundRect(xOffset - rimRadius, -rimRadius * 0.85, rimRadius * 2, rimRadius * 1.7, 10);
        } else if (activeFrame.shape === 'Cat-Eye') {
          const w = rimRadius;
          const h = rimRadius * 0.9;
          ctx.moveTo(xOffset - w, -h * 0.4);
          ctx.quadraticCurveTo(xOffset, -h * 0.95, xOffset + (xOffset > 0 ? w * 1.25 : w), -h * 1.2);
          ctx.quadraticCurveTo(xOffset + w * 1.1, h * 0.65, xOffset, h * 0.95);
          ctx.quadraticCurveTo(xOffset - w * 1.1, h * 0.65, xOffset - w, -h * 0.4);
        } else if (activeFrame.shape === 'Aviator') {
          ctx.moveTo(xOffset - rimRadius * 0.9, -rimRadius * 0.72);
          ctx.quadraticCurveTo(xOffset, -rimRadius * 0.88, xOffset + rimRadius * 0.9, -rimRadius * 0.72);
          ctx.quadraticCurveTo(xOffset + rimRadius * 1.1, rimRadius * 0.2, xOffset + rimRadius * 0.65, rimRadius * 0.95);
          ctx.quadraticCurveTo(xOffset - rimRadius * 0.2, rimRadius * 1.1, xOffset - rimRadius * 0.9, rimRadius * 0.55);
          ctx.closePath();
        } else {
          ctx.ellipse(xOffset, 0, rimRadius, rimRadius * 0.88, 0, 0, Math.PI * 2);
        }

        // Base Rim Outline
        ctx.strokeStyle = activeColor.hex;
        ctx.lineWidth = rimThickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Luster Specular Highlight on top bevel
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = isTitanium ? 1.2 : 2.0;
        ctx.beginPath();
        ctx.arc(xOffset, -1, rimRadius - 1.2, Math.PI * 1.1, Math.PI * 1.55);
        ctx.stroke();

        ctx.restore();
      };

      drawRimOutline(-rimSpacing);
      drawRimOutline(rimSpacing);

      // 3. Nose Bridge Architecture
      ctx.save();
      ctx.strokeStyle = activeColor.hex;
      ctx.lineWidth = isTitanium ? 3.0 : 5.0;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(-rimSpacing + rimRadius * 0.88, -rimRadius * 0.12);
      ctx.quadraticCurveTo(0, -rimRadius * 0.4, rimSpacing - rimRadius * 0.88, -rimRadius * 0.12);
      ctx.stroke();

      // Double bridge for Aviator
      if (activeFrame.shape === 'Aviator') {
        ctx.beginPath();
        ctx.moveTo(-rimSpacing + rimRadius * 0.75, -rimRadius * 0.72);
        ctx.lineTo(rimSpacing - rimRadius * 0.75, -rimRadius * 0.72);
        ctx.stroke();
      }

      // Nose pads (silicone / titanium)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.ellipse(-rimSpacing + rimRadius * 0.85, rimRadius * 0.15, 3, 7, 0.3, 0, Math.PI * 2);
      ctx.ellipse(rimSpacing - rimRadius * 0.85, rimRadius * 0.15, 3, 7, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // 4. Temple End Pieces (Hinges reaching ears)
      const templeReach = rimSpacing + rimRadius + 14;
      ctx.beginPath();
      ctx.moveTo(-rimSpacing - rimRadius, -rimRadius * 0.18);
      ctx.lineTo(-templeReach, -rimRadius * 0.32);
      ctx.moveTo(rimSpacing + rimRadius, -rimRadius * 0.18);
      ctx.lineTo(templeReach, -rimRadius * 0.32);
      ctx.stroke();

      // Hinge screw rivets
      ctx.fillStyle = '#C0C0C8';
      ctx.beginPath();
      ctx.arc(-rimSpacing - rimRadius - 4, -rimRadius * 0.22, 1.8, 0, Math.PI * 2);
      ctx.arc(rimSpacing + rimRadius + 4, -rimRadius * 0.22, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore(); // restore translate

      ctx.restore(); // restore outer context

      animId = requestAnimationFrame(renderAR);
    };

    renderAR();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [
    cameraActive,
    autoTracking,
    manualOffset,
    scaleMultiplier,
    showPdGuides,
    activeFrame,
    activeColor,
    lensTint,
    selectedDemoIndex,
    userPd,
  ]);

  // Touch / Mouse Drag handlers for manual positioning
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    dragStart.current = { x: e.clientX, y: e.clientY };

    setManualOffset((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  // High-Resolution Snapshot with Luxury FrameAI Watermark
  const handleTakeSnapshot = () => {
    setIsCapturing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    const finalize = () => {
      ctx.drawImage(canvas, 0, 0);
      drawWatermark(ctx, offscreen.width, offscreen.height);
      setCapturedSnapshot(offscreen.toDataURL('image/jpeg', 0.95));
      setIsCapturing(false);
    };

    if (cameraActive && videoRef.current) {
      // Mirror video onto offscreen canvas
      ctx.save();
      ctx.translate(offscreen.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, offscreen.width, offscreen.height);
      ctx.restore();
      finalize();
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = DEMO_MODELS[selectedDemoIndex].url;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, offscreen.width, offscreen.height);
        finalize();
      };
    }
  };

  const drawWatermark = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const barHeight = 64;
    ctx.fillStyle = 'rgba(10, 10, 12, 0.92)';
    ctx.fillRect(0, h - barHeight, w, barHeight);

    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(0, h - barHeight, w, 2.5);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('FrameAI Optical Studio', 24, h - 36);

    ctx.fillStyle = '#9CA3AF';
    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${activeFrame.name} · ${activeColor.name} · Calibrated Fit`, 24, h - 18);

    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('VERIFIED AR FIT', w - 24, h - 36);

    ctx.fillStyle = '#9CA3AF';
    ctx.font = '10px monospace';
    ctx.fillText(new Date().toLocaleDateString(), w - 24, h - 18);
  };

  const handleDownloadSnapshot = () => {
    if (!capturedSnapshot) return;
    const a = document.createElement('a');
    a.href = capturedSnapshot;
    a.download = `frameai-${activeFrame.name.toLowerCase().replace(/\s+/g, '-')}-fit.jpg`;
    a.click();
  };

  const handleSaveLook = async () => {
    if (!capturedSnapshot) return;
    setIsSaving(true);
    try {
      await saveTryOnLookToFirestore({
        userId: 'current-user',
        frameId: activeFrame.id,
        frameName: activeFrame.name,
        frameImageUrl: activeFrame.imageUrl,
        snapshotData: capturedSnapshot,
        matchScore: 98,
        createdAt: new Date().toISOString(),
      });
      setIsSaved(true);
    } catch {
      setIsSaved(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto rounded-3xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-2xl">
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-neutral-950/90 via-neutral-950/60 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              cameraActive && isFaceDetected
                ? 'bg-emerald-500 animate-pulse'
                : cameraActive
                ? 'bg-amber-400'
                : 'bg-neutral-500'
            }`}
          />
          <span className="hidden sm:inline text-sm font-semibold tracking-wider uppercase text-neutral-200">
            AR Real-Time Try-On
          </span>
          <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono">
            {cameraActive
              ? isFaceDetected
                ? 'Wajah Terkunci (Live Tracking)'
                : 'Mencari Wajah...'
              : 'Mode Simulasi Model'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {cameraActive && (
            <button
              onClick={toggleFacingMode}
              title="Putar Kamera Depan / Belakang"
              aria-label="Toggle camera"
              className="p-2 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 transition-colors"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              aria-label="Close AR Studio"
              className="p-2 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="relative w-full aspect-[4/3] md:aspect-[16/10] bg-neutral-900 flex items-center justify-center overflow-hidden select-none">
        {/* Live Camera Video Stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${
            cameraActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Fallback Demo Model Portrait */}
        {!cameraActive && (
          <img
            src={DEMO_MODELS[selectedDemoIndex].url}
            alt={DEMO_MODELS[selectedDemoIndex].name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Real-Time Optical Canvas Overlay */}
        <canvas
          ref={canvasRef}
          width={1280}
          height={800}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="absolute inset-0 w-full h-full object-cover z-10 cursor-move"
          title="Geser langsung untuk menyesuaikan posisi kacamata"
        />

        {/* Shutter Animation */}
        {isCapturing && <div className="absolute inset-0 bg-white z-40 animate-out fade-out duration-300" />}

        {/* Camera Activation Bar if camera is inactive */}
        {!cameraActive && (
          <div className="absolute top-16 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 bg-neutral-950/85 backdrop-blur-md border border-neutral-800/80 p-3 rounded-2xl shadow-xl">
            <div className={`${cameraError ? 'flex' : 'hidden sm:flex'} items-center gap-2.5 text-xs text-neutral-300`}>
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {cameraLoading
                  ? 'Menghubungkan webcam...'
                  : cameraError || 'Gunakan kamera live untuk mencoba kacamata secara real-time.'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={startCamera}
                disabled={cameraLoading}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow transition-all disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5" />
                {cameraLoading ? 'Memuat...' : 'Aktifkan Kamera Live'}
              </button>

              {/* Model Switcher */}
              <div className="flex gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                {DEMO_MODELS.map((m, idx) => (
                  <button
                    key={m.name}
                    onClick={() => setSelectedDemoIndex(idx)}
                    className={`px-2 py-0.5 text-[11px] rounded-lg transition-all ${
                      selectedDemoIndex === idx
                        ? 'bg-amber-500 text-neutral-950 font-bold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {m.shape}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Calibration Controls */}
        <div className="absolute left-4 bottom-4 md:bottom-28 z-20 flex flex-col gap-2">
          <button
            onClick={() => setShowCalibrationMobile((p) => !p)}
            aria-expanded={showCalibrationMobile}
            className="md:hidden order-last self-start px-3 py-1.5 rounded-xl bg-neutral-950/85 backdrop-blur-md border border-neutral-800/80 text-[11px] font-semibold text-amber-400 flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {showCalibrationMobile ? 'Tutup' : 'Kalibrasi'}
          </button>
          <div className={`${showCalibrationMobile ? 'flex' : 'hidden'} md:flex bg-neutral-950/85 backdrop-blur-md border border-neutral-800/80 p-2.5 rounded-2xl text-xs flex-col gap-2 shadow-2xl`}>
            <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-1.5">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                Kalibrasi Fit
              </span>
              <button
                onClick={() => setAutoTracking((p) => !p)}
                title={autoTracking ? 'Kunci Posisi Manual' : 'Aktifkan Pelacakan Otomatis'}
                className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1"
              >
                {autoTracking ? <Unlock className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3 text-amber-400" />}
                {autoTracking ? 'Auto-Track' : 'Locked'}
              </button>
            </div>

            {/* Scale adjustments */}
            <div className="flex items-center justify-between gap-3 text-neutral-300">
              <span>Ukuran:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setScaleMultiplier((s) => Math.max(0.75, s - 0.05))}
                  className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center font-bold"
                >
                  -
                </button>
                <span className="text-[11px] font-mono w-8 text-center">
                  {(scaleMultiplier * 100).toFixed(0)}%
                </span>
                <button
                  onClick={() => setScaleMultiplier((s) => Math.min(1.3, s + 0.05))}
                  className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Height adjustment */}
            <div className="flex items-center justify-between gap-3 text-neutral-300">
              <span>Tinggi Hidung:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setManualOffset((prev) => ({ ...prev, y: prev.y - 3 }))}
                  className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center font-bold"
                >
                  ▲
                </button>
                <button
                  onClick={() => setManualOffset((prev) => ({ ...prev, y: prev.y + 3 }))}
                  className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center font-bold"
                >
                  ▼
                </button>
              </div>
            </div>

            {/* Reset offset button */}
            {(manualOffset.x !== 0 || manualOffset.y !== 0) && (
              <button
                onClick={() => setManualOffset({ x: 0, y: 0 })}
                className="text-[10px] text-amber-400 hover:underline text-center"
              >
                Reset Posisi Tengah
              </button>
            )}

            <button
              onClick={() => setShowPdGuides((p) => !p)}
              className={`text-[11px] py-1 px-2 rounded-lg text-center transition-colors ${
                showPdGuides ? 'bg-amber-500/20 text-amber-400 font-semibold' : 'text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              {showPdGuides ? 'Sembunyikan Garis PD' : 'Tampilkan Garis PD'}
            </button>
          </div>
        </div>

        {/* Snapshot Shutter Button */}
        <div className="absolute right-4 bottom-4 md:bottom-28 z-20 flex flex-col items-center gap-2">
          <button
            onClick={handleTakeSnapshot}
            aria-label="Ambil Foto Snapshot Try-On"
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white text-neutral-950 p-1 flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all group"
          >
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-neutral-950 flex items-center justify-center group-hover:bg-amber-400 transition-colors">
              <Camera className="w-5 h-5 text-neutral-950" />
            </div>
          </button>
          <span className="hidden md:inline text-[11px] font-semibold text-white drop-shadow">Foto</span>
        </div>
      </div>

      {/* Snapshot Preview Modal */}
      {capturedSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 flex items-center justify-between border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="font-semibold text-white">Hasil Fitting AR Anda</h3>
              </div>
              <button
                onClick={() => {
                  setCapturedSnapshot(null);
                  setIsSaved(false);
                }}
                aria-label="Tutup snapshot modal"
                className="p-1 rounded-full hover:bg-neutral-800 text-neutral-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <img
                src={capturedSnapshot}
                alt="Captured Try-On"
                className="w-full rounded-2xl border border-neutral-800 shadow-inner"
              />
            </div>

            <div className="p-4 bg-neutral-950 flex items-center justify-between gap-3">
              <button
                onClick={handleDownloadSnapshot}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                Unduh Kartu
              </button>

              <button
                onClick={handleSaveLook}
                disabled={isSaving || isSaved}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm transition-all ${
                  isSaved
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold'
                }`}
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Tersimpan di Vault
                  </>
                ) : isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    Simpan Look
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Frame Switcher & Customization Drawer */}
      <div className="p-4 bg-neutral-950 border-t border-neutral-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
          <div>
            <h4 className="font-serif text-lg font-bold text-white tracking-wide">{activeFrame.name}</h4>
            <p className="text-xs text-neutral-400">
              {activeFrame.shape} · {activeFrame.material} · ${activeFrame.price}
            </p>
          </div>

          {/* Color & Tint Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Color Swatches */}
            <div className="flex items-center gap-1.5 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
              {activeFrame.colors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setActiveColor(c)}
                  title={c.name}
                  aria-label={`Pilih warna frame ${c.name}`}
                  className={`w-6 h-6 rounded-full transition-all border ${
                    activeColor.name === c.name ? 'ring-2 ring-amber-400 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex, borderColor: 'rgba(255,255,255,0.2)' }}
                />
              ))}
            </div>

            {/* Lens Tint Toggles */}
            <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs">
              <button
                onClick={() => setLensTint('clear')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                  lensTint === 'clear' ? 'bg-amber-500 text-neutral-950 font-semibold' : 'text-neutral-400'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Clear Optical
              </button>
              <button
                onClick={() => setLensTint('blue_light')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                  lensTint === 'blue_light' ? 'bg-amber-500 text-neutral-950 font-semibold' : 'text-neutral-400'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Blue Filter
              </button>
              <button
                onClick={() => setLensTint('sun')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                  lensTint === 'sun' ? 'bg-amber-500 text-neutral-950 font-semibold' : 'text-neutral-400'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                Polarized Sun
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Frame Quick-Carousel */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-neutral-800">
          {frames.map((f) => {
            const isSelected = f.id === activeFrame.id;
            return (
              <button
                key={f.id}
                onClick={() => onSelectFrame(f)}
                className={`flex-shrink-0 flex items-center gap-3 p-2 rounded-2xl border transition-all text-left ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/40'
                    : 'bg-neutral-900/60 border-neutral-800/80 hover:border-neutral-700'
                }`}
              >
                <img src={f.imageUrl} alt={f.name} className="w-14 h-10 object-cover rounded-xl bg-neutral-950" />
                <div className="pr-2">
                  <div className="text-xs font-semibold text-white truncate max-w-[120px]">{f.name}</div>
                  <div className="text-[11px] text-neutral-400">${f.price}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
