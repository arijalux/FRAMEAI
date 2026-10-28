import React, { useState, useRef, useEffect } from 'react';
import { FaceAnalysisResult, OpticalFrame, FaceShape } from '../types';
import { Camera, Upload, Sparkles, X, CheckCircle2, ChevronRight, Scan, ShieldAlert, Cpu } from 'lucide-react';
import {
  faceShapeLabel,
  frameShapeLabel,
  materialLabel,
  skinUndertoneLabel,
  jawlineLabel,
  cheekboneLabel,
} from '../utils/format';
import { calculateFaceFrameMatchScore } from '../utils/opticalMath';

interface AIFaceAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  frames: OpticalFrame[];
  onApplyAnalysis: (result: FaceAnalysisResult) => void;
  onSelectFrameForTryOn: (frame: OpticalFrame) => void;
}

const PRESET_ARCHETYPES = [
  {
    label: 'Wajah Oval',
    shape: 'Oval' as FaceShape,
    desc: 'Proporsi seimbang dengan garis rahang membulat lembut',
    img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'Wajah Kotak',
    shape: 'Square' as FaceShape,
    desc: 'Garis rahang tegas dan dahi lebar yang simetris',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'Wajah Bulat',
    shape: 'Round' as FaceShape,
    desc: 'Lengkung lembut dengan lebar dan panjang wajah yang sama',
    img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'Wajah Hati',
    shape: 'Heart' as FaceShape,
    desc: 'Dahi lebar yang meruncing ke dagu kecil',
    img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'Wajah Diamond',
    shape: 'Diamond' as FaceShape,
    desc: 'Tulang pipi tinggi dengan dahi dan rahang lebih sempit',
    img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  },
];

