import React, { useEffect, useRef, useState } from 'react';
import { Camera, Upload, RotateCcw } from 'lucide-react';
import { FaceAnalysisResult } from '../types';

interface FaceScanPanelProps {
  onResult: (analysis: FaceAnalysisResult) => void;
}

type CameraState = 'idle' | 'requesting' | 'live' | 'denied' | 'notfound' | 'busy' | 'unsupported' | 'error';

const CAMERA_MESSAGES: Partial<Record<CameraState, string>> = {
  denied: 'Akses kamera diblokir. Klik ikon kamera atau gembok di address bar, pilih Izinkan, lalu coba lagi. Atau unggah foto.',
  notfound: 'Kamera tidak ditemukan di perangkat ini. Gunakan Unggah foto.',
  busy: 'Kamera sedang dipakai aplikasi lain. Tutup aplikasi tersebut lalu coba lagi.',
  unsupported: 'Browser ini tidak mendukung akses kamera. Gunakan Unggah foto.',
  error: 'Kamera tidak bisa dibuka. Coba lagi atau gunakan Unggah foto.',
};

/** Inline face scan: live camera or photo upload, analysed by Gemini via /api/analyze-face */
export const FaceScanPanel: React.FC<FaceScanPanelProps> = ({ onResult }) => {
  const [source, setSource] = useState<'camera' | 'upload'>('camera');
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Attach the stream once the <video> is on screen
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((e) => console.warn('Camera preview failed to play:', e));
    }
  }, [stream]);

  // Release the camera when leaving the panel
  useEffect(() => () => stream?.getTracks().forEach((t) => t.stop()), [stream]);

  const stopCamera = () => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setIsVideoReady(false);
    setCameraState('idle');
  };

  const startCamera = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('unsupported');
      return;
    }
    setCameraState('requesting');
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      setStream(s);
      setCameraState('live');
    } catch (e) {
      const name = (e as { name?: string }).name;
      setCameraState(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'denied'
          : name === 'NotFoundError' || name === 'OverconstrainedError'
          ? 'notfound'
          : name === 'NotReadableError'
          ? 'busy'
          : 'error'
      );
    }
  };

  const analyze = async (imageBase64: string) => {
    setPreview(imageBase64);
    setIsAnalyzing(true);
    setError(null);
    try {
      const res = await fetch('/api/analyze-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.analysis) throw new Error(data?.error || 'Analisis wajah gagal. Silakan coba lagi.');
      onResult(data.analysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analisis wajah gagal. Silakan coba lagi.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || !isVideoReady) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    stopCamera();
    analyze(dataUrl);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => analyze(reader.result as string);
    reader.readAsDataURL(file);
  };

  const retry = () => {
    setPreview(null);
    setError(null);
    if (source === 'camera') startCamera();
    else fileInputRef.current?.click();
  };

  const switchSource = (next: 'camera' | 'upload') => {
    stopCamera();
    setPreview(null);
    setError(null);
    setSource(next);
    if (next === 'upload') fileInputRef.current?.click();
  };

  const cameraMessage = CAMERA_MESSAGES[cameraState];

  return (
    <div className="space-y-4">
      {/* Source switch */}
      <div className="flex gap-1 p-1 rounded-full bg-soft w-fit">
        {(['camera', 'upload'] as const).map((s) => (
          <button
            key={s}
            onClick={() => switchSource(s)}
            disabled={isAnalyzing}
            className={`h-9 px-4 rounded-full text-sm flex items-center gap-2 transition-colors ${
              source === s ? 'bg-white text-ink shadow-card' : 'text-muted hover:text-ink'
            }`}
          >
            {s === 'camera' ? <Camera className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
            {s === 'camera' ? 'Kamera' : 'Unggah foto'}
          </button>
        ))}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {/* Stage */}
      <div className="relative aspect-[4/3] max-w-xl rounded-3xl overflow-hidden bg-soft flex items-center justify-center">
        {preview ? (
          <img src={preview} alt="Foto wajah untuk dianalisis" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          stream && (
            <video
              ref={videoRef}
              playsInline
              muted
              onLoadedData={() => setIsVideoReady(true)}
              className="absolute inset-0 w-full h-full object-cover -scale-x-100"
            />
          )
        )}

        {isAnalyzing ? (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <span className="w-8 h-8 rounded-full border-2 border-line-strong border-t-ink animate-spin" />
            <p className="text-sm text-ink">Gemini sedang menganalisis wajahmu...</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 bg-white/85 backdrop-blur-sm flex flex-col items-center justify-center gap-4 px-8 text-center">
            <p role="alert" className="text-sm text-red-700 leading-relaxed">{error}</p>
            <button onClick={retry} className="h-10 px-5 rounded-full bg-ink text-white text-sm flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Coba lagi
            </button>
          </div>
        ) : source === 'camera' && cameraState === 'live' ? (
          isVideoReady && (
            <>
              <div className="absolute inset-y-6 left-1/2 -translate-x-1/2 aspect-[3/4] rounded-[50%] border-2 border-dashed border-white/80 pointer-events-none" />
              <span className="absolute top-4 px-3 py-1.5 rounded-full bg-white/90 text-xs text-ink">
                Posisikan wajah di dalam bingkai
              </span>
              <button
                onClick={capture}
                className="absolute bottom-4 h-11 px-6 rounded-full bg-ink hover:bg-ink-soft text-white text-sm font-medium flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Ambil foto & analisis
              </button>
            </>
          )
        ) : source === 'camera' ? (
          <div className="max-w-xs text-center space-y-4 px-6">
            <p className="text-sm text-muted leading-relaxed">
              {cameraState === 'requesting'
                ? 'Menunggu izin kamera. Pilih "Izinkan" pada pop-up browser.'
                : cameraMessage ?? 'Nyalakan kamera, posisikan wajah menghadap depan dengan cahaya cukup.'}
            </p>
            <button
              onClick={startCamera}
              disabled={cameraState === 'requesting' || cameraState === 'unsupported'}
              className="h-11 px-5 rounded-full bg-ink hover:bg-ink-soft text-white text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              {cameraState === 'idle' ? 'Nyalakan kamera' : 'Coba lagi'}
            </button>
          </div>
        ) : (
          <div className="max-w-xs text-center space-y-4 px-6">
            <p className="text-sm text-muted leading-relaxed">Pilih foto wajah menghadap depan, tanpa kacamata.</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="h-11 px-5 rounded-full bg-ink hover:bg-ink-soft text-white text-sm font-medium inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Pilih foto
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
