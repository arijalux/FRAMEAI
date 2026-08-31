import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { FrameStyle, FrameUsage } from '../types';
import {
  Sparkles,
  Camera,
  Upload,
  ArrowRight,
  ArrowLeft,
  Check,
  RotateCcw,
  ShieldCheck,
  User,
} from 'lucide-react';

export const FindMyFrame: React.FC = () => {
  const { navigate, setFaceAnalysis } = useApp();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form selections
  const [selectedStyle, setSelectedStyle] = useState<FrameStyle>('Minimal');
  const [selectedUsage, setSelectedUsage] = useState<FrameUsage>('Work');
  const [selectedBudget, setSelectedBudget] = useState<number>(1800000);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const styles: { style: FrameStyle; label: string; desc: string; iconBg: string }[] = [
    {
      style: 'Minimal',
      label: 'Minimal & Architectural',
      desc: 'Slim profiles, weightless titanium, and clean geometry.',
      iconBg: 'bg-[#EAE6DF]',
    },
    {
      style: 'Professional',
      label: 'Executive & Structured',
      desc: 'Refined browlines and classic acetates for the workplace.',
      iconBg: 'bg-[#E5DFD7]',
    },
    {
      style: 'Casual',
      label: 'Relaxed & Everyday',
      desc: 'Comfortable wayfarers and versatile silhouettes for daily life.',
      iconBg: 'bg-[#EFECE6]',
    },
    {
      style: 'Vintage',
      label: 'Heritage & Woodcraft',
      desc: 'Hand-carved Javanese teak, bamboo, and mid-century rivets.',
      iconBg: 'bg-[#E0D7CB]',
    },
    {
      style: 'Bold',
      label: 'Fashion-Forward & Dynamic',
      desc: 'Upswept cat-eyes, tinted sun lenses, and dramatic bevels.',
      iconBg: 'bg-[#EADDCF]',
    },
  ];

  const usages: { usage: FrameUsage; label: string; desc: string }[] = [
    { usage: 'Everyday', label: 'Everyday All-Day', desc: 'Lightweight ergonomic fit for 10+ hours' },
    { usage: 'Work', label: 'Office & Digital Screens', desc: 'Blue-light filtering and professional poise' },
    { usage: 'Fashion', label: 'Fashion & Statement', desc: 'Distinct silhouettes that complete your outfit' },
    { usage: 'Outdoor', label: 'Outdoor & Sun', desc: 'UV400 protection and coastal-ready tinted lenses' },
    { usage: 'Formal', label: 'Formal Gatherings', desc: 'Sleek luxury titanium and polished finishes' },
  ];

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
        setIsCameraActive(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Live camera snapshot capture
  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImagePreview(dataUrl);
      }
      // Stop video stream
      const stream = videoRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach((track) => track.stop());
      setIsCameraActive(false);
    }
  };

  const handleStartAnalysis = () => {
    // Store preliminary state
    localStorage.setItem(
      'frameai_pending_analysis',
      JSON.stringify({
        style: selectedStyle,
        usage: selectedUsage,
        budget: selectedBudget,
        imagePreviewUrl: imagePreview,
      })
    );
    navigate('/ai-analysis');
  };

  return (
    <div className="max-w-4xl mx-auto px-6 sm:px-12 py-10 space-y-10">
      {/* Step Indicator Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black text-white text-[11px] font-bold uppercase tracking-widest">
          <Sparkles size={12} className="text-orange-400" />
          <span>Interactive AI Optical Stylist</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-serif italic text-black">
          Find Your Ideal Frame
        </h1>
        <p className="text-sm text-black/60 max-w-md mx-auto">
          Answer 4 quick styling questions to match your face structure with handcrafted Indonesian eyewear.
        </p>

        {/* Progress Bar */}
        <div className="flex items-center justify-center gap-2 pt-4 max-w-xs mx-auto">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                step >= i ? 'bg-black' : 'bg-black/15'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Multi-Step Box */}
      <div className="bg-white rounded-[40px] p-8 sm:p-12 border border-black/5 shadow-md">
        {/* STEP 1: STYLE PREFERENCE */}
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <span className="text-[11px] uppercase tracking-widest font-bold text-orange-700 block mb-1">
                Step 01 of 04
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif italic text-black">
                What is your primary aesthetic style?
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {styles.map((item) => {
                const isSelected = selectedStyle === item.style;
                return (
                  <div
                    key={item.style}
                    onClick={() => setSelectedStyle(item.style)}
                    className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-black bg-[#F5F2ED] shadow-sm scale-[1.01]'
                        : 'border-black/10 bg-white hover:border-black/30'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-black">
                        {item.style}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'bg-black border-black text-white' : 'border-black/20'
                        }`}
                      >
                        {isSelected && <Check size={12} />}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-serif italic text-lg text-black mb-1">{item.label}</h3>
                      <p className="text-xs text-black/60 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-8 py-4 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-orange-700 transition-all flex items-center gap-2 shadow-md cursor-pointer"
              >
                <span>Continue to Usage</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: USAGE SCENARIO */}
        {step === 2 && (
          <div className="space-y-8">
            <div>
              <span className="text-[11px] uppercase tracking-widest font-bold text-orange-700 block mb-1">
                Step 02 of 04
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif italic text-black">
                How will you wear these glasses most?
              </h2>
            </div>

            <div className="space-y-3">
              {usages.map((item) => {
                const isSelected = selectedUsage === item.usage;
                return (
                  <div
                    key={item.usage}
                    onClick={() => setSelectedUsage(item.usage)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-black bg-[#F5F2ED] font-semibold text-black shadow-xs'
                        : 'border-black/10 bg-white hover:border-black/30 text-black/80'
                    }`}
                  >
                    <div>
                      <h3 className="font-serif italic text-base text-black">{item.label}</h3>
                      <p className="text-xs text-black/50">{item.desc}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'bg-black border-black text-white' : 'border-black/20'
                      }`}
                    >
                      {isSelected && <Check size={12} />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-4 border border-black/20 text-black rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black/5 transition-all flex items-center gap-2"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>

              <button
                onClick={() => setStep(3)}
                className="px-8 py-4 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-orange-700 transition-all flex items-center gap-2 shadow-md cursor-pointer"
              >
                <span>Continue to Budget</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: BUDGET IN IDR */}
        {step === 3 && (
          <div className="space-y-8">
            <div>
              <span className="text-[11px] uppercase tracking-widest font-bold text-orange-700 block mb-1">
                Step 03 of 04
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif italic text-black">
                What is your target budget range?
              </h2>
            </div>

            <div className="p-8 bg-[#F5F2ED] rounded-3xl border border-black/5 text-center space-y-6">
              <span className="text-xs uppercase font-bold tracking-widest text-black/40">
                Selected Maximum Budget
              </span>
              <div className="text-4xl sm:text-5xl font-serif italic text-black">
                Rp {selectedBudget.toLocaleString('id-ID')}
              </div>

              <input
                type="range"
                min="800000"
                max="2500000"
                step="50000"
                value={selectedBudget}
                onChange={(e) => setSelectedBudget(Number(e.target.value))}
                className="w-full max-w-md mx-auto accent-black cursor-pointer"
              />

              <div className="flex justify-between text-xs text-black/50 max-w-md mx-auto">
                <span>Entry Craft: Rp 800.000</span>
                <span>Signature Master: Rp 2.500.000</span>
              </div>
            </div>

            {/* Quick Select Budget Pills */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {[1000000, 1450000, 1850000, 2200000].map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBudget(b)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                    selectedBudget === b
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black/70 border-black/15 hover:border-black'
                  }`}
                >
                  Rp {b.toLocaleString('id-ID')}
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-4 border border-black/20 text-black rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black/5 transition-all flex items-center gap-2"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>

              <button
                onClick={() => setStep(4)}
                className="px-8 py-4 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-orange-700 transition-all flex items-center gap-2 shadow-md cursor-pointer"
              >
                <span>Continue to Facial Scan</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SELFIE UPLOAD OR CAMERA SCAN */}
        {step === 4 && (
          <div className="space-y-8">
            <div>
              <span className="text-[11px] uppercase tracking-widest font-bold text-orange-700 block mb-1">
                Step 04 of 04
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif italic text-black">
                Facial Proportion & Contour Scan
              </h2>
              <p className="text-xs text-black/60 mt-1">
                Upload a front-facing selfie or enable your camera for styling calibration.
              </p>
            </div>

            {/* Camera / Upload Box */}
            <div className="p-8 bg-[#F5F2ED] rounded-3xl border border-black/10 flex flex-col items-center justify-center text-center space-y-6 min-h-[320px]">
              {imagePreview ? (
                <div className="space-y-4">
                  <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-black shadow-xl mx-auto">
                    <img src={imagePreview} alt="Selfie preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 border-2 border-dashed border-orange-500/80 rounded-full animate-pulse" />
                  </div>
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      setIsCameraActive(false);
                    }}
                    className="text-xs font-bold text-orange-700 hover:underline uppercase tracking-wider flex items-center justify-center gap-1 mx-auto"
                  >
                    <RotateCcw size={12} />
                    <span>Retake or Change Photo</span>
                  </button>
                </div>
              ) : isCameraActive ? (
                <div className="space-y-4">
                  <div className="relative w-64 h-64 rounded-3xl overflow-hidden bg-black mx-auto border-2 border-white">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <div className="absolute inset-0 border-2 border-dashed border-orange-400 rounded-full m-4 pointer-events-none" />
                  </div>
                  <button
                    onClick={capturePhoto}
                    className="px-8 py-3 bg-orange-700 text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-md hover:bg-orange-800 transition-colors"
                  >
                    Capture Photo
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-w-sm">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto text-black/50 shadow-xs">
                    <User size={32} />
                  </div>
                  <div>
                    <h3 className="font-serif italic text-lg text-black">Upload Front-Facing Photo</h3>
                    <p className="text-xs text-black/50 mt-1">
                      Clear natural lighting without existing sunglasses gives the most accurate face silhouette.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-5 py-2.5 bg-black text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-orange-700 transition-colors"
                    >
                      <Upload size={13} />
                      <span>Upload Image</span>
                    </button>

                    <button
                      onClick={startCamera}
                      className="px-5 py-2.5 bg-white border border-black/20 text-black rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors"
                    >
                      <Camera size={13} />
                      <span>Use Live Camera</span>
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-black/50 justify-center">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Your photo is processed privately for styling recommendations only.</span>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(3)}
                className="px-6 py-4 border border-black/20 text-black rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black/5 transition-all flex items-center gap-2"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>

              <button
                onClick={handleStartAnalysis}
                className="px-10 py-4 bg-orange-700 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-lg cursor-pointer"
                id="start-ai-analysis-btn"
              >
                <Sparkles size={15} />
                <span>Analyze & Generate Recommendations</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