export const AIFaceAnalyzerModal: React.FC<AIFaceAnalyzerModalProps> = ({
  isOpen,
  onClose,
  frames,
  onApplyAnalysis,
  onSelectFrameForTryOn,
}) => {
  const [mode, setMode] = useState<'upload' | 'camera' | 'presets'>('presets');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<FaceAnalysisResult | null>(null);
  const [scanStepText, setScanStepText] = useState<string>('Menyiapkan pemetaan titik wajah...');
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  // The error banner sits at the top of a long modal; bring it into view when it appears
  useEffect(() => {
    if (!analysisError) return;
    // Wait a frame so the scanning view has been swapped out before measuring
    const raf = requestAnimationFrame(() => errorRef.current?.scrollIntoView({ block: 'center' }));
    return () => cancelAnimationFrame(raf);
  }, [analysisError]);

  if (!isOpen) return null;

  const handleStartCamera = async () => {
    setMode('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) {
      console.warn('Camera failed to start:', e);
      setMode('presets');
    }
  };

  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const handleCaptureFromCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setSelectedImage(dataUrl);
    handleStopCamera();
    analyzeFaceWithGemini(dataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      setSelectedImage(res);
      analyzeFaceWithGemini(res);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (preset: typeof PRESET_ARCHETYPES[0]) => {
    setSelectedImage(preset.img);
    analyzeFaceWithGemini(undefined, preset.label);
  };

  const analyzeFaceWithGemini = async (imageBase64?: string, mockDescriptor?: string) => {
    setIsScanning(true);
    setAnalysisResult(null);
    setAnalysisError(null);

    // Cinematic optical scanning steps
    const steps = [
      'Memetakan titik-titik wajah...',
      'Menghitung rasio tulang pipi dan rahang...',
      'Memperkirakan jarak pupil (PD)...',
      'Menganalisis dengan Gemini 3.8 Flash...',
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        setScanStepText(steps[stepIndex]);
      }
    }, 550);

    try {
      const response = await fetch('/api/analyze-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mockDescriptor }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.analysis) {
        setAnalysisResult(data.analysis);
        onApplyAnalysis(data.analysis);
      } else {
        setAnalysisError(data?.error || 'Analisis wajah gagal. Silakan coba lagi.');
      }
    } catch (err) {
      console.error(err);
      // Never show a made-up face shape: tell the user the scan did not complete
      setAnalysisError('Layanan analisis tidak dapat dihubungi. Periksa koneksi Anda lalu coba lagi.');
    } finally {
      clearInterval(interval);
      setIsScanning(false);
    }
  };

  const handleClose = () => {
    handleStopCamera();
    onClose();
  };

  // Rank frames by match score for this user's face shape
  const matchedFrames = analysisResult
    ? frames
        .map((f) => {
          const match = calculateFaceFrameMatchScore(analysisResult.faceShape, f.shape, {
            userPd: analysisResult.estimatedPd,
            frameWidth: f.dimensions.totalWidth,
          });
          return { frame: f, match };
        })
        .sort((a, b) => b.match.score - a.match.score)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      {/* my-auto (not items-center) centers short content without clipping the top of tall content */}
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl my-auto">
        {/* Top Header */}
        <div className="p-6 border-b border-neutral-800/80 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-white tracking-wide">
                Analisis Bentuk Wajah dengan AI
              </h2>
              <p className="text-xs text-neutral-400">
                Didukung Gemini 3.8 Flash
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Tutup Analisis"
            className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {analysisError && !isScanning && (
            <div ref={errorRef} role="alert" className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
              {analysisError}
            </div>
          )}

          {!analysisResult && !isScanning && (
            <div className="space-y-6">
              {/* Scan Mode Switcher */}
              <div className="flex justify-center">
                <div className="flex items-center gap-2 p-1.5 bg-neutral-950 rounded-2xl border border-neutral-800">
                  <button
                    onClick={() => {
                      handleStopCamera();
                      setMode('presets');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      mode === 'presets' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Contoh Bentuk Wajah
                  </button>
                  <button
                    onClick={handleStartCamera}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      mode === 'camera' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Scan Webcam
                  </button>
                  <button
                    onClick={() => {
                      handleStopCamera();
                      setMode('upload');
                      fileInputRef.current?.click();
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      mode === 'upload' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Unggah Foto
                  </button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Mode: Camera Viewfinder */}
              {mode === 'camera' && (
                <div className="relative max-w-md mx-auto aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 flex items-center justify-center">
                  <video ref={videoRef} playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                  <div className="absolute inset-0 border-2 border-dashed border-amber-500/50 m-6 rounded-3xl pointer-events-none flex items-center justify-center">
                    <span className="text-xs text-amber-300 font-mono bg-black/60 px-2 py-1 rounded">
                      Posisikan Wajah di Dalam Bingkai
                    </span>
                  </div>
                  <button
                    onClick={handleCaptureFromCamera}
                    className="absolute bottom-4 py-2.5 px-6 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm shadow-xl transition-all"
                  >
                    Analisis Foto
                  </button>
                </div>
              )}

              {/* Mode: Contoh Bentuk Wajah */}
              {mode === 'presets' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  {PRESET_ARCHETYPES.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => handleSelectPreset(p)}
                      className="group p-3 rounded-2xl bg-neutral-950 border border-neutral-800/80 hover:border-amber-500/60 transition-all text-left flex flex-col gap-2.5"
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-neutral-900">
                        <img
                          src={p.img}
                          alt={p.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-950/80 text-amber-400 border border-amber-500/30">
                          {faceShapeLabel(p.shape)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white group-hover:text-amber-400 transition-colors">
                          {p.label}
                        </div>
                        <div className="text-[11px] text-neutral-400 line-clamp-2 mt-0.5">
                          {p.desc}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Scanning Animation State */}
          {isScanning && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin" />
                <div className="absolute inset-2 rounded-full border-4 border-neutral-800 border-b-amber-500 animate-spin [animation-direction:reverse]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Scan className="w-8 h-8 text-amber-400 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2 max-w-md">
                <h3 className="text-lg font-serif font-bold text-white tracking-wide">
                  Memetakan Wajah
                </h3>
                <p className="text-xs font-mono text-amber-400 animate-pulse">{scanStepText}</p>
              </div>
            </div>
          )}

          {/* Analysis Results View */}
          {analysisResult && !isScanning && (
            <div className="space-y-6 animate-in fade-in">
              {/* Top Summary Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                    Bentuk Wajah
                  </span>
                  <div className="text-xl font-bold font-serif text-amber-400 mt-1">
                    {faceShapeLabel(analysisResult.faceShape)}
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    Keyakinan {analysisResult.confidenceScore}%
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                    Undertone Kulit
                  </span>
                  <div className="text-xl font-bold font-serif text-white mt-1">
                    {skinUndertoneLabel(analysisResult.skinUndertone)}
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    Menentukan warna frame yang cocok
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                    Perkiraan Jarak Pupil (PD)
                  </span>
                  <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                    {analysisResult.estimatedPd} mm
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    Untuk titik tengah lensa
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                    Garis Rahang
                  </span>
                  <div className="text-base font-bold text-white mt-1 truncate">
                    {jawlineLabel(analysisResult.jawline)}
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5">
                    Tulang pipi: {cheekboneLabel(analysisResult.cheekboneProminence)}
                  </div>
                </div>
              </div>

              {/* Personalized Optician Reasoning Card */}
              <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                  <Cpu className="w-4 h-4" />
                  Penjelasan dari Gemini
                </div>
                <p className="text-sm text-neutral-200 leading-relaxed font-sans">
                  {analysisResult.reasoning}
                </p>
                <div className="pt-2 border-t border-amber-500/10 grid grid-cols-1 md:grid-cols-3 gap-2">
                  {analysisResult.stylingTips.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-neutral-300">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Curated Recommended Frames */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-white tracking-wide uppercase">
                    Rekomendasi Frame untuk Wajah {faceShapeLabel(analysisResult.faceShape)}
                  </h4>
                  <span className="text-xs text-neutral-400">Diurutkan berdasarkan kecocokan</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {matchedFrames.slice(0, 3).map(({ frame, match }) => (
                    <div
                      key={frame.id}
                      className="group p-3 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/60 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-900 mb-2.5">
                          <img
                            src={frame.imageUrl}
                            alt={frame.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-neutral-950 shadow-md">
                            Cocok {match.score}%
                          </div>
                        </div>

                        <div className="text-sm font-bold text-white">{frame.name}</div>
                        <div className="text-xs text-neutral-400 mb-1">
                          {frameShapeLabel(frame.shape)} · {materialLabel(frame.material)}
                        </div>
                        <p className="text-xs text-amber-300/90 font-medium">
                          {match.verdict}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          onSelectFrameForTryOn(frame);
                          handleClose();
                        }}
                        className="mt-3 w-full py-2 px-3 rounded-xl bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Coba dengan AR
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  onClick={() => {
                    setAnalysisResult(null);
                    setSelectedImage(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
                >
                  Scan Ulang
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-lg transition-all"
                >
                  Lihat Frame Rekomendasi
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
