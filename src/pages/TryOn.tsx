import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { EyewearRenderer } from '../components/ui/EyewearRenderer';
import { FrameViewer } from '../components/ui/FrameViewer';
import {
  Camera,
  X,
  Sparkles,
  ShoppingBag,
  Sliders,
  Maximize2,
  RefreshCw,
  Layers,
  Download,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Info,
  Heart,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  SlidersHorizontal,
  Video,
  VideoOff,
  UserCheck,
  Users,
} from 'lucide-react';
import { Product } from '../types';
import {
  getFaceLandmarker,
  extractPoseFromLandmarks,
  SmoothPoseFilter,
  FaceTrackingPose,
  ARViewportDimensions,
  drawDebugOverlay,
  calculateEyewearTransform,
  FRAME_ASSET_GEOMETRIES,
  DEFAULT_FRAME_GEOMETRY,
} from '../services/arEngine';
import { ARAnalytics } from '../services/analyticsService';

export const TryOn: React.FC<{ productId?: string }> = ({ productId }) => {
  const { products, getProductById, navigate, addToCart, toggleWishlist, isWishlisted, user } = useApp();

  const [activeProductId, setActiveProductId] = useState<string>(productId || products[0].id);
  const product = getProductById(activeProductId) || products[0];

  // Camera & Video Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const smoothFilterRef = useRef<SmoothPoseFilter>(new SmoothPoseFilter(0.48, 0.40, 0.42));
  const startTimeRef = useRef<number>(Date.now());
  const previousProductRef = useRef<string>(activeProductId);
  const streamRef = useRef<MediaStream | null>(null);

  // FPS & Diagnostic Metrics
  const lastFrameTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);
  const [fps, setFps] = useState<number>(30);
  const [isDebugMode, setIsDebugMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('debugAR') === 'true' || window.location.hash.includes('debugAR=true');
  });

  // Status & Tracking State
  const latestPoseRef = useRef<FaceTrackingPose | null>(null);
  const [cameraState, setCameraState] = useState<'requesting' | 'ready' | 'permission_denied' | 'no_camera' | 'unsupported'>('requesting');
  const [unsupportedReason, setUnsupportedReason] = useState<string>('');
  const [isInitializingLandmarks, setIsInitializingLandmarks] = useState(true);
  const [trackingPose, setTrackingPose] = useState<FaceTrackingPose | null>(null);
  const [isTrackingLost, setIsTrackingLost] = useState(true);
  const [multipleFacesDetected, setMultipleFacesDetected] = useState(false);
  const [containerDims, setContainerDims] = useState<{ width: number; height: number }>({ width: 1280, height: 720 });
  const [videoDims, setVideoDims] = useState<{ width: number; height: number }>({ width: 1280, height: 720 });

  // AR Tuning State
  const [selectedColor, setSelectedColor] = useState(product.defaultColor);
  const [userScaleOffset, setUserScaleOffset] = useState<number>(1.0);
  const [userVerticalOffset, setUserVerticalOffset] = useState<number>(0);
  const [userHorizontalOffset, setUserHorizontalOffset] = useState<number>(0);
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [compareProductId, setCompareProductId] = useState<string>(
    products.find((p) => p.id !== product.id)?.id || products[1]?.id || products[0].id
  );
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [flashEffect, setFlashEffect] = useState(false);
  const [guideLinesVisible, setGuideLinesVisible] = useState(true);

  const compareProduct = getProductById(compareProductId) || products[1] || products[0];

  // 1. Initialize Analytics for tryOnStarted and tryOnEnded
  useEffect(() => {
    startTimeRef.current = Date.now();
    ARAnalytics.tryOnStarted({
      productId: product.id,
      productName: product.name,
      sellerId: product.sellerId,
      userId: user?.id,
      selectedColor: product.defaultColor,
    });

    return () => {
      const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      ARAnalytics.tryOnEnded({
        productId: product.id,
        productName: product.name,
        sellerId: product.sellerId,
        userId: user?.id,
        durationSeconds,
        faceShapeDetected: trackingPose?.faceShapeEstimate,
      });
    };
  }, []);

  // 2. Track product changes without losing camera stream
  useEffect(() => {
    if (previousProductRef.current !== activeProductId) {
      ARAnalytics.tryOnProductChanged({
        previousProductId: previousProductRef.current,
        newProductId: product.id,
        newProductName: product.name,
        userId: user?.id,
      });
      previousProductRef.current = activeProductId;
      setSelectedColor(product.defaultColor);
    }
  }, [activeProductId, product, user]);

  // 3. Monitor container dimensions with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          setContainerDims({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // 4. Initialize Camera and MediaPipe Face Landmarker
  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('unsupported');
      setUnsupportedReason('Camera access is not supported on this browser or environment.');
      setIsInitializingLandmarks(false);
      return;
    }

    try {
      setCameraState('requesting');
      setIsInitializingLandmarks(true);

      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            setVideoDims({
              width: videoRef.current.videoWidth || 1280,
              height: videoRef.current.videoHeight || 720,
            });
            videoRef.current.play().catch((e) => console.warn('Autoplay prevented:', e));
            setCameraState('ready');
          }
        };
      }

      // Pre-initialize MediaPipe FaceLandmarker
      const landmarker = await getFaceLandmarker();
      if (!landmarker) {
        console.warn('FaceLandmarker initial setup warning, will retry in loop.');
      }

      setIsInitializingLandmarks(false);
    } catch (err: any) {
      console.warn('Webcam permission error:', err);
      setIsInitializingLandmarks(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraState('permission_denied');
        setUnsupportedReason('Camera permission was denied. Please allow camera access to use real-time AR try-on.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraState('no_camera');
        setUnsupportedReason('No video input camera was detected on this device.');
      } else {
        setCameraState('unsupported');
        setUnsupportedReason(err.message || 'Virtual Try-On camera stream is not available.');
      }
    }
  }, []);

  useEffect(() => {
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [startCamera]);

  // 5. Continuous Real-time Face Tracking Loop with requestAnimationFrame
  useEffect(() => {
    if (cameraState !== 'ready') return;

    let isRunning = true;
    let lastVideoTime = -1;

    async function trackingLoop() {
      if (!isRunning) return;

      const video = videoRef.current;
      const container = containerRef.current;

      // Calculate real-time FPS
      const now = performance.now();
      frameCountRef.current++;
      if (now - lastFrameTimeRef.current >= 1000) {
        setFps((frameCountRef.current * 1000) / (now - lastFrameTimeRef.current));
        frameCountRef.current = 0;
        lastFrameTimeRef.current = now;
      }

      if (video && container && video.readyState >= 2 && !video.paused) {
        const landmarker = await getFaceLandmarker();

        if (landmarker && video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          const startTimeMs = performance.now();

          try {
            const results = landmarker.detectForVideo(video, startTimeMs);

            if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
              const rawLandmarks = results.faceLandmarks[0];
              const faceCount = results.faceLandmarks.length;
              setMultipleFacesDetected(faceCount > 1);

              const viewport: ARViewportDimensions = {
                containerWidth: container.clientWidth || 1280,
                containerHeight: container.clientHeight || 720,
                videoWidth: video.videoWidth || 1280,
                videoHeight: video.videoHeight || 720,
              };

              const rawPose = extractPoseFromLandmarks(rawLandmarks, viewport, true, faceCount);
              const smoothedPose = smoothFilterRef.current.update(rawPose, startTimeMs);

              if (smoothedPose) {
                latestPoseRef.current = smoothedPose;
                setTrackingPose(smoothedPose);
                setIsTrackingLost(false);
              }
            } else {
              // No face detected in current video frame
              setMultipleFacesDetected(false);
              const smoothedPose = smoothFilterRef.current.update(null, startTimeMs);
              if (smoothedPose) {
                latestPoseRef.current = smoothedPose;
                setTrackingPose(smoothedPose);
                setIsTrackingLost(true);
              } else {
                latestPoseRef.current = null;
                setTrackingPose(null);
                setIsTrackingLost(true);
              }
            }
          } catch (detectionErr) {
            console.warn('Face landmark detection frame error:', detectionErr);
          }
        }
      }

      // Draw diagnostic overlay if debug mode is active
      if (canvasRef.current && container) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = container.clientWidth;
          canvas.height = container.clientHeight;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (isDebugMode) {
            drawDebugOverlay(ctx, latestPoseRef.current, fps, videoDims, canvas.width, canvas.height);
          }
        }
      }

      if (isRunning) {
        animationFrameIdRef.current = requestAnimationFrame(trackingLoop);
      }
    }

    animationFrameIdRef.current = requestAnimationFrame(trackingLoop);

    return () => {
      isRunning = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [cameraState, isDebugMode, fps, videoDims, trackingPose]);

  // Color selection
  const currentColorHex =
    product.frameColors.find((c) => c.name === selectedColor)?.hex || '#1A1A1A';

  // 6. Screenshot Capture (Real user camera frame + exact eyewear overlay + artisan watermark)
  const handleCaptureSnapshot = () => {
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 250);

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    if (ctx && videoRef.current) {
      const v = videoRef.current;
      const minDim = Math.min(v.videoWidth, v.videoHeight);
      const sx = (v.videoWidth - minDim) / 2;
      const sy = (v.videoHeight - minDim) / 2;

      // 1. Draw Real Webcam Video Frame with horizontal mirror
      ctx.save();
      ctx.translate(1080, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(v, sx, sy, minDim, minDim, 0, 0, 1080, 1080);
      ctx.restore();

      // 2. Draw Tracked Eyewear onto the Snapshot Canvas
      if (trackingPose && trackingPose.isDetected && containerRef.current) {
        const cWidth = containerRef.current.clientWidth || 1080;
        const cHeight = containerRef.current.clientHeight || 1080;

        // Map tracked coordinates from container space to 1080x1080 square space
        const scaleFactorX = 1080 / cWidth;
        const scaleFactorY = 1080 / cHeight;
        const snapScale = (scaleFactorX + scaleFactorY) / 2;

        const snapCenterX = (trackingPose.centerX + userHorizontalOffset) * scaleFactorX;
        const snapCenterY = (trackingPose.centerY + userVerticalOffset) * scaleFactorY;
        const snapGlassesWidth = trackingPose.width * userScaleOffset * snapScale;
        const snapGlassesHeight = trackingPose.height * userScaleOffset * snapScale;

        // Render SVG frame to Image
        const svgContainer = document.getElementById('ar-eyewear-svg-container');
        if (svgContainer) {
          const svgElement = svgContainer.querySelector('svg');
          if (svgElement) {
            const svgString = new XMLSerializer().serializeToString(svgElement);
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const blobURL = URL.createObjectURL(svgBlob);
            const img = new Image();

            img.onload = () => {
              ctx.save();
              ctx.translate(snapCenterX, snapCenterY);
              ctx.rotate((trackingPose.roll * Math.PI) / 180);
              ctx.drawImage(
                img,
                -snapGlassesWidth / 2,
                -snapGlassesHeight / 2,
                snapGlassesWidth,
                snapGlassesHeight
              );
              ctx.restore();
              URL.revokeObjectURL(blobURL);

              // 3. Draw Watermark Bar
              drawWatermark(ctx);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
              setSnapshotUrl(dataUrl);
            };

            img.src = blobURL;
          } else {
            drawWatermark(ctx);
            setSnapshotUrl(canvas.toDataURL('image/jpeg', 0.95));
          }
        } else {
          drawWatermark(ctx);
          setSnapshotUrl(canvas.toDataURL('image/jpeg', 0.95));
        }
      } else {
        drawWatermark(ctx);
        setSnapshotUrl(canvas.toDataURL('image/jpeg', 0.95));
      }

      ARAnalytics.tryOnCaptured({
        productId: product.id,
        productName: product.name,
        selectedColor,
        userId: user?.id,
      });
    }
  };

  const drawWatermark = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 940, 1080, 140);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 30px "Playfair Display", serif';
    ctx.fillText(`FRAMEAI • ${product.name}`, 40, 990);

    ctx.fillStyle = '#E5E5E5';
    ctx.font = '18px sans-serif';
    ctx.fillText(
      `Handcrafted by ${product.sellerName}, ${product.sellerLocation} • ${selectedColor}`,
      40,
      1030
    );

    ctx.fillStyle = '#FB923C';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`Rp ${product.price.toLocaleString('id-ID')}`, 840, 1010);
  };

  // Add to cart action with event logging
  const handleAddToCart = () => {
    addToCart(product, selectedColor);
    ARAnalytics.tryOnAddedToCart({
      productId: product.id,
      productName: product.name,
      selectedColor,
      userId: user?.id,
    });
  };

  // Try another frame quick action
  const handleTryAnotherFrame = () => {
    const currentIndex = products.findIndex((p) => p.id === product.id);
    const nextIndex = (currentIndex + 1) % products.length;
    const nextProduct = products[nextIndex];
    setActiveProductId(nextProduct.id);
    setSelectedColor(nextProduct.defaultColor);
  };

  // Reset adjustments
  const handleResetAdjustments = () => {
    setUserScaleOffset(1.0);
    setUserVerticalOffset(0);
    setUserHorizontalOffset(0);
  };

  // -------------------------------------------------------------
  // FALLBACK PERMISSION / CAMERA ERROR VIEW
  // -------------------------------------------------------------
  if (cameraState === 'permission_denied' || cameraState === 'no_camera' || cameraState === 'unsupported') {
    return (
      <div className="fixed inset-0 z-50 bg-[#121212] text-white flex flex-col justify-between items-center p-6 font-sans">
        <header className="w-full max-w-4xl flex items-center justify-between py-4">
          <button
            onClick={() => navigate(`/product/${product.id}`)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
          >
            <X size={16} />
            <span>Exit</span>
          </button>
          <span className="text-xs uppercase font-bold tracking-widest text-orange-400 font-mono">
            Live AR Fitting
          </span>
        </header>

        <div className="max-w-md w-full text-center space-y-6 bg-[#1A1A1A] p-8 sm:p-10 rounded-[32px] border border-white/10 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-orange-700/20 text-orange-400 flex items-center justify-center mx-auto border border-orange-500/30">
            {cameraState === 'permission_denied' ? <VideoOff size={30} /> : <AlertCircle size={30} />}
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-serif italic text-white">
              {cameraState === 'permission_denied'
                ? 'Camera Access Required'
                : 'Camera Unavailable'}
            </h2>
            <p className="text-xs text-white/65 leading-relaxed">
              {unsupportedReason ||
                'Allow camera access in your browser settings to try on Indonesian handcrafted eyewear in real-time.'}
            </p>
          </div>

          {/* Product Preview Card */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4 text-left">
            <div className="w-20 h-16 bg-[#262626] rounded-xl flex items-center justify-center overflow-hidden p-2">
              <FrameViewer shape={product.frameShape} colorHex="#FFFFFF" width={60} height={35} />
            </div>
            <div>
              <h3 className="text-sm font-serif italic text-white font-bold">{product.name}</h3>
              <p className="text-xs text-white/50">{product.sellerName} • {product.sellerLocation}</p>
              <p className="text-xs font-medium text-orange-400 mt-1">
                Rp {product.price.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={startCamera}
              className="w-full py-4 bg-orange-700 hover:bg-orange-800 text-white rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Allow Camera Access & Retry</span>
            </button>

            <button
              onClick={() => navigate(`/product/${product.id}`)}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all border border-white/15 cursor-pointer"
            >
              Back to Product Details
            </button>
          </div>
        </div>

        <footer className="text-[11px] text-white/40 text-center pb-2">
          FRAMEAI • Real-Time Web AR Eyewear Fitting
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // CALCULATE EYEWEAR POSITION FROM TRACKED POSE
  // -------------------------------------------------------------
  const geometry = FRAME_ASSET_GEOMETRIES[product.frameShape] || DEFAULT_FRAME_GEOMETRY;

  const eyewearTransform = trackingPose?.isDetected
    ? calculateEyewearTransform(
        trackingPose.leftEyeCenter,
        trackingPose.rightEyeCenter,
        geometry,
        {
          scale: userScaleOffset,
          vertical: userVerticalOffset,
          horizontal: userHorizontalOffset,
        }
      )
    : null;

  const finalFrameWidth = eyewearTransform?.width || ((trackingPose?.width || 320) * userScaleOffset);
  const finalFrameHeight = eyewearTransform?.height || ((trackingPose?.height || 160) * userScaleOffset);
  const posX = eyewearTransform?.x || ((trackingPose?.centerX || containerDims.width / 2) + userHorizontalOffset);
  const posY = eyewearTransform?.y || ((trackingPose?.centerY || containerDims.height / 2) + userVerticalOffset);
  const anchorNormX = eyewearTransform?.anchorNormalizedX ?? (geometry.anchorNormalizedX ?? 0.5);
  const anchorNormY = eyewearTransform?.anchorNormalizedY ?? (geometry.anchorNormalizedY ?? (86 / 175));
  const roll = eyewearTransform?.rotation ?? (trackingPose?.roll || 0);
  const yaw = trackingPose?.yaw || 0;
  const pitch = trackingPose?.pitch || 0;
  const isFaceActive = Boolean(trackingPose?.isDetected && !isTrackingLost);

  return (
    <div className="fixed inset-0 z-50 bg-[#121212] text-white flex flex-col justify-between select-none overflow-hidden font-sans">
      {/* Top Navigation & Status Bar */}
      <header className="px-6 py-4 flex items-center justify-between z-30 bg-gradient-to-b from-black/85 via-black/50 to-transparent">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/product/${product.id}`)}
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white transition-all cursor-pointer border border-white/15"
            title="Exit Virtual Try-On"
          >
            <X size={18} />
          </button>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-orange-400 font-mono block">
              LIVE AR FITTING
            </span>
            <h1 className="text-sm font-serif italic text-white leading-tight">
              {product.name}
            </h1>
          </div>
        </div>

        {/* Live Face Tracking Status Pill */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-xs font-mono flex items-center gap-2">
            {isFaceActive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                <span className="text-emerald-300 font-medium">● FACE DETECTED</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400/80 animate-ping" />
                <span className="text-white/70">○ SEARCHING FOR FACE</span>
              </>
            )}
          </div>

          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md transition-all border cursor-pointer hidden sm:flex items-center gap-1.5 ${
              compareMode
                ? 'bg-orange-700 text-white border-orange-500 shadow-md'
                : 'bg-white/10 text-white/80 border-white/15 hover:bg-white/20'
            }`}
            title="Toggle Split-Screen Compare Mode"
          >
            <Layers size={13} />
            <span>Compare</span>
          </button>

          <button
            onClick={() => setGuideLinesVisible(!guideLinesVisible)}
            className={`w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center text-white transition-all cursor-pointer ${
              guideLinesVisible
                ? 'bg-white/20 border-white/40'
                : 'bg-white/10 border-white/15 hover:bg-white/20'
            }`}
            title="Toggle Reticle Alignment Guides"
          >
            <Eye size={16} />
          </button>

          <button
            onClick={() => setInfoDrawerOpen(!infoDrawerOpen)}
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
            title="Product Specifications"
          >
            <Info size={16} />
          </button>
        </div>
      </header>

      {/* Main AR Live Camera Viewport */}
      <main
        ref={containerRef}
        className="relative flex-grow flex items-center justify-center overflow-hidden bg-black"
      >
        {/* Flash Effect on Capture */}
        {flashEffect && (
          <div className="absolute inset-0 bg-white z-50 animate-out fade-out duration-200 pointer-events-none" />
        )}

        {/* Live Webcam Video Stream with horizontal mirror */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover -scale-x-100"
        />

        {/* Transparent Diagnostic AR Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
        />

        {/* Camera Starting / Calibrating Overlay */}
        {isInitializingLandmarks && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs uppercase font-bold tracking-widest text-white/90 font-mono">
              Starting camera & calibrating landmarks...
            </p>
          </div>
        )}

        {/* Multi-Face Warning Banner */}
        {multipleFacesDetected && (
          <div className="absolute top-6 z-30 px-4 py-2 rounded-full bg-amber-950/80 backdrop-blur-md border border-amber-500/40 text-xs text-amber-200 font-medium flex items-center gap-2 animate-in fade-in shadow-xl">
            <Users size={14} className="text-amber-400" />
            <span>For the best result, make sure only one face is visible.</span>
          </div>
        )}

        {/* Tracking Loss Guidance Notification */}
        {!isFaceActive && !isInitializingLandmarks && !multipleFacesDetected && (
          <div className="absolute top-6 z-30 px-5 py-2.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-xs text-white/90 font-medium flex items-center gap-2 animate-in fade-in shadow-xl">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping"></span>
            <span>Position your face inside the frame.</span>
          </div>
        )}

        {/* SPLIT COMPARE MODE */}
        {compareMode ? (
          <div className="absolute inset-0 grid grid-cols-2 pointer-events-none z-10">
            {/* Left Half: Active Product */}
            <div className="relative border-r border-white/30 flex flex-col items-center justify-center">
              <div
                className="transform transition-transform duration-75"
                style={{
                  transform: `translate(${userHorizontalOffset}px, ${userVerticalOffset}px) scale(${userScaleOffset})`,
                }}
              >
                <EyewearRenderer
                  product={product}
                  selectedColorHex={currentColorHex}
                  selectedColorName={selectedColor}
                  width={290}
                  height={145}
                  yaw={yaw}
                  pitch={pitch}
                  roll={roll}
                />
              </div>
              <div className="absolute bottom-6 px-4 py-1.5 bg-black/80 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/20">
                {product.name} ({selectedColor})
              </div>
            </div>

            {/* Right Half: Secondary Product */}
            <div className="relative flex flex-col items-center justify-center">
              <div
                className="transform transition-transform duration-75"
                style={{
                  transform: `translate(${userHorizontalOffset}px, ${userVerticalOffset}px) scale(${userScaleOffset})`,
                }}
              >
                <EyewearRenderer
                  product={compareProduct}
                  selectedColorHex={compareProduct.frameColors[0]?.hex || '#1A1A1A'}
                  selectedColorName={compareProduct.defaultColor}
                  width={290}
                  height={145}
                  yaw={yaw}
                  pitch={pitch}
                  roll={roll}
                />
              </div>
              <div className="absolute bottom-6 px-4 py-1.5 bg-black/80 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/20">
                {compareProduct.name} ({compareProduct.sellerName})
              </div>
            </div>
          </div>
        ) : (
          /* STANDARD REAL-TIME AR OVERLAY */
          <div className="absolute inset-0 pointer-events-none z-10">
            {/* Facial Alignment HUD Reticle */}
            {guideLinesVisible && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[320px] sm:w-[380px] h-[440px] sm:h-[500px] rounded-full border border-dashed border-white/20 pointer-events-none flex flex-col items-center justify-between p-8">
                  <div className="w-full flex justify-between text-[9px] uppercase tracking-widest text-white/50 font-mono">
                    <span>EYELINE: {isFaceActive ? 'LOCKED' : 'SEARCHING'}</span>
                    <span>SCALE: {Math.round(userScaleOffset * 100)}%</span>
                  </div>
                  <div className="w-20 h-px bg-orange-500/80"></div>
                  <div className="text-[9px] uppercase tracking-widest text-white/50 font-mono">
                    {trackingPose?.faceShapeEstimate
                      ? `ESTIMATED SHAPE: ${trackingPose.faceShapeEstimate}`
                      : 'LIVE EYEWEAR AR'}
                  </div>
                </div>
              </div>
            )}

            {/* Live Tracked Eyewear Object positioned over Face */}
            <div
              id="ar-eyewear-svg-container"
              className={`absolute will-change-transform transition-opacity duration-300 ${
                isFaceActive ? 'opacity-100' : 'opacity-40'
              }`}
              style={{
                left: `${posX}px`,
                top: `${posY}px`,
                transformOrigin: `${anchorNormX * 100}% ${anchorNormY * 100}%`,
                transform: `translate(-${anchorNormX * 100}%, -${anchorNormY * 100}%) rotate(${roll}deg)`,
              }}
            >
              <EyewearRenderer
                product={product}
                selectedColorHex={currentColorHex}
                selectedColorName={selectedColor}
                width={finalFrameWidth}
                height={finalFrameHeight}
                yaw={yaw}
                pitch={pitch}
                roll={0}
              />
            </div>
          </div>
        )}

        {/* Snapshot Modal Preview */}
        {snapshotUrl && (
          <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in">
            <div className="bg-[#1A1A1A] p-6 rounded-3xl border border-white/20 max-w-sm w-full text-center space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="font-serif italic text-lg text-white">AR Fit Captured</h3>
                <button
                  onClick={() => setSnapshotUrl(null)}
                  className="p-1 text-white/60 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <img
                src={snapshotUrl}
                alt="AR Fit Snapshot"
                className="w-full rounded-2xl border border-white/10 shadow-lg"
              />

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setSnapshotUrl(null)}
                  className="flex-1 py-3 bg-white/15 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-white/25 transition-all cursor-pointer"
                >
                  Discard
                </button>
                <a
                  href={snapshotUrl}
                  download={`frameai-${product.slug}-fitting.jpg`}
                  className="flex-1 py-3 bg-orange-700 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-orange-800 flex items-center justify-center gap-1.5 transition-all shadow-lg cursor-pointer"
                >
                  <Download size={14} />
                  <span>Save Photo</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Floating Control Bar */}
      <footer className="z-30 p-4 sm:p-6 bg-gradient-to-t from-black via-black/95 to-transparent space-y-4">
        {/* Frame Carousel Selector */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none max-w-4xl mx-auto">
          {products.map((p) => {
            const isSelected = p.id === product.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setActiveProductId(p.id);
                  setSelectedColor(p.defaultColor);
                }}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl flex-shrink-0 transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-white text-black border-white shadow-xl scale-105 font-bold'
                    : 'bg-white/10 text-white/80 border-white/15 hover:bg-white/20'
                }`}
              >
                <FrameViewer
                  shape={p.frameShape}
                  colorHex={isSelected ? '#1A1A1A' : '#FFFFFF'}
                  width={38}
                  height={20}
                />
                <div className="text-left">
                  <div className="text-xs">{p.name}</div>
                  <div className={`text-[10px] ${isSelected ? 'text-black/60' : 'text-white/50'}`}>
                    {p.sellerLocation}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Color Palette + Tuning Sliders + Shutter Action */}
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/10">
          {/* Color Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 mr-1">
              Colors:
            </span>
            {product.frameColors.map((color) => (
              <button
                key={color.name}
                onClick={() => setSelectedColor(color.name)}
                className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                  selectedColor === color.name
                    ? 'scale-125 border-white shadow-md'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>

          {/* Size & Bridge Offset Calibration Controls */}
          <div className="flex items-center gap-4 bg-white/10 px-4 py-2 rounded-full border border-white/15 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-white/40">Size</span>
              <input
                type="range"
                min="0.75"
                max="1.35"
                step="0.02"
                value={userScaleOffset}
                onChange={(e) => setUserScaleOffset(parseFloat(e.target.value))}
                className="w-18 sm:w-20 accent-orange-500 cursor-pointer"
                title="Adjust Eyewear Scale"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-white/40">Bridge</span>
              <input
                type="range"
                min="-60"
                max="60"
                step="2"
                value={userVerticalOffset}
                onChange={(e) => setUserVerticalOffset(parseInt(e.target.value))}
                className="w-14 sm:w-16 accent-orange-500 cursor-pointer"
                title="Adjust Bridge Height"
              />
            </div>
            {(userScaleOffset !== 1.0 || userVerticalOffset !== 0) && (
              <button
                onClick={handleResetAdjustments}
                className="text-white/50 hover:text-white transition-colors"
                title="Reset Frame Adjustments"
              >
                <RotateCcw size={12} />
              </button>
            )}
          </div>

          {/* Action CTAs: Shutter, Try Another Frame, Add to Cart */}
          <div className="flex items-center gap-3">
            {/* Shutter Button */}
            <button
              onClick={handleCaptureSnapshot}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-lg cursor-pointer"
              title="Capture Real-Time AR Photo"
            >
              <Camera size={19} />
            </button>

            {/* Secondary CTA: Try Another Frame */}
            <button
              onClick={handleTryAnotherFrame}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all hidden sm:flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Try Another Frame</span>
            </button>

            {/* Primary CTA: Add To Cart */}
            <button
              onClick={handleAddToCart}
              className="px-5 sm:px-6 py-3.5 bg-orange-700 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-orange-800 transition-all flex items-center gap-2 shadow-xl cursor-pointer"
              id="tryon-add-to-cart-btn"
            >
              <ShoppingBag size={14} />
              <span>Add To Cart</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Info Drawer Modal */}
      {infoDrawerOpen && (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#1A1A1A] border-l border-white/20 p-8 z-50 flex flex-col justify-between overflow-y-auto shadow-2xl animate-in slide-in-from-right">
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-white/15">
              <span className="text-xs uppercase font-bold tracking-widest text-orange-400 font-mono">
                Frame Specifications
              </span>
              <button
                onClick={() => setInfoDrawerOpen(false)}
                className="p-1 text-white/60 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div>
              <h3 className="text-3xl font-serif italic text-white">{product.name}</h3>
              <p className="text-xs text-white/50 mt-1">
                Handcrafted by {product.sellerName} in {product.sellerLocation}, Indonesia
              </p>
              <p className="text-xl font-medium text-white mt-3">
                Rp {product.price.toLocaleString('id-ID')}
              </p>
            </div>

            <p className="text-xs text-white/70 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/10">
              {product.description}
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-[10px] uppercase font-bold text-white/40 block">Silhouette</span>
                <span className="font-bold text-white">{product.frameShape}</span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-[10px] uppercase font-bold text-white/40 block">Material</span>
                <span className="font-bold text-white">{product.material}</span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-[10px] uppercase font-bold text-white/40 block">Lens Width</span>
                <span className="font-bold text-white">{product.dimensions.lensWidth} mm</span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-[10px] uppercase font-bold text-white/40 block">Weight</span>
                <span className="font-bold text-white">{product.weightGrams} grams</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/15 space-y-3">
            <button
              onClick={() => {
                handleAddToCart();
                setInfoDrawerOpen(false);
              }}
              className="w-full py-4 bg-orange-700 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-orange-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <ShoppingBag size={14} />
              <span>Add To Cart</span>
            </button>
            <button
              onClick={() => setInfoDrawerOpen(false)}
              className="w-full py-3 border border-white/20 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-white/10 cursor-pointer"
            >
              Back to Mirror
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
