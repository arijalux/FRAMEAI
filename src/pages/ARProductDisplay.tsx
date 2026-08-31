import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Product, FrameShape } from '../types';
import { ARAnalytics } from '../services/analyticsService';
import { ARMarkerTarget } from '../components/ui/ARMarkerTarget';
import { ARPrintableStandee } from '../components/ui/ARPrintableStandee';
import { ARMarkerDetector, ARMarkerPoseFilter, ARMarkerPose } from '../services/arMarkerTracker';
import { renderARSpatialScene } from '../services/arEyewearRenderer';
import {
  Camera,
  RefreshCw,
  Ruler,
  ShoppingBag,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Share2,
  RotateCw,
  Info,
  ChevronRight,
  Box,
  Smartphone,
  Printer,
  Sparkles,
  Check,
  Sliders,
  Maximize2,
  Bug,
  HelpCircle,
  Play,
  RotateCcw,
} from 'lucide-react';

interface ARProductDisplayProps {
  productId?: string;
}

export type ARTrackingState =
  | 'IDLE'
  | 'CAMERA_STARTING'
  | 'SEARCHING_FOR_MARKER'
  | 'MARKER_DETECTED'
  | 'MARKER_LOST'
  | 'ERROR'
  | 'UNSUPPORTED';

export const ARProductDisplay: React.FC<ARProductDisplayProps> = ({ productId }) => {
  const { products, navigate, addToCart, currentPath } = useApp();

  // Find target product
  const activeProduct =
    products.find((p) => p.id === productId) ||
    products[0] || {
      id: 'frame-the-architect',
      name: 'The Architect',
      frameShape: 'Rectangle' as FrameShape,
      material: 'Italian Acetate',
      price: 1450000,
      sellerName: 'Optik Melati',
      sellerLocation: 'Bandung',
      thumbnail: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80',
      frameColors: [
        { name: 'Onyx Black', hex: '#1A1A1A', texture: 'glossy' },
        { name: 'Smoked Amber', hex: '#8B5A2B', texture: 'tortoise' },
      ],
      dimensions: { lensWidth: 51, bridgeWidth: 19, templeLength: 145, frameWidth: 138, lensHeight: 40 },
    };

  // URL Query Parameters Parsing
  const urlParams = useMemo(() => {
    try {
      const search = window.location.search || (currentPath.includes('?') ? '?' + currentPath.split('?')[1] : '');
      return new URLSearchParams(search);
    } catch {
      return new URLSearchParams();
    }
  }, [currentPath]);

  const forceMobileModeParam = urlParams.get('mode') === 'mobileAR';
  const debugParam = urlParams.get('debugAR') === 'true';

  // Device & Mode Detection
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(() => {
    if (forceMobileModeParam) return true;
    if (typeof window !== 'undefined') {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      return window.innerWidth < 768 || hasTouch;
    }
    return false;
  });

  const [overrideToMobileAR, setOverrideToMobileAR] = useState<boolean>(forceMobileModeParam);

  // Active View Mode: 'desktop' or 'mobileAR'
  const isMobileAR = overrideToMobileAR || isMobileDevice;

  // AR Tracking State Machine (Explicit States)
  const [trackingState, setTrackingState] = useState<ARTrackingState>('IDLE');
  const [selectedColor, setSelectedColor] = useState<string>(
    activeProduct.frameColors?.[0]?.name || 'Onyx Black'
  );
  const [showDimensions, setShowDimensions] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState<boolean>(false);
  const [isDebugOpen, setIsDebugOpen] = useState<boolean>(debugParam || true);
  const [addedToast, setAddedToast] = useState<boolean>(false);

  // Live Marker Pose
  const [currentPose, setCurrentPose] = useState<ARMarkerPose | null>(null);
  const [fps, setFps] = useState<number>(0);

  // Optical physical dimensions in millimeters
  const frameWidthMm = activeProduct.frameWidthMm || activeProduct.dimensions?.frameWidth || 138;
  const lensWidthMm = activeProduct.lensWidthMm || activeProduct.dimensions?.lensWidth || 51;
  const lensHeightMm = activeProduct.lensHeightMm || activeProduct.dimensions?.lensHeight || 40;
  const bridgeWidthMm = activeProduct.bridgeWidthMm || activeProduct.dimensions?.bridgeWidth || 19;
  const templeLengthMm = activeProduct.templeLengthMm || activeProduct.dimensions?.templeLength || 145;
  const physicalTargetSizeMm = activeProduct.targetWidthMm || 100; // 100mm standard calibrated marker

  const currentColorHex =
    activeProduct.frameColors?.find((c) => c.name === selectedColor)?.hex || '#1A1A1A';

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const detectorRef = useRef<ARMarkerDetector | null>(null);
  const poseFilterRef = useRef<ARMarkerPoseFilter>(new ARMarkerPoseFilter(0.58));
  const animationFrameRef = useRef<number | null>(null);
  const lostTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fpsCountRef = useRef<{ frames: number; lastTime: number }>({ frames: 0, lastTime: performance.now() });

  // Mobile Deep Link URL for QR
  const mobileDeepLinkUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://frameai.id';
    return `${origin}/ar-display/${activeProduct.id}?mode=mobileAR`;
  }, [activeProduct.id]);

  // Analytics: Track AR Product Display opened
  useEffect(() => {
    ARAnalytics.arDisplayOpened({
      productId: activeProduct.id,
      productName: activeProduct.name,
      sellerId: activeProduct.sellerId,
    });
  }, [activeProduct.id]);

  // Window Resize Listener for Responsive Mode
  useEffect(() => {
    const handleResize = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobileDevice(window.innerWidth < 768 || hasTouch);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize Marker Detector
  useEffect(() => {
    detectorRef.current = new ARMarkerDetector(physicalTargetSizeMm);
  }, [physicalTargetSizeMm]);

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    setTrackingState('CAMERA_STARTING');
    poseFilterRef.current.reset();
    if (lostTimeoutRef.current) {
      clearTimeout(lostTimeoutRef.current);
    }

    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setTrackingState('UNSUPPORTED');
        setCameraError('WebRTC camera access is not supported in this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setTrackingState('SEARCHING_FOR_MARKER');
      }
    } catch (err: any) {
      console.warn('AR Camera access error:', err);
      setCameraError(err.message || 'Camera permission denied or device unavailable.');
      setTrackingState('ERROR');
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (lostTimeoutRef.current) {
      clearTimeout(lostTimeoutRef.current);
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setCurrentPose(null);
    setTrackingState('IDLE');
  };

  // Cleanup on unmount or mode switch
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  // Computer Vision AR Processing Loop
  useEffect(() => {
    if (
      trackingState === 'IDLE' ||
      trackingState === 'CAMERA_STARTING' ||
      trackingState === 'ERROR' ||
      trackingState === 'UNSUPPORTED'
    ) {
      return;
    }

    let isRunning = true;
    let consecutiveLostFrames = 0;

    const processFrame = () => {
      if (!isRunning) return;

      // Calculate FPS
      fpsCountRef.current.frames++;
      const now = performance.now();
      if (now - fpsCountRef.current.lastTime >= 1000) {
        setFps(fpsCountRef.current.frames);
        fpsCountRef.current.frames = 0;
        fpsCountRef.current.lastTime = now;
      }

      const video = videoRef.current;
      const viewport = viewportRef.current;
      const canvas = canvasRef.current;
      const detector = detectorRef.current;

      if (video && viewport && canvas && detector && video.readyState >= 2) {
        const containerWidth = viewport.clientWidth || window.innerWidth;
        const containerHeight = viewport.clientHeight || window.innerHeight;

        // Ensure canvas size matches container exactly
        if (canvas.width !== containerWidth || canvas.height !== containerHeight) {
          canvas.width = containerWidth;
          canvas.height = containerHeight;
        }

        const ctx = canvas.getContext('2d');

        // Perform genuine computer vision marker detection
        const rawPose = detector.detect(video, containerWidth, containerHeight);
        const smoothedPose = poseFilterRef.current.update(rawPose, now);

        if (smoothedPose && smoothedPose.isDetected && smoothedPose.isValid) {
          consecutiveLostFrames = 0;
          if (lostTimeoutRef.current) {
            clearTimeout(lostTimeoutRef.current);
          }
          setCurrentPose(smoothedPose);
          setTrackingState('MARKER_DETECTED');

          // Render Spatially Anchored Eyewear ONLY when MARKER_DETECTED
          if (ctx) {
            renderARSpatialScene(ctx, containerWidth, containerHeight, smoothedPose, {
              frameWidthMm,
              lensWidthMm,
              lensHeightMm,
              bridgeWidthMm,
              templeLengthMm,
              frameShape: activeProduct.frameShape,
              colorHex: currentColorHex,
              showDimensions,
              isDebug: isDebugOpen,
            });
          }

          ARAnalytics.arTargetDetected({
            productId: activeProduct.id,
            productName: activeProduct.name,
            targetDimensionMm: physicalTargetSizeMm,
          });
        } else {
          consecutiveLostFrames++;
          // Immediately hide eyewear and transition when marker is lost
          if (consecutiveLostFrames >= 2) {
            setCurrentPose(null);
            if (ctx) {
              ctx.clearRect(0, 0, containerWidth, containerHeight);
            }

            if (trackingState === 'MARKER_DETECTED') {
              setTrackingState('MARKER_LOST');
              if (lostTimeoutRef.current) {
                clearTimeout(lostTimeoutRef.current);
              }
              lostTimeoutRef.current = setTimeout(() => {
                setTrackingState((current) =>
                  current === 'MARKER_LOST' ? 'SEARCHING_FOR_MARKER' : current
                );
              }, 1800);
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    animationFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    trackingState,
    activeProduct.id,
    activeProduct.frameShape,
    currentColorHex,
    physicalTargetSizeMm,
    frameWidthMm,
    lensWidthMm,
    lensHeightMm,
    bridgeWidthMm,
    templeLengthMm,
    showDimensions,
    isDebugOpen,
  ]);

  // Scale calculation
  const scaleRatio = frameWidthMm / physicalTargetSizeMm;

  const handleAddToCart = () => {
    addToCart(activeProduct, selectedColor);
    ARAnalytics.arDisplayAddedToCart({
      productId: activeProduct.id,
      productName: activeProduct.name,
      selectedColor,
      price: activeProduct.price,
    });
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  const handleTransitionToFaceTryOn = () => {
    ARAnalytics.arFaceTryOnStartedFromDisplay({
      productId: activeProduct.id,
      productName: activeProduct.name,
    });
    navigate(`/try-on/${activeProduct.id}`);
  };

  const handleBackNavigation = () => {
    // If camera is currently active, stop it first
    if (trackingState !== 'IDLE') {
      stopCamera();
      setTrackingState('IDLE');
      return;
    }

    // If desktop user clicked 'Open on This Device' to test mobile AR view, return to desktop AR view
    if (overrideToMobileAR && !isMobileDevice) {
      setOverrideToMobileAR(false);
      stopCamera();
      return;
    }

    // Navigate cleanly back to product detail page or explore catalog
    if (activeProduct && activeProduct.id) {
      navigate(`/product/${activeProduct.id}`);
    } else {
      navigate('/explore');
    }
  };

  // =========================================================================
  // RENDER 1: DESKTOP / LAPTOP EXPERIENCE (QR Code + Printable 100mm Marker)
  // =========================================================================
  if (!isMobileAR) {
    return (
      <div className="min-h-screen bg-[#0F0E0D] text-white flex flex-col font-sans selection:bg-orange-600 selection:text-white" id="ar-desktop-display-view">
        {/* Top Navbar */}
        <header className="px-6 lg:px-12 py-5 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackNavigation}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition-all cursor-pointer shadow-md"
              title="Back"
              id="ar-desktop-back-btn"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400 bg-orange-950/80 border border-orange-500/30 px-2.5 py-0.5 rounded-full">
                  AR Product Display
                </span>
                <span className="text-[11px] text-white/50 hidden sm:inline-block">
                  • 1:1 Real-Size Physical Object Preview
                </span>
              </div>
              <h1 className="text-xl font-serif italic text-white mt-0.5">
                {activeProduct.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold cursor-pointer transition-all"
              id="desktop-print-marker-btn"
            >
              <Printer size={15} className="text-orange-400" />
              <span>Print AR Marker</span>
            </button>
            <button
              onClick={() => {
                setOverrideToMobileAR(true);
                startCamera();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              id="desktop-open-on-device-btn"
            >
              <Camera size={15} />
              <span>Open on This Device</span>
            </button>
          </div>
        </header>

        {/* Main Desktop Container */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 lg:px-12 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Product Showcase & Dimensions */}
          <div className="lg:col-span-6 space-y-6">
            <div className="relative rounded-3xl overflow-hidden bg-[#181615] border border-white/10 p-8 shadow-2xl group">
              {/* Product Thumbnail */}
              <div className="aspect-4/3 rounded-2xl overflow-hidden bg-black/40 relative flex items-center justify-center p-6">
                <img
                  src={activeProduct.thumbnail || activeProduct.images?.[0]}
                  alt={activeProduct.name}
                  className="w-full h-full object-contain filter drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 text-[10px] font-mono uppercase tracking-wider text-orange-400">
                  {activeProduct.category}
                </div>
              </div>

              {/* Colorways */}
              <div className="mt-6 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider block">
                    Select Colorway
                  </span>
                  <span className="text-sm font-semibold text-white">{selectedColor}</span>
                </div>

                <div className="flex items-center gap-2">
                  {activeProduct.frameColors?.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c.name)}
                      className={`w-7 h-7 rounded-full transition-all flex items-center justify-center cursor-pointer border-2 ${
                        selectedColor === c.name ? 'border-orange-500 scale-110' : 'border-white/30'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {selectedColor === c.name && <Check size={12} className="text-white drop-shadow-sm" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Optical Physical Dimensions Grid */}
            <div className="bg-[#181615] border border-white/10 rounded-2xl p-5 space-y-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-orange-400 block">
                Official Optical Dimensions (1:1 Ratio)
              </span>
              <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs">
                <div className="p-2.5 bg-black/30 rounded-xl border border-white/5">
                  <span className="text-[9px] uppercase text-white/40 block">Frame Width</span>
                  <span className="text-sm font-bold text-orange-300">{frameWidthMm} mm</span>
                </div>
                <div className="p-2.5 bg-black/30 rounded-xl border border-white/5">
                  <span className="text-[9px] uppercase text-white/40 block">Lens</span>
                  <span className="text-sm font-bold text-white">{lensWidthMm} mm</span>
                </div>
                <div className="p-2.5 bg-black/30 rounded-xl border border-white/5">
                  <span className="text-[9px] uppercase text-white/40 block">Bridge</span>
                  <span className="text-sm font-bold text-white">{bridgeWidthMm} mm</span>
                </div>
                <div className="p-2.5 bg-black/30 rounded-xl border border-white/5">
                  <span className="text-[9px] uppercase text-white/40 block">Temple</span>
                  <span className="text-sm font-bold text-white">{templeLengthMm} mm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Scan with Phone QR & AR Marker Reference */}
          <div className="lg:col-span-6 bg-[#181615] border border-white/15 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-8">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-orange-400 block">
                PHYSICAL AR EXPERIENCE
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif italic text-white mt-1">
                View This Product in AR
              </h2>
              <p className="text-sm text-white/70 mt-2 leading-relaxed">
                Scan the QR code with your smartphone to launch the live camera and view this frame anchored at true 1:1 scale on your table.
              </p>
            </div>

            {/* QR Code and Target Marker Showcase */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center bg-black/40 p-6 rounded-2xl border border-white/10">
              {/* 1. QR Code */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-white rounded-2xl shadow-lg border border-neutral-200">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                      mobileDeepLinkUrl
                    )}&format=svg&margin=3`}
                    alt="Scan for Mobile AR"
                    className="w-36 h-36 object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <span className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                    <Smartphone size={14} className="text-orange-400" />
                    Scan with Phone
                  </span>
                  <p className="text-[10px] text-white/50 mt-0.5">Deep-links directly to AR</p>
                </div>
              </div>

              {/* 2. 100mm Target Reference */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-1 bg-white rounded-2xl shadow-lg border border-neutral-200">
                  <ARMarkerTarget sizeMm={100} pixelSize={144} showRuler={false} />
                </div>
                <div>
                  <span className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                    <Box size={14} className="text-orange-400" />
                    100mm Marker
                  </span>
                  <p className="text-[10px] text-white/50 mt-0.5">Physical optical reference</p>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setIsPrintModalOpen(true)}
                  className="w-full py-3.5 px-4 bg-white/10 hover:bg-white/20 border border-white/15 rounded-full text-xs font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Printer size={15} />
                  <span>Print AR Standee Card</span>
                </button>

                <button
                  onClick={() => {
                    setOverrideToMobileAR(true);
                    startCamera();
                  }}
                  className="w-full py-3.5 px-4 bg-orange-600 hover:bg-orange-700 rounded-full text-xs font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
                >
                  <Camera size={15} />
                  <span>Open AR on This Device</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleTransitionToFaceTryOn}
                  className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <UserCheck size={14} />
                  <span>Or Try On My Face (Face AR)</span>
                  <ChevronRight size={13} />
                </button>

                <button
                  onClick={handleAddToCart}
                  className="px-5 py-2.5 bg-white text-black hover:bg-neutral-200 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Printable Standee Sheet Modal */}
        <ARPrintableStandee
          product={activeProduct}
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          mobileUrl={mobileDeepLinkUrl}
        />
      </div>
    );
  }

  // =========================================================================
  // RENDER 2: MOBILE AR INITIAL LANDING SCREEN (BEFORE Camera Starts)
  // =========================================================================
  if (trackingState === 'IDLE') {
    return (
      <div className="min-h-screen bg-[#0E0D0C] text-white flex flex-col font-sans selection:bg-orange-600 selection:text-white overflow-y-auto overscroll-y-contain" id="ar-mobile-initial-view">
        {/* Header */}
        <header className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/70 backdrop-blur-md sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackNavigation}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 flex items-center justify-center transition-all cursor-pointer shadow-sm text-white"
              title="Back"
              id="ar-mobile-back-btn"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400 block">
                FRAMEAI AR
              </span>
              <h1 className="text-base font-serif italic text-white leading-tight">
                AR Product Display
              </h1>
            </div>
          </div>

          <button
            onClick={() => setIsSpecsModalOpen(true)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 flex items-center justify-center transition-all text-white/80 cursor-pointer shadow-sm"
            title="Specs"
          >
            <Info size={18} />
          </button>
        </header>

        {/* Content Body */}
        <main className="flex-1 px-4 sm:px-6 py-6 flex flex-col justify-between max-w-lg mx-auto w-full space-y-6 pb-12">
          {/* Product Summary Card */}
          <div className="bg-[#181615] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex gap-4 items-center">
              <div className="w-24 h-24 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center p-2 shrink-0">
                <img
                  src={activeProduct.thumbnail || activeProduct.images?.[0]}
                  alt={activeProduct.name}
                  className="w-full h-full object-contain filter drop-shadow-md"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider block">
                  {activeProduct.sellerName} • {activeProduct.sellerLocation}
                </span>
                <h2 className="text-xl font-serif italic text-white leading-snug">
                  {activeProduct.name}
                </h2>
                <p className="text-base font-serif italic text-orange-300 font-bold">
                  Rp {activeProduct.price.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* Key Dimension Callouts */}
            <div className="grid grid-cols-2 gap-2 text-center font-mono text-xs pt-1">
              <div className="p-2.5 bg-black/40 rounded-xl border border-white/5">
                <span className="text-[9px] uppercase text-white/40 block">Frame Width</span>
                <span className="text-sm font-bold text-orange-300">{frameWidthMm} mm</span>
              </div>
              <div className="p-2.5 bg-black/40 rounded-xl border border-white/5">
                <span className="text-[9px] uppercase text-white/40 block">Target Ref</span>
                <span className="text-sm font-bold text-emerald-400">{physicalTargetSizeMm} mm</span>
              </div>
            </div>
          </div>

          {/* 3-Step Visual Instruction */}
          <div className="bg-[#181615]/80 border border-white/5 rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-white/60">
              How Real-Size AR Works
            </h3>

            <div className="space-y-3 text-xs text-white/80">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-orange-600/30 text-orange-400 border border-orange-500/40 flex items-center justify-center font-bold text-[11px] shrink-0">
                  1
                </span>
                <p className="leading-relaxed">
                  Place the <strong>100mm FRAMEAI reference marker</strong> flat on a table or surface.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-orange-600/30 text-orange-400 border border-orange-500/40 flex items-center justify-center font-bold text-[11px] shrink-0">
                  2
                </span>
                <p className="leading-relaxed">
                  Tap <strong>Start AR</strong> and allow camera access.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-orange-600/30 text-orange-400 border border-orange-500/40 flex items-center justify-center font-bold text-[11px] shrink-0">
                  3
                </span>
                <p className="leading-relaxed">
                  Point camera at the marker to anchor the eyewear at true <strong>1:1 physical scale</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-semibold text-white/80 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer size={13} className="text-orange-400" />
              <span>Preview or Print 100mm Marker Card</span>
            </button>
          </div>

          {/* Primary CTA: START AR */}
          <div className="space-y-3 pt-2">
            <button
              onClick={startCamera}
              className="w-full py-4 rounded-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-3 transition-all shadow-xl cursor-pointer transform active:scale-98"
              id="ar-start-camera-cta-btn"
            >
              <Play size={18} fill="currentColor" />
              <span>Start AR</span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleTransitionToFaceTryOn}
                className="py-3 px-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold uppercase tracking-wider text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <UserCheck size={14} />
                <span>Try On My Face</span>
              </button>

              <button
                onClick={handleAddToCart}
                className="py-3 px-3 rounded-full bg-white text-black hover:bg-neutral-200 font-bold uppercase tracking-wider text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ShoppingBag size={14} />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        </main>

        {/* Printable Standee Sheet Modal */}
        <ARPrintableStandee
          product={activeProduct}
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          mobileUrl={mobileDeepLinkUrl}
        />

        {/* Specs Modal */}
        {isSpecsModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#1E1B18] border border-white/15 rounded-3xl p-6 text-white space-y-4 shadow-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase font-bold text-orange-400 tracking-widest block">
                    Optical Atelier Specifications
                  </span>
                  <h3 className="text-xl font-serif italic text-white mt-0.5">{activeProduct.name}</h3>
                </div>
                <button
                  onClick={() => setIsSpecsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs bg-black/40 p-4 rounded-2xl border border-white/10">
                <div className="p-2 bg-white/5 rounded-xl">
                  <span className="text-[9px] uppercase text-white/40 block">Frame Width</span>
                  <span className="text-sm font-bold text-orange-300">{frameWidthMm} mm</span>
                </div>
                <div className="p-2 bg-white/5 rounded-xl">
                  <span className="text-[9px] uppercase text-white/40 block">Lens</span>
                  <span className="text-sm font-bold text-white">{lensWidthMm} mm</span>
                </div>
                <div className="p-2 bg-white/5 rounded-xl">
                  <span className="text-[9px] uppercase text-white/40 block">Bridge</span>
                  <span className="text-sm font-bold text-white">{bridgeWidthMm} mm</span>
                </div>
              </div>

              <p className="text-xs text-white/70 leading-relaxed">{activeProduct.description}</p>

              <button
                onClick={() => setIsSpecsModalOpen(false)}
                className="w-full py-3 bg-white text-black font-bold uppercase tracking-wider text-xs rounded-full cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // RENDER 3: ACTIVE MOBILE AR CAMERA & MARKER TRACKING VIEW
  // =========================================================================
  return (
    <div
      className="relative w-full h-screen bg-black text-white select-none overflow-hidden flex flex-col font-sans"
      id="ar-active-camera-view"
    >
      {/* Top Header Bar */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/90 via-black/50 to-transparent backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              stopCamera();
              setTrackingState('IDLE');
            }}
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-md"
            title="Stop AR"
            id="ar-stop-camera-btn"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400 bg-orange-950/80 border border-orange-500/30 px-2 py-0.5 rounded-full">
                AR 1:1 Scale
              </span>
            </div>
            <h1 className="text-sm font-serif italic text-white leading-tight mt-0.5">
              {activeProduct.name}
            </h1>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2">
          {trackingState === 'MARKER_DETECTED' ? (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold backdrop-blur-md bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 shadow-md"
              id="ar-marker-detected-badge"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>● AR TARGET DETECTED</span>
            </div>
          ) : trackingState === 'CAMERA_STARTING' ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold backdrop-blur-md bg-white/10 text-white/80 border border-white/20">
              <RefreshCw size={12} className="animate-spin text-orange-400" />
              <span>STARTING CAMERA...</span>
            </div>
          ) : trackingState === 'MARKER_LOST' ? (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold backdrop-blur-md bg-red-950/90 text-red-300 border border-red-500/50"
              id="ar-marker-lost-badge"
            >
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span>TARGET LOST</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold backdrop-blur-md bg-amber-950/90 text-amber-300 border border-amber-500/50 animate-pulse"
              id="ar-marker-searching-badge"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>SEARCHING FOR FRAMEAI MARKER</span>
            </div>
          )}

          {/* Switch Camera Button */}
          <button
            onClick={() => {
              setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
            }}
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center transition-all cursor-pointer"
            title="Switch Camera"
          >
            <RefreshCw size={16} />
          </button>

          {/* Debug Toggle */}
          <button
            onClick={() => setIsDebugOpen((prev) => !prev)}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
              isDebugOpen
                ? 'bg-orange-600 border-orange-400 text-white'
                : 'bg-white/15 hover:bg-white/25 border-white/20 text-white/70'
            }`}
            title="Debug HUD"
          >
            <Bug size={16} />
          </button>
        </div>
      </header>

      {/* Camera Viewport Stage */}
      <div
        ref={viewportRef}
        className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden"
        id="ar-viewport-stage"
      >
        {/* Live Video Feed */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover z-0"
        />

        {/* Spatial AR Canvas Overlay (Renders Eyewear Spatially Anchored on Physical Marker) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
          id="ar-spatial-canvas"
        />

        {/* Searching / Lost Guide Overlay (When Marker is Not Detected) */}
        {trackingState !== 'MARKER_DETECTED' && (
          <div className="absolute z-10 inset-0 flex flex-col items-center justify-center pointer-events-none p-6 text-center">
            {/* Center Registration Reticle */}
            <div className="w-56 h-56 rounded-3xl border-2 border-dashed border-orange-400/60 flex items-center justify-center relative animate-pulse">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-orange-500" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-orange-500" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-orange-500" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-orange-500" />

              <div className="w-12 h-12 rounded-full border border-orange-400/40 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-orange-400" />
              </div>
            </div>

            {/* Prompt Instruction Banner */}
            <div className="mt-8 bg-black/85 backdrop-blur-md border border-orange-500/40 px-5 py-3 rounded-2xl max-w-xs shadow-2xl space-y-1">
              <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                {trackingState === 'MARKER_LOST'
                  ? 'TARGET LOST'
                  : trackingState === 'CAMERA_STARTING'
                  ? 'STARTING CAMERA'
                  : 'SEARCHING FOR FRAMEAI MARKER'}
              </p>
              <p className="text-[11px] text-white/80 leading-snug">
                {trackingState === 'MARKER_LOST'
                  ? 'Point your camera back at the FRAMEAI marker.'
                  : 'Point your camera at the printed FRAMEAI AR marker.'}
              </p>
            </div>
          </div>
        )}

        {/* Optical Scale Calibration Status Pill (Top-Center of Camera Feed) */}
        <div className="absolute top-16 z-20 flex items-center gap-2 bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs shadow-lg">
          <Ruler size={13} className={trackingState === 'MARKER_DETECTED' ? 'text-emerald-400' : 'text-amber-400'} />
          <span className="font-semibold text-[11px]">
            {trackingState === 'MARKER_DETECTED' ? (
              <span className="text-emerald-300">
                REAL SIZE (1:1) • {frameWidthMm}mm on {physicalTargetSizeMm}mm target
              </span>
            ) : trackingState === 'MARKER_LOST' ? (
              <span className="text-red-300">
                TARGET LOST • CALIBRATING
              </span>
            ) : trackingState === 'CAMERA_STARTING' ? (
              <span className="text-white/70">
                INITIALIZING CAMERA...
              </span>
            ) : (
              <span className="text-amber-300">
                SEARCHING FOR FRAMEAI MARKER
              </span>
            )}
          </span>
        </div>

        {/* Debug HUD Overlay */}
        {isDebugOpen && (
          <div className="absolute top-24 left-4 z-40 bg-black/90 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-[10px] font-mono text-white/90 space-y-1.5 shadow-2xl max-w-xs pointer-events-auto">
            <div className="flex justify-between items-center border-b border-white/15 pb-1">
              <span className="font-bold text-orange-400">AR TRACKING TELEMETRY</span>
              <span className="text-emerald-400 font-bold">{fps} FPS</span>
            </div>
            <p>
              <strong className="text-white/60">trackingState:</strong>{' '}
              <span className="text-orange-300 font-bold">{trackingState}</span>
            </p>
            <p>
              <strong className="text-white/60">markerDetected:</strong>{' '}
              <span className={currentPose?.isDetected ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                {currentPose?.isDetected ? 'true' : 'false'}
              </span>
            </p>
            <p>
              <strong className="text-white/60">markerCornerCount:</strong>{' '}
              <span className={currentPose?.cornerCount ? 'text-emerald-400 font-bold' : 'text-white/60'}>
                {currentPose?.cornerCount ?? 0}
              </span>
            </p>
            <p>
              <strong className="text-white/60">markerArea:</strong>{' '}
              <span>{currentPose?.area ? `${Math.round(currentPose.area)} px²` : '0 px²'}</span>
            </p>
            <p>
              <strong className="text-white/60">markerCenterX:</strong>{' '}
              <span>{currentPose?.centerX ? `${Math.round(currentPose.centerX)} px` : '0 px'}</span>
            </p>
            <p>
              <strong className="text-white/60">markerCenterY:</strong>{' '}
              <span>{currentPose?.centerY ? `${Math.round(currentPose.centerY)} px` : '0 px'}</span>
            </p>
            <p>
              <strong className="text-white/60">poseValid:</strong>{' '}
              <span className={currentPose?.isValid ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                {currentPose?.isValid ? 'true' : 'false'}
              </span>
            </p>
            <p>
              <strong className="text-white/60">eyewearRendered:</strong>{' '}
              <span
                className={
                  trackingState === 'MARKER_DETECTED' && Boolean(currentPose?.isDetected && currentPose?.isValid)
                    ? 'text-emerald-400 font-bold'
                    : 'text-neutral-400'
                }
              >
                {trackingState === 'MARKER_DETECTED' && Boolean(currentPose?.isDetected && currentPose?.isValid)
                  ? 'true'
                  : 'false'}
              </span>
            </p>
            {currentPose && currentPose.isDetected && (
              <>
                <p>
                  <strong className="text-white/60">markerRotation:</strong> {Math.round(currentPose.rotationDeg)}°
                </p>
                <p>
                  <strong className="text-white/60">scaleRatio (138/100):</strong> {scaleRatio.toFixed(2)}x
                </p>
                <p>
                  <strong className="text-white/60">distanceCm:</strong> {Math.round(currentPose.distanceCm)} cm
                </p>
              </>
            )}
            {!currentPose && (
              <p className="text-amber-300 italic">No optical marker detected in scene.</p>
            )}
          </div>
        )}
      </div>

      {/* Colorway Switcher (Floating Right Sidebar) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2 bg-black/70 backdrop-blur-md p-2 rounded-2xl border border-white/15 shadow-xl">
        <span className="text-[8px] uppercase font-bold text-white/40 text-center tracking-wider">
          Color
        </span>
        {activeProduct.frameColors?.map((c) => (
          <button
            key={c.name}
            onClick={() => setSelectedColor(c.name)}
            className={`w-7 h-7 rounded-full transition-all flex items-center justify-center cursor-pointer border-2 ${
              selectedColor === c.name ? 'border-orange-500 scale-110' : 'border-white/30'
            }`}
            style={{ backgroundColor: c.hex }}
            title={c.name}
          >
            {selectedColor === c.name && <Check size={12} className="text-white drop-shadow-sm" />}
          </button>
        ))}
      </div>

      {/* Bottom Controls Bar */}
      <footer className="relative z-30 bg-[#161413] border-t border-white/10 px-4 py-3 space-y-3">
        {/* Toggle Bar: Real-Size & Dimensions */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            {/* Real Size Badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider text-[10px] border ${
                trackingState === 'MARKER_DETECTED' &&
                currentPose?.isDetected &&
                physicalTargetSizeMm > 0 &&
                frameWidthMm > 0
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                  : 'bg-white/10 text-white/60 border-white/15'
              }`}
            >
              <Ruler size={13} />
              <span>
                {trackingState === 'MARKER_DETECTED' &&
                currentPose?.isDetected &&
                physicalTargetSizeMm > 0 &&
                frameWidthMm > 0
                  ? 'Real Size (1:1)'
                  : 'Scale Not Calibrated'}
              </span>
            </div>

            {/* Show Dimensions Toggle */}
            <button
              onClick={() => {
                const next = !showDimensions;
                setShowDimensions(next);
                if (next) {
                  ARAnalytics.arDimensionViewed({
                    productId: activeProduct.id,
                    productName: activeProduct.name,
                    frameWidthMm,
                  });
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider text-[10px] transition-all cursor-pointer border ${
                showDimensions
                  ? 'bg-orange-950/80 text-orange-300 border-orange-500/40'
                  : 'bg-white/10 text-white/80 border-white/15'
              }`}
              id="ar-show-dimensions-btn"
            >
              <Box size={13} />
              <span>Show Dimensions</span>
            </button>
          </div>

          <button
            onClick={() => {
              poseFilterRef.current.reset();
              setCurrentPose(null);
              if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
              }
              setTrackingState('SEARCHING_FOR_MARKER');
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/15 text-white/60 border border-white/10 text-[10px] font-semibold cursor-pointer"
            title="Reset Tracker"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>

        {/* Primary Dual Actions: TRY ON MY FACE & ADD TO CART */}
        <div className="grid grid-cols-12 gap-2.5">
          {/* PRIMARY: TRY ON MY FACE */}
          <button
            onClick={handleTransitionToFaceTryOn}
            className="col-span-7 py-3 px-4 rounded-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer transform active:scale-98"
            id="ar-mobile-try-on-face-btn"
          >
            <UserCheck size={15} />
            <span>Try On My Face</span>
            <ChevronRight size={13} />
          </button>

          {/* SECONDARY: ADD TO CART */}
          <button
            onClick={handleAddToCart}
            className="col-span-5 py-3 px-4 rounded-full bg-white text-black hover:bg-neutral-200 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer transform active:scale-98"
            id="ar-mobile-add-to-cart-btn"
          >
            <ShoppingBag size={14} />
            <span>Add to Cart</span>
          </button>
        </div>
      </footer>

      {/* Cart Toast Notification */}
      {addedToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-emerald-600 text-white rounded-full font-semibold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 size={16} />
          <span>Added {activeProduct.name} ({selectedColor}) to cart</span>
        </div>
      )}
    </div>
  );
};
