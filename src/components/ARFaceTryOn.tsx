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
import { OpticalFaceTracker, TrackedLandmarks, landmarksFromEyes, coverTransform } from '../utils/faceTracker';
import { formatRupiah, frameShapeLabel, materialLabel, faceShapeLabel } from '../utils/format';

/** Line illustration: a face in a viewfinder wearing glasses, with a camera badge */
const CameraPermissionIllustration: React.FC = () => (
  <svg viewBox="0 0 200 150" className="w-48 h-auto mx-auto" aria-hidden="true">
    <rect x="30" y="12" width="140" height="112" rx="22" fill="#FFFFFF" stroke="#D6D6D2" strokeWidth="1.5" />
    {/* Viewfinder corners */}
    <g stroke="#5F7846" strokeWidth="2.5" strokeLinecap="round" fill="none">
      <path d="M46 34v-8h8" />
      <path d="M154 34v-8h-8" />
      <path d="M46 102v8h8" />
      <path d="M154 102v8h-8" />
    </g>
    {/* Head and shoulders */}
    <ellipse cx="100" cy="64" rx="24" ry="29" fill="#E6EBDF" />
    <path d="M62 124c4-20 20-30 38-30s34 10 38 30" fill="#E6EBDF" />
    {/* Glasses */}
    <g stroke="#111111" strokeWidth="2.2" fill="#FFFFFF" fillOpacity="0.6">
      <rect x="77" y="56" width="19" height="14" rx="6" />
      <rect x="104" y="56" width="19" height="14" rx="6" />
    </g>
    <path d="M96 62c2.5-2 5.5-2 8 0" stroke="#111111" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    {/* Camera badge */}
    <circle cx="160" cy="118" r="20" fill="#111111" />
    <rect x="150" y="111" width="20" height="14" rx="3.5" fill="none" stroke="#FFFFFF" strokeWidth="2" />
    <circle cx="160" cy="118" r="3.8" fill="none" stroke="#FFFFFF" strokeWidth="2" />
    <path d="M155 111l2-3h6l2 3" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

interface ARFaceTryOnProps {
  frames: OpticalFrame[];
  activeFrame: OpticalFrame;
  onSelectFrame: (frame: OpticalFrame) => void;
  onClose?: () => void;
  userPd?: number;
}

const DEMO_MODELS = [
  {
    name: 'Model 01 (Wajah Oval)',
    shape: 'Oval',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    eyeLeft: { x: 0.41, y: 0.44 },
    eyeRight: { x: 0.58, y: 0.44 },
  },
  {
    name: 'Model 02 (Wajah Kotak)',
    shape: 'Square',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    eyeLeft: { x: 0.42, y: 0.42 },
    eyeRight: { x: 0.59, y: 0.42 },
  },
  {
    name: 'Model 03 (Wajah Hati)',
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
  const demoImageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackerRef = useRef<OpticalFaceTracker | null>(null);
  // Last good face position: used while locked, and to bridge brief detection dropouts
  const lastLandmarksRef = useRef<TrackedLandmarks | null>(null);
  const lastSeenAtRef = useRef<number>(0);
  const faceDetectedRef = useRef<boolean>(false);

  // Camera states
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<'denied' | 'notfound' | 'busy' | 'unsupported' | 'other' | null>(null);
  // The visitor explicitly chose to try frames on model photos instead of the camera
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isFaceDetected, setIsFaceDetected] = useState<boolean>(false);
  const [trackerStatus, setTrackerStatus] = useState<'loading' | 'ready' | 'error'>('loading');

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

  // Initialize tracker (downloads the MediaPipe model once)
  useEffect(() => {
    let cancelled = false;
    const tracker = new OpticalFaceTracker();
    tracker
      .init()
      .then(() => {
        if (cancelled) return;
        trackerRef.current = tracker;
        setTrackerStatus('ready');
      })
      .catch((err) => {
        console.warn('Face tracker failed to load:', err);
        if (!cancelled) setTrackerStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // A new subject means previous face positions no longer apply
  useEffect(() => {
    lastLandmarksRef.current = null;
  }, [cameraActive, selectedDemoIndex, facingMode]);

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

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('unsupported');
      setCameraLoading(false);
      return;
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
          setDemoMode(false);
        };
      }
    } catch (err: any) {
      console.warn('Camera request error:', err);
      const name = err?.name;
      setCameraError(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'denied'
          : name === 'NotFoundError' || name === 'OverconstrainedError'
          ? 'notfound'
          : name === 'NotReadableError'
          ? 'busy'
          : 'other'
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

      // Match the canvas to its on-screen size so overlay coordinates line up with the
      // video/image (both shown with object-fit: cover). Drawing happens in CSS pixels.
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) {
        // Not laid out yet (e.g. hidden or still mounting)
        animId = requestAnimationFrame(renderAR);
        return;
      }
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const tracker = trackerRef.current;
      const demoImage = demoImageRef.current;
      let tracked: TrackedLandmarks | null = null;

      if (autoTracking && tracker) {
        if (cameraActive && video && video.readyState >= 2) {
          tracked = tracker.track(video, width, height, facingMode === 'user');
        } else if (!cameraActive && demoMode && demoImage?.complete && demoImage.naturalWidth) {
          tracked = tracker.track(demoImage, width, height, false);
        }
      }

      const now = performance.now();
      if (tracked) {
        lastLandmarksRef.current = tracked;
        lastSeenAtRef.current = now;
      }

      // Keep the last position briefly through blinks/dropouts, or indefinitely when locked
      const held =
        lastLandmarksRef.current && (!autoTracking || now - lastSeenAtRef.current < 600)
          ? lastLandmarksRef.current
          : null;

      let landmarks: TrackedLandmarks | null = tracked ?? held;

      if (!landmarks && !cameraActive && demoMode && (!tracker || !autoTracking)) {
        // Tracker unavailable on a demo photo: fall back to the preset eye positions
        const demo = DEMO_MODELS[selectedDemoIndex];
        landmarks = landmarksFromEyes(
          { x: width * demo.eyeLeft.x, y: height * demo.eyeLeft.y },
          { x: width * demo.eyeRight.x, y: height * demo.eyeRight.y },
          width * 0.35
        );
      }

      const detectedNow = landmarks !== null;
      if (detectedNow !== faceDetectedRef.current) {
        faceDetectedRef.current = detectedNow;
        setIsFaceDetected(detectedNow);
      }

      if (!landmarks) {
        animId = requestAnimationFrame(renderAR);
        return;
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
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
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

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '500 11px "Instrument Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`PD ${userPd}mm · Terkalibrasi`, centerX, centerY - 34);

        ctx.restore();
      }

      // Render Virtual Haute Eyewear
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);

      // Real-world scale: the pupils are userPd mm apart, so size the frame from its mm dimensions
      const pxPerMm = (eyeDistance / userPd) * scaleMultiplier;
      const rimRadius = (activeFrame.dimensions.lensWidth / 2) * pxPerMm;
      const rimSpacing = ((activeFrame.dimensions.lensWidth + activeFrame.dimensions.bridgeWidth) / 2) * pxPerMm;

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
        ctx.arc(xOffset, -1, Math.max(0, rimRadius - 1.2), Math.PI * 1.1, Math.PI * 1.55);
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
    demoMode,
    facingMode,
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

    // Draw the background exactly as it appears on screen (object-fit: cover, optional mirror)
    const drawCover = (source: CanvasImageSource, srcW: number, srcH: number, mirror: boolean) => {
      const { scale, offsetX, offsetY } = coverTransform(srcW, srcH, offscreen.width, offscreen.height);
      ctx.save();
      if (mirror) {
        ctx.translate(offscreen.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(source, offsetX, offsetY, srcW * scale, srcH * scale);
      ctx.restore();
    };

    const finalize = () => {
      ctx.drawImage(canvas, 0, 0);
      drawWatermark(ctx, offscreen.width, offscreen.height);
      setCapturedSnapshot(offscreen.toDataURL('image/jpeg', 0.95));
      setIsCapturing(false);
    };

    if (cameraActive && videoRef.current) {
      const v = videoRef.current;
      drawCover(v, v.videoWidth, v.videoHeight, facingMode === 'user');
      finalize();
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = DEMO_MODELS[selectedDemoIndex].url;
      img.onload = () => {
        drawCover(img, img.naturalWidth, img.naturalHeight, false);
        finalize();
      };
    }
  };

  const drawWatermark = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // The snapshot is at device-pixel resolution; scale the caption to match
    const k = window.devicePixelRatio || 1;
    const barHeight = 64 * k;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    ctx.fillRect(0, h - barHeight, w, barHeight);

    ctx.fillStyle = '#E7E7E7';
    ctx.fillRect(0, h - barHeight, w, 1 * k);

    ctx.fillStyle = '#111111';
    ctx.font = `500 ${16 * k}px "Instrument Sans", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('FrameAI', 24 * k, h - 36 * k);

    ctx.fillStyle = '#6E6E6E';
    ctx.font = `${12 * k}px "Instrument Sans", sans-serif`;
    ctx.fillText(`${activeFrame.name} · ${activeColor.name}`, 24 * k, h - 18 * k);

    ctx.fillStyle = '#5F7846';
    ctx.font = `500 ${12 * k}px "Instrument Sans", sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText('Coba Virtual AR', w - 24 * k, h - 36 * k);

    ctx.fillStyle = '#6E6E6E';
    ctx.font = `${11 * k}px "Instrument Sans", sans-serif`;
    ctx.fillText(new Date().toLocaleDateString('id-ID'), w - 24 * k, h - 18 * k);
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
    <div className="relative w-full max-w-5xl mx-auto rounded-3xl overflow-hidden bg-soft border border-line shadow-float">
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              cameraActive && isFaceDetected
                ? 'bg-emerald-500 animate-pulse'
                : cameraActive
                ? 'bg-ink-soft'
                : 'bg-faint'
            }`}
          />
          <span className="hidden sm:inline text-sm font-medium text-ink">
            Coba AR Real-Time
          </span>
          <span className="text-xs text-sage bg-sage-tint border border-sage-line px-2 py-0.5 rounded-full tabular-nums">
            {!cameraActive && !demoMode
              ? 'Kamera belum aktif'
              : trackerStatus === 'loading'
              ? 'Memuat pelacak wajah...'
              : trackerStatus === 'error'
              ? 'Pelacak gagal dimuat · geser manual'
              : !cameraActive
              ? 'Mode foto model'
              : isFaceDetected
              ? 'Wajah Terdeteksi'
              : 'Mencari Wajah...'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {cameraActive && (
            <button
              onClick={toggleFacingMode}
              title="Putar Kamera Depan / Belakang"
              aria-label="Ganti kamera"
              className="p-2 rounded-full bg-white/80 hover:bg-soft-strong text-body transition-colors"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              aria-label="Tutup Studio AR"
              className="p-2 rounded-full bg-white/80 hover:bg-soft-strong text-body transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="relative w-full aspect-[4/3] md:aspect-[16/10] bg-white flex items-center justify-center overflow-hidden select-none">
        {/* Live Camera Video Stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''} ${
            cameraActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Fallback Demo Model Portrait */}
        {!cameraActive && demoMode && (
          <img
            ref={demoImageRef}
            crossOrigin="anonymous"
            src={DEMO_MODELS[selectedDemoIndex].url}
            alt={DEMO_MODELS[selectedDemoIndex].name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Real-Time Optical Canvas Overlay */}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="absolute inset-0 w-full h-full z-10 cursor-move"
          title="Geser langsung untuk menyesuaikan posisi kacamata"
        />

        {/* Shutter Animation */}
        {isCapturing && <div className="absolute inset-0 bg-white z-40 animate-out fade-out duration-300" />}

        {/* No camera yet: explain why we need it instead of showing a stand-in */}
        {!cameraActive && !demoMode && (
          <div className="absolute inset-0 z-30 bg-soft flex items-center justify-center p-6">
            <div className="max-w-sm text-center space-y-5">
              <CameraPermissionIllustration />
              <div className="space-y-2">
                <h3 className="text-2xl font-normal tracking-[-0.03em] text-ink">
                  {cameraLoading ? 'Menunggu izin kamera...' : 'Aktifkan kamera untuk mencoba kacamata'}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {cameraLoading
                    ? 'Pilih "Izinkan" pada pop-up browser untuk melanjutkan.'
                    : cameraError === 'denied'
                    ? 'Akses kamera diblokir. Klik ikon kamera atau gembok di address bar browser, pilih Izinkan, lalu coba lagi.'
                    : cameraError === 'notfound'
                    ? 'Kamera tidak ditemukan di perangkat ini. Sambungkan kamera, atau coba dengan foto model.'
                    : cameraError === 'busy'
                    ? 'Kamera sedang dipakai aplikasi lain. Tutup aplikasi tersebut, lalu coba lagi.'
                    : cameraError === 'unsupported'
                    ? 'Browser ini tidak mendukung akses kamera. Coba dengan browser lain, atau gunakan foto model.'
                    : 'Fitur ini butuh akses kamera untuk menampilkan kacamata langsung di wajahmu. Video diproses di perangkatmu dan tidak diunggah.'}
                </p>
              </div>
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={startCamera}
                  disabled={cameraLoading || cameraError === 'unsupported'}
                  className="h-12 px-6 rounded-full bg-ink hover:bg-ink-soft text-white text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  {cameraError ? 'Coba lagi' : 'Izinkan akses kamera'}
                </button>
                <button onClick={() => setDemoMode(true)} className="text-sm text-muted hover:text-ink underline-offset-4 hover:underline">
                  Coba dengan foto model
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Model-photo mode: switch models or go back to the live camera */}
        {!cameraActive && demoMode && (
          <div className="absolute top-16 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 bg-white/85 backdrop-blur-md border border-line p-3 rounded-2xl shadow-card">
            <span className="hidden sm:inline text-xs text-body">Kamu mencoba dengan foto model.</span>
            <div className="flex items-center gap-2">
              <button
                onClick={startCamera}
                disabled={cameraLoading}
                className="px-3.5 py-1.5 rounded-full bg-ink hover:bg-ink-soft text-white font-medium text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5" />
                {cameraLoading ? 'Memuat...' : 'Pakai kamera'}
              </button>
              <div className="flex gap-1 bg-white p-1 rounded-full border border-line">
                {DEMO_MODELS.map((m, idx) => (
                  <button
                    key={m.name}
                    onClick={() => setSelectedDemoIndex(idx)}
                    className={`px-2.5 py-0.5 text-xs rounded-full transition-colors ${
                      selectedDemoIndex === idx ? 'bg-ink text-white' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {faceShapeLabel(m.shape)}
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
            className="md:hidden order-last self-start px-3 py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-line text-[11px] font-medium text-sage flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {showCalibrationMobile ? 'Tutup' : 'Kalibrasi'}
          </button>
          <div className={`${showCalibrationMobile ? 'flex' : 'hidden'} md:flex bg-white/85 backdrop-blur-md border border-line p-2.5 rounded-2xl text-xs flex-col gap-2 shadow-float`}>
            <div className="flex items-center justify-between gap-2 border-b border-line pb-1.5">
              <span className="text-[10px] font-medium text-sage">
                Kalibrasi Fit
              </span>
              <button
                onClick={() => setAutoTracking((p) => !p)}
                title={autoTracking ? 'Kunci Posisi Manual' : 'Aktifkan Pelacakan Otomatis'}
                className="text-[10px] text-muted hover:text-ink flex items-center gap-1"
              >
                {autoTracking ? <Unlock className="w-3 h-3 text-emerald-700" /> : <Lock className="w-3 h-3 text-sage" />}
                {autoTracking ? 'Otomatis' : 'Terkunci'}
              </button>
            </div>

            {/* Scale adjustments */}
            <div className="flex items-center justify-between gap-3 text-body">
              <span>Ukuran:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setScaleMultiplier((s) => Math.max(0.75, s - 0.05))}
                  className="w-6 h-6 rounded bg-soft-strong hover:bg-line-strong flex items-center justify-center font-medium"
                >
                  -
                </button>
                <span className="text-[11px] tabular-nums w-8 text-center">
                  {(scaleMultiplier * 100).toFixed(0)}%
                </span>
                <button
                  onClick={() => setScaleMultiplier((s) => Math.min(1.3, s + 0.05))}
                  className="w-6 h-6 rounded bg-soft-strong hover:bg-line-strong flex items-center justify-center font-medium"
                >
                  +
                </button>
              </div>
            </div>

            {/* Height adjustment */}
            <div className="flex items-center justify-between gap-3 text-body">
              <span>Tinggi Hidung:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setManualOffset((prev) => ({ ...prev, y: prev.y - 3 }))}
                  className="w-6 h-6 rounded bg-soft-strong hover:bg-line-strong flex items-center justify-center font-medium"
                >
                  ▲
                </button>
                <button
                  onClick={() => setManualOffset((prev) => ({ ...prev, y: prev.y + 3 }))}
                  className="w-6 h-6 rounded bg-soft-strong hover:bg-line-strong flex items-center justify-center font-medium"
                >
                  ▼
                </button>
              </div>
            </div>

            {/* Reset offset button */}
            {(manualOffset.x !== 0 || manualOffset.y !== 0) && (
              <button
                onClick={() => setManualOffset({ x: 0, y: 0 })}
                className="text-[10px] text-sage hover:underline text-center"
              >
                Reset Posisi Tengah
              </button>
            )}

            <button
              onClick={() => setShowPdGuides((p) => !p)}
              className={`text-[11px] py-1 px-2 rounded-full text-center transition-colors ${
                showPdGuides ? 'bg-sage-tint text-sage font-medium' : 'text-muted hover:bg-soft-strong'
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
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white p-1 flex items-center justify-center shadow-float hover:scale-105 active:scale-95 transition-all group"
          >
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-ink flex items-center justify-center group-hover:bg-ink transition-colors">
              <Camera className="w-5 h-5 text-ink group-hover:text-white" />
            </div>
          </button>
          <span className="hidden md:inline px-2 py-0.5 rounded-full bg-white/85 text-xs text-ink">Foto</span>
        </div>
      </div>

      {/* Snapshot Preview Modal */}
      {capturedSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white border border-line rounded-3xl overflow-hidden shadow-float">
            <div className="p-4 flex items-center justify-between border-b border-line">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sage" />
                <h3 className="font-medium text-ink">Hasil Fitting AR Anda</h3>
              </div>
              <button
                onClick={() => {
                  setCapturedSnapshot(null);
                  setIsSaved(false);
                }}
                aria-label="Tutup hasil foto"
                className="p-1 rounded-full hover:bg-soft-strong text-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <img
                src={capturedSnapshot}
                alt="Hasil foto try-on"
                className="w-full rounded-2xl border border-line shadow-inner"
              />
            </div>

            <div className="p-4 bg-soft flex items-center justify-between gap-3">
              <button
                onClick={handleDownloadSnapshot}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-soft-strong hover:bg-line-strong text-ink font-medium text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                Unduh Kartu
              </button>

              <button
                onClick={handleSaveLook}
                disabled={isSaving || isSaved}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full font-medium text-sm transition-all ${
                  isSaved
                    ? 'bg-emerald-600 text-ink'
                    : 'bg-ink hover:bg-ink-soft text-white font-medium'
                }`}
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Tersimpan di Koleksi
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
      <div className="p-4 bg-soft border-t border-line">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
          <div>
            <h4 className="font-display text-lg font-medium text-ink tracking-wide">{activeFrame.name}</h4>
            <p className="text-xs text-muted">
              {frameShapeLabel(activeFrame.shape)} · {materialLabel(activeFrame.material)} · {formatRupiah(activeFrame.price)}
            </p>
          </div>

          {/* Color & Tint Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Color Swatches */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-line">
              {activeFrame.colors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setActiveColor(c)}
                  title={c.name}
                  aria-label={`Pilih warna frame ${c.name}`}
                  className={`w-6 h-6 rounded-full transition-all border ${
                    activeColor.name === c.name ? 'ring-2 ring-ink scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex, borderColor: 'rgba(255,255,255,0.2)' }}
                />
              ))}
            </div>

            {/* Lens Tint Toggles */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-line text-xs">
              <button
                onClick={() => setLensTint('clear')}
                className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all ${
                  lensTint === 'clear' ? 'bg-ink text-white font-medium' : 'text-muted'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Bening
              </button>
              <button
                onClick={() => setLensTint('blue_light')}
                className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all ${
                  lensTint === 'blue_light' ? 'bg-ink text-white font-medium' : 'text-muted'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Filter Biru
              </button>
              <button
                onClick={() => setLensTint('sun')}
                className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all ${
                  lensTint === 'sun' ? 'bg-ink text-white font-medium' : 'text-muted'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                Sun Polarized
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
                    ? 'bg-sage-tint border-sage-line ring-1 ring-ink/20'
                    : 'bg-white/60 border-line hover:border-line-strong'
                }`}
              >
                <img src={f.imageUrl} alt={f.name} className="w-14 h-10 object-cover rounded-xl bg-soft" />
                <div className="pr-2">
                  <div className="text-xs font-medium text-ink truncate max-w-[120px]">{f.name}</div>
                  <div className="text-[11px] text-muted">{formatRupiah(f.price)}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
