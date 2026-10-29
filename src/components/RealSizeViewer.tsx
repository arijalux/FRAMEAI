import React, { useEffect, useRef, useState } from 'react';
import { Camera, ImageUp, Printer, Ruler } from 'lucide-react';
import { OpticalFrame } from '../types';
import { REAL_SIZE_MODELS, RealSizeModel } from './realsize/realSizeModels';
import type { MarkerScene } from './realsize/MarkerScene';
import type { MarkerTracker } from './realsize/markerTracker';

// Frames are analysed at this width; enough for an 80 mm marker at arm's length
const ANALYSIS_WIDTH = 640;

interface RealSizeViewerProps {
  frames: OpticalFrame[];
  initialModelId?: string;
  onTryOnFace: () => void;
}

/** Shows a frame at real size standing on a printed card, tracked through the camera */
export const RealSizeViewer: React.FC<RealSizeViewerProps> = ({ frames, initialModelId, onTryOnFace }) => {
  const model: RealSizeModel = REAL_SIZE_MODELS.find((m) => m.id === initialModelId) ?? REAL_SIZE_MODELS[0];
  const videoRef = useRef<HTMLVideoElement>(null);
  const photoRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [source, setSource] = useState<'none' | 'camera' | 'photo'>('none');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [aspect, setAspect] = useState(4 / 3);
  const [status, setStatus] = useState<'idle' | 'starting' | 'searching' | 'tracking' | 'denied' | 'error'>('idle');
  const [printing, setPrinting] = useState(false);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startCamera = async () => {
    setStatus('starting');
    setPhotoUrl(null);
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setSource('camera');
    } catch (err) {
      const name = (err as DOMException)?.name;
      setStatus(name === 'NotAllowedError' ? 'denied' : 'error');
    }
  };

  // Attach the stream once the video element is on screen
  useEffect(() => {
    const video = videoRef.current;
    if (source !== 'camera' || !video || !streamRef.current) return;
    video.srcObject = streamRef.current;
    video.onloadedmetadata = () => {
      setAspect(video.videoWidth / video.videoHeight);
      video.play().catch(() => {});
      setStatus('searching');
    };
  }, [source]);

  useEffect(() => stopCamera, []);

  const loadPhoto = (file: File) => {
    stopCamera();
    setPhotoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setSource('photo');
    setStatus('searching');
  };

  // Tracking and rendering loop
  useEffect(() => {
    if (source === 'none') return;
    let raf = 0;
    let cancelled = false;
    let scene: MarkerScene | null = null;
    let tracker: MarkerTracker | null = null;
    const analysis = document.createElement('canvas');
    const actx = analysis.getContext('2d', { willReadFrequently: true })!;
    let lastPhotoPose: ReturnType<MarkerTracker['detect']> = null;
    let photoAnalysed = false;

    (async () => {
      try {
        const [{ MarkerScene }, { MarkerTracker }] = await Promise.all([
          import('./realsize/MarkerScene'),
          import('./realsize/markerTracker'),
        ]);
        if (cancelled || !canvasRef.current) return;
        scene = new MarkerScene(canvasRef.current);
        await scene.load(model.url, model.totalWidthMm);
        tracker = new MarkerTracker();
      } catch (err) {
        console.warn('Real-size viewer failed to start:', err);
        if (!cancelled) setStatus('error');
        return;
      }

      let shown: boolean | null = null;
      const frame = () => {
        if (cancelled || !scene || !tracker) return;
        const canvas = canvasRef.current;
        const media = source === 'camera' ? videoRef.current : photoRef.current;
        const srcW = media instanceof HTMLVideoElement ? media.videoWidth : media?.naturalWidth ?? 0;
        const srcH = media instanceof HTMLVideoElement ? media.videoHeight : media?.naturalHeight ?? 0;
        if (canvas && media && srcW && srcH) {
          let pose = lastPhotoPose;
          // A photo only needs analysing once; video is analysed every frame
          if (source === 'camera' || !photoAnalysed) {
            analysis.width = ANALYSIS_WIDTH;
            analysis.height = Math.round((ANALYSIS_WIDTH * srcH) / srcW);
            actx.drawImage(media, 0, 0, analysis.width, analysis.height);
            pose = tracker.detect(actx.getImageData(0, 0, analysis.width, analysis.height));
            if (source === 'photo') {
              photoAnalysed = true;
              lastPhotoPose = pose;
              setAspect(srcW / srcH);
            }
          }
          const tracking = scene.render(canvas.clientWidth, canvas.clientHeight, pose);
          if (tracking !== shown) {
            shown = tracking;
            setStatus(tracking ? 'tracking' : 'searching');
          }
        }
        raf = requestAnimationFrame(frame);
      };
      frame();
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      scene?.dispose();
    };
  }, [source, photoUrl, model.url, model.totalWidthMm]);

  const print = async () => {
    setPrinting(true);
    try {
      const { printCard } = await import('./realsize/printCard');
      await printCard(model);
    } finally {
      setPrinting(false);
    }
  };

  const statusText = {
    idle: '',
    starting: 'Menunggu izin kamera...',
    searching: 'Arahkan kamera ke kotak hitam besar di kartu.',
    tracking: `Ukuran asli: lebar frame sekitar ${model.totalWidthMm} mm.`,
    denied: 'Akses kamera diblokir. Izinkan kamera di pengaturan browser, atau pakai foto kartu.',
    error: 'Kamera atau model 3D gagal dimuat. Coba lagi, atau pakai foto kartu.',
  }[status];

  return (
    <div className="space-y-10">
      <div className="space-y-3 max-w-2xl">
        <span className="text-sm text-muted">Ukuran asli</span>
        <h1 className="text-4xl md:text-5xl font-normal tracking-[-0.04em] leading-[1.05] text-ink">
          Lihat kacamata 1:1 di atas kartu.
        </h1>
        <p className="text-lg text-muted leading-relaxed">
          Cetak kartunya, letakkan di meja, lalu arahkan kamera. Kacamata muncul dengan ukuran sebenarnya, jadi bisa
          dibandingkan langsung dengan kacamatamu sendiri.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-3">
          <div
            className="relative w-full rounded-[32px] overflow-hidden bg-soft"
            style={{ aspectRatio: source === 'none' ? '4 / 3' : String(aspect) }}
          >
            {source === 'camera' && (
              <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-fill" />
            )}
            {source === 'photo' && photoUrl && (
              <img ref={photoRef} src={photoUrl} alt="Foto kartu" className="absolute inset-0 w-full h-full object-fill" />
            )}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

            {source === 'none' && (
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div className="max-w-sm text-center space-y-5">
                  <Ruler className="w-10 h-10 text-sage mx-auto" />
                  <p className="text-sm text-muted leading-relaxed">
                    Sudah punya kartunya? Buka kamera dan arahkan ke kotak hitam besar di kartu.
                  </p>
                  <button
                    onClick={startCamera}
                    className="h-12 px-6 rounded-full bg-ink hover:bg-ink-soft text-white text-sm font-medium inline-flex items-center gap-2 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    Buka kamera
                  </button>
                </div>
              </div>
            )}
          </div>
          {statusText && <p className="text-sm text-body">{statusText}</p>}
          {model.credit && source !== 'none' && (
            <a href={model.credit.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted hover:text-ink">
              Model 3D: “{model.credit.title}” oleh {model.credit.author} · {model.credit.license}
            </a>
          )}
        </div>

        <div className="lg:col-span-4 space-y-8">
          <section className="space-y-3">
            <h2 className="text-sm text-ink">1. Cetak kartu</h2>
            <button
              onClick={print}
              disabled={printing}
              className="w-full h-12 rounded-full bg-ink hover:bg-ink-soft disabled:opacity-50 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4" />
              {printing ? 'Menyiapkan...' : 'Cetak kartu (A4)'}
            </button>
            <p className="text-xs text-muted leading-relaxed">
              Cetak dengan skala 100% (“Actual size”). Di kartu ada garis 10 cm untuk mengecek ukurannya.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm text-ink">2. Arahkan kamera</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={startCamera}
                className="h-12 rounded-full border border-line hover:border-ink text-ink text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Camera className="w-4 h-4" />
                Kamera
              </button>
              <label className="h-12 rounded-full border border-line hover:border-ink text-ink text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer">
                <ImageUp className="w-4 h-4" />
                Foto kartu
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => e.target.files?.[0] && loadPhoto(e.target.files[0])}
                />
              </label>
            </div>
            <button onClick={onTryOnFace} className="text-sm text-ink underline underline-offset-4">
              Atau coba langsung di wajah
            </button>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm text-ink">Frame</h2>
            <ul className="space-y-2">
              {REAL_SIZE_MODELS.map((m) => (
                <li key={m.id} className="p-4 rounded-3xl border border-ink text-sm text-ink flex justify-between">
                  {m.name}
                  <span className="text-muted">{m.totalWidthMm} mm</span>
                </li>
              ))}
              {frames.slice(0, 4).map((f) => (
                <li
                  key={f.id}
                  aria-disabled="true"
                  className="p-4 rounded-3xl border border-line text-sm text-faint flex justify-between"
                >
                  {f.name}
                  <span>Segera hadir</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};
