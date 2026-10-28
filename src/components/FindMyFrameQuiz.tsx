import React, { useState } from 'react';
import { OpticalFrame, FaceShape } from '../types';
import { Sparkles, Check, ArrowRight, RotateCcw, Camera, Eye } from 'lucide-react';
import { calculateFaceFrameMatchScore } from '../utils/opticalMath';

interface FindMyFrameQuizProps {
  frames: OpticalFrame[];
  onSelectFrameForTryOn: (frame: OpticalFrame) => void;
  onConfigureLenses: (frame: OpticalFrame) => void;
  onCompleteQuiz?: (detectedShape: FaceShape) => void;
}

interface QuizAnswers {
  lifestyle?: string;
  aesthetic?: string;
  materialPref?: string;
  faceShape?: FaceShape;
}

export const FindMyFrameQuiz: React.FC<FindMyFrameQuizProps> = ({
  frames,
  onSelectFrameForTryOn,
  onConfigureLenses,
  onCompleteQuiz,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  const totalSteps = 4;

  const handleSelectOption = (key: keyof QuizAnswers, value: any) => {
    const updated = { ...answers, [key]: value };
    setAnswers(updated);
    if (currentStep < totalSteps) {
      setCurrentStep((s) => s + 1);
    } else {
      setQuizFinished(true);
      if (updated.faceShape && onCompleteQuiz) {
        onCompleteQuiz(updated.faceShape);
      }
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setAnswers({});
    setQuizFinished(false);
  };

  // Compute matched frames based on quiz answers
  const scoredFrames = frames.map((f) => {
    let score = 75;
    if (answers.faceShape) {
      score = calculateFaceFrameMatchScore(answers.faceShape, f.shape).score;
    }
    if (answers.materialPref === 'titanium' && f.material.includes('Titanium')) score += 10;
    if (answers.materialPref === 'acetate' && f.material.includes('Acetate')) score += 10;
    if (answers.materialPref === 'eco' && f.material.includes('Eco')) score += 10;
    if (answers.lifestyle === 'digital' && f.weightGrams < 20) score += 6;
    if (answers.aesthetic === 'bold' && f.shape === 'Square') score += 5;
    if (answers.aesthetic === 'minimalist' && f.shape === 'Geometric') score += 5;

    return { frame: f, finalScore: Math.min(99, score) };
  }).sort((a, b) => b.finalScore - a.finalScore);

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl bg-neutral-900 border border-neutral-800 p-6 md:p-10 shadow-2xl">
      {!quizFinished ? (
        <div>
          {/* Progress Bar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs uppercase tracking-wider font-semibold text-neutral-300">
                Find My Frame · Optical Matching Guide
              </span>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              Step {currentStep} of {totalSteps}
            </span>
          </div>

          <div className="w-full bg-neutral-950 h-1.5 rounded-full overflow-hidden mb-8">
            <div
              className="bg-amber-500 h-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>

          {/* Question 1: Lifestyle */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl md:text-2xl font-serif font-bold text-white">
                  What is your primary daily eyewear environment?
                </h3>
                <p className="text-xs text-neutral-400">
                  This calibrates weight distribution, blue-light filter coatings, and temple flex.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'digital',
                    title: 'Digital & Remote Studio',
                    desc: 'Prolonged screen hours requiring featherlight bridge pressure and blue-light filtration.',
                  },
                  {
                    id: 'fashion',
                    title: 'Executive & Haute Couture',
                    desc: 'Sharp, distinctive silhouettes making an authoritative style statement.',
                  },
                  {
                    id: 'outdoor',
                    title: 'Sun & Active Commute',
                    desc: 'Anti-glare polarized performance with secure non-slip titanium nose pads.',
                  },
                  {
                    id: 'all_day',
                    title: 'All-Day Universal Optical',
                    desc: 'Supreme comfort balance engineered for continuous 16-hour daily wear.',
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption('lifestyle', opt.id)}
                    className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/60 transition-all text-left group"
                  >
                    <div className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">
                      {opt.title}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Question 2: Aesthetic */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl md:text-2xl font-serif font-bold text-white">
                  Which design aesthetic resonates with your personal presence?
                </h3>
                <p className="text-xs text-neutral-400">
                  Defines silhouette lines, bridge architecture, and bevel profiles.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'minimalist',
                    title: 'Architectural Minimalist',
                    desc: 'Sharp geometry, rimless or ultra-fine wire contours, clean functionalism.',
                  },
                  {
                    id: 'bold',
                    title: 'Bold Statement Avant-Garde',
                    desc: 'Beveled Italian acetate with deep rich color tones and prominent presence.',
                  },
                  {
                    id: 'retro',
                    title: 'Timeless Mid-Century Classic',
                    desc: 'Iconic aviator bars, keyhole bridges, and vintage round tortoiseshell.',
                  },
                  {
                    id: 'sculptural',
                    title: 'Sculpted Luxe Elegance',
                    desc: 'Upswept cat-eye browlines, brushed champagne gold, high-luster polishing.',
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption('aesthetic', opt.id)}
                    className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/60 transition-all text-left group"
                  >
                    <div className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">
                      {opt.title}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Question 3: Material */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl md:text-2xl font-serif font-bold text-white">
                  What material tactile quality do you prefer?
                </h3>
                <p className="text-xs text-neutral-400">
                  Balances weight, thermal comfort, and structural rigidity.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'titanium',
                    title: 'Aerospace Grade Titanium',
                    desc: 'Featherlight (under 15g), hypoallergenic, corrosion-resistant with subtle flex.',
                  },
                  {
                    id: 'acetate',
                    title: 'Italian Mazzucchelli Acetate',
                    desc: 'Warm organic feel, high-luster depth, custom wire core temples.',
                  },
                  {
                    id: 'eco',
                    title: 'Circular Bio-Polymer',
                    desc: 'Lightweight sustainable engineering with velvety matte tactile finish.',
                  },
                  {
                    id: 'hybrid',
                    title: 'Hybrid Titanium & Acetate',
                    desc: 'The best of both worlds: acetate front with aerospace titanium temples.',
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption('materialPref', opt.id)}
                    className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/60 transition-all text-left group"
                  >
                    <div className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">
                      {opt.title}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Question 4: Face Structure */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl md:text-2xl font-serif font-bold text-white">
                  Which facial contour best describes your face shape?
                </h3>
                <p className="text-xs text-neutral-400">
                  Used by our optical algorithm to calculate complementary geometric counterbalances.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'Oval',
                    title: 'Oval Symmetry',
                    desc: 'Balanced length and width with gently rounded jawline.',
                  },
                  {
                    id: 'Square',
                    title: 'Square Structure',
                    desc: 'Chiseled angular jawline and broad forehead breadth.',
                  },
                  {
                    id: 'Round',
                    title: 'Soft Circular',
                    desc: 'Curved soft lines with nearly equal width and length.',
                  },
                  {
                    id: 'Heart',
                    title: 'Heart Contours',
                    desc: 'Wider brow and high cheekbones tapering to a delicate chin.',
                  },
                  {
                    id: 'Diamond',
                    title: 'Diamond Geometry',
                    desc: 'Dramatic high cheekbones with narrower forehead and jaw.',
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption('faceShape', opt.id as FaceShape)}
                    className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/60 transition-all text-left group"
                  >
                    <div className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">
                      {opt.title}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Quiz Results Screen */
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                <Check className="w-3.5 h-3.5" />
                Optical Profile Calibrated
              </div>
              <h3 className="text-2xl font-serif font-bold text-white">
                Your Curated Match Results
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Optimized for your {answers.faceShape} facial structure and lifestyle preferences.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-950 border border-neutral-800 flex items-center gap-1.5 self-start"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retake Quiz
            </button>
          </div>

          {/* Top 3 Matched Frames */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scoredFrames.slice(0, 3).map(({ frame, finalScore }, idx) => (
              <div
                key={frame.id}
                className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80 hover:border-amber-500/60 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-900 mb-3">
                    <img src={frame.imageUrl} alt={frame.name} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-neutral-950 shadow-md">
                      {finalScore}% Match
                    </div>
                    {idx === 0 && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-950/80 text-amber-400 border border-amber-500/30">
                        Top Synergy Pick
                      </div>
                    )}
                  </div>

                  <h4 className="font-serif font-bold text-white text-base">{frame.name}</h4>
                  <div className="text-xs text-neutral-400 mb-2">
                    ${frame.price} · {frame.shape} · {frame.material}
                  </div>
                  <p className="text-xs text-neutral-300 line-clamp-2">{frame.description}</p>
                </div>

                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => onSelectFrameForTryOn(frame)}
                    className="w-full py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    Live AR Try-On
                  </button>

                  <button
                    onClick={() => onConfigureLenses(frame)}
                    className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Configure Lenses
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
