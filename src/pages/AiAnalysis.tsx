import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { analyzeFacialStyle } from '../services/geminiService';
import { Sparkles, CheckCircle2, ArrowRight, ShieldAlert, Layers } from 'lucide-react';
import { FaceAnalysisResult, FrameShape } from '../types';

export const AiAnalysis: React.FC = () => {
  const { navigate, setFaceAnalysis } = useApp();

  const [progress, setProgress] = useState(15);
  const [currentStatus, setCurrentStatus] = useState('Analyzing your facial proportions and style preferences...');
  const [result, setResult] = useState<FaceAnalysisResult | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let pendingData = {
      style: 'Minimal',
      usage: 'Work',
      budget: 1800000,
      imagePreviewUrl: undefined,
    };

    try {
      const raw = localStorage.getItem('frameai_pending_analysis');
      if (raw) pendingData = JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse pending analysis:', e);
    }

    // Step animation timings
    const t1 = setTimeout(() => {
      setProgress(40);
      setCurrentStatus('Evaluating cheekbone contour and forehead balance...');
    }, 1000);

    const t2 = setTimeout(() => {
      setProgress(75);
      setCurrentStatus('Matching silhouettes with Indonesian SME artisan workshops...');
    }, 2200);

    // Call API / service
    analyzeFacialStyle({
      style: pendingData.style as any,
      usage: pendingData.usage as any,
      budget: pendingData.budget,
      imagePreviewUrl: pendingData.imagePreviewUrl,
    }).then((analysisResult) => {
      setTimeout(() => {
        setProgress(100);
        setCurrentStatus('Facial styling profile generated successfully!');
        setResult(analysisResult);
        setFaceAnalysis(analysisResult);
        setIsComplete(true);
      }, 3400);
    });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleProceed = () => {
    navigate('/recommendations');
  };

  return (
    <div className="max-w-3xl mx-auto px-6 sm:px-12 py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black text-white text-[11px] font-bold uppercase tracking-widest">
          <Sparkles size={12} className="text-orange-400" />
          <span>AI Facial Calibration</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-serif italic text-black">
          {isComplete ? 'Your Frame Profile is Ready' : 'Analyzing Facial Proportions'}
        </h1>
        <p className="text-sm text-black/60 max-w-md mx-auto">
          {currentStatus}
        </p>
      </div>

      {/* Main Analysis Card */}
      <div className="bg-white rounded-[40px] p-8 sm:p-12 border border-black/5 shadow-xl relative overflow-hidden">
        {/* Scanning Scanner Animation */}
        {!isComplete ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-8">
            <div className="relative w-56 h-56 rounded-full border-4 border-[#F5F2ED] flex items-center justify-center bg-[#F5F2ED]/50 overflow-hidden">
              {/* Radar sweep */}
              <div className="absolute inset-0 border-4 border-orange-700/30 rounded-full animate-ping opacity-75"></div>
              <div className="w-40 h-40 rounded-full border-2 border-dashed border-orange-700/60 flex items-center justify-center">
                <span className="font-serif italic text-3xl font-bold text-orange-700">
                  {progress}%
                </span>
              </div>
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-orange-600 to-transparent animate-pulse" />
            </div>

            {/* Consumer disclaimer note */}
            <div className="p-4 bg-[#F5F2ED] rounded-2xl max-w-md text-center text-xs text-black/60 leading-relaxed border border-black/5">
              <span className="font-semibold text-black block mb-0.5">Styling Calibration in Progress</span>
              FRAMEAI uses consumer styling algorithms to match frame silhouettes to natural facial contours.
            </div>
          </div>
        ) : (
          /* Completed Analysis Breakdown */
          result && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-black/10">
                {/* Face Shape Tile */}
                <div className="p-6 bg-[#F5F2ED] rounded-3xl space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-black/40">
                    Detected Silhouette
                  </span>
                  <div className="text-3xl font-serif italic text-black font-bold flex items-center gap-2">
                    <span>{result.faceShape} Face</span>
                    <CheckCircle2 size={22} className="text-emerald-600" />
                  </div>
                  <p className="text-xs text-black/60 leading-relaxed">
                    Balanced proportions with gentle jawline contours and harmonious eye-to-cheekbone distance.
                  </p>
                </div>

                {/* Recommended Shapes Tile */}
                <div className="p-6 bg-[#1A1A1A] text-white rounded-3xl space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">
                    Optimal Frame Shapes
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {result.recommendedShapes.map((shape) => (
                      <span
                        key={shape}
                        className="px-3 py-1 bg-white/15 text-white text-xs font-bold uppercase tracking-wider rounded-full"
                      >
                        {shape}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-white/70 pt-1 leading-relaxed">
                    Creates pleasing optical contrast to highlight facial structure without crowding temples.
                  </p>
                </div>
              </div>

              {/* Rationale & Preferences */}
              <div className="space-y-4">
                <div className="p-5 bg-[#EFECE6] rounded-2xl border border-black/5">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-orange-700 block mb-1">
                    Optical Stylist Rationale
                  </span>
                  <p className="text-sm font-serif italic text-black/85 leading-relaxed">
                    "{result.aiExplanation}"
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3 bg-[#F5F2ED] rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-black/40 block">Style</span>
                    <span className="font-bold text-black">{result.stylePreference}</span>
                  </div>
                  <div className="p-3 bg-[#F5F2ED] rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-black/40 block">Usage</span>
                    <span className="font-bold text-black">{result.usage}</span>
                  </div>
                  <div className="p-3 bg-[#F5F2ED] rounded-2xl">
                    <span className="text-[10px] uppercase font-bold text-black/40 block">Budget Limit</span>
                    <span className="font-bold text-black">
                      Rp {result.budgetMax.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary CTA */}
              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleProceed}
                  className="w-full sm:w-auto px-10 py-5 bg-orange-700 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  id="view-recommendations-btn"
                >
                  <span>View Recommended Artisan Frames</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};
